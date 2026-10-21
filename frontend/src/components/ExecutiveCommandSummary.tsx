import React, { useState, useEffect } from 'react';
import { Brain, AlertTriangle, CheckCircle2, ShieldCheck, ArrowUpRight, Zap } from 'lucide-react';
import { DashboardSummary, Product } from '../types';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';

interface ExecutiveCommandSummaryProps {
  summary: DashboardSummary | null;
  products: Product[];
  onAdjustStock: (product: Product) => void;
  loading: boolean;
}

export const ExecutiveCommandSummary: React.FC<ExecutiveCommandSummaryProps> = ({
  summary,
  products,
  onAdjustStock,
  loading,
}) => {
  const [criticalItems, setCriticalItems] = useState<Product[]>(() => products.filter((p) => p.is_active && p.stock <= 10));

  // Fetch all products that have low stock (<= 10) so all alert items are displayed
  useEffect(() => {
    if (summary && summary.low_stock_count > 0) {
      api
        .getProducts({ filter: 'low_stock', limit: 10 })
        .then((res) => {
          setCriticalItems(res.data);
        })
        .catch((err) => {
          console.error('Failed to fetch low stock alert items:', err);
          // Fallback to local filter if API fails
          setCriticalItems(products.filter((p) => p.is_active && p.stock <= 10));
        });
    } else {
      setCriticalItems([]);
    }
  }, [summary?.low_stock_count, products]);

  if (loading || !summary) {
    return (
      <div className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 animate-pulse">
        <div className="h-6 w-64 bg-slate-800 rounded mb-4"></div>
        <div className="h-16 w-full bg-slate-800/60 rounded mb-6"></div>
        <div className="grid grid-cols-4 gap-4">
          <div className="h-12 bg-slate-800/40 rounded"></div>
          <div className="h-12 bg-slate-800/40 rounded"></div>
          <div className="h-12 bg-slate-800/40 rounded"></div>
          <div className="h-12 bg-slate-800/40 rounded"></div>
        </div>
      </div>
    );
  }

  const isCritical = summary.low_stock_count > 0;
  const lowestItem = [...criticalItems].sort((a, b) => a.stock - b.stock)[0];
  const currentTime =
    new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }) + ' SGT';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      {/* 1. Main Narration & Synthesis Card (2 Cols) */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 backdrop-blur-md shadow-sm relative overflow-hidden flex flex-col justify-between">
        {/* Glow ambient */}
        <div
          className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-10 ${
            isCritical ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        />

        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-center ${
                  isCritical
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Warehouse Command Intelligence</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full border ${
                      isCritical
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {isCritical ? 'ATTENTION REQUIRED' : 'BUFFER OPTIMAL'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Cross-catalog real-time synthesis &bull; {currentTime}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Executive Narration Paragraph */}
          <div className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-2 mb-6">
            <p>
              As of current operations,{' '}
              <strong className="text-white font-semibold">{summary.total_products} products</strong>{' '}
              are cataloged with{' '}
              <strong className="text-emerald-400 font-semibold">{summary.active_products} active SKUs</strong>{' '}
              ready for sales order allocation. Total warehouse inventory asset valuation is securely tracked at{' '}
              <strong className="text-white font-semibold font-mono">
                {formatCurrency(summary.total_stock_value)}
              </strong>
              .
            </p>
            <p>
              {isCritical ? (
                <>
                  <strong className="text-amber-400 font-semibold">Warehouse Alert:</strong> Detected{' '}
                  <strong className="text-amber-300 font-semibold">{summary.low_stock_count} SKUs</strong>{' '}
                  below the safety buffer threshold (≤ 10 units)
                  {lowestItem ? (
                    <>
                      , with the lowest stock on{' '}
                      <span className="font-mono text-white underline decoration-amber-500/50">
                        {lowestItem.sku} ({lowestItem.stock} units left)
                      </span>
                    </>
                  ) : null}
                  .{' '}
                  <strong className="text-slate-200">Recommendation:</strong> Schedule immediate stock intake to avoid checkout transaction rejections due to insufficient stock.
                </>
              ) : (
                <>
                  <strong className="text-emerald-400 font-semibold">Buffer Status Optimal:</strong> All catalog SKUs maintain stock well above the minimum threshold. Sales orders can be dispatched safely without inventory overdraw risk.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Bottom Mini Metric Strip */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Asset Value</p>
            <p className="text-sm font-bold font-mono text-white mt-0.5">
              {formatCurrency(summary.total_stock_value)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Active Catalog</p>
            <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
              {summary.active_products} / {summary.total_products}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Low Stock SKUs</p>
            <p
              className={`text-sm font-bold font-mono mt-0.5 ${
                isCritical ? 'text-amber-400' : 'text-slate-200'
              }`}
            >
              {summary.low_stock_count} Items
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Concurrency Shield</p>
            <p className="text-xs font-bold font-mono text-sky-400 mt-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Row-Lock Active</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Priority Action & Alert Card (1 Col) */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 backdrop-blur-md shadow-sm flex flex-col justify-between">
        <div>
          {/* Header with Alert Count */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Priority Action & Alerts</span>
            </div>
            <span
              className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full ${
                isCritical ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {summary.low_stock_count}
            </span>
          </div>

          {/* Action Box: List of All Alert Items */}
          {isCritical && criticalItems.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Critical Stock Deficit ({criticalItems.length} SKUs ≤ 10)</span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {criticalItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-white shrink-0">{item.sku}</span>
                        <span className="text-slate-500 shrink-0">|</span>
                        <span className="text-slate-300 truncate font-medium">{item.name}</span>
                      </div>
                      <p className="text-[11px] text-rose-300/80 mt-0.5 font-mono">
                        Stock: <strong className="text-rose-300 font-bold">{item.stock} units left</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAdjustStock(item)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>Restock</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Operational Equilibrium</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                No warehouse catalog items currently require emergency replenishment. Orders can be committed with zero buffer hazard.
              </p>
            </div>
          )}
        </div>

        {/* Next step footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
          <span className="text-amber-400 font-bold">⚡ Next Step:</span>
          <span>Initiate supplier procurement before threshold breaches occur.</span>
        </div>
      </div>
    </div>
  );
};
