import React, { useState, useEffect } from 'react';
import { Tag, Percent, Coins, X, Check, Trash2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  initialType?: 'fixed' | 'percentage';
  initialValue?: number;
  onApplyDiscount: (type: 'fixed' | 'percentage', value: number) => void;
  onRemoveDiscount: () => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  initialType = 'fixed',
  initialValue = 0,
  onApplyDiscount,
  onRemoveDiscount,
}) => {
  const [type, setType] = useState<'fixed' | 'percentage'>(initialType);
  const [inputValue, setInputValue] = useState<string>(
    initialValue > 0 ? initialValue.toString() : ''
  );

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setInputValue(initialValue > 0 ? initialValue.toString() : '');
    }
  }, [isOpen, initialType, initialValue]);

  if (!isOpen) return null;

  const numVal = parseFloat(inputValue) || 0;

  // Calculate discount amount in MT
  const calculatedDiscount =
    type === 'percentage'
      ? (subtotal * Math.min(100, Math.max(0, numVal))) / 100
      : Math.min(subtotal, Math.max(0, numVal));

  const newTotal = Math.max(0, subtotal - calculatedDiscount);

  const fixedPresets = [20, 50, 100, 150, 200, 500].filter(p => p <= subtotal + 50);
  const percentagePresets = [5, 10, 15, 20, 25, 50];

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (numVal <= 0) {
      onRemoveDiscount();
    } else {
      onApplyDiscount(type, numVal);
    }
    onClose();
  };

  const handleClear = () => {
    setInputValue('');
    onRemoveDiscount();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight">Aplicar Desconto na Venda</h3>
              <p className="text-[11px] text-orange-100">
                Escolha desconto por valor fixo (MT) ou percentual (%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Type Toggle Tabs - Valor Fixo is FIRST and standard */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Desconto
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setType('fixed')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'fixed'
                    ? 'bg-white text-orange-700 shadow-xs border border-orange-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Coins className="w-4 h-4 text-orange-600" />
                <span>Valor Fixo (MT)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('percentage')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'percentage'
                    ? 'bg-white text-orange-700 shadow-xs border border-orange-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Percent className="w-4 h-4 text-orange-600" />
                <span>Porcentagem (%)</span>
              </button>
            </div>
          </div>

          {/* Input field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                {type === 'fixed' ? 'Valor Fixo em Meticais (MT)' : 'Percentual de Desconto (%)'}
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Subtotal: {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                step={type === 'percentage' ? '1' : '0.50'}
                min="0"
                max={type === 'percentage' ? '100' : subtotal}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApply();
                }}
                placeholder={type === 'fixed' ? 'Ex: 50,00 MT' : 'Ex: 10%'}
                className="w-full pl-4 pr-16 py-3 text-lg font-black font-mono bg-white border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-hidden text-slate-900 shadow-2xs"
                autoFocus
              />
              <span className="absolute right-4 top-3 text-sm font-black font-mono text-slate-400">
                {type === 'fixed' ? 'MT' : '%'}
              </span>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              Atalhos Rápidos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {type === 'fixed'
                ? fixedPresets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setInputValue(val.toString())}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        numVal === val
                          ? 'bg-orange-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200'
                      }`}
                    >
                      {val} MT
                    </button>
                  ))
                : percentagePresets.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setInputValue(pct.toString())}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        numVal === pct
                          ? 'bg-orange-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
            </div>
          </div>

          {/* Live Calculation Preview Box */}
          <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal original:</span>
              <span className="font-semibold font-mono text-slate-800">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-orange-800">
              <span className="font-semibold flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Desconto concedido:
              </span>
              <span className="font-black font-mono text-sm text-orange-700">
                {calculatedDiscount > 0
                  ? `-${formatCurrency(calculatedDiscount)} ${
                      type === 'percentage' ? `(${numVal}%)` : ''
                    }`
                  : '0,00 MT'}
              </span>
            </div>

            <div className="pt-2 border-t border-orange-200 flex justify-between items-baseline">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Novo Total a Pagar:
              </span>
              <span className="font-black font-mono text-lg text-orange-950">
                {formatCurrency(newTotal)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            {initialValue > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="py-3 px-3.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Remover desconto aplicado"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remover</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar (ESC)
            </button>

            <button
              type="button"
              onClick={() => handleApply()}
              className="flex-1 py-3 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-colors shadow-md shadow-orange-900/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Desconto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
