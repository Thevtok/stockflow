package handler

import (
	"net/http"
	"time"

	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	db *gorm.DB
}

func NewReportHandler(db *gorm.DB) *ReportHandler {
	return &ReportHandler{db: db}
}

type DailySalesReport struct {
	Date          string            `json:"date"`
	TotalRevenue  int64             `json:"total_revenue"`
	TotalOrders   int64             `json:"total_orders"`
	TotalUnits    int64             `json:"total_units"`
	TopProducts   []TopProductSales `json:"top_products"`
}

type TopProductSales struct {
	SKU       string `json:"sku"`
	TotalQty  int64  `json:"total_qty"`
	Revenue   int64  `json:"revenue"`
}

// GetDailySalesReport godoc
// GET /api/reports/daily-sales?date=YYYY-MM-DD
func (h *ReportHandler) GetDailySalesReport(c *gin.Context) {
	dateStr := c.DefaultQuery("date", time.Now().Format("2006-01-02"))

	targetDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "invalid date format, must be YYYY-MM-DD",
			},
		})
		return
	}

	startOfDay := targetDate
	endOfDay := targetDate.Add(24 * time.Hour)

	report := DailySalesReport{
		Date:        dateStr,
		TopProducts: []TopProductSales{},
	}

	// 1. Total revenue and orders
	type orderStat struct {
		OrderCount int64
		Revenue    int64
	}
	var stat orderStat
	h.db.Table("sales_orders").
		Select("COUNT(id) as order_count, COALESCE(SUM(total), 0) as revenue").
		Where("created_at >= ? AND created_at < ? AND status = 'CREATED'", startOfDay, endOfDay).
		Scan(&stat)

	report.TotalOrders = stat.OrderCount
	report.TotalRevenue = stat.Revenue

	// 2. Total units sold and top products
	type itemStat struct {
		SKU      string
		TotalQty int64
		Revenue  int64
	}
	var itemStats []itemStat
	h.db.Table("sales_order_items").
		Joins("JOIN sales_orders ON sales_orders.id = sales_order_items.order_id").
		Select("sales_order_items.sku, SUM(sales_order_items.qty) as total_qty, SUM(sales_order_items.qty * sales_order_items.unit_price) as revenue").
		Where("sales_orders.created_at >= ? AND sales_orders.created_at < ? AND sales_orders.status = 'CREATED'", startOfDay, endOfDay).
		Group("sales_order_items.sku").
		Order("total_qty DESC").
		Limit(5).
		Scan(&itemStats)

	var totalUnits int64 = 0
	for _, it := range itemStats {
		totalUnits += it.TotalQty
		report.TopProducts = append(report.TopProducts, TopProductSales{
			SKU:      it.SKU,
			TotalQty: it.TotalQty,
			Revenue:  it.Revenue,
		})
	}
	report.TotalUnits = totalUnits

	c.JSON(http.StatusOK, report)
}
