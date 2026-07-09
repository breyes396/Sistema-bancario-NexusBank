import { FaTimes, FaPrint, FaCheckCircle, FaClock, FaTimesCircle, FaDownload } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { showError } from '../../../shared/utils/toast.js';
import '../../../styles/transactionDetail.css';

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '—';
  const num = parseFloat(amount);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'GTQ'
  }).format(num);
};

const getStatusIcon = (status, isReverted) => {
  if (isReverted) return <FaTimesCircle className="status-icon error" />;
  if (status === 'COMPLETADA') return <FaCheckCircle className="status-icon success" />;
  if (status === 'PENDIENTE') return <FaClock className="status-icon warning" />;
  return <FaTimesCircle className="status-icon error" />;
};

const getStatusLabel = (status, isReverted) => {
  if (isReverted) return 'Revertido';
  return status || 'Desconocido';
};

const getTypeLabel = (type) => {
  const typeMap = {
    DEPOSITO: 'Depósito',
    TRANSFERENCIA_ENVIADA: 'Transferencia Enviada',
    TRANSFERENCIA_RECIBIDA: 'Transferencia Recibida',
    RETIRO: 'Retiro',
    COMPRA: 'Compra'
  };
  return typeMap[type] || type;
};

const buildPrintHtml = (transaction) => {
  const date = new Date(transaction.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  const revertedInfo = transaction.isReverted ? `<p style="color:#d63a3a;font-weight:700">Reversión procesada: ${new Date(transaction.revertedAt).toLocaleString('es-ES')}</p>` : '';

  return `<!doctype html>
  <html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Detalle de movimiento</title>
    <style>
      body { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #1A2E52; padding: 24px; }
      .card { max-width: 760px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 8px 24px rgba(26,46,82,0.08); }
      .header { display:flex; justify-content:space-between; align-items:center; }
      .amount { font-size:28px; font-weight:700; color: ${['DEPOSITO','TRANSFERENCIA_RECIBIDA'].includes(transaction.type) ? '#1A6637' : '#7A1A1A'}; }
      .label { color:#6b7280; font-size:12px; }
      .row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #EDF2FA; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <div>
          <div style="font-size:14px;color:#6b7280">Detalle del movimiento</div>
          <div style="font-size:12px;color:#8AABC9">${date}</div>
        </div>
        <div class="amount">${transaction.type.includes('ENVIADA') || transaction.type === 'RETIRO' ? '-' : '+'} ${new Intl.NumberFormat('es-MX',{style:'currency',currency:'GTQ'}).format(transaction.amount)}</div>
      </div>

      <div style="margin-top:16px">
        <div class="row"><span class="label">Tipo</span><span>${transaction.type}</span></div>
        <div class="row"><span class="label">Referencia</span><span style="font-family:monospace">${transaction.id}</span></div>
        <div class="row"><span class="label">Descripción</span><span>${transaction.description || '—'}</span></div>
        <div class="row"><span class="label">Cuenta</span><span style="font-family:monospace">${transaction.accountNumber || '—'}</span></div>
        <div class="row"><span class="label">Cuenta relacionada</span><span style="font-family:monospace">${transaction.relatedAccountNumber || '—'}</span></div>
        <div class="row"><span class="label">Saldo después</span><span>${new Intl.NumberFormat('es-MX',{style:'currency',currency:'GTQ'}).format(transaction.balanceAfter)}</span></div>
        <div class="row"><span class="label">Estado</span><span>${transaction.isReverted ? 'REVERTIDO' : transaction.status}</span></div>
        ${revertedInfo}
      </div>
    </div>
  </body>
  </html>`;
};

const openPrintWindow = (transaction) => {
  const html = buildPrintHtml(transaction);
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    showError('No se pudo abrir la ventana de impresión. Verifica bloqueadores de ventanas emergentes.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

const handleDownloadPdf = async (transaction) => {
  const el = document.querySelector('.transaction-detail-modal');
  if (!el) {
    showError('No se encontró el contenido para generar el PDF.');
    return;
  }

  try {
    // clone and inline styles to preserve look
    const clone = el.cloneNode(true);
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = window.getComputedStyle(el).width || el.offsetWidth + 'px';
    container.appendChild(clone);
    document.body.appendChild(container);

    const inlineStyles = (source, target) => {
      const computed = window.getComputedStyle(source);
      let cssText = '';
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        cssText += `${prop}: ${computed.getPropertyValue(prop)}; `;
      }
      target.setAttribute('style', cssText);
      const sourceChildren = Array.from(source.children || []);
      const targetChildren = Array.from(target.children || []);
      for (let i = 0; i < sourceChildren.length; i++) {
        inlineStyles(sourceChildren[i], targetChildren[i]);
      }
    };

    inlineStyles(el, clone);

    if (document.fonts && document.fonts.ready) await document.fonts.ready;

    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 20;
    const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;

    const pxPerPt = canvas.width / pdfWidth;
    const pageHeightPts = pdf.internal.pageSize.getHeight() - margin * 2;
    const pageHeightPx = Math.floor(pageHeightPts * pxPerPt);

    let remainingPx = canvas.height;
    let yPx = 0;
    let pageIndex = 0;

    while (remainingPx > 0) {
      const sliceHeight = Math.min(pageHeightPx, remainingPx);
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = canvas.width;
      tmpCanvas.height = sliceHeight;
      const tctx = tmpCanvas.getContext('2d');
      tctx.drawImage(canvas, 0, yPx, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      const imgPart = tmpCanvas.toDataURL('image/png');

      const imgProps = pdf.getImageProperties(imgPart);
      const imgHeightPts = (imgProps.height * pdfWidth) / imgProps.width;

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgPart, 'PNG', margin, margin, pdfWidth, imgHeightPts);

      remainingPx -= sliceHeight;
      yPx += sliceHeight;
      pageIndex += 1;
    }

    pdf.save(`movimiento-${transaction.id || Date.now()}.pdf`);
    document.body.removeChild(container);
  } catch (err) {
    console.error(err);
    showError('Error al generar el PDF: ' + (err?.message || err));
  }
};

export default function TransactionDetail({ transaction, onClose }) {
  if (!transaction) return null;

  const isIncome = ['DEPOSITO', 'TRANSFERENCIA_RECIBIDA'].includes(transaction.type);

  return (
    <div className="transaction-detail-overlay" onClick={onClose}>
      <div className="transaction-detail-modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h3 className="modal-title">Detalles del Movimiento</h3>
          <button className="close-btn" onClick={onClose} title="Cerrar">
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">

          <div className="detail-summary">
            <div className="summary-amount-section">
              <div className="amount-label">Monto</div>
              <div className={`amount-value ${isIncome ? 'income' : 'expense'}`}>
                {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
              </div>
              {transaction.isReverted && (
                <div className="reverted-badge">Reversión procesada</div>
              )}
            </div>

            <div className="status-section">
              <div className="status-display">
                {getStatusIcon(transaction.status, transaction.isReverted)}
                <div className="status-text">
                  <div className="status-label">Estado</div>
                  <div className="status-value">{getStatusLabel(transaction.status, transaction.isReverted)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-sections">

            <div className="detail-section">
              <h4 className="section-title">Información General</h4>
              <div className="section-content">
                <div className="detail-row">
                  <span className="detail-label">Tipo de movimiento:</span>
                  <span className="detail-value">{getTypeLabel(transaction.type)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Número de referencia:</span>
                  <span className="detail-value monospace">{transaction.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Descripción:</span>
                  <span className="detail-value">{transaction.description || '—'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Cuentas Involucradas</h4>
              <div className="section-content">
                <div className="detail-row">
                  <span className="detail-label">De/Desde:</span>
                  <span className="detail-value monospace">{transaction.accountNumber || '—'}</span>
                </div>
                {transaction.relatedAccountNumber && (
                  <div className="detail-row">
                    <span className="detail-label">Hacia/A:</span>
                    <span className="detail-value monospace">{transaction.relatedAccountNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Saldos</h4>
              <div className="section-content">
                <div className="detail-row">
                  <span className="detail-label">Saldo después del movimiento:</span>
                  <span className="detail-value">{formatCurrency(transaction.balanceAfter)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Fechas y Horas</h4>
              <div className="section-content">
                <div className="detail-row">
                  <span className="detail-label">Fecha del movimiento:</span>
                  <span className="detail-value">{formatDate(transaction.createdAt)}</span>
                </div>
                {transaction.isReverted && transaction.revertedAt && (
                  <div className="detail-row">
                    <span className="detail-label">Fecha de reversión:</span>
                    <span className="detail-value">{formatDate(transaction.revertedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {transaction.isReverted && (
              <div className="detail-section reverted-section">
                <h4 className="section-title" style={{ color: '#d63a3a' }}>
                  Información de Reversión
                </h4>
                <div className="section-content">
                  <div className="detail-row">
                    <span className="detail-label">Estado:</span>
                    <span className="detail-value" style={{ color: '#d63a3a', fontWeight: '600' }}>
                      Reversión Completada
                    </span>
                  </div>
                  {transaction.revertReason && (
                    <div className="detail-row">
                      <span className="detail-label">Motivo:</span>
                      <span className="detail-value">{transaction.revertReason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="detail-section audit-section">
              <h4 className="section-title">Auditoría</h4>
              <div className="section-content">
                <div className="detail-row">
                  <span className="detail-label">Última actualización:</span>
                  <span className="detail-value">{formatDate(transaction.updatedAt)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn secondary" onClick={() => openPrintWindow(transaction)} title="Imprimir">
            <FaPrint /> Imprimir
          </button>

          <button className="action-btn secondary" onClick={() => handleDownloadPdf(transaction)} title="Descargar PDF">
            <FaDownload /> PDF
          </button>

          <button className="action-btn primary" onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
