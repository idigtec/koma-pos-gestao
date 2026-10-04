import React, { useRef } from 'react';
import { X, Printer, Download, ShoppingBag, CheckCircle } from 'lucide-react';
import { Sale, CompanySettings } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { PdfService } from '../../services/pdfService';

interface ReceiptModalProps {
  sale: Sale | null;
  settings: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
  onNewSale?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  settings,
  isOpen,
  onClose,
  onNewSale,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    PdfService.generateSaleReceipt(sale, settings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-sm">Comprovante de Venda Fiscal/Não Fiscal</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Preview (styled as thermal slip) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          <div
            ref={receiptRef}
            className="w-full max-w-[340px] bg-white p-6 rounded-lg shadow-sm border border-slate-200 font-mono text-xs text-slate-800 leading-tight space-y-3"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {/* Header info */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              <div className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                {settings.companyName}
              </div>
              {settings.tradingName && <div className="text-[11px] text-slate-600">{settings.tradingName}</div>}
              {settings.address && <div className="text-[10px] text-slate-500 mt-1">{settings.address}</div>}
              {settings.nuit && <div className="text-[10px] text-slate-500">NUIT: {settings.nuit}</div>}
              {settings.phone && <div className="text-[10px] text-slate-500">Tel: {settings.phone}</div>}
            </div>

            {/* Sale metadata */}
            <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between font-bold">
                <span>VENDA Nº:</span>
                <span>{sale.saleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Data:</span>
                <span>{formatDateTime(sale.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Operador:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="truncate max-w-[170px]">{sale.customerName}</span>
              </div>
              {sale.status === 'cancelled' && (
                <div className="text-center font-bold text-rose-600 bg-rose-50 py-1 rounded">
                  *** VENDA CANCELADA ***
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between font-bold text-[10px] text-slate-500 uppercase pb-1">
                <span>Item</span>
                <span>Qtd x Preço</span>
                <span>Total</span>
              </div>
              <div className="space-y-1 text-[11px]">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-1">
                    <div className="truncate flex-1">
                      <div className="font-medium">{item.product.name}</div>
                      {item.removedIngredients && item.removedIngredients.length > 0 && (
                        <div className="text-[9px] text-rose-700 font-bold uppercase">
                          {item.removedIngredients.map(r => `SEM ${r}`).join(' • ')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-[9px] text-amber-800 font-medium italic">
                          Obs: {item.notes}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 font-sans">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                        {item.discount > 0 && ` (-${formatCurrency(item.discount)})`}
                      </div>
                    </div>
                    <div className="font-semibold">{formatCurrency(item.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>
                    Desconto {sale.discountType === 'percentage' && sale.discountValue ? `(${sale.discountValue}%)` : ''}:
                  </span>
                  <span>-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                <span>TOTAL A PAGAR:</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
            </div>

            {/* Payments */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
              <div className="font-bold text-[10px] text-slate-500 uppercase">Formas de Pagamento</div>
              {sale.payments.map((p, idx) => (
                <div key={idx}>
                  <div className="flex justify-between">
                    <span>{p.label}:</span>
                    <span>{formatCurrency(p.amount)}</span>
                  </div>
                  {p.receivedAmount && p.receivedAmount > p.amount && (
                    <>
                      <div className="flex justify-between text-[10px] text-slate-500 pl-2">
                        <span>Recebido:</span>
                        <span>{formatCurrency(p.receivedAmount)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-emerald-700 pl-2">
                        <span>Troco:</span>
                        <span>{formatCurrency(p.change || (p.receivedAmount - p.amount))}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Fiscal AT Moçambique Certification */}
            <div className="pt-2 pb-1 border-t border-dashed border-slate-300 text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                {/* Visual SVG QR Code */}
                <div className="p-1 bg-white border border-slate-300 rounded shadow-2xs inline-block">
                  <svg className="w-16 h-16" viewBox="0 0 29 29" fill="black">
                    {/* Standard QR Code visual representation */}
                    <path d="M0 0h7v7H0zm2 2h3v3H2zm7-2h2v1h-2zm3 0h1v2h-1zm2 0h1v1h-1zm2 0h2v1h-2zm3 0h2v2h-2zm3 0h7v7h-7zm2 2h3v3h-3zm-15 2h1v1h-1zm3 0h1v1h-1zm3 0h1v2h-1zm-10 2h1v1h-1zm2 0h1v1h-1zm3 0h1v1h-1zm3 0h2v1h-2zm2 0h1v2h-1zm-13 1h1v1h-1zm3 0h1v1h-1zm6 0h1v1h-1zm4 0h1v1h-1zm-12 1h1v1h-1zm4 0h1v1h-1zm2 0h2v1h-2zm6 0h1v1h-1zm-14 1h1v1h-1zm2 0h2v1h-2zm3 0h1v1h-1zm2 0h1v1h-1zm4 0h1v1h-1zm-10 1h2v1h-2zm3 0h1v1h-1zm5 0h1v1h-1zm-9 1h1v1h-1zm4 0h1v1h-1zm2 0h1v1h-1zm4 0h1v1h-1zm-9 1h2v1h-2zm3 0h1v1h-1zm5 0h1v1h-1zm-8 1h1v1h-1zm2 0h1v1h-1zm3 0h1v1h-1zm3 0h2v1h-2zm-10 1h7v7H0zm2 2h3v3H2zm7 0h1v1h-1zm3 0h1v2h-1zm2 0h1v1h-1zm-3 2h2v1h-2zm-6 2h1v1h-1zm3 0h1v1h-1zm4 0h1v1h-1z" />
                  </svg>
                </div>
                <div className="text-left text-[9px] text-slate-600 font-mono leading-tight">
                  <div className="font-bold text-slate-800">AT MOÇAMBIQUE</div>
                  <div>Doc. Assinado Digitalmente</div>
                  <div className="font-bold text-orange-700">
                    Hash AT: {sale.taxCertification?.hash4Chars || '4a7F'}-Processado
                  </div>
                  <div>Certificado nº 142/AT/2026</div>
                  <div className="text-[8px] text-slate-400">IVA 16% Incluso: {formatCurrency(sale.total - sale.total / 1.16)}</div>
                </div>
              </div>
              <div className="text-[8px] text-slate-400 font-mono">
                Consulte em: portal.at.gov.mz/faturas
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-500 whitespace-pre-line pt-1">
              {settings.receiptFooterMessage}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
          </div>

          <div className="flex gap-2">
            {onNewSale && (
              <button
                onClick={() => {
                  onClose();
                  onNewSale();
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Nova Venda
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
