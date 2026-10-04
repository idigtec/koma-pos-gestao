import React, { useState } from 'react';
import { X, User, Lock, Phone, Mail, ShieldCheck, Key, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ROLE_DEFINITIONS, ALL_PERMISSIONS_LIST } from '../../utils/permissions';
import { formatDateTime } from '../../utils/formatters';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { success, error, warning } = useToast();

  const [activeTab, setActiveTab] = useState<'details' | 'permissions' | 'security'>('details');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const roleDef = ROLE_DEFINITIONS[user.role] || {
    name: user.role,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Perfil de usuário.',
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      warning('Atenção', 'O nome não pode estar em branco.');
      return;
    }

    if (password && password !== confirmPassword) {
      error('Senhas não coincidem', 'A nova senha e a confirmação devem ser idênticas.');
      return;
    }

    setIsSubmitting(true);
    const result = await updateProfile({
      name,
      email,
      phone,
      ...(password.trim() ? { password: password.trim() } : {}),
    });
    setIsSubmitting(false);

    if (result.success) {
      success('Perfil Atualizado', 'Seus dados foram atualizados com sucesso.');
      setPassword('');
      setConfirmPassword('');
      onClose();
    } else {
      error('Erro ao atualizar', result.message || 'Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Meu Perfil de Acesso</h3>
              <p className="text-xs text-slate-500">@{user.username} • {user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
              activeTab === 'details'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dados Pessoais
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
              activeTab === 'permissions'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Permissões RBAC
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
              activeTab === 'security'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Segurança &amp; Senha
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'details' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Telefone / Celular
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+258 84 000 0000"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Último Login: {user.lastLogin ? formatDateTime(user.lastLogin) : 'Agora'}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${roleDef.badgeColor}`}>
                  {roleDef.name}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Função Ativa: <span className="text-orange-600">{roleDef.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{roleDef.description}</p>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Permissões Atribuídas ao seu Perfil
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {ALL_PERMISSIONS_LIST.map((perm) => {
                  const isGranted =
                    user.role === 'admin' ||
                    user.role === 'super_admin' ||
                    (user.permissions && user.permissions.includes(perm.key)) ||
                    (ROLE_DEFINITIONS[user.role]?.defaultPermissions.includes(perm.key));

                  return (
                    <div
                      key={perm.key}
                      className={`flex items-center gap-2 p-2 rounded-lg text-[11px] border ${
                        isGranted
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-medium'
                          : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
                      }`}
                    >
                      <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${isGranted ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span className="truncate">{perm.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                Altere sua senha de acesso. A nova senha será necessária no próximo login.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nova Palavra-passe
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirmar Nova Palavra-passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !password.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Atualizando...' : 'Atualizar Palavra-passe'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
