import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { PALETTE } from '../constants/colors';

// Genera un PDF de comprobante (marino + dorado, igual que el resto de la app)
// y abre el panel nativo de "Compartir" de Android para guardarlo/enviarlo.
// Usar Compartir en vez de forzar una descarga evita depender de tener
// instalada una app específica de PDF en el teléfono.
export const downloadReceiptPdf = async ({ title, subtitle, rows }) => {
    const rowsHtml = rows
        .map(
            (row) => `
                <tr>
                    <td class="label">${row.label}</td>
                    <td class="value">${row.value}</td>
                </tr>
            `
        )
        .join('');

    const html = `
        <html>
            <head>
                <meta charset="utf-8" />
                <style>
                    body {
                        font-family: -apple-system, Helvetica, Arial, sans-serif;
                        padding: 32px;
                        color: ${PALETTE.navy900};
                    }
                    .header { text-align: center; margin-bottom: 24px; }
                    .brand {
                        font-size: 22px;
                        font-weight: bold;
                        color: ${PALETTE.navy700};
                        letter-spacing: 1px;
                    }
                    .accent-line {
                        height: 3px;
                        width: 64px;
                        background: ${PALETTE.gold500};
                        margin: 8px auto 0;
                        border-radius: 2px;
                    }
                    h1 { font-size: 16px; text-align: center; color: ${PALETTE.navy900}; margin-bottom: 4px; }
                    .subtitle { text-align: center; font-size: 12px; color: #666666; margin-bottom: 24px; }
                    table { width: 100%; border-collapse: collapse; }
                    td { padding: 10px 4px; border-bottom: 1px solid #e2e6ea; font-size: 13px; }
                    .label { color: #666666; }
                    .value { text-align: right; font-weight: 600; color: ${PALETTE.navy900}; }
                    .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #999999; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="brand">NexusBank</div>
                    <div class="accent-line"></div>
                </div>
                <h1>${title}</h1>
                ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
                <table>${rowsHtml}</table>
                <div class="footer">Generado desde la app NexusBank · ${new Date().toLocaleString('es-GT')}</div>
            </body>
        </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: title,
        });
    }

    return uri;
};
