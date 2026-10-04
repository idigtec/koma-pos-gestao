import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  UtensilsCrossed,
  Layers,
  Sparkles,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Percent,
  TrendingUp,
  Info,
  Save,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { Product, Ingredient, RecipeItem, ModifierGroup, ModifierOption, ModifierType, UnitOfMeasure } from '../../types';
import { DatabaseService } from '../../services/db';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

interface RecipeModifiersModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedProduct: Product) => void;
}

export const RecipeModifiersModal: React.FC<RecipeModifiersModalProps> = ({
  product,
  isOpen,
  onClose,
  onUpdated,
}) => {
  if (!isOpen) return null;

  const { user } = useAuth();
  const { success, warning, error } = useToast();

  const [activeTab, setActiveTab] = useState<'recipe' | 'modifiers'>('recipe');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  // Recipe state
  const [recipe, setRecipe] = useState<RecipeItem[]>(product.recipe || []);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [ingredientQuantity, setIngredientQuantity] = useState<string>('1');

  // Modifier Groups state
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(product.modifierGroups || []);

  // New Group state
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupRequired, setNewGroupRequired] = useState(false);
  const [newGroupMin, setNewGroupMin] = useState('0');
  const [newGroupMax, setNewGroupMax] = useState('3');
  const [newGroupMultiple, setNewGroupMultiple] = useState(true);

  // New Option state (keyed by group id)
  const [addingOptionGroupId, setAddingOptionGroupId] = useState<string | null>(null);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionType, setNewOptionType] = useState<ModifierType>('add');
  const [newOptionPrice, setNewOptionPrice] = useState('0');
  const [newOptionIngredientId, setNewOptionIngredientId] = useState('');

  // Load ingredients
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoadingIngredients(true);
        const data = await DatabaseService.getIngredients();
        setIngredients(data);
        if (data.length > 0) {
          setSelectedIngredientId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching ingredients:', err);
      } finally {
        setLoadingIngredients(false);
      }
    };
    fetchIngredients();
  }, []);

  // --- Real-time Recipe Cost Calculations ---
  const calculatedRecipeCost = useMemo(() => {
    return recipe.reduce((total, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      const unitCost = ing ? ing.costPerUnit : (item.costContribution ? item.costContribution / (item.quantity || 1) : 0);
      const itemCost = (item.quantity || 0) * unitCost;
      return total + itemCost;
    }, 0);
  }, [recipe, ingredients]);

  const sellingPrice = product.sellingPrice || 0;
  const foodCostPercent = sellingPrice > 0 ? (calculatedRecipeCost / sellingPrice) * 100 : 0;
  const grossMarginPercent = sellingPrice > 0 ? ((sellingPrice - calculatedRecipeCost) / sellingPrice) * 100 : 0;
  const theoreticalProfit = sellingPrice - calculatedRecipeCost;

  // Add ingredient to recipe
  const handleAddIngredientToRecipe = () => {
    if (!selectedIngredientId) {
      warning('Atenção', 'Selecione um ingrediente.');
      return;
    }
    const qty = parseFloat(ingredientQuantity);
    if (isNaN(qty) || qty <= 0) {
      warning('Quantidade Inválida', 'Informe uma quantidade maior que zero.');
      return;
    }

    const ing = ingredients.find(i => i.id === selectedIngredientId);
    if (!ing) return;

    // Check if ingredient already in recipe
    const existingIndex = recipe.findIndex(r => r.ingredientId === ing.id);
    const costContribution = qty * ing.costPerUnit;

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...recipe];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: qty,
        costContribution,
      };
      setRecipe(updated);
    } else {
      // Append
      const newItem: RecipeItem = {
        ingredientId: ing.id,
        ingredientName: ing.name,
        quantity: qty,
        unit: ing.unit,
        costContribution,
      };
      setRecipe([...recipe, newItem]);
    }

    setIngredientQuantity('1');
  };

  const handleRemoveRecipeItem = (index: number) => {
    setRecipe(prev => prev.filter((_, i) => i !== index));
  };

  // Save recipe and optionally apply cost to product
  const handleSaveRecipe = async (applyCostToProduct: boolean = false) => {
    try {
      const updatedProduct: Product = {
        ...product,
        recipe,
        costPrice: applyCostToProduct ? parseFloat(calculatedRecipeCost.toFixed(2)) : product.costPrice,
      };

      await DatabaseService.saveProduct(updatedProduct);

      if (user) {
        await DatabaseService.logAudit({
          userId: user.id,
          userName: user.name,
          action: 'FICHA_TECNICA_ATUALIZADA',
          entity: 'PRODUCT',
          entityId: product.id,
          description: `Ficha técnica de "${product.name}" atualizada com ${recipe.length} ingredientes. Custo calculado: ${calculatedRecipeCost.toFixed(2)} MT${applyCostToProduct ? ' (Custo do produto atualizado)' : ''}.`,
          timestamp: new Date().toISOString(),
        });
      }

      success(
        'Ficha Técnica Salva!',
        applyCostToProduct
          ? `Receita salva e Preço de Custo atualizado para ${formatCurrency(calculatedRecipeCost)}.`
          : 'Receita e ingredientes atualizados com sucesso.'
      );

      onUpdated(updatedProduct);
    } catch (err: any) {
      error('Erro ao salvar receita', err.message);
    }
  };

  // --- MODIFIER GROUPS HANDLERS ---
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      warning('Atenção', 'Informe o nome do grupo de customização.');
      return;
    }

    const minSel = parseInt(newGroupMin, 10) || 0;
    const maxSel = parseInt(newGroupMax, 10) || 1;

    const newGroup: ModifierGroup = {
      id: `mod-${Date.now()}`,
      name: newGroupName.trim(),
      required: newGroupRequired,
      minSelections: minSel,
      maxSelections: maxSel,
      allowMultiple: newGroupMultiple,
      options: [],
    };

    setModifierGroups([...modifierGroups, newGroup]);
    setNewGroupName('');
    setNewGroupRequired(false);
    setNewGroupMin('0');
    setNewGroupMax('3');
    setNewGroupMultiple(true);
    setIsAddingGroup(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    setModifierGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleAddOptionToGroup = (groupId: string) => {
    if (!newOptionName.trim()) {
      warning('Atenção', 'Informe o nome da opção.');
      return;
    }

    const priceAdj = parseFloat(newOptionPrice) || 0;
    const opt: ModifierOption = {
      id: `opt-${Date.now()}`,
      name: newOptionName.trim(),
      type: newOptionType,
      priceAdjustment: priceAdj,
      ingredientId: newOptionIngredientId || undefined,
      isAvailable: true,
    };

    setModifierGroups(prev =>
      prev.map(g => (g.id === groupId ? { ...g, options: [...g.options, opt] } : g))
    );

    setNewOptionName('');
    setNewOptionPrice('0');
    setNewOptionIngredientId('');
    setAddingOptionGroupId(null);
  };

  const handleDeleteOption = (groupId: string, optionId: string) => {
    setModifierGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, options: g.options.filter(o => o.id !== optionId) }
          : g
      )
    );
  };

  // Template Quick Inserters
  const applyBurgerTemplate = () => {
    const burgerGroups: ModifierGroup[] = [
      {
        id: `mod-rem-${Date.now()}`,
        name: 'Remover Ingredientes',
        required: false,
        minSelections: 0,
        maxSelections: 5,
        allowMultiple: true,
        options: [
          { id: `opt-rem-ceb-${Date.now()}`, name: 'Sem Cebola', type: 'remove', priceAdjustment: 0 },
          { id: `opt-rem-tom-${Date.now()}`, name: 'Sem Tomate', type: 'remove', priceAdjustment: 0 },
          { id: `opt-rem-alf-${Date.now()}`, name: 'Sem Alface', type: 'remove', priceAdjustment: 0 },
          { id: `opt-rem-que-${Date.now()}`, name: 'Sem Queijo', type: 'remove', priceAdjustment: 0 },
          { id: `opt-rem-mol-${Date.now()}`, name: 'Sem Molho', type: 'remove', priceAdjustment: 0 },
        ],
      },
      {
        id: `mod-add-${Date.now()}`,
        name: 'Extras & Adicionais',
        required: false,
        minSelections: 0,
        maxSelections: 4,
        allowMultiple: true,
        options: [
          { id: `opt-add-que-${Date.now()}`, name: 'Extra Queijo Cheddar (+30 MT)', type: 'add', priceAdjustment: 30 },
          { id: `opt-add-bac-${Date.now()}`, name: 'Extra Bacon Crocante (+80 MT)', type: 'add', priceAdjustment: 80 },
          { id: `opt-add-car-${Date.now()}`, name: 'Carne Extra 150g (+100 MT)', type: 'add', priceAdjustment: 100 },
          { id: `opt-add-ovo-${Date.now()}`, name: 'Ovo Frito Estaladiço (+40 MT)', type: 'add', priceAdjustment: 40 },
          { id: `opt-add-mol-${Date.now()}`, name: 'Molho Especial à Parte (+20 MT)', type: 'add', priceAdjustment: 20 },
        ],
      },
      {
        id: `mod-pon-${Date.now()}`,
        name: 'Ponto da Carne',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        allowMultiple: false,
        options: [
          { id: `opt-pon-bem-${Date.now()}`, name: 'Bem Passada (Padrão)', type: 'choose', priceAdjustment: 0, isDefault: true },
          { id: `opt-pon-med-${Date.now()}`, name: 'Ao Ponto Suculento', type: 'choose', priceAdjustment: 0 },
          { id: `opt-pon-mal-${Date.now()}`, name: 'Mal Passada', type: 'choose', priceAdjustment: 0 },
        ],
      },
    ];

    setModifierGroups(burgerGroups);
    success('Modelo de Hambúrguer Aplicado', '3 grupos padrão foram adicionados com sucesso.');
  };

  const applyDrinkTemplate = () => {
    const drinkGroups: ModifierGroup[] = [
      {
        id: `mod-drink-${Date.now()}`,
        name: 'Preferência de Servir',
        required: false,
        minSelections: 0,
        maxSelections: 2,
        allowMultiple: true,
        options: [
          { id: `opt-gelo-${Date.now()}`, name: 'Com Gelo & Limão', type: 'choose', priceAdjustment: 0, isDefault: true },
          { id: `opt-sem-gelo-${Date.now()}`, name: 'Sem Gelo', type: 'choose', priceAdjustment: 0 },
          { id: `opt-copo-${Date.now()}`, name: 'Copo Descartável com Palha', type: 'choose', priceAdjustment: 0 },
        ],
      },
    ];
    setModifierGroups(drinkGroups);
    success('Modelo de Bebidas Aplicado', 'Opções de gelo e serviço adicionadas.');
  };

  // Save Modifiers
  const handleSaveModifiers = async () => {
    try {
      const updatedProduct: Product = {
        ...product,
        modifierGroups,
      };

      await DatabaseService.saveProduct(updatedProduct);

      if (user) {
        await DatabaseService.logAudit({
          userId: user.id,
          userName: user.name,
          action: 'MODIFICADORES_ATUALIZADOS',
          entity: 'PRODUCT',
          entityId: product.id,
          description: `Grupos de modificadores de "${product.name}" atualizados (${modifierGroups.length} grupos).`,
          timestamp: new Date().toISOString(),
        });
      }

      success('Modificadores Salvos!', 'Grupos de customização atualizados para o PDV.');
      onUpdated(updatedProduct);
    } catch (err: any) {
      error('Erro ao salvar modificadores', err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-slate-900 text-base leading-tight">
                  {product.name}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                  {product.sku}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Engenharia de Cardápio: Ficha Técnica de Insumos &amp; Modificadores de Customização
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white px-5 text-xs font-bold gap-3">
          <button
            onClick={() => setActiveTab('recipe')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'recipe'
                ? 'border-orange-600 text-orange-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-orange-600" />
            <span>Ficha Técnica &amp; Food Cost ({recipe.length} insumos)</span>
          </button>

          <button
            onClick={() => setActiveTab('modifiers')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'modifiers'
                ? 'border-orange-600 text-orange-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-orange-600" />
            <span>Grupos de Modificadores &amp; Extras ({modifierGroups.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* TAB 1: FICHA TÉCNICA (RECEITA) */}
          {activeTab === 'recipe' && (
            <div className="space-y-6">
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Custo Insumos (Food Cost)
                  </span>
                  <span className="text-base font-black font-mono text-slate-900 mt-1">
                    {formatCurrency(calculatedRecipeCost)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Soma da receita</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800">
                    Preço de Venda
                  </span>
                  <span className="text-base font-black font-mono text-orange-950 mt-1">
                    {formatCurrency(sellingPrice)}
                  </span>
                  <span className="text-[10px] text-orange-600 mt-0.5">Definido no cardápio</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Food Cost (CMV %)
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-base font-black font-mono text-slate-900">
                      {foodCostPercent.toFixed(1)}%
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                        foodCostPercent <= 30
                          ? 'bg-emerald-100 text-emerald-800'
                          : foodCostPercent <= 40
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {foodCostPercent <= 30 ? 'Ótimo' : foodCostPercent <= 40 ? 'Bom' : 'Atenção'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">Meta ideal: 25% a 35%</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Lucro Bruto Teórico
                  </span>
                  <span className="text-base font-black font-mono text-emerald-950 mt-1">
                    +{formatCurrency(theoreticalProfit)}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold mt-0.5">
                    Margem: {grossMarginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Add Ingredient Form Bar */}
              <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-200 space-y-3">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-orange-600" />
                    <span>Adicionar Insumo à Receita</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {ingredients.length} insumos disponíveis no estoque
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ingrediente / Matéria-Prima
                    </label>
                    <select
                      value={selectedIngredientId}
                      onChange={e => setSelectedIngredientId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 focus:outline-hidden cursor-pointer"
                    >
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit}) — Custo: {formatCurrency(ing.costPerUnit)}/{ing.unit} (Estoque: {ing.currentStock} {ing.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Quantidade Usada
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        value={ingredientQuantity}
                        onChange={e => setIngredientQuantity(e.target.value)}
                        placeholder="Ex: 150 ou 1"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400">
                        {ingredients.find(i => i.id === selectedIngredientId)?.unit || 'un'}
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddIngredientToRecipe}
                      className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Inserir Insumo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recipe Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-bold text-slate-700">
                  <span>Itens da Ficha Técnica ({recipe.length})</span>
                  <span className="font-mono text-xs text-orange-950 font-black">
                    Total Custo: {formatCurrency(calculatedRecipeCost)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-4">Ingrediente</th>
                        <th className="py-2.5 px-4 text-center">Quantidade</th>
                        <th className="py-2.5 px-4 text-right">Custo Unitário</th>
                        <th className="py-2.5 px-4 text-right">Custo na Receita</th>
                        <th className="py-2.5 px-4 text-center">% do Custo</th>
                        <th className="py-2.5 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recipe.map((item, index) => {
                        const ing = ingredients.find(i => i.id === item.ingredientId);
                        const unitCost = ing ? ing.costPerUnit : (item.costContribution ? item.costContribution / item.quantity : 0);
                        const itemCost = item.quantity * unitCost;
                        const sharePercent = calculatedRecipeCost > 0 ? (itemCost / calculatedRecipeCost) * 100 : 0;

                        return (
                          <tr key={item.ingredientId || index} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-slate-900 block">{item.ingredientName}</span>
                              {ing && (
                                <span className="text-[10px] text-slate-400">
                                  Categoria: {ing.category || 'Geral'} • Estoque: {ing.currentStock} {ing.unit}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                              {formatCurrency(unitCost)}/{item.unit}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                              {formatCurrency(itemCost)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {sharePercent.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRecipeItem(index)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remover da receita"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {recipe.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Nenhum ingrediente adicionado a esta receita. Use o formulário acima para compor a ficha técnica.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recipe Action CTAs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <Info className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>
                    Ao aplicar o custo da receita, o Preço de Custo cadastral do produto ({formatCurrency(product.costPrice)}) será recalculado para {formatCurrency(calculatedRecipeCost)}.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveRecipe(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    Salvar Receita
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveRecipe(true)}
                    className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar &amp; Atualizar Custo do Produto</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GRUPOS DE MODIFICADORES & EXTRAS */}
          {activeTab === 'modifiers' && (
            <div className="space-y-6">
              {/* Quick Template Inserter Bar */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-bold text-amber-950">Modelos Rápidos de Customização</div>
                    <div className="text-[11px] text-amber-800">
                      Gere automaticamente grupos de remoção, extras pagos e ponto da carne com 1 clique.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={applyBurgerTemplate}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    🍔 Modelo Hambúrguer
                  </button>
                  <button
                    type="button"
                    onClick={applyDrinkTemplate}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    🥤 Modelo Bebidas
                  </button>
                </div>
              </div>

              {/* Add New Group Button / Form */}
              {!isAddingGroup ? (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">
                    Grupos de Customização Configurados ({modifierGroups.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingGroup(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Novo Grupo</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-300 space-y-3">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Novo Grupo de Customização</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingGroup(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Nome do Grupo
                      </label>
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        placeholder="Ex: Extras & Adicionais, Ponto da Carne..."
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Mínimo Seleções
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newGroupMin}
                        onChange={e => setNewGroupMin(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Máximo Seleções
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newGroupMax}
                        onChange={e => setNewGroupMax(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={newGroupRequired}
                        onChange={e => setNewGroupRequired(e.target.checked)}
                        className="w-4 h-4 text-orange-600 rounded"
                      />
                      <span>Escolha Obrigatória (bloqueia se não escolher)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={newGroupMultiple}
                        onChange={e => setNewGroupMultiple(e.target.checked)}
                        className="w-4 h-4 text-orange-600 rounded"
                      />
                      <span>Permitir Múltiplas Escolhas</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingGroup(false)}
                      className="px-3 py-1.5 border border-slate-300 rounded-xl text-slate-600 font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateGroup}
                      className="px-4 py-1.5 bg-orange-600 text-white font-bold rounded-xl cursor-pointer"
                    >
                      Criar Grupo
                    </button>
                  </div>
                </div>
              )}

              {/* List of Existing Modifier Groups */}
              <div className="space-y-4">
                {modifierGroups.map(group => (
                  <div
                    key={group.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    {/* Group Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{group.name}</span>
                        {group.required ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                            Obrigatório (Mín: {group.minSelections})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                            Opcional (Até {group.maxSelections})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAddingOptionGroupId(group.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar Opção</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Excluir grupo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Add Option Form */}
                    {addingOptionGroupId === group.id && (
                      <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200 space-y-2.5">
                        <div className="font-bold text-orange-950 text-[11px] flex items-center justify-between">
                          <span>Nova Opção para "{group.name}"</span>
                          <button
                            type="button"
                            onClick={() => setAddingOptionGroupId(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-5">
                            <input
                              type="text"
                              value={newOptionName}
                              onChange={e => setNewOptionName(e.target.value)}
                              placeholder="Nome (Ex: Extra Queijo Cheddar)"
                              className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <select
                              value={newOptionType}
                              onChange={e => setNewOptionType(e.target.value as ModifierType)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium cursor-pointer"
                            >
                              <option value="add">Adicional (+ Preço)</option>
                              <option value="remove">Remoção (Sem custo)</option>
                              <option value="choose">Escolha / Variação</option>
                              <option value="substitute">Substituição</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <input
                              type="number"
                              step="any"
                              value={newOptionPrice}
                              onChange={e => setNewOptionPrice(e.target.value)}
                              placeholder="+ MT"
                              className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={() => handleAddOptionToGroup(group.id)}
                              className="w-full py-2 bg-orange-600 text-white font-bold rounded-xl cursor-pointer"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Options list in group */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.options.map(opt => (
                        <div
                          key={opt.id}
                          className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                opt.type === 'remove'
                                  ? 'bg-rose-500'
                                  : opt.priceAdjustment > 0
                                  ? 'bg-emerald-500'
                                  : 'bg-blue-500'
                              }`}
                            />
                            <span className="font-bold text-slate-800">{opt.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold text-[11px] ${
                                opt.priceAdjustment > 0 ? 'text-emerald-700' : 'text-slate-500'
                              }`}
                            >
                              {opt.priceAdjustment > 0
                                ? `+${formatCurrency(opt.priceAdjustment)}`
                                : '0 MT'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(group.id, opt.id)}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {group.options.length === 0 && (
                        <div className="col-span-2 py-4 text-center text-slate-400">
                          Nenhuma opção neste grupo. Clique em "Adicionar Opção" acima.
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {modifierGroups.length === 0 && (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                    Nenhum grupo de modificador configurado para este produto.
                    <div className="mt-2 text-xs text-slate-500">
                      Utilize os botões de modelos rápidos acima ou crie um grupo personalizado.
                    </div>
                  </div>
                )}
              </div>

              {/* Modifiers Save CTA */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveModifiers}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Modificadores do Produto</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
