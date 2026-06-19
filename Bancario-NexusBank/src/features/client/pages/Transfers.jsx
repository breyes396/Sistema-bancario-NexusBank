import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useClientStore } from '../store/useClientStore.js';
import { clientTransferService } from '../../../shared/api/clientTransfer.service.js';
import { clientAccountService } from '../../../shared/api/clientAccount.service.js';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
import { useAuthStore } from '../../auth/store/authStore.js';
import { addReversalRequest, getLatestReversibleTransaction, isReversalApproved } from '../../../shared/utils/reversalRequests.js';
import RevertModal from '../../../shared/components/RevertModal.jsx';

const DAILY_TRANSFER_LIMIT = 2000;

const recipientTypes = [
  { value: 'TERCERO', label: 'Tercero' },
  { value: 'PROPIA', label: 'Cuenta propia' },
];

const formatAmount = (value) => Number(value || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 });

const getAccountTypeLabel = (account) => {
  const rawType = String(account?.accountType || account?.type || account?.name || '').trim().toLowerCase();

  if (!rawType) return 'Cuenta';
  if (rawType.includes('corrient') || rawType.includes('monetar')) return 'Cuenta corriente';
  if (rawType.includes('ahor')) return 'Cuenta de ahorro';
  if (rawType.startsWith('cuenta')) return rawType.charAt(0).toUpperCase() + rawType.slice(1);

  return `Cuenta ${rawType}`;
};

const normalizeTransfer = (transfer, fallback = {}) => {
  const amount = Number(transfer?.amount ?? fallback.amount ?? 0);
  const id = transfer?.id || transfer?.transactionId || transfer?._id || transfer?.reference || fallback.id || `${Date.now()}-${Math.random()}`;

  return {
    id,
    reference: transfer?.reference || transfer?.transactionId || id,
    sourceAccountNumber: transfer?.sourceAccountNumber || fallback.sourceAccountNumber || '',
    destinationAccountNumber: transfer?.destinationAccountNumber || fallback.destinationAccountNumber || '',
    recipientType: transfer?.recipientType || fallback.recipientType || 'TERCERO',
    amount,
    description: transfer?.description || fallback.description || 'Transferencia de prueba',
    status: transfer?.status || fallback.status || 'COMPLETADA',
    date: transfer?.createdAt || transfer?.date || fallback.date || new Date().toISOString(),
    balanceAfter: transfer?.balanceAfter ?? transfer?.newBalance ?? fallback.balanceAfter ?? null,
    currency: transfer?.currency || fallback.currency || 'GTQ',
    raw: transfer || fallback.raw || null,
  };
};

