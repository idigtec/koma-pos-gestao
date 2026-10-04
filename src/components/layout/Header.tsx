import React, { useState, useEffect } from 'react';
import {
  Bell,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  Clock,
  CircleDot,
  Smartphone,
  MousePointerClick,
  Download,
  Wifi,
  WifiOff,
  Store,
  Building2,
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCash } from '../../contexts/CashContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { UserProfileModal } from '../auth/UserProfileModal';
import { ROLE_DEFINITIONS } from '../../utils/permissions';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { UserRole } from '../../types';
import { SyncStatusIndicator } from '../common/SyncStatusIndicator';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenCashModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenCashModal }) => {
  const {
    user,
    logout,
    switchUserRole,
    activeCompany,
    activeLocation,
    allowedCompanies,
    allowedLocations,
    switchActiveCompany,
    switchActiveLocation,
  } = useAuth();
  const { activeSession, isOpen } = useCash();
  const { displayMode, toggleDisplayMode } = useTheme();
  const { isInstallable, promptInstall } = usePwaInstall();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleCompanyChange = async (companyId: string) => {
    await switchActiveCompany(companyId);
  };

  const handleStoreChange = async (locationId: string) => {
    await switchActiveLocation(locationId);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getRoleBadge = (role?: UserRole) => {
    if (!role) return null;
    const def = ROLE_DEFINITIONS[role];
    if (def) {
      return (
        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${def.badgeColor}`}>
          {def.name}
        </span>
      );
    }
    return <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">{role}</span>;
  };

  const AVAILABLE_ROLES: { role: UserRole; shortName: string }[] = [
    { role: 'admin', shortName: 'Admin' },
    { role: 'manager', shortName: 'Gerente' },
    { role: 'cashier', shortName: 'Caixa' },
    { role: 'kitchen', shortName: 'Cozinha' },
    { role: 'stock_manager', shortName: 'Estoque' },
    { role: 'finance', shortName: 'Financ.' },
  ];

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Time and Cash Register Status */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Mobile / Tablet Drawer & Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Abrir Menu de Navegação (Drawer)"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Maputo: {formatDateTime(currentTime)}</span>
        </div>

        {/* Cash Register quick chip */}
        <button
          onClick={onOpenCashModal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isOpen
              ? 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100'
              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
          }`}
          title="Clique para gerenciar o caixa (abrir, fechar, sangria, suprimento)"
        >
          <CircleDot className={`w-3.5 h-3.5 ${isOpen ? 'text-orange-500 animate-pulse' : 'text-rose-500'}`} />
          <span className="font-semibold">{isOpen ? 'Caixa Aberto' : 'Caixa Fechado'}</span>
          {isOpen && activeSession && (
            <span className="hidden sm:inline border-l border-orange-200 pl-2 text-orange-950 font-bold">
              {formatCurrency(activeSession.expectedAmount)}
            </span>
          )}
        </button>

        {/* Multi-Empresa Tenant Selector */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-lg text-xs" title="Empresa Ativa (Tenant)">
          <Building2 className="w-3.5 h-3.5 text-orange-600" />
          <select
            value={activeCompany?.id || ''}
            onChange={(e) => handleCompanyChange(e.target.value)}
            className="bg-transparent font-bold text-orange-950 text-xs focus:outline-none cursor-pointer max-w-[170px] truncate"
          >
            {allowedCompanies.map(c => (
              <option key={c.id} value={c.id}>
                {c.tradeName}
              </option>
            ))}
          </select>
        </div>

        {/* Multi-Loja Store Selector (Fase 13) */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs" title="Filial / Loja Operacional">
          <Store className="w-3.5 h-3.5 text-orange-600" />
          <select
            value={activeLocation?.id || ''}
            onChange={(e) => handleStoreChange(e.target.value)}
            className="bg-transparent font-bold text-slate-700 text-xs focus:outline-none cursor-pointer max-w-[170px] truncate"
          >
            {allowedLocations.map(l => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Role fast switcher + User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync Status Indicator (idb & Firestore) */}
        <SyncStatusIndicator variant="pill" showBannerWhenOffline={true} />

        {/* Touch vs Compact Mode Toggle */}
        <button
          type="button"
          onClick={toggleDisplayMode}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
            displayMode === 'touch'
              ? 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title={`Alternar para modo ${displayMode === 'touch' ? 'Compacto (Mouse/Teclado)' : 'Touch (Touchscreen)'}`}
        >
          {displayMode === 'touch' ? (
            <>
              <Smartphone className="w-3.5 h-3.5 text-orange-600" />
              <span>Modo Touch</span>
            </>
          ) : (
            <>
              <MousePointerClick className="w-3.5 h-3.5 text-slate-600" />
              <span>Modo Compacto</span>
            </>
          )}
        </button>

        {/* PWA Install Button (shows if installable) */}
        {isInstallable && (
          <button
            type="button"
            onClick={promptInstall}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-2xs hover:from-orange-600 hover:to-amber-600 transition-all cursor-pointer animate-bounce"
            title="Instalar Sistema POS Omnichannel no dispositivo"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instalar App</span>
          </button>
        )}

        {/* Quick Role switch for testing/production convenience */}
        <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg text-xs gap-1 border border-slate-200">
          <span className="text-slate-400 px-1 text-[11px] font-semibold">Perfil:</span>
          {AVAILABLE_ROLES.map(({ role: r, shortName }) => (
            <button
              key={r}
              onClick={() => switchUserRole(r)}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                user?.role === r
                  ? 'bg-white shadow-xs font-bold text-orange-900 border border-orange-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title={`Alternar instantaneamente para ${shortName}`}
            >
              {shortName}
            </button>
          ))}
        </div>

        {/* Notifications (aesthetic) */}
        <div className="relative">
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          </button>
        </div>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name.slice(0, 2).toUpperCase() || 'KM'}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-semibold text-slate-800 leading-tight">{user?.name}</div>
              <div className="text-[11px] text-slate-500">@{user?.username}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="text-xs text-slate-400 font-medium">Conectado como</div>
                <div className="text-sm font-bold text-slate-800 truncate">{user?.name}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                <div className="mt-2">{getRoleBadge(user?.role)}</div>
              </div>

              {/* Role Fast Switch for Mobile/Tablet */}
              <div className="px-3 py-2 border-b border-slate-100 lg:hidden">
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Alternar Perfil:</div>
                <div className="grid grid-cols-3 gap-1">
                  {AVAILABLE_ROLES.map(({ role: r, shortName }) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchUserRole(r);
                        setShowUserMenu(false);
                      }}
                      className={`py-1 rounded text-[11px] font-medium text-center cursor-pointer ${
                        user?.role === r ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {shortName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <UserIcon className="w-4 h-4 text-orange-600" />
                  <span>Meu Perfil &amp; Permissões RBAC</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenCashModal?.();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Gerenciar Caixa &amp; Sangria</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair do Sistema (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* User Profile Modal */}
    <UserProfileModal
      isOpen={isProfileModalOpen}
      onClose={() => setIsProfileModalOpen(false)}
    />
  </>
  );
};
