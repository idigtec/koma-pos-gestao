import React, { useState } from 'react';
import {
  X,
  LockOpen,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useCash } from '../../contexts/CashContext';
import { formatCurrency } from '../../utils/formatters';
import { PdfService } from '../../services/pdfService';
import { DatabaseService } from '../../services/db';

interface CashActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabMode = 'status' | 'open' | 'close' | 'sangria' | 'suprimento';

export const CashActionModal: React.FC<CashActionModalProps> = ({ isOpen, onClose }) => {
  const { activeSession, openCash, closeCash, doSangria, doSuprimento, refreshCashSession } = useCash();
  const [mode, setMode] = useState<TabMode>('status');

  // Form states
  const [registerName, setRegisterName] = useState('Caixa Principal #001');
  const [initialAmount, setInitialAmount] = useState('2000');
  const [countedAmount, setCountedAmount] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const amount = parseFloat(initialAmount.replace(',', '.')) || 0;
    const ok = await openCash(registerName, amount, notes);
    setIsSubmitting(false);
    if (ok) {
      setMode('status');
      onClose();
    }
  };

  const handleCloseCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    setIsSubmitting(true);
    const counted = parseFloat(countedAmount.replace(',', '.')) || 0;
    const closed = await closeCash(counted, notes);
    setIsSubmitting(false);
    if (closed) {
      // Offer PDF download
      const settings = await DatabaseService.getSettings();
      PdfService.generateCashReport(closed, settings);
      setCountedAmount('');
      setNotes('');
      setMode('status');
      onClose();
    }
  };

  const handleSangria = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const amount = parseFloat(movementAmount.replace(',', '.')) || 0;
    const ok = await doSangria(amount, movementReason);
    setIsSubmitting(false);
    if (ok) {
      setMovementAmount('');
      setMovementReason('');
      setMode('status');
    }
  };

  const handleSuprimento = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const amount = parseFloat(movementAmount.replace(',', '.')) || 0;
    const ok = await doSuprimento(amount, movementReason);
    setIsSubmitting(false);
    if (ok) {
      setMovementAmount('');
      setMovementReason('');
      setMode('status');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DollarSign className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-base">Gestão de Caixa &amp; Movimentações</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setMode('status')}
            className={`px-4 py-3 border-b-2 transition-colors shrink-0 ${
              mode === 'status' ? 'border-orange-600 text-orange-950 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Visão Geral
          </button>
          {!activeSession ? (
            <button
              onClick={() => setMode('open')}
              className={`px-4 py-3 border-b-2 transition-colors shrink-0 ${
                mode === 'open' ? 'border-orange-600 text-orange-950 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Abrir Caixa
            </button>
          ) : (
            <>
              <button
                onClick={() => setMode('sangria')}
                className={`px-4 py-3 border-b-2 transition-colors shrink-0 ${
                  mode === 'sangria' ? 'border-orange-600 text-orange-950 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Sangria (Retirada)
              </button>
              <button
                onClick={() => setMode('suprimento')}
                className={`px-4 py-3 border-b-2 transition-colors shrink-0 ${
                  mode === 'suprimento' ? 'border-orange-600 text-orange-950 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Suprimento (Entrada)
              </button>
              <button
                onClick={() => setMode('close')}
                className={`px-4 py-3 border-b-2 transition-colors shrink-0 text-rose-600 ${
                  mode === 'close' ? 'border-rose-600 text-rose-800 bg-white' : 'border-transparent hover:text-rose-900'
                }`}
              >
                Fechar Caixa
              </button>
            </>
          )}
        </div>

        <div className="p-6">
          {/* 1. STATUS VIEW */}
          {mode === 'status' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  activeSession
                    ? 'bg-orange-50/70 border-orange-200 text-orange-950'
                    : 'bg-rose-50/70 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {activeSession ? (
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                      <LockOpen className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                      <Lock className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {activeSession ? activeSession.cashRegisterName : 'Nenhum Caixa Aberto'}
                    </div>
                    <div className="text-xs text-slate-600">
                      {activeSession ? `Operador: ${activeSession.userName}` : 'Abra o caixa para iniciar as vendas no PDV.'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                      activeSession ? 'bg-orange-100 text-orange-900' : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {activeSession ? 'ABERTO' : 'FECHADO'}
                  </span>
                </div>
              </div>

              {activeSession ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Fundo Inicial</span>
                    <span className="text-sm font-bold text-slate-800">{formatCurrency(activeSession.initialAmount)}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Total de Vendas</span>
                    <span className="text-sm font-bold text-orange-800">{formatCurrency(activeSession.totalSales)}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Sangrias (Retiradas)</span>
                    <span className="text-sm font-bold text-rose-600">-{formatCurrency(activeSession.totalSangrias)}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Suprimentos</span>
                    <span className="text-sm font-bold text-blue-600">+{formatCurrency(activeSession.totalSuprimentos)}</span>
                  </div>

                  <div className="col-span-2 bg-orange-600 text-white p-3.5 rounded-xl shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-orange-100 text-xs font-medium block">Saldo Esperado na Gaveta</span>
                      <span className="text-lg font-black">{formatCurrency(activeSession.expectedAmount)}</span>
                    </div>
                    <button
                      onClick={() => setMode('close')}
                      className="bg-white text-orange-950 hover:bg-orange-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      Fechar Turno
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-500 mb-4">
                    Para registrar vendas e emitir comprovantes, é necessário abrir um turno de caixa com valor inicial de troco.
                  </p>
                  <button
                    onClick={() => setMode('open')}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md shadow-orange-900/10"
                  >
                    Abrir Caixa Agora
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. OPEN CASH FORM */}
          {mode === 'open' && (
            <form onSubmit={handleOpenCash} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Identificação do Caixa</label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fundo de Troco Inicial (MT)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden pl-8"
                    placeholder="0,00"
                    required
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">MT</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações de Abertura (Opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  rows={2}
                  placeholder="Ex: Turno matinal, notas trocadas conferidas."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('status')}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-xs"
                >
                  {isSubmitting ? 'Abrindo...' : 'Confirmar Abertura'}
                </button>
              </div>
            </form>
          )}

          {/* 3. SANGRIA FORM */}
          {mode === 'sangria' && (
            <form onSubmit={handleSangria} className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                <ArrowUpRight className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Sangria de Caixa:</strong> Retirada física de dinheiro da gaveta para depósito bancário, cofre ou pagamento de fornecedor emergencial.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor da Retirada (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  placeholder="Ex: 5000"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Destino</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  placeholder="Ex: Depósito bancário BIM / Sangria de segurança"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('status')}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar Sangria'}
                </button>
              </div>
            </form>
          )}

          {/* 4. SUPRIMENTO FORM */}
          {mode === 'suprimento' && (
            <form onSubmit={handleSuprimento} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <ArrowDownLeft className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Suprimento de Caixa:</strong> Aporte adicional de moedas ou notas para reforçar o troco da gaveta durante o expediente.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor do Aporte (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="Ex: 2000"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Suprimento</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="Ex: Reforço de troco para notas de 100 MT e 50 MT"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('status')}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar Suprimento'}
                </button>
              </div>
            </form>
          )}

          {/* 5. CLOSE CASH FORM */}
          {mode === 'close' && activeSession && (
            <form onSubmit={handleCloseCash} className="space-y-4">
              <div className="p-3 bg-slate-100 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Saldo Esperado na Gaveta:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(activeSession.expectedAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>(Fundo inicial + Vendas + Suprimentos - Sangrias)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor Contado Fisicamente na Gaveta (MT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={countedAmount}
                  onChange={(e) => setCountedAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  placeholder="Conte o dinheiro físico e digite aqui..."
                  required
                />
              </div>

              {countedAmount !== '' && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    parseFloat(countedAmount) - activeSession.expectedAmount === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : parseFloat(countedAmount) - activeSession.expectedAmount > 0
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  Diferença Apurada:{' '}
                  {formatCurrency(parseFloat(countedAmount) - activeSession.expectedAmount)}{' '}
                  {parseFloat(countedAmount) - activeSession.expectedAmount === 0
                    ? '(Valores conferidos exatamente)'
                    : parseFloat(countedAmount) - activeSession.expectedAmount > 0
                    ? '(Sobra de caixa)'
                    : '(Falta/Quebra de caixa)'}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações de Fechamento</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  rows={2}
                  placeholder="Ex: Turno encerrado normalmente, gaveta entregue ao supervisor."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('status')}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || countedAmount === ''}
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Fechando...' : 'Fechar & Gerar PDF'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
