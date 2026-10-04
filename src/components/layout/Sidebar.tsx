import React from 'react';
import {
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
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Bike,
  Smartphone,
  Truck,
  Building2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { KomaLogo } from '../common/KomaLogo';

export type NavItemKey =
  | 'dashboard'
  | 'pdv'
  | 'kds'
  | 'delivery'
  | 'kiosk'
  | 'vendas'
  | 'produtos'
  | 'compras'
  | 'clientes'
  | 'estoque'
  | 'caixa'
  | 'financeiro'
  | 'relatorios'
  | 'usuarios'
  | 'empresas'
  | 'auditoria'
  | 'configuracoes'
  | 'perfil';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
}) => {
  const {
    canManageUsers,
    canViewFinancial,
    canViewReports,
    canManageProducts,
    canManageStock,
    canAccessPDV,
    canManageCash,
    canManageSettings,
    canViewAudit,
    canAccessKitchen,
    isAdmin,
    isManager
  } = useAuth();

  const navItems = [
    { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { key: 'pdv' as NavItemKey, label: 'PDV (Frente Caixa)', icon: ShoppingCart, visible: canAccessPDV, highlight: true },
    { key: 'kds' as NavItemKey, label: 'KDS Cozinha & Expedição', icon: UtensilsCrossed, visible: canAccessKitchen || isAdmin || isManager },
    { key: 'delivery' as NavItemKey, label: 'Delivery & Entregas', icon: Bike, visible: canAccessPDV || isAdmin || isManager },
    { key: 'kiosk' as NavItemKey, label: 'Autoatendimento (Kiosk)', icon: Smartphone, visible: true },
    { key: 'vendas' as NavItemKey, label: 'Vendas & Histórico', icon: Receipt, visible: true },
    { key: 'produtos' as NavItemKey, label: 'Cardápio & Produtos', icon: Package, visible: canManageProducts },
    { key: 'compras' as NavItemKey, label: 'Compras & Fornecedores', icon: Truck, visible: canManageStock || isAdmin || isManager },
    { key: 'clientes' as NavItemKey, label: 'Clientes & Fidelidade', icon: Users, visible: true },
    { key: 'estoque' as NavItemKey, label: 'Controle de Estoque', icon: Boxes, visible: canManageStock },
    { key: 'caixa' as NavItemKey, label: 'Controle de Caixa', icon: CircleDollarSign, visible: canManageCash },
    { key: 'financeiro' as NavItemKey, label: 'Financeiro & Fluxo', icon: TrendingUp, visible: canViewFinancial },
    { key: 'relatorios' as NavItemKey, label: 'Relatórios & PDFs', icon: FileBarChart, visible: canViewReports },
    { key: 'usuarios' as NavItemKey, label: 'Usuários & Perfis', icon: UserCog, visible: canManageUsers },
    { key: 'empresas' as NavItemKey, label: 'Empresas (SaaS)', icon: Building2, visible: isAdmin || isManager },
    { key: 'auditoria' as NavItemKey, label: 'Auditoria & Logs', icon: ShieldAlert, visible: canViewAudit },
    { key: 'configuracoes' as NavItemKey, label: 'Configurações', icon: Settings, visible: canManageSettings },
    { key: 'perfil' as NavItemKey, label: 'Meu Perfil', icon: UserCheck, visible: true },
  ];

  return (
    <aside
      className={`hidden lg:flex bg-slate-950 text-slate-300 flex-col transition-all duration-300 shrink-0 select-none z-40 border-r border-slate-800 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {isCollapsed ? (
            <KomaLogo variant="icon" size="sm" />
          ) : (
            <div className="flex items-center gap-2 truncate">
              <KomaLogo variant="icon" size="sm" />
              <div className="truncate">
                <span className="font-black text-white text-base tracking-tight block leading-tight">
                  K<span className="text-[#FF6B00]">O</span>MA
                </span>
                <span className="text-[10px] text-orange-400 font-bold tracking-wider uppercase block -mt-0.5">
                  Fast Food Takeaway
                </span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5 scrollbar-thin">
        {navItems
          .filter(item => item.visible)
          .map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all relative group ${
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-md shadow-orange-950/40'
                      : 'bg-slate-800 text-white font-bold border-l-2 border-orange-500'
                    : item.highlight
                    ? 'text-orange-400 hover:bg-orange-950/30 hover:text-orange-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? (item.highlight ? 'text-white' : 'text-orange-400') : ''
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {item.highlight && !isCollapsed && (
                  <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300">
                    F2
                  </span>
                )}
                {isCollapsed && (
                  <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
      </div>

      {/* Sidebar Footer info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-500">
          <div className="flex items-center justify-between font-mono">
            <span>Moeda:</span>
            <span className="text-orange-400 font-bold">MZN (MT)</span>
          </div>
          <div className="flex items-center justify-between font-mono mt-0.5">
            <span>Status BD:</span>
            <span className="text-orange-400 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping inline-block"></span>
              Conectado
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
