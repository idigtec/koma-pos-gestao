import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  CreditCard,
  Eye,
  Award,
  Sparkles,
  Tag,
  Percent,
  Gift
} from 'lucide-react';
import { DatabaseService } from '../services/db';
import { Customer, Sale } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const Customers: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'customers' | 'loyalty' | 'promotions'>('customers');

  const [promotions, setPromotions] = useState([
    {
      id: 'promo-1',
      title: 'Happy Hour Burgers & Fritas',
      description: '20% de desconto em hambúrgueres artesanais de Segunda a Sexta das 17h às 19h.',
      discount: '20% OFF',
      validUntil: 'Seg a Sex (17h - 19h)',
      status: 'active' as 'active' | 'inactive',
      category: 'Burgers',
    },
    {
      id: 'promo-2',
      title: 'Quarta-feira Burgers 2x1',
      description: 'Na compra de 1 Hambúrguer Clássico, o segundo sai por metade do preço.',
      discount: '50% no 2º item',
      validUntil: 'Todas as Quartas-feiras',
      status: 'active' as 'active' | 'inactive',
      category: 'Combos',
    },
    {
      id: 'promo-3',
      title: 'Bebida Grátis em Pedidos Takeaway',
      description: 'Pedidos para viagem acima de 500 MT ganham 1 Refrigerante Coca-Cola 330ml lata.',
      discount: 'Bebida Cortesia',
      validUntil: 'Finais de Semana',
      status: 'active' as 'active' | 'inactive',
      category: 'Bebidas',
    },
    {
      id: 'promo-4',
      title: 'Programa Fidelidade KOMA Pontos',
      description: 'A cada 10 MT gastos acumule 1 Ponto. 100 Pontos valem 50 MT de desconto na próxima refeição.',
      discount: '5% Retorno',
      validUntil: 'Permanente',
      status: 'active' as 'active' | 'inactive',
      category: 'Fidelidade',
    },
  ]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [documentType, setDocumentType] = useState<'BI' | 'NUIT' | 'Passaporte' | 'Outro'>('BI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Maputo');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const loadData = async () => {
    try {
      setLoading(true);
      const [custs, salesData] = await Promise.all([
        DatabaseService.getCustomers(),
        DatabaseService.getSales(),
      ]);
      setCustomers(custs);
      setSales(salesData);
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setName('');
    setDocumentType('BI');
    setDocumentNumber('');
    setPhone('+258 ');
    setSecondaryPhone('');
    setEmail('');
    setAddress('');
    setCity('Maputo');
    setNotes('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditCustomerModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setDocumentType(cust.documentType);
    setDocumentNumber(cust.documentNumber || '');
    setPhone(cust.phone || '');
    setSecondaryPhone(cust.secondaryPhone || '');
    setEmail(cust.email || '');
    setAddress(cust.address || '');
    setCity(cust.city || 'Maputo');
    setNotes(cust.notes || '');
    setStatus(cust.status);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      warning('Atenção', 'O nome do cliente é obrigatório.');
      return;
    }

    const custData: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      name: name.trim(),
      documentType,
      documentNumber: documentNumber.trim(),
      phone: phone.trim() || undefined,
      secondaryPhone: secondaryPhone.trim() || undefined,
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      notes: notes.trim(),
      totalSpent: editingCustomer ? editingCustomer.totalSpent : 0,
      totalPurchases: editingCustomer ? editingCustomer.totalPurchases : 0,
      status,
      customerType: 'singular',
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
    };

    try {
      await DatabaseService.saveCustomer(custData);
      success('Cliente Salvo', `"${custData.name}" foi registrado com sucesso.`);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      error('Erro ao salvar cliente', err.message);
    }
  };

  const handleDeleteCustomer = async (cust: Customer) => {
    if (cust.id === 'customer-final') {
      warning('Ação Não Permitida', 'O Consumidor Final padrão não pode ser excluído.');
      return;
    }
    if (!window.confirm(`Deseja excluir o cliente "${cust.name}"?`)) return;

    try {
      await DatabaseService.deleteCustomer(cust.id);
      success('Cliente Removido', `"${cust.name}" foi removido do cadastro.`);
      await loadData();
    } catch (err: any) {
      error('Erro ao excluir', err.message);
    }
  };

  // Filtered
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(c => {
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.documentNumber && c.documentNumber.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery]);

  // Customer sales history
  const customerSales = useMemo(() => {
    if (!selectedCustomerHistory) return [];
    return sales.filter(s => s.customerId === selectedCustomerHistory.id);
  }, [sales, selectedCustomerHistory]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span>Gestão de Clientes &amp; Fidelização</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre clientes com BI ou NUIT de Moçambique, acompanhe pontos de fidelidade, cashback e promoções.
          </p>
        </div>

        {activeTab === 'customers' && (
          <button
            onClick={openNewCustomerModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'customers'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-orange-600" />
          <span>Clientes Cadastrados ({customers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('loyalty')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'loyalty'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-orange-600" />
          <span>Programa de Fidelidade (Loyalty)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('promotions')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'promotions'
              ? 'border-orange-600 text-orange-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4 text-orange-600" />
          <span>Campanhas Promocionais ({promotions.length})</span>
        </button>
      </div>

      {/* CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por Nome, BI, NUIT ou Telefone..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nome do Cliente</th>
                <th className="py-3 px-4">Documento</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Localidade</th>
                <th className="py-3 px-4 text-center">Compras Realizadas</th>
                <th className="py-3 px-4 text-right">Total Gasto</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.map(cust => (
                <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{cust.name}</div>
                    {cust.notes && <div className="text-[10px] text-slate-400">{cust.notes}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-slate-800">
                      {cust.documentNumber || '-'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{cust.documentType}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {cust.phone && <div className="flex items-center gap-1 font-mono text-xs"><Phone className="w-3 h-3 text-slate-400" /> {cust.phone}</div>}
                    {cust.secondaryPhone && <div className="text-[10px] text-slate-400 font-mono">Alt: {cust.secondaryPhone}</div>}
                    {cust.email && <div className="flex items-center gap-1 text-[11px] text-slate-400"><Mail className="w-3 h-3 text-slate-400" /> {cust.email}</div>}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{cust.city || 'Maputo'}</div>
                    {cust.address && <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{cust.address}</div>}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">
                    {cust.totalPurchases} pedidos
                  </td>
                  <td className="py-3 px-4 text-right font-black font-mono text-emerald-800">
                    {formatCurrency(cust.totalSpent)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        cust.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {cust.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* History */}
                      <button
                        onClick={() => setSelectedCustomerHistory(cust)}
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Ver Histórico de Compras"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEditCustomerModal(cust)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar Cliente"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      {cust.id !== 'customer-final' && (
                        <button
                          onClick={() => handleDeleteCustomer(cust)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir Cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* LOYALTY & POINTS TAB */}
  {activeTab === 'loyalty' && (
    <div className="space-y-6">
      {/* Loyalty stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-bold">Clientes Ativos no Clube</span>
            <Users className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {customers.filter(c => c.totalSpent > 0).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Com compras registradas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-bold">Pontos Emitidos</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {customers.reduce((acc, c) => acc + Math.floor(c.totalSpent / 10), 0).toLocaleString()} pts
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">1 Ponto = 10 MT em compras</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-bold">Saldo de Recompensa</span>
            <Gift className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {formatCurrency(customers.reduce((acc, c) => acc + Math.floor(c.totalSpent / 10) * 0.5, 0))}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Em créditos de refeição</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-bold">Ticket Médio dos Membros</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">
            {formatCurrency(
              customers.filter(c => c.totalPurchases > 0).length > 0
                ? customers.reduce((acc, c) => acc + c.totalSpent, 0) /
                  Math.max(1, customers.reduce((acc, c) => acc + c.totalPurchases, 0))
                : 0
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">+42% superior a avulsos</div>
        </div>
      </div>

      {/* VIP Ranking */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Ranking de Membros VIP &amp; Pontos Acumulados</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Conversão automática: cada 100 pontos acumulados garantem 50 MT de desconto na próxima refeição.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Posição</th>
                <th className="py-3 px-4">Nome do Membro</th>
                <th className="py-3 px-4">Nível / Categoria</th>
                <th className="py-3 px-4 text-center">Compras</th>
                <th className="py-3 px-4 text-right">Total Gasto</th>
                <th className="py-3 px-4 text-right">Pontos KOMA</th>
                <th className="py-3 px-4 text-right">Crédito Disponível</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {[...customers]
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 15)
                .map((cust, idx) => {
                  const points = Math.floor(cust.totalSpent / 10);
                  const credit = points * 0.5;
                  let tier = { name: 'Bronze', badge: 'bg-amber-100 text-amber-800' };
                  if (points >= 1000) tier = { name: 'Platina VIP', badge: 'bg-purple-100 text-purple-800' };
                  else if (points >= 500) tier = { name: 'Ouro VIP', badge: 'bg-yellow-100 text-yellow-800' };
                  else if (points >= 200) tier = { name: 'Prata VIP', badge: 'bg-slate-200 text-slate-800' };

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {cust.name}
                        {cust.phone && <span className="block font-mono text-[10px] text-slate-400 font-normal">{cust.phone}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tier.badge}`}>
                          {tier.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{cust.totalPurchases} pedidos</td>
                      <td className="py-3 px-4 text-right font-black font-mono">{formatCurrency(cust.totalSpent)}</td>
                      <td className="py-3 px-4 text-right font-black font-mono text-amber-600">
                        {points.toLocaleString()} pts
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-emerald-700">
                        {formatCurrency(credit)}
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

  {/* PROMOTIONS TAB */}
  {activeTab === 'promotions' && (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center justify-between text-xs">
        <div>
          <h4 className="font-bold text-orange-950 text-sm flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-orange-600" />
            <span>Motor de Campanhas Promocionais &amp; Descontos Automáticos</span>
          </h4>
          <p className="text-orange-900/80 mt-0.5">
            As campanhas ativas aplicam condições comerciais especiais no PDV e canais de venda KOMA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {promotions.map(promo => (
          <div
            key={promo.id}
            className={`p-5 rounded-2xl border transition-all bg-white shadow-xs ${
              promo.status === 'active' ? 'border-orange-300' : 'border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-orange-600 text-white font-black text-xs">
                  {promo.discount}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px]">
                  {promo.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPromotions(prev =>
                    prev.map(p =>
                      p.id === promo.id
                        ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' }
                        : p
                    )
                  );
                  success(
                    'Campanha Atualizada',
                    `"${promo.title}" agora está ${promo.status === 'active' ? 'Inativa' : 'Ativa'}.`
                  );
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  promo.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {promo.status === 'active' ? '✓ Ativa' : 'Pausada'}
              </button>
            </div>

            <h4 className="font-black text-slate-900 text-sm mt-1">{promo.title}</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{promo.description}</p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Validade: <strong>{promo.validUntil}</strong></span>
              <span className="text-orange-600 font-bold">PDV + Kiosk + Delivery</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

      {/* --- CUSTOMER HISTORY MODAL --- */}
      {selectedCustomerHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Histórico: {selectedCustomerHistory.name}</h3>
                <span className="text-xs text-slate-400">
                  Total Gasto Acumulado: {formatCurrency(selectedCustomerHistory.totalSpent)}
                </span>
              </div>
              <button onClick={() => setSelectedCustomerHistory(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 text-xs">
              {customerSales.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  Nenhuma compra nominal registrada para este cliente ainda.
                </div>
              ) : (
                customerSales.map(sale => (
                  <div key={sale.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center font-bold">
                      <span className="font-mono text-slate-900">{sale.saleNumber}</span>
                      <span className="text-emerald-800 font-mono text-sm">{formatCurrency(sale.total)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{formatDateTime(sale.createdAt)}</span>
                      <span>Operador: {sale.cashierName}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                      Itens: {sale.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCustomerHistory(null)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT CUSTOMER MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveCustomer}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome Completo / Razão Social</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Maria Esperança Cossa ou Empresa Lda"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tipo de Documento</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="BI">BI (Bilhete de Identidade)</option>
                    <option value="NUIT">NUIT (Empresas / Fiscal)</option>
                    <option value="Passaporte">Passaporte</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Número do Documento</label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Ex: 110100345678B ou 400123456"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Telefone Principal (Moçambique)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+258 84 000 0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Telefone Secundário (Opcional)</label>
                  <input
                    type="text"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    placeholder="+258 82 / 87 000 0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Endereço / Bairro</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Bairro, Rua, nº"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Maputo, Matola, Beira, Nampula..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Observações / Convênio</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Cliente com limite a prazo ou desconto especial..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl"
              >
                Salvar Cliente
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
