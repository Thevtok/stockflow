export type MovementType = 'in' | 'out';
export type OrderStatus = 'CREATED' | 'CANCELLED';

export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  last_movement_at: string | null;
}

export interface StockMovement {
  id: number;
  product_id: number;
  type: MovementType;
  qty: number;
  note: string;
  created_at: string;
}

export interface SalesOrderItem {
  id: number;
  order_id: number;
  sku: string;
  qty: number;
  unit_price: number;
  product_name?: string;
}

export interface SalesOrder {
  id: number;
  customer: string;
  status: OrderStatus;
  total: number;
  idempotency_key?: string;
  created_at: string;
  cancelled_at?: string | null;
  items: SalesOrderItem[];
}

export interface PaginatedProductsResponse {
  data: Product[];
  page: number;
  limit: number;
  total: number;
}

export interface ApiErrorDetail {
  code: string;
  message?: string;
  sku?: string;
  available?: number;
}

export interface ApiErrorEnvelope {
  error: ApiErrorDetail;
}

export interface AdjustStockPayload {
  type: MovementType;
  qty: number;
  note: string;
}

export interface OrderItemInput {
  sku: string;
  qty: number;
}

export interface CreateOrderPayload {
  customer: string;
  items: OrderItemInput[];
}

export interface DashboardSummary {
  total_products: number;
  active_products: number;
  total_stock_value: number;
  low_stock_count: number;
}

export interface TopProductMetric {
  sku: string;
  total_qty: number;
  revenue: number;
}

export interface DailySalesReport {
  date: string;
  total_revenue: number;
  total_orders: number;
  total_units: number;
  top_products: TopProductMetric[];
}

export type ProductFilterType = 'all' | 'active' | 'inactive' | 'low_stock';