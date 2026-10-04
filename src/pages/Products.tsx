import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  Barcode,
  Tag,
  CheckCircle,
  XCircle,
  X,
  Layers,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Upload,
  Percent,
  TrendingUp,
  Ban,
  ArrowUpDown,
  Image as ImageIcon,
  DollarSign,
  Palette,
  Smile,
  Info,
  UtensilsCrossed
} from 'lucide-react';
import { DatabaseService } from '../services/db';
import { Product, Category, Ingredient, UnitOfMeasure } from '../types';
import { formatCurrency, generateSku } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ProductIllustration } from '../components/ProductIllustration';
import { RecipeModifiersModal } from '../components/modals/RecipeModifiersModal';

// Preset appetizing food & drink photos for quick 1-click selection
const FOOD_PHOTO_PRESETS = [
  {
    name: 'Hambúrguer Clássico c/ Queijo',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    color: '#FEF3C7',
  },
  {
    name: 'Hambúrguer Duplo Cheddar',
    url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
    color: '#FFEDD5',
  },
  {
    name: 'Hambúrguer de Frango Crispy',
    url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80',
    color: '#FEF9C3',
  },
  {
    name: 'Prego no Pão com Ovo',
    url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    color: '#FFEDD5',
  },
  {
    name: 'Batata Frita Crocante',
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
    color: '#FEF3C7',
  },
  {
    name: 'Asas de Frango Frito Picante',
    url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
    color: '#FEE2E2',
  },
  {
    name: 'Pizza Pepperoni Artesanal',
    url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
    color: '#FEE2E2',
  },
  {
    name: 'Pizza Margherita com Manjericão',
    url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
    color: '#FEF3C7',
  },
  {
    name: 'Coca-Cola Lata Gelada',
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    color: '#FEE2E2',
  },
  {
    name: 'Cerveja 2M Moçambique',
    url: 'https://images.unsplash.com/photo-1608270146059-e93bf0ffda65?auto=format&fit=crop&w=600&q=80',
    color: '#FEF3C7',
  },
  {
    name: 'Cappuccino com Canela',
    url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
    color: '#F5F5F4',
  },
  {
    name: 'Milkshake / Sundae Doce',
    url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    color: '#FCE7F3',
  },
];

const EMOJI_OPTIONS = ['🍔', '🍕', '🍟', '🍗', '🥪', '🥩', '🥤', '🍺', '☕', '🍰', '🍦', '🥗', '🔥', '⭐', '🌮', '🍣'];
const COLOR_OPTIONS = ['orange', 'red', 'amber', 'yellow', 'blue', 'emerald', 'purple', 'rose'];

