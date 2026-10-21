import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, AlertCircle, Loader2 } from 'lucide-react';
import { Product, MovementType } from '../types';
import { api, ApiError } from '../api/client';

interface AdjustStockModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  product,
  onClose,
  onSuccess,
}) => {
  const [type, setType] = useState<MovementType>('in');
  const [qty, setQty] = useState<string>('1');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [availableStock, setAvailableStock] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAvailableStock(null);

    const parsedQty = parseInt(qty, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMsg('Quantity must be an integer greater than zero.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.adjustStock(product.id, {
        type,
        qty: parsedQty,
        note: note.trim() || `Manual ${type === 'in' ? 'intake' : 'dispatch'} adjustment`,
      });

      onSuccess(res.product);
      onClose();
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === 'INSUFFICIENT_STOCK') {
          // Explicit cross-stack 409 display
          setErrorMsg(
            `Insufficient Stock! Cannot deduct ${parsedQty} units.`
          );
          if (err.available !== undefined) {
            setAvailableStock(err.available);
          }
        } else {
          setErrorMsg(err.message);
        }
      } else {
        setErrorMsg('An unexpected error occurred while adjusting stock.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Adjust Inventory Stock</span>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {product.sku}
              </span>
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-sm mt-0.5">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Stock Snapshot */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800/60 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Current Warehouse Stock:</span>
          <span className="text-sm font-bold text-white px-2.5 py-0.5 bg-slate-800 border border-slate-700 rounded-full">
            {product.stock} units
          </span>
        </div>

        {/* 409 Error Alert Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-200">Adjustment Rejected (HTTP 409)</p>
              <p>{errorMsg}</p>
              {availableStock !== null && (
                <p className="font-mono text-white bg-rose-950/60 px-2 py-1 rounded inline-block border border-rose-500/30 mt-1">
                  Available in Warehouse: <span className="font-bold underline">{availableStock}</span> units
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Direction Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Adjustment Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('in')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  type === 'in'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <span>Stock IN (Intake)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('out')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  type === 'out'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
                <span>Stock OUT (Deduct)</span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Quantity <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 5"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              required
            />
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Reason / Ledger Audit Note
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Broken slab in transit / Supplier shipment PO #892"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Committing Ledger...</span>
                </>
              ) : (
                <span>Confirm {type === 'in' ? 'Stock Intake' : 'Stock Deduction'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
