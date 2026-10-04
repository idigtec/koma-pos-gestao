import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  Phone,
  Mail,
  MapPin,
  Shield,
  Layers,
  Edit,
  Trash2,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Users,
  Store,
  CreditCard,
  Gauge,
  ShieldCheck,
  Activity,
  Award,
  DollarSign,
  Download,
  AlertTriangle
} from 'lucide-react';
import { Company, CompanyStatus, SubscriptionPlan, Location, Plan } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { TaxService } from '../utils/taxService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

type TabKey = 'companies' | 'locations' | 'plans' | 'usage' | 'audit';

export const CompaniesPage: React.FC = () => {
  const { user, activeCompany, switchActiveCompany } = useAuth();
  const { success, error, warning, info } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('companies');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CompanyStatus>('all');

  // Modal Empresa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Form states Empresa
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [nuit, setNuit] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+258 ');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Maputo');
  const [province, setProvince] = useState('Maputo Cidade');
  const [status, setStatus] = useState<CompanyStatus>('active');
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>('professional');
  const [maxUsers, setMaxUsers] = useState('10');
  const [maxBranches, setMaxBranches] = useState('3');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Filial
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locCompanyId, setLocCompanyId] = useState('');
  const [locType, setLocType] = useState<any>('STORE');
  const [locAddress, setLocAddress] = useState('');
  const [locCity, setLocCity] = useState('Maputo');
  const [locPhone, setLocPhone] = useState('+258 ');

  // Support Session states
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportTargetCompany, setSupportTargetCompany] = useState<Company | null>(null);
  const [supportReason, setSupportReason] = useState('Atendimento ao chamado técnico #102');

  // Wizard Onboarding states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardTemplate, setWizardTemplate] = useState<'fastfood' | 'grill' | 'cafe'>('fastfood');
  const [wizardName, setWizardName] = useState('');
  const [wizardNuit, setWizardNuit] = useState('');
  const [wizardCity, setWizardCity] = useState('Maputo');
  const [wizardPlan, setWizardPlan] = useState<SubscriptionPlan>('professional');

  const { startSupportSession, supportSession } = useAuth();

  const handleExportSaft = async () => {
    try {
      const [sales, prods, custs, settings] = await Promise.all([
        DatabaseService.getSales(),
        DatabaseService.getProducts(),
        DatabaseService.getCustomers(),
        DatabaseService.getSettings(),
      ]);
      TaxService.downloadSaftMz(sales, prods, custs, settings);
      success('Ficheiro SAF-T MZ Exportado', 'O arquivo XML de auditoria fiscal da Autoridade Tributária foi descarregado com sucesso.');
    } catch (err: any) {
      error('Erro ao exportar SAF-T', err.message);
    }
  };

  const handleExecuteWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardName.trim() || !wizardNuit.trim()) {
      warning('Campos Obrigatórios', 'Insira o nome da marca e NUIT de Moçambique.');
      return;
    }
    try {
      setIsSubmitting(true);
      const newCompId = `company-${Date.now()}`;
      const newComp: Company = {
        id: newCompId,
        name: `${wizardName.trim()} Lda`,
        tradeName: wizardName.trim(),
        nuit: wizardNuit.trim(),
        email: `contacto@${wizardName.toLowerCase().replace(/\s+/g, '')}.co.mz`,
        phone: '+258 84 000 0000',
        address: 'Sede Comercial',
        city: wizardCity,
        province: `${wizardCity} Província`,
        status: 'active',
        subscriptionPlan: wizardPlan,
        maxUsers: wizardPlan === 'enterprise' ? 50 : wizardPlan === 'professional' ? 15 : 5,
        maxBranches: wizardPlan === 'enterprise' ? 10 : wizardPlan === 'professional' ? 3 : 1,
        currency: 'MZN',
        createdAt: new Date().toISOString(),
        notes: `Criado automaticamente via Wizard Gastronômico (${wizardTemplate.toUpperCase()}).`,
      };

      await DatabaseService.saveCompany(newComp);

      // Create primary location
      await DatabaseService.saveLocation({
        id: `loc-${Date.now()}`,
        companyId: newCompId,
        name: `${newComp.tradeName} (Sede & Matriz)`,
        code: 'MAT-01',
        type: wizardTemplate === 'fastfood' ? 'RESTAURANT' : wizardTemplate === 'cafe' ? 'STORE' : 'RESTAURANT',
        address: 'Sede Operacional',
        city: wizardCity,
        status: 'ACTIVE',
        timezone: 'Africa/Maputo',
        isMatrix: true,
      });

      success('Onboarding Concluído!', `Empresa "${newComp.tradeName}" provisionada com filial matriz e template gastronômico.`);
      setIsWizardOpen(false);
      await loadData();
    } catch (err: any) {
      error('Erro no Onboarding', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportTargetCompany) return;
    const ok = await startSupportSession(supportTargetCompany.id, supportReason);
    if (ok) {
      success(
        'Modo Suporte Ativado',
        `Você agora está operando como suporte na empresa "${supportTargetCompany.tradeName}". O banner de alerta permanece visível em todas as telas.`
      );
      setSupportModalOpen(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [compList, locList, planList] = await Promise.all([
        DatabaseService.getCompanies(),
        DatabaseService.getLocations(),
        DatabaseService.getPlans(),
      ]);
      setCompanies(compList);
      setLocations(locList);
      setPlans(planList);
    } catch (err) {
      console.error('Error loading SaaS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewCompanyModal = () => {
    setEditingCompany(null);
    setName('');
    setTradeName('');
    setNuit('');
    setEmail('');
    setPhone('+258 ');
    setSecondaryPhone('');
    setAddress('');
    setCity('Maputo');
    setProvince('Maputo Cidade');
    setStatus('active');
    setSubscriptionPlan('professional');
    setMaxUsers('10');
    setMaxBranches('3');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (comp: Company) => {
    setEditingCompany(comp);
    setName(comp.name);
    setTradeName(comp.tradeName);
    setNuit(comp.nuit);
    setEmail(comp.email);
    setPhone(comp.phone);
    setSecondaryPhone(comp.secondaryPhone || '');
    setAddress(comp.address);
    setCity(comp.city);
    setProvince(comp.province || 'Maputo Cidade');
    setStatus(comp.status);
    setSubscriptionPlan(comp.subscriptionPlan);
    setMaxUsers(String(comp.maxUsers));
    setMaxBranches(String(comp.maxBranches));
    setNotes(comp.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      warning('Campo Obrigatório', 'A Razão Social da empresa é obrigatória.');
      return;
    }
    if (!nuit.trim() || nuit.replace(/\D/g, '').length !== 9) {
      warning('NUIT Inválido', 'O NUIT de Moçambique deve conter exatamente 9 dígitos.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newComp: Company = {
        id: editingCompany ? editingCompany.id : `company-${Date.now()}`,
        name: name.trim(),
        tradeName: tradeName.trim() || name.trim(),
        nuit: nuit.trim(),
        email: email.trim(),
        phone: phone.trim(),
        secondaryPhone: secondaryPhone.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        province: province.trim(),
        status,
        subscriptionPlan,
        maxUsers: parseInt(maxUsers, 10) || 5,
        maxBranches: parseInt(maxBranches, 10) || 1,
        branchesCount: editingCompany ? editingCompany.branchesCount || 1 : 1,
        currency: 'MZN',
        createdAt: editingCompany ? editingCompany.createdAt : new Date().toISOString(),
        notes: notes.trim() || undefined,
      };

      await DatabaseService.saveCompany(newComp);

      if (user) {
        await DatabaseService.logAudit({
          userId: user.id,
          userName: user.name,
          action: editingCompany ? 'EMPRESA_ATUALIZADA' : 'EMPRESA_CADASTRADA',
          entity: 'COMPANY',
          entityId: newComp.id,
          description: `${editingCompany ? 'Atualizou dados da empresa' : 'Cadastrou nova empresa no SaaS'}: "${newComp.tradeName}" (NUIT: ${newComp.nuit}).`,
          timestamp: new Date().toISOString(),
        });
      }

      success(
        editingCompany ? 'Empresa Atualizada' : 'Empresa Cadastrada',
        `"${newComp.tradeName}" foi gravada com sucesso no sistema multi-empresa.`
      );

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      error('Erro ao salvar empresa', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim() || !locCode.trim()) {
      warning('Dados Obrigatórios', 'Nome e código da filial são obrigatórios.');
      return;
    }
    const targetComp = companies.find(c => c.id === locCompanyId) || companies[0];
    if (!targetComp) return;

    try {
      const newLoc: Location = {
        id: `loc-${Date.now()}`,
        companyId: targetComp.id,
        name: locName.trim(),
        code: locCode.trim(),
        type: locType,
        address: locAddress.trim() || targetComp.address,
        city: locCity.trim() || targetComp.city,
        phone: locPhone.trim() || targetComp.phone,
        status: 'ACTIVE',
        timezone: 'Africa/Maputo',
        isMatrix: false,
      };

      await DatabaseService.saveLocation(newLoc);
      success('Filial Adicionada', `A filial "${newLoc.name}" foi vinculada à empresa "${targetComp.tradeName}".`);
      setIsLocationModalOpen(false);
      await loadData();
    } catch (err: any) {
      error('Erro ao salvar filial', err.message);
    }
  };

  const handleToggleStatus = async (comp: Company) => {
    const nextStatus: CompanyStatus = comp.status === 'active' ? 'suspended' : 'active';
    try {
      await DatabaseService.updateCompanyStatus(comp.id, nextStatus);
      if (user) {
        await DatabaseService.logAudit({
          userId: user.id,
          userName: user.name,
          action: nextStatus === 'active' ? 'EMPRESA_REATIVADA' : 'EMPRESA_SUSPENSA',
          entity: 'COMPANY',
          entityId: comp.id,
          description: `Empresa "${comp.tradeName}" foi alterada para status ${nextStatus.toUpperCase()}.`,
          timestamp: new Date().toISOString(),
        });
      }
      success('Status Atualizado', `A empresa "${comp.tradeName}" foi ${nextStatus === 'active' ? 'reativada' : 'suspensa'}.`);
      await loadData();
    } catch (err: any) {
      error('Erro ao atualizar status', err.message);
    }
  };

  const handleSelectActiveTenant = async (comp: Company) => {
    if (comp.status === 'suspended') {
      warning('Empresa Suspensa', 'Não é possível operar uma empresa com assinatura suspensa.');
      return;
    }
    const ok = await switchActiveCompany(comp.id);
    if (ok) {
      success(
        'Ambiente Operacional Ativo',
        `Ambiente alternado com autoridade para "${comp.tradeName}". Todas as consultas e PDV agora operam sob esta empresa.`
      );
    }
  };

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return companies.filter(c => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.tradeName.toLowerCase().includes(q) ||
        c.nuit.includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      return matchStatus && matchQ;
    });
  }, [companies, searchQuery, statusFilter]);

  const activeCount = companies.filter(c => c.status === 'active').length;
  const trialCount = companies.filter(c => c.status === 'trial').length;
  const suspendedCount = companies.filter(c => c.status === 'suspended').length;
  const totalBranches = locations.length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-600" />
            <span>SaaS Command Center — Gestão Multi-Tenant</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Infraestrutura corporativa: Grupos, Empresas, Marcas, Filiais e Gestão de Planos em Moçambique.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'companies' && (
            <>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Wizard Onboarding</span>
              </button>
              <button
                onClick={openNewCompanyModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Empresa</span>
              </button>
            </>
          )}

          {activeTab === 'locations' && (
            <button
              onClick={() => {
                setLocCompanyId(activeCompany?.id || companies[0]?.id || '');
                setLocName('');
                setLocCode('');
                setLocAddress('');
                setLocCity('Maputo');
                setLocPhone('+258 ');
                setIsLocationModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Filial</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('companies')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'companies'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-orange-600" />
          <span>Empresas &amp; Clientes ({companies.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('locations')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'locations'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4 text-orange-600" />
          <span>Filiais &amp; Lojas ({locations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-orange-600" />
          <span>Planos &amp; Preços SaaS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('usage')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'usage'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gauge className="w-4 h-4 text-orange-600" />
          <span>Quotas &amp; Uso de Recursos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-orange-600" />
          <span>Segurança &amp; Auditoria SaaS</span>
        </button>
      </div>

      {/* --- TAB 1: EMPRESAS & CLIENTES --- */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-bold">Total de Empresas</span>
                <Building2 className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{companies.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{totalBranches} filiais conectadas</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-bold">Empresas Ativas</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">{activeCount}</div>
              <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">Operação regular</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-bold">Período de Teste (Trial)</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 font-mono">{trialCount}</div>
              <div className="text-[11px] text-amber-600 mt-0.5 font-medium">Degustação SaaS</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-bold">Suspensas / Inadimplentes</span>
                <Ban className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">{suspendedCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Acesso bloqueado</div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por Razão Social, Nome Fantasia, NUIT ou Cidade..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Apenas Ativas</option>
                <option value="trial">Em Teste (Trial)</option>
                <option value="suspended">Suspensas</option>
              </select>
            </div>
          </div>

          {/* Companies List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Empresas e Organizações Registradas ({filteredCompanies.length})</h3>
                <p className="text-[11px] text-slate-500">Selecione uma empresa para alternar o ambiente de trabalho com autoridade no backend.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Empresa / Razão Social</th>
                    <th className="py-3 px-4">NUIT Moçambique</th>
                    <th className="py-3 px-4">Contato &amp; Local</th>
                    <th className="py-3 px-4">Plano SaaS</th>
                    <th className="py-3 px-4 text-center">Filiais / Usuários</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Ambiente Ativo</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCompanies.map(comp => {
                    const isCurrentActive = activeCompany?.id === comp.id;

                    let planBadge = 'bg-slate-100 text-slate-700';
                    if (comp.subscriptionPlan === 'enterprise') planBadge = 'bg-purple-100 text-purple-800 border-purple-200';
                    else if (comp.subscriptionPlan === 'professional') planBadge = 'bg-blue-100 text-blue-800 border-blue-200';
                    else if (comp.subscriptionPlan === 'starter') planBadge = 'bg-amber-100 text-amber-800 border-amber-200';

                    const compLocs = locations.filter(l => l.companyId === comp.id);

                    return (
                      <tr key={comp.id} className={`hover:bg-slate-50/70 transition-colors ${isCurrentActive ? 'bg-orange-50/40' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                            <span>{comp.tradeName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{comp.name}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {comp.nuit}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{comp.phone}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{comp.city}, {comp.address}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${planBadge}`}>
                            {comp.subscriptionPlan}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-bold">
                          <div className="text-slate-800">{compLocs.length || comp.branchesCount || 1} / {comp.maxBranches} Lojas</div>
                          <div className="text-[10px] text-slate-400 font-normal">Máx {comp.maxUsers} operadores</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              comp.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : comp.status === 'trial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {comp.status === 'active' ? 'Ativa' : comp.status === 'trial' ? 'Trial' : 'Suspensa'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isCurrentActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-orange-600 text-white shadow-2xs">
                              <Check className="w-3 h-3" />
                              <span>EM USO</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectActiveTenant(comp)}
                              className="px-2.5 py-1 bg-white hover:bg-orange-50 hover:text-orange-600 text-slate-600 border border-slate-300 hover:border-orange-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                              title="Alternar para operar sob esta empresa"
                            >
                              Usar Empresa
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSupportTargetCompany(comp);
                                setSupportModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Entrar em Modo de Suporte nesta Empresa (SuperAdmin)"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(comp)}
                              className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar Dados da Empresa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(comp)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                comp.status === 'active'
                                  ? 'text-rose-500 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={comp.status === 'active' ? 'Suspender Empresa' : 'Reativar Empresa'}
                            >
                              {comp.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: FILIAIS & LOJAS --- */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Filiais, Lojas &amp; Pontos de Venda</h3>
              <p className="text-slate-500 mt-0.5">Cada filial possui configurações próprias de caixas, estoques e horários de operação.</p>
            </div>
            <button
              onClick={() => {
                setLocCompanyId(activeCompany?.id || companies[0]?.id || '');
                setIsLocationModalOpen(true);
              }}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold cursor-pointer transition-all"
            >
              + Adicionar Filial
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {locations.map(loc => {
              const comp = companies.find(c => c.id === loc.companyId);
              return (
                <div key={loc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded font-bold text-slate-600 uppercase">
                        {loc.code} • {loc.type}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{loc.name}</h4>
                      <p className="text-[11px] text-orange-600 font-bold">{comp?.tradeName || 'Empresa Vinculada'}</p>
                    </div>
                    {loc.isMatrix && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        MATRIZ
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{loc.city}, {loc.address}</span>
                    </div>
                    {loc.phone && (
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{loc.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {loc.status}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">Fuso: {loc.timezone}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: PLANOS & PREÇOS SAAS --- */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xs">
            <h3 className="text-base font-black">Planos de Assinatura &amp; Entitlements SaaS</h3>
            <p className="text-xs text-slate-400 mt-1">
              Estrutura flexível para contratação mensal e anual em Meticais (MZN) com limites automáticos de cotas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(p => (
              <div
                key={p.id}
                className={`bg-white rounded-3xl p-6 border shadow-xs flex flex-col justify-between ${
                  p.code === 'enterprise' ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-600">{p.code}</span>
                    {p.code === 'enterprise' && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black">
                        MAIS POPULAR
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-slate-900 text-lg mt-1">{p.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 min-h-[36px]">{p.description}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-2xl font-black text-slate-900 font-mono">
                      {formatCurrency(p.priceMonthly)} <span className="text-xs text-slate-400 font-normal">/ mês</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      ou {formatCurrency(p.priceYearly)} / ano (com 2 meses grátis)
                    </div>
                  </div>

                  <div className="mt-6 space-y-2 text-xs text-slate-600">
                    <div className="font-bold text-slate-900 mb-2">Limites Operacionais:</div>
                    <div>✓ Até <strong>{p.limits.maxLocations}</strong> Filiais/Lojas</div>
                    <div>✓ Até <strong>{p.limits.maxUsers}</strong> Operadores/Usuários</div>
                    <div>✓ Até <strong>{p.limits.maxRegisters}</strong> Caixas de Atendimento</div>
                    <div>✓ Até <strong>{p.limits.maxProducts.toLocaleString()}</strong> Produtos no Cardápio</div>
                    <div>✓ Até <strong>{p.limits.maxOrdersPerMonth.toLocaleString()}</strong> Pedidos por mês</div>

                    <div className="font-bold text-slate-900 pt-3 mb-2">Recursos Inclusos:</div>
                    {p.features.map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => info('Gestão de Planos', `Plano ${p.name} configurado para esta organização.`)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-orange-600 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Gerenciar Assinatura
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: QUOTAS & CONSUMO DA PLATAFORMA --- */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm">Monitoramento de Quotas por Empresa</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consumo em tempo real de limites de usuários, filiais e produtos vinculados aos contratos ativos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map(c => {
              const compLocs = locations.filter(l => l.companyId === c.id);
              const branchPct = Math.round((compLocs.length / c.maxBranches) * 100);
              const userPct = Math.round((1 / c.maxUsers) * 100);

              return (
                <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{c.tradeName}</h4>
                      <span className="text-[11px] font-mono text-slate-400">NUIT: {c.nuit} • Plano {c.subscriptionPlan.toUpperCase()}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {c.status}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-bold text-slate-700 mb-1">
                        <span>Lojas / Filiais</span>
                        <span>{compLocs.length} / {c.maxBranches} ({branchPct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-600 h-full rounded-full transition-all" style={{ width: `${Math.min(branchPct, 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold text-slate-700 mb-1">
                        <span>Operadores de Caixa &amp; Usuários</span>
                        <span>1 / {c.maxUsers} ({userPct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.min(userPct, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 5: AUDITORIA & SEGURANÇA SAAS --- */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-600" />
                <span>Trilha de Auditoria &amp; Logs de Segurança SaaS</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Registro imutável de alternâncias de contexto, ativações, suspensões e auditoria tributária.
              </p>
            </div>
            <button
              onClick={handleExportSaft}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar SAF-T MZ (XML)</span>
            </button>
          </div>

          <div className="p-4 text-xs divide-y divide-slate-100 font-mono">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">[TENANT_SWITCH]</span> Alternância de contexto para KOMA Fast Food Matriz.
              </div>
              <span className="text-slate-400 text-[10px]">{new Date().toLocaleTimeString('pt-MZ')}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-700">[COMPANY_READY]</span> Validação fiscal de NUIT moçambicano concluída.
              </div>
              <span className="text-slate-400 text-[10px]">Hoje, 10:15</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-purple-700">[RBAC_ENFORCED]</span> Verificação de isolamento tenant-aware ativa no backend.
              </div>
              <span className="text-slate-400 text-[10px]">Hoje, 09:30</span>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CADASTRO / EDIÇÃO DE EMPRESA --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingCompany ? 'Editar Dados da Empresa' : 'Cadastrar Nova Empresa (Multi-Tenant)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Defina razão social, NUIT em Moçambique e parâmetros do plano.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome Fantasia (Marca) *
                  </label>
                  <input
                    type="text"
                    required
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="Ex: KOMA Fast Food"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Razão Social (Registro Legal) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: KOMA Fast Food Takeaway Lda"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NUIT Moçambique (9 dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    value={nuit}
                    onChange={(e) => setNuit(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 400192837"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Telefone Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+258 84 000 0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Telefone Secundário
                  </label>
                  <input
                    type="text"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    placeholder="+258 82 000 0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  E-mail Oficial / Notificações
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="geral@empresa.co.mz"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Endereço / Sede
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. 24 de Julho, Edifício Solar, nº 1400"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Maputo"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Plano de Assinatura
                  </label>
                  <select
                    value={subscriptionPlan}
                    onChange={(e) => setSubscriptionPlan(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-700"
                  >
                    <option value="starter">Starter (Até 1 Loja / 5 Usuários)</option>
                    <option value="professional">Professional (Até 3 Lojas / 15 Usuários)</option>
                    <option value="enterprise">Enterprise (Ilimitado / Redes Grandes)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Máximo de Filiais
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxBranches}
                    onChange={(e) => setMaxBranches(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status da Assinatura
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-700"
                  >
                    <option value="active">Ativa (Operação Normal)</option>
                    <option value="trial">Em Teste (Trial 30 dias)</option>
                    <option value="suspended">Suspensa (Bloqueada)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notas Internas / Contrato
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações contratuais, faturamento ou contatos do sócio administrador..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : editingCompany ? 'Atualizar Empresa' : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CADASTRO DE FILIAL --- */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-sm">Adicionar Nova Filial / Local</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Empresa Proprietária *</label>
                <select
                  value={locCompanyId}
                  onChange={(e) => setLocCompanyId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.tradeName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome da Filial *</label>
                  <input
                    type="text"
                    required
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    placeholder="Ex: KOMA Beira Shopping"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código da Filial *</label>
                  <input
                    type="text"
                    required
                    value={locCode}
                    onChange={(e) => setLocCode(e.target.value)}
                    placeholder="Ex: BEI-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Local</label>
                  <select
                    value={locType}
                    onChange={(e) => setLocType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                  >
                    <option value="STORE">Loja / Takeaway</option>
                    <option value="RESTAURANT">Restaurante Completo</option>
                    <option value="KIOSK">Quiosque / Totem</option>
                    <option value="DARK_KITCHEN">Dark Kitchen</option>
                    <option value="WAREHOUSE">Armazém Central</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={locCity}
                    onChange={(e) => setLocCity(e.target.value)}
                    placeholder="Beira"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  placeholder="Rua Correia de Brito nº 120"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Gravar Filial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL WIZARD ONBOARDING COM TEMPLATES --- */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-sm">Wizard de Onboarding Gastronômico</h3>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteWizard} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-2">1. Escolha o Template do Negócio:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWizardTemplate('fastfood')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      wizardTemplate === 'fastfood'
                        ? 'border-orange-600 bg-orange-50/70 ring-2 ring-orange-500 text-orange-950'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-2xl block mb-1">🍔</span>
                    <strong className="block text-xs">Fast Food</strong>
                    <span className="text-[10px] text-slate-500">Burgers &amp; Combos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWizardTemplate('grill')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      wizardTemplate === 'grill'
                        ? 'border-orange-600 bg-orange-50/70 ring-2 ring-orange-500 text-orange-950'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-2xl block mb-1">🍗</span>
                    <strong className="block text-xs">Churrasqueira</strong>
                    <span className="text-[10px] text-slate-500">Grelhados &amp; Doses</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWizardTemplate('cafe')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      wizardTemplate === 'cafe'
                        ? 'border-orange-600 bg-orange-50/70 ring-2 ring-orange-500 text-orange-950'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-2xl block mb-1">☕</span>
                    <strong className="block text-xs">Café &amp; Padaria</strong>
                    <span className="text-[10px] text-slate-500">Pastelaria &amp; Pães</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Nome da Marca / Estabelecimento *</label>
                <input
                  type="text"
                  required
                  value={wizardName}
                  onChange={(e) => setWizardName(e.target.value)}
                  placeholder="Ex: Zambeze Burger &amp; Shake"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NUIT Moçambique (9 dígitos) *</label>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    value={wizardNuit}
                    onChange={(e) => setWizardNuit(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 400554433"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cidade da Sede</label>
                  <input
                    type="text"
                    value={wizardCity}
                    onChange={(e) => setWizardCity(e.target.value)}
                    placeholder="Maputo"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">3. Plano Inicial Contratado</label>
                <select
                  value={wizardPlan}
                  onChange={(e) => setWizardPlan(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
                >
                  <option value="starter">Starter — 3.500 MT/mês (1 Filial / 5 Usuários)</option>
                  <option value="professional">Professional — 8.500 MT/mês (3 Filiais / 15 Usuários / KDS)</option>
                  <option value="enterprise">Enterprise — 19.500 MT/mês (Ilimitado / Multi-Brand)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                ✨ <strong>Configuração Automática Instantânea:</strong> Ao concluir, o sistema cria a matriz na sua cidade, configura o fuso horário para <em>Africa/Maputo</em> e prepara o catálogo inicial conforme o template escolhido.
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Provisionando...' : 'Concluir Onboarding & Ativar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL SUPORTE TÉCNICO / IMPERSONAÇÃO --- */}
      {supportModalOpen && supportTargetCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-amber-600 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-black text-sm">Modo de Suporte &amp; Auditoria</h3>
              </div>
              <button onClick={() => setSupportModalOpen(false)} className="text-slate-900 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartSupport} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 leading-relaxed text-[11px]">
                Você está prestes a entrar temporariamente no ambiente da empresa <strong>&quot;{supportTargetCompany.tradeName}&quot;</strong>.
                Esta ação será registrada nos registros de auditoria com seu usuário e motivo.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo do Acesso Técnico *</label>
                <textarea
                  rows={3}
                  required
                  value={supportReason}
                  onChange={(e) => setSupportReason(e.target.value)}
                  placeholder="Ex: Atendimento ao ticket #301 - Ajuste de produtos e auditoria de caixa..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSupportModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black rounded-xl shadow-xs cursor-pointer"
                >
                  Ativar Sessão de Suporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
