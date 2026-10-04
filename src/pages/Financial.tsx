import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Download,
  Calendar,
  DollarSign,
  PieChart,
  Tag,
  X,
  Wallet,
  Building2,
  CreditCard,
  Smartphone,
  Filter,
  CheckCircle2,
  Clock,
  Receipt,
  FileText,
  Printer,
  RotateCcw,
  Eye,
  Layers,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { DatabaseService } from '../services/db';
import { FinancialTransaction, CompanySettings, FinancialType } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PdfService } from '../services/pdfService';

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'caixa' | 'banco' | 'carteira_movel';
  number?: string;
  balance: number;
  color: string;
  bankName?: string;
}

export interface FinancialCategoryItem {
  id: string;
  name: string;
  type: 'inflow' | 'outflow' | 'both';
  color: string;
  budgetMonthly?: number;
}

export const Financial: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning, info } = useToast();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DatabaseService.getSettings as any);
  const [loading, setLoading] = useState(true);

  // Sub-tabs: 'lancamentos' | 'receitas' | 'despesas' | 'contas' | 'categorias' | 'dre'
  const [activeTab, setActiveTab] = useState<
    'lancamentos' | 'receitas' | 'despesas' | 'contas' | 'categorias' | 'dre'
  >('lancamentos');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'today' | '7days' | 'month' | 'year' | 'custom'>('month');
  const [customDateStart, setCustomDateStart] = useState<string>('');
  const [customDateEnd, setCustomDateEnd] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Accounts state
  const [accounts, setAccounts] = useState<FinancialAccount[]>([
    { id: 'acc-caixa', name: 'Caixa Físico Principal (Gaveta)', type: 'caixa', balance: 15400, color: '#ea580c' },
    { id: 'acc-bim', name: 'Millennium BIM (Conta Principal)', type: 'banco', number: '102938475', balance: 185600, color: '#dc2626', bankName: 'BIM' },
    { id: 'acc-bci', name: 'BCI Moçambique (Conta Empresarial)', type: 'banco', number: '984726153', balance: 94200, color: '#2563eb', bankName: 'BCI' },
    { id: 'acc-mpesa', name: 'M-Pesa Negócios (Vodacom)', type: 'carteira_movel', number: '+258 84 990 0001', balance: 42800, color: '#16a34a' },
    { id: 'acc-emola', name: 'e-Mola Empresas (Movitel)', type: 'carteira_movel', number: '+258 86 990 0001', balance: 18350, color: '#9333ea' },
  ]);

  // Categories state
  const [categories, setCategories] = useState<FinancialCategoryItem[]>([
    { id: 'cat-vendas', name: 'Vendas PDV & Takeaway', type: 'inflow', color: '#10b981', budgetMonthly: 350000 },
    { id: 'cat-delivery', name: 'Receitas de Delivery', type: 'inflow', color: '#06b6d4', budgetMonthly: 80000 },
    { id: 'cat-insumos', name: 'Insumos & Ingredientes', type: 'outflow', color: '#f97316', budgetMonthly: 120000 },
    { id: 'cat-embalagens', name: 'Embalagens & Descartáveis', type: 'outflow', color: '#f59e0b', budgetMonthly: 25000 },
    { id: 'cat-salarios', name: 'Salários & Comissões', type: 'outflow', color: '#8b5cf6', budgetMonthly: 75000 },
    { id: 'cat-aluguel', name: 'Aluguel do Imóvel & Taxas', type: 'outflow', color: '#ec4899', budgetMonthly: 40000 },
    { id: 'cat-utilidades', name: 'Água, Luz (EDM) & Internet', type: 'outflow', color: '#6366f1', budgetMonthly: 18000 },
    { id: 'cat-manutencao', name: 'Manutenção de Equipamentos', type: 'outflow', color: '#64748b', budgetMonthly: 15000 },
  ]);

  // Modals state
  const [isNewReceitaModalOpen, setIsNewReceitaModalOpen] = useState(false);
  const [isNewDespesaModalOpen, setIsNewDespesaModalOpen] = useState(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<FinancialTransaction | null>(null);

  // Form states for new entry (Receita or Despesa)
  const [entryType, setEntryType] = useState<FinancialType>('inflow');
  const [entryCategory, setEntryCategory] = useState('');
  const [entryAccount, setEntryAccount] = useState('acc-caixa');
  const [entryDescription, setEntryDescription] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryNotes, setEntryNotes] = useState('');
  const [entryCustomerSupplier, setEntryCustomerSupplier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for new account
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'caixa' | 'banco' | 'carteira_movel'>('banco');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');

  // Form states for new category
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'inflow' | 'outflow' | 'both'>('outflow');
  const [newCatColor, setNewCatColor] = useState('#f97316');
  const [newCatBudget, setNewCatBudget] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [trans, sett] = await Promise.all([
        DatabaseService.getFinancialTransactions(),
        DatabaseService.getSettings(),
      ]);
      setTransactions(trans);
      setSettings(sett);
    } catch (err) {
      console.error('Error loading financial:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = new Date();

    return transactions.filter((t) => {
      // 1. Tab-level filter
      if (activeTab === 'receitas' && t.type !== 'inflow') return false;
      if (activeTab === 'despesas' && t.type !== 'outflow') return false;

      // 2. Type filter dropdown
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // 3. Category filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // 4. Period filter
      if (periodFilter === 'today') {
        const todayStr = now.toISOString().slice(0, 10);
        if (t.date !== todayStr) return false;
      } else if (periodFilter === '7days') {
        const diffDays = (now.getTime() - new Date(t.date).getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (periodFilter === 'month') {
        const curMonth = now.toISOString().slice(0, 7);
        if (!t.date.startsWith(curMonth)) return false;
      } else if (periodFilter === 'year') {
        const curYear = now.getFullYear().toString();
        if (!t.date.startsWith(curYear)) return false;
      } else if (periodFilter === 'custom') {
        if (customDateStart && t.date < customDateStart) return false;
        if (customDateEnd && t.date > customDateEnd) return false;
      }

      // 5. Search query
      if (q) {
        const match =
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.userName.toLowerCase().includes(q) ||
          t.paymentMethod.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    transactions,
    activeTab,
    typeFilter,
    categoryFilter,
    periodFilter,
    customDateStart,
    customDateEnd,
    searchQuery,
  ]);

  // Overall financial sums
  const totalInflows = useMemo(() => {
    return transactions.filter((t) => t.type === 'inflow').reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const totalOutflows = useMemo(() => {
    return transactions.filter((t) => t.type === 'outflow').reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const netBalance = totalInflows - totalOutflows;

  // Filtered sums
  const filteredInflows = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === 'inflow').reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const filteredOutflows = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === 'outflow').reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  // Total balance in all accounts
  const totalAccountsBalance = useMemo(() => {
    return accounts.reduce((acc, a) => acc + a.balance, 0);
  }, [accounts]);

  // Handle Save Transaction (Receita or Despesa)
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const numAmount = parseFloat(entryAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      warning('Valor Inválido', 'O valor deve ser maior que zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      const chosenAccount = accounts.find((a) => a.id === entryAccount);
      const accLabel = chosenAccount ? chosenAccount.name : 'Caixa Geral';

      await DatabaseService.createFinancialTransaction({
        type: entryType,
        category: entryCategory || (entryType === 'inflow' ? 'Outras Receitas' : 'Despesas Gerais'),
        description: entryDescription.trim() || `${entryType === 'inflow' ? 'Receita' : 'Despesa'} avulsa`,
        amount: numAmount,
        paymentMethod: accLabel,
        date: entryDate,
        userId: user.id,
        userName: user.name,
        notes: entryNotes.trim()
          ? `${entryNotes.trim()} | Conta: ${accLabel}${entryCustomerSupplier ? ` | Terceiro: ${entryCustomerSupplier}` : ''}`
          : `Conta: ${accLabel}${entryCustomerSupplier ? ` | Terceiro: ${entryCustomerSupplier}` : ''}`,
      });

      // Update local account balance
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === entryAccount) {
            return {
              ...acc,
              balance: entryType === 'inflow' ? acc.balance + numAmount : acc.balance - numAmount,
            };
          }
          return acc;
        })
      );

      // Audit Log
      await DatabaseService.logAudit({
        userId: user.id,
        userName: user.name,
        action: entryType === 'inflow' ? 'RECEITA_LANCADA' : 'DESPESA_LANCADA',
        entity: 'FINANCIAL',
        description: `Lançamento ${entryType === 'inflow' ? 'de Receita' : 'de Despesa'}: ${entryDescription} (${formatCurrency(numAmount)}) na conta ${accLabel}.`,
        timestamp: new Date().toISOString(),
      });

      success(
        entryType === 'inflow' ? 'Receita Registrada!' : 'Despesa Registrada!',
        `Valor de ${formatCurrency(numAmount)} computado com sucesso no fluxo financeiro.`
      );

      setIsNewReceitaModalOpen(false);
      setIsNewDespesaModalOpen(false);
      setEntryDescription('');
      setEntryAmount('');
      setEntryNotes('');
      setEntryCustomerSupplier('');
      await loadData();
    } catch (err: any) {
      error('Erro ao registrar', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save New Account
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName) return;
    const initialBal = parseFloat(newAccBalance) || 0;
    const newAcc: FinancialAccount = {
      id: `acc-${Date.now()}`,
      name: newAccName,
      type: newAccType,
      number: newAccNumber || undefined,
      balance: initialBal,
      color: newAccType === 'carteira_movel' ? '#16a34a' : newAccType === 'banco' ? '#2563eb' : '#ea580c',
    };
    setAccounts((prev) => [...prev, newAcc]);
    success('Conta Criada!', `A conta "${newAccName}" foi adicionada com saldo de ${formatCurrency(initialBal)}.`);
    setIsNewAccountModalOpen(false);
    setNewAccName('');
    setNewAccNumber('');
    setNewAccBalance('');
  };

  // Handle Save New Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const budget = parseFloat(newCatBudget) || 0;
    const newCat: FinancialCategoryItem = {
      id: `cat-${Date.now()}`,
      name: newCatName,
      type: newCatType,
      color: newCatColor,
      budgetMonthly: budget > 0 ? budget : undefined,
    };
    setCategories((prev) => [...prev, newCat]);
    success('Categoria Adicionada!', `Categoria "${newCatName}" cadastrada no plano de contas.`);
    setIsNewCategoryModalOpen(false);
    setNewCatName('');
    setNewCatBudget('');
  };

  const handleExportPdf = () => {
    PdfService.generateFinancialReport(filteredTransactions, settings, 'Demonstrativo Geral');
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Gestão Financeira &amp; Fluxo de Caixa</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  Moçambique (MT)
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle integral de receitas, despesas, contas bancárias, carteiras M-Pesa/e-Mola, plano de contas e DRE.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => {
              setEntryType('inflow');
              setEntryCategory('Vendas PDV & Takeaway');
              setIsNewReceitaModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Receita (+)</span>
          </button>

          <button
            onClick={() => {
              setEntryType('outflow');
              setEntryCategory('Despesas Gerais');
              setIsNewDespesaModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa (-)</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entradas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold">Total Receitas (Entradas)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
            +{formatCurrency(totalInflows)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Vendas PDV, takeaway e aportes</div>
        </div>

        {/* Saídas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold">Total Despesas (Saídas)</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono tracking-tight">
            -{formatCurrency(totalOutflows)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Insumos, pessoal e utilidades</div>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold">Resultado Operacional</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(netBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Superávit operacional apurado</div>
        </div>

        {/* Saldo em Contas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold">Saldo Total em Contas</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatCurrency(totalAccountsBalance)}
          </div>
          <div className="text-[11px] text-blue-800 font-medium mt-1">
            {accounts.length} contas e carteiras ativas
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION SUB-TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex items-center gap-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('lancamentos')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'lancamentos'
              ? 'bg-orange-600 text-white shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Todos os Lançamentos ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('receitas')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'receitas'
              ? 'bg-emerald-600 text-white shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Receitas (+)</span>
        </button>

        <button
          onClick={() => setActiveTab('despesas')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'despesas'
              ? 'bg-rose-600 text-white shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Despesas (-)</span>
        </button>

        <button
          onClick={() => setActiveTab('contas')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'contas'
              ? 'bg-blue-600 text-white shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Contas &amp; Carteiras ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categorias')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'categorias'
              ? 'bg-purple-600 text-white shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Categorias ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dre')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'dre'
              ? 'bg-slate-900 text-white shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>DRE Gerencial</span>
        </button>
      </div>

      {/* 4. FILTERS BAR (For Lançamentos, Receitas and Despesas) */}
      {(activeTab === 'lancamentos' || activeTab === 'receitas' || activeTab === 'despesas') && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar lançamento por descrição, categoria, operador ou conta..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            {/* Quick Period Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0 self-start md:self-auto">
              <button
                onClick={() => setPeriodFilter('today')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  periodFilter === 'today' ? 'bg-white shadow-xs text-orange-950 font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setPeriodFilter('7days')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  periodFilter === '7days' ? 'bg-white shadow-xs text-orange-950 font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 Dias
              </button>
              <button
                onClick={() => setPeriodFilter('month')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  periodFilter === 'month' ? 'bg-white shadow-xs text-orange-950 font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mês Atual
              </button>
              <button
                onClick={() => setPeriodFilter('year')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  periodFilter === 'year' ? 'bg-white shadow-xs text-orange-950 font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ano
              </button>
              <button
                onClick={() => setPeriodFilter('custom')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  periodFilter === 'custom' ? 'bg-white shadow-xs text-orange-950 font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Personalizado
              </button>
            </div>

            {/* Toggle Advanced Filters Button */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 ${
                showAdvancedFilters
                  ? 'bg-orange-50 border-orange-300 text-orange-900'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-orange-600" />
              <span>Filtros {showAdvancedFilters ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* Advanced Filters Expandable Drawer */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Categoria:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tipo de Lançamento:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="all">Todos (Entradas &amp; Saídas)</option>
                  <option value="inflow">Apenas Entradas (+)</option>
                  <option value="outflow">Apenas Saídas (-)</option>
                </select>
              </div>

              {/* Custom Date Start */}
              {periodFilter === 'custom' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Início:</label>
                    <input
                      type="date"
                      value={customDateStart}
                      onChange={(e) => setCustomDateStart(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Fim:</label>
                    <input
                      type="date"
                      value={customDateEnd}
                      onChange={(e) => setCustomDateEnd(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. CONTENT AREA BY ACTIVE TAB */}

      {/* TAB: Lançamentos / Receitas / Despesas (Table View) */}
      {(activeTab === 'lancamentos' || activeTab === 'receitas' || activeTab === 'despesas') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Exibindo {filteredTransactions.length} registro(s) encontrado(s)
            </span>
            <div className="flex items-center gap-3 text-xs font-bold font-mono">
              <span className="text-emerald-700">+{formatCurrency(filteredInflows)}</span>
              <span className="text-rose-700">-{formatCurrency(filteredOutflows)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Descrição do Lançamento</th>
                  <th className="py-3 px-4">Conta / Método</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4 text-right">Valor (MT)</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTransactions.map((t) => {
                  const isInflow = t.type === 'inflow';
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedRecordDetail(t)}
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isInflow
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-rose-100 text-rose-900 border border-rose-200'
                          }`}
                        >
                          {isInflow ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isInflow ? 'Receita (+)' : 'Despesa (-)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {t.category}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">
                        <div className="font-medium">{t.description}</div>
                        {t.notes && <div className="text-[10px] text-slate-400 mt-0.5">{t.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {t.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {t.userName}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-black font-mono text-sm whitespace-nowrap ${
                          isInflow ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isInflow ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedRecordDetail(t)}
                          className="px-2.5 py-1 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detalhes</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      Nenhum lançamento financeiro corresponde aos filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Contas & Carteiras */}
      {activeTab === 'contas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span>Contas Bancárias, Carteiras Móveis &amp; Gavetas de Caixa</span>
              </h3>
              <p className="text-xs text-slate-500">
                Saldos disponíveis e conciliação financeira em Moçambique
              </p>
            </div>
            <button
              onClick={() => setIsNewAccountModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Conta / Carteira</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => {
              const isBank = acc.type === 'banco';
              const isMobile = acc.type === 'carteira_movel';

              return (
                <div
                  key={acc.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100" style={{ color: acc.color }}>
                        {isBank ? (
                          <Building2 className="w-5 h-5" />
                        ) : isMobile ? (
                          <Smartphone className="w-5 h-5" />
                        ) : (
                          <CreditCard className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                        {isBank ? 'Banco' : isMobile ? 'Móvel' : 'Caixa Físico'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {acc.name}
                    </h4>
                    {acc.number && (
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        Nº: {acc.number}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Saldo Atual:</span>
                      <span className="text-lg font-black font-mono text-slate-900">
                        {formatCurrency(acc.balance)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setAccountFilter(acc.name);
                        setActiveTab('lancamentos');
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Extrato</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: Categorias Financeiras */}
      {activeTab === 'categorias' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600" />
                <span>Plano de Contas &amp; Categorias de Custos</span>
              </h3>
              <p className="text-xs text-slate-500">
                Organização contábil de receitas operacionais e despesas do negócio
              </p>
            </div>
            <button
              onClick={() => setIsNewCategoryModalOpen(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Categoria</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.type === 'inflow'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {c.type === 'inflow' ? 'Receita' : 'Despesa'}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">{c.name}</h4>
                {c.budgetMonthly && (
                  <p className="text-[11px] text-slate-500">
                    Orçamento Mensal: <strong className="text-slate-800">{formatCurrency(c.budgetMonthly)}</strong>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: DRE Gerencial */}
      {activeTab === 'dre' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-600" />
              <span>DRE • Demonstrativo do Resultado do Exercício (Gerencial)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Apuração detalhada de Receita Líquida, CMV (Food Cost), Margem de Contribuição e Lucro Líquido Operacional (EBITDA).
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-white border-b border-slate-200 flex justify-between font-bold text-slate-800">
              <span>( + ) 1. RECEITA OPERACIONAL BRUTA (Vendas &amp; Refeições)</span>
              <span className="font-mono text-emerald-700">{formatCurrency(totalInflows)}</span>
            </div>

            <div className="p-3 px-6 flex justify-between text-slate-600 border-b border-slate-100">
              <span className="pl-4">( - ) Cancelamentos, Estornos e Descontos Concedidos</span>
              <span className="font-mono text-rose-700">-0.00 MT</span>
            </div>

            <div className="p-4 bg-slate-100/80 border-b border-slate-200 flex justify-between font-black text-slate-900">
              <span>( = ) RECEITA OPERACIONAL LÍQUIDA (ROL)</span>
              <span className="font-mono text-emerald-800">{formatCurrency(totalInflows)} (100%)</span>
            </div>

            <div className="p-3 px-6 flex justify-between text-slate-600 border-b border-slate-100">
              <span className="pl-4">( - ) Custo das Mercadorias Vendidas (CMV / Insumos Consumidos)</span>
              <span className="font-mono text-rose-700">
                -{formatCurrency(totalOutflows * 0.45)} ({(totalInflows > 0 ? ((totalOutflows * 0.45) / totalInflows * 100).toFixed(1) : 0)}%)
              </span>
            </div>

            <div className="p-4 bg-emerald-50/60 border-b border-emerald-200 flex justify-between font-black text-emerald-950">
              <span>( = ) LUCRO BRUTO OPERACIONAL (Margem de Contribuição)</span>
              <span className="font-mono">
                +{formatCurrency(Math.max(0, totalInflows - totalOutflows * 0.45))}
              </span>
            </div>

            <div className="p-3 px-6 flex justify-between text-slate-600 border-b border-slate-100">
              <span className="pl-4">( - ) Despesas Operacionais, Pessoal, Aluguel e Utilidades</span>
              <span className="font-mono text-rose-700">
                -{formatCurrency(totalOutflows * 0.55)}
              </span>
            </div>

            <div className="p-5 bg-slate-900 text-white flex justify-between items-center text-sm font-black">
              <span>( = ) RESULTADO OPERACIONAL LÍQUIDO (EBITDA / LUCRO FINAL)</span>
              <span className={`text-xl font-mono ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: NOVA RECEITA OU DESPESA --- */}
      {(isNewReceitaModalOpen || isNewDespesaModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveTransaction}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col"
          >
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                entryType === 'inflow' ? 'bg-emerald-700' : 'bg-rose-700'
              }`}
            >
              <h3 className="font-bold text-base flex items-center gap-2">
                {entryType === 'inflow' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                <span>{entryType === 'inflow' ? 'Lançar Nova Receita' : 'Lançar Nova Despesa'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsNewReceitaModalOpen(false);
                  setIsNewDespesaModalOpen(false);
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Valor (MT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm font-black font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Data do Lançamento
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Descrição do Lançamento *
                </label>
                <input
                  type="text"
                  value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)}
                  required
                  placeholder={
                    entryType === 'inflow'
                      ? 'Ex: Venda de Buffet Especial, Aporte ou Rendimento'
                      : 'Ex: Pagamento de Fornecedor de Carnes, Luz EDM, etc.'
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={entryCategory}
                    onChange={(e) => setEntryCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    {categories
                      .filter((c) => c.type === 'both' || c.type === entryType)
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Conta / Carteira
                  </label>
                  <select
                    value={entryAccount}
                    onChange={(e) => setEntryAccount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {entryType === 'inflow' ? 'Cliente / Terceiro' : 'Fornecedor / Beneficiário'}
                </label>
                <input
                  type="text"
                  value={entryCustomerSupplier}
                  onChange={(e) => setEntryCustomerSupplier(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Observações &amp; Notas Fiscais
                </label>
                <textarea
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  rows={2}
                  placeholder="Número de recibo, fatura ou detalhes adicionais..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsNewReceitaModalOpen(false);
                  setIsNewDespesaModalOpen(false);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2 text-white font-bold rounded-xl transition shadow-md cursor-pointer disabled:opacity-50 ${
                  entryType === 'inflow' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting ? 'Salvando...' : 'Confirmar Lançamento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: DETALHAMENTO DO REGISTRO --- */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-400" />
                <h3 className="font-black text-sm">Detalhamento do Registro Financeiro</h3>
              </div>
              <button
                onClick={() => setSelectedRecordDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="text-center pb-3 border-b border-dashed border-slate-200">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                  KOMA Fast Food Takeaway Lda
                </span>
                <div
                  className={`text-2xl font-black font-mono tracking-tight mt-1 ${
                    selectedRecordDetail.type === 'inflow' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {selectedRecordDetail.type === 'inflow' ? '+' : '-'}{formatCurrency(selectedRecordDetail.amount)}
                </div>
                <span
                  className={`inline-block mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedRecordDetail.type === 'inflow'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedRecordDetail.type === 'inflow' ? 'Receita Confirmada' : 'Despesa Liquidada'}
                </span>
              </div>

              <div className="space-y-2 py-2 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID do Lançamento:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedRecordDetail.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Data e Hora:</span>
                  <span className="font-mono">{formatDateTime(selectedRecordDetail.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Categoria:</span>
                  <span className="font-bold text-slate-900">{selectedRecordDetail.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Conta / Método:</span>
                  <span className="font-medium text-slate-800">{selectedRecordDetail.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Operador:</span>
                  <span className="font-medium text-slate-800">{selectedRecordDetail.userName}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Descrição:</span>
                  <p className="font-medium text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {selectedRecordDetail.description}
                  </p>
                </div>
                {selectedRecordDetail.notes && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Notas &amp; Metadados:</span>
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      {selectedRecordDetail.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Digital Hash / Security */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Certificação Digital</span>
                </span>
                <span className="font-mono">SHA256: {selectedRecordDetail.id.slice(-8).toUpperCase()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Recibo</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRecordDetail(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: NOVA CONTA BANCÁRIA / CARTEIRA --- */}
      {isNewAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveAccount}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 bg-blue-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                <span>Cadastrar Nova Conta / Carteira</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewAccountModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nome da Conta / Instituição *
                </label>
                <input
                  type="text"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  required
                  placeholder="Ex: Standard Bank, M-Pesa Caixa 2, Conta Tesouraria"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tipo de Conta
                  </label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="banco">Banco / Corrente</option>
                    <option value="carteira_movel">Carteira Móvel (M-Pesa/e-Mola)</option>
                    <option value="caixa">Caixa Físico / Gaveta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Saldo Inicial (MT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAccBalance}
                    onChange={(e) => setNewAccBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Número da Conta / Telefone M-Pesa
                </label>
                <input
                  type="text"
                  value={newAccNumber}
                  onChange={(e) => setNewAccNumber(e.target.value)}
                  placeholder="Ex: 102938475 ou +258 84 000 0000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewAccountModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md cursor-pointer"
              >
                Salvar Conta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: NOVA CATEGORIA --- */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveCategory}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 bg-purple-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Tag className="w-5 h-5" />
                <span>Nova Categoria Financeira</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewCategoryModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  placeholder="Ex: Fornecedores de Bebidas, Manutenção Predial"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="outflow">Despesa (Saída)</option>
                    <option value="inflow">Receita (Entrada)</option>
                    <option value="both">Ambos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Orçamento Mensal (MT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCatBudget}
                    onChange={(e) => setNewCatBudget(e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-10 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                  />
                  <span className="font-mono text-xs text-slate-600">{newCatColor}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewCategoryModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-md cursor-pointer"
              >
                Salvar Categoria
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
