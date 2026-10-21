import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingCart, AlertCircle, CheckCircle2, Loader2, Search } from 'lucide-react';
import { Product, SalesOrder, OrderItemInput } from '../types';
import { api, ApiError } from '../api/client';
import { formatCurrency } from '../utils/format';

interface CreateOrderModalProps {
  products: Product[];
  onClose: () => void;
  onOrderCreated: (order: SalesOrder) => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  products,
  onClose,
  onOrderCreated,
}) => {
  const [customer, setCustomer] = useState<string>('');
  const [items, setItems] = useState<OrderItemInput[]>([{ sku: '', qty: 1 }]);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedSKU, setFailedSKU] = useState<string | null>(null);
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [createdOrder, setCreatedOrder] = useState<SalesOrder | null>(null);

  // Full catalog state to prevent pagination limit (loads all active products)
  const [catalog, setCatalog] = useState<Product[]>(products.filter((p) => p.is_active));
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    api
      .getProducts({ limit: 100, filter: 'active' })
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          setCatalog(res.data);
        }
      })
      .catch((err) => {
        console.error('Error fetching full catalog for order placement:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCatalog = catalogSearch.trim()
    ? catalog.filter(
        (p) =>
          p.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
          p.name.toLowerCase().includes(catalogSearch.toLowerCase())
      )
    : catalog;

  const handleAddItem = () => {
    setItems([...items, { sku: '', qty: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderItemInput, val: any) => {
    const updated = [...items];
    if (field === 'qty') {
      const q = parseInt(val, 10);
      updated[index].qty = isNaN(q) ? 0 : q;
    } else {
      updated[index].sku = val;
    }
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFailedSKU(null);
    setAvailableStock(null);

    if (!customer.trim()) {
      setErrorMsg('Customer name is required.');
      return;
    }

    if (items.some((it) => !it.sku)) {
      setErrorMsg('Please select a SKU for each item in the order.');
      return;
    }

    if (items.some((it) => it.qty <= 0)) {
      setErrorMsg('Quantity for each item must be greater than zero.');
      return;
    }

    // Check duplicate SKUs in client before submitting
    const skus = items.map((it) => it.sku);
    const hasDuplicates = new Set(skus).size !== skus.length;
    if (hasDuplicates) {
      setErrorMsg('Duplicate SKUs found in order. Please consolidate quantities into one line item.');
      return;
    }

    setSaving(true);
    try {
      const idempotencyKey = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const order = await api.createOrder(
        {
          customer: customer.trim(),
          items: items.map((it) => ({ sku: it.sku, qty: it.qty })),
        },
        idempotencyKey
      );

      setCreatedOrder(order);
      onOrderCreated(order);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === 'INSUFFICIENT_STOCK') {
          // Explicit cross-stack 409 highlighting
          setErrorMsg(
            `Order Rejected (HTTP 409): Insufficient stock for SKU '${err.sku}'.`
          );
          if (err.sku) setFailedSKU(err.sku);
          if (err.available !== undefined) setAvailableStock(err.available);
        } else if (err.code === 'VALIDATION_ERROR') {
          setErrorMsg(`Validation Error (HTTP 400): ${err.message}`);
        } else {
          setErrorMsg(err.message);
        }
      } else {
        setErrorMsg('An unexpected error occurred while placing sales order.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Sales Order</h3>
              <p className="text-xs text-slate-400">
                Server-side pricing & atomic inventory deduction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {createdOrder ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-1">
                Order #{createdOrder.id} Placed Successfully!
              </h4>
              <p className="text-xs text-slate-400">
                Customer: <span className="text-slate-200 font-semibold">{createdOrder.customer}</span>
              </p>
            </div>

            {/* Server Computed Total Display */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl inline-block max-w-sm w-full mx-auto">
              <p className="text-xs font-mono uppercase text-slate-400 mb-1">Server-Computed Total</p>
              <p className="text-2xl font-bold font-mono text-emerald-400">
                {formatCurrency(createdOrder.total)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                {createdOrder.items.length} unique line items committed
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
              >
                Done & Return to Catalog
              </button>
            </div>
          </div>
        ) : (
          /* Create Order Form */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* 409 / 400 Error Alert */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-200">Transaction Failed</p>
                  <p>{errorMsg}</p>
                  {failedSKU && availableStock !== null && (
                    <div className="mt-1 p-2 bg-rose-950/80 border border-rose-500/30 rounded font-mono text-white">
                      Product <span className="text-amber-300 font-bold">{failedSKU}</span> has only{' '}
                      <span className="text-emerald-400 font-bold">{availableStock}</span> units available.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Customer Name / Project Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Marina Bay Sands Interior Contractor"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                required
              />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Order Line Items ({items.length})
                  </label>
                  <p className="text-[11px] text-slate-500">Pick from complete catalog ({catalog.length} active SKUs)</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Quick Catalog Search Filter */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter SKU or name..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-44 pl-7 pr-6 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                    {catalogSearch && (
                      <button
                        type="button"
                        onClick={() => setCatalogSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {items.map((item, idx) => {
                  const isHighlightedFailure = failedSKU && item.sku === failedSKU;
                  const selectedProd = catalog.find((p) => p.sku === item.sku);

                  // Make sure current selected SKU is always visible even if filtered
                  const rowOptions =
                    selectedProd && !filteredCatalog.some((p) => p.sku === selectedProd.sku)
                      ? [selectedProd, ...filteredCatalog]
                      : filteredCatalog;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                        isHighlightedFailure
                          ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {/* SKU Select */}
                      <div className="flex-1">
                        <select
                          value={item.sku}
                          onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                          required
                        >
                          <option value="">Select product SKU...</option>
                          {rowOptions.map((p) => (
                            <option key={p.id} value={p.sku}>
                              {p.sku} | {p.name} (Stock: {p.stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Input */}
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.qty || ''}
                          onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                          placeholder="Qty"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-center text-white focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>

                      {/* Line Unit Price Display (Informational only - server computes) */}
                      <div className="w-28 text-right font-mono text-xs text-slate-400 hidden sm:block">
                        {selectedProd ? formatCurrency(selectedProd.price * item.qty) : '-'}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note about Server Price Calculation */}
            <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
              <span>Prices and totals are strictly computed server-side from database records.</span>
              <span className="font-mono text-emerald-400 font-semibold">Atomic Guarded</span>
            </div>

            {/* Footer Submit Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
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
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Atomic Order...</span>
                  </>
                ) : (
                  <span>Commit Sales Order</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
