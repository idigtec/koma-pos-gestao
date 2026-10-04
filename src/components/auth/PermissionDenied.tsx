import React from 'react';
import { ShieldAlert, ArrowLeft, Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_DEFINITIONS } from '../../utils/permissions';
import { UserRole } from '../../types';

interface PermissionDeniedProps {
  requiredPermissionName: string;
  allowedRoles?: UserRole[];
  onNavigateDashboard: () => void;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  requiredPermissionName,
  allowedRoles = ['admin', 'manager'],
  onNavigateDashboard,
}) => {
  const { user, switchUserRole } = useAuth();
  const currentRoleDef = user ? ROLE_DEFINITIONS[user.role] : null;

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[60vh] text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-black text-slate-900 tracking-tight">
        Acesso Restrito ao Módulo
      </h2>

      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
        O seu perfil atual{' '}
        <span className="font-bold text-slate-800">
          ({currentRoleDef?.name || user?.role})
        </span>{' '}
        não possui autorização para acessar <span className="font-bold text-rose-600">{requiredPermissionName}</span> segundo as regras de controle de acesso (RBAC).
      </p>

      {allowedRoles.length > 0 && (
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs w-full text-left">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-orange-600" />
            <span>Perfis com acesso permitido:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allowedRoles.map((r) => {
              const def = ROLE_DEFINITIONS[r];
              return (
                <span
                  key={r}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    def ? def.badgeColor : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {def?.name || r}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        <button
          onClick={onNavigateDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Dashboard</span>
        </button>

        {/* Quick switch to admin for test convenience */}
        <button
          onClick={() => switchUserRole('admin')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <span>Alternar para Administrador</span>
        </button>
      </div>
    </div>
  );
};
