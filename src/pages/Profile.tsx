import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  Key,
  Building2,
  Store,
  CheckCircle2,
  Clock,
  LogOut,
  Mail,
  Phone,
  ArrowLeft,
  Sparkles,
  Lock,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UserRole } from '../types';
import { ROLE_DEFINITIONS } from '../utils/permissions';
import { NavItemKey } from '../components/layout/Sidebar';

interface ProfilePageProps {
  onNavigate?: (tab: NavItemKey) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, activeCompany, activeLocation, switchUserRole, logout } = useAuth();
  const { success, warning } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const roleDef = user ? ROLE_DEFINITIONS[user.role] : null;

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      warning('Senha Curta', 'A nova senha deve possuir pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      warning('Senhas Divergentes', 'A confirmação de senha não confere com a nova senha digitada.');
      return;
    }

    setIsChangingPass(true);
    setTimeout(() => {
      setIsChangingPass(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      success('Senha Atualizada!', 'Sua senha de acesso foi alterada com sucesso.');
    }, 600);
  };

  const ROLES_LIST: { role: UserRole; name: string }[] = [
    { role: 'admin', name: 'Administrador Geral' },
    { role: 'manager', name: 'Gerente Operacional' },
    { role: 'cashier', name: 'Operador de Caixa' },
    { role: 'kitchen', name: 'Cozinheiro / KDS' },
    { role: 'stock_manager', name: 'Gestor de Estoque' },
    { role: 'finance', name: 'Analista Financeiro' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 select-none">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate?.('dashboard')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-600" />
          <span>Voltar ao Dashboard</span>
        </button>

        <span className="text-xs text-slate-500 font-medium">
          Módulo de Perfil &amp; Segurança
        </span>
      </div>

      {/* Main Profile Card Header */}
      <div className="bg-gradient-to-r from-slate-950 via-stone-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-orange-500/20 shrink-0 border-2 border-slate-800">
            {user?.name.slice(0, 2).toUpperCase() || 'KM'}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">
                {user?.name}
              </h1>
              <span className={`inline-block self-center sm:self-auto text-xs px-3 py-1 rounded-full font-bold border ${roleDef?.badgeColor || 'bg-slate-800 text-white'}`}>
                {roleDef?.name || user?.role}
              </span>
            </div>

            <p className="text-xs text-stone-300 flex items-center justify-center sm:justify-start gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                <span>{user?.email}</span>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-orange-400" />
                <span>{user?.phone || '+258 84 000 0000'}</span>
              </span>
              <span className="flex items-center gap-1 font-mono text-stone-400">
                @{user?.username}
              </span>
            </p>

            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 flex-wrap text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-stone-300">
                <Building2 className="w-3.5 h-3.5 text-orange-400" />
                <span>{activeCompany?.tradeName || 'KOMA Fast Food'}</span>
              </span>

              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-stone-300">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeLocation?.name || 'Matola Rio (Matriz)'}</span>
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/30 flex items-center gap-2 cursor-pointer self-center sm:self-start shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Grid: Permissions + Password Security */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: RBAC Permissions List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-orange-600" />
                <span>Permissões &amp; Acessos Concedidos</span>
              </h3>
              <p className="text-xs text-slate-500">
                Regras baseadas no perfil de usuário atribuído ({roleDef?.name})
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              {user?.permissions?.length || 0} ativas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
            {(user?.permissions || []).map((perm) => (
              <div
                key={perm}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-mono text-slate-700 truncate">{perm}</span>
              </div>
            ))}
          </div>

          {/* Quick Role Tester (for demonstration / multi-role operational team) */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Simular Alternância de Perfil (RBAC Rápido):</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ROLES_LIST.map(({ role: r, name }) => (
                <button
                  key={r}
                  onClick={() => {
                    switchUserRole(r);
                    success('Perfil Alternado', `Você agora está operando como ${name}.`);
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                    user?.role === r
                      ? 'bg-orange-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Change Password */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-orange-600" />
              <span>Segurança da Conta</span>
            </h3>
            <p className="text-xs text-slate-500">
              Altere sua senha de login no sistema
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Senha Atual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repita a nova senha"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isChangingPass ? 'Salvando...' : 'Atualizar Senha'}</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Último Acesso Registrado:</span>
            </div>
            <p className="font-mono pl-5 text-slate-600">
              {new Date().toLocaleDateString('pt-MZ')} às {new Date().toLocaleTimeString('pt-MZ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
