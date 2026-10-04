import React, { useState, useEffect } from 'react';
import {
  X,
  UtensilsCrossed,
  Users,
  CheckCircle,
  Clock,
  Receipt,
  ArrowRightLeft,
  Plus,
  RefreshCw
} from 'lucide-react';
import { DiningTable, ComandaTab, CartItem } from '../../types';
import { DatabaseService } from '../../services/db';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface TableMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTable: (tableNumber: string, comanda?: ComandaTab) => void;
  currentTableNumber?: string;
}

export const TableMapModal: React.FC<TableMapModalProps> = ({
  isOpen,
  onClose,
  onSelectTable,
  currentTableNumber,
}) => {
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [comandas, setComandas] = useState<ComandaTab[]>([]);
  const [selectedZone, setSelectedZone] = useState<'all' | 'salao' | 'esplanada' | 'balcao' | 'vip'>('all');
  const [loading, setLoading] = useState(false);

  const loadTables = async () => {
    try {
      setLoading(true);
      const [tbls, cmds] = await Promise.all([
        DatabaseService.getTables(),
        DatabaseService.getComandas(),
      ]);
      setTables(tbls);
      setComandas(cmds);
    } catch (e) {
      console.error('Error loading tables:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTables = tables.filter(
    t => selectedZone === 'all' || t.zone === selectedZone
  );

  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const freeCount = tables.filter(t => t.status === 'free').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-tight">
                Mapa de Mesas &amp; Salão de Atendimento
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecione uma mesa para vincular ao pedido ou abra uma comanda em andamento.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadTables}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="Atualizar mesas"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Zones and Stats Bar */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedZone('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedZone === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({tables.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedZone('salao')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedZone === 'salao'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Salão Principal
            </button>
            <button
              type="button"
              onClick={() => setSelectedZone('esplanada')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedZone === 'esplanada'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Esplanada Aberta
            </button>
            <button
              type="button"
              onClick={() => setSelectedZone('balcao')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedZone === 'balcao'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Balcão
            </button>
            <button
              type="button"
              onClick={() => setSelectedZone('vip')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedZone === 'vip'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Sala VIP
            </button>
          </div>

          <div className="flex items-center gap-3 font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{freeCount} Livres</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>{occupiedCount} Ocupadas</span>
            </span>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredTables.map(tbl => {
              const activeComanda = comandas.find(c => c.tableNumber === tbl.number && c.status === 'open');
              const isOccupied = tbl.status === 'occupied' || Boolean(activeComanda);
              const isSelectedCurrent = currentTableNumber === tbl.number;

              return (
                <div
                  key={tbl.id}
                  onClick={() => {
                    onSelectTable(tbl.number, activeComanda);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5 ${
                    isSelectedCurrent
                      ? 'border-orange-500 ring-2 ring-orange-500 bg-orange-50/50'
                      : isOccupied
                      ? 'border-rose-200 bg-rose-50/40 hover:border-rose-400 hover:shadow-md'
                      : 'border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tbl.capacity} lug.</span>
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isOccupied
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isOccupied ? 'Ocupada' : 'Livre'}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-base leading-tight">
                      {tbl.number}
                    </h4>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {tbl.zone}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    {activeComanda ? (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Consumo Atual:</span>
                        <span className="font-mono font-black text-orange-950 text-sm">
                          {formatCurrency(activeComanda.total)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700">
                        Clique para ocupar
                      </span>
                    )}

                    <span className="text-slate-400 group-hover:text-orange-600 font-bold text-xs">
                      →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Dica: você também pode abrir pedidos em modo <strong>Balcão</strong> ou <strong>Takeaway</strong> diretamente no PDV.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 font-bold text-slate-700 rounded-xl cursor-pointer hover:bg-slate-100"
          >
            Fechar Mapa
          </button>
        </div>
      </div>
    </div>
  );
};
