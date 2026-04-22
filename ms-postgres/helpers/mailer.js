import nodemailer from 'nodemailer';
import config from '../configs/config.js';

const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = Number(process.env.SMTP_PORT);
const smtpUser = process.env.SMTP_USERNAME?.trim();
const smtpPassword = process.env.SMTP_PASSWORD?.trim();

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number.isNaN(smtpPort) ? 0 : smtpPort,
    secure: process.env.SMTP_ENABLE_SSL === 'true',
    auth: {
        user: smtpUser,
        pass: smtpPassword
    }
});

const assertSmtpConfig = () => {
    if (!smtpHost || Number.isNaN(smtpPort) || !smtpUser || !smtpPassword) {
        throw new Error('Configuracion SMTP incompleta: revisa SMTP_HOST, SMTP_PORT, SMTP_USERNAME y SMTP_PASSWORD');
    }
};

let verifiedAtLeastOnce = false;

const ensureTransportReady = async () => {
    assertSmtpConfig();
    if (!verifiedAtLeastOnce) {
        await transporter.verify();
        verifiedAtLeastOnce = true;
    }
};

export async function sendActivationEmail(to, subject, html) {
    await ensureTransportReady();

    return transporter.sendMail({
        from: process.env.EMAIL_FROM || smtpUser,
        to,
        subject,
        html
    });
}

export async function sendVerificationEmail(to, name, token) {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
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
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
    const html = `
        <p>Recibimos una solicitud para restablecer tu password.</p>
        <p>Si no fuiste tu, ignora este mensaje.</p>
        <p><a href="${resetUrl}">Restablecer password</a></p>
        <p><strong>Token de reseteo:</strong></p>
        <p style="background: #f4f4f4; padding: 10px; font-family: monospace;">${token}</p>
        <p>Este token expira en 60 minutos.</p>
    `;

    return sendActivationEmail(
        to,
        'NexusBank - Restablecer password',
        html
    );
}
