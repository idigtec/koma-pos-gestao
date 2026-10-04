import React, { useState, useEffect } from 'react';
import {
  CircleDollarSign,
  LockOpen,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User,
  History,
  Download,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FileText
} from 'lucide-react';
import { DatabaseService } from '../services/db';
import { CashSession, CashMovement, CompanySettings } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useCash } from '../contexts/CashContext';
import { useToast } from '../contexts/ToastContext';
import { PdfService } from '../services/pdfService';
import { CashActionModal } from '../components/modals/CashActionModal';

export const CashRegister: React.FC = () => {
  const { activeSession, refreshCashSession } = useCash();
  const { success, error } = useToast();

  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DatabaseService.getSettings as any);
  const [loading, setLoading] = useState(true);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, sett] = await Promise.all([
        DatabaseService.getCashSessions(),
        DatabaseService.getSettings(),
      ]);
      setSessions(sessionsData);
      setSettings(sett);

      if (activeSession) {
        const moves = await DatabaseService.getCashMovements(activeSession.id);
        setMovements(moves);
      } else {
        const moves = await DatabaseService.getCashMovements();
        setMovements(moves.slice(0, 30));
      }
    } catch (err) {
      console.error('Error loading cash data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSession]);

  const handlePrintSessionReport = (session: CashSession) => {
    PdfService.generateCashReport(session, settings);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-orange-600" />
            <span>Controle de Caixa &amp; Movimentações</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Abertura de turno com fundo de troco, fechamento cego com conciliação, sangrias e suprimentos.
          </p>
        </div>

        <button
          onClick={() => setIsActionModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
        >
          <DollarSign className="w-4 h-4" />
          <span>Operações de Caixa</span>
        </button>
      </div>

      {/* Active Session Status Card */}
      {activeSession ? (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-xs p-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
                <LockOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">{activeSession.cashRegisterName}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 text-xs font-bold">
                    Turno em Aberto
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Operador: <strong>{activeSession.userName}</strong> | Aberto em: {formatDateTime(activeSession.openedAt)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsActionModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Fechar Caixa / Fazer Sangria
            </button>
          </div>

          {/* Real-time stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 pt-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Fundo Inicial</span>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(activeSession.initialAmount)}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Vendas em Dinheiro</span>
              <span className="text-sm font-bold text-orange-800">{formatCurrency(activeSession.totalSales)}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Sangrias (Retiradas)</span>
              <span className="text-sm font-bold text-rose-600">-{formatCurrency(activeSession.totalSangrias)}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Suprimentos (Entradas)</span>
              <span className="text-sm font-bold text-blue-600">+{formatCurrency(activeSession.totalSuprimentos)}</span>
            </div>

            <div className="col-span-2 md:col-span-1 p-3 bg-orange-600 text-white rounded-xl shadow-xs">
              <span className="text-orange-100 block text-[11px]">Esperado na Gaveta</span>
              <span className="text-base font-black">{formatCurrency(activeSession.expectedAmount)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center mx-auto mb-3 font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-rose-950">Nenhum Caixa Aberto no Momento</h3>
          <p className="text-slate-600 max-w-md mx-auto mt-1 mb-4">
            Para realizar vendas com movimentação em gaveta física, abra um novo turno com o valor inicial de troco.
          </p>
          <button
            onClick={() => setIsActionModalOpen(true)}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer"
          >
            Abrir Caixa Agora
          </button>
        </div>
      )}

      {/* Movements of current session */}
      {activeSession && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Movimentações do Turno Atual ({movements.length})
            </h3>
            <span className="text-xs text-slate-400">Sangrias, Suprimentos e Vendas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Horário</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descrição / Motivo</th>
                  <th className="py-3 px-4">Operador</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {movements.map(m => {
                  let badge = 'bg-slate-100 text-slate-700';
                  let sign = '';
                  let color = 'text-slate-900';

                  if (m.type === 'sangria') {
                    badge = 'bg-rose-100 text-rose-800';
                    sign = '-';
                    color = 'text-rose-600';
                  } else if (m.type === 'suprimento') {
                    badge = 'bg-blue-100 text-blue-800';
                    sign = '+';
                    color = 'text-blue-600';
                  } else if (m.type === 'sale') {
                    badge = 'bg-emerald-100 text-emerald-800';
                    sign = '+';
                    color = 'text-emerald-700';
                  }

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500">{formatDateTime(m.createdAt)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${badge}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{m.reason}</td>
                      <td className="py-3 px-4 text-slate-500">{m.userName}</td>
                      <td className={`py-3 px-4 text-right font-black font-mono ${color}`}>
                        {sign}{formatCurrency(m.amount)}
                      </td>
                    </tr>
                  );
                })}

                {movements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Nenhuma movimentação registrada no turno ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Histórico de Sessões de Caixa</h3>
            <p className="text-xs text-slate-500">Relatórios de fechamento, diferenças e conferência física</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Caixa</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Abertura</th>
                <th className="py-3 px-4">Fechamento</th>
                <th className="py-3 px-4 text-right">Fundo Inicial</th>
                <th className="py-3 px-4 text-right">Total Vendas</th>
                <th className="py-3 px-4 text-right">Esperado</th>
                <th className="py-3 px-4 text-right">Contado</th>
                <th className="py-3 px-4 text-center">Diferença</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Relatório</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sessions.map(s => {
                const diff = s.difference || 0;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.cashRegisterName}</td>
                    <td className="py-3 px-4 text-slate-600">{s.userName}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDateTime(s.openedAt)}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {s.closedAt ? formatDateTime(s.closedAt) : 'Em andamento'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatCurrency(s.initialAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-800 font-bold">
                      {formatCurrency(s.totalSales)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(s.expectedAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900">
                      {s.countedAmount !== undefined ? formatCurrency(s.countedAmount) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {s.status === 'closed' ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            diff === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : diff > 0
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {diff === 0 ? 'Exato' : diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          s.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.status === 'open' ? 'Aberto' : 'Fechado'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handlePrintSessionReport(s)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Baixar Relatório em PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CashActionModal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          loadData();
          refreshCashSession();
        }}
      />
    </div>
  );
};
