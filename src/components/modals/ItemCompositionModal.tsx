import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  AlertTriangle,
  SlidersHorizontal,
  Plus,
  Trash2,
  UtensilsCrossed,
  Sparkles,
  Ban
} from 'lucide-react';
import { CartItem } from '../../types';
import { ProductIllustration } from '../ProductIllustration';

interface ItemCompositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
  onSaveComposition: (cartItemId: string, removedIngredients: string[], notes: string) => void;
}

export const ItemCompositionModal: React.FC<ItemCompositionModalProps> = ({
  isOpen,
  onClose,
  item,
  onSaveComposition,
}) => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [removedList, setRemovedList] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [newIngredientInput, setNewIngredientInput] = useState<string>('');

  useEffect(() => {
    if (!item) return;

    // 1. Gather all ingredients for this product
    const ingSet = new Set<string>();

    if (item.product.recipe && item.product.recipe.length > 0) {
      item.product.recipe.forEach((r) => {
        // clean up names (e.g. "Cebola Roxa Fatiada" -> "Cebola")
        ingSet.add(r.ingredientName);
      });
    }

    if (item.product.modifierGroups) {
      item.product.modifierGroups.forEach((g) => {
        g.options.forEach((opt) => {
          if (opt.type === 'remove') {
            const cleanName = opt.name.replace(/^sem\s+/i, '').trim();
            ingSet.add(cleanName);
          }
        });
      });
    }

    // Smart fallback for burgers, pizzas and meals if recipe is empty
    if (ingSet.size === 0) {
      const name = (item.product.name || '').toLowerCase();
      if (name.includes('hambúrguer') || name.includes('burger') || name.includes('sandes')) {
        ['Pão de Hambúrguer', 'Carne Bovina', 'Queijo Cheddar', 'Cebola', 'Tomate', 'Alface', 'Molho Especial', 'Picles'].forEach(i => ingSet.add(i));
      } else if (name.includes('pizza')) {
        ['Massa Artesanal', 'Molho de Tomate', 'Queijo Mozzarella', 'Cebola', 'Orégãos'].forEach(i => ingSet.add(i));
      } else if (name.includes('frango') || name.includes('prato')) {
        ['Frango Grelhado', 'Batatas', 'Molho Piri-Piri', 'Salada', 'Cebola', 'Tomate'].forEach(i => ingSet.add(i));
      } else if (name.includes('batata')) {
        ['Sal', 'Molho Especial', 'Ervas Aromáticas'].forEach(i => ingSet.add(i));
      } else {
        ['Ingrediente Principal', 'Molho', 'Acompanhamento', 'Salada'].forEach(i => ingSet.add(i));
      }
    }

    // If item already had removed ingredients, include them
    if (item.removedIngredients) {
      item.removedIngredients.forEach(r => ingSet.add(r));
      setRemovedList([...item.removedIngredients]);
    } else {
      setRemovedList([]);
    }

    setIngredients(Array.from(ingSet));
    setNotes(item.notes || '');
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const toggleIngredient = (ing: string) => {
    setRemovedList((prev) => {
      if (prev.includes(ing)) {
        return prev.filter((i) => i !== ing);
      } else {
        return [...prev, ing];
      }
    });
  };

  const handleAddNewIngredient = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newIngredientInput.trim();
    if (!trimmed) return;
    if (!ingredients.includes(trimmed)) {
      setIngredients((prev) => [...prev, trimmed]);
    }
    // automatically mark as removed if user typed something they want removed
    if (!removedList.includes(trimmed)) {
      setRemovedList((prev) => [...prev, trimmed]);
    }
    setNewIngredientInput('');
  };

  const quickNotesPresets = [
    'Bem Passado',
    'Ao Ponto',
    'Mal Passado',
    'Sem Sal',
    'Sem Picante',
    'Piri-Piri Extra',
    'Molho à Parte',
    'Embalar Separado',
    'Cortar ao Meio',
  ];

  const addQuickNote = (noteText: string) => {
    if (notes.includes(noteText)) {
      setNotes((prev) =>
        prev
          .replace(new RegExp(`(^|[,;\\s]+)${noteText}`, 'i'), '')
          .replace(/^[,;\s]+|[,;\s]+$/g, '')
      );
    } else {
      setNotes((prev) => (prev ? `${prev}, ${noteText}` : noteText));
    }
  };

  const handleSave = () => {
    onSaveComposition(item.cartItemId, removedList, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight flex items-center gap-2">
                <span>Personalizar Composição / Ingredientes</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase">
                  Cozinha
                </span>
              </h3>
              <p className="text-[11px] text-orange-100">
                Selecione o que o cliente NÃO deseja (ex: sem cebola, sem tomate)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Details Banner */}
        <div className="px-6 py-3 bg-orange-50/70 border-b border-orange-200 flex items-center gap-3 shrink-0">
          <ProductIllustration
            productName={item.product.name}
            sku={item.product.sku}
            imageUrl={item.product.image}
            categoryName={item.product.categoryName}
            size="sm"
            className="w-11 h-11"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-slate-900 text-xs truncate">
              {item.product.name}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Qtd no Carrinho: <strong>{item.quantity}x</strong></span>
              <span>•</span>
              <span className="text-orange-700 font-bold">{item.product.categoryName || 'Comida'}</span>
            </div>
          </div>

          {removedList.length > 0 && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-600 text-white shadow-2xs">
              {removedList.length} {removedList.length === 1 ? 'item removido' : 'itens removidos'}
            </span>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Ingredients Composition & Removal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                <span>Ingredientes da Composição</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Clique para <strong>remover</strong> ou <strong>manter</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ingredients.map((ing) => {
                const isRemoved = removedList.includes(ing);
                return (
                  <button
                    key={ing}
                    type="button"
                    onClick={() => toggleIngredient(ing)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isRemoved
                        ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs ring-1 ring-rose-400/30'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-orange-300 hover:bg-orange-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isRemoved
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        }`}
                      >
                        {isRemoved ? <Ban className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span
                        className={`text-xs font-bold truncate ${
                          isRemoved ? 'line-through text-rose-800' : 'text-slate-800'
                        }`}
                      >
                        {ing}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ml-1.5 ${
                        isRemoved
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isRemoved ? 'Removido' : 'Sim'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick add custom ingredient to remove */}
            <form onSubmit={handleAddNewIngredient} className="mt-3 flex gap-2">
              <input
                type="text"
                value={newIngredientInput}
                onChange={(e) => setNewIngredientInput(e.target.value)}
                placeholder="Digitar outro ingrediente a remover (Ex: Cebola, Mostarda)..."
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!newIngredientInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors disabled:opacity-40 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </form>
          </div>

          {/* Section 2: Quick Kitchen Notes */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Atalhos Rápidos de Preparo &amp; Ponto
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickNotesPresets.map((preset) => {
                const isSelected = notes.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addQuickNote(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-2xs ring-1 ring-orange-500'
                        : 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-800 border border-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Free text notes */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
              Observações Especiais para a Cozinha
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Servir bem quente, colocar molho em recipiente separado..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
            />
          </div>

          {/* Summary Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-700 block">Como sairá no pedido da cozinha (KDS):</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {removedList.length === 0 && !notes && (
                <span className="text-slate-400 italic">Preparo padrão (sem alterações).</span>
              )}
              {removedList.map((r) => (
                <span
                  key={r}
                  className="px-2 py-0.5 rounded-md text-[11px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200"
                >
                  ❌ Sem {r}
                </span>
              ))}
              {notes && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  📝 {notes}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Personalização</span>
          </button>
        </div>
      </div>
    </div>
  );
};
