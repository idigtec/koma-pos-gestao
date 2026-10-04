import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Menu,
} from 'lucide-react';
import { NavItemKey } from './Sidebar';

interface BottomTabsProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  onOpenDrawer: () => void;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({
  currentTab,
  onSelectTab,
  onOpenDrawer,
}) => {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 text-slate-400 px-3 py-2 flex items-center justify-around select-none shadow-2xl"
      aria-label="Navegação Inferior Mobile (Bottom Tabs)"
    >
      {/* 1. Dashboard */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center gap-1 transition-all py-1 px-2 rounded-xl cursor-pointer ${
          currentTab === 'dashboard'
            ? 'text-orange-500 font-bold scale-105'
            : 'hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Dashboard</span>
      </button>

      {/* 2. Lançamentos / Vendas */}
      <button
        onClick={() => onSelectTab('vendas')}
        className={`flex flex-col items-center gap-1 transition-all py-1 px-2 rounded-xl cursor-pointer ${
          currentTab === 'vendas'
            ? 'text-orange-500 font-bold scale-105'
            : 'hover:text-slate-200'
        }`}
      >
        <Receipt className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Lançamentos</span>
      </button>

      {/* 3. CENTER ACTION: PDV (Frente Caixa) - Elevated Floating Button */}
      <button
        onClick={() => onSelectTab('pdv')}
        className={`-mt-6 flex flex-col items-center group cursor-pointer`}
        title="Abrir PDV Frente de Caixa"
      >
        <div
          className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 active:scale-95 border-2 ${
            currentTab === 'pdv'
              ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white border-white shadow-orange-500/40'
              : 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white border-slate-900 shadow-orange-500/30'
          }`}
        >
          <ShoppingCart className="w-6 h-6 drop-shadow-xs" />
        </div>
        <span className="text-[10px] font-extrabold text-orange-400 mt-1 tracking-tight">
          PDV Caixa
        </span>
      </button>

      {/* 4. Financeiro */}
      <button
        onClick={() => onSelectTab('financeiro')}
        className={`flex flex-col items-center gap-1 transition-all py-1 px-2 rounded-xl cursor-pointer ${
          currentTab === 'financeiro'
            ? 'text-orange-500 font-bold scale-105'
            : 'hover:text-slate-200'
        }`}
      >
        <TrendingUp className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Financeiro</span>
      </button>

      {/* 5. Menu / Drawer Trigger */}
      <button
        onClick={onOpenDrawer}
        className="flex flex-col items-center gap-1 transition-all py-1 px-2 rounded-xl hover:text-slate-200 cursor-pointer"
        title="Abrir Menu Completo (Drawer)"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Mais</span>
      </button>
    </nav>
  );
};