export const Transfers = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const {
    accounts,
    transactions,
    loading,
    error,
    fetchAllAccounts,
    fetchRecentTransactions,
    clearError,
  } = useClientStore();

  const [sourceAccountNumber, setSourceAccountNumber] = useState('');
  const [destinationAccountNumber, setDestinationAccountNumber] = useState('');
  const [recipientType, setRecipientType] = useState('TERCERO');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('GTQ');
  const [isManualCurrency, setIsManualCurrency] = useState(false);
  const [customCurrency, setCustomCurrency] = useState('');
  const [description, setDescription] = useState('');
  const [couponId, setCouponId] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [reversalUpdates, setReversalUpdates] = useState(0);

  useEffect(() => {
    fetchAllAccounts();
    fetchRecentTransactions(10);
  }, [fetchAllAccounts, fetchRecentTransactions]);

  useEffect(() => {
    const onReversalUpdate = () => setReversalUpdates((prev) => prev + 1);
    window.addEventListener('nexusbank-reversals-updated', onReversalUpdate);
    window.addEventListener('storage', onReversalUpdate);
    return () => {
      window.removeEventListener('nexusbank-reversals-updated', onReversalUpdate);
      window.removeEventListener('storage', onReversalUpdate);
    };
  }, []);

  useEffect(() => {
    if (error) {
      showError(error);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    if (!sourceAccountNumber && accounts.length > 0) {
      setSourceAccountNumber(accounts[0].accountNumber || '');
    }
  }, [accounts, sourceAccountNumber]);

  useEffect(() => {
    const prefill = location.state;
    if (!prefill) return;

    if (prefill.prefillSourceAccountNumber) {
      setSourceAccountNumber(prefill.prefillSourceAccountNumber);
    }

    if (prefill.prefillDestinationAccountNumber) {
      setDestinationAccountNumber(prefill.prefillDestinationAccountNumber);
    }

    if (prefill.prefillRecipientType) {
      setRecipientType(prefill.prefillRecipientType);
    }

    if (prefill.prefillDescription) {
      setDescription(prefill.prefillDescription);
    }

    if (prefill.prefillCouponId) {
      setCouponId(prefill.prefillCouponId);
    }

    setCurrentStep(1);
    setPendingTransfer(null);

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const sourceAccount = useMemo(
    () => accounts.find((account) => String(account.accountNumber) === String(sourceAccountNumber)) || null,
    [accounts, sourceAccountNumber]
  );

  const destinationAccount = useMemo(
    () => accounts.find((account) => String(account.accountNumber) === String(destinationAccountNumber)) || null,
    [accounts, destinationAccountNumber]
  );

  const availableBalance = Number(sourceAccount?.accountBalance ?? sourceAccount?.balance ?? 0);

  const backendTransferHistory = useMemo(() => {
    return Array.isArray(transactions)
      ? transactions
          .filter((tx) => String(tx.type || '').includes('TRANSFERENCIA'))
          .map((tx) => {
            const transactionId = String(tx.id || tx.transactionId || tx._id || '');
            const ref = String(tx.reference || tx.transactionId || tx.id || '');
            const isReverted = isReversalApproved(transactionId) || isReversalApproved(ref) || String(tx.status).toUpperCase() === 'REVERTIDA';
            return normalizeTransfer({
              id: transactionId,
              reference: ref,
              sourceAccountNumber: tx.sourceAccountNumber || tx.accountNumber || '',
              destinationAccountNumber: tx.destinationAccountNumber || '',
              recipientType: tx.recipientType || 'TERCERO',
              amount: tx.amount,
              description: tx.description || tx.concept || 'Transferencia',
              status: isReverted ? 'REVERTIDA' : (tx.status || 'COMPLETADA'),
              createdAt: tx.createdAt || tx.date || tx.updatedAt,
              balanceAfter: tx.balanceAfter ?? tx.newBalance ?? null,
              currency: tx.currency || 'GTQ',
            });
          })
      : [];
  }, [transactions, reversalUpdates]);

  const transferHistory = useMemo(() => {
    // 1. Get all transactions from both sources
    const combined = [...recentTransfers, ...backendTransferHistory];
    
    // 2. Identify unique transactions, preferring the latest one (usually backend has more info)
    const uniqueMap = new Map();
    combined.forEach((item) => {
      const txId = String(item.id || item.transactionId || item._id || '');
      if (txId) uniqueMap.set(txId, item);
    });

    // 3. Process the list to apply the REVERTIDA status where appropriate
    return Array.from(uniqueMap.values())
      .map((item) => {
        const transactionId = String(item.id || item.transactionId || item._id || '');
        const ref = String(item.reference || item.transactionId || item.id || '');
        
        // A transaction is reverted if it matches an approved reversal request OR its backend status is already REVERTIDA
        const isReverted = isReversalApproved(transactionId) || isReversalApproved(ref) || String(item.status).toUpperCase() === 'REVERTIDA';
        
        return {
          ...item,
          status: isReverted ? 'REVERTIDA' : (item.status || 'COMPLETADA')
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [backendTransferHistory, recentTransfers, reversalUpdates]);

  const latestReversibleTransaction = useMemo(() => getLatestReversibleTransaction(transferHistory.map((transfer) => ({
    ...transfer,
    type: 'TRANSFERENCIA',
  }))), [transferHistory]);

  const selectedTransfer = useMemo(() => {
    if (selectedTransferId) {
      return transferHistory.find((item) => String(item.id) === String(selectedTransferId)) || transferHistory[0] || null;
    }

    return transferHistory[0] || null;
  }, [selectedTransferId, transferHistory]);

  useEffect(() => {
    if (!selectedTransferId && transferHistory.length > 0) {
      setSelectedTransferId(transferHistory[0].id);
    }
  }, [selectedTransferId, transferHistory]);

  const buildReceiptHtml = (transfer, autoPrint = false) => {
    const amountFormatted = formatAmount(transfer.amount);
    const dateFormatted = new Date(transfer.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
    const recipientLabel = recipientTypes.find((item) => item.value === transfer.recipientType)?.label || transfer.recipientType || 'Tercero';
    const statusLabel = transfer.status === 'REVERTIDA' ? 'REVERTIDA' : transfer.status;

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Constancia de transferencia</title>
  <style>
    body { margin: 0; padding: 0; font-family: Inter, system-ui, sans-serif; background: #F3F6FB; color: #1F2937; }
    .wrapper { width: 100%; padding: 32px; box-sizing: border-box; }
    .card { max-width: 760px; margin: 0 auto; background: white; border-radius: 28px; overflow: hidden; box-shadow: 0 28px 80px rgba(15, 23, 42, 0.08); }
    .header { background: #183664; color: white; padding: 32px 32px 22px; }
    .header .title { margin: 0; font-size: 18px; letter-spacing: 0.3em; text-transform: uppercase; color: #C8D9FF; }
    .header .amount { margin: 16px 0 0; font-size: 40px; line-height: 1.1; font-weight: 700; }
    .header .ref { margin: 12px 0 0; font-size: 13px; color: #CBD5E1; }
    .section { padding: 28px 32px; }
    .row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
    .row span:first-child { color: #64748B; font-size: 13px; }
    .row span:last-child { color: #0F172A; font-weight: 600; text-align: right; }
    .badge { display: inline-flex; padding: 10px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 0.02em; }
    .approved { background: #D1FAE5; color: #065F46; }
    .reverted { background: #FEE2E2; color: #991B1B; }
    .note { margin: 24px 0 0; padding: 18px 20px; border-radius: 20px; background: #ECFDF5; color: #065F46; font-size: 14px; line-height: 1.6; }
    @media print {
      body { background: white; }
      .wrapper { padding: 0; }
      .card { box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <p class="title">Constancia de Transferencia</p>
        <p class="amount">${transfer.currency !== 'GTQ' && transfer.currency ? transfer.currency + ' ' : 'Q'}${amountFormatted}</p>
        <p class="ref">REF: ${transfer.reference}</p>
      </div>
      <div class="section">
        <div class="row"><span>Estado</span><span><span class="badge ${transfer.status === 'REVERTIDA' ? 'reverted' : 'approved'}">${statusLabel}</span></span></div>
        <div class="row"><span>Fecha</span><span>${dateFormatted}</span></div>
        <div class="row"><span>Cuenta origen</span><span>${transfer.sourceAccountNumber}</span></div>
        <div class="row"><span>Cuenta destino</span><span>${transfer.destinationAccountNumber}</span></div>
        <div class="row"><span>Tipo de destinatario</span><span>${recipientLabel}</span></div>
        <div class="row"><span>Descripción</span><span>${transfer.description || 'Sin descripción'}</span></div>
        <div class="note">Transferencia registrada correctamente. Conserva esta constancia para tu control interno.</div>
      </div>
      </div>
  </div>
  ${autoPrint ? '<script>window.onload = function() { window.print(); };</script>' : ''}
</body>
</html>`;
  };

  const openReceiptWindow = (transfer, autoPrint = false) => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');

    if (!printWindow) {
      showError('No se pudo abrir la ventana de impresión. Verifica que el navegador permita ventanas emergentes.');
      return;
    }

    printWindow.document.write(buildReceiptHtml(transfer, autoPrint));
    printWindow.document.close();
    printWindow.focus();
  };

  const generateReceiptPdf = (transfer) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let cursorY = 60;

    doc.setFillColor('#183664');
    doc.rect(0, 0, 595, 110, 'F');
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(14);
    doc.text('CONSTANCIA DE TRANSFERENCIA', margin, cursorY);

    cursorY += 30;
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.text(`${transfer.currency !== 'GTQ' && transfer.currency ? transfer.currency + ' ' : 'Q'}${formatAmount(transfer.amount)}`, margin, cursorY);

    cursorY += 28;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`REF: ${transfer.reference}`, margin, cursorY);

    cursorY += 40;
    doc.setDrawColor('#E2E8F0');
    doc.setLineWidth(1);
    doc.line(margin, cursorY, 555, cursorY);

    cursorY += 30;
    doc.setTextColor('#334155');
    doc.setFontSize(12);
    doc.text('Estado:', margin, cursorY);
    doc.text(transfer.status, 520, cursorY, { align: 'right' });

    cursorY += 26;
    doc.text('Fecha:', margin, cursorY);
    doc.text(new Date(transfer.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }), 520, cursorY, { align: 'right' });

    cursorY += 26;
    doc.text('Cuenta origen:', margin, cursorY);
    doc.text(transfer.sourceAccountNumber, 520, cursorY, { align: 'right' });

    cursorY += 26;
    doc.text('Cuenta destino:', margin, cursorY);
    doc.text(transfer.destinationAccountNumber, 520, cursorY, { align: 'right' });

    cursorY += 26;
    doc.text('Tipo destinatario:', margin, cursorY);
    doc.text(recipientTypes.find((item) => item.value === transfer.recipientType)?.label || transfer.recipientType, 520, cursorY, { align: 'right' });

    cursorY += 26;
    doc.text('Descripción:', margin, cursorY);
    doc.text(transfer.description || 'Sin descripción', 520, cursorY, { align: 'right' });

    cursorY += 40;
    doc.setFontSize(10);
    doc.setTextColor('#065F46');
    doc.setFillColor('#ECFDF5');
    doc.rect(margin, cursorY - 16, 515, 48, 'F');
    doc.text('Transferencia registrada correctamente. Conserva este PDF como comprobante.', margin + 8, cursorY, { maxWidth: 500 });

    return doc;
  };

  const buildTransferPayload = () => {
    const normalizedAmount = Number(amount);

    if (!sourceAccountNumber || !destinationAccountNumber) {
      showError('Selecciona la cuenta origen y la cuenta destino.');
      return null;
    }

    if (sourceAccountNumber === destinationAccountNumber) {
      showError('La cuenta origen y la cuenta destino no pueden ser iguales.');
      return null;
    }

    if (!normalizedAmount || normalizedAmount <= 0) {
      showError('Ingresa un monto válido.');
      return null;
    }

    const actualCurrency = isManualCurrency ? customCurrency.toUpperCase() : currency;

    if (actualCurrency === 'GTQ' && normalizedAmount > DAILY_TRANSFER_LIMIT) {
      showError('El límite permitido por transferencia es Q2,000.00.');
      return null;
    }

    if (normalizedAmount > availableBalance) {
      showError('No tienes saldo suficiente para esta transferencia.');
      return null;
    }

    return {
      sourceAccountNumber,
      destinationAccountNumber,
      recipientType,
      amount: normalizedAmount,
      currency: isManualCurrency ? customCurrency.toUpperCase() : currency,
      description: description.trim() || 'Transferencia de prueba',
      ...(couponId.trim() ? { couponId: couponId.trim() } : {})
    };
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    (async () => {
      const payload = buildTransferPayload();
      if (!payload) return;

      // Si la moneda no es GTQ, consultar tasa al backend para validar el límite Q2,000
      const actualCurrency = payload.currency || 'GTQ';
      let amountInGTQ = Number(payload.amount || 0);

      if (actualCurrency !== 'GTQ') {
        const srcAccount = sourceAccount;
        const rate = await clientAccountService.getExchangeRate(actualCurrency, srcAccount?.id);
        if (rate && Number(rate) > 0) {
          // Según backend: rate = TARGET per GTQ -> para convertir TARGET -> GTQ hacemos amount / rate
          amountInGTQ = Number(payload.amount) / Number(rate);
        } else {
          // fallback: usar estimado cliente (convertToGTQ) si no hay rate
          amountInGTQ = convertToGTQ(Number(payload.amount), actualCurrency);
        }
      }

      if (amountInGTQ > DAILY_TRANSFER_LIMIT) {
        showError(`El límite permitido por transferencia es Q${DAILY_TRANSFER_LIMIT.toLocaleString('es-GT', {minimumFractionDigits:2})}. Equivalente ingresado: Q${amountInGTQ.toLocaleString('es-GT', {minimumFractionDigits:2})}.`);
        return;
      }

      setPendingTransfer(payload);
      setCurrentStep(2);
    })();
  };

  const handleConfirmTransfer = async () => {
    if (!pendingTransfer) {
      showError('No hay datos de transferencia para confirmar.');
      setCurrentStep(1);
      return;
    }

    setTransferLoading(true);

    try {
      const response = await clientTransferService.createTransfer(pendingTransfer);
      const transferData = response?.data || response || {};
      const savedTransfer = normalizeTransfer(transferData, {
        ...pendingTransfer,
        status: transferData.status || 'COMPLETADA',
        balanceAfter: transferData.balanceAfter ?? transferData.newBalance ?? null,
      });

      await Promise.all([
        fetchAllAccounts(),
        fetchRecentTransactions(10),
      ]);

      setRecentTransfers((prev) => [savedTransfer, ...prev].slice(0, 8));
      setSelectedTransferId(savedTransfer.id);
      showSuccess('Transferencia procesada correctamente.');
      setAmount('');
      setDescription('');
      setCouponId('');
      setDestinationAccountNumber('');
      setRecipientType('TERCERO');
      setPendingTransfer(null);
      setCurrentStep(3);
    } catch (submitError) {
      const message = submitError.response?.data?.message || 'No se pudo completar la transferencia.';
      showError(message);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDownload = () => {
    if (!selectedTransfer) return;
    const doc = generateReceiptPdf(selectedTransfer);
    doc.save(`constancia-transferencia-${selectedTransfer.reference || selectedTransfer.id}.pdf`);
  };

  const handlePrint = () => {
    if (!selectedTransfer) return;
    openReceiptWindow(selectedTransfer, false);
  };

  const canReverseTransfer = (transfer) => {
    if (!transfer || !latestReversibleTransaction || transfer.status === 'REVERTIDA') return false;
    return String(transfer.id) === String(latestReversibleTransaction.id)
      || String(transfer.reference) === String(latestReversibleTransaction.reference);
  };

  const isWithinRevertWindow = (transfer, windowMs = 60000) => {
    if (!transfer) return false;
    const created = new Date(transfer.date || transfer.createdAt || transfer.raw?.createdAt || 0).getTime();
    if (!created) return false;
    return (Date.now() - created) <= windowMs;
  };

  const [showRevertModal, setShowRevertModal] = useState(false);
  const [revertTarget, setRevertTarget] = useState(null);

  const openRevertModal = (transfer) => {
    setRevertTarget(transfer);
    setShowRevertModal(true);
  };

  const handleConfirmRevert = (reason) => {
    const transfer = revertTarget;
    setShowRevertModal(false);
    setRevertTarget(null);
    if (!transfer) return;
    if (!reason || !reason.trim()) {
      showError('Debes escribir un motivo para enviar la reversión.');
      return;
    }

    try {
      addReversalRequest({
        type: 'TRANSFERENCIA',
        operationId: transfer.id,
        reference: transfer.reference,
        amount: transfer.amount,
        sourceAccountNumber: transfer.sourceAccountNumber,
        destinationAccountNumber: transfer.destinationAccountNumber,
        operationDate: transfer.date,
        operationDescription: transfer.description,
        reason,
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name || user?.username || null,
      });

      showSuccess('Solicitud de reversión enviada al administrador.');
      navigate('/clientdashboard/reversions');
    } catch (requestError) {
      showError(requestError?.message || 'No fue posible solicitar la reversión.');
    }
  };

  const currentSelectedCurrency = isManualCurrency ? customCurrency.toUpperCase() : currency;

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#C8A84B]">Transferencias</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1A2E52]">Entre mis cuentas</h1>
          <p className="text-gray-500 mt-2 max-w-2xl">Permite transferencias con validación de saldo, límite de Q2,000 y constancia final en la misma vista.</p>
        </div>

        <div className="glass-panel rounded-2xl px-4 py-3 inline-flex items-center gap-3 self-start">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-semibold text-gray-700">Ruta protegida</span>
        </div>
      </div>

      <section className="glass-panel rounded-3xl p-5 lg:p-6 border border-white/60 shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9AA7C1]">Progreso de la operación</p>
            <h2 className="text-xl font-bold text-[#1A2E52] mt-1">Formulario, confirmación y constancia</h2>
          </div>
          <span className="inline-flex items-center rounded-full border border-[#C8A84B] bg-[#FFF7DF] px-4 py-1.5 text-sm font-semibold text-[#8B6A1A]">Paso {currentStep} de 3</span>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Ingresar datos', subtitle: 'Cuentas y monto' },
            { step: '2', title: 'Confirmar', subtitle: 'Revisar operación' },
            { step: '✓', title: 'Constancia', subtitle: 'Transferencia lista' },
          ].map((item, index) => (
            <div
              key={item.title}
              className={`rounded-2xl border px-4 py-4 flex items-center gap-4 ${currentStep === index + 1 ? 'bg-[#EFF4FF] border-[#D9E6FF]' : 'bg-white border-[#E5E7EB]'}`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${currentStep === index + 1 ? 'bg-[#2D5899] text-white' : currentStep > index + 1 ? 'bg-[#DFF7EA] text-[#0F7A45]' : 'bg-[#EEF2F7] text-[#9AA7C1]'}`}
              >
                {currentStep > index + 1 ? '✓' : item.step}
              </div>
              <div>
                <p className="font-bold text-[#1A2E52]">{item.title}</p>
                <p className="text-sm text-[#94A3B8]">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 glass-panel rounded-3xl overflow-hidden shadow-lg border border-white/60">
          <div className="bg-[#183664] px-6 py-5 flex items-center justify-between gap-3 text-white">
            <div>
              <h2 className="text-2xl font-bold">Datos de la transferencia</h2>
              <p className="text-[#C8D9FF] text-sm mt-1">Formulario según el contrato del backend.</p>
            </div>
            <span className="rounded-full border border-[#C8A84B] bg-[#FFF7DF] px-4 py-1.5 text-sm font-semibold text-[#8B6A1A]">Máximo Q2,000</span>
          </div>

          <div className="p-6 lg:p-7 bg-white">
            {currentStep === 1 && (
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Cuenta origen</label>
                  <select
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#1A2E52] focus:border-[#2D5899] focus:outline-none"
                    value={sourceAccountNumber}
                    onChange={(e) => setSourceAccountNumber(e.target.value)}
                  >
                    <option value="">Selecciona cuenta origen</option>
                    {accounts.map((account) => (
                      <option key={account.id || account.accountNumber} value={account.accountNumber}>
                        {account.accountNumber} — {getAccountTypeLabel(account)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Cuenta destino</label>
                  {recipientType === 'PROPIA' ? (
                    <select
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#1A2E52] focus:border-[#2D5899] focus:outline-none"
                      value={destinationAccountNumber}
                      onChange={(e) => setDestinationAccountNumber(e.target.value)}
                    >
                      <option value="">Selecciona cuenta destino</option>
                      {accounts.map((account) => (
                        <option key={account.id || account.accountNumber} value={account.accountNumber}>
                          {account.accountNumber} — {getAccountTypeLabel(account)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#1A2E52] focus:border-[#2D5899] focus:outline-none"
                      placeholder="Ej: 001-9999999999-9"
                      value={destinationAccountNumber}
                      onChange={(e) => setDestinationAccountNumber(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Tipo de destinatario</label>
                  <select
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#1A2E52] focus:border-[#2D5899] focus:outline-none"
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                  >
                    {recipientTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A2E52] mb-2">
                    Monto a transferir y Moneda
                    <button
                      type="button"
                      onClick={() => setIsManualCurrency(!isManualCurrency)}
                      className="ml-2 text-xs text-[#2D5899] underline hover:text-[#1A2E52]"
                    >
                      {isManualCurrency ? '(Seleccionar de la lista)' : '(Otra divisa manual)'}
                    </button>
                  </label>
                  <div className="flex gap-2">
                    {isManualCurrency ? (
                      <input
                        type="text"
                        maxLength="3"
                        value={customCurrency}
                        onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                        placeholder="Ej. CLP"
                        className="w-[100px] rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#1A2E52] focus:border-[#2D5899] focus:outline-none uppercase"
                      />
                    ) : (
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-[100px] rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#1A2E52] focus:border-[#2D5899] focus:outline-none"
                      >
                        <option value="GTQ">GTQ</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="MXN">MXN</option>
                        <option value="JPY">JPY</option>
                      </select>
                    )}
                    <input
                      type="number"
                      min="1"
                      max={currentSelectedCurrency === 'GTQ' ? DAILY_TRANSFER_LIMIT : undefined}
                      step="0.01"
                      className="flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#1A2E52] focus:border-[#2D5899] focus:outline-none"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Referencia / descripción</label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#1A2E52] focus:border-[#2D5899] focus:outline-none"
                    placeholder="Ej: Pago de prueba"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {recipientType === 'TERCERO' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Código de cupón (Opcional)</label>
                    <input
                      type="text"
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[#1A2E52] focus:border-[#2D5899] focus:outline-none"
                      placeholder="Ej: cat_123..."
                      value={couponId}
                      onChange={(e) => setCouponId(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#D9E6FF] bg-[#F8FBFF] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Saldo disponible</p>
                  <p className="mt-2 text-2xl font-bold text-[#1A2E52]">Q {formatAmount(availableBalance)}</p>
                  <p className="mt-1 text-sm text-gray-500">Se valida antes de enviar la transferencia.</p>
                </div>
                <div className="rounded-2xl border border-[#F5E4B6] bg-[#FFFDF5] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B0892F]">Límite diario</p>
                  <p className="mt-2 text-2xl font-bold text-[#8B6A1A]">Q {formatAmount(DAILY_TRANSFER_LIMIT)}</p>
                  <p className="mt-1 text-sm text-gray-500">Tope por transferencia y por par origen-destino.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={transferLoading || loading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#2D5899] to-[#1A2E52] px-5 py-4 text-white font-semibold shadow-lg transition hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Continuar a confirmación
              </button>
              </form>
            )}

            {currentStep === 2 && pendingTransfer && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#D9E6FF] bg-[#F8FBFF] p-5">
                  <h3 className="text-lg font-bold text-[#1A2E52]">Confirmar transferencia</h3>
                  <p className="mt-1 text-sm text-gray-500">Verifica estos datos antes de enviarla al backend.</p>
                </div>

                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-3 border-b border-gray-100 pb-3"><span className="font-semibold text-[#1A2E52]">Cuenta origen</span><span>{pendingTransfer.sourceAccountNumber}</span></div>
                  <div className="flex justify-between gap-3 border-b border-gray-100 pb-3"><span className="font-semibold text-[#1A2E52]">Cuenta destino</span><span>{pendingTransfer.destinationAccountNumber}</span></div>
                  <div className="flex justify-between gap-3 border-b border-gray-100 pb-3"><span className="font-semibold text-[#1A2E52]">Tipo destinatario</span><span>{recipientTypes.find((item) => item.value === pendingTransfer.recipientType)?.label || pendingTransfer.recipientType}</span></div>
                  <div className="flex justify-between gap-3 border-b border-gray-100 pb-3"><span className="font-semibold text-[#1A2E52]">Monto</span><span className="font-bold">{pendingTransfer.currency !== 'GTQ' ? `${pendingTransfer.currency} ` : 'Q '}{formatAmount(pendingTransfer.amount)}</span></div>
                  {pendingTransfer.couponId && (
                    <div className="flex justify-between gap-3 border-b border-gray-100 pb-3"><span className="font-semibold text-[#1A2E52]">Cupón Promocional</span><span className="text-[#C8A84B] font-bold">{pendingTransfer.couponId}</span></div>
                  )}
                  <div className="flex justify-between gap-3"><span className="font-semibold text-[#1A2E52]">Descripción</span><span className="text-right">{pendingTransfer.description || 'Sin descripción'}</span></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="rounded-2xl border border-[#1D4ED8] px-4 py-3 font-semibold text-[#1D4ED8] transition hover:bg-[#1D4ED8] hover:text-white"
                  >
                    Volver y editar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmTransfer}
                    disabled={transferLoading || loading}
                    className="rounded-2xl bg-gradient-to-r from-[#2D5899] to-[#1A2E52] px-4 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {transferLoading ? 'Procesando transferencia...' : 'Confirmar y transferir'}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-[#BEE5CD] bg-[#F2FCF5] p-5">
                  <h3 className="text-lg font-bold text-[#0F7A45]">Transferencia completada</h3>
                  <p className="mt-1 text-sm text-[#246B47]">La constancia quedó disponible en el panel derecho para descargar o imprimir.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full rounded-2xl border border-[#1D4ED8] px-4 py-3 font-semibold text-[#1D4ED8] transition hover:bg-[#1D4ED8] hover:text-white"
                >
                  Realizar otra transferencia
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-6 self-start">
          <section className="rounded-3xl bg-gradient-to-br from-[#1A2E52] via-[#2D5899] to-[#4B6697] p-6 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-28 h-28 rounded-full bg-white/10 blur-2xl"></div>
            <div className="relative z-10">
              <p className="text-[#E8D8A0] text-sm font-semibold uppercase tracking-[0.24em]">Mi cuenta seleccionada</p>
              <h3 className="mt-3 text-4xl font-bold">Q {formatAmount(availableBalance)}</h3>
              <p className="mt-2 text-white/70 text-sm">{sourceAccount ? getAccountTypeLabel(sourceAccount) : 'Cuenta principal'}</p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-white/60">Origen</p>
                  <p className="font-semibold">{sourceAccountNumber || 'Sin seleccionar'}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-white/60">Destino</p>
                  <p className="font-semibold">{destinationAccountNumber || 'Sin seleccionar'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-3xl p-5 shadow-lg border border-white/60">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1A2E52]">Constancia</h2>
                <p className="text-sm text-gray-500">Resultado de la última transferencia.</p>
              </div>
              {selectedTransfer && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedTransfer.status === 'REVERTIDA' ? 'bg-red-100 text-red-700' : 'bg-[#E8F2FF] text-[#1B4A8F]'}`}>
                  {selectedTransfer.status}
                </span>
              )}
            </div>

            {selectedTransfer ? (
              <div className="rounded-3xl overflow-hidden border border-[#E5E7EB] bg-white">
                <div className="bg-[#183664] px-5 py-4 text-white">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#C8D9FF]">Constancia de transferencia</p>
                  <p className="text-2xl font-bold mt-2">{selectedTransfer.currency !== 'GTQ' && selectedTransfer.currency ? selectedTransfer.currency + ' ' : 'Q '}{formatAmount(selectedTransfer.amount)}</p>
                  <p className="text-xs text-[#C8D9FF] mt-1">REF: {selectedTransfer.reference}</p>
                </div>
                <div className="p-5 space-y-3 text-sm text-[#1F2937]">
                  <div className="flex justify-between gap-3 border-b border-gray-100 pb-3"><span className="font-semibold">Fecha</span><span>{new Date(selectedTransfer.date).toLocaleString('es-ES')}</span></div>
                  <div className="flex justify-between gap-3 border-b border-gray-100 pb-3"><span className="font-semibold">Origen</span><span>{selectedTransfer.sourceAccountNumber}</span></div>
                  <div className="flex justify-between gap-3 border-b border-gray-100 pb-3"><span className="font-semibold">Destino</span><span>{selectedTransfer.destinationAccountNumber}</span></div>
                  <div className="flex justify-between gap-3 border-b border-gray-100 pb-3"><span className="font-semibold">Tipo</span><span>{recipientTypes.find((item) => item.value === selectedTransfer.recipientType)?.label || selectedTransfer.recipientType}</span></div>
                  <div className="flex justify-between gap-3"><span className="font-semibold">Descripción</span><span className="text-right">{selectedTransfer.description || 'Sin descripción'}</span></div>
                </div>
                <div className="p-5 pt-0 grid gap-3">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-2xl bg-[#1D4ED8] px-4 py-3 font-semibold text-white transition hover:shadow-lg"
                  >
                    Descargar PDF
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="rounded-2xl border border-[#1D4ED8] px-4 py-3 font-semibold text-[#1D4ED8] transition hover:bg-[#1D4ED8] hover:text-white"
                  >
                    Imprimir
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                Aún no has generado una transferencia.
              </div>
            )}
          </section>

          <section className="glass-panel rounded-3xl p-5 shadow-lg border border-white/60">
            <h2 className="text-xl font-bold text-[#1A2E52] mb-4">Últimas transferencias</h2>
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {transferHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-5 text-center text-gray-500">
                  No hay transferencias registradas.
                </div>
              ) : (
                transferHistory.map((item) => {
                  const isActive = selectedTransfer?.id === item.id;

                  return (
                    <div
                      key={`${item.id}-${item.reference}`}
                      className={`w-full rounded-2xl border p-4 text-left transition ${isActive ? 'border-[#2D5899] bg-[#EFF4FF]' : 'border-gray-200 bg-white hover:border-[#2D5899]/50'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-[#1A2E52]">Q {formatAmount(item.amount)}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.sourceAccountNumber} → {item.destinationAccountNumber}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${item.status === 'REVERTIDA' ? 'bg-red-100 text-red-700' : 'bg-[#E8F2FF] text-[#1B4A8F]'}`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTransferId(item.id)}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${isActive ? 'bg-[#2D5899] text-white' : 'bg-white border border-[#2D5899] text-[#2D5899] hover:bg-[#2D5899] hover:text-white'}`}
                        >
                          Ver
                        </button>
                        {canReverseTransfer(item) && (
                          <button
                            type="button"
                            onClick={() => openRevertModal(item)}
                            disabled={!isWithinRevertWindow(item)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold border ${isWithinRevertWindow(item) ? 'border-[#B45309] text-[#B45309] bg-white hover:bg-[#B45309] hover:text-white' : 'border-gray-200 text-gray-400 bg-white cursor-not-allowed' } transition`}
                          >
                            Revertir
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </aside>
      </div>

      {showRevertModal && (
        <RevertModal
          open={showRevertModal}
          onClose={() => {
            setShowRevertModal(false);
            setRevertTarget(null);
          }}
          onConfirm={handleConfirmRevert}
          title={`Revertir transferencia ${revertTarget?.reference || revertTarget?.id || ''}`}
          createdAt={revertTarget?.date || revertTarget?.createdAt || revertTarget?.raw?.createdAt}
        />
      )}
    </div>
  );
};
 
export default Transfers;