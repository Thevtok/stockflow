import React, { useState } from 'react';
import { X, Receipt, AlertTriangle, RotateCcw, User, Hash, Loader2 } from 'lucide-react';
import { SalesOrder } from '../types';
import { api, ApiError } from '../api/client';
import { formatCurrency } from '../utils/format';

interface OrderDetailModalProps {
  order: SalesOrder;
  onClose: () => void;
  onOrderCancelled: (cancelledOrder: SalesOrder) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order: initialOrder,
  onClose,
  onOrderCancelled,
}) => {
  const [order, setOrder] = useState<SalesOrder>(initialOrder);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await api.cancelOrder(order.id);
      setOrder(updated);
      setShowConfirmCancel(false);
      onOrderCancelled(updated);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setCancelError(err.message);
      } else {
        setCancelError('Failed to cancel order.');
      }
    } finally {
      setCancelling(false);
    }
  };

  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg text-slate-300 border border-slate-700">
              <Receipt className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  Order #{order.id}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider font-mono ${
                    isCancelled
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                <span>Created {new Date(order.created_at).toLocaleString('id-ID')}</span>
                {order.cancelled_at && (
                  <span className="text-rose-400">
                    • Cancelled {new Date(order.cancelled_at).toLocaleTimeString('id-ID')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cancel Error Banner */}
        {cancelError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{cancelError}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Customer / Client</span>
              </div>
              <p className="text-sm font-semibold text-white">{order.customer}</p>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>Idempotency Key</span>
              </div>
              <p className="text-xs font-mono text-slate-300 truncate">
                {order.idempotency_key || 'Direct Submission'}
              </p>
            </div>
          </div>

          {/* Items Breakdown Table */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Purchased Line Items
            </h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">SKU</th>
                    <th className="px-4 py-2.5 text-right">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30">
                      <td className="px-4 py-3 font-semibold text-emerald-400">{item.sku}</td>
                      <td className="px-4 py-3 text-right text-slate-200">{item.qty}</td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {formatCurrency(item.unit_price * item.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-800 bg-slate-900/40">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold text-slate-300">
                      Server-Computed Total:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-base text-emerald-400">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Cancellation Notice if Cancelled */}
          {isCancelled && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                This order was cancelled. All line item quantities have been atomically restored to warehouse inventory.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div>
            {!isCancelled && !showConfirmCancel && (
              <button
                type="button"
                onClick={() => setShowConfirmCancel(true)}
                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel Order</span>
              </button>
            )}

            {!isCancelled && showConfirmCancel && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-300 font-semibold">
                  Confirm restore stock?
                </span>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {cancelling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Yes, Cancel</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmCancel(false)}
                  disabled={cancelling}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs transition-colors"
                >
                  Back
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};