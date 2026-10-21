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
      iconStyle: 'text-slate-300 bg-slate-800/80 border-slate-700/60',
      badge: 'All SKUs',
      badgeStyle: 'bg-slate-800/80 text-slate-400 border-slate-700/50',
    },
    {
      title: 'Active Products',
      value: summary ? summary.active_products.toLocaleString() : '0',
      subtitle: 'Available for order placement',
      icon: CheckCircle2,
      iconStyle: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: 'Active',
      badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Total Stock Valuation',
      value: summary ? formatCurrency(summary.total_stock_value) : 'Rp 0',
      subtitle: 'Warehouse inventory asset value',
      icon: TrendingUp,
      iconStyle: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      badge: 'IDR Asset',
      badgeStyle: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    },
    {
      title: 'Low Stock Alert',
      value: summary ? summary.low_stock_count.toLocaleString() : '0',
      subtitle: 'SKUs with <= 10 units remaining',
      icon: AlertTriangle,
      iconStyle:
        summary && summary.low_stock_count > 0
          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
          : 'text-slate-400 bg-slate-800 border-slate-700',
      badge: 'Reorder Need',
      badgeStyle:
        summary && summary.low_stock_count > 0
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          : 'bg-slate-800 text-slate-400 border-slate-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg border ${card.iconStyle}`}>
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
                <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${card.badgeStyle}`}>
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
