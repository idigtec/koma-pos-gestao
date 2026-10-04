import React, { useState } from 'react';
import { X, Plus, Minus, Check, Clock, Utensils, AlertCircle } from 'lucide-react';
import { Product, SelectedModifier, ModifierOption } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Sound } from '../../utils/sound';

interface ProductCustomizerModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customizedData: {
    selectedModifiers: SelectedModifier[];
    notes: string;
    quantity: number;
    unitPrice: number;
  }) => void;
}

export const ProductCustomizerModal: React.FC<ProductCustomizerModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>(() => {
    // Initialize with default choices if any
    const initial: SelectedModifier[] = [];
    if (product.modifierGroups) {
      product.modifierGroups.forEach(grp => {
        grp.options.forEach(opt => {
          if (opt.isDefault) {
            initial.push({
              id: opt.id,
              groupId: grp.id,
              groupName: grp.name,
              name: opt.name,
              type: opt.type,
              priceAdjustment: opt.priceAdjustment,
              ingredientId: opt.ingredientId,
              inventoryEffectQuantity: opt.inventoryEffectQuantity,
            });
          }
        });
      });
    }
    return initial;
  });

  // Calculate dynamic unit price
  const basePrice = product.sellingPrice;
  const modifiersPrice = selectedModifiers.reduce((sum, m) => sum + m.priceAdjustment, 0);
  const finalUnitPrice = Math.max(0, basePrice + modifiersPrice);
  const totalPrice = finalUnitPrice * quantity;

  // Toggle modifier option
  const handleToggleOption = (
    groupId: string,
    groupName: string,
    option: ModifierOption,
    allowMultiple: boolean,
    maxSelections: number
  ) => {
    Sound.playTouch();

    setSelectedModifiers(prev => {
      const isAlreadySelected = prev.some(m => m.id === option.id);

      if (isAlreadySelected) {
        // Deselect
        return prev.filter(m => m.id !== option.id);
      }

      const modToAdd: SelectedModifier = {
        id: option.id,
        groupId,
        groupName,
        name: option.name,
        type: option.type,
        priceAdjustment: option.priceAdjustment,
        ingredientId: option.ingredientId,
        inventoryEffectQuantity: option.inventoryEffectQuantity,
      };

      if (!allowMultiple) {
        // Single choice in this group
        const filtered = prev.filter(m => m.groupId !== groupId);
        return [...filtered, modToAdd];
      }

      // Check max selections
      const currentInGroup = prev.filter(m => m.groupId !== groupId);
      const inThisGroup = prev.filter(m => m.groupId === groupId);

      if (inThisGroup.length >= maxSelections) {
        // Replace oldest in group
        return [...currentInGroup, ...inThisGroup.slice(1), modToAdd];
      }

      return [...prev, modToAdd];
    });
  };

  const handleConfirm = () => {
    Sound.playAddToCart();
    onConfirm({
      selectedModifiers,
      notes: notes.trim(),
      quantity,
      unitPrice: finalUnitPrice,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Food Image Banner */}
        <div className="relative h-44 sm:h-52 bg-stone-900 shrink-0 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover object-center opacity-85"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-orange-600 text-white text-5xl">
              🍔
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer shadow-md transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Food Details Over Image */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[11px] font-black uppercase tracking-wider">
                {product.categoryName || 'Menu KOMA'}
              </span>
              {product.averagePrepMinutes && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-orange-200 bg-stone-900/60 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3 text-orange-400" />
                  {product.averagePrepMinutes} min
                </span>
              )}
            </div>

            <h2 className="text-xl font-black tracking-tight leading-tight drop-shadow-sm">
              {product.name}
            </h2>
            <div className="text-lg font-black font-mono text-orange-400 mt-0.5">
              {formatCurrency(finalUnitPrice)}
            </div>
          </div>
        </div>

        {/* Scrollable Customization Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-stone-900">
          {/* Base Description */}
          {product.description && (
            <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-2xl border border-stone-200">
              {product.description}
            </p>
          )}

          {/* Modifier Groups */}
          {product.modifierGroups && product.modifierGroups.length > 0 ? (
            product.modifierGroups.map(grp => (
              <div key={grp.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-orange-600" />
                    <span>{grp.name}</span>
                  </h4>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {grp.required ? (
                      <span className="text-orange-600 font-bold">* Obrigatório</span>
                    ) : (
                      <span>Opcional (máx: {grp.maxSelections})</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {grp.options.map(opt => {
                    const isSelected = selectedModifiers.some(m => m.id === opt.id);
                    const isRemove = opt.type === 'remove';
                    const isAdd = opt.type === 'add';

                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() =>
                          handleToggleOption(
                            grp.id,
                            grp.name,
                            opt,
                            grp.allowMultiple,
                            grp.maxSelections
                          )
                        }
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 cursor-pointer active:scale-[0.98] select-none ${
                          isSelected
                            ? isRemove
                              ? 'border-rose-400 bg-rose-50 text-rose-950 font-bold shadow-xs'
                              : 'border-orange-500 bg-orange-50 text-orange-950 font-bold shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                              isSelected
                                ? isRemove
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-orange-600 text-white'
                                : 'border border-stone-300 bg-stone-50'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs">{opt.name}</span>
                        </div>

                        {opt.priceAdjustment > 0 && (
                          <span className="text-xs font-black font-mono text-orange-700">
                            +{formatCurrency(opt.priceAdjustment)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl text-amber-900 text-xs border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Este produto não possui modificadores pré-configurados. Você pode adicionar observações especiais abaixo.</span>
            </div>
          )}

          {/* Notes for Kitchen / Special Instructions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-stone-800">
              Instruções Especiais / Observações para a Cozinha
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: cortar ao meio, molho bem à parte, sem pimenta, carne bem passada..."
              rows={2}
              className="w-full p-3 text-xs bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-hidden text-stone-900 transition-all font-medium"
            />
          </div>
        </div>

        {/* Bottom Bar: Quantity Controls & Confirm CTA */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Quantity Selector Touch */}
          <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-2xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                Sound.playTouch();
                setQuantity(Math.max(1, quantity - 1));
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 active:scale-95 transition-all cursor-pointer font-bold"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-black font-mono text-base text-stone-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => {
                Sound.playTouch();
                setQuantity(quantity + 1);
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 active:scale-95 transition-all cursor-pointer font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:flex-1 py-3.5 px-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-950/20 flex items-center justify-between transition-all cursor-pointer"
          >
            <span>ADICIONAR AO PEDIDO</span>
            <span className="font-mono text-base">{formatCurrency(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
