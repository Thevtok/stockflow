package domain_test

import (
	"testing"

	"stockflow/backend/internal/domain"
)

func TestAppErrorFormats(t *testing.T) {
	t.Run("Insufficient Stock for SKU", func(t *testing.T) {
		err := domain.NewInsufficientStockError("QZ-CALA-001", 5)
		if err.HTTPStatus != 409 {
			t.Errorf("expected 409, got %d", err.HTTPStatus)
		}
		if err.Code != "INSUFFICIENT_STOCK" {
			t.Errorf("expected code INSUFFICIENT_STOCK, got %s", err.Code)
		}
		if err.SKU != "QZ-CALA-001" {
			t.Errorf("expected SKU QZ-CALA-001, got %s", err.SKU)
		}
		if err.Available == nil || *err.Available != 5 {
			t.Errorf("expected available 5, got %v", err.Available)
		}
	})

	t.Run("Product Has History Error", func(t *testing.T) {
		err := domain.NewProductHasHistoryError()
		if err.HTTPStatus != 409 {
			t.Errorf("expected 409, got %d", err.HTTPStatus)
		}
		if err.Code != "PRODUCT_HAS_HISTORY" {
			t.Errorf("expected code PRODUCT_HAS_HISTORY, got %s", err.Code)
		}
	})

	t.Run("Validation Error", func(t *testing.T) {
		err := domain.NewValidationError("customer name is required")
		if err.HTTPStatus != 400 {
			t.Errorf("expected 400, got %d", err.HTTPStatus)
		}
		if err.Code != "VALIDATION_ERROR" {
			t.Errorf("expected code VALIDATION_ERROR, got %s", err.Code)
		}
	})
}
