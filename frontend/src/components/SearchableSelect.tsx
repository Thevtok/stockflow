import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { Product } from '../types';

interface SearchableSelectProps {
  value: string;
  onChange: (sku: string) => void;
  options: Product[];
  placeholder?: string;
  hasError?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select product SKU...',
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const selectedProduct = options.find((p) => p.sku === value);

  const filteredOptions = query.trim()
    ? options.filter(
        (p) =>
          p.sku.toLowerCase().includes(query.toLowerCase()) ||
          p.name.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-xs font-mono text-left flex items-center justify-between gap-2 transition-all ${
          hasError
            ? 'border-rose-500 bg-rose-950/20 text-rose-300'
            : isOpen
            ? 'border-emerald-500 ring-1 ring-emerald-500 text-white'
            : 'border-slate-800 text-slate-200 hover:border-slate-700'
        }`}
      >
        <span className="truncate">
          {selectedProduct ? (
            <span className="flex items-center gap-2">
              <span className="font-bold text-white">{selectedProduct.sku}</span>
              <span className="text-slate-500">|</span>
              <span className="truncate text-slate-300">{selectedProduct.name}</span>
              <span className="text-slate-500 text-[10px]">(Stock: {selectedProduct.stock})</span>
            </span>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[320px] sm:min-w-[420px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[999] overflow-hidden flex flex-col max-h-64 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input INSIDE the dropdown */}
          <div className="p-2 border-b border-slate-800 bg-slate-950 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search SKU or product name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                No matching catalog items found
              </div>
            ) : (
              filteredOptions.map((p) => {
                const isSelected = p.sku === value;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange(p.sku);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-xs flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'hover:bg-slate-800/80 text-slate-200'
                    }`}
                  >
                    <div className="flex-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{p.sku}</span>
                        <span className="text-slate-500">|</span>
                        <span className="truncate text-slate-300 font-medium">{p.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          p.stock <= 10
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        Stock: {p.stock}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
