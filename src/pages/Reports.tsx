import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Boxes,
  CircleDollarSign,
  Printer,
  FileText,
  Sparkles
} from 'lucide-react';
import { DatabaseService } from '../services/db';
import { Sale, Product, CashSession, FinancialTransaction, CompanySettings } from '../types';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { PdfService } from '../services/pdfService';
import { useToast } from '../contexts/ToastContext';

export const Reports: React.FC = () => {
  const { success } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DatabaseService.getSettings as any);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const [salesData, prods, sess, trans, sett] = await Promise.all([
          DatabaseService.getSales(),
          DatabaseService.getProducts(),
          DatabaseService.getCashSessions(),
          DatabaseService.getFinancialTransactions(),
          DatabaseService.getSettings(),
        ]);
        setSales(salesData);
        setProducts(prods);
        setSessions(sess);
        setTransactions(trans);
        setSettings(sett);
      } catch (e) {
        console.error('Error loading reports:', e);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const handleDownloadSalesReport = () => {
    PdfService.generateSalesReport(sales, settings, 'Relatório Completo');
    success('Relatório Gerado', 'O PDF de vendas foi baixado com sucesso.');
  };

  const handleDownloadStockReport = () => {
    PdfService.generateStockReport(products, settings);
    success('Relatório Gerado', 'O PDF de inventário e estoque foi baixado com sucesso.');
  };

  const handleDownloadFinancialReport = () => {
    PdfService.generateFinancialReport(transactions, settings, 'Balanço Geral');
    success('Relatório Gerado', 'O PDF do demonstrativo financeiro foi baixado.');
  };

  const handleDownloadLastCashReport = () => {
    const lastSession = sessions[0];
    if (lastSession) {
      PdfService.generateCashReport(lastSession, settings);
      success('Relatório Gerado', `PDF de fechamento do caixa "${lastSession.cashRegisterName}" baixado.`);
    }
  };

  // Metrics
  const totalSalesRevenue = sales.filter(s => s.status === 'completed').reduce((acc, s) => acc + s.total, 0);
  const totalSalesCount = sales.filter(s => s.status === 'completed').length;
  const avgTicket = totalSalesCount > 0 ? totalSalesRevenue / totalSalesCount : 0;
  const stockCostVal = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
  const stockSaleVal = products.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);
  const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-orange-600" />
          <span>Central de Relatórios &amp; Documentos Oficiais</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Gere relatórios gerenciais e fiscais exportáveis em PDF de alta qualidade formatados para A4 e impressão.
        </p>
      </div>

      {/* Reports Grid (4 Key Reports) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. RELATÓRIO DE VENDAS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-orange-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Relatório de Vendas</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[11px] font-bold">
                {totalSalesCount} Vendas
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Consolidação de todas as vendas do PDV, detalhamento por operador, cliente, formas de pagamento utilizadas e ticket médio apurado.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-xl mb-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Total Faturado</span>
                <span className="font-bold text-slate-900">{formatCurrency(totalSalesRevenue)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ticket Médio</span>
                <span className="font-bold text-slate-900">{formatCurrency(avgTicket)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadSalesReport}
            className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Gerar &amp; Baixar PDF de Vendas</span>
          </button>
        </div>

        {/* 2. RELATÓRIO DE ESTOQUE & INVENTÁRIO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-blue-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Boxes className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Inventário &amp; Posição de Estoque</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                {products.length} Produtos
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Posição física atual de todas as mercadorias, valorização pelo custo de compra, potencial de venda bruta e lista de produtos com ruptura.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-xl mb-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Custo Imobilizado</span>
                <span className="font-bold text-slate-900">{formatCurrency(stockCostVal)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Estoque Baixo</span>
                <span className="font-bold text-rose-600">{lowStockCount} itens críticos</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadStockReport}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Gerar &amp; Baixar PDF de Estoque</span>
          </button>
        </div>

        {/* 3. RELATÓRIO FINANCEIRO (DRE) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-purple-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Demonstrativo Financeiro</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
                Fluxo de Caixa
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Relatório contábil com entradas, receitas de vendas, discriminação de despesas (Credelec, fornecedores, salários) e saldo líquido do negócio.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-xl mb-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Lançamentos</span>
                <span className="font-bold text-slate-900">{transactions.length} registros</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Empresa</span>
                <span className="font-bold text-slate-900 truncate">{settings.tradingName || 'Gestão PDV'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadFinancialReport}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Gerar &amp; Baixar PDF Financeiro</span>
          </button>
        </div>

        {/* 4. RELATÓRIO DE FECHAMENTO DE CAIXA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-amber-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Fechamento de Caixa &amp; Sangrias</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                {sessions.length} Turnos
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Comprovante de auditoria do caixa físico com fundo de abertura, sangrias, suprimentos, saldo esperado vs contado e apuração de sobras/quebras.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-xl mb-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Última Sessão</span>
                <span className="font-bold text-slate-900">{sessions[0]?.cashRegisterName || 'Nenhum'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status</span>
                <span className="font-bold text-slate-900">{sessions[0]?.status === 'open' ? 'Aberto' : 'Fechado'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadLastCashReport}
            disabled={sessions.length === 0}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Gerar PDF do Último Caixa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
