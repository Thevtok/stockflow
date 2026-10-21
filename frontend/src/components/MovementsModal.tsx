import React, { useEffect, useState } from 'react';
import { X, History, ArrowUpRight, ArrowDownRight, Loader2, AlertCircle } from 'lucide-react';
import { Product, StockMovement } from '../types';
import { api } from '../api/client';
import { formatRelativeTime } from '../utils/format';

interface MovementsModalProps {
  product: Product;
  onClose: () => void;
}

export const MovementsModal: React.FC<MovementsModalProps> = ({ product, onClose }) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMovements = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getProductMovements(product.id);
        if (isMounted) {
          setMovements(res.data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch ledger movements');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMovements();
    return () => {
      isMounted = false;
    };
  }, [product.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 rounded-lg text-slate-300 border border-slate-700">
              <History className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Ledger Audit History</span>
                <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {product.sku}
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mb-2" />
              <p className="text-xs font-mono">Loading immutable audit log...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && movements.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs font-mono">No stock movements recorded yet for this SKU.</p>
            </div>
          )}

          {!loading && !error && movements.length > 0 && (
            <div className="space-y-3 font-mono">
              {movements.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-start justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${
                        m.type === 'in'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      {m.type === 'in' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                          Stock {m.type}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatRelativeTime(m.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans text-xs mt-0.5">
                        {m.note || 'No transaction note provided'}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(m.created_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`font-bold font-mono text-sm shrink-0 ${
                      m.type === 'in' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {m.type === 'in' ? `+${m.qty}` : `-${m.qty}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};