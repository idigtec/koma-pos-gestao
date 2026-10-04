import { jsPDF } from 'jspdf';
import { Sale, CashSession, Product, FinancialTransaction, CompanySettings } from '../types';
import { formatCurrency, formatDateTime, formatDate } from '../utils/formatters';

export class PdfService {
  /**
   * Generates and triggers download of a professional POS Receipt (80mm style or A4 slip)
   */
  public static generateSaleReceipt(sale: Sale, settings: CompanySettings): void {
    // 80mm thermal receipt width is ~80mm, height dynamic
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 210], // 80mm width standard thermal roll
    });

    let y = 10;
    const left = 6;
    const right = 74;
    const center = 40;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(settings.companyName || 'SUPERGESTAO COMERCIAL', center, y, { align: 'center' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (settings.tradingName) {
      doc.text(settings.tradingName, center, y, { align: 'center' });
      y += 4;
    }
    if (settings.address) {
      doc.text(settings.address, center, y, { align: 'center' });
      y += 4;
    }
    if (settings.nuit) {
      doc.text(`NUIT: ${settings.nuit}`, center, y, { align: 'center' });
      y += 4;
    }
    if (settings.phone) {
      doc.text(`Tel: ${settings.phone}`, center, y, { align: 'center' });
      y += 4;
    }

    // Divider line
    y += 2;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(left, y, right, y);
    y += 5;

    // Sale Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`VENDA Nº: ${sale.saleNumber}`, left, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Data: ${formatDateTime(sale.createdAt)}`, left, y);
    y += 4;
    doc.text(`Operador: ${sale.cashierName}`, left, y);
    y += 4;
    doc.text(`Cliente: ${sale.customerName}`, left, y);
    y += 5;

    // Table Header
    doc.setLineDashPattern([], 0);
    doc.line(left, y, right, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Item', left, y);
    doc.text('Qtd x Preço', 42, y);
    doc.text('Total', right, y, { align: 'right' });
    y += 3;

    doc.line(left, y, right, y);
    y += 4;

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    sale.items.forEach((item) => {
      // Shorten product name if too long
      const name = item.product.name.length > 22 ? item.product.name.substring(0, 20) + '..' : item.product.name;
      doc.text(name, left, y);
      const qtyPrice = `${item.quantity} x ${item.unitPrice.toFixed(2)}`;
      doc.text(qtyPrice, 42, y);
      doc.text(formatCurrency(item.subtotal), right, y, { align: 'right' });
      y += 4;
      if (item.discount > 0) {
        doc.setFontSize(7);
        doc.text(`  Desc.: -${formatCurrency(item.discount)}`, left, y);
        doc.setFontSize(7.5);
        y += 3.5;
      }
    });

    // Divider
    y += 1;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(left, y, right, y);
    y += 4;

    // Totals
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Subtotal:', left, y);
    doc.text(formatCurrency(sale.subtotal), right, y, { align: 'right' });
    y += 4;

    if (sale.discount > 0) {
      doc.text('Desconto Total:', left, y);
      doc.text(`-${formatCurrency(sale.discount)}`, right, y, { align: 'right' });
      y += 4;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL:', left, y);
    doc.text(formatCurrency(sale.total), right, y, { align: 'right' });
    y += 6;

    // Payments
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PAGAMENTO:', left, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    sale.payments.forEach(p => {
      doc.text(`• ${p.label}:`, left, y);
      doc.text(formatCurrency(p.amount), right, y, { align: 'right' });
      y += 4;
      if (p.receivedAmount && p.receivedAmount > p.amount) {
        doc.text(`  Valor Recebido:`, left + 2, y);
        doc.text(formatCurrency(p.receivedAmount), right, y, { align: 'right' });
        y += 3.5;
        doc.text(`  Troco:`, left + 2, y);
        doc.text(formatCurrency(p.change || (p.receivedAmount - p.amount)), right, y, { align: 'right' });
        y += 4;
      }
    });

    // Footer
    y += 3;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(left, y, right, y);
    y += 5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    const footerLines = settings.receiptFooterMessage.split('\n');
    footerLines.forEach(line => {
      doc.text(line, center, y, { align: 'center' });
      y += 3.5;
    });

    doc.save(`Recibo-${sale.saleNumber}.pdf`);
  }

  /**
   * Generates Sales Report PDF (A4)
   */
  public static generateSalesReport(sales: Sale[], settings: CompanySettings, periodName: string): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let y = 18;

    // Company Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(settings.companyName, 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`NUIT: ${settings.nuit} | Tel: ${settings.phone} | Cidade: ${settings.city}`, 14, y);
    y += 8;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text(`RELATÓRIO GERAL DE VENDAS - ${periodName.toUpperCase()}`, 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Emitido em: ${formatDateTime(new Date().toISOString())}`, 14, y);
    y += 8;

    // Summary Box
    const totalVolume = sales.reduce((sum, s) => s.status === 'completed' ? sum + s.total : sum, 0);
    const countCompleted = sales.filter(s => s.status === 'completed').length;
    const countCancelled = sales.filter(s => s.status === 'cancelled').length;
    const avgTicket = countCompleted > 0 ? totalVolume / countCompleted : 0;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, 182, 18, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`Total Faturado: ${formatCurrency(totalVolume)}`, 20, y + 7);
    doc.text(`Vendas Realizadas: ${countCompleted}`, 90, y + 7);
    doc.text(`Ticket Médio: ${formatCurrency(avgTicket)}`, 140, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Vendas Canceladas: ${countCancelled}`, 20, y + 14);
    y += 24;

    // Table Header
    doc.setFillColor(51, 65, 85);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Nº Venda', 18, y + 5);
    doc.text('Data/Hora', 48, y + 5);
    doc.text('Cliente', 85, y + 5);
    doc.text('Operador', 130, y + 5);
    doc.text('Status', 160, y + 5);
    doc.text('Total', 192, y + 5, { align: 'right' });
    y += 7;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    sales.forEach((s, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 18;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 6, 'F');
      }

      doc.text(s.saleNumber, 18, y + 4.5);
      doc.text(formatDateTime(s.createdAt), 48, y + 4.5);
      doc.text(s.customerName.length > 20 ? s.customerName.slice(0, 18) + '..' : s.customerName, 85, y + 4.5);
      doc.text(s.cashierName.length > 15 ? s.cashierName.slice(0, 13) + '..' : s.cashierName, 130, y + 4.5);
      doc.text(s.status === 'completed' ? 'Concluída' : 'Cancelada', 160, y + 4.5);
      doc.text(formatCurrency(s.total), 192, y + 4.5, { align: 'right' });
      y += 6;
    });

    doc.save(`Relatorio-Vendas-${formatDate(new Date())}.pdf`);
  }

  /**
   * Generates Cash Register Session Report PDF (A4)
   */
  public static generateCashReport(session: CashSession, settings: CompanySettings): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(settings.companyName, 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`RELATÓRIO DE FECHAMENTO DE CAIXA`, 14, y);
    y += 10;

    // Session Data
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 182, 45, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Identificação do Caixa: ${session.cashRegisterName}`, 20, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Operador Responsável: ${session.userName}`, 20, y + 15);
    doc.text(`Abertura: ${formatDateTime(session.openedAt)}`, 20, y + 22);
    doc.text(`Fechamento: ${session.closedAt ? formatDateTime(session.closedAt) : 'Ainda Aberto'}`, 20, y + 29);
    doc.text(`Status: ${session.status === 'open' ? 'ABERTO' : 'FECHADO'}`, 20, y + 36);

    // Right Column
    doc.text(`Fundo Inicial: ${formatCurrency(session.initialAmount)}`, 110, y + 15);
    doc.text(`Total Vendas: ${formatCurrency(session.totalSales)}`, 110, y + 22);
    doc.text(`Sangrias: -${formatCurrency(session.totalSangrias)}`, 110, y + 29);
    doc.text(`Suprimentos: +${formatCurrency(session.totalSuprimentos)}`, 110, y + 36);
    y += 55;

    // Reconciliation Card
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(14, y, 182, 30, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CONCILIAÇÃO FÍSICA', 20, y + 8);
    doc.setFontSize(9);
    doc.text(`Saldo Esperado: ${formatCurrency(session.expectedAmount)}`, 20, y + 16);
    doc.text(`Saldo Contado (Gaveta): ${session.countedAmount !== undefined ? formatCurrency(session.countedAmount) : 'Pendente'}`, 20, y + 23);

    const diff = session.difference || 0;
    doc.text(`Diferença: ${formatCurrency(diff)} ${diff === 0 ? '(Bateu)' : diff > 0 ? '(Sobra)' : '(Falta)'}`, 110, y + 16);
    y += 40;

    if (session.notes) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.text(`Observações: ${session.notes}`, 14, y);
      y += 12;
    }

    // Signatures
    y = Math.max(y + 20, 220);
    doc.line(20, y, 80, y);
    doc.line(120, y, 180, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Assinatura do Operador', 50, y, { align: 'center' });
    doc.text('Assinatura da Gerência', 150, y, { align: 'center' });

    doc.save(`Fechamento-Caixa-${session.id}.pdf`);
  }

  /**
   * Generates Stock / Inventory Valuation Report PDF
   */
  public static generateStockReport(products: Product[], settings: CompanySettings): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(settings.companyName, 14, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('RELATÓRIO POSIÇÃO DE ESTOQUE & INVENTÁRIO', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Emitido em: ${formatDateTime(new Date().toISOString())}`, 14, y);
    y += 8;

    // Totals
    const totalItems = products.reduce((acc, p) => acc + p.currentStock, 0);
    const totalCostValue = products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);
    const totalSaleValue = products.reduce((acc, p) => acc + (p.currentStock * p.sellingPrice), 0);
    const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, 182, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`Itens em Estoque: ${totalItems} un`, 20, y + 7);
    doc.text(`Custo Total: ${formatCurrency(totalCostValue)}`, 70, y + 7);
    doc.text(`Valor de Venda: ${formatCurrency(totalSaleValue)}`, 130, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Produtos com Estoque Baixo: ${lowStockCount}`, 20, y + 13);
    y += 22;

    // Header
    doc.setFillColor(51, 65, 85);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SKU', 18, y + 5);
    doc.text('Produto', 45, y + 5);
    doc.text('Categoria', 105, y + 5);
    doc.text('Estoque', 140, y + 5);
    doc.text('Preço Custo', 165, y + 5, { align: 'right' });
    doc.text('Preço Venda', 192, y + 5, { align: 'right' });
    y += 7;

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    products.forEach((p, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 18;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 6, 'F');
      }

      doc.text(p.sku, 18, y + 4.5);
      doc.text(p.name.length > 25 ? p.name.slice(0, 23) + '..' : p.name, 45, y + 4.5);
      doc.text((p.categoryName || '-').slice(0, 18), 105, y + 4.5);
      doc.text(`${p.currentStock} ${p.unit} ${p.currentStock <= p.minStock ? '(!)' : ''}`, 140, y + 4.5);
      doc.text(formatCurrency(p.costPrice), 165, y + 4.5, { align: 'right' });
      doc.text(formatCurrency(p.sellingPrice), 192, y + 4.5, { align: 'right' });
      y += 6;
    });

    doc.save(`Inventario-Estoque-${formatDate(new Date())}.pdf`);
  }

  /**
   * Generates Financial Inflow/Outflow Report PDF
   */
  public static generateFinancialReport(
    transactions: FinancialTransaction[],
    settings: CompanySettings,
    period: string
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(settings.companyName, 14, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`DEMONSTRATIVO FINANCEIRO - ${period.toUpperCase()}`, 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Emitido em: ${formatDateTime(new Date().toISOString())}`, 14, y);
    y += 8;

    const totalInflows = transactions.filter(t => t.type === 'inflow').reduce((s, t) => s + t.amount, 0);
    const totalOutflows = transactions.filter(t => t.type === 'outflow').reduce((s, t) => s + t.amount, 0);
    const balance = totalInflows - totalOutflows;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, 182, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Total Entradas: ${formatCurrency(totalInflows)}`, 20, y + 7);
    doc.text(`Total Saídas: ${formatCurrency(totalOutflows)}`, 85, y + 7);
    doc.text(`Resultado Líquido: ${formatCurrency(balance)}`, 140, y + 7);
    y += 22;

    // Header
    doc.setFillColor(51, 65, 85);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Data', 18, y + 5);
    doc.text('Tipo', 45, y + 5);
    doc.text('Categoria / Descrição', 70, y + 5);
    doc.text('Método', 140, y + 5);
    doc.text('Valor', 192, y + 5, { align: 'right' });
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    transactions.forEach((t, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 18;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 6, 'F');
      }

      doc.text(formatDate(t.date), 18, y + 4.5);
      doc.text(t.type === 'inflow' ? 'Entrada (+)' : 'Saída (-)', 45, y + 4.5);
      doc.text(`${t.category} - ${t.description}`.slice(0, 35), 70, y + 4.5);
      doc.text(t.paymentMethod.slice(0, 15), 140, y + 4.5);
      doc.text(`${t.type === 'inflow' ? '+' : '-'}${formatCurrency(t.amount)}`, 192, y + 4.5, { align: 'right' });
      y += 6;
    });

    doc.save(`Financeiro-${formatDate(new Date())}.pdf`);
  }
}
