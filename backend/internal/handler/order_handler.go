package handler

import (
	"net/http"
	"strconv"
	"strings"

	"stockflow/backend/internal/domain"
	"stockflow/backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	repo repository.OrderRepository
}

func NewOrderHandler(repo repository.OrderRepository) *OrderHandler {
	return &OrderHandler{repo: repo}
}

// CreateOrder godoc
// POST /api/orders
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var req domain.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, domain.NewValidationError("invalid request body: "+err.Error()))
		return
	}

	req.Customer = strings.TrimSpace(req.Customer)
	if req.Customer == "" {
		RespondError(c, domain.NewValidationError("customer name is required"))
		return
	}

	if len(req.Items) == 0 {
		RespondError(c, domain.NewValidationError("order must contain at least one item"))
		return
	}

	// Read optional Idempotency-Key header (Bonus feature)
	var idempotencyKey *string
	if key := strings.TrimSpace(c.GetHeader("Idempotency-Key")); key != "" {
		idempotencyKey = &key
	}

	order, err := h.repo.CreateOrder(req, idempotencyKey)
	if err != nil {
		RespondError(c, err)
		return
	}

	c.JSON(http.StatusCreated, order)
}

// GetOrder godoc
// GET /api/orders/:id
func (h *OrderHandler) GetOrder(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		RespondError(c, domain.NewValidationError("invalid order id"))
		return
	}

	order, err := h.repo.FindByID(uint(id))
	if err != nil {
		RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, order)
}

// CancelOrder godoc
// POST /api/orders/:id/cancel
func (h *OrderHandler) CancelOrder(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		RespondError(c, domain.NewValidationError("invalid order id"))
		return
	}

	cancelledOrder, err := h.repo.CancelOrder(uint(id))
	if err != nil {
		RespondError(c, err)
		return
	}

	c.JSON(http.StatusOK, cancelledOrder)
}
