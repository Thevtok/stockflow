package database

import (
	"log"
	"time"

	"stockflow/backend/internal/config"
	"stockflow/backend/internal/domain"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func InitDB(cfg *config.Config) (*gorm.DB, error) {
	logLevel := logger.Warn
	if cfg.Environment == "development" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(cfg.GetDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// Production-ready connection pooling for high concurrency
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(50)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// GORM AutoMigrate schema
	if err := db.AutoMigrate(
		&domain.Product{},
		&domain.StockMovement{},
		&domain.SalesOrder{},
		&domain.SalesOrderItem{},
	); err != nil {
		log.Printf("[DB WARN] AutoMigrate warning: %v", err)
	}

	return db, nil
}
