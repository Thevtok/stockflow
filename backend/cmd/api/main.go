package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"stockflow/backend/internal/config"
	"stockflow/backend/internal/database"
	"stockflow/backend/internal/handler"
	"stockflow/backend/internal/middleware"
	"stockflow/backend/internal/repository"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	log.Printf("[INIT] Starting StockFlow Backend API on port %s...", cfg.Port)

	// Initialize database with GORM and PostgreSQL
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("[FATAL] Failed to connect to database: %v", err)
	}
	log.Println("[INIT] Database connected and GORM schema synced successfully.")

	// Repositories
	productRepo := repository.NewProductRepository(db)
	orderRepo := repository.NewOrderRepository(db)

	// Handlers
	productHandler := handler.NewProductHandler(productRepo)
	orderHandler := handler.NewOrderHandler(orderRepo)
	reportHandler := handler.NewReportHandler(db)

	// Router setup
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Format(time.RFC3339),
			"version":   "1.0.0",
		})
	})

	// API Routes Group
	api := r.Group("/api")
	{
		// Products
		api.GET("/products", productHandler.GetProducts)
		api.POST("/products", productHandler.CreateProduct)
		api.PUT("/products/:id", productHandler.UpdateProduct)
		api.DELETE("/products/:id", productHandler.DeleteProduct)
		api.POST("/products/:id/stock", productHandler.AdjustStock)
		api.GET("/products/:id/movements", productHandler.GetProductMovements)

		// Orders
		api.POST("/orders", orderHandler.CreateOrder)
		api.GET("/orders/:id", orderHandler.GetOrder)
		api.POST("/orders/:id/cancel", orderHandler.CancelOrder)

		// Summary & Reports
		api.GET("/dashboard/summary", productHandler.GetDashboardSummary)
		api.GET("/reports/daily-sales", reportHandler.GetDailySalesReport)
	}

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown setup
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[FATAL] Listen error: %s\n", err)
		}
	}()
	log.Printf("[READY] Server running on http://localhost:%s", cfg.Port)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("[SHUTDOWN] Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("[FATAL] Server forced to shutdown: %v", err)
	}

	log.Println("[SHUTDOWN] Server exited cleanly.")
}
