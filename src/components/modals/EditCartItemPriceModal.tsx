import React, { useState, useEffect } from 'react';
import { X, Check, Edit3, RotateCcw, Coins, Calculator } from 'lucide-react';
import { CartItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface EditCartItemPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
  onSavePrice: (cartItemId: string, newUnitPrice: number, newQuantity: number, newDiscount: number) => void;
}

export const EditCartItemPriceModal: React.FC<EditCartItemPriceModalProps> = ({
  isOpen,
  onClose,
  item,
  onSavePrice,
}) => {
  const [unitPriceInput, setUnitPriceInput] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [discountInput, setDiscountInput] = useState<string>('');

  useEffect(() => {
    if (item && isOpen) {
      setUnitPriceInput(item.unitPrice.toString());
      setQuantityInput(item.quantity.toString());
      setDiscountInput(item.discount > 0 ? item.discount.toString() : '');
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const parsedUnitPrice = Math.max(0, parseFloat(unitPriceInput) || 0);
  const parsedQty = Math.max(1, parseInt(quantityInput) || 1);
  const parsedDiscount = Math.max(0, parseFloat(discountInput) || 0);

  const calculatedSubtotal = Math.max(0, parsedUnitPrice * parsedQty - parsedDiscount);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSavePrice(item.cartItemId, parsedUnitPrice, parsedQty, parsedDiscount);
    onClose();
  };

  const handleResetToDefaultPrice = () => {
    setUnitPriceInput(item.product.sellingPrice.toString());
    setDiscountInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight">Editar Preço do Item</h3>
              <p className="text-[11px] text-orange-100 truncate max-w-[200px]">
                {item.product.name}
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

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Reference Price */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Preço de Tabela do Produto:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(item.product.sellingPrice)}
              </span>
              {parsedUnitPrice !== item.product.sellingPrice && (
                <button
                  type="button"
                  onClick={handleResetToDefaultPrice}
                  className="text-[10px] text-orange-700 hover:text-orange-800 font-bold underline flex items-center gap-0.5 cursor-pointer"
                  title="Restaurar preço padrão"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Restaurar</span>
                </button>
              )}
            </div>
          </div>

          {/* Unit Price Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Preço Unitário (MT) <span className="text-orange-600">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPriceInput}
                onChange={(e) => setUnitPriceInput(e.target.value)}
                placeholder="0.00"
                className="w-full pl-3 pr-10 py-2.5 text-base font-black font-mono border-2 border-slate-300 rounded-xl bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-hidden text-slate-900"
                autoFocus
                required
              />
              <span className="absolute right-3 top-3 text-xs font-bold text-slate-400 font-mono">
                MT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Quantity Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                max={item.product.currentStock || 999}
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold font-mono border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Discount Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Desconto Item (MT)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm font-bold font-mono border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Quick presets for discount */}
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">
              Atalhos de Desconto no Item:
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {[10, 20, 50, 100].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDiscountInput(val.toString())}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-900 border border-slate-200 transition-colors cursor-pointer"
                >
                  -{val} MT
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDiscountInput('')}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Total Calculation Box */}
          <div className="p-3 bg-orange-50/80 rounded-xl border border-orange-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-orange-950 font-bold">
              <Calculator className="w-4 h-4 text-orange-600" />
              <span>Novo Total do Item:</span>
            </div>
            <span className="text-base font-black font-mono text-orange-700">
              {formatCurrency(calculatedSubtotal)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar (ESC)
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-colors shadow-md flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Preço</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
