import React, { useState, ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { Header } from './Header';
import { Sidebar, NavItemKey } from './Sidebar';
import { Drawer } from './Drawer';
import { BottomTabs } from './BottomTabs';
import { CashActionModal } from '../modals/CashActionModal';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  historyStack?: NavItemKey[];
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  canGoBack,
  onGoBack,
  historyStack = [],
  children,
}) => {
  const { supportSession, endSupportSession } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);

  const TAB_LABELS: Record<NavItemKey, string> = {
    dashboard: 'Dashboard',
    pdv: 'Frente de Caixa (PDV)',
    kds: 'KDS Cozinha',
    delivery: 'Delivery & Entregas',
    kiosk: 'Autoatendimento',
    vendas: 'Lançamentos & Vendas',
    produtos: 'Cardápio & Produtos',
    compras: 'Compras & Fornecedores',
    clientes: 'Clientes & Fidelidade',
    estoque: 'Controle de Estoque',
    caixa: 'Controle de Caixa',
    financeiro: 'Gestão Financeira & Lançamentos',
    relatorios: 'Relatórios & DRE',
    usuarios: 'Usuários & Permissões',
    empresas: 'Empresas & SaaS Multi-Tenant',
    auditoria: 'Auditoria & Logs',
    configuracoes: 'Configurações',
    perfil: 'Meu Perfil',
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Support Mode Emergency / Impersonation Top Banner */}
      {supportSession && (
        <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between shadow-md z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950 animate-bounce" />
            <span>
              MODO DE SUPORTE ATIVO: Visualizando a empresa &quot;{supportSession.targetCompanyName}&quot;.
              <span className="font-semibold ml-1.5 opacity-90">Motivo: {supportSession.reason}</span>
            </span>
          </div>
          <button
            onClick={endSupportSession}
            className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Encerrar Modo Suporte
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
            onToggleSidebar={() => {
              if (window.innerWidth < 1024) {
                setIsDrawerOpen(true);
              } else {
                setIsSidebarCollapsed(!isSidebarCollapsed);
              }
            }}
            onOpenCashModal={() => setIsCashModalOpen(true)}
          />

          {/* Stack Navigation Breadcrumb Bar */}
          {canGoBack && (
            <div className="bg-white border-b border-slate-200/80 px-4 py-2 flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onGoBack}
                  className="flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>

                <div className="hidden sm:flex items-center gap-1 text-slate-400 font-medium">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>/</span>
                  {historyStack.length > 0 && (
                    <>
                      <span className="text-slate-500">{TAB_LABELS[historyStack[historyStack.length - 1]] || 'Início'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </>
                  )}
                  <span className="font-bold text-slate-800">{TAB_LABELS[currentTab] || currentTab}</span>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                Pilha: {historyStack.length + 1}
              </span>
            </div>
          )}

          {/* Page View with bottom padding on mobile for BottomTabs */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Tabs Navigation */}
      <BottomTabs
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Slide-out Drawer Navigation (Mobile & Tablet) */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={onSelectTab}
      />

      {/* Cash Actions Modal (Open, Close, Sangria, Suprimento) */}
      <CashActionModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
      />
    </div>
  );
};
