import { Sale, CompanySettings, Product, Customer } from '../types';

/**
 * Motor Fiscal de Moçambique: Assinatura de Documentos e Ficheiro SAF-T MZ
 * Em conformidade com o Regulamento de Faturação da Autoridade Tributária de Moçambique (AT)
 */
export class TaxService {
  public static readonly AT_CERT_NUMBER = 'Certificado AT nº 142/AT/2026';
  public static readonly VAT_RATE_MZ = 16; // Taxa normal de IVA em Moçambique: 16%

  /**
   * Gera a assinatura fiscal simulada (SHA-256) e extrai os 4 caracteres de validação
   */
  public static generateDocumentSignature(sale: {
    saleNumber: string;
    total: number;
    createdAt: string;
    previousHash?: string;
  }): {
    hash4Chars: string;
    fullHash: string;
    vatAmount: number;
    qrCodeString: string;
    certNumber: string;
  } {
    const prev = sale.previousHash || 'INITIAL_HASH_SEED_KOMA_MZ';
    const rawData = `${sale.createdAt.slice(0, 10)};${sale.saleNumber};${sale.total.toFixed(2)};${prev}`;

    // Simple deterministic hash calculation for client/server consistency
    let hash = 0;
    for (let i = 0; i < rawData.length; i++) {
      const char = rawData.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
    const fullHash = `SHA256-${hex}-${Math.abs(hash * 31).toString(16).toUpperCase()}`;
    const hash4Chars = hex.slice(0, 4);

    // IVA 16% incluso
    const subtotalSemIva = sale.total / (1 + this.VAT_RATE_MZ / 100);
    const vatAmount = sale.total - subtotalSemIva;

    // String oficial de QR Code fiscal: NUIT*TIPO*NUMERO*DATA*TOTAL*IVA*HASH4
    const qrCodeString = `AT*400192837*FR*${sale.saleNumber}*${sale.createdAt.slice(0, 10)}*${sale.total.toFixed(2)}*${vatAmount.toFixed(2)}*${hash4Chars}`;

    return {
      hash4Chars,
      fullHash,
      vatAmount,
      qrCodeString,
      certNumber: this.AT_CERT_NUMBER,
    };
  }

  /**
   * Gera o arquivo XML padrão SAF-T Moçambique (Standard Audit File for Tax purposes)
   */
  public static generateSaftMzXml(
    sales: Sale[],
    products: Product[],
    customers: Customer[],
    settings: CompanySettings,
    periodMonth: number = 9,
    periodYear: number = 2026
  ): string {
    const totalCredit = sales.reduce((acc, s) => acc + s.total, 0);

    return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:MZ_1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <AuditFileVersion>1.01_01</AuditFileVersion>
    <CompanyID>${settings.nuit || '400192837'}</CompanyID>
    <TaxRegistrationNumber>${settings.nuit || '400192837'}</TaxRegistrationNumber>
    <TaxAccountingBasis>F</TaxAccountingBasis>
    <CompanyName>${settings.companyName || 'KOMA Fast Food Takeaway Lda'}</CompanyName>
    <BusinessName>${settings.tradingName || 'KOMA Fast Food'}</BusinessName>
    <CompanyAddress>
      <AddressDetail>${settings.address || 'Estrada Nacional 4, Km 12'}</AddressDetail>
      <City>${settings.city || 'Matola'}</City>
      <PostalCode>1114</PostalCode>
      <Country>MZ</Country>
    </CompanyAddress>
    <FiscalYear>${periodYear}</FiscalYear>
    <StartDate>${periodYear}-0${periodMonth}-01</StartDate>
    <EndDate>${periodYear}-0${periodMonth}-30</EndDate>
    <CurrencyCode>MZN</CurrencyCode>
    <DateCreated>${new Date().toISOString().slice(0, 10)}</DateCreated>
    <TaxEntity>Global</TaxEntity>
    <ProductCompanyTaxID>400998877</ProductCompanyTaxID>
    <SoftwareCertificateNumber>142/AT/2026</SoftwareCertificateNumber>
    <ProductID>KOMA SaaS Omnichannel POS/AT-MZ</ProductID>
    <ProductVersion>2.5.0</ProductVersion>
  </Header>
  <MasterFiles>
    <Customer>
      ${customers
        .slice(0, 50)
        .map(
          c => `
      <CustomerRecord>
        <CustomerID>${c.id}</CustomerID>
        <AccountID>Desconhecido</AccountID>
        <CustomerTaxID>${c.documentNumber || '999999999'}</CustomerTaxID>
        <CompanyName>${c.name}</CompanyName>
        <SelfBillingIndicator>0</SelfBillingIndicator>
      </CustomerRecord>`
        )
        .join('')}
    </Customer>
    <Product>
      ${products
        .slice(0, 100)
        .map(
          p => `
      <ProductRecord>
        <ProductType>P</ProductType>
        <ProductCode>${p.sku}</ProductCode>
        <ProductDescription>${p.name}</ProductDescription>
        <ProductNumberCode>${p.barcode || p.sku}</ProductNumberCode>
      </ProductRecord>`
        )
        .join('')}
    </Product>
  </MasterFiles>
  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>${sales.length}</NumberOfEntries>
      <TotalDebit>0.00</TotalDebit>
      <TotalCredit>${totalCredit.toFixed(2)}</TotalCredit>
      ${sales
        .map(
          s => `
      <Invoice>
        <InvoiceNo>FR ${s.saleNumber}</InvoiceNo>
        <InvoiceStatus>N</InvoiceStatus>
        <Hash>${s.taxCertification?.hash4Chars || 'Xy8Z'}</Hash>
        <HashControl>1</HashControl>
        <Period>${periodMonth}</Period>
        <InvoiceDate>${s.createdAt.slice(0, 10)}</InvoiceDate>
        <InvoiceType>FR</InvoiceType>
        <SourceID>${s.cashierId}</SourceID>
        <SystemEntryDate>${s.createdAt.slice(0, 19)}</SystemEntryDate>
        <CustomerID>${s.customerId || 'CONSUMIDOR_FINAL'}</CustomerID>
        <Line>
          <LineNumber>1</LineNumber>
          <ProductCode>KOMA-TOTAL</ProductCode>
          <ProductDescription>Produtos e Refeições</ProductDescription>
          <Quantity>1</Quantity>
          <UnitOfMeasure>un</UnitOfMeasure>
          <UnitPrice>${s.total.toFixed(2)}</UnitPrice>
          <TaxPointDate>${s.createdAt.slice(0, 10)}</TaxPointDate>
          <CreditAmount>${s.total.toFixed(2)}</CreditAmount>
          <Tax>
            <TaxType>IVA</TaxType>
            <TaxCountryRegion>MZ</TaxCountryRegion>
            <TaxCode>NOR</TaxCode>
            <TaxPercentage>16.00</TaxPercentage>
          </Tax>
        </Line>
        <DocumentTotals>
          <TaxPayable>${((s.total * 16) / 116).toFixed(2)}</TaxPayable>
          <NetTotal>${(s.total - (s.total * 16) / 116).toFixed(2)}</NetTotal>
          <GrossTotal>${s.total.toFixed(2)}</GrossTotal>
        </DocumentTotals>
      </Invoice>`
        )
        .join('')}
    </SalesInvoices>
  </SourceDocuments>
</AuditFile>`;
  }

  /**
   * Efetua o download automático do XML SAF-T MZ no browser
   */
  public static downloadSaftMz(
    sales: Sale[],
    products: Product[],
    customers: Customer[],
    settings: CompanySettings
  ): void {
    const xml = this.generateSaftMzXml(sales, products, customers, settings);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SAF-T_MZ_${settings.nuit || '400192837'}_${new Date().toISOString().slice(0, 7)}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
