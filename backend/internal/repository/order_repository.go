package repository

import (
	"errors"
	"fmt"
	"sort"
	"time"

	"stockflow/backend/internal/domain"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type OrderRepository interface {
	CreateOrder(req domain.CreateOrderRequest, idempotencyKey *string) (*domain.SalesOrder, error)
	FindByID(id uint) (*domain.SalesOrder, error)
	CancelOrder(id uint) (*domain.SalesOrder, error)
}

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) CreateOrder(req domain.CreateOrderRequest, idempotencyKey *string) (*domain.SalesOrder, error) {
	// 1. Validation before touching the database
	if len(req.Items) == 0 {
		return nil, domain.NewValidationError("order must contain at least one item")
	}

	// Check duplicate SKUs and invalid quantity
	seenSKU := make(map[string]bool)
	for _, item := range req.Items {
		if item.Qty <= 0 {
			return nil, domain.NewValidationError(fmt.Sprintf("quantity for SKU '%s' must be greater than zero", item.SKU))
		}
		if seenSKU[item.SKU] {
			return nil, domain.NewValidationError(fmt.Sprintf("duplicate SKU '%s' in order items", item.SKU))
		}
		seenSKU[item.SKU] = true
	}

	// 2. Deterministic sorting by SKU to prevent database deadlocks under concurrency
	sortedItems := make([]domain.OrderItemInput, len(req.Items))
	copy(sortedItems, req.Items)
	sort.Slice(sortedItems, func(i, j int) bool {
		return sortedItems[i].SKU < sortedItems[j].SKU
	})

	var createdOrder domain.SalesOrder

	// 3. Atomic Transaction
	err := r.db.Transaction(func(tx *gorm.DB) error {
		// Bonus: Idempotency check
		if idempotencyKey != nil && *idempotencyKey != "" {
			var existing domain.SalesOrder
			if err := tx.Preload("Items").Where("idempotency_key = ?", *idempotencyKey).First(&existing).Error; err == nil {
				createdOrder = existing
				return nil
			}
		}

		var orderItems []domain.SalesOrderItem
		orderTotal := 0

		// Lock and validate each item in order
		for _, item := range sortedItems {
			var product domain.Product

			// Pessimistic Row Lock: SELECT ... FOR UPDATE
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("sku = ?", item.SKU).First(&product).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return domain.NewValidationError(fmt.Sprintf("unknown SKU: '%s'", item.SKU))
				}
				return err
			}

			// Concurrency & Stock Safety Guard
			if product.Stock < item.Qty {
				// Abort transaction completely with 409
				return domain.NewInsufficientStockError(item.SKU, product.Stock)
			}

			// Pricing calculation (client never supplies prices)
			unitPrice := product.Price
			orderTotal += unitPrice * item.Qty

			orderItems = append(orderItems, domain.SalesOrderItem{
				SKU:         item.SKU,
				Qty:         item.Qty,
				UnitPrice:   unitPrice,
				ProductName: product.Name,
			})

			// Stock decrement inside transaction using atomic expression
			if err := tx.Model(&product).Update("stock", gorm.Expr("stock - ?", item.Qty)).Error; err != nil {
				return err
			}

			// Ledger audit trail in stock_movements
			movement := domain.StockMovement{
				ProductID: product.ID,
				Type:      "out",
				Qty:       item.Qty,
				Note:      fmt.Sprintf("Sales order for %s", req.Customer),
				CreatedAt: time.Now(),
			}
			if err := tx.Create(&movement).Error; err != nil {
				return err
			}
		}

		// Insert Sales Order header and items
		createdOrder = domain.SalesOrder{
			Customer:       req.Customer,
			Status:         domain.OrderStatusCreated,
			Total:          orderTotal,
			IdempotencyKey: idempotencyKey,
			CreatedAt:      time.Now(),
			Items:          orderItems,
		}

		if err := tx.Create(&createdOrder).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &createdOrder, nil
}

func (r *orderRepository) FindByID(id uint) (*domain.SalesOrder, error) {
	var order domain.SalesOrder
	err := r.db.Preload("Items").First(&order, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrOrderNotFound
		}
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) CancelOrder(id uint) (*domain.SalesOrder, error) {
	var cancelledOrder domain.SalesOrder

	err := r.db.Transaction(func(tx *gorm.DB) error {
		var order domain.SalesOrder
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Preload("Items").First(&order, id).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return domain.ErrOrderNotFound
			}
			return err
		}

		if order.Status == domain.OrderStatusCancelled {
			return domain.ErrOrderAlreadyCancelled
		}

		// Update order status
		now := time.Now()
		order.Status = domain.OrderStatusCancelled
		order.CancelledAt = &now
		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		// Restore stock for all items
		// Sort by SKU to maintain lock hierarchy
		sortedItems := make([]domain.SalesOrderItem, len(order.Items))
		copy(sortedItems, order.Items)
		sort.Slice(sortedItems, func(i, j int) bool {
			return sortedItems[i].SKU < sortedItems[j].SKU
		})

		for _, item := range sortedItems {
			var product domain.Product
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("sku = ?", item.SKU).First(&product).Error; err != nil {
				return err
			}

			// Restore stock
			if err := tx.Model(&product).Update("stock", gorm.Expr("stock + ?", item.Qty)).Error; err != nil {
				return err
			}

			// Record restocking movement
			movement := domain.StockMovement{
				ProductID: product.ID,
				Type:      "in",
				Qty:       item.Qty,
				Note:      fmt.Sprintf("Restock: Cancelled Order #%d", order.ID),
				CreatedAt: now,
			}
			if err := tx.Create(&movement).Error; err != nil {
				return err
			}
		}

		cancelledOrder = order
		return nil
	})

	if err != nil {
		return nil, err
	}

	return &cancelledOrder, nil
}
