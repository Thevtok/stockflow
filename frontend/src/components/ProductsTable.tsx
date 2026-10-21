import React from 'react';
import { Search, RefreshCw, AlertCircle, PackageOpen, History, Trash2, SlidersHorizontal } from 'lucide-react';
import { Product, ProductFilterType } from '../types';
import { formatCurrency, formatRelativeTime } from '../utils/format';

interface ProductsTableProps {
  products: Product[];
  total: number;
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (val: string) => void;
  filter: ProductFilterType;
  onFilterChange: (val: ProductFilterType) => void;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onRetry: () => void;
  onAdjustStock: (product: Product) => void;
  onViewHistory: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onCreateProduct: () => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  total,
  loading,
  error,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  page,
  limit,
  onPageChange,
  onRetry,
  onAdjustStock,
  onViewHistory,
  onDeleteProduct,
  onCreateProduct,
}) => {
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-900/80 backdrop-blur">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU or Product Name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="inline-flex rounded-lg p-1 bg-slate-950 border border-slate-800">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'inactive', label: 'Inactive' },
                { id: 'low_stock', label: 'Low Stock (<= 10)' },
              ] as { id: ProductFilterType; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === tab.id
                    ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh / Retry Button */}
          <button
            onClick={onRetry}
            disabled={loading}
            title="Refresh Catalog"
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* New Product Button */}
          <button
            onClick={onCreateProduct}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <span>+ Add SKU</span>
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800 font-mono tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3.5 font-semibold">
                SKU
              </th>
              <th scope="col" className="px-5 py-3.5 font-semibold">
                Product Name
              </th>
              <th scope="col" className="px-5 py-3.5 font-semibold text-right">
                Unit Price (IDR)
              </th>
              <th scope="col" className="px-5 py-3.5 font-semibold text-center">
                Stock
              </th>
              <th scope="col" className="px-5 py-3.5 font-semibold">
                Status
              </th>
              <th scope="col" className="px-5 py-3.5 font-semibold">
                Last Movement
              </th>
              <th scope="col" className="px-5 py-3.5 font-semibold text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-sans">
            {/* 1. Loading State (Skeleton Rows) */}
            {loading && (
              <>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse bg-slate-900/50">
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 bg-slate-800 rounded"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-48 bg-slate-800 rounded"></div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-4 w-20 bg-slate-800 rounded ml-auto"></div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="h-6 w-12 bg-slate-800 rounded-full mx-auto"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-5 w-16 bg-slate-800 rounded-full"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-16 bg-slate-800 rounded"></div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-7 w-20 bg-slate-800 rounded ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* 2. Error State */}
            {!loading && error && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 mb-3">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-semibold text-white mb-1">
                      Failed to Load Product Inventory
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">{error}</p>
                    <button
                      onClick={onRetry}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Request</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* 3. Empty State */}
            {!loading && !error && products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-full text-slate-400 mb-3">
                      <PackageOpen className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-semibold text-white mb-1">No Products Found</h4>
                    <p className="text-xs text-slate-400 mb-4">
                      {search
                        ? `No product matches "${search}". Try adjusting your keywords or clearing the filter.`
                        : 'Your inventory catalog is currently empty. Get started by adding your first quartz slab.'}
                    </p>
                    {search ? (
                      <button
                        onClick={() => {
                          onSearchChange('');
                          onFilterChange('all');
                        }}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors"
                      >
                        Reset Search & Filters
                      </button>
                    ) : (
                      <button
                        onClick={onCreateProduct}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-lg transition-colors"
                      >
                        + Add First Product
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* 4. Normal Data Rows */}
            {!loading &&
              !error &&
              products.map((p) => {
                const isLowStock = p.stock <= 10 && p.is_active;
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-850/60 transition-colors group border-b border-slate-800/40"
                  >
                    {/* SKU */}
                    <td className="px-5 py-4 font-mono font-semibold text-slate-300 group-hover:text-sky-300 transition-colors text-xs tracking-tight">
                      {p.sku}
                    </td>

                    {/* Product Name */}
                    <td className="px-5 py-4 font-medium text-white max-w-xs truncate">
                      {p.name}
                    </td>

                    {/* Price in Rupiah */}
                    <td className="px-5 py-4 text-right font-mono text-slate-200 font-semibold">
                      {formatCurrency(p.price)}
                    </td>

                    {/* Stock & Low-Stock Indicator */}
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                          p.stock === 0
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isLowStock
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      {p.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Last Movement */}
                    <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                      {formatRelativeTime(p.last_movement_at)}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Adjust Stock Button */}
                        <button
                          onClick={() => onAdjustStock(p)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-600/30 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 border border-slate-700 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Adjust In/Out Stock"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>

                        {/* Movement History */}
                        <button
                          onClick={() => onViewHistory(p)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md text-xs transition-colors"
                          title="View Ledger Audit History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeleteProduct(p)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 rounded-md text-xs transition-colors"
                          title="Delete Product (Checks History)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && !error && products.length > 0 && (
        <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/60 font-mono">
          <div>
            Showing <span className="font-semibold text-slate-200">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(page * limit, total)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{total}</span> products
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <span className="px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
