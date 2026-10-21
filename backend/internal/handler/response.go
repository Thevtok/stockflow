package handler

import (
	"errors"
	"net/http"

	"stockflow/backend/internal/domain"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Code      string `json:"code"`
	Message   string `json:"message,omitempty"`
	SKU       string `json:"sku,omitempty"`
	Available *int   `json:"available,omitempty"`
}

type ErrorEnvelope struct {
	Error ErrorResponse `json:"error"`
}

func RespondSuccess(c *gin.Context, status int, data any) {
	c.JSON(status, data)
}

func RespondError(c *gin.Context, err error) {
	var appErr *domain.AppError
	if errors.As(err, &appErr) {
		res := ErrorResponse{
			Code:      appErr.Code,
			Message:   appErr.Message,
			SKU:       appErr.SKU,
			Available: appErr.Available,
		}
		c.JSON(appErr.HTTPStatus, ErrorEnvelope{Error: res})
		return
	}

	if errors.Is(err, domain.ErrProductNotFound) || errors.Is(err, domain.ErrOrderNotFound) {
		c.JSON(http.StatusNotFound, ErrorEnvelope{
			Error: ErrorResponse{
				Code:    "NOT_FOUND",
				Message: err.Error(),
			},
		})
		return
	}

	if errors.Is(err, domain.ErrProductHasHistory) {
		c.JSON(http.StatusConflict, ErrorEnvelope{
			Error: ErrorResponse{
				Code: "PRODUCT_HAS_HISTORY",
			},
		})
		return
	}

	if errors.Is(err, domain.ErrOrderAlreadyCancelled) {
		c.JSON(http.StatusConflict, ErrorEnvelope{
			Error: ErrorResponse{
				Code:    "ORDER_ALREADY_CANCELLED",
				Message: "Order is already cancelled",
			},
		})
		return
	}

	// Default internal server error
	c.JSON(http.StatusInternalServerError, ErrorEnvelope{
		Error: ErrorResponse{
			Code:    "INTERNAL_SERVER_ERROR",
			Message: err.Error(),
		},
	})
}
