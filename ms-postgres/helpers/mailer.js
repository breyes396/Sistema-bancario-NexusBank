import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../configs/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = Number(process.env.SMTP_PORT);
const smtpUser = process.env.SMTP_USERNAME?.trim();
const smtpPassword = process.env.SMTP_PASSWORD?.trim();

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number.isNaN(smtpPort) ? 0 : smtpPort,
    secure: process.env.SMTP_ENABLE_SSL === 'true',
    tls: {
        rejectUnauthorized: false
    },
    auth: {
        user: smtpUser,
        pass: smtpPassword
    }
});

const assertSmtpConfig = () => {
    if (!smtpHost || Number.isNaN(smtpPort) || !smtpUser || !smtpPassword) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Configuracion SMTP incompleta: revisa SMTP_HOST, SMTP_PORT, SMTP_USERNAME y SMTP_PASSWORD');
        }
        console.warn('SMTP incompleto — usando modo de desarrollo: los correos se registrarán en consola.');
    }
};

let verifiedAtLeastOnce = false;

const ensureTransportReady = async () => {
    try {
        assertSmtpConfig();
        if (!verifiedAtLeastOnce) {
            await transporter.verify();
            verifiedAtLeastOnce = true;
        }
    } catch (err) {
        if (process.env.NODE_ENV === 'production') throw err;
    }
};

export async function sendActivationEmail(to, subject, html, attachments = []) {
    await ensureTransportReady();

    if (!smtpHost || Number.isNaN(smtpPort) || !smtpUser || !smtpPassword) {
        console.info('=== EMAIL (dev) ===');
        console.info('To:', to);
        console.info('Subject:', subject);
        console.info('Html:', html);
        console.info('===================');
        return Promise.resolve({ logged: true });
    }

    return transporter.sendMail({
        from: process.env.EMAIL_FROM || smtpUser,
        to,
        subject,
        html,
        attachments
    });
}

export async function sendVerificationEmail(to, name, token) {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const html = `
        <p>Hola ${name || 'cliente'},</p>
        <p>Para activar tu cuenta en NexusBank, verifica tu email:</p>
        <p><a href="${verificationUrl}">Verificar cuenta</a></p>
        <p><strong>Token de verificación:</strong></p>
        <p style="background: #f4f4f4; padding: 10px; font-family: monospace;">${token}</p>
        <p>Si no solicitaste este registro, puedes ignorar este mensaje.</p>
    `;

    return sendActivationEmail(
        to,
        'NexusBank - Verifica tu email',
        html
    );
}

export async function sendPasswordResetEmail(to, token) {
    const resetUrl = `${config.frontendUrl}/#/reset-password?token=${encodeURIComponent(token)}`;
    const logoPath = path.resolve(__dirname, '../../Bancario-NexusBank/src/assets/img/Logo.jpg');
    const logoCid = 'nexusbank-logo';
    const hasLogo = fs.existsSync(logoPath);
    const html = `
        <div style="background:#f3f6fb;padding:30px;font-family:Arial,Helvetica,sans-serif;color:#14203b;">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e6eef7;">
                <div style="padding:24px 28px;background:linear-gradient(90deg,#13325a,#234a7a);color:#fff;display:flex;align-items:center;gap:12px;">
                    ${hasLogo ? `<img src="cid:${logoCid}" alt="NexusBank" style="width:48px;height:48px;object-fit:contain;border-radius:6px;background:#fff;padding:4px;" />` : ''}
                    <div style="font-size:18px;font-weight:700;">NexusBank</div>
                </div>
                <div style="padding:28px;">
                    <h2 style="margin:0 0 12px 0;color:#0f2b4a;font-size:20px;">Restablecer contraseña</h2>
                    <p style="margin:0 0 16px 0;color:#394b63;line-height:1.5;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Pulsa el botón de abajo para elegir una nueva contraseña.</p>

                    <div style="text-align:center;margin:22px 0;">
                        <a href="${resetUrl}" style="background:#2D5899;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Restablecer contraseña</a>
                    </div>

                    <p style="margin:0 0 8px 0;color:#394b63;font-size:14px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                    <p style="word-break:break-all;font-size:13px;color:#2a4b6e;margin:0 0 18px 0;">${resetUrl}</p>

                    <p style="margin:0 0 8px 0;color:#394b63;font-size:14px;"><strong>Token de reseteo:</strong></p>
                    <div style="background:#f4f4f4;padding:12px;border-radius:6px;font-family:monospace;color:#102033;margin-bottom:16px;">${token}</div>

                    <p style="margin:0;color:#6b7785;font-size:13px;">Este token expira en 60 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
                </div>
                <div style="padding:14px 20px;background:#fbfdff;border-top:1px solid #eef6fb;color:#6b7785;font-size:13px;">
                    <div>Si necesitas ayuda, contáctanos en <a href="mailto:support@nexusbank.local" style="color:#2D5899;text-decoration:underline;">support@nexusbank.local</a></div>
                </div>
            </div>
        </div>
        `;

    const attachments = hasLogo
        ? [{ filename: 'Logo.jpg', path: logoPath, cid: logoCid }]
        : [];

    return sendActivationEmail(
        to,
        'NexusBank - Restablecer contraseña',
        html,
        attachments
    );
}
