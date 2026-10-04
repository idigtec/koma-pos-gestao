import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  Search,
  Download,
  Plus,
  History,
  CheckCircle,
  FileText,
  X,
  Package,
  Layers,
  Building2,
  ClipboardList,
  TrendingDown,
  ArrowRightLeft,
  DollarSign,
  Calendar,
  User as UserIcon,
  Tag,
  Check,
  Ban,
  Info,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Trash2,
  Edit
} from 'lucide-react';
import { DatabaseService } from '../services/db';
import {
  Product,
  Ingredient,
  StockMovement,
  StockMovementType,
  Warehouse,
  StockCount,
  StockCountItem,
  CompanySettings
} from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PdfService } from '../services/pdfService';

export const Stock: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning, info } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DatabaseService.getSettings as any);
  const [loading, setLoading] = useState(true);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'positions' | 'movements' | 'audits' | 'warehouses'>('positions');

  // Positions Tab Filters
  const [positionSearch, setPositionSearch] = useState('');
  const [positionTypeFilter, setPositionTypeFilter] = useState<'all' | 'product' | 'ingredient'>('all');
  const [positionStatusFilter, setPositionStatusFilter] = useState<'all' | 'normal' | 'low' | 'out'>('all');

  // Movements Tab Filters
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');
  const [movementWarehouseFilter, setMovementWarehouseFilter] = useState<string>('all');

  // --- ITEM KARDEX MODAL ---
  const [kardexItem, setKardexItem] = useState<{ id: string; name: string; type: 'product' | 'ingredient'; currentStock: number; unit: string } | null>(null);

  // --- NEW MOVEMENT MODAL ---
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementItemType, setMovementItemType] = useState<'product' | 'ingredient'>('product');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [movementType, setMovementType] = useState<StockMovementType>('entry');
  const [quantity, setQuantity] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('wh-central');
  const [targetWarehouseId, setTargetWarehouseId] = useState('wh-cozinha');
  const [reason, setReason] = useState('');
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);

  // --- INVENTORY AUDIT (COUNT SESSION) MODAL ---
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditTitle, setAuditTitle] = useState('');
  const [auditWarehouseId, setAuditWarehouseId] = useState('wh-central');
  const [auditNotes, setAuditNotes] = useState('');
  const [auditItems, setAuditItems] = useState<StockCountItem[]>([]);
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);

  // --- WAREHOUSE MODAL ---
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whLocation, setWhLocation] = useState('');
  const [whDesc, setWhDesc] = useState('');
  const [whIsDefault, setWhIsDefault] = useState(false);
  const [whStatus, setWhStatus] = useState<'active' | 'inactive'>('active');

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, ings, moves, whs, counts, sett] = await Promise.all([
        DatabaseService.getProducts(),
        DatabaseService.getIngredients(),
        DatabaseService.getStockMovements(),
        DatabaseService.getWarehouses(),
        DatabaseService.getStockCounts(),
        DatabaseService.getSettings(),
      ]);
      setProducts(prods);
      setIngredients(ings);
      setMovements(moves);
      setWarehouses(whs);
      setStockCounts(counts);
      setSettings(sett);

      if (prods.length > 0 && !selectedItemId) {
        setSelectedItemId(prods[0].id);
      }
      if (whs.length > 0) {
        const def = whs.find(w => w.isDefault) || whs[0];
        setSourceWarehouseId(def.id);
        setAuditWarehouseId(def.id);
      }
    } catch (err) {
      console.error('Error loading stock suite data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- UNIFIED STOCK POSITIONS (PRODUCTS + INGREDIENTS) ---
  interface UnifiedStockItem {
    id: string;
    itemType: 'product' | 'ingredient';
    name: string;
    sku?: string;
    category: string;
    currentStock: number;
    minStock: number;
    unit: string;
    costPrice: number;
    totalValuation: number;
    status: 'normal' | 'low' | 'out';
    is86: boolean;
  }

  const unifiedStockItems = useMemo<UnifiedStockItem[]>(() => {
    const list: UnifiedStockItem[] = [];

    // Products
    products.forEach(p => {
      const isOut = p.currentStock <= 0;
      const isLow = !isOut && p.currentStock <= p.minStock;
      list.push({
        id: p.id,
        itemType: 'product',
        name: p.name,
        sku: p.sku,
        category: p.categoryName || 'Produtos Prontos',
        currentStock: p.currentStock,
        minStock: p.minStock,
        unit: p.unit || 'un',
        costPrice: p.costPrice || 0,
        totalValuation: (p.currentStock || 0) * (p.costPrice || 0),
        status: isOut ? 'out' : isLow ? 'low' : 'normal',
        is86: Boolean(p.is86),
      });
    });

    // Ingredients
    ingredients.forEach(i => {
      const isOut = i.currentStock <= 0;
      const isLow = !isOut && i.currentStock <= i.minStock;
      list.push({
        id: i.id,
        itemType: 'ingredient',
        name: i.name,
        sku: i.id.toUpperCase().slice(-6),
        category: i.category || 'Insumo / Matéria-Prima',
        currentStock: i.currentStock,
        minStock: i.minStock,
        unit: i.unit || 'un',
        costPrice: i.costPerUnit || 0,
        totalValuation: (i.currentStock || 0) * (i.costPerUnit || 0),
        status: isOut ? 'out' : isLow ? 'low' : 'normal',
        is86: !i.isAvailable,
      });
    });

    return list;
  }, [products, ingredients]);

  // Financial Metrics
  const metrics = useMemo(() => {
    const totalValuation = unifiedStockItems.reduce((acc, item) => acc + item.totalValuation, 0);
    const lowStockCount = unifiedStockItems.filter(i => i.status === 'low').length;
    const outOfStockCount = unifiedStockItems.filter(i => i.status === 'out').length;
    const items86Count = unifiedStockItems.filter(i => i.is86).length;

    // Loss in the current month
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const monthlyLossCost = movements
      .filter(m => m.type === 'loss' && m.createdAt.startsWith(currentMonth))
      .reduce((acc, m) => acc + (m.totalCost || 0), 0);

    return {
      totalValuation,
      totalItems: unifiedStockItems.length,
      lowStockCount,
      outOfStockCount,
      items86Count,
      monthlyLossCost,
    };
  }, [unifiedStockItems, movements]);

  // Filtered Positions
  const filteredPositions = useMemo(() => {
    const q = positionSearch.toLowerCase().trim();
    return unifiedStockItems.filter(item => {
      const matchType = positionTypeFilter === 'all' || item.itemType === positionTypeFilter;
      const matchStatus =
        positionStatusFilter === 'all' ||
        (positionStatusFilter === 'normal' && item.status === 'normal') ||
        (positionStatusFilter === 'low' && item.status === 'low') ||
        (positionStatusFilter === 'out' && item.status === 'out');
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);

      return matchType && matchStatus && matchQuery;
    });
  }, [unifiedStockItems, positionSearch, positionTypeFilter, positionStatusFilter]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    const q = movementSearch.toLowerCase().trim();
    return movements.filter(m => {
      const matchType = movementTypeFilter === 'all' || m.type === movementTypeFilter;
      const matchWh = movementWarehouseFilter === 'all' || m.warehouseId === movementWarehouseFilter || m.targetWarehouseId === movementWarehouseFilter;
      const matchQuery =
        !q ||
        m.itemName.toLowerCase().includes(q) ||
        (m.sku && m.sku.toLowerCase().includes(q)) ||
        m.reason.toLowerCase().includes(q) ||
        (m.documentRef && m.documentRef.toLowerCase().includes(q)) ||
        m.userName.toLowerCase().includes(q);

      return matchType && matchWh && matchQuery;
    });
  }, [movements, movementSearch, movementTypeFilter, movementWarehouseFilter]);

  // Item Kardex Movements
  const itemKardexMovements = useMemo(() => {
    if (!kardexItem) return [];
    return movements.filter(m =>
      kardexItem.type === 'product' ? m.productId === kardexItem.id : m.ingredientId === kardexItem.id
    );
  }, [movements, kardexItem]);

  // --- OPEN NEW MOVEMENT MODAL ---
  const handleOpenMovementModal = (item?: UnifiedStockItem, defaultType: StockMovementType = 'entry') => {
    if (item) {
      setMovementItemType(item.itemType);
      setSelectedItemId(item.id);
      setCostPerUnit(item.costPrice.toString());
    } else {
      setMovementItemType('product');
      setSelectedItemId(products[0]?.id || '');
      setCostPerUnit(products[0]?.costPrice?.toString() || '');
    }
    setMovementType(defaultType);
    setQuantity('');
    setDocumentRef('');
    setReason('');
    setIsMovementModalOpen(true);
  };

  // --- SUBMIT STOCK MOVEMENT ---
  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      warning('Quantidade Inválida', 'Informe uma quantidade válida maior que zero.');
      return;
    }
    if (!reason.trim()) {
      warning('Atenção', 'Informe a justificativa ou motivo da movimentação.');
      return;
    }

    try {
      setIsSubmittingMovement(true);
      const wh = warehouses.find(w => w.id === sourceWarehouseId);
      const targetWh = warehouses.find(w => w.id === targetWarehouseId);

      await DatabaseService.registerManualStockMovement({
        itemType: movementItemType,
        id: selectedItemId,
        type: movementType,
        quantity: qty,
        costPerUnit: parseFloat(costPerUnit) || 0,
        documentRef: documentRef.trim() || undefined,
        warehouseId: sourceWarehouseId,
        warehouseName: wh ? wh.name : 'Armazém Geral',
        targetWarehouseId: movementType === 'transfer' ? targetWarehouseId : undefined,
        targetWarehouseName: movementType === 'transfer' && targetWh ? targetWh.name : undefined,
        reason: reason.trim(),
        user,
      });

      success(
        'Movimentação Registrada!',
        `Lançamento de ${movementType.toUpperCase()} efetuado com sucesso.`
      );
      setIsMovementModalOpen(false);
      await loadData();
    } catch (err: any) {
      error('Erro ao registrar movimentação', err.message);
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  // --- INVENTORY AUDIT HANDLERS ---
  const handleOpenNewAudit = () => {
    const initialItems: StockCountItem[] = unifiedStockItems.map(item => ({
      id: item.id,
      name: item.name,
      itemType: item.itemType,
      unit: item.unit,
      systemQty: item.currentStock,
      countedQty: item.currentStock, // default starts matching
      diff: 0,
      costPerUnit: item.costPrice,
      totalDiffCost: 0,
      adjusted: false,
    }));

    const wh = warehouses.find(w => w.id === auditWarehouseId);
    setAuditTitle(`Contagem Física - ${wh ? wh.name : 'Geral'} (${new Date().toLocaleDateString('pt-MZ')})`);
    setAuditNotes('');
    setAuditItems(initialItems);
    setIsAuditModalOpen(true);
  };

  const handleUpdateAuditItemCount = (index: number, newCountedQty: number) => {
    setAuditItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const diff = newCountedQty - item.systemQty;
      const totalDiffCost = diff * item.costPerUnit;

      updated[index] = {
        ...item,
        countedQty: newCountedQty,
        diff,
        totalDiffCost,
      };
      return updated;
    });
  };

  const handleSaveAuditDraft = async () => {
    if (!user) return;
    try {
      setIsSubmittingAudit(true);
      const wh = warehouses.find(w => w.id === auditWarehouseId);
      const countSession: StockCount = {
        id: `audit-${Date.now()}`,
        title: auditTitle.trim() || `Contagem Física ${new Date().toLocaleDateString('pt-MZ')}`,
        warehouseId: auditWarehouseId,
        warehouseName: wh ? wh.name : 'Armazém Geral',
        date: new Date().toISOString().slice(0, 10),
        performedBy: user.name,
        status: 'draft',
        notes: auditNotes.trim() || undefined,
        items: auditItems,
        createdAt: new Date().toISOString(),
      };

      await DatabaseService.saveStockCount(countSession);
      success('Ficha Salva como Rascunho', 'A contagem foi gravada para conferência posterior.');
      setIsAuditModalOpen(false);
      await loadData();
    } catch (err: any) {
      error('Erro ao salvar inventário', err.message);
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  const handleApplyAuditImmediately = async () => {
    if (!user) return;
    const diffsCount = auditItems.filter(i => i.diff !== 0).length;
    if (diffsCount > 0) {
      const confirm = window.confirm(
        `Deseja realmente aplicar o balanço de inventário agora?\n\n${diffsCount} itens tiveram divergência física e terão seus saldos de estoque ajustados automaticamente no sistema.`
      );
      if (!confirm) return;
    }

    try {
      setIsSubmittingAudit(true);
      const wh = warehouses.find(w => w.id === auditWarehouseId);
      const auditId = `audit-${Date.now()}`;
      const countSession: StockCount = {
        id: auditId,
        title: auditTitle.trim() || `Contagem Física ${new Date().toLocaleDateString('pt-MZ')}`,
        warehouseId: auditWarehouseId,
        warehouseName: wh ? wh.name : 'Armazém Geral',
        date: new Date().toISOString().slice(0, 10),
        performedBy: user.name,
        status: 'draft',
        notes: auditNotes.trim() || undefined,
        items: auditItems,
        createdAt: new Date().toISOString(),
      };

      await DatabaseService.saveStockCount(countSession);
      await DatabaseService.applyStockCountAdjustments(auditId, user);

      success('Balanço de Inventário Aplicado!', `${diffsCount} ajustes de estoque foram lançados com sucesso.`);
      setIsAuditModalOpen(false);
      await loadData();
    } catch (err: any) {
      error('Erro ao aplicar inventário', err.message);
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  // --- WAREHOUSE HANDLERS ---
  const handleOpenWarehouseModal = (wh?: Warehouse) => {
    if (wh) {
      setEditingWarehouse(wh);
      setWhName(wh.name);
      setWhCode(wh.code);
      setWhLocation(wh.location || '');
      setWhDesc(wh.description || '');
      setWhIsDefault(Boolean(wh.isDefault));
      setWhStatus(wh.status);
    } else {
      setEditingWarehouse(null);
      setWhName('');
      setWhCode(`LOC-0${warehouses.length + 1}`);
      setWhLocation('');
      setWhDesc('');
      setWhIsDefault(false);
      setWhStatus('active');
    }
    setIsWarehouseModalOpen(true);
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim()) {
      warning('Atenção', 'Informe o nome do armazém / local de estoque.');
      return;
    }

    try {
      const whData: Warehouse = {
        id: editingWarehouse ? editingWarehouse.id : `wh-${Date.now()}`,
        name: whName.trim(),
        code: whCode.trim().toUpperCase(),
        description: whDesc.trim() || undefined,
        location: whLocation.trim() || undefined,
        isDefault: whIsDefault,
        status: whStatus,
        createdAt: editingWarehouse ? editingWarehouse.createdAt : new Date().toISOString(),
      };

      await DatabaseService.saveWarehouse(whData);
      success('Armazém Salvo!', `Local "${whData.name}" atualizado.`);
      setIsWarehouseModalOpen(false);
      await loadData();
    } catch (err: any) {
      error('Erro ao salvar armazém', err.message);
    }
  };

  const handleDeleteWarehouse = async (wh: Warehouse) => {
    if (wh.isDefault) {
      warning('Ação Não Permitida', 'Não é possível excluir o armazém principal padrão.');
      return;
    }
    if (!window.confirm(`Excluir o local "${wh.name}"?`)) return;

    try {
      await DatabaseService.deleteWarehouse(wh.id);
      success('Armazém Removido', `O local foi excluído.`);
      await loadData();
    } catch (err: any) {
      error('Erro ao excluir', err.message);
    }
  };

  // --- PDF EXPORT ---
  const handleExportStockPdf = () => {
    PdfService.generateStockReport(products, settings);
    success('Relatório Gerado', 'O PDF de Posições de Estoque foi exportado para impressão.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-orange-600" />
            <span>Gestão Profissional de Estoque &amp; Kardex</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle integrado de produtos prontos e insumos de receita, múltiplos armazéns, fichas de contagem cega e Kardex histórico.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportStockPdf}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenMovementModal(undefined, 'entry')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Financial Valuation & Health Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Valor Patrimonial (Custo)
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-2">
            {formatCurrency(metrics.totalValuation)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1">
            Imobilizado em estoque total
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Itens Monitorados
            </span>
            <Package className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-2">
            {metrics.totalItems}
          </span>
          <span className="text-[11px] text-slate-500 mt-1">
            {products.length} produtos + {ingredients.length} insumos
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Alertas de Ruptura
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-700">
              {metrics.lowStockCount}
            </span>
            <span className="text-xs font-bold text-rose-700">
              ({metrics.outOfStockCount} esgotados)
            </span>
          </div>
          <span className="text-[11px] text-amber-700 mt-1">
            Itens no limite mínimo de segurança
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Perdas &amp; Desperdício (Mês)
            </span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-xl sm:text-2xl font-black font-mono text-rose-700 mt-2">
            {formatCurrency(metrics.monthlyLossCost)}
          </span>
          <span className="text-[11px] text-rose-600 mt-1">
            Quebras, vencimentos e avarias
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('positions')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'positions'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4 text-orange-600" />
          <span>Posições de Estoque ({unifiedStockItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'movements'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-orange-600" />
          <span>Kardex &amp; Movimentações ({movements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'audits'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-orange-600" />
          <span>Fichas de Inventário &amp; Contagem ({stockCounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouses')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'warehouses'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-orange-600" />
          <span>Armazéns &amp; Locais ({warehouses.length})</span>
        </button>
      </div>

      {/* --- TAB 1: POSIÇÕES DE ESTOQUE & KARDEX --- */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={positionSearch}
                onChange={(e) => setPositionSearch(e.target.value)}
                placeholder="Pesquisar por nome do item, SKU ou categoria..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs items-center">
              {/* Type Filter */}
              <select
                value={positionTypeFilter}
                onChange={(e) => setPositionTypeFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">📦 Todos os Tipos</option>
                <option value="product">🍔 Produtos de Venda</option>
                <option value="ingredient">🥩 Insumos de Receita</option>
              </select>

              {/* Status Filter */}
              <select
                value={positionStatusFilter}
                onChange={(e) => setPositionStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">Todos os Saldos</option>
                <option value="normal">🟢 Saldo Adequado</option>
                <option value="low">🟡 Estoque Baixo</option>
                <option value="out">🔴 Esgotado / Zerado</option>
              </select>
            </div>
          </div>

          {/* Unified Positions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Item &amp; Identificação</th>
                    <th className="py-3 px-4">Tipo &amp; Categoria</th>
                    <th className="py-3 px-4 text-center">Unidade</th>
                    <th className="py-3 px-4 text-right">Custo Médio</th>
                    <th className="py-3 px-4 text-center">Estoque Atual</th>
                    <th className="py-3 px-4 text-center">Estoque Mínimo</th>
                    <th className="py-3 px-4 text-right">Valor Total Imobilizado</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPositions.map(item => (
                    <tr key={`${item.itemType}-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.is86 && (
                            <span className="px-1.5 py-0.2 rounded-md bg-rose-600 text-white font-black text-[9px] uppercase">
                              86
                            </span>
                          )}
                        </div>
                        {item.sku && (
                          <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.itemType === 'product'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.itemType === 'product' ? 'Produto' : 'Insumo'} • {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                        {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(item.costPrice)} / {item.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                            item.status === 'out'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : item.status === 'low'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {item.status === 'low' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {item.minStock} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        {formatCurrency(item.totalValuation)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setKardexItem({
                                id: item.id,
                                name: item.name,
                                type: item.itemType,
                                currentStock: item.currentStock,
                                unit: item.unit,
                              })
                            }
                            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Ver Histórico Kardex deste item"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenMovementModal(item, 'entry')}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Lançar Entrada de Mercadoria"
                          >
                            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenMovementModal(item, 'loss')}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Registrar Perda / Quebra"
                          >
                            <TrendingDown className="w-4 h-4 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredPositions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Nenhum item encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: KARDEX & MOVIMENTAÇÕES --- */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          {/* Quick Action Badges & Filters */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                placeholder="Pesquisar por item, motivo, documento de compra ou responsável..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs items-center">
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">Todas as Operações</option>
                <option value="entry">📥 Entradas / Compras</option>
                <option value="exit">📤 Saídas Manuais</option>
                <option value="sale">🛒 Vendas no PDV</option>
                <option value="loss">⚠️ Perdas &amp; Quebras</option>
                <option value="transfer">🔄 Transferências</option>
                <option value="adjustment">⚖️ Ajustes de Balanço</option>
              </select>

              <select
                value={movementWarehouseFilter}
                onChange={(e) => setMovementWarehouseFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">Todos os Armazéns</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>
                    🏢 {wh.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Movements Kardex Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Item &amp; Tipo</th>
                    <th className="py-3 px-4">Operação</th>
                    <th className="py-3 px-4 text-center">Quantidade</th>
                    <th className="py-3 px-4 text-center">Saldo (Antes → Depois)</th>
                    <th className="py-3 px-4">Local / Armazém</th>
                    <th className="py-3 px-4">Motivo / Documento</th>
                    <th className="py-3 px-4">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMovements.map(m => {
                    const isPositive = m.type === 'entry' || (m.type === 'adjustment' && m.nextStock > m.previousStock);
                    const isTransfer = m.type === 'transfer';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {formatDateTime(m.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{m.itemName}</span>
                          <span className="text-[10px] text-slate-400">
                            {m.itemType === 'product' ? 'Produto' : 'Insumo'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.type === 'entry'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.type === 'sale'
                                ? 'bg-blue-100 text-blue-800'
                                : m.type === 'loss'
                                ? 'bg-rose-100 text-rose-800'
                                : m.type === 'transfer'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {m.type === 'entry' && '📥 Entrada'}
                            {m.type === 'exit' && '📤 Saída Manual'}
                            {m.type === 'sale' && '🛒 Venda PDV'}
                            {m.type === 'loss' && '⚠️ Perda/Quebra'}
                            {m.type === 'transfer' && '🔄 Transferência'}
                            {m.type === 'adjustment' && '⚖️ Ajuste Balanço'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span className={isTransfer ? 'text-purple-700' : isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                            {isTransfer ? '' : isPositive ? '+' : '-'}
                            {m.quantity} {m.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {m.previousStock} → <span className="font-bold text-slate-800">{m.nextStock}</span> {m.unit}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[11px] text-slate-700 font-medium">
                            {m.warehouseName || 'Armazém Geral'}
                          </div>
                          {m.targetWarehouseName && (
                            <div className="text-[10px] text-purple-700 flex items-center gap-1 font-bold">
                              <span>→ {m.targetWarehouseName}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-slate-800 font-medium truncate">{m.reason}</div>
                          {m.documentRef && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              Doc: {m.documentRef}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {m.userName}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredMovements.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Nenhuma movimentação encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: FICHAS DE INVENTÁRIO & CONTAGEM CEGA --- */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Sessões de Auditoria de Estoque</h3>
              <p className="text-xs text-slate-500">
                Gere fichas de contagem cega para conferência física, apuração de sobras/quebras e conciliação automática.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNewAudit}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Nova Ficha de Contagem Física</span>
            </button>
          </div>

          {/* List of Past Stock Counts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stockCounts.map(count => {
              const diffItems = count.items.filter(i => i.diff !== 0);
              const totalVariance = count.items.reduce((acc, i) => acc + i.totalDiffCost, 0);

              return (
                <div
                  key={count.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-slate-900 text-base leading-tight">
                          {count.title}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Local: {count.warehouseName || 'Armazém Geral'} • Realizado por: {count.performedBy}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          count.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {count.status === 'completed' ? 'Aplicado' : 'Em Aberto (Rascunho)'}
                      </span>
                    </div>

                    {count.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {count.notes}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Itens Conferidos</span>
                        <span className="font-black text-slate-900 font-mono text-sm">{count.items.length}</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Divergências</span>
                        <span className={`font-black font-mono text-sm ${diffItems.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {diffItems.length}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Variância (MT)</span>
                        <span className={`font-black font-mono text-sm ${totalVariance < 0 ? 'text-rose-700' : totalVariance > 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {formatCurrency(totalVariance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      Data: {count.date}
                    </span>

                    {count.status === 'completed' ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
                        <CheckCircle className="w-4 h-4" />
                        <span>Saldos sincronizados</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!user) return;
                          await DatabaseService.applyStockCountAdjustments(count.id, user);
                          success('Balanço Aplicado', 'Ajustes concluídos.');
                          await loadData();
                        }}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold cursor-pointer transition-all"
                      >
                        Aplicar Balanço Agora
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {stockCounts.length === 0 && (
              <div className="col-span-2 p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                <ClipboardList className="w-12 h-12 stroke-[1.2] mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600">Nenhum inventário físico cadastrado</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Clique em "Nova Ficha de Contagem Física" acima para iniciar sua primeira auditoria de estoque.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: ARMAZÉNS & LOCAIS DE ESTOQUE --- */}
      {activeTab === 'warehouses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Locais de Armazenamento e Estocagem</h3>
              <p className="text-xs text-slate-500">
                Configure os pontos de estoque físico do restaurante (Câmara Frigorífica, Cozinha, Bar de Bebidas, Almoxarifado).
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenWarehouseModal()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Local / Armazém</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {warehouses.map(wh => (
              <div
                key={wh.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-orange-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-lg">
                      {wh.code}
                    </span>
                    {wh.isDefault && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-900 border border-orange-200">
                        Principal Padrão
                      </span>
                    )}
                  </div>

                  <h4 className="font-black text-slate-900 text-base leading-snug">
                    {wh.name}
                  </h4>

                  {wh.location && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <span>📍 {wh.location}</span>
                    </p>
                  )}

                  {wh.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {wh.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      wh.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {wh.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenWarehouseModal(wh)}
                      className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      title="Editar Armazém"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!wh.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteWarehouse(wh)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="Excluir Armazém"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODAL 1: ITEM KARDEX DETAIL MODAL --- */}
      {kardexItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    Kardex Histórico: {kardexItem.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Saldo Atual: <span className="font-mono font-bold text-slate-900">{kardexItem.currentStock} {kardexItem.unit}</span> ({kardexItem.type === 'product' ? 'Produto de Venda' : 'Insumo de Receita'})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setKardexItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Data / Hora</th>
                      <th className="py-2.5 px-3">Operação</th>
                      <th className="py-2.5 px-3 text-center">Quantidade</th>
                      <th className="py-2.5 px-3 text-center">Saldo</th>
                      <th className="py-2.5 px-3">Motivo / Documento</th>
                      <th className="py-2.5 px-3">Operador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {itemKardexMovements.map(m => {
                      const isPositive = m.type === 'entry' || (m.type === 'adjustment' && m.nextStock > m.previousStock);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {formatDateTime(m.createdAt)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold">
                              {m.type === 'entry' && '📥 Entrada'}
                              {m.type === 'exit' && '📤 Saída'}
                              {m.type === 'sale' && '🛒 Venda PDV'}
                              {m.type === 'loss' && '⚠️ Perda/Quebra'}
                              {m.type === 'transfer' && '🔄 Transferência'}
                              {m.type === 'adjustment' && '⚖️ Ajuste'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                              {isPositive ? '+' : '-'}
                              {m.quantity} {m.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                            {m.previousStock} → <span className="font-bold text-slate-900">{m.nextStock}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div>{m.reason}</div>
                            {m.documentRef && <span className="text-[10px] text-slate-400 font-mono">Doc: {m.documentRef}</span>}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {m.userName}
                          </td>
                        </tr>
                      );
                    })}

                    {itemKardexMovements.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Nenhuma movimentação registrada para este item no histórico.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: REGISTER STOCK MOVEMENT MODAL --- */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Boxes className="w-5 h-5 text-orange-600" />
                <span>Lançamento Manual de Estoque</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMovement} className="p-6 space-y-4 text-xs">
              {/* Operation Type Grid Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Tipo de Lançamento</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('entry')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      movementType === 'entry'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    📥 Entrada / Compra
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('exit')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      movementType === 'exit'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-orange-50'
                    }`}
                  >
                    📤 Saída Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('loss')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      movementType === 'loss'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-rose-50'
                    }`}
                  >
                    ⚠️ Perda / Quebra
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('transfer')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      movementType === 'transfer'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50'
                    }`}
                  >
                    🔄 Transferência
                  </button>
                </div>
              </div>

              {/* Item Type Switcher (Product vs Ingredient) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMovementItemType('product');
                    if (products.length > 0) setSelectedItemId(products[0].id);
                  }}
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    movementItemType === 'product'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🍔 Produto Final de Venda
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMovementItemType('ingredient');
                    if (ingredients.length > 0) setSelectedItemId(ingredients[0].id);
                  }}
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    movementItemType === 'ingredient'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🥩 Insumo / Matéria-Prima
                </button>
              </div>

              {/* Select Item */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Selecione o {movementItemType === 'product' ? 'Produto' : 'Insumo'}
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {movementItemType === 'product'
                    ? products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — Saldo Atual: {p.currentStock} {p.unit}
                        </option>
                      ))
                    : ingredients.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.name} — Saldo Atual: {i.currentStock} {i.unit} (Custo: {formatCurrency(i.costPerUnit)})
                        </option>
                      ))}
                </select>
              </div>

              {/* Quantities & Costs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Quantidade <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Custo Unitário (MT)</label>
                  <input
                    type="number"
                    step="any"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    placeholder="Auto ou informe"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-700 font-bold mb-1">Nº Doc / Fatura / Guia</label>
                  <input
                    type="text"
                    value={documentRef}
                    onChange={(e) => setDocumentRef(e.target.value)}
                    placeholder="Ex: FAT-892"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Warehouses Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {movementType === 'transfer' ? 'Armazém de Origem' : 'Armazém / Local'}
                  </label>
                  <select
                    value={sourceWarehouseId}
                    onChange={(e) => setSourceWarehouseId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium cursor-pointer"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                {movementType === 'transfer' && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Armazém de Destino
                    </label>
                    <select
                      value={targetWarehouseId}
                      onChange={(e) => setTargetWarehouseId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-purple-300 rounded-xl font-medium cursor-pointer"
                    >
                      {warehouses
                        .filter(w => w.id !== sourceWarehouseId)
                        .map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.code})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Reason / Observation */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Motivo / Justificativa do Lançamento <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Compra semanal Distribuidora, Quebra na câmara fria, Transferência para cozinha..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMovement}
                  className="px-5 py-2 font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: INVENTORY AUDIT (COUNT SESSION) --- */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Ficha de Inventário &amp; Contagem Cega</h3>
                  <p className="text-[11px] text-slate-500">
                    Insira a contagem física real. O sistema calculará a divergência e o impacto financeiro (quebra/sobra).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Título da Sessão</label>
                  <input
                    type="text"
                    value={auditTitle}
                    onChange={(e) => setAuditTitle(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Armazém Auditado</label>
                  <select
                    value={auditWarehouseId}
                    onChange={(e) => setAuditWarehouseId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium cursor-pointer"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Observações da Auditoria</label>
                <input
                  type="text"
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Ex: Auditoria mensal de fechamento de câmara frigorífica..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Items Counting Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[48vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100 sticky top-0 bg-slate-50 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3 text-center">Tipo</th>
                        <th className="py-2.5 px-3 text-center">Estoque Sistema</th>
                        <th className="py-2.5 px-3 text-center w-32">Contagem Física</th>
                        <th className="py-2.5 px-3 text-center">Divergência</th>
                        <th className="py-2.5 px-3 text-right">Impacto (MT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {auditItems.map((item, index) => {
                        const hasDiff = item.diff !== 0;

                        return (
                          <tr key={`${item.itemType}-${item.id}`} className={hasDiff ? 'bg-amber-50/40' : 'hover:bg-slate-50'}>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {item.itemType === 'product' ? 'Produto' : 'Insumo'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600">
                              {item.systemQty} {item.unit}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={item.countedQty}
                                onChange={(e) => handleUpdateAuditItemCount(index, parseFloat(e.target.value) || 0)}
                                className="w-24 p-1.5 text-center font-mono font-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">
                              <span className={item.diff > 0 ? 'text-emerald-700' : item.diff < 0 ? 'text-rose-700' : 'text-slate-400'}>
                                {item.diff > 0 ? `+${item.diff}` : item.diff} {item.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              <span className={item.totalDiffCost < 0 ? 'text-rose-700' : item.totalDiffCost > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                                {formatCurrency(item.totalDiffCost)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-600">
                <span>Divergências: </span>
                <span className="text-orange-950 font-black font-mono">
                  {auditItems.filter(i => i.diff !== 0).length} itens
                </span>
                <span className="mx-2">•</span>
                <span>Variância Total: </span>
                <span className="font-mono font-black text-slate-900">
                  {formatCurrency(auditItems.reduce((acc, i) => acc + i.totalDiffCost, 0))}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAuditDraft}
                  disabled={isSubmittingAudit}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Salvar Rascunho
                </button>
                <button
                  type="button"
                  onClick={handleApplyAuditImmediately}
                  disabled={isSubmittingAudit}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Aplicar Balanço de Estoque
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: CREATE / EDIT WAREHOUSE --- */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                <span>{editingWarehouse ? 'Editar Armazém' : 'Novo Armazém / Local'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsWarehouseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nome do Local <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="Ex: Bar & Balcão de Bebidas"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Código / Sigla</label>
                  <input
                    type="text"
                    required
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value)}
                    placeholder="Ex: BAR-01"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select
                    value={whStatus}
                    onChange={(e) => setWhStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium cursor-pointer"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Localização Física</label>
                <input
                  type="text"
                  value={whLocation}
                  onChange={(e) => setWhLocation(e.target.value)}
                  placeholder="Ex: Frente de Loja, Mezanino, Linha Quente..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Descrição</label>
                <textarea
                  value={whDesc}
                  onChange={(e) => setWhDesc(e.target.value)}
                  rows={2}
                  placeholder="Descrição da finalidade deste local de estocagem..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={whIsDefault}
                    onChange={(e) => setWhIsDefault(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span>Definir como Armazém Principal Padrão</span>
                </label>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer shadow-xs"
                >
                  Salvar Armazém
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
