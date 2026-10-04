import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, PermissionKey, Company, Location, TenantContext, SupportSession } from '../types';
import { DatabaseService } from '../services/db';
import { hasPermission as checkPermission, ROLE_DEFINITIONS } from '../utils/permissions';

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  updateProfile: (data: { name?: string; phone?: string; email?: string; password?: string }) => Promise<{ success: boolean; message?: string }>;
  switchUserRole: (role: UserRole) => Promise<void>;
  hasPermission: (permission: PermissionKey) => boolean;

  // SaaS Tenant Context & Multi-Company Hierarchy
  tenantContext: TenantContext | null;
  activeCompany: Company | null;
  activeLocation: Location | null;
  allowedCompanies: Company[];
  allowedLocations: Location[];
  switchActiveCompany: (companyId: string) => Promise<boolean>;
  switchActiveLocation: (locationId: string) => Promise<boolean>;
  reloadTenantContext: () => Promise<void>;

  // Support Session / Impersonation
  supportSession: SupportSession | null;
  startSupportSession: (companyId: string, reason: string) => Promise<boolean>;
  endSupportSession: () => Promise<void>;

  // Role booleans
  isAdmin: boolean;
  isManager: boolean;
  isCashier: boolean;
  isKitchen: boolean;
  isStock: boolean;
  isFinance: boolean;

  // Permission shortcuts
  canManageUsers: boolean;
  canManageProducts: boolean;
  canManageCustomers: boolean;
  canViewFinancial: boolean;
  canViewReports: boolean;
  canCancelSale: boolean;
  canAccessPDV: boolean;
  canManageCash: boolean;
  canManageStock: boolean;
  canAccessKitchen: boolean;
  canManageSettings: boolean;
  canViewAudit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'gestao_pos_auth_user';
