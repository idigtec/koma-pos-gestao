import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Database,
  ArrowDownUp,
  Clock,
  X,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { LocalPersistenceService } from '../../services/localPersistence';
import { useToast } from '../../contexts/ToastContext';

export interface SyncStatusIndicatorProps {
  /**
   * Visual layout variant
   * - 'pill': Header pill with icon, status label and popover trigger (default)
   * - 'compact': Small dot with icon only, suitable for tight spaces
   * - 'expanded': Detailed panel showing full sync stats and action buttons
   */
  variant?: 'pill' | 'compact' | 'expanded';
  /**
   * If true, displays a floating alert notification when the app is offline
   */
  showBannerWhenOffline?: boolean;
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  variant = 'pill',
  showBannerWhenOffline = true,
  className = '',
}) => {
  const { success, warning, error, info } = useToast();

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [cachedProductsCount, setCachedProductsCount] = useState<number>(0);
  const [cachedCustomersCount, setCachedCustomersCount] = useState<number>(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [offlineBannerDismissed, setOfflineBannerDismissed] = useState<boolean>(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Refresh data from 'idb'
  const refreshStorageStats = async () => {
    try {
      const [count, prods, custs] = await Promise.all([
        LocalPersistenceService.getPendingCount().catch(() => 0),
        LocalPersistenceService.getProducts().catch(() => []),
        LocalPersistenceService.getCustomers().catch(() => []),
      ]);
      setPendingCount(count);
      setCachedProductsCount(prods.length);
      setCachedCustomersCount(custs.length);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    refreshStorageStats();

    // 1. Connectivity change handlers
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineBannerDismissed(false);
      info('Conexão Restaurada', 'Internet restabelecida. Sincronizando dados com o Firestore...');
      handleTriggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineBannerDismissed(false);
      warning(
        'Modo Offline Ativo',
        'O sistema entrou em contingência. Todos os registros estão seguros no IndexedDB (idb).'
      );
      refreshStorageStats();
    };

    // 2. Custom sync events dispatched by LocalPersistenceService
    const handleSyncEvent = (e: any) => {
      refreshStorageStats();
      setLastSyncTime(new Date());
      if (e?.detail?.synced > 0) {
        setLastSyncTime(new Date());
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pos-sales-synced', handleSyncEvent);
    window.addEventListener('pos-offline-sync-complete', handleSyncEvent);

    // 3. Periodic polling every 8 seconds for accurate status
    const interval = setInterval(refreshStorageStats, 8000);

    // 4. Click outside listener to close popover
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pos-sales-synced', handleSyncEvent);
      window.removeEventListener('pos-offline-sync-complete', handleSyncEvent);
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Trigger manual sync with Firestore
  const handleTriggerSync = async () => {
    if (!navigator.onLine) {
      warning('Sem Conexão', 'Não é possível sincronizar com o Firestore enquanto estiver offline.');
      return;
    }

    try {
      setIsSyncing(true);
      const result = await LocalPersistenceService.syncPendingWithFirestore();
      setLastSyncTime(new Date());
      await refreshStorageStats();

      if (result.synced > 0) {
        success(
          'Sincronização Concluída',
          `${result.synced} transação(ões) offline enviada(s) com sucesso para o Firestore!`
        );
      } else if (result.failed > 0) {
        warning(
          'Atenção na Sincronização',
          `${result.failed} item(ns) falharam ao enviar. O idb tentará novamente na próxima reconexão.`
        );
      } else {
        info('Tudo Atualizado', 'Todas as transações locais já estão sincronizadas com o Firestore.');
      }
    } catch (err: any) {
      error('Erro de Sincronização', err?.message || 'Falha ao sincronizar com o Firestore.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull fresh catalog and customers from Firestore into local idb
  const handlePullFromFirestore = async () => {
    if (!navigator.onLine) {
      warning('Sem Conexão', 'Conecte-se à internet para atualizar o cache do Firestore.');
      return;
    }

    try {
      setIsSyncing(true);
      const res = await LocalPersistenceService.pullAndCacheFromFirestore();
      await refreshStorageStats();
      success(
        'Cache Atualizado',
        `Carregados ${res.productsCount} produtos e ${res.customersCount} clientes do Firestore para o 'idb'.`
      );
    } catch (err: any) {
      error('Erro ao atualizar cache', err?.message || 'Falha ao buscar dados do Firestore.');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Nesta sessão';
    return lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // ========================================================
  // RENDER: VARIANT COMPACT
  // ========================================================
  if (variant === 'compact') {
    return (
      <div className={`relative inline-flex items-center ${className}`} ref={popoverRef}>
        <button
          type="button"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
            !isOnline
              ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
              : pendingCount > 0
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
          title={
            !isOnline
              ? 'Offline: Dados salvos localmente no idb'
              : pendingCount > 0
              ? `${pendingCount} transações pendentes de sincronização com Firestore`
              : 'Firestore e idb totalmente sincronizados'
          }
        >
          {!isOnline ? (
            <WifiOff className="w-4 h-4 text-amber-700" />
          ) : isSyncing ? (
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          ) : pendingCount > 0 ? (
            <CloudOff className="w-4 h-4 text-amber-600" />
          ) : (
            <Cloud className="w-4 h-4 text-emerald-600" />
          )}
        </button>

        {isPopoverOpen && renderPopover()}
      </div>
    );
  }

  // ========================================================
  // RENDER: VARIANT EXPANDED (Full Card for Settings/Dashboard)
  // ========================================================
  if (variant === 'expanded') {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-xs ${className}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                !isOnline
                  ? 'bg-amber-100 text-amber-800'
                  : pendingCount > 0
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {!isOnline ? (
                <WifiOff className="w-5 h-5 text-amber-700" />
              ) : isSyncing ? (
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <Database className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                Status de Sincronização (idb &amp; Firestore)
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    !isOnline
                      ? 'bg-amber-100 text-amber-900'
                      : pendingCount > 0
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {!isOnline ? 'Offline' : pendingCount > 0 ? 'Pendente' : 'Sincronizado'}
                </span>
              </h4>
              <p className="text-xs text-slate-500">
                Gerenciamento de persistência local com a biblioteca <span className="font-mono text-orange-600 font-bold">idb</span> e banco em nuvem Firestore
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={isSyncing || !isOnline}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              !isOnline
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isSyncing
                ? 'bg-blue-600 text-white opacity-80 cursor-wait'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs hover:shadow-md'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
          </button>
        </div>

        {/* Status Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Conexão Rede</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="font-bold text-xs text-slate-900">
                {isOnline ? 'Online (Conectado)' : 'Offline (Local)'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Fila no 'idb'</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`font-black text-xs ${pendingCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                {pendingCount} pendente{pendingCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Catálogo em Cache</span>
            <span className="font-bold text-xs text-slate-900 mt-1 block">
              {cachedProductsCount} produtos / {cachedCustomersCount} clientes
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Última Sincronização</span>
            <span className="font-bold text-xs text-slate-700 mt-1 block">
              {formatLastSync()}
            </span>
          </div>
        </div>

        {/* Offline Alert Details */}
        {!isOnline && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Aviso de Operação Offline:</p>
              <p className="mt-0.5 opacity-90">
                O terminal está funcionando normalmente utilizando o banco local 'idb'. Suas vendas recebem certificação de contingência e serão sincronizadas com o Firestore automaticamente assim que o sinal de internet retornar.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================================================
  // RENDER: VARIANT PILL (Standard Header Indicator)
  // ========================================================
  return (
    <div className={`relative inline-flex items-center ${className}`} ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
          !isOnline
            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs'
            : isSyncing
            ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
            : pendingCount > 0
            ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
        }`}
        title={
          !isOnline
            ? 'Modo Offline: Armazenamento local idb ativo'
            : pendingCount > 0
            ? `${pendingCount} venda(s) no idb aguardando envio ao Firestore`
            : 'Firestore sincronizado com IndexedDB'
        }
      >
        {/* Status Indicator Icon */}
        {!isOnline ? (
          <span className="flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">Offline (idb)</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-black">
                {pendingCount}
              </span>
            )}
          </span>
        ) : isSyncing ? (
          <span className="flex items-center gap-1.5 text-blue-700">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span className="hidden sm:inline">Sincronizando...</span>
          </span>
        ) : pendingCount > 0 ? (
          <span className="flex items-center gap-1.5">
            <CloudOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline text-amber-900">
              {pendingCount} no idb
            </span>
            <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-black">
              {pendingCount}
            </span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Firestore Sync</span>
          </span>
        )}

        <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Popover Card */}
      {isPopoverOpen && renderPopover()}

      {/* Floating Offline Alert Banner (Per Best Practices) */}
      {!isOnline && showBannerWhenOffline && !offlineBannerDismissed && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] bg-slate-900/95 text-white backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <WifiOff className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                  Alerta: Terminal em Modo Offline
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                    idb local ativo
                  </span>
                </h5>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Sem conexão com a nuvem. Todas as vendas e operações do PDV continuam funcionando com total segurança no banco local <strong className="text-white">IndexedDB (idb)</strong>.
                </p>
                {pendingCount > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-200">
                    <Database className="w-3.5 h-3.5" />
                    <span>
                      <strong className="text-white">{pendingCount}</strong> transação(ões) na fila de envio automático.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOfflineBannerDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dispensar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ========================================================
  // POPOVER DETAILS CONTENT
  // ========================================================
  function renderPopover() {
    return (
      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Popover Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-600" />
            <h4 className="font-bold text-slate-900 text-xs">
              Sincronização IndexedDB ('idb') &amp; Firestore
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setIsPopoverOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Offline Warning Notice inside Popover */}
        {!isOnline && (
          <div className="my-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Conexão Indisponível</span>
              <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                O PDV está gravando no armazenamento local com a biblioteca <strong>'idb'</strong>. Assim que a internet retornar, o envio para o Firestore será automático.
              </p>
            </div>
          </div>
        )}

        {/* Details List */}
        <div className="space-y-2 py-3">
          {/* Firestore Status */}
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-slate-400" />
              Nuvem (Firestore)
            </span>
            <span
              className={`font-bold flex items-center gap-1 ${
                isOnline ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {isOnline ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {/* Local Persistence 'idb' Status */}
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              Banco Local ('idb')
            </span>
            <span className="font-bold text-slate-900 font-mono text-[11px]">
              pos_omnichannel_idb (Ativo)
            </span>
          </div>

          {/* Pending Sales Count */}
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <ArrowDownUp className="w-3.5 h-3.5 text-slate-400" />
              Transações Pendentes
            </span>
            <span
              className={`font-black ${
                pendingCount > 0 ? 'text-amber-600' : 'text-emerald-700'
              }`}
            >
              {pendingCount} {pendingCount === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {/* Cached Catalog */}
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Catálogo Offline
            </span>
            <span className="font-semibold text-slate-700 text-[11px]">
              {cachedProductsCount} produtos / {cachedCustomersCount} clientes
            </span>
          </div>

          {/* Last Sync */}
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Última Sincronização
            </span>
            <span className="text-slate-600 font-medium text-[11px]">
              {formatLastSync()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={isSyncing || !isOnline}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !isOnline
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isSyncing
                ? 'bg-blue-600 text-white cursor-wait opacity-80'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing
                ? 'Sincronizando com Firestore...'
                : pendingCount > 0
                ? `Enviar ${pendingCount} Transação(ões) ao Firestore`
                : 'Sincronizar com Firestore Agora'}
            </span>
          </button>

          <button
            type="button"
            onClick={handlePullFromFirestore}
            disabled={isSyncing || !isOnline}
            className={`w-full py-1.5 px-3 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer ${
              !isOnline
                ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Atualizar Catálogo &amp; Clientes em Cache ('idb')</span>
          </button>
        </div>
      </div>
    );
  }
};
