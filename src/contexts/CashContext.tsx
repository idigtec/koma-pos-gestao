import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CashSession, CashMovement } from '../types';
import { DatabaseService } from '../services/db';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CashContextType {
  activeSession: CashSession | null;
  isLoading: boolean;
  isOpen: boolean;
  refreshCashSession: () => Promise<void>;
  openCash: (registerName: string, initialAmount: number, notes?: string) => Promise<boolean>;
  closeCash: (countedAmount: number, notes?: string) => Promise<CashSession | null>;
  doSangria: (amount: number, reason: string) => Promise<boolean>;
  doSuprimento: (amount: number, reason: string) => Promise<boolean>;
}

const CashContext = createContext<CashContextType | undefined>(undefined);

export const CashProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshCashSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = await DatabaseService.getActiveCashSession(user?.id);
      setActiveSession(session);
    } catch (err) {
      console.error('Error fetching cash session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCashSession();
  }, [refreshCashSession]);

  const openCash = async (registerName: string, initialAmount: number, notes?: string): Promise<boolean> => {
    if (!user) {
      error('Usuário não autenticado.');
      return false;
    }
    if (activeSession) {
      warning('Já existe uma sessão de caixa aberta para este operador.');
      return false;
    }

    try {
      const session = await DatabaseService.openCashSession(registerName, initialAmount, user, notes);
      setActiveSession(session);
      success('Caixa Aberto!', `Sessão iniciada com fundo inicial de ${initialAmount.toFixed(2)} MT.`);
      return true;
    } catch (err: any) {
      error('Erro ao abrir caixa', err.message);
      return false;
    }
  };

  const closeCash = async (countedAmount: number, notes?: string): Promise<CashSession | null> => {
    if (!user || !activeSession) {
      error('Nenhuma sessão de caixa ativa para fechar.');
      return null;
    }

    try {
      const closed = await DatabaseService.closeCashSession(activeSession.id, countedAmount, user, notes);
      setActiveSession(null);
      const diff = closed.difference || 0;
      if (diff === 0) {
        success('Caixa Fechado com Sucesso!', 'Valores conferidos exatamente sem diferença.');
      } else if (diff > 0) {
        warning('Caixa Fechado com Sobra', `Sobra apurada de +${diff.toFixed(2)} MT.`);
      } else {
        warning('Caixa Fechado com Quebra', `Falta apurada de ${diff.toFixed(2)} MT.`);
      }
      return closed;
    } catch (err: any) {
      error('Erro ao fechar caixa', err.message);
      return null;
    }
  };

  const doSangria = async (amount: number, reason: string): Promise<boolean> => {
    if (!user || !activeSession) {
      error('Caixa não está aberto.');
      return false;
    }
    if (amount <= 0) {
      error('Valor inválido', 'O valor da sangria deve ser maior que zero.');
      return false;
    }
    if (amount > activeSession.expectedAmount) {
      warning('Atenção', 'O valor da sangria excede o valor disponível esperado em caixa.');
    }

    try {
      await DatabaseService.registerSangria(activeSession.id, amount, reason, user);
      await refreshCashSession();
      success('Sangria Registrada!', `Retirada de ${amount.toFixed(2)} MT efetuada com sucesso.`);
      return true;
    } catch (err: any) {
      error('Erro na Sangria', err.message);
      return false;
    }
  };

  const doSuprimento = async (amount: number, reason: string): Promise<boolean> => {
    if (!user || !activeSession) {
      error('Caixa não está aberto.');
      return false;
    }
    if (amount <= 0) {
      error('Valor inválido', 'O valor do suprimento deve ser maior que zero.');
      return false;
    }

    try {
      await DatabaseService.registerSuprimento(activeSession.id, amount, reason, user);
      await refreshCashSession();
      success('Suprimento Adicionado!', `Entrada de ${amount.toFixed(2)} MT adicionada ao caixa.`);
      return true;
    } catch (err: any) {
      error('Erro no Suprimento', err.message);
      return false;
    }
  };

  return (
    <CashContext.Provider
      value={{
        activeSession,
        isLoading,
        isOpen: !!activeSession,
        refreshCashSession,
        openCash,
        closeCash,
        doSangria,
        doSuprimento,
      }}
    >
      {children}
    </CashContext.Provider>
  );
};

export const useCash = (): CashContextType => {
  const context = useContext(CashContext);
  if (!context) throw new Error('useCash must be used within CashProvider');
  return context;
};
