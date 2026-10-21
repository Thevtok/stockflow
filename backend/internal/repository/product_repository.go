package repository

import (
	"errors"
	"strings"
	"time"

	"stockflow/backend/internal/domain"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ProductRepository interface {
	FindAll(filter domain.ProductFilter) ([]domain.Product, int64, error)
	FindByID(id uint) (*domain.Product, error)
	FindBySKU(sku string) (*domain.Product, error)
	Create(product *domain.Product) error
	Update(product *domain.Product) error
	Delete(id uint) error
	AdjustStock(productID uint, req domain.AdjustStockRequest) (*domain.Product, *domain.StockMovement, error)
	FindMovements(productID uint) ([]domain.StockMovement, error)
	GetDashboardSummary() (*domain.DashboardSummary, error)
}

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

type productWithMovementRow struct {
	domain.Product
	LastMovementAt *time.Time `json:"last_movement_at"`
}

func (r *productRepository) FindAll(filter domain.ProductFilter) ([]domain.Product, int64, error) {
	var total int64

	// Build query
	query := r.db.Model(&domain.Product{})

	// Search matching SKU or Name case-insensitively
	if search := strings.TrimSpace(filter.Search); search != "" {
		pattern := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(sku) LIKE ? OR LOWER(name) LIKE ?", pattern, pattern)
	}

	// Filter by status
	switch strings.ToLower(filter.Status) {
	case "active":
		query = query.Where("is_active = ?", true)
	case "inactive":
		query = query.Where("is_active = ?", false)
	case "low_stock":
		query = query.Where("stock <= ? AND is_active = ?", 10, true)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Pagination defaults
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	// Execute with subquery to fetch last_movement_at
	var rows []productWithMovementRow
	err := r.db.Table("products").
		Select("products.*, (SELECT MAX(created_at) FROM stock_movements sm WHERE sm.product_id = products.id) as last_movement_at").
		Where(query).
		Order("products.id ASC").
		Limit(limit).
		Offset(offset).
		Scan(&rows).Error

	if err != nil {
		return nil, 0, err
	}

	products := make([]domain.Product, len(rows))
	for i, r := range rows {
		p := r.Product
		p.LastMovementAt = r.LastMovementAt
		products[i] = p
	}

	return products, total, nil
}

func (r *productRepository) FindByID(id uint) (*domain.Product, error) {
	var row productWithMovementRow
	err := r.db.Table("products").
		Select("products.*, (SELECT MAX(created_at) FROM stock_movements sm WHERE sm.product_id = products.id) as last_movement_at").
		Where("products.id = ?", id).
		Scan(&row).Error

	if err != nil {
		return nil, err
	}
	if row.ID == 0 {
		return nil, domain.ErrProductNotFound
	}

	p := row.Product
	p.LastMovementAt = row.LastMovementAt
	return &p, nil
}

func (r *productRepository) FindBySKU(sku string) (*domain.Product, error) {
	var product domain.Product
	err := r.db.Where("sku = ?", sku).First(&product).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrProductNotFound
		}
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) Create(product *domain.Product) error {
	return r.db.Create(product).Error
}

func (r *productRepository) Update(product *domain.Product) error {
	return r.db.Save(product).Error
}

func (r *productRepository) Delete(id uint) error {
	// Check if product has any movements in stock_movements table
	var movementCount int64
	if err := r.db.Model(&domain.StockMovement{}).Where("product_id = ?", id).Count(&movementCount).Error; err != nil {
		return err
	}

	if movementCount > 0 {
		return domain.NewProductHasHistoryError()
	}

	res := r.db.Delete(&domain.Product{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return domain.ErrProductNotFound
	}
	return nil
}

func (r *productRepository) AdjustStock(productID uint, req domain.AdjustStockRequest) (*domain.Product, *domain.StockMovement, error) {
	var updatedProduct domain.Product
	var movement domain.StockMovement

	err := r.db.Transaction(func(tx *gorm.DB) error {
		var product domain.Product
		// Concurrency protection: lock row with UPDATE strength
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&product, productID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return domain.ErrProductNotFound
			}
			return err
		}

		if req.Type == "out" && product.Stock < req.Qty {
			return domain.NewProductStockInsufficientError(product.Stock)
		}

		// Update stock
		if req.Type == "in" {
			if err := tx.Model(&product).Update("stock", gorm.Expr("stock + ?", req.Qty)).Error; err != nil {
				return err
			}
		} else {
			if err := tx.Model(&product).Update("stock", gorm.Expr("stock - ?", req.Qty)).Error; err != nil {
				return err
			}
		}

		// Create ledger movement
		movement = domain.StockMovement{
			ProductID: product.ID,
			Type:      req.Type,
			Qty:       req.Qty,
			Note:      req.Note,
			CreatedAt: time.Now(),
		}
		if err := tx.Create(&movement).Error; err != nil {
			return err
		}

		// Reload updated product
		if err := tx.First(&updatedProduct, productID).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, nil, err
	}

	return &updatedProduct, &movement, nil
}

func (r *productRepository) FindMovements(productID uint) ([]domain.StockMovement, error) {
	var movements []domain.StockMovement
	err := r.db.Where("product_id = ?", productID).
		Order("created_at DESC").
		Find(&movements).Error
	if err != nil {
		return nil, err
	}
	return movements, nil
}

func (r *productRepository) GetDashboardSummary() (*domain.DashboardSummary, error) {
	var summary domain.DashboardSummary

	// Total products
	r.db.Model(&domain.Product{}).Count(&summary.TotalProducts)

	// Active products
	r.db.Model(&domain.Product{}).Where("is_active = ?", true).Count(&summary.ActiveProducts)

	// Total stock value: SUM(price * stock)
	type sumResult struct {
		TotalValue int64
	}
	var res sumResult
	r.db.Model(&domain.Product{}).
		Select("COALESCE(SUM(price * stock), 0) as total_value").
		Scan(&res)
	summary.TotalStockVal = res.TotalValue

	// Low stock count (stock <= 10 and is_active = true)
	r.db.Model(&domain.Product{}).
		Where("stock <= ? AND is_active = ?", 10, true).
		Count(&summary.LowStockCount)

	return &summary, nil
}
