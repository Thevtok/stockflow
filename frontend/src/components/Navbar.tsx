import React from 'react';
import { Boxes, ShoppingCart, BarChart3, Plus, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onOpenCreateOrder: () => void;
  onOpenCreateProduct: () => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateOrder,
  onOpenCreateProduct,
  onOpenReport,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/50">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white font-mono">
                StockFlow
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Pessimistic Row-Lock</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">
              Warehouse Inventory & Sales ERP
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCreateProduct}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span>Add SKU</span>
          </button>

          <button
            onClick={onOpenReport}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Daily Report</span>
          </button>

          <button
            onClick={onOpenCreateOrder}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>+ New Order</span>
          </button>
        </div>
      </div>
    </header>
  );
};
