import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle,
  Play,
  RotateCcw,
  Bell,
  Volume2,
  VolumeX,
  Filter,
  Flame,
  Check,
  Search,
  RefreshCw,
  ShoppingBag,
  Bike,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { KitchenOrder, KitchenStatus, DiningOption } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';

export const KDS: React.FC = () => {
  const { success, info } = useToast();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendentes' | 'prontos' | 'finalizados'>('pendentes');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Web Audio chime for incoming orders
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext unavailable
    }
  };

  const loadOrders = async () => {
    try {
      const list = await DatabaseService.getKitchenOrders();
      setOrders(list);
    } catch (e) {
      console.error('Error loading kitchen orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Poll every 5 seconds for live kitchen updates
    const interval = setInterval(() => {
      loadOrders();
      setCurrentTime(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update timer ticks every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: KitchenStatus) => {
    try {
      await DatabaseService.updateKitchenStatus(orderId, newStatus);
      if (newStatus === 'pronto') {
        playChime();
        success('Pedido Pronto!', `O pedido está pronto para expedição.`);
      } else if (newStatus === 'em_preparo') {
        info('Preparo Iniciado', `A bancada iniciou a confecção do pedido.`);
      }
      await loadOrders();
    } catch (e: any) {
      console.error('Error updating kitchen status:', e);
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter === 'pendentes') {
        if (o.status !== 'novo' && o.status !== 'em_preparo') return false;
      } else if (statusFilter === 'prontos') {
        if (o.status !== 'pronto') return false;
      } else if (statusFilter === 'finalizados') {
        if (o.status !== 'entregue' && o.status !== 'cancelado') return false;
      }

      if (stationFilter !== 'all') {
        // filter by item categories or name keyword
        const matchesStation = o.items.some(it =>
          it.productName.toLowerCase().includes(stationFilter.toLowerCase())
        );
        if (!matchesStation) return false;
      }

      return true;
    });
  }, [orders, statusFilter, stationFilter]);

  // Counts
  const pendingCount = orders.filter(o => o.status === 'novo' || o.status === 'em_preparo').length;
  const readyCount = orders.filter(o => o.status === 'pronto').length;

  return (
    <div className="space-y-4">
      {/* Top KDS Header */}
      <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>KDS • Painel de Cozinha &amp; Expedição</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                LIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestão em tempo real das estações de preparo, tempos de montagem e controle de expedição.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 text-emerald-400 border-slate-700'
                : 'bg-slate-800/50 text-slate-500 border-slate-800'
            }`}
            title="Ligar/Desligar avisos sonoros de novo pedido"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
          </button>

          <button
            type="button"
            onClick={loadOrders}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-all cursor-pointer"
            title="Atualizar painel"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Station Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('pendentes')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pendentes'
                ? 'bg-orange-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🔥 Em Fila / Preparo</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-mono">
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('prontos')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'prontos'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>✅ Prontos p/ Expedição</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-mono">
              {readyCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('finalizados')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === 'finalizados'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>📜 Histórico Entregues</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold hidden sm:inline">Estação:</span>
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 cursor-pointer text-xs"
          >
            <option value="all">Todas as Estações</option>
            <option value="burger">🍔 Hambúrgueres / Grelha</option>
            <option value="batata">🍟 Fritadeiras &amp; Porções</option>
            <option value="coca">🥤 Bar &amp; Bebidas</option>
          </select>
        </div>
      </div>

      {/* Orders Grid / Kitchen Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredOrders.map(order => {
          const createdAtMs = new Date(order.createdAt).getTime();
          const elapsedMinutes = Math.floor((currentTime - createdAtMs) / 60000);
          const isDelayed = elapsedMinutes >= 15;
          const isWarning = elapsedMinutes >= 8 && !isDelayed;

          return (
            <div
              key={order.id}
              className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xs transition-all ${
                order.status === 'pronto'
                  ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-200'
                  : isDelayed
                  ? 'bg-rose-50/40 border-rose-300 ring-2 ring-rose-200 animate-pulse'
                  : isWarning
                  ? 'bg-amber-50/30 border-amber-300'
                  : 'bg-white border-slate-200 hover:border-orange-300'
              }`}
            >
              {/* Order Header */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-lg font-black text-slate-900 font-mono block">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {order.customerName || 'Cliente'}
                    </span>
                  </div>

                  {/* Dining Option Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      order.diningOption === 'mesa'
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : order.diningOption === 'takeaway'
                        ? 'bg-orange-100 text-orange-900 border border-orange-200'
                        : order.diningOption === 'delivery'
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {order.diningOption === 'mesa' && `🍽️ ${order.tableNumber || 'Mesa'}`}
                    {order.diningOption === 'takeaway' && '🛍️ Takeaway'}
                    {order.diningOption === 'delivery' && '🛵 Delivery'}
                    {order.diningOption === 'balcao' && '⚡ Balcão'}
                  </span>
                </div>

                {/* Live Timer */}
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <div
                    className={`flex items-center gap-1.5 font-bold font-mono px-2 py-0.5 rounded-lg ${
                      order.status === 'pronto'
                        ? 'bg-emerald-100 text-emerald-800'
                        : isDelayed
                        ? 'bg-rose-600 text-white font-black'
                        : isWarning
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsedMinutes} min</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {order.createdAt.slice(11, 16)}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 flex-1 space-y-3 divide-y divide-slate-100">
                {order.items.map((it, idx) => (
                  <div key={idx} className={idx > 0 ? 'pt-2.5' : ''}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-950 font-black text-xs flex items-center justify-center font-mono">
                          {it.quantity}x
                        </span>
                        <span className="font-black text-slate-900 text-xs">
                          {it.productName}
                        </span>
                      </div>
                    </div>

                    {/* Modifiers & Notes */}
                    {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 pl-8">
                        {it.selectedModifiers.map(mod => (
                          <span
                            key={mod.id}
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              mod.type === 'remove'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {mod.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {it.notes && (
                      <div className="mt-1 pl-8 text-[10px] font-bold text-amber-900 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                        📝 {it.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                {order.status === 'novo' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(order.id, 'em_preparo')}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Iniciar Preparo</span>
                  </button>
                )}

                {order.status === 'em_preparo' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(order.id, 'pronto')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Marcar Pronto</span>
                  </button>
                )}

                {order.status === 'pronto' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(order.id, 'entregue')}
                    className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Entregue ao Cliente / Garçom</span>
                  </button>
                )}

                {order.status === 'entregue' && (
                  <span className="w-full text-center text-xs font-bold text-slate-400 py-1 flex items-center justify-center gap-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Pedido Concluído</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="col-span-full p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
            <UtensilsCrossed className="w-12 h-12 stroke-[1.2] mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">Nenhum pedido nesta fila no momento</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Assim que novos pedidos forem confirmados no PDV, eles aparecerão instantaneamente aqui com sonorização.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
