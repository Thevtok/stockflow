import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ExecutiveCommandSummary } from './components/ExecutiveCommandSummary';
import { ProductsTable } from './components/ProductsTable';
import { OrdersTable } from './components/OrdersTable';
import { AdjustStockModal } from './components/AdjustStockModal';
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { MovementsModal } from './components/MovementsModal';
import { CreateProductModal } from './components/CreateProductModal';
import { DailyReportModal } from './components/DailyReportModal';
import { useDebounce } from './hooks/useDebounce';
import { Product, DashboardSummary, SalesOrder, ProductFilterType } from './types';
import { api, ApiError } from './api/client';
import { AlertCircle, CheckCircle2, Package, ShoppingBag } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);

  // Search & Filter State
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce<string>(search, 300);
  const [filter, setFilter] = useState<ProductFilterType>('all');
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Summary State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  // Modals & Interaction State
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [showCreateOrder, setShowCreateOrder] = useState<boolean>(false);
  const [showCreateProduct, setShowCreateProduct] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Global Notification Banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Fetch Summary Cards
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Summary fetch error:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Fetch Products Catalog
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProducts({
        search: debouncedSearch,
        filter: filter,
        page,
        limit,
      });
      setProducts(res.data);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with StockFlow backend service.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter, page]);

  // Fetch All Orders
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await api.getOrders();
      setOrders(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch sales orders list:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter]);

  // Order Lookup Handler
  const handleLookupOrder = async (orderId: number) => {
    try {
      const ord = await api.getOrder(orderId);
      setSelectedOrder(ord);
    } catch (err: any) {
      showToast('error', `Order #${orderId} was not found in the database.`);
    }
  };

  // Soft Delete Product Handler
  const handleDeleteProduct = async (id: number) => {
    try {
      await api.deleteProduct(id);
      showToast('success', 'Product deactivated from active catalog.');
      fetchProducts();
      fetchSummary();
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'PRODUCT_HAS_HISTORY') {
        showToast(
          'error',
          'Cannot delete product: Stock movement audit ledger exists for this SKU.'
        );
      } else {
        showToast('error', err.message || 'Failed to delete product.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenCreateOrder={() => setShowCreateOrder(true)}
        onOpenCreateProduct={() => setShowCreateProduct(true)}
        onOpenReport={() => setShowReport(true)}
        onLookupOrder={handleLookupOrder}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Floating Toast Notification */}
        {notification && (
          <div
            className={`fixed top-5 right-5 z-[9999] max-w-sm w-full p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 transition-all ${
              notification.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-300 shadow-emerald-950/40'
                : 'bg-slate-900/95 border-rose-500/50 text-rose-300 shadow-rose-950/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  notification.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-bold text-white text-xs">
                  {notification.type === 'success' ? 'Action Successful' : 'Action Failed'}
                </p>
                <p className="text-slate-300 text-xs mt-0.5">{notification.message}</p>
              </div>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-base leading-none">
              &times;
            </button>
          </div>
        )}

        {/* Section 1: Executive Command Summary */}
        <ExecutiveCommandSummary
          summary={summary}
          products={products}
          onAdjustStock={(p) => setAdjustProduct(p)}
          loading={summaryLoading}
        />

        {/* Section 2: Tab Navigation (Catalog vs Orders) */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Inventory Catalog</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-slate-900 border border-slate-800 font-mono text-slate-300">
                {total}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('orders');
                fetchOrders();
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-sky-400" />
              <span>Sales Orders History</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-slate-900 border border-slate-800 font-mono text-emerald-400">
                {orders.length}
              </span>
            </button>
          </div>
        </div>

        {/* Section 3: Active View Component */}
        {activeTab === 'products' ? (
          <ProductsTable
            products={products}
            total={total}
            loading={loading}
            error={error}
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onRetry={fetchProducts}
            onAdjustStock={(p) => setAdjustProduct(p)}
            onViewHistory={(p) => setHistoryProduct(p)}
            onDeleteProduct={handleDeleteProduct}
            onCreateProduct={() => setShowCreateProduct(true)}
          />
        ) : (
          <OrdersTable
            orders={orders}
            loading={ordersLoading}
            onViewOrder={(order) => setSelectedOrder(order)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>StockFlow ERP - Built with Go, PostgreSQL, React, and TypeScript.</span>
          <span className="text-emerald-500/80">Concurrency Safe | Atomic Order Ledger</span>
        </div>
      </footer>

      {/* Modals */}
      {adjustProduct && (
        <AdjustStockModal
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onSuccess={() => {
            showToast('success', `Stock adjusted for SKU ${adjustProduct.sku}`);
            fetchProducts();
            fetchSummary();
            fetchOrders();
          }}
        />
      )}

      {showCreateOrder && (
        <CreateOrderModal
          products={products}
          onClose={() => setShowCreateOrder(false)}
          onOrderCreated={(order) => {
            showToast('success', `Order #${order.id} placed! Stock deducted atomically.`);
            fetchProducts();
            fetchSummary();
            fetchOrders();
          }}
          onViewOrder={(order) => {
            setShowCreateOrder(false);
            setSelectedOrder(order);
          }}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderCancelled={(cancelled) => {
            showToast('success', `Order #${cancelled.id} cancelled! Stock restored.`);
            fetchProducts();
            fetchSummary();
            fetchOrders();
          }}
        />
      )}

      {historyProduct && (
        <MovementsModal product={historyProduct} onClose={() => setHistoryProduct(null)} />
      )}

      {showCreateProduct && (
        <CreateProductModal
          onClose={() => setShowCreateProduct(false)}
          onProductCreated={(prod) => {
            showToast('success', `New SKU ${prod.sku} created!`);
            fetchProducts();
            fetchSummary();
          }}
        />
      )}

      {showReport && <DailyReportModal onClose={() => setShowReport(false)} />}
    </div>
  );
};