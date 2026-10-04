import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Receipt,
  Save,
  Check,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';
import { DatabaseService } from '../services/db';
import { CompanySettings } from '../types';
import { useToast } from '../contexts/ToastContext';
import { SyncStatusIndicator } from '../components/common/SyncStatusIndicator';

export const SettingsPage: React.FC = () => {
  const { success, error } = useToast();
  const [settings, setSettings] = useState<CompanySettings>(DatabaseService.getSettings as any);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await DatabaseService.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await DatabaseService.saveSettings(settings);
      success('Configurações Salvas', 'Os dados da empresa e recibos foram atualizados.');
    } catch (err: any) {
      error('Erro ao salvar', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-600" />
          <span>Configurações do Estabelecimento &amp; Recibos</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure a razão social, NUIT para emissão fiscal em Moçambique e formato de impressão térmica.
        </p>
      </div>

      {/* Local 'idb' & Cloud Firestore Synchronization Status */}
      <SyncStatusIndicator variant="expanded" showBannerWhenOffline={false} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span>Dados Oficiais da Empresa</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Razão Social</label>
              <input
                type="text"
                value={settings.companyName || ''}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Nome Fantasia / Comercial</label>
              <input
                type="text"
                value={settings.tradingName || ''}
                onChange={(e) => setSettings({ ...settings, tradingName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">NUIT (Moçambique)</label>
              <input
                type="text"
                value={settings.nuit || ''}
                onChange={(e) => setSettings({ ...settings, nuit: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Telefone Principal</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Comercial</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Endereço Completo</label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Cidade</label>
              <input
                type="text"
                value={settings.city || ''}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Receipt & Thermal Printer Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Receipt className="w-4 h-4 text-orange-600" />
            <span>Formato de Comprovante Térmico (80mm)</span>
          </h3>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Mensagem de Rodapé do Recibo (Agradecimento / Fiscal)
            </label>
            <textarea
              value={settings.receiptFooterMessage || ''}
              onChange={(e) => setSettings({ ...settings, receiptFooterMessage: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Moeda do Sistema</label>
              <input
                type="text"
                disabled
                value="Metical de Moçambique (MT / MZN)"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-xl font-bold text-slate-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Fuso Horário Padrão</label>
              <input
                type="text"
                disabled
                value="Africa/Maputo (GMT+2)"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-xl font-bold text-slate-600"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-950/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
