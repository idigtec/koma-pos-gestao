import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Calendar,
  User,
  Filter,
  Activity,
  Lock,
  ShoppingBag,
  DollarSign,
  Package,
  Layers
} from 'lucide-react';
import { DatabaseService } from '../services/db';
import { AuditLog } from '../types';
import { formatDateTime } from '../utils/formatters';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        const data = await DatabaseService.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return logs.filter(l => {
      const matchEntity = entityFilter === 'all' || l.entity === entityFilter;
      const matchQuery =
        !q ||
        l.description.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q);
      return matchEntity && matchQuery;
    });
  }, [logs, searchQuery, entityFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('LOGIN')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">LOGIN</span>;
    }
    if (action.includes('LOGOUT')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">LOGOUT</span>;
    }
    if (action.includes('VENDA_FINALIZADA')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">VENDA PDV</span>;
    }
    if (action.includes('CANCELADA')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">CANCELAMENTO</span>;
    }
    if (action.includes('CAIXA')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">CAIXA</span>;
    }
    if (action.includes('ESTOQUE')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">ESTOQUE</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">{action}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-orange-600" />
          <span>Auditoria do Sistema &amp; Trilha de Logs</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Registro cronológico imutável de todas as ações sensíveis realizadas pelos operadores no sistema.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por descrição, ação ou responsável..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-700"
        >
          <option value="all">Todas as Entidades</option>
          <option value="SALE">Vendas (SALE)</option>
          <option value="CASH_SESSION">Caixa (CASH_SESSION)</option>
          <option value="PRODUCT">Produtos / Estoque</option>
          <option value="USER">Usuários / Acesso</option>
          <option value="FINANCIAL">Financeiro</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data e Hora</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Entidade</th>
                <th className="py-3 px-4">Descrição da Operação</th>
                <th className="py-3 px-4">Usuário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.entity}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{log.description}</td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{log.userName}</td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Nenhum log de auditoria encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
