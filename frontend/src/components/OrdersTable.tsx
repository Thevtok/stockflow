import React, { useState } from 'react';
import { Eye, Search, ShoppingBag } from 'lucide-react';
import { SalesOrder } from '../types';
import { formatCurrency, formatRelativeTime } from '../utils/format';

interface OrdersTableProps {
  orders: SalesOrder[];
  loading: boolean;
  onViewOrder: (order: SalesOrder) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  loading,
  onViewOrder,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'CREATED' | 'CANCELLED'>('all');

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      order.id.toString().includes(query) ||
      order.customer.toLowerCase().includes(query) ||
      order.items.some((it) => it.sku.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm">
      {/* Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Search by Order #, Customer, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filters */}
        <div className="inline-flex rounded-lg p-1 bg-slate-950 border border-slate-800 shrink-0">
          {(
            [
              { id: 'all', label: 'All Orders' },
              { id: 'CREATED', label: 'Active (Created)' },
              { id: 'CANCELLED', label: 'Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                statusFilter === tab.id
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="px-5 py-3.5">Order #</th>
              <th className="px-5 py-3.5">Customer / Project</th>
              <th className="px-5 py-3.5">Committed Items</th>
              <th className="px-5 py-3.5 text-right">Server Total</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Created At</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-5 bg-slate-800/60 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-full text-slate-400 mb-3">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1">No Orders Found</h4>
                    <p className="text-xs text-slate-400">
                      {search
                        ? 'No orders match your search criteria. Try a different query.'
                        : 'No sales orders have been recorded in this category yet.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-5 py-4 font-mono font-bold text-white">#{order.id}</td>
                  <td className="px-5 py-4 font-medium text-slate-200">{order.customer}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {order.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700/60 font-mono text-[10px] text-slate-300"
                        >
                          {it.sku} (x{it.qty})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-emerald-400 text-sm">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-5 py-4">
                    {order.status === 'CREATED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Created
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        Cancelled
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-400 text-xs">
                    {formatRelativeTime(order.created_at)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onViewOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all group-hover:border-emerald-500/50"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View / Cancel</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};