import React, { useState } from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CashProvider } from './contexts/CashContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { NavItemKey } from './components/layout/Sidebar';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PDV } from './pages/PDV';
import { Sales } from './pages/Sales';
import { Products } from './pages/Products';
import { Customers } from './pages/Customers';
import { Stock } from './pages/Stock';
import { CashRegister } from './pages/CashRegister';
import { Financial } from './pages/Financial';
import { Reports } from './pages/Reports';
import { UsersPage } from './pages/Users';
import { AuditLogs } from './pages/AuditLogs';
import { SettingsPage } from './pages/Settings';
import { KDS } from './pages/KDS';
import { Purchases } from './pages/Purchases';
import { Delivery } from './pages/Delivery';
import { Kiosk } from './pages/Kiosk';
import { CompaniesPage } from './pages/Companies';
import { ProfilePage } from './pages/Profile';
import { PermissionDenied } from './components/auth/PermissionDenied';
import { SplashScreen } from './components/layout/SplashScreen';

const AppContent: React.FC = () => {
  const {
    isAuthenticated,
    isLoading,
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
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');
  const [historyStack, setHistoryStack] = useState<NavItemKey[]>([]);
  const [splashFinished, setSplashFinished] = useState(false);

  const navigateTo = (tab: NavItemKey) => {
    if (tab === currentTab) return;
    setHistoryStack((prev) => [...prev, currentTab]);
    setCurrentTab(tab);
  };

  const goBack = () => {
    if (historyStack.length === 0) return;
    const newStack = [...historyStack];
    const previousTab = newStack.pop()!;
    setHistoryStack(newStack);
    setCurrentTab(previousTab);
  };

  if (isLoading || !splashFinished) {
    return <SplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <CashProvider>
      <Layout
        currentTab={currentTab}
        onSelectTab={navigateTo}
        canGoBack={historyStack.length > 0}
        onGoBack={goBack}
        historyStack={historyStack}
      >
        {currentTab === 'dashboard' && <Dashboard onNavigate={navigateTo} />}

        {currentTab === 'pdv' &&
          (canAccessPDV ? (
            <PDV />
          ) : (
            <PermissionDenied
              requiredPermissionName="Frente de Caixa (PDV)"
              allowedRoles={['admin', 'manager', 'cashier']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'kds' &&
          (canAccessKitchen || isAdmin || isManager ? (
            <KDS />
          ) : (
            <PermissionDenied
              requiredPermissionName="KDS Cozinha & Expedição"
              allowedRoles={['admin', 'manager', 'kitchen']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'delivery' &&
          (canAccessPDV || isAdmin || isManager ? (
            <Delivery />
          ) : (
            <PermissionDenied
              requiredPermissionName="Delivery & Entregas"
              allowedRoles={['admin', 'manager', 'cashier']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'kiosk' && (
          <Kiosk onExitKiosk={() => navigateTo('dashboard')} />
        )}

        {currentTab === 'vendas' && <Sales />}

        {currentTab === 'produtos' &&
          (canManageProducts ? (
            <Products />
          ) : (
            <PermissionDenied
              requiredPermissionName="Cardápio &amp; Produtos"
              allowedRoles={['admin', 'manager', 'stock_manager']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'compras' &&
          (canManageStock || isAdmin || isManager ? (
            <Purchases />
          ) : (
            <PermissionDenied
              requiredPermissionName="Compras & Fornecedores"
              allowedRoles={['admin', 'manager', 'stock_manager']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'clientes' && <Customers />}

        {currentTab === 'estoque' &&
          (canManageStock ? (
            <Stock />
          ) : (
            <PermissionDenied
              requiredPermissionName="Controle de Estoque &amp; Insumos"
              allowedRoles={['admin', 'manager', 'stock_manager']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'caixa' &&
          (canManageCash ? (
            <CashRegister />
          ) : (
            <PermissionDenied
              requiredPermissionName="Controle de Caixa &amp; Movimentos"
              allowedRoles={['admin', 'manager', 'cashier']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'financeiro' &&
          (canViewFinancial ? (
            <Financial />
          ) : (
            <PermissionDenied
              requiredPermissionName="Financeiro &amp; Fluxo de Caixa"
              allowedRoles={['admin', 'manager', 'finance']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'relatorios' &&
          (canViewReports ? (
            <Reports />
          ) : (
            <PermissionDenied
              requiredPermissionName="Relatórios Gerenciais &amp; PDFs"
              allowedRoles={['admin', 'manager', 'finance', 'stock_manager']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'usuarios' &&
          (canManageUsers ? (
            <UsersPage />
          ) : (
            <PermissionDenied
              requiredPermissionName="Gestão de Usuários &amp; Permissões"
              allowedRoles={['admin', 'super_admin']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'empresas' &&
          (isAdmin || isManager ? (
            <CompaniesPage />
          ) : (
            <PermissionDenied
              requiredPermissionName="Gestão Multi-Empresa &amp; SaaS"
              allowedRoles={['admin', 'super_admin']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'auditoria' &&
          (canViewAudit ? (
            <AuditLogs />
          ) : (
            <PermissionDenied
              requiredPermissionName="Auditoria &amp; Logs de Segurança"
              allowedRoles={['admin', 'manager']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'configuracoes' &&
          (canManageSettings ? (
            <SettingsPage />
          ) : (
            <PermissionDenied
              requiredPermissionName="Configurações Gerais do Sistema"
              allowedRoles={['admin', 'super_admin']}
              onNavigateDashboard={() => navigateTo('dashboard')}
            />
          ))}

        {currentTab === 'perfil' && <ProfilePage onNavigate={navigateTo} />}
      </Layout>
    </CashProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
