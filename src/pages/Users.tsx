import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCog,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  X,
  Phone,
  Mail,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { DatabaseService } from '../services/db';
import { User, UserRole } from '../types';
import { formatDateTime } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ROLE_DEFINITIONS } from '../utils/permissions';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error, warning } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getUsers();
      setUsers(data);
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openNewUserModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setEmail('');
    setPhone('+258 ');
    setRole('cashier');
    setPassword('123456');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditUserModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username);
    setEmail(u.email);
    setPhone(u.phone || '');
    setRole(u.role);
    setPassword(u.passwordHash || '');
    setStatus(u.status);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      warning('Atenção', 'Nome e nome de usuário são obrigatórios.');
      return;
    }

    const userData: User = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      passwordHash: password.trim(),
      status,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
      lastLogin: editingUser?.lastLogin,
    };

    try {
      await DatabaseService.saveUser(userData);

      if (currentUser) {
        await DatabaseService.logAudit({
          userId: currentUser.id,
          userName: currentUser.name,
          action: editingUser ? 'USUARIO_ATUALIZADO' : 'USUARIO_CRIADO',
          entity: 'USER',
          entityId: userData.id,
          description: `${editingUser ? 'Atualização' : 'Criação'} do usuário ${userData.name} com papel ${userData.role}`,
          timestamp: new Date().toISOString(),
        });
      }

      success('Usuário Salvo', `Usuário "${userData.name}" foi salvo.`);
      setIsModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      error('Erro ao salvar usuário', err.message);
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      warning('Ação Não Permitida', 'Você não pode excluir o seu próprio usuário logado.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${targetUser.name}"?`)) return;

    try {
      await DatabaseService.deleteUser(targetUser.id);
      success('Usuário Excluído', `"${targetUser.name}" foi removido do sistema.`);
      await loadUsers();
    } catch (err: any) {
      error('Erro ao excluir', err.message);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter(u => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [users, searchQuery, roleFilter]);

  const getRoleBadge = (r: UserRole) => {
    const def = ROLE_DEFINITIONS[r];
    if (def) {
      return (
        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${def.badgeColor}`}>
          {def.name}
        </span>
      );
    }
    return <span className="bg-slate-100 text-slate-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">{r}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCog className="w-5 h-5 text-orange-600" />
            <span>Gestão de Usuários &amp; Permissões RBAC</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre funcionários, defina senhas de acesso e atribua perfis de Administrador, Gerente, Operador de Caixa, Cozinha, Estoque ou Financeiro.
          </p>
        </div>

        <button
          onClick={openNewUserModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, username ou email..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-700 cursor-pointer"
        >
          <option value="all">Todos os Perfis (6)</option>
          <option value="admin">Administrador</option>
          <option value="manager">Gerente Operacional</option>
          <option value="cashier">Operador de Caixa</option>
          <option value="kitchen">Cozinha (KDS)</option>
          <option value="stock_manager">Gestor de Estoque</option>
          <option value="finance">Analista Financeiro</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nome Completo</th>
                <th className="py-3 px-4">Usuário (Login)</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <div className="text-[10px] text-slate-400">Criado em: {formatDateTime(u.createdAt)}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{u.username}</td>
                  <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{u.email}</div>
                    {u.phone && <div className="text-[11px] text-slate-400">{u.phone}</div>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {u.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEditUserModal(u)}
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar Usuário"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir Usuário"
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

      {/* --- CREATE / EDIT USER MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveUser}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: João Baptista Sitoe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Usuário / Login</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="joao.sitoe"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Perfil de Acesso (RBAC)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold cursor-pointer"
                  >
                    <option value="admin">Administrador (Acesso Total)</option>
                    <option value="manager">Gerente Operacional</option>
                    <option value="cashier">Operador de Caixa (PDV)</option>
                    <option value="kitchen">Chefe / Cozinha (KDS)</option>
                    <option value="stock_manager">Gestor de Estoque</option>
                    <option value="finance">Analista Financeiro</option>
                  </select>
                </div>
              </div>

              {/* Role Info Preview */}
              {ROLE_DEFINITIONS[role] && (
                <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-orange-600" />
                      <span>{ROLE_DEFINITIONS[role].name}</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {ROLE_DEFINITIONS[role].defaultPermissions.length} permissões ativas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{ROLE_DEFINITIONS[role].description}</p>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Institucional</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.co.mz"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+258 84 000 0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Palavra-passe / Senha</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Senha de acesso"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status da Conta</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="active">Ativo (Permitido acesso)</option>
                  <option value="inactive">Inativo (Bloqueado)</option>
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
                Salvar Usuário
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