export const Products: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: Cards Grandes (grid) vs Tabela Detalhada (table)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [show86Only, setShow86Only] = useState(false);
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'price_desc' | 'price_asc' | 'margin_desc' | 'stock_asc'>('order');

  // Tabs
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'ingredients'>('products');

  // Ingredients Filters
  const [ingredientCategoryFilter, setIngredientCategoryFilter] = useState('all');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [showIngredient86Only, setShowIngredient86Only] = useState(false);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [is86ModalOpen, setIs86ModalOpen] = useState(false);
  const [productFor86, setProductFor86] = useState<Product | null>(null);
  const [reason86, setReason86] = useState('');

  // Recipe & Modifiers Modal
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedProductForRecipe, setSelectedProductForRecipe] = useState<Product | null>(null);

  // Ingredient Modal & State
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingName, setIngName] = useState('');
  const [ingCategory, setIngCategory] = useState('Carnes');
  const [ingUnit, setIngUnit] = useState<UnitOfMeasure>('un');
  const [ingCostPerUnit, setIngCostPerUnit] = useState('');
  const [ingCurrentStock, setIngCurrentStock] = useState('');
  const [ingMinStock, setIngMinStock] = useState('20');
  const [ingSupplierName, setIngSupplierName] = useState('Distribuidora Alimentar de Maputo');
  const [ingStatus, setIngStatus] = useState<'active' | 'inactive'>('active');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Product Form state
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('KOMA');
  const [unit, setUnit] = useState('un');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('10');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [image, setImage] = useState('');
  const [imageBgColor, setImageBgColor] = useState('');
  const [isFoodItem, setIsFoodItem] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number>(1);

  // Category Form state
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🍔');
  const [catColor, setCatColor] = useState('orange');
  const [catDesc, setCatDesc] = useState('');
  const [catStatus, setCatStatus] = useState<'active' | 'inactive'>('active');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [prods, cats, ings] = await Promise.all([
        DatabaseService.getProducts(),
        DatabaseService.getCategories(),
        DatabaseService.getIngredients(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setIngredients(ings);
    } catch (err) {
      console.error('Error loading products/categories/ingredients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // --- Real-time Margin Calculations for Form ---
  const costNum = parseFloat(costPrice) || 0;
  const sellNum = parseFloat(sellingPrice) || 0;
  const profitNominal = sellNum - costNum;
  const marginPercent = sellNum > 0 ? ((sellNum - costNum) / sellNum) * 100 : 0;
  const markupPercent = costNum > 0 ? ((sellNum - costNum) / costNum) * 100 : 0;

  // Suggested Price helper based on target margin
  const applySuggestedMargin = (targetMarginPercent: number) => {
    if (costNum <= 0) return;
    const suggestedPrice = costNum / (1 - targetMarginPercent / 100);
    // Round to nearest integer or 5 MT for restaurant convenience
    const rounded = Math.round(suggestedPrice / 5) * 5;
    setSellingPrice(rounded.toString());
  };

  // Image Upload handler via FileReader
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      warning('Arquivo Grande', 'Recomendamos fotos de até 2MB para carregamento veloz no PDV.');
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSeedDemoProducts = async () => {
    try {
      setLoading(true);
      await DatabaseService.seedDemoProducts();
      await loadAll();
      success(
        'Cardápio de Teste Carregado!',
        'Todas as 7 categorias e mais de 40 produtos visuais foram sincronizados.'
      );
    } catch (err: any) {
      error('Erro ao carregar cardápio', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    const newSku = generateSku('PRD', products.length + 1);
    setSku(newSku);
    setBarcode(`${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 9000 + 1000)}`);
    setName('');
    setDescription('');
    setCategoryId(categories[0]?.id || 'cat-burgers');
    setBrand('KOMA');
    setUnit('un');
    setCostPrice('');
    setSellingPrice('');
    setCurrentStock('50');
    setMinStock('10');
    setStatus('active');
    setImage('');
    setImageBgColor('#FEF3C7');
    setIsFoodItem(true);
    setIsFavorite(false);
    setIsBestSeller(false);
    setDisplayOrder(products.length + 1);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setSku(prod.sku);
    setBarcode(prod.barcode);
    setName(prod.name);
    setDescription(prod.description || '');
    setCategoryId(prod.categoryId);
    setBrand(prod.brand || 'KOMA');
    setUnit(prod.unit);
    setCostPrice(prod.costPrice.toString());
    setSellingPrice(prod.sellingPrice.toString());
    setCurrentStock(prod.currentStock.toString());
    setMinStock(prod.minStock.toString());
    setStatus(prod.status);
    setImage(prod.image || '');
    setImageBgColor(prod.imageBgColor || '#FEF3C7');
    setIsFoodItem(prod.isFoodItem ?? true);
    setIsFavorite(Boolean(prod.isFavorite));
    setIsBestSeller(Boolean(prod.isBestSeller));
    setDisplayOrder(prod.displayOrder || 1);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      warning('Atenção', 'O nome do produto é obrigatório.');
      return;
    }

    const cost = parseFloat(costPrice) || 0;
    const sell = parseFloat(sellingPrice) || 0;

    if (sell < cost) {
      warning('Alerta de Margem Negativa', 'O preço de venda é menor que o custo. Esta venda dará prejuízo.');
    }

    const selectedCat = categories.find(c => c.id === categoryId);

    const productData: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      sku: sku.trim(),
      barcode: barcode.trim(),
      name: name.trim(),
      description: description.trim(),
      categoryId: categoryId || 'cat-burgers',
      categoryName: selectedCat ? selectedCat.name : 'Diversos',
      brand: brand.trim(),
      unit,
      costPrice: cost,
      sellingPrice: sell,
      currentStock: parseFloat(currentStock) || 0,
      minStock: parseFloat(minStock) || 5,
      status,
      image: image.trim() || undefined,
      imageBgColor: imageBgColor.trim() || undefined,
      isFoodItem,
      isFavorite,
      isBestSeller,
      displayOrder,
      is86: editingProduct?.is86 || false,
      is86Reason: editingProduct?.is86Reason,
      is86By: editingProduct?.is86By,
      is86At: editingProduct?.is86At,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    try {
      await DatabaseService.saveProduct(productData);

      if (user) {
        await DatabaseService.logAudit({
          userId: user.id,
          userName: user.name,
          action: editingProduct ? 'PRODUTO_ATUALIZADO' : 'PRODUTO_CRIADO',
          entity: 'PRODUCT',
          entityId: productData.id,
          description: `${editingProduct ? 'Atualização' : 'Cadastro'} de "${productData.name}" (${productData.sku}) - Venda: ${productData.sellingPrice} MT, Custo: ${productData.costPrice} MT (Margem: ${marginPercent.toFixed(1)}%)`,
          timestamp: new Date().toISOString(),
        });
      }

      success('Produto Salvo!', `"${productData.name}" foi salvo com sucesso.`);
      setIsProductModalOpen(false);
      await loadAll();
    } catch (err: any) {
      error('Erro ao salvar produto', err.message);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${prod.name}" do cardápio?`)) return;

    try {
      await DatabaseService.deleteProduct(prod.id);
      success('Produto Excluído', `"${prod.name}" foi removido do catálogo.`);
      await loadAll();
    } catch (err: any) {
      error('Erro ao excluir', err.message);
    }
  };

  // --- Toggle 86 (Esgotado) with audit & modal ---
  const handleOpen86Modal = (prod: Product) => {
    setProductFor86(prod);
    setReason86(prod.is86Reason || 'Acabou ingrediente na cozinha');
    setIs86ModalOpen(true);
  };

  const handleConfirmToggle86 = async (newStatus: boolean) => {
    if (!productFor86 || !user) return;

    try {
      await DatabaseService.toggleProduct86(
        productFor86.id,
        newStatus,
        user,
        newStatus ? reason86 : undefined
      );

      success(
        newStatus ? 'Produto Marcado como 86 (Esgotado)' : 'Produto Reativado como Disponível',
        newStatus
          ? `"${productFor86.name}" foi bloqueado no PDV e cozinha.`
          : `"${productFor86.name}" está novamente liberado para vendas.`
      );

      setIs86ModalOpen(false);
      await loadAll();
    } catch (err: any) {
      error('Erro ao alterar status 86', err.message);
    }
  };

  // --- Category Actions ---
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatIcon('🍔');
    setCatColor('orange');
    setCatDesc('');
    setCatStatus('active');
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatIcon(cat.icon || '🍔');
    setCatColor(cat.color || 'orange');
    setCatDesc(cat.description || '');
    setCatStatus(cat.status);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      warning('Atenção', 'O nome da categoria é obrigatório.');
      return;
    }

    const catData: Category = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      name: catName.trim(),
      icon: catIcon,
      color: catColor,
      description: catDesc.trim(),
      status: catStatus,
    };

    try {
      await DatabaseService.saveCategory(catData);
      success('Categoria Salva', `"${catData.name}" foi atualizada com sucesso.`);
      setIsCategoryModalOpen(false);
      await loadAll();
    } catch (err: any) {
      error('Erro ao salvar categoria', err.message);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    const attachedProds = products.filter(p => p.categoryId === cat.id);
    if (attachedProds.length > 0) {
      warning(
        'Categoria em Uso',
        `Esta categoria possui ${attachedProds.length} produto(s) associados. Transfira os produtos antes de excluir.`
      );
      return;
    }

    if (!window.confirm(`Excluir a categoria "${cat.name}"?`)) return;
    try {
      await DatabaseService.deleteCategory(cat.id);
      success('Categoria Excluída', `"${cat.name}" foi removida.`);
      await loadAll();
    } catch (err: any) {
      error('Erro ao excluir', err.message);
    }
  };

  // --- RECIPE & MODIFIERS MODAL HANDLER ---
  const openRecipeModal = (prod: Product) => {
    setSelectedProductForRecipe(prod);
    setIsRecipeModalOpen(true);
  };

  const handleProductUpdatedFromRecipe = (updatedProd: Product) => {
    setProducts(prev => prev.map(p => (p.id === updatedProd.id ? updatedProd : p)));
    if (selectedProductForRecipe?.id === updatedProd.id) {
      setSelectedProductForRecipe(updatedProd);
    }
  };

  // --- INGREDIENTS HANDLERS ---
  const openNewIngredientModal = () => {
    setEditingIngredient(null);
    setIngName('');
    setIngCategory('Carnes');
    setIngUnit('un');
    setIngCostPerUnit('');
    setIngCurrentStock('100');
    setIngMinStock('20');
    setIngSupplierName('Distribuidora Alimentar de Maputo');
    setIngStatus('active');
    setIsIngredientModalOpen(true);
  };

  const openEditIngredientModal = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setIngName(ing.name);
    setIngCategory(ing.category || 'Geral');
    setIngUnit(ing.unit);
    setIngCostPerUnit(ing.costPerUnit.toString());
    setIngCurrentStock(ing.currentStock.toString());
    setIngMinStock(ing.minStock.toString());
    setIngSupplierName(ing.supplierName || '');
    setIngStatus(ing.status);
    setIsIngredientModalOpen(true);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName.trim()) {
      warning('Atenção', 'Informe o nome do ingrediente.');
      return;
    }

    const cost = parseFloat(ingCostPerUnit) || 0;
    const stock = parseFloat(ingCurrentStock) || 0;
    const minStk = parseFloat(ingMinStock) || 0;

    const ingData: Ingredient = {
      id: editingIngredient ? editingIngredient.id : `ing-${Date.now()}`,
      name: ingName.trim(),
      category: ingCategory,
      unit: ingUnit,
      costPerUnit: cost,
      currentStock: stock,
      minStock: minStk,
      supplierName: ingSupplierName.trim() || undefined,
      isAvailable: editingIngredient ? editingIngredient.isAvailable : true,
      status: ingStatus,
      createdAt: editingIngredient ? editingIngredient.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await DatabaseService.saveIngredient(ingData);

      if (user) {
        await DatabaseService.logAudit({
          userId: user.id,
          userName: user.name,
          action: editingIngredient ? 'INGREDIENTE_ATUALIZADO' : 'INGREDIENTE_CRIADO',
          entity: 'INGREDIENT',
          entityId: ingData.id,
          description: `${editingIngredient ? 'Edição' : 'Cadastro'} de insumo "${ingData.name}" (${ingData.unit}) - Custo: ${ingData.costPerUnit} MT/${ingData.unit}.`,
          timestamp: new Date().toISOString(),
        });
      }

      success('Insumo Salvo!', `"${ingData.name}" foi salvo com sucesso.`);
      setIsIngredientModalOpen(false);
      await loadAll();
    } catch (err: any) {
      error('Erro ao salvar insumo', err.message);
    }
  };

  const handleDeleteIngredient = async (ing: Ingredient) => {
    const usedIn = products.filter(p => p.recipe?.some(r => r.ingredientId === ing.id));
    if (usedIn.length > 0) {
      warning(
        'Ingrediente em Uso',
        `Este ingrediente está em uso na receita de ${usedIn.length} produto(s) (${usedIn.map(p => p.name).slice(0, 2).join(', ')}...). Remova-o das fichas técnicas antes de excluir.`
      );
      return;
    }

    if (!window.confirm(`Excluir o ingrediente "${ing.name}"?`)) return;

    try {
      await DatabaseService.deleteIngredient(ing.id);
      success('Ingrediente Excluído', `"${ing.name}" foi removido do estoque.`);
      await loadAll();
    } catch (err: any) {
      error('Erro ao excluir', err.message);
    }
  };

  const handleToggleIngredient86 = async (ing: Ingredient) => {
    if (!user) return;
    try {
      await DatabaseService.toggleIngredient86(ing.id, !ing.isAvailable, user);
      success(
        !ing.isAvailable ? 'Ingrediente Disponível' : 'Ingrediente Marcado como 86',
        `Status de "${ing.name}" alterado para ${!ing.isAvailable ? 'Disponível' : 'Esgotado (86)'}.`
      );
      await loadAll();
    } catch (err: any) {
      error('Erro ao alterar status', err.message);
    }
  };

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    const q = ingredientSearch.toLowerCase().trim();
    return ingredients.filter(ing => {
      const matchCat = ingredientCategoryFilter === 'all' || ing.category === ingredientCategoryFilter;
      const match86 = !showIngredient86Only || !ing.isAvailable;
      const matchQuery = !q || ing.name.toLowerCase().includes(q) || ing.category?.toLowerCase().includes(q) || ing.supplierName?.toLowerCase().includes(q);
      return matchCat && match86 && matchQuery;
    });
  }, [ingredients, ingredientSearch, ingredientCategoryFilter, showIngredient86Only]);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = products.filter(p => {
      const matchCat = categoryFilter === 'all' || p.categoryId === categoryFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchLowStock = !showLowStockOnly || p.currentStock <= p.minStock;
      const match86 = !show86Only || p.is86 === true;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q));

      return matchCat && matchStatus && matchLowStock && match86 && matchQuery;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'order') return (a.displayOrder || 999) - (b.displayOrder || 999);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price_desc') return b.sellingPrice - a.sellingPrice;
      if (sortBy === 'price_asc') return a.sellingPrice - b.sellingPrice;
      if (sortBy === 'margin_desc') {
        const marginA = a.sellingPrice > 0 ? (a.sellingPrice - a.costPrice) / a.sellingPrice : 0;
        const marginB = b.sellingPrice > 0 ? (b.sellingPrice - b.costPrice) / b.sellingPrice : 0;
        return marginB - marginA;
      }
      if (sortBy === 'stock_asc') return a.currentStock - b.currentStock;
      return 0;
    });

    return result;
  }, [products, searchQuery, categoryFilter, statusFilter, showLowStockOnly, show86Only, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            <span>Catálogo, Produtos Visuais &amp; Cardápio</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre itens com fotos de alta qualidade, acompanhe margem de lucro automática e controle o status 86 (Esgotado).
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleSeedDemoProducts}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Carregar catálogo completo com 40+ produtos de teste e fotos"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Restaurar Cardápio Padrão</span>
          </button>

          {activeTab === 'products' ? (
            <button
              onClick={openNewProductModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          ) : activeTab === 'categories' ? (
            <button
              onClick={openNewCategoryModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Categoria</span>
            </button>
          ) : (
            <button
              onClick={openNewIngredientModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Insumo</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold justify-between items-center">
        <div className="flex">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'border-orange-600 text-orange-950 bg-white rounded-t-xl font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4 text-orange-600" />
            <span>Produtos &amp; Cardápio ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-5 py-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'border-orange-600 text-orange-950 bg-white rounded-t-xl font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-orange-600" />
            <span>Categorias ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-5 py-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ingredients'
                ? 'border-orange-600 text-orange-950 bg-white rounded-t-xl font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-orange-600" />
            <span>Ingredientes &amp; Insumos ({ingredients.length})</span>
          </button>
        </div>

        {/* View Mode Toggle: Cards Grandes vs Tabela */}
        {activeTab === 'products' && (
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white shadow-xs text-orange-900 border border-orange-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Cards Grandes com Fotos"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-orange-600" />
              <span>Cards Grandes</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white shadow-xs text-orange-900 border border-orange-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Tabela Detalhada"
            >
              <TableIcon className="w-3.5 h-3.5 text-orange-600" />
              <span>Tabela Detalhada</span>
            </button>
          </div>
        )}
      </div>

      {/* PRODUCTS TAB CONTENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Quick Category Chips for Fast Filtering */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
                categoryFilter === 'all'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Todos os Grupos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-mono">
                {products.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              const isSelected = categoryFilter === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.icon || '🍔'}</span>
                  <span>{cat.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por Nome, SKU, Código de Barras ou Marca..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs items-center">
              {/* Sort selector */}
              <div className="flex items-center gap-1.5 border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white">
                <ArrowUpDown className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
                >
                  <option value="order">Ordem no Cardápio</option>
                  <option value="name">Nome (A - Z)</option>
                  <option value="price_desc">Maior Preço Venda</option>
                  <option value="price_asc">Menor Preço Venda</option>
                  <option value="margin_desc">Maior Margem Lucro (%)</option>
                  <option value="stock_asc">Menor Estoque</option>
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-700 font-semibold cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>

              {/* Toggle 86 Filter */}
              <button
                type="button"
                onClick={() => setShow86Only(!show86Only)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  show86Only
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
                title="Filtrar produtos marcados como 86 (Esgotados)"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>86 (Esgotados)</span>
              </button>

              {/* Toggle Low Stock */}
              <button
                type="button"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showLowStockOnly
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Estoque Baixo</span>
              </button>
            </div>
          </div>

          {/* VIEW: CARDS GRANDES COM FOTOS */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100 : 0;
                const profitNom = p.sellingPrice - p.costPrice;
                const is86 = Boolean(p.is86);
                const isLowStock = p.currentStock <= p.minStock;

                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between ${
                      is86
                        ? 'border-rose-300 ring-2 ring-rose-200 bg-rose-50/20'
                        : 'border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    <div>
                      {/* Photo / Illustration Banner */}
                      <div className="h-44 relative bg-slate-100 flex items-center justify-center overflow-hidden group">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                              is86 ? 'grayscale opacity-75' : ''
                            }`}
                          />
                        ) : (
                          <ProductIllustration
                            productName={p.name}
                            sku={p.sku}
                            imageUrl={p.image}
                            categoryName={p.categoryName}
                            size="lg"
                          />
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {is86 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs animate-pulse">
                              86 • ESGOTADO
                            </span>
                          )}
                          {p.isBestSeller && !is86 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                              ⭐ Mais Vendido
                            </span>
                          )}
                        </div>

                        {/* Category tag */}
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                          {p.categoryName || 'Diversos'}
                        </span>

                        {/* Quick 86 Button Overlay */}
                        <button
                          type="button"
                          onClick={() => handleOpen86Modal(p)}
                          className={`absolute top-2 right-2 px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider border shadow-md transition-all cursor-pointer ${
                            is86
                              ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                              : 'bg-white/95 text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 backdrop-blur-xs'
                          }`}
                          title={is86 ? 'Clique para reativar produto' : 'Clique para marcar como 86 (Esgotado)'}
                        >
                          {is86 ? '86 Ativo' : 'Marcar 86'}
                        </button>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span className="font-bold text-slate-500">{p.sku}</span>
                          <span className="flex items-center gap-1">
                            <Barcode className="w-3 h-3" />
                            <span>{p.barcode}</span>
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight">
                          {p.name}
                        </h3>

                        {p.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {p.description}
                          </p>
                        )}

                        {/* Margin & Pricing Panel */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Venda:</span>
                            <span className="font-black text-orange-950 text-base font-mono">
                              {formatCurrency(p.sellingPrice)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Custo: {formatCurrency(p.costPrice)}</span>
                            <span>Lucro: +{formatCurrency(profitNom)}</span>
                          </div>

                          {/* Margin Pill */}
                          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Margem Bruta
                            </span>
                            <span
                              className={`text-[11px] font-black px-2 py-0.2 rounded-md ${
                                margin >= 50
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : margin >= 25
                                  ? 'bg-blue-100 text-blue-800'
                                  : margin > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              +{margin.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {/* Stock status indicator */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500 text-[11px]">Estoque:</span>
                          <span
                            className={`font-bold font-mono px-2 py-0.5 rounded-full text-[11px] ${
                              isLowStock
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {p.currentStock} {p.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {p.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openRecipeModal(p)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg border border-transparent hover:border-orange-200 transition-colors cursor-pointer"
                          title="Ficha Técnica & Modificadores de Customização"
                        >
                          <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditProductModal(p)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                          title="Editar Produto"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="Excluir Produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW: TABELA DETALHADA */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Código / SKU</th>
                      <th className="py-3 px-4">Produto</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4 text-right">Preço Custo</th>
                      <th className="py-3 px-4 text-right">Preço Venda</th>
                      <th className="py-3 px-4 text-center">Margem Bruta</th>
                      <th className="py-3 px-4 text-center">Estoque Atual</th>
                      <th className="py-3 px-4 text-center">Status 86</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredProducts.map((p) => {
                      const isLowStock = p.currentStock <= p.minStock;
                      const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100 : 0;
                      const is86 = Boolean(p.is86);

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/70 transition-colors ${is86 ? 'bg-rose-50/30' : ''}`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            <div>{p.sku}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Barcode className="w-3 h-3" /> {p.barcode}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <ProductIllustration
                                  productName={p.name}
                                  sku={p.sku}
                                  imageUrl={p.image}
                                  categoryName={p.categoryName}
                                  size="sm"
                                  className="w-10 h-10"
                                />
                              )}
                              <div>
                                <div className="font-bold text-slate-900">{p.name}</div>
                                {p.brand && <div className="text-[11px] text-slate-400">{p.brand}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                              {p.categoryName || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">
                            {formatCurrency(p.costPrice)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="font-black font-mono text-orange-950 text-sm">
                              {formatCurrency(p.sellingPrice)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                                margin >= 50
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : margin >= 25
                                  ? 'bg-blue-100 text-blue-800'
                                  : margin > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              +{margin.toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isLowStock
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {isLowStock && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                              {p.currentStock} {p.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpen86Modal(p)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer border ${
                                is86
                                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-rose-100 hover:text-rose-800'
                              }`}
                            >
                              {is86 ? '86 • Esgotado' : 'Disponível'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openRecipeModal(p)}
                                className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                title="Ficha Técnica & Modificadores de Customização"
                              >
                                <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                              </button>
                              <button
                                onClick={() => openEditProductModal(p)}
                                className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Editar Produto"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir Produto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          Nenhum produto encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CATEGORIES TAB CONTENT */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((c) => {
              const count = products.filter((p) => p.categoryId === c.id).length;

              return (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100/70 border border-orange-200 text-2xl flex items-center justify-center shadow-2xs">
                        {c.icon || '🍔'}
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.status === 'active' ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>

                    <h3 className="font-black text-slate-900 text-base">{c.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {c.description || 'Categoria de produtos gastronômicos do KOMA Fast Food.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {count} {count === 1 ? 'produto' : 'produtos'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditCategoryModal(c)}
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Editar Categoria"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INGREDIENTS & RAW MATERIALS TAB CONTENT */}
      {activeTab === 'ingredients' && (
        <div className="space-y-4">
          {/* Quick Stats Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total de Insumos
              </span>
              <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
                {ingredients.length}
              </span>
              <span className="text-[10px] text-slate-500">Matérias-primas e insumos</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Insumos Ativos
              </span>
              <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">
                {ingredients.filter(i => i.isAvailable && i.status === 'active').length}
              </span>
              <span className="text-[10px] text-emerald-600">Liberados para cozinha</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Insumos em 86 (Falta)
              </span>
              <span className="text-xl font-black font-mono text-rose-700 mt-1 block">
                {ingredients.filter(i => !i.isAvailable).length}
              </span>
              <span className="text-[10px] text-rose-600">Esgotados temporariamente</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Alerta Estoque Mínimo
              </span>
              <span className="text-xl font-black font-mono text-amber-700 mt-1 block">
                {ingredients.filter(i => i.currentStock <= i.minStock).length}
              </span>
              <span className="text-[10px] text-amber-600">Abaixo da margem segura</span>
            </div>
          </div>

          {/* Quick Category Chips for Fast Filtering */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setIngredientCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
                ingredientCategoryFilter === 'all'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Todos os Insumos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-mono">
                {ingredients.length}
              </span>
            </button>

            {Array.from(new Set(ingredients.map(i => i.category || 'Geral'))).map((catName) => {
              const count = ingredients.filter(i => (i.category || 'Geral') === catName).length;
              const isSelected = ingredientCategoryFilter === catName;

              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setIngredientCategoryFilter(catName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{catName}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                placeholder="Buscar insumo por nome, categoria ou fornecedor..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs items-center">
              <button
                type="button"
                onClick={() => setShowIngredient86Only(!showIngredient86Only)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showIngredient86Only
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>86 (Esgotados)</span>
              </button>
            </div>
          </div>

          {/* Ingredients Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Insumo &amp; Fornecedor</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-center">Unidade</th>
                    <th className="py-3 px-4 text-right">Custo Unitário</th>
                    <th className="py-3 px-4 text-center">Estoque Atual</th>
                    <th className="py-3 px-4 text-center">Estoque Mínimo</th>
                    <th className="py-3 px-4 text-center">Status 86</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredIngredients.map((ing) => {
                    const isLowStock = ing.currentStock <= ing.minStock;

                    return (
                      <tr
                        key={ing.id}
                        className={`hover:bg-slate-50/70 transition-colors ${!ing.isAvailable ? 'bg-rose-50/30' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block text-xs">{ing.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {ing.supplierName || 'Distribuidora Geral'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {ing.category || 'Geral'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                          {ing.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(ing.costPerUnit)} / {ing.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                              isLowStock
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                            {ing.currentStock} {ing.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {ing.minStock} {ing.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleIngredient86(ing)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                              !ing.isAvailable
                                ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-rose-100 hover:text-rose-800'
                            }`}
                          >
                            {!ing.isAvailable ? '86 • Esgotado' : 'Disponível'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditIngredientModal(ing)}
                              className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Editar Insumo"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteIngredient(ing)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Insumo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredIngredients.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Nenhum insumo encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT FORM MODAL (With Margin Calculator, Photo Upload & Presets) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-600" />
                <span>{editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}</span>
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Código SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    placeholder="BUR-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Código de Barras</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    required
                    placeholder="600200100001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome do Produto</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Hambúrguer Clássico KOMA com Queijo & Bacon"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Categoria</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '🍔'} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Marca / Linha</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="KOMA, CDM, Coca-Cola..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unidade de Medida</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold cursor-pointer"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="dose">Porção / Dose</option>
                    <option value="lata">Lata 330ml</option>
                    <option value="garrafa">Garrafa</option>
                    <option value="chávena">Chávena / Taça</option>
                    <option value="kg">Quilo (kg)</option>
                  </select>
                </div>
              </div>

              {/* AUTOMATIC MARGIN CALCULATOR SECTION */}
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-orange-950 text-xs">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <span>Calculadora Automática de Margem &amp; Preços</span>
                  </div>
                  <span className="text-[10px] text-orange-700 font-medium">Moeda: Metical (MT)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Preço de Custo (MT)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-base font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Preço de Venda ao Consumidor (MT)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-orange-300 rounded-xl font-mono text-base font-black text-orange-950 bg-white"
                    />
                  </div>
                </div>

                {/* Instant Feedback Margin Chips */}
                <div className="pt-2 border-t border-orange-200/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 font-medium">Margem Bruta:</span>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                        marginPercent >= 50
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : marginPercent >= 25
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : marginPercent > 0
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-rose-100 text-rose-900 border-rose-300'
                      }`}
                    >
                      {marginPercent.toFixed(1)}%
                    </span>

                    <span className="text-[11px] text-slate-600 font-medium">Lucro/un:</span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      +{formatCurrency(profitNominal)}
                    </span>
                  </div>

                  {/* Suggest price buttons */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500">Sugerir Venda:</span>
                    <button
                      type="button"
                      onClick={() => applySuggestedMargin(40)}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-orange-50 font-bold cursor-pointer"
                    >
                      40% Margem
                    </button>
                    <button
                      type="button"
                      onClick={() => applySuggestedMargin(50)}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-orange-50 font-bold cursor-pointer"
                    >
                      50% Margem
                    </button>
                  </div>
                </div>
              </div>

              {/* Stock Control */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estoque Inicial / Atual</label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estoque Mínimo de Alerta</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    required
                    placeholder="10"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD & PRESET SELECTION */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-slate-700 font-bold">Foto do Produto (Cardápio Visual)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="Cole a URL da imagem ou escolha dos presets abaixo..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>

                {/* Preset Gallery */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Ou selecione uma foto pronta do cardápio:
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {FOOD_PHOTO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImage(preset.url);
                          setImageBgColor(preset.color);
                        }}
                        className={`p-1 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          image === preset.url
                            ? 'border-orange-500 ring-2 ring-orange-200 bg-orange-50/50'
                            : 'border-slate-200 hover:border-slate-400 bg-white'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-12 h-10 object-cover rounded-lg"
                        />
                        <span className="text-[9px] text-slate-600 line-clamp-1 text-center font-medium">
                          {preset.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status and Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isFoodItem}
                    onChange={(e) => setIsFoodItem(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Produzido na Cozinha</span>
                    <span className="text-[10px] text-slate-400 block">Envia para KDS</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Mais Vendido ⭐</span>
                    <span className="text-[10px] text-slate-400 block">Destaque no PDV</span>
                  </div>
                </label>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status do Item</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold cursor-pointer"
                  >
                    <option value="active">Ativo (Cardápio Visível)</option>
                    <option value="inactive">Inativo (Oculto)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer shadow-xs"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 86 (ESGOTADO TEMPORARIAMENTE) */}
      {is86ModalOpen && productFor86 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-xs ${
                productFor86.is86 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                86
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {productFor86.is86 ? 'Reativar Disponibilidade' : 'Marcar Produto como 86'}
                </h3>
                <p className="text-xs text-slate-500 font-bold">{productFor86.name}</p>
              </div>
            </div>

            {productFor86.is86 ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                Este item está atualmente marcado como <strong>86 (Esgotado)</strong> desde{' '}
                {productFor86.is86At ? new Date(productFor86.is86At).toLocaleTimeString() : 'hoje'}.
                Deseja restabelecer sua disponibilidade imediata no PDV?
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Ao marcar como <strong>86</strong>, o produto fica imediatamente com tarja de <strong>ESGOTADO</strong> no PDV e nenhum operador poderá adicioná-lo a novos pedidos até ser reativado.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Motivo da Falta / Esgotamento
                  </label>
                  <input
                    type="text"
                    value={reason86}
                    onChange={(e) => setReason86(e.target.value)}
                    placeholder="Ex: Acabou o pão brioche, Aguardando entrega de carne..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIs86ModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>

              {productFor86.is86 ? (
                <button
                  type="button"
                  onClick={() => handleConfirmToggle86(false)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Reativar como Disponível
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirmToggle86(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Confirmar 86 (Esgotado)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-600" />
                <span>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                  placeholder="Ex: Hambúrgueres & Sanduíches"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              {/* Emoji Picker */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5 text-orange-600" />
                  <span>Ícone / Emoji Representativo</span>
                </label>
                <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCatIcon(emoji)}
                      className={`h-9 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer ${
                        catIcon === emoji
                          ? 'bg-orange-600 text-white shadow-xs scale-110'
                          : 'hover:bg-slate-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Descrição</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Breve descrição dos produtos pertencentes a esta categoria..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status</label>
                <select
                  value={catStatus}
                  onChange={(e) => setCatStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold cursor-pointer"
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer shadow-xs"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INGREDIENT FORM MODAL (CREATE / EDIT) */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                <span>{editingIngredient ? 'Editar Insumo / Matéria-Prima' : 'Cadastrar Novo Insumo'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsIngredientModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nome do Insumo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  placeholder="Ex: Pão de Hambúrguer, Bacon Fumado, Queijo Cheddar..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Categoria do Insumo</label>
                  <select
                    value={ingCategory}
                    onChange={(e) => setIngCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold cursor-pointer"
                  >
                    <option value="Carnes">Carnes &amp; Aves</option>
                    <option value="Lacticínios">Lacticínios &amp; Queijos</option>
                    <option value="Vegetais">Vegetais &amp; Hortaliças</option>
                    <option value="Molhos">Molhos &amp; Condimentos</option>
                    <option value="Pães">Pães &amp; Padaria</option>
                    <option value="Massas">Massas &amp; Farinhas</option>
                    <option value="Descartáveis">Descartáveis &amp; Embalagens</option>
                    <option value="Bebidas">Bebidas &amp; Xaropes</option>
                    <option value="Geral">Outros / Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unidade de Medida</label>
                  <select
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value as UnitOfMeasure)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold cursor-pointer"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="g">Gramas (g)</option>
                    <option value="kg">Quilogramas (kg)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="L">Litros (L)</option>
                    <option value="dose">Dose (dose)</option>
                    <option value="pct">Pacote (pct)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Custo Unitário (MT) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={ingCostPerUnit}
                    onChange={(e) => setIngCostPerUnit(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estoque Atual</label>
                  <input
                    type="number"
                    step="any"
                    value={ingCurrentStock}
                    onChange={(e) => setIngCurrentStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    step="any"
                    value={ingMinStock}
                    onChange={(e) => setIngMinStock(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Fornecedor Principal</label>
                <input
                  type="text"
                  value={ingSupplierName}
                  onChange={(e) => setIngSupplierName(e.target.value)}
                  placeholder="Ex: Distribuidora Alimentar de Maputo, Padaria Central..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status</label>
                <select
                  value={ingStatus}
                  onChange={(e) => setIngStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold cursor-pointer"
                >
                  <option value="active">Ativo (Permite uso)</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setIsIngredientModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer shadow-xs"
                >
                  Salvar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECIPE & MODIFIERS MODAL */}
      {isRecipeModalOpen && selectedProductForRecipe && (
        <RecipeModifiersModal
          product={selectedProductForRecipe}
          isOpen={isRecipeModalOpen}
          onClose={() => {
            setIsRecipeModalOpen(false);
            setSelectedProductForRecipe(null);
          }}
          onUpdated={handleProductUpdatedFromRecipe}
        />
      )}
    </div>
  );
};
