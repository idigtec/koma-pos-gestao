import React, { useState } from 'react';
import { User, Phone, MapPin, Check, X, UserPlus, Sparkles, Building2 } from 'lucide-react';
import { Customer } from '../../types';
import { DatabaseService } from '../../services/db';
import { useToast } from '../../contexts/ToastContext';

interface QuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
}

export const QuickCustomerModal: React.FC<QuickCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerCreated,
}) => {
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [address, setAddress] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      error('Campo Obrigatório', 'Por favor, informe o nome do cliente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        name: name.trim(),
        customerType: 'singular',
        documentType: 'BI',
        documentNumber: documentNumber.trim() || undefined,
        phone: primaryPhone.trim() || undefined,
        secondaryPhone: secondaryPhone.trim() || undefined,
        address: address.trim() || undefined,
        city: 'Maputo',
        totalSpent: 0,
        totalPurchases: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await DatabaseService.saveCustomer(newCustomer);
      success(
        'Cliente Cadastrado com Sucesso!',
        `${newCustomer.name} foi adicionado e selecionado para o pedido.`
      );
      onCustomerCreated(newCustomer);
      onClose();

      // Reset form
      setName('');
      setPrimaryPhone('');
      setSecondaryPhone('');
      setAddress('');
      setDocumentNumber('');
    } catch (err: any) {
      error('Erro ao cadastrar cliente', err.message || 'Falha ao salvar no banco.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight flex items-center gap-1.5">
                <span>Cadastro Rápido de Cliente</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-white/20 text-white">
                  Singular
                </span>
              </h3>
              <p className="text-[11px] text-orange-100">
                Nome, telefones e morada para pedidos balcão e takeaway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome do Cliente <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Alberto Mondlane"
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Telefones: Primário e Secundário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número Primário (Principal) <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                  placeholder="Ex: 84 123 4567"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número Secundário (Opcional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  placeholder="Ex: 82 / 87 987 6543"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Morada / Endereço */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Morada / Bairro / Endereço de Entrega
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Bairro Central, Av. Eduardo Mondlane nº 124"
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* NUIT Opcional */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              NUIT / Documento (Opcional para fatura):
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Ex: 102345678"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar (ESC)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar & Selecionar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
