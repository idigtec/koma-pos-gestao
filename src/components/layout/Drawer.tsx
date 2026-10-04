import React, { useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Users,
  Boxes,
  CircleDollarSign,
  TrendingUp,
  FileBarChart,
  UserCog,
  Settings,
  ShieldAlert,
  UtensilsCrossed,
  Bike,
  Smartphone,
  Truck,
  Building2,
  UserCheck,
  LogOut,
  ChevronRight,
  Sparkles,
  Wifi
} from 'lucide-react';
import { NavItemKey } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { KomaLogo } from '../common/KomaLogo';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
}) => {
  const {
    user,
    logout,
    activeCompany,
    activeLocation,
    canAccessPDV,
    canManageProducts,
    canManageStock,
    canManageCash,
    canViewFinancial,
    canViewReports,
    canManageUsers,
    canViewAudit,
    canManageSettings,
    canAccessKitchen,
    isAdmin,
    isManager
  } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (key: NavItemKey) => {
    onSelectTab(key);
    onClose();
  };

  const sections = [
    {
      title: 'Operacional & Atendimento',
      items: [
        { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard, visible: true },
        { key: 'pdv' as NavItemKey, label: 'PDV (Frente Caixa)', icon: ShoppingCart, visible: canAccessPDV, highlight: true },
        { key: 'vendas' as NavItemKey, label: 'Lançamentos & Vendas', icon: Receipt, visible: true },
        { key: 'kds' as NavItemKey, label: 'KDS Cozinha & Expedição', icon: UtensilsCrossed, visible: canAccessKitchen || isAdmin || isManager },
        { key: 'delivery' as NavItemKey, label: 'Delivery & Entregas', icon: Bike, visible: canAccessPDV || isAdmin || isManager },
        { key: 'kiosk' as NavItemKey, label: 'Autoatendimento (Kiosk)', icon: Smartphone, visible: true },
      ]
    },
    {
      title: 'Financeiro & Fluxo',
      items: [
        { key: 'financeiro' as NavItemKey, label: 'Gestão Financeira & Lançamentos', icon: TrendingUp, visible: canViewFinancial },
        { key: 'caixa' as NavItemKey, label: 'Controle de Caixa & Sangrias', icon: CircleDollarSign, visible: canManageCash },
        { key: 'relatorios' as NavItemKey, label: 'Relatórios & DRE', icon: FileBarChart, visible: canViewReports },
      ]
    },
    {
      title: 'Estoque & Catálogo',
      items: [
        { key: 'produtos' as NavItemKey, label: 'Cardápio & Produtos', icon: Package, visible: canManageProducts },
        { key: 'estoque' as NavItemKey, label: 'Controle de Estoque & Kardex', icon: Boxes, visible: canManageStock },
        { key: 'compras' as NavItemKey, label: 'Compras & Fornecedores', icon: Truck, visible: canManageStock || isAdmin || isManager },
        { key: 'clientes' as NavItemKey, label: 'Clientes & Fidelidade', icon: Users, visible: true },
      ]
    },
    {
      title: 'Administração & Sistema',
      items: [
        { key: 'usuarios' as NavItemKey, label: 'Usuários & Permissões', icon: UserCog, visible: canManageUsers },
        { key: 'empresas' as NavItemKey, label: 'Empresas (SaaS Multi-Tenant)', icon: Building2, visible: isAdmin || isManager },
        { key: 'auditoria' as NavItemKey, label: 'Auditoria & Logs', icon: ShieldAlert, visible: canViewAudit },
        { key: 'configuracoes' as NavItemKey, label: 'Configurações', icon: Settings, visible: canManageSettings },
        { key: 'perfil' as NavItemKey, label: 'Meu Perfil de Acesso', icon: UserCheck, visible: true },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-in fade-in duration-200">
      {/* Dark backdrop blur overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] bg-slate-950 text-slate-200 h-full flex flex-col shadow-2xl border-r border-slate-800 z-10 animate-in slide-in-from-left duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-md">
              KM
            </div>
            <div>
              <div className="font-extrabold text-sm text-white tracking-tight leading-tight">
                KOMA Omnichannel
              </div>
              <div className="text-[11px] text-orange-400 font-semibold truncate max-w-[160px]">
                {activeCompany?.tradeName || 'Fast Food Takeaway'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar Menu (Drawer)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card inside Drawer */}
        <div className="p-3.5 mx-3 mt-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
              {user?.name.slice(0, 2).toUpperCase() || 'OP'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Perfil: <span className="text-orange-400 font-bold">{user?.role?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleNavigate('perfil')}
            className="text-[11px] text-orange-400 hover:text-orange-300 font-bold px-2 py-1 bg-orange-500/10 rounded-lg hover:bg-orange-500/20 transition cursor-pointer"
          >
            Ver
          </button>
        </div>

        {/* Navigation List by Section */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {sections.map((sec) => {
            const visibleItems = sec.items.filter(i => i.visible !== false);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sec.title} className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {sec.title}
                </div>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.key;

                    return (
                      <button
                        key={item.key}
                        onClick={() => handleNavigate(item.key)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-orange-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer with Logout & Offline Status */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Wifi className="w-3 h-3" />
              <span>Offline Ready</span>
            </span>
            <span className="font-mono text-slate-400">Filial: {activeLocation?.code || 'SED-01'}</span>
          </div>

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Sistema (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
