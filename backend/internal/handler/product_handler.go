package handler

import (
	"net/http"
	"strconv"
	"strings"

	"stockflow/backend/internal/domain"
	"stockflow/backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	repo repository.ProductRepository
}

func NewProductHandler(repo repository.ProductRepository) *ProductHandler {
	return &ProductHandler{repo: repo}
}

// GetProducts godoc
// GET /api/products?search=&page=&limit=&filter=
func (h *ProductHandler) GetProducts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	status := c.DefaultQuery("filter", c.Query("status"))

	filter := domain.ProductFilter{
		Search: search,
		Status: status,
		Page:   page,
		Limit:  limit,
	}

	products, total, err := h.repo.FindAll(filter)
	if err != nil {
		RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  products,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

// CreateProduct godoc
// POST /api/products
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req domain.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, domain.NewValidationError("invalid request body: "+err.Error()))
		return
	}

	sku := strings.TrimSpace(req.SKU)
	name := strings.TrimSpace(req.Name)

	if sku == "" {
		RespondError(c, domain.NewValidationError("sku is required"))
		return
	}
	if name == "" {
		RespondError(c, domain.NewValidationError("name is required"))
		return
	}
	if req.Price == nil || *req.Price < 0 {
		RespondError(c, domain.NewValidationError("price is required and must be an integer >= 0"))
		return
	}

	// Check if SKU already exists
	if _, err := h.repo.FindBySKU(sku); err == nil {
		RespondError(c, domain.NewValidationError("sku must be unique: '"+sku+"' already exists"))
		return
	}

	stock := 0
	if req.Stock != nil {
		if *req.Stock < 0 {
			RespondError(c, domain.NewValidationError("initial stock cannot be negative"))
			return
		}
		stock = *req.Stock
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	product := domain.Product{
		SKU:      sku,
		Name:     name,
		Price:    *req.Price,
		Stock:    stock,
		IsActive: isActive,
	}

	if err := h.repo.Create(&product); err != nil {
		RespondError(c, err)
		return
	}

	c.JSON(http.StatusCreated, product)
}

// UpdateProduct godoc
// PUT /api/products/:id
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		RespondError(c, domain.NewValidationError("invalid product id"))
		return
	}

	product, err := h.repo.FindByID(uint(id))
	if err != nil {
		RespondError(c, err)
		return
	}

	var req domain.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, domain.NewValidationError("invalid request payload"))
		return
	}

	if req.Name != nil && strings.TrimSpace(*req.Name) != "" {
		product.Name = strings.TrimSpace(*req.Name)
	}
	if req.Price != nil {
		if *req.Price < 0 {
			RespondError(c, domain.NewValidationError("price must be >= 0"))
			return
		}
		product.Price = *req.Price
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}

	if err := h.repo.Update(product); err != nil {
		RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, product)
}

// DeleteProduct godoc
// DELETE /api/products/:id
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		RespondError(c, domain.NewValidationError("invalid product id"))
		return
	}

	if err := h.repo.Delete(uint(id)); err != nil {
		RespondError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

// AdjustStock godoc
// POST /api/products/:id/stock
func (h *ProductHandler) AdjustStock(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		RespondError(c, domain.NewValidationError("invalid product id"))
		return
	}

	var req domain.AdjustStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, domain.NewValidationError("invalid request body: "+err.Error()))
		return
	}

	if req.Type != "in" && req.Type != "out" {
		RespondError(c, domain.NewValidationError("type must be 'in' or 'out'"))
		return
	}
	if req.Qty <= 0 {
		RespondError(c, domain.NewValidationError("quantity must be greater than zero"))
		return
	}

	updatedProduct, movement, err := h.repo.AdjustStock(uint(id), req)
	if err != nil {
		RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"product":  updatedProduct,
		"movement": movement,
	})
}

// GetProductMovements godoc
// GET /api/products/:id/movements
func (h *ProductHandler) GetProductMovements(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		RespondError(c, domain.NewValidationError("invalid product id"))
		return
	}

	// Verify product exists
	if _, err := h.repo.FindByID(uint(id)); err != nil {
		RespondError(c, err)
		return
	}

	movements, err := h.repo.FindMovements(uint(id))
	if err != nil {
		RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": movements,
	})
}

// GetDashboardSummary godoc
// GET /api/dashboard/summary
func (h *ProductHandler) GetDashboardSummary(c *gin.Context) {
	summary, err := h.repo.GetDashboardSummary()
	if err != nil {
		RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, summary)
}
