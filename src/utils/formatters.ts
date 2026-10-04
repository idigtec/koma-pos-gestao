/**
 * Localized formatting utilities for Mozambique (MZN / MT, Africa/Maputo timezone)
 */

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0,00 MT';
  }

  // Mozambique standard: 1.250,00 MT
  const parts = value.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];

  return `${integerPart},${decimalPart} MT`;
}

export function formatDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '-';
    
    return new Intl.DateTimeFormat('pt-MZ', {
      timeZone: 'Africa/Maputo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateInput).slice(0, 10);
  }
}

export function formatTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '-';

    return new Intl.DateTimeFormat('pt-MZ', {
      timeZone: 'Africa/Maputo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '--:--:--';
  }
}

export function formatDateTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '-';
  return `${formatDate(dateInput)} ${formatTime(dateInput)}`;
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return value.toLocaleString('pt-MZ');
}

export function generateSaleNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `VD-${year}-${String(sequence).padStart(6, '0')}`;
}

export function generateSku(prefix: string, id: number): string {
  return `${prefix.toUpperCase().slice(0, 3)}-${String(id).padStart(5, '0')}`;
}
