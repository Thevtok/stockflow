package domain

import (
	"time"
)

// StockMovement represents an immutable ledger row for any stock modification
type StockMovement struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ProductID uint      `gorm:"not null;index" json:"product_id"`
	Type      string    `gorm:"type:text;not null;check:type IN ('in', 'out')" json:"type"` // "in" | "out"
	Qty       int       `gorm:"type:integer;not null;check:qty > 0" json:"qty"`
	Note      string    `gorm:"type:text" json:"note"`
	CreatedAt time.Time `gorm:"type:timestamptz;not null;default:now();index" json:"created_at"`

	// Optional Product relationship preload
	Product *Product `gorm:"foreignKey:ProductID;constraint:OnDelete:RESTRICT" json:"product,omitempty"`
}
