import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { ProductsTable } from './components/ProductsTable';
import { AdjustStockModal } from './components/AdjustStockModal';
import { CreateOrderModal } from './components/CreateOrderModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { MovementsModal } from './components/MovementsModal';
import { CreateProductModal } from './components/CreateProductModal';
import { DailyReportModal } from './components/DailyReportModal';
import { useDebounce } from './hooks/useDebounce';
import { Product, DashboardSummary, SalesOrder, ProductFilterType } from './types';
import { api, ApiError } from './api/client';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

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

  // Delete Product Handler (Verifies 409 PRODUCT_HAS_HISTORY)
  const handleDeleteProduct = async (product: Product) => {
    if (
      !window.confirm(
        `Are you sure you want to delete SKU '${product.sku}'? Products with stock movements history cannot be deleted.`
      )
    ) {
      return;
    }

    try {
      await api.deleteProduct(product.id);
      showToast('success', `Product '${product.sku}' was deleted.`);
      fetchProducts();
      fetchSummary();
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'PRODUCT_HAS_HISTORY') {
        showToast(
          'error',
          `Cannot delete '${product.sku}': Product has immutable movement history in warehouse ledger.`
        );
      } else {
        showToast('error', err.message || 'Failed to delete product.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenCreateOrder={() => setShowCreateOrder(true)}
        onOpenCreateProduct={() => setShowCreateProduct(true)}
        onOpenReport={() => setShowReport(true)}
        onLookupOrder={handleLookupOrder}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast Alert Banner */}
        {notification && (
          <div
            className={`mb-5 p-4 rounded-xl border text-xs flex items-center justify-between shadow-lg transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white ml-3"
            >
              Ã—
            </button>
          </div>
        )}

        {/* Section 1: Dashboard Summary Cards */}
        <SummaryCards summary={summary} loading={summaryLoading} />

        {/* Section 2: Products Catalog Table */}
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
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>StockFlow ERP â€” Built with Go, PostgreSQL, React, and TypeScript.</span>
          <span className="text-emerald-500/80">Concurrency Safe â€¢ Atomic Order Ledger</span>
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
