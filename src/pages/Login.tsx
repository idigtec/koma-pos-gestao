import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, LogIn, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { KomaLogo } from '../components/common/KomaLogo';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(username, password, rememberMe);
    setIsLoading(false);

    if (result.success) {
      success('Bem-vindo!', 'Sessão iniciada com sucesso no sistema KOMA.');
    } else {
      error('Falha de Autenticação', result.message || 'Verifique suas credenciais.');
    }
  };

  const handleQuickFill = (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-stone-900 to-orange-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
        {/* Brand Banner */}
        <div className="bg-slate-950 px-8 pt-8 pb-6 text-center text-white border-b border-slate-800 flex flex-col items-center">
          <KomaLogo size="lg" theme="dark" variant="full" className="mb-2" />
          <p className="text-xs text-orange-200/80 mt-1 font-medium">
            Sistema Integrado de Ponto de Venda, Caixa &amp; Estoque
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Usuário ou Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-hidden transition-all text-slate-900"
                placeholder="admin, gerente ou caixa"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Palavra-passe / Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-hidden transition-all text-slate-900"
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
              />
              <span>Lembrar sessão</span>
            </label>
            <span className="text-orange-600 font-semibold text-[11px] cursor-pointer hover:underline">
              Suporte KOMA
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-950/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Acesso Rápido por Perfil (Ambiente de Teste)
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="p-2 border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 rounded-xl font-medium transition-colors text-center cursor-pointer"
              >
                <div className="font-bold text-[11px]">Admin</div>
                <div className="text-[10px] text-purple-600">Acesso Total</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('gerente', 'gerente123')}
                className="p-2 border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 rounded-xl font-medium transition-colors text-center cursor-pointer"
              >
                <div className="font-bold text-[11px]">Gerente</div>
                <div className="text-[10px] text-blue-600">Supervisão</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('caixa', 'caixa123')}
                className="p-2 border border-orange-200 bg-orange-50/70 hover:bg-orange-100 text-orange-900 rounded-xl font-medium transition-colors text-center cursor-pointer"
              >
                <div className="font-bold text-[11px]">Caixa</div>
                <div className="text-[10px] text-orange-600">Frente PDV</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('cozinha', 'cozinha123')}
                className="p-2 border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 rounded-xl font-medium transition-colors text-center cursor-pointer"
              >
                <div className="font-bold text-[11px]">Cozinha</div>
                <div className="text-[10px] text-amber-600">Painel KDS</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('estoque', 'estoque123')}
                className="p-2 border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 rounded-xl font-medium transition-colors text-center cursor-pointer"
              >
                <div className="font-bold text-[11px]">Estoque</div>
                <div className="text-[10px] text-emerald-600">Almoxarifado</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('financeiro', 'financeiro123')}
                className="p-2 border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 rounded-xl font-medium transition-colors text-center cursor-pointer"
              >
                <div className="font-bold text-[11px]">Financeiro</div>
                <div className="text-[10px] text-indigo-600">Fluxo &amp; DRE</div>
              </button>
            </div>
          </div>
        </form>

        {/* Security Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-orange-600" />
            <span>Autenticação Segura JWT</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-orange-500" />
            <span>Maputo (MZN)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