const AUTH_TOKEN_KEY = 'gestao_pos_auth_token';
const AUTH_REFRESH_KEY = 'gestao_pos_auth_refresh';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Tenant state
  const [tenantContext, setTenantContext] = useState<TenantContext | null>(null);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [allowedCompanies, setAllowedCompanies] = useState<Company[]>([]);
  const [allowedLocations, setAllowedLocations] = useState<Location[]>([]);

  // Support Session / Impersonation state
  const [supportSession, setSupportSession] = useState<SupportSession | null>(() => {
    const saved = localStorage.getItem('koma_support_session');
    return saved ? JSON.parse(saved) : null;
  });

  const startSupportSession = async (companyId: string, reason: string): Promise<boolean> => {
    if (!user) return false;
    const comps = await DatabaseService.getCompanies();
    const targetComp = comps.find(c => c.id === companyId);
    if (!targetComp) return false;

    const session: SupportSession = {
      id: `sup-${Date.now()}`,
      supportUserId: user.id,
      supportUserName: user.name,
      targetCompanyId: targetComp.id,
      targetCompanyName: targetComp.tradeName,
      reason: reason || 'Atendimento técnico solicitado pelo cliente.',
      startedAt: new Date().toISOString(),
    };

    setSupportSession(session);
    localStorage.setItem('koma_support_session', JSON.stringify(session));

    await switchActiveCompany(companyId);

    await DatabaseService.logAudit({
      userId: user.id,
      userName: user.name,
      action: 'SUPPORT_SESSION_STARTED',
      entity: 'COMPANY',
      entityId: companyId,
      description: `Iniciou Sessão de Suporte na empresa "${targetComp.tradeName}". Motivo: "${session.reason}".`,
      timestamp: new Date().toISOString(),
    });

    return true;
  };

  const endSupportSession = async () => {
    if (!supportSession || !user) return;
    const prevCompanyName = supportSession.targetCompanyName;
    const prevCompanyId = supportSession.targetCompanyId;
    setSupportSession(null);
    localStorage.removeItem('koma_support_session');

    await DatabaseService.logAudit({
      userId: user.id,
      userName: user.name,
      action: 'SUPPORT_SESSION_ENDED',
      entity: 'COMPANY',
      entityId: prevCompanyId,
      description: `Encerrou Sessão de Suporte na empresa "${prevCompanyName}".`,
      timestamp: new Date().toISOString(),
    });

    await switchActiveCompany('company-koma');
  };

  const loadTenantContext = async (targetUser: User, targetCompanyId?: string, targetLocationId?: string) => {
    try {
      const storedCompId = targetCompanyId || localStorage.getItem('koma_active_company_id') || undefined;
      const storedLocId = targetLocationId || localStorage.getItem('koma_active_store') || undefined;
      const ctx = await DatabaseService.getTenantContext(targetUser.id, storedCompId, storedLocId);
      setTenantContext(ctx);
      setActiveCompany(ctx.activeCompany);
      setActiveLocation(ctx.activeLocation);
      setAllowedCompanies(ctx.companies);
      setAllowedLocations(ctx.locations);
      localStorage.setItem('koma_active_company_id', ctx.activeCompany.id);
      localStorage.setItem('koma_active_company_name', ctx.activeCompany.tradeName);
      localStorage.setItem('koma_active_store', ctx.activeLocation.id);
    } catch (err) {
      console.error('Error loading tenant context:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await DatabaseService.initialize();

        const storedUser = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
        const storedRefresh = localStorage.getItem(AUTH_REFRESH_KEY) || sessionStorage.getItem(AUTH_REFRESH_KEY);

        let currentUser: User | null = null;

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
          setRefreshToken(storedRefresh || `rt-${parsedUser.id}-${Date.now()}`);
          currentUser = parsedUser;
        } else {
          // Default to Administrator in initial session
          const users = await DatabaseService.getUsers();
          const admin = users.find(u => u.role === 'admin' || u.role === 'super_admin') || users[0];
          if (admin) {
            setUser(admin);
            const initialToken = `jwt-token-${admin.id}-${Date.now()}`;
            const initialRefresh = `rt-${admin.id}-${Date.now()}`;
            setToken(initialToken);
            setRefreshToken(initialRefresh);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(admin));
            localStorage.setItem(AUTH_TOKEN_KEY, initialToken);
            localStorage.setItem(AUTH_REFRESH_KEY, initialRefresh);
            currentUser = admin;
          }
        }

        if (currentUser) {
          await loadTenantContext(currentUser);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const switchActiveCompany = async (companyId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const ctx = await DatabaseService.getTenantContext(user.id, companyId);
      setTenantContext(ctx);
      setActiveCompany(ctx.activeCompany);
      setActiveLocation(ctx.activeLocation);
      setAllowedCompanies(ctx.companies);
      setAllowedLocations(ctx.locations);
      localStorage.setItem('koma_active_company_id', ctx.activeCompany.id);
      localStorage.setItem('koma_active_company_name', ctx.activeCompany.tradeName);
      localStorage.setItem('koma_active_store', ctx.activeLocation.id);
      window.dispatchEvent(new Event('storage'));
      return true;
    } catch (err) {
      console.error('Failed to switch active company:', err);
      return false;
    }
  };

  const switchActiveLocation = async (locationId: string): Promise<boolean> => {
    if (!user || !activeCompany) return false;
    try {
      const ctx = await DatabaseService.getTenantContext(user.id, activeCompany.id, locationId);
      setTenantContext(ctx);
      setActiveLocation(ctx.activeLocation);
      localStorage.setItem('koma_active_store', ctx.activeLocation.id);
      window.dispatchEvent(new Event('storage'));
      return true;
    } catch (err) {
      console.error('Failed to switch active location:', err);
      return false;
    }
  };

  const reloadTenantContext = async () => {
    if (user) {
      await loadTenantContext(user, activeCompany?.id, activeLocation?.id);
    }
  };

  const login = async (usernameOrEmail: string, password: string, rememberMe: boolean = true) => {
    try {
      const users = await DatabaseService.getUsers();
      const cleanInput = usernameOrEmail.trim().toLowerCase();

      const found = users.find(
        u => (u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput) &&
             u.status === 'active'
      );

      if (!found) {
        return { success: false, message: 'Usuário não encontrado ou inativo.' };
      }

      // Password verification
      if (found.passwordHash && found.passwordHash !== password) {
        return { success: false, message: 'Senha incorreta.' };
      }

      // Update last login
      const updatedUser: User = {
        ...found,
        lastLogin: new Date().toISOString(),
      };
      await DatabaseService.saveUser(updatedUser);

      // Generate JWT Access Token and Refresh Token
      const generatedToken = `jwt-${updatedUser.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const generatedRefresh = `rt-${updatedUser.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      setUser(updatedUser);
      setToken(generatedToken);
      setRefreshToken(generatedRefresh);

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      storage.setItem(AUTH_TOKEN_KEY, generatedToken);
      storage.setItem(AUTH_REFRESH_KEY, generatedRefresh);

      // Audit log
      await DatabaseService.logAudit({
        userId: updatedUser.id,
        userName: updatedUser.name,
        action: 'LOGIN',
        entity: 'USER',
        entityId: updatedUser.id,
        description: `Usuário ${updatedUser.name} (${updatedUser.role}) efetuou login com sucesso.`,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao efetuar login.' };
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    if (!user || !refreshToken) return false;
    const newToken = `jwt-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToken(newToken);
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    return true;
  };

  const updateProfile = async (data: { name?: string; phone?: string; email?: string; password?: string }) => {
    if (!user) return { success: false, message: 'Nenhum usuário autenticado.' };

    try {
      const updatedUser: User = {
        ...user,
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.phone ? { phone: data.phone.trim() } : {}),
        ...(data.email ? { email: data.email.trim().toLowerCase() } : {}),
        ...(data.password ? { passwordHash: data.password.trim() } : {}),
      };

      await DatabaseService.saveUser(updatedUser);
      setUser(updatedUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));

      await DatabaseService.logAudit({
        userId: updatedUser.id,
        userName: updatedUser.name,
        action: 'PERFIL_ATUALIZADO',
        entity: 'USER',
        entityId: updatedUser.id,
        description: `Usuário ${updatedUser.name} atualizou seus dados de perfil.`,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao atualizar perfil.' };
    }
  };

  const logout = () => {
    if (user) {
      DatabaseService.logAudit({
        userId: user.id,
        userName: user.name,
        action: 'LOGOUT',
        entity: 'USER',
        entityId: user.id,
        description: `Usuário ${user.name} efetuou logout e encerrou a sessão.`,
        timestamp: new Date().toISOString(),
      });
    }

    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REFRESH_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_REFRESH_KEY);
  };

  const switchUserRole = async (targetRole: UserRole) => {
    const users = await DatabaseService.getUsers();
    const targetUser = users.find(u => u.role === targetRole && u.status === 'active');
    if (targetUser) {
      setUser(targetUser);
      const generatedToken = `jwt-${targetUser.id}-${Date.now()}`;
      setToken(generatedToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(targetUser));
      localStorage.setItem(AUTH_TOKEN_KEY, generatedToken);
    }
  };

  const role = user?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isManager = role === 'manager';
  const isCashier = role === 'cashier';
  const isKitchen = role === 'kitchen';
  const isStock = role === 'stock_manager';
  const isFinance = role === 'finance';

  const hasPermission = (permission: PermissionKey): boolean => {
    return checkPermission(user, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshSession,
        updateProfile,
        switchUserRole,
        hasPermission,

        // SaaS Tenant Context & Multi-Company Hierarchy
        tenantContext,
        activeCompany,
        activeLocation,
        allowedCompanies,
        allowedLocations,
        switchActiveCompany,
        switchActiveLocation,
        reloadTenantContext,

        // Support Session / Impersonation
        supportSession,
        startSupportSession,
        endSupportSession,

        // Role booleans
        isAdmin,
        isManager,
        isCashier,
        isKitchen,
        isStock,
        isFinance,

        // Permission shortcuts
        canManageUsers: hasPermission('users.manage'),
        canManageProducts: hasPermission('products.create') || hasPermission('products.edit'),
        canManageCustomers: hasPermission('customers.manage'),
        canViewFinancial: hasPermission('finance.view'),
        canViewReports: hasPermission('reports.view'),
        canCancelSale: hasPermission('sales.cancel'),
        canAccessPDV: hasPermission('sales.create'),
        canManageCash: hasPermission('cash.open') || hasPermission('cash.view'),
        canManageStock: hasPermission('inventory.view'),
        canAccessKitchen: hasPermission('kitchen.view'),
        canManageSettings: hasPermission('settings.manage'),
        canViewAudit: hasPermission('audit.view'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
