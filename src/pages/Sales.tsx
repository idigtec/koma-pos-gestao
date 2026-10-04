import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Printer,
  Ban,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  User,
  X
} from 'lucide-react';
import { DatabaseService } from '../services/db';
import { Sale, CompanySettings } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ReceiptModal } from '../components/modals/ReceiptModal';
import { PdfService } from '../services/pdfService';

export const Sales: React.FC = () => {
  const { canCancelSale, user } = useAuth();
  const { success, error, warning } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DatabaseService.getSettings as any);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Modals
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      const [salesData, settingsData] = await Promise.all([
        DatabaseService.getSales(),
        DatabaseService.getSettings(),
      ]);
      setSales(salesData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Filtered sales
  const filteredSales = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sales.filter(s => {
      const matchQuery =
        !q ||
        s.saleNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || s.status === statusFilter;

      const matchPayment =
        paymentFilter === 'all' ||
        s.payments.some(p => p.method === paymentFilter || p.label.toLowerCase().includes(paymentFilter.toLowerCase()));

      return matchQuery && matchStatus && matchPayment;
    });
  }, [sales, searchQuery, statusFilter, paymentFilter]);

  const handleCancelSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToCancel || !user) return;
    if (!cancellationReason.trim()) {
      warning('Atenção', 'Informe o motivo do cancelamento.');
      return;
    }

    try {
      setIsCancelling(true);
      await DatabaseService.cancelSale(saleToCancel.id, user, cancellationReason);
      success('Venda Cancelada', `A venda ${saleToCancel.saleNumber} foi cancelada e os itens retornaram ao estoque.`);
      setSaleToCancel(null);
      setCancellationReason('');
      await loadSales();
    } catch (err: any) {
      error('Erro ao cancelar venda', err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleExportPdfReport = () => {
    PdfService.generateSalesReport(filteredSales, settings, 'Histórico Geral');
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-orange-600" />
            <span>Histórico de Vendas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulte todos os pedidos efetuados no PDV, reimprima comprovantes e efetue cancelamentos.
          </p>
        </div>

        <button
          onClick={handleExportPdfReport}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-orange-400" />
          <span>Exportar Relatório em PDF</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por Nº da Venda, Cliente ou Operador..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          />
        </div>

        <div className="flex gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-700"
          >
            <option value="all">Todos os Status</option>
            <option value="completed">Concluídas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-700"
          >
            <option value="all">Todas as Formas de Pagamento</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao">Cartão</option>
            <option value="carteira_movel">Carteira Móvel (M-Pesa)</option>
            <option value="transferencia">Transferência</option>
          </select>
        </div>
      </div>

      {/* Sales List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nº Venda</th>
                <th className="py-3 px-4">Data/Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSales.map(sale => {
                const isCancelled = sale.status === 'cancelled';
                return (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{sale.saleNumber}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDateTime(sale.createdAt)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{sale.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{sale.cashierName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {sale.payments.map(p => p.label).join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isCancelled
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isCancelled ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {isCancelled ? 'Cancelada' : 'Concluída'}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-black font-mono text-sm ${isCancelled ? 'line-through text-slate-400' : 'text-emerald-800'}`}>
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Details */}
                        <button
                          onClick={() => setSelectedSaleForDetails(sale)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Ver Detalhes dos Itens"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Reprint Receipt */}
                        <button
                          onClick={() => {
                            setSelectedSaleForReceipt(sale);
                            setIsReceiptOpen(true);
                          }}
                          className="p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Imprimir / Baixar Comprovante"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Cancel Sale (if permitted) */}
                        {canCancelSale && !isCancelled && (
                          <button
                            onClick={() => setSaleToCancel(sale)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Cancelar Venda & Estornar Estoque"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhuma venda encontrada com os critérios informados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SALE DETAILS DRAWER / MODAL --- */}
      {selectedSaleForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Detalhes da Venda {selectedSaleForDetails.saleNumber}</h3>
                <span className="text-xs text-slate-400">{formatDateTime(selectedSaleForDetails.createdAt)}</span>
              </div>
              <button onClick={() => setSelectedSaleForDetails(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Cliente</span>
                  <span className="font-bold text-slate-800">{selectedSaleForDetails.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Operador do Caixa</span>
                  <span className="font-bold text-slate-800">{selectedSaleForDetails.cashierName}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">Itens da Venda</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {selectedSaleForDetails.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{item.product.name}</div>
                        {item.removedIngredients && item.removedIngredients.length > 0 && (
                          <div className="text-[10px] text-rose-700 font-bold uppercase">
                            {item.removedIngredients.map(r => `❌ Sem ${r}`).join(' • ')}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[10px] text-amber-800 font-medium italic">
                            📝 {item.notes}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                      <div className="text-right font-bold text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span>{formatCurrency(selectedSaleForDetails.subtotal)}</span>
                </div>
                {selectedSaleForDetails.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Desconto Concedido:</span>
                    <span>-{formatCurrency(selectedSaleForDetails.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Geral:</span>
                  <span className="text-emerald-800">{formatCurrency(selectedSaleForDetails.total)}</span>
                </div>
              </div>

              {/* Cancellation Info if cancelled */}
              {selectedSaleForDetails.status === 'cancelled' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                  <div className="font-bold">Informações do Cancelamento:</div>
                  <div className="text-[11px] mt-1">
                    Cancelado por: <strong>{selectedSaleForDetails.cancelledBy}</strong> em{' '}
                    {formatDateTime(selectedSaleForDetails.cancelledAt)}
                  </div>
                  <div className="text-[11px] mt-0.5">Motivo: {selectedSaleForDetails.cancellationReason}</div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSaleForDetails(null)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl hover:bg-slate-100"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CANCELLATION CONFIRMATION MODAL --- */}
      {saleToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <form onSubmit={handleCancelSale} className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">Cancelar Venda {saleToCancel.saleNumber}?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O cancelamento irá <strong>estornar automaticamente os produtos para o estoque</strong> e registrar a movimentação no histórico de auditoria.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Cancelamento</label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                placeholder="Ex: Cliente desistiu da compra / Erro no registro de itens"
                rows={3}
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaleToCancel(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Não, Manter Venda
              </button>
              <button
                type="submit"
                disabled={isCancelling}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center justify-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                {isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- RECEIPT MODAL --- */}
      <ReceiptModal
        sale={selectedSaleForReceipt}
        settings={settings}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setSelectedSaleForReceipt(null);
        }}
      />
    </div>
  );
};
