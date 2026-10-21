package domain

import (
	"time"
)

const (
	OrderStatusCreated   = "CREATED"
	OrderStatusCancelled = "CANCELLED"
)

// SalesOrder represents a sales order transaction
type SalesOrder struct {
	ID             uint             `gorm:"primaryKey;autoIncrement" json:"id"`
	Customer       string           `gorm:"type:text;not null" json:"customer"`
	Status         string           `gorm:"type:text;not null;default:'CREATED';check:status IN ('CREATED', 'CANCELLED');index" json:"status"`
	Total          int              `gorm:"type:integer;not null;check:total >= 0" json:"total"`
	IdempotencyKey *string          `gorm:"type:text;uniqueIndex" json:"idempotency_key,omitempty"`
	CreatedAt      time.Time        `gorm:"type:timestamptz;not null;default:now();index" json:"created_at"`
	CancelledAt    *time.Time       `gorm:"type:timestamptz" json:"cancelled_at,omitempty"`
	Items          []SalesOrderItem `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"items"`
}

// SalesOrderItem represents an individual line item inside an order
type SalesOrderItem struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID   uint   `gorm:"not null;index" json:"order_id"`
	SKU       string `gorm:"type:text;not null;index" json:"sku"`
	Qty       int    `gorm:"type:integer;not null;check:qty > 0" json:"qty"`
	UnitPrice int    `gorm:"type:integer;not null;check:unit_price >= 0" json:"unit_price"`

	// Optional Product info
	ProductName string `gorm:"-" json:"product_name,omitempty"`
}

// OrderItemInput for incoming order creation requests
type OrderItemInput struct {
	SKU string `json:"sku" binding:"required"`
	Qty int    `json:"qty" binding:"required,gt=0"`
}

// CreateOrderRequest DTO
type CreateOrderRequest struct {
	Customer string           `json:"customer" binding:"required"`
	Items    []OrderItemInput `json:"items" binding:"required,dive"`
}

// DashboardSummary DTO
type DashboardSummary struct {
	TotalProducts  int64 `json:"total_products"`
	ActiveProducts int64 `json:"active_products"`
	TotalStockVal  int64 `json:"total_stock_value"`
	LowStockCount  int64 `json:"low_stock_count"`
}
