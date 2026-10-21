import React, { useEffect, useState } from 'react';
import { X, BarChart3, Loader2 } from 'lucide-react';
import { DailySalesReport } from '../types';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';

interface DailyReportModalProps {
  onClose: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({ onClose }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<DailySalesReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = async (selectedDate: string) => {
    setLoading(true);
    try {
      const data = await api.getDailySalesReport(selectedDate);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(date);
  }, [date]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 rounded-lg text-slate-300 border border-slate-700">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Daily Sales & Dispatch Report</h3>
              <p className="text-xs text-slate-400">Warehouse revenue and unit volume breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Select Evaluation Date:</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mb-2" />
              <p className="text-xs font-mono">Aggregating transactions...</p>
            </div>
          ) : report ? (
            <>
              {/* Metric Highlights */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                    Revenue (IDR)
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    {formatCurrency(report.total_revenue)}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                    Orders
                  </span>
                  <span className="text-lg font-bold font-mono text-white">
                    {report.total_orders}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                    Units Sold
                  </span>
                  <span className="text-lg font-bold font-mono text-white">
                    {report.total_units}
                  </span>
                </div>
              </div>

              {/* Top Products Breakdown */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Top Moving Products on {report.date}
                </h4>
                {report.top_products.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    No completed sales orders recorded on this date.
                  </p>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-2">SKU</th>
                          <th className="px-4 py-2 text-right">Units</th>
                          <th className="px-4 py-2 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {report.top_products.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="px-4 py-2.5 text-emerald-400 font-semibold">{item.sku}</td>
                            <td className="px-4 py-2.5 text-right text-slate-200">{item.total_qty}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-white">
                              {formatCurrency(item.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
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
