import React from 'react';
import { Package, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { DashboardSummary } from '../types';
import { formatCurrency } from '../utils/format';

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  loading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, loading }) => {
  const cards = [
    {
      title: 'Total Catalog',
      value: summary ? summary.total_products.toLocaleString() : '0',
      subtitle: 'Tracked SKU inventory',
      icon: Package,
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
      badge: 'All SKUs',
    },
    {
      title: 'Active Products',
      value: summary ? summary.active_products.toLocaleString() : '0',
      subtitle: 'Available for order placement',
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      badge: 'Active',
    },
    {
      title: 'Total Stock Valuation',
      value: summary ? formatCurrency(summary.total_stock_value) : 'Rp 0',
      subtitle: 'Warehouse inventory asset value',
      icon: TrendingUp,
      color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400',
      badge: 'IDR Asset',
    },
    {
      title: 'Low Stock Alert',
      value: summary ? summary.low_stock_count.toLocaleString() : '0',
      subtitle: 'SKUs with ≤ 10 units remaining',
      icon: AlertTriangle,
      color:
        summary && summary.low_stock_count > 0
          ? 'from-amber-500/20 to-rose-500/10 border-amber-500/40 text-amber-400'
          : 'from-slate-800 to-slate-900 border-slate-700 text-slate-400',
      badge: 'Reorder Need',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 backdrop-blur-sm transition-all duration-200 hover:shadow-lg ${card.color}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-1">
              {loading ? (
                <div className="h-8 w-24 bg-slate-800 animate-pulse rounded my-1" />
              ) : (
                <h3 className="text-2xl font-bold tracking-tight text-white font-mono">
                  {card.value}
                </h3>
              )}
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>{card.subtitle}</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800/80 border border-slate-700/50">
                  {card.badge}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};