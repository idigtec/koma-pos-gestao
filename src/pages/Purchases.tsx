import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Truck,
  Building,
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  Package,
  Layers,
  Trash2,
  Edit,
  X,
  AlertCircle,
  Calendar,
  Building2,
  Boxes
} from 'lucide-react';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  Warehouse,
  Product,
  Ingredient
} from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const Purchases: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'ordered' | 'received'>('all');

  // --- NEW PURCHASE ORDER MODAL ---
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [targetWarehouseId, setTargetWarehouseId] = useState('wh-central');
  const [paymentCondition, setPaymentCondition] = useState<'a_vista' | '30_dias' | '60_dias'>('a_vista');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // --- ITEM SELECTOR ROW IN PO MODAL ---
  const [addingItemType, setAddingItemType] = useState<'product' | 'ingredient'>('ingredient');
  const [addingItemId, setAddingItemId] = useState('');
  const [addingQty, setAddingQty] = useState('10');
  const [addingUnitCost, setAddingUnitCost] = useState('');

  // --- RECEIVE ORDER MODAL ---
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);

  // --- NEW SUPPLIER MODAL ---
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState('');
  const [supCompany, setSupCompany] = useState('');
  const [supNuit, setSupNuit] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pos, sups, whs, prods, ings] = await Promise.all([
        DatabaseService.getPurchaseOrders(),
        DatabaseService.getSuppliers(),
        DatabaseService.getWarehouses(),
        DatabaseService.getProducts(),
        DatabaseService.getIngredients(),
      ]);
      setOrders(pos);
      setSuppliers(sups);
      setWarehouses(whs);
      setProducts(prods);
      setIngredients(ings);

      if (sups.length > 0 && !selectedSupplierId) setSelectedSupplierId(sups[0].id);
      if (whs.length > 0) setTargetWarehouseId(whs[0].id);
      if (ings.length > 0) {
        setAddingItemId(ings[0].id);
        setAddingUnitCost(ings[0].costPerUnit.toString());
      }
    } catch (e) {
      console.error('Error loading purchases data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(o => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchQ =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(q));

      return matchStatus && matchQ;
    });
  }, [orders, searchQuery, statusFilter]);

  // Add Item to Order
  const handleAddItemToOrder = () => {
    const qty = parseFloat(addingQty);
    const cost = parseFloat(addingUnitCost);
    if (isNaN(qty) || qty <= 0) {
      warning('Quantidade Inválida', 'Informe uma quantidade válida.');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      warning('Custo Inválido', 'Informe um custo unitário válido.');
      return;
    }

    let name = '';
    let unit = 'un';
    if (addingItemType === 'product') {
      const p = products.find(x => x.id === addingItemId);
      if (!p) return;
      name = p.name;
      unit = p.unit;
    } else {
      const i = ingredients.find(x => x.id === addingItemId);
      if (!i) return;
      name = i.name;
      unit = i.unit;
    }

    const newItem: PurchaseOrderItem = {
      id: `poi-${Date.now()}`,
      itemType: addingItemType,
      itemId: addingItemId,
      itemName: name,
      unit,
      orderedQty: qty,
      receivedQty: 0,
      unitCost: cost,
      totalCost: qty * cost,
    };

    setOrderItems(prev => [...prev, newItem]);
    setAddingQty('10');
  };

  const handleRemoveOrderItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSavePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (orderItems.length === 0) {
      warning('Ordem Vazia', 'Adicione pelo menos um item à ordem de compra.');
      return;
    }

    const sup = suppliers.find(s => s.id === selectedSupplierId);
    const wh = warehouses.find(w => w.id === targetWarehouseId);

    const subtotal = orderItems.reduce((acc, it) => acc + it.totalCost, 0);
    const orderSeq = Math.floor(Math.random() * 9000) + 1000;
    const orderNumber = `OC-2026/${orderSeq}`;

    try {
      setIsSubmittingOrder(true);
      const newPo: PurchaseOrder = {
        id: `po-${Date.now()}`,
        orderNumber,
        supplierId: selectedSupplierId,
        supplierName: sup ? sup.company || sup.name : 'Fornecedor',
        supplierNuit: sup?.nuit,
        targetWarehouseId,
        targetWarehouseName: wh ? wh.name : 'Armazém Geral',
        status: 'ordered',
        expectedDeliveryDate: expectedDate || undefined,
        paymentCondition,
        notes: notes.trim() || undefined,
        items: orderItems,
        subtotal,
        tax: 0,
        total: subtotal,
        createdAt: new Date().toISOString(),
        createdBy: user.name,
      };

      await DatabaseService.savePurchaseOrder(newPo);
      success('Ordem de Compra Criada!', `${newPo.orderNumber} emitida com sucesso.`);
      setIsOrderModalOpen(false);
      setOrderItems([]);
      await loadData();
    } catch (err: any) {
      error('Erro ao emitir ordem', err.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Receive Order (Inward Stock & Expense)
  const handleConfirmReceiveOrder = async () => {
    if (!receivingOrder || !user) return;

    try {
      setIsReceiving(true);
      await DatabaseService.receivePurchaseOrder(
        receivingOrder.id,
        user,
        invoiceNumber.trim() || undefined
      );

      success(
        'Mercadoria Recebida!',
        `A entrada de ${receivingOrder.items.length} itens foi lançada no armazém "${receivingOrder.targetWarehouseName}" e a despesa registrada no financeiro.`
      );
      setReceivingOrder(null);
      setInvoiceNumber('');
      await loadData();
    } catch (err: any) {
      error('Erro ao receber mercadoria', err.message);
    } finally {
      setIsReceiving(false);
    }
  };

  // Supplier handlers
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      warning('Atenção', 'Informe o nome do fornecedor.');
      return;
    }

    try {
      const supData: Supplier = {
        id: editingSupplier ? editingSupplier.id : `sup-${Date.now()}`,
        name: supName.trim(),
        company: supCompany.trim() || supName.trim(),
        nuit: supNuit.trim() || '400000000',
        phone: supPhone.trim() || '+258 84 000 0000',
        email: supEmail.trim() || undefined,
        address: supAddress.trim() || undefined,
        status: 'active',
        createdAt: editingSupplier ? editingSupplier.createdAt : new Date().toISOString(),
      };

      await DatabaseService.saveSupplier(supData);
      success('Fornecedor Salvo!', `"${supData.company}" cadastrado com sucesso.`);
      setIsSupplierModalOpen(false);
      await loadData();
    } catch (err: any) {
      error('Erro ao salvar fornecedor', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-orange-600" />
            <span>Compras, Fornecedores &amp; Entrada de Mercadorias</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Emita ordens de compra, receba notas fiscais e abasteça o estoque dos armazéns automaticamente.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeTab === 'orders' ? (
            <button
              type="button"
              onClick={() => {
                setOrderItems([]);
                setIsOrderModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Ordem de Compra</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingSupplier(null);
                setSupName('');
                setSupCompany('');
                setSupNuit('');
                setSupPhone('');
                setSupEmail('');
                setSupAddress('');
                setIsSupplierModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Fornecedor</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-orange-600" />
          <span>Ordens de Compra ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'suppliers'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4 text-orange-600" />
          <span>Diretório de Fornecedores ({suppliers.length})</span>
        </button>
      </div>

      {/* --- TAB: ORDERS --- */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por número da ordem, fornecedor ou fatura..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 text-xs cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="ordered">⏳ Pedido Enviado / Aguardando</option>
              <option value="received">✅ Mercadoria Recebida</option>
              <option value="draft">📝 Rascunhos</option>
            </select>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nº Ordem &amp; Data</th>
                    <th className="py-3 px-4">Fornecedor</th>
                    <th className="py-3 px-4">Destino (Armazém)</th>
                    <th className="py-3 px-4 text-center">Itens</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block text-xs">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(order.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{order.supplierName}</span>
                        {order.supplierNuit && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            NUIT: {order.supplierNuit}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {order.targetWarehouseName || 'Armazém Geral'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {order.items.length} itens
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            order.status === 'received'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {order.status === 'received' ? 'Recebido' : 'Aguardando'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {order.status !== 'received' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setReceivingOrder(order);
                              setInvoiceNumber('');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1 mx-auto"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                            <span>Receber Estoque</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">
                            Concluído ({order.invoiceNumber ? `Doc: ${order.invoiceNumber}` : 'Recebido'})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Nenhuma ordem de compra encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: SUPPLIERS --- */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(sup => (
            <div
              key={sup.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <span className="text-[10px] font-mono text-slate-400 block mb-1">
                  NUIT: {sup.nuit}
                </span>
                <h4 className="font-black text-slate-900 text-base leading-tight">
                  {sup.company || sup.name}
                </h4>
                {sup.name !== sup.company && (
                  <span className="text-xs text-slate-500 font-medium block">
                    Contato: {sup.name}
                  </span>
                )}

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span>📞 {sup.phone}</span>
                  </div>
                  {sup.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <span>✉️ {sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span>📍 {sup.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                  Ativo
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setEditingSupplier(sup);
                    setSupName(sup.name);
                    setSupCompany(sup.company);
                    setSupNuit(sup.nuit);
                    setSupPhone(sup.phone);
                    setSupEmail(sup.email || '');
                    setSupAddress(sup.address || '');
                    setIsSupplierModalOpen(true);
                  }}
                  className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Editar Fornecedor"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL: NEW PURCHASE ORDER --- */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <span>Emitir Nova Ordem de Compra</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchaseOrder} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fornecedor</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.company || s.name} (NUIT: {s.nuit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Armazém de Entrada</label>
                  <select
                    value={targetWarehouseId}
                    onChange={(e) => setTargetWarehouseId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add item to PO inline row */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Adicionar Item ao Pedido:</span>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <select
                    value={addingItemType}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setAddingItemType(t);
                      if (t === 'product' && products.length > 0) {
                        setAddingItemId(products[0].id);
                        setAddingUnitCost(products[0].costPrice.toString());
                      } else if (t === 'ingredient' && ingredients.length > 0) {
                        setAddingItemId(ingredients[0].id);
                        setAddingUnitCost(ingredients[0].costPerUnit.toString());
                      }
                    }}
                    className="sm:col-span-1 p-2 bg-white border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="ingredient">🥩 Insumo</option>
                    <option value="product">🍔 Produto</option>
                  </select>

                  <select
                    value={addingItemId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setAddingItemId(id);
                      if (addingItemType === 'product') {
                        const p = products.find(x => x.id === id);
                        if (p) setAddingUnitCost(p.costPrice.toString());
                      } else {
                        const i = ingredients.find(x => x.id === id);
                        if (i) setAddingUnitCost(i.costPerUnit.toString());
                      }
                    }}
                    className="sm:col-span-2 p-2 bg-white border border-slate-300 rounded-xl font-bold"
                  >
                    {addingItemType === 'ingredient'
                      ? ingredients.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.unit})
                          </option>
                        ))
                      : products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.unit})
                          </option>
                        ))}
                  </select>

                  <input
                    type="number"
                    step="any"
                    value={addingQty}
                    onChange={(e) => setAddingQty(e.target.value)}
                    placeholder="Qtd"
                    className="p-2 border border-slate-300 rounded-xl font-mono text-center font-bold bg-white"
                  />

                  <button
                    type="button"
                    onClick={handleAddItemToOrder}
                    className="py-2 px-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl cursor-pointer shadow-2xs"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              {/* Order items table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-center">Tipo</th>
                      <th className="py-2.5 px-3 text-center">Quantidade</th>
                      <th className="py-2.5 px-3 text-right">Custo Unitário</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {orderItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-slate-900">{item.itemName}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.itemType === 'product' ? 'Produto' : 'Insumo'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold">
                          {item.orderedQty} {item.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.totalCost)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveOrderItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {orderItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Nenhum item adicionado à ordem.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex items-center justify-between p-3.5 bg-orange-50 rounded-2xl border border-orange-200">
                <span className="font-bold text-orange-950">Total da Ordem de Compra:</span>
                <span className="text-xl font-black font-mono text-orange-950">
                  {formatCurrency(orderItems.reduce((acc, it) => acc + it.totalCost, 0))}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 -mx-5 -mb-5">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder || orderItems.length === 0}
                  className="px-5 py-2 font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Emitir Ordem de Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: RECEIVE ORDER --- */}
      {receivingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600" />
                <span>Receber Mercadoria no Estoque</span>
              </h3>
              <button
                type="button"
                onClick={() => setReceivingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-mono font-bold text-slate-900 block">{receivingOrder.orderNumber}</span>
                <span className="text-slate-600 block">Fornecedor: {receivingOrder.supplierName}</span>
                <span className="text-slate-600 block">Destino: {receivingOrder.targetWarehouseName}</span>
                <span className="font-bold text-slate-900 block mt-1">
                  Total: {formatCurrency(receivingOrder.total)} ({receivingOrder.items.length} itens)
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nº da Fatura / Guia de Remessa do Fornecedor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ex: FAT-2026/8943"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-xs"
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 -mx-5 -mb-5">
                <button
                  type="button"
                  onClick={() => setReceivingOrder(null)}
                  className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReceiveOrder}
                  disabled={isReceiving}
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Confirmar Entrada no Estoque
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: NEW SUPPLIER --- */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Building className="w-5 h-5 text-orange-600" />
                <span>{editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nome da Empresa / Razão Social <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supCompany}
                  onChange={(e) => setSupCompany(e.target.value)}
                  placeholder="Ex: Distribuidora Alimentar de Maputo, Lda."
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nome do Contato</label>
                  <input
                    type="text"
                    required
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    placeholder="Ex: Mário Fernandes"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">NUIT Moçambique</label>
                  <input
                    type="text"
                    required
                    value={supNuit}
                    onChange={(e) => setSupNuit(e.target.value)}
                    placeholder="Ex: 400123987"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="+258 84..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    placeholder="comercial@..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Endereço / Localização</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="Ex: Av. 24 de Julho nº 1234, Maputo"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 -mx-5 -mb-5">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer shadow-xs"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
