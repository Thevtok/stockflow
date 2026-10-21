package domain

import (
	"time"
)

// Product represents the product catalog entity in GORM
type Product struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	SKU       string    `gorm:"type:text;not null;uniqueIndex" json:"sku"`
	Name      string    `gorm:"type:text;not null;index" json:"name"`
	Price     int       `gorm:"type:integer;not null;check:price >= 0" json:"price"` // IDR integer money
	Stock     int       `gorm:"type:integer;not null;default:0;check:stock >= 0" json:"stock"`
	IsActive  bool      `gorm:"type:boolean;not null;default:true;index" json:"is_active"`
	CreatedAt time.Time `gorm:"type:timestamptz;not null;default:now()" json:"created_at"`

	// Derived field from stock_movements (calculated on query)
	LastMovementAt *time.Time `gorm:"-" json:"last_movement_at"`
}

// ProductFilter parameters for searching and filtering
type ProductFilter struct {
	Search string // sku or name case-insensitive
	Status string // "all", "active", "inactive", "low_stock"
	Page   int
	Limit  int
}

// CreateProductRequest DTO
type CreateProductRequest struct {
	SKU      string `json:"sku" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Price    *int   `json:"price" binding:"required"`
	Stock    *int   `json:"stock"`
	IsActive *bool  `json:"is_active"`
}

// UpdateProductRequest DTO
type UpdateProductRequest struct {
	Name     *string `json:"name"`
	Price    *int    `json:"price"`
	IsActive *bool   `json:"is_active"`
}

// AdjustStockRequest DTO
type AdjustStockRequest struct {
	Type string `json:"type" binding:"required,oneof=in out"`
	Qty  int    `json:"qty" binding:"required,gt=0"`
	Note string `json:"note"`
}
