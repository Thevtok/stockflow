package domain

import (
	"errors"
	"fmt"
)

var (
	ErrProductNotFound       = errors.New("product not found")
	ErrProductHasHistory     = errors.New("product has movement history and cannot be deleted")
	ErrOrderNotFound         = errors.New("order not found")
	ErrOrderAlreadyCancelled = errors.New("order is already cancelled")
	ErrDuplicateSKUInOrder   = errors.New("duplicate SKU in order items")
	ErrEmptyOrderItems       = errors.New("order must contain at least one item")
	ErrInvalidQuantity       = errors.New("quantity must be greater than zero")
	ErrCustomerRequired      = errors.New("customer name is required")
	ErrSKURequired           = errors.New("sku is required")
	ErrNameRequired          = errors.New("product name is required")
	ErrPriceInvalid          = errors.New("price must be an integer greater than or equal to 0")
)

// AppError represents structured error responses
type AppError struct {
	HTTPStatus int
	Code       string
	Message    string
	SKU        string
	Available  *int
}

func (e *AppError) Error() string {
	if e.SKU != "" && e.Available != nil {
		return fmt.Sprintf("%s: insufficient stock for sku %s (available: %d)", e.Code, e.SKU, *e.Available)
	}
	if e.Available != nil {
		return fmt.Sprintf("%s: insufficient stock (available: %d)", e.Code, *e.Available)
	}
	return e.Message
}

func NewInsufficientStockError(sku string, available int) *AppError {
	return &AppError{
		HTTPStatus: 409,
		Code:       "INSUFFICIENT_STOCK",
		SKU:        sku,
		Available:  &available,
		Message:    fmt.Sprintf("Insufficient stock for SKU %s. Available: %d", sku, available),
	}
}

func NewProductStockInsufficientError(available int) *AppError {
	return &AppError{
		HTTPStatus: 409,
		Code:       "INSUFFICIENT_STOCK",
		Available:  &available,
		Message:    fmt.Sprintf("Insufficient stock available: %d", available),
	}
}

func NewProductHasHistoryError() *AppError {
	return &AppError{
		HTTPStatus: 409,
		Code:       "PRODUCT_HAS_HISTORY",
		Message:    "Product has movement history and cannot be deleted",
	}
}

func NewValidationError(msg string) *AppError {
	return &AppError{
		HTTPStatus: 400,
		Code:       "VALIDATION_ERROR",
		Message:    msg,
	}
}

func NewNotFoundError(msg string) *AppError {
	return &AppError{
		HTTPStatus: 404,
		Code:       "NOT_FOUND",
		Message:    msg,
	}
}
