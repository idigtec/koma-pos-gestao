import React, { useState, useEffect, useMemo } from 'react';
import {
  Bike,
  Plus,
  Search,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  User,
  ShoppingBag,
  X,
  Edit,
  Navigation,
  Check
} from 'lucide-react';
import { DeliveryOrder, DeliveryZone, Product } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const Delivery: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'zones'>('orders');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // --- NEW DELIVERY ORDER MODAL ---
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState('1');
  const [tempCart, setTempCart] = useState<{ product: Product; qty: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [driverName, setDriverName] = useState('Estafeta KOMA Moto 1');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // --- ZONE MODAL ---
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneFee, setZoneFee] = useState('100');
  const [zoneMinutes, setZoneMinutes] = useState('30');

  const loadData = async () => {
    try {
      setLoading(true);
      const [ords, zns, prods] = await Promise.all([
        DatabaseService.getDeliveryOrders(),
        DatabaseService.getDeliveryZones(),
        DatabaseService.getProducts(),
      ]);
      setOrders(ords);
      setZones(zns);
      setProducts(prods);

      if (zns.length > 0 && !selectedZoneId) setSelectedZoneId(zns[0].id);
      if (prods.length > 0 && !selectedProductId) setSelectedProductId(prods[0].id);
    } catch (e) {
      console.error('Error loading delivery data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(o => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchQ =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.deliveryAddress.toLowerCase().includes(q);

      return matchStatus && matchQ;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleUpdateStatus = async (orderId: string, status: DeliveryOrder['status']) => {
    try {
      await DatabaseService.updateDeliveryStatus(orderId, status);
      success('Status Atualizado', `Pedido alterado para ${status.toUpperCase()}.`);
      await loadData();
    } catch (err: any) {
      error('Erro ao atualizar status', err.message);
    }
  };

  const handleAddToCart = () => {
    const p = products.find(x => x.id === selectedProductId);
    const q = parseInt(selectedQty, 10);
    if (!p || isNaN(q) || q <= 0) return;
    setTempCart(prev => [...prev, { product: p, qty: q }]);
  };

  const handleSaveDeliveryOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custAddress.trim()) {
      warning('Atenção', 'Informe o nome e endereço de entrega do cliente.');
      return;
    }
    if (tempCart.length === 0) {
      warning('Carrinho Vazio', 'Adicione pelo menos 1 item ao pedido de delivery.');
      return;
    }

    const zone = zones.find(z => z.id === selectedZoneId);
    const fee = zone ? zone.fee : 100;
    const itemsSubtotal = tempCart.reduce((acc, it) => acc + it.product.sellingPrice * it.qty, 0);
    const total = itemsSubtotal + fee;

    const orderSeq = Math.floor(Math.random() * 9000) + 1000;
    const orderNumber = `DEL-2026/${orderSeq}`;

    try {
      const newOrder: DeliveryOrder = {
        id: `del-${Date.now()}`,
        orderNumber,
        customerName: custName.trim(),
        customerPhone: custPhone.trim() || '+258 84 000 0000',
        deliveryAddress: custAddress.trim(),
        zoneId: selectedZoneId,
        zoneName: zone ? zone.name : 'Zona Central',
        deliveryFee: fee,
        driverName: driverName.trim(),
        status: 'kitchen',
        items: tempCart.map(it => ({
          cartItemId: `ci-${Date.now()}-${it.product.id}`,
          product: it.product,
          quantity: it.qty,
          unitPrice: it.product.sellingPrice,
          selectedModifiers: [],
          discount: 0,
          subtotal: it.product.sellingPrice * it.qty,
        })),
        total,
        paymentMethod,
        isPaid: false,
        notes: deliveryNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await DatabaseService.saveDeliveryOrder(newOrder);
      success('Pedido de Delivery Registrado!', `${newOrder.orderNumber} despachado para a cozinha.`);
      setIsOrderModalOpen(false);
      setTempCart([]);
      setCustName('');
      setCustAddress('');
      await loadData();
    } catch (err: any) {
      error('Erro ao registrar pedido', err.message);
    }
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;

    try {
      const newZone: DeliveryZone = {
        id: `zone-${Date.now()}`,
        name: zoneName.trim(),
        fee: parseFloat(zoneFee) || 100,
        estimatedMinutes: parseInt(zoneMinutes, 10) || 30,
        active: true,
      };

      await DatabaseService.saveDeliveryZone(newZone);
      success('Zona de Entrega Salva!', `Taxa de ${newZone.fee} MT configurada.`);
      setIsZoneModalOpen(false);
      setZoneName('');
      await loadData();
    } catch (err: any) {
      error('Erro ao salvar zona', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bike className="w-6 h-6 text-orange-600" />
            <span>Central de Delivery &amp; Taxas de Entrega</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de pedidos por aplicativo/telefone, despacho para motoboys e controle de zonas de entrega em Maputo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeTab === 'orders' ? (
            <button
              type="button"
              onClick={() => {
                setTempCart([]);
                setIsOrderModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Pedido Delivery</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsZoneModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Zona / Bairro</span>
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
          <Bike className="w-4 h-4 text-orange-600" />
          <span>Pedidos em Andamento ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'zones'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4 text-orange-600" />
          <span>Zonas &amp; Taxas de Entrega ({zones.length})</span>
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
                placeholder="Buscar por cliente, endereço, telefone ou número do pedido..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 text-xs cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="kitchen">🔥 Na Cozinha</option>
              <option value="delivering">🛵 Em Rota de Entrega</option>
              <option value="delivered">✅ Entregue com Sucesso</option>
            </select>
          </div>

          {/* Delivery Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm block">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        order.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'delivering'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {order.status === 'kitchen' && 'Na Cozinha'}
                      {order.status === 'delivering' && 'Em Trânsito'}
                      {order.status === 'delivered' && 'Entregue'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-700">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerName}</span>
                      <span className="text-slate-400 font-normal">({order.customerPhone})</span>
                    </div>

                    <div className="flex items-start gap-1.5 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                      <span>{order.deliveryAddress} ({order.zoneName})</span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Estafeta: <strong>{order.driverName || 'Pendente'}</strong></span>
                      <span className="font-bold text-slate-700">Taxa: {formatCurrency(order.deliveryFee)}</span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-xs">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600">
                        <span>{it.quantity}x {it.product.name}</span>
                        <span className="font-mono">{formatCurrency(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total a Cobrar</span>
                    <span className="font-mono font-black text-orange-950 text-base">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {order.status === 'kitchen' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'delivering')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        Despachar Moto
                      </button>
                    )}

                    {order.status === 'delivering' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        Confirmar Entrega
                      </button>
                    )}

                    {order.status === 'delivered' && (
                      <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>Finalizado</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                <Bike className="w-12 h-12 stroke-[1.2] mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">Nenhum pedido de delivery encontrado</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Clique em "Novo Pedido Delivery" para lançar um pedido recebido por telefone ou WhatsApp.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB: ZONES --- */}
      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map(zone => (
            <div
              key={zone.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-900 rounded-full font-bold text-[10px]">
                    {zone.estimatedMinutes} min estimado
                  </span>
                  <span className="text-xs font-bold text-emerald-700">Ativa</span>
                </div>

                <h4 className="font-black text-slate-900 text-base">{zone.name}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Taxa fixa de entrega cobrada por viagem para este setor de Maputo.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Taxa de Frete</span>
                  <span className="font-mono font-black text-slate-900 text-lg">
                    {formatCurrency(zone.fee)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL: NEW DELIVERY ORDER --- */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Bike className="w-5 h-5 text-orange-600" />
                <span>Lançar Pedido de Delivery</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryOrder} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Ex: Dra. Teresa Manhiça"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Telefone WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="+258 84..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Zona / Bairro de Destino</label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>
                        {z.name} (+{formatCurrency(z.fee)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Endereço Completo &amp; Ponto de Ref.</label>
                  <input
                    type="text"
                    required
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    placeholder="Ex: Av. Julius Nyerere nº 400, Apt 3B"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Add item row */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Adicionar Itens ao Pedido:</span>
                <div className="flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-xl font-bold"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.sellingPrice)})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(e.target.value)}
                    className="w-16 p-2 border border-slate-300 rounded-xl font-mono text-center font-bold bg-white"
                  />

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="py-2 px-3 bg-slate-900 text-white font-bold rounded-xl cursor-pointer"
                  >
                    + Adicionar
                  </button>
                </div>

                {/* Items in cart */}
                {tempCart.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-200">
                    {tempCart.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span>{it.qty}x {it.product.name}</span>
                        <span className="font-mono font-bold">{formatCurrency(it.product.sellingPrice * it.qty)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="mpesa">📱 M-Pesa</option>
                    <option value="emola">📱 e-Mola</option>
                    <option value="dinheiro">💵 Dinheiro na Entrega</option>
                    <option value="cartao">💳 POS Móvel no Local</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estafeta Responsável</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
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
                  className="px-5 py-2 font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer shadow-xs"
                >
                  Confirmar e Despachar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: NEW ZONE --- */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                <span>Nova Zona de Entrega</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsZoneModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome do Bairro / Setor *</label>
                <input
                  type="text"
                  required
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="Ex: Costa do Sol & Triunfo"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Taxa de Frete (MT) *</label>
                  <input
                    type="number"
                    required
                    value={zoneFee}
                    onChange={(e) => setZoneFee(e.target.value)}
                    placeholder="100"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tempo Estimado (min)</label>
                  <input
                    type="number"
                    value={zoneMinutes}
                    onChange={(e) => setZoneMinutes(e.target.value)}
                    placeholder="30"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 -mx-5 -mb-5">
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer shadow-xs"
                >
                  Salvar Zona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
