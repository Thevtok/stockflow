import {
  Product,
  StockMovement,
  SalesOrder,
  PaginatedProductsResponse,
  AdjustStockPayload,
  CreateOrderPayload,
  DashboardSummary,
  DailySalesReport,
  ApiErrorEnvelope,
  ApiErrorDetail,
} from '../types';

export class ApiError extends Error {
  public status: number;
  public code: string;
  public sku?: string;
  public available?: number;

  constructor(status: number, detail: ApiErrorDetail) {
    super(detail.message || detail.code || 'An unexpected API error occurred');
    this.name = 'ApiError';
    this.status = status;
    this.code = detail.code;
    this.sku = detail.sku;
    this.available = detail.available;
  }
}

const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: 'Failed to connect to StockFlow API server. Please check your connection.',
    });
  }

  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    // Parse error envelope
    if (data && typeof data === 'object' && 'error' in data) {
      const errorEnvelope = data as ApiErrorEnvelope;
      throw new ApiError(response.status, errorEnvelope.error);
    }

    throw new ApiError(response.status, {
      code: `HTTP_${response.status}`,
      message: typeof data === 'string' ? data : response.statusText,
    });
  }

  return data as T;
}

export const api = {
  // Products
  async getProducts(params?: {
    search?: string;
    filter?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedProductsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.filter && params.filter !== 'all') searchParams.set('filter', params.filter);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const qs = searchParams.toString();
    return request<PaginatedProductsResponse>(`/products${qs ? `?${qs}` : ''}`);
  },

  async createProduct(payload: {
    sku: string;
    name: string;
    price: number;
    stock?: number;
    is_active?: boolean;
  }): Promise<Product> {
    return request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProduct(
    id: number,
    payload: { name?: string; price?: number; is_active?: boolean }
  ): Promise<Product> {
    return request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteProduct(id: number): Promise<void> {
    await request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  async adjustStock(
    id: number,
    payload: AdjustStockPayload
  ): Promise<{ product: Product; movement: StockMovement }> {
    return request<{ product: Product; movement: StockMovement }>(`/products/${id}/stock`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getProductMovements(id: number): Promise<{ data: StockMovement[] }> {
    return request<{ data: StockMovement[] }>(`/products/${id}/movements`);
  },

  // Orders
  async getOrders(): Promise<{ data: SalesOrder[] }> {
    return request<{ data: SalesOrder[] }>('/orders');
  },

  async createOrder(payload: CreateOrderPayload, idempotencyKey?: string): Promise<SalesOrder> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return request<SalesOrder>('/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  },

  async getOrder(id: number): Promise<SalesOrder> {
    return request<SalesOrder>(`/orders/${id}`);
  },

  async cancelOrder(id: number): Promise<SalesOrder> {
    return request<SalesOrder>(`/orders/${id}/cancel`, {
      method: 'POST',
    });
  },

  // Summary & Reports
  async getDashboardSummary(): Promise<DashboardSummary> {
    return request<DashboardSummary>('/dashboard/summary');
  },

  async getDailySalesReport(date?: string): Promise<DailySalesReport> {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return request<DailySalesReport>(`/reports/daily-sales${qs}`);
  },
};
