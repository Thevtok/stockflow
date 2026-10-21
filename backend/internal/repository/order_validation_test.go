package repository_test

import (
	"errors"
	"testing"

	"stockflow/backend/internal/domain"
	"stockflow/backend/internal/repository"
)

// TestOrderValidationRules verifies all input guards prior to DB transactions
func TestOrderValidationRules(t *testing.T) {
	repo := repository.NewOrderRepository(nil)

	t.Run("Empty order items returns 400 validation error", func(t *testing.T) {
		req := domain.CreateOrderRequest{
			Customer: "Acme Corp",
			Items:    []domain.OrderItemInput{},
		}
		_, err := repo.CreateOrder(req, nil)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		var appErr *domain.AppError
		if !errors.As(err, &appErr) || appErr.HTTPStatus != 400 {
			t.Errorf("expected 400 validation error, got: %v", err)
		}
	})

	t.Run("Duplicate SKU in order returns 400 validation error", func(t *testing.T) {
		req := domain.CreateOrderRequest{
			Customer: "Acme Corp",
			Items: []domain.OrderItemInput{
				{SKU: "QZ-CALA-001", Qty: 2},
				{SKU: "QZ-CALA-001", Qty: 3}, // duplicate SKU
			},
		}
		_, err := repo.CreateOrder(req, nil)
		if err == nil {
			t.Fatal("expected error for duplicate SKU, got nil")
		}
		var appErr *domain.AppError
		if !errors.As(err, &appErr) || appErr.HTTPStatus != 400 {
			t.Errorf("expected 400 validation error, got: %v", err)
		}
	})

	t.Run("Zero or negative quantity returns 400 validation error", func(t *testing.T) {
		req := domain.CreateOrderRequest{
			Customer: "Acme Corp",
			Items: []domain.OrderItemInput{
				{SKU: "QZ-CALA-001", Qty: 0},
			},
		}
		_, err := repo.CreateOrder(req, nil)
		if err == nil {
			t.Fatal("expected error for zero qty, got nil")
		}
		var appErr *domain.AppError
		if !errors.As(err, &appErr) || appErr.HTTPStatus != 400 {
			t.Errorf("expected 400 validation error, got: %v", err)
		}
	})
}
