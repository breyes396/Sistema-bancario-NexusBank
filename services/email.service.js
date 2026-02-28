import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    },
    logger: true,
    debug: true
});

console.log('✓ Configuración SMTP:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    user: process.env.SMTP_USERNAME
});

export const sendEmail = async (to, subject, html) => {
    try {
        console.log('→ Intentando enviar email a:', to);
        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html
        });
        console.log('✓ Email enviado exitosamente:', { messageId: info.messageId, to, subject });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('✗ Error al enviar email:', {
            to,
            subject,
            error: error.message,
            code: error.code,
            stack: error.stack
        });
        return { success: false, error: error.message };
    }
};

export const sendVerificationEmail = async (email, name, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏦 Bienvenido a NexusBank</h1>
                </div>
                <div class="content">
                    <h2>Hola ${name},</h2>
                    <p>Gracias por registrarte en NexusBank. Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el botón de abajo:</p>
                    <center>
                        <a href="${verificationUrl}" class="button">Verificar Email</a>
                    </center>
                    <p>O copia y pega este enlace en tu navegador:</p>
                    <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                    <p><strong>Este enlace expirará en ${process.env.VERIFICATION_EMAIL_EXPIRY_HOURS} horas.</strong></p>
                    <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} NexusBank. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(email, 'Verifica tu cuenta de NexusBank', html);
};

export const sendWelcomeEmail = async (email, name, accountNumber) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .account-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 ¡Cuenta Activada!</h1>
                </div>
                <div class="content">
                    <h2>¡Felicidades ${name}!</h2>
                    <p>Tu cuenta de NexusBank ha sido activada exitosamente. Ya puedes acceder a todos nuestros servicios bancarios.</p>
                    <div class="account-box">
                        <h3>📋 Tu Número de Cuenta:</h3>
                        <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 10px 0;">${accountNumber}</p>
                    </div>
                    <h3>¿Qué puedes hacer ahora?</h3>
                    <ul>
                        <li>✓ Realizar transferencias</li>
                        <li>✓ Consultar tu saldo</li>
                        <li>✓ Ver historial de transacciones</li>
                        <li>✓ Comprar productos y servicios</li>
                    </ul>
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} NexusBank. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(email, '¡Bienvenido a NexusBank! Tu cuenta está activa', html);
};

export const sendPasswordResetEmail = async (email, name, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔒 Recuperación de Contraseña</h1>
                </div>
                <div class="content">
                    <h2>Hola ${name},</h2>
                    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de NexusBank.</p>
                    <center>
                        <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                    </center>
                    <p>O copia y pega este enlace en tu navegador:</p>
                    <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
                    <div class="warning">
                        <strong>⚠️ Importante:</strong>
                        <ul>
                            <li>Este enlace expirará en ${process.env.PASSWORD_RESET_EXPIRY_HOURS} hora(s)</li>
                            <li>Si no solicitaste este cambio, ignora este correo</li>
                            <li>Tu contraseña actual permanecerá sin cambios</li>
                        </ul>
                    </div>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} NexusBank. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(email, 'Restablece tu contraseña de NexusBank', html);
};

export const sendPasswordChangedEmail = async (email, name) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Contraseña Actualizada</h1>
                </div>
                <div class="content">
                    <h2>Hola ${name},</h2>
                    <p>Tu contraseña de NexusBank ha sido cambiada exitosamente.</p>
                    <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-ES')}</p>
                    <p>Si no realizaste este cambio, contacta inmediatamente con soporte.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} NexusBank. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(email, 'Tu contraseña ha sido actualizada', html);
};

export const sendAccountCreatedEmail = async (email, name, accountData = {}) => {
    const { accountNumber, accountType, accountBalance = 0 } = accountData;
    const html = `
        <p>Hola ${name || 'cliente'},</p>
        <p>Se creó una cuenta en NexusBank.</p>
        <ul>
            <li><strong>Número:</strong> ${accountNumber || 'N/A'}</li>
            <li><strong>Tipo:</strong> ${accountType || 'N/A'}</li>
            <li><strong>Saldo inicial:</strong> Q${Number(accountBalance || 0).toFixed(2)}</li>
        </ul>
        <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
    `;

    return await sendEmail(email, 'NexusBank - Cuenta creada', html);
};

export const sendAccountRejectedEmail = async (email, name, reason) => {
    const html = `
        <p>Hola ${name || 'cliente'},</p>
        <p>Tu solicitud/transacción fue rechazada.</p>
        <p><strong>Motivo:</strong> ${reason || 'No especificado'}</p>
        <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
    `;

    return await sendEmail(email, 'NexusBank - Solicitud rechazada', html);
};

export const sendDepositAlertEmail = async (email, name, depositData = {}) => {
    const { accountNumber, amount, newBalance } = depositData;
    const html = `
        <p>Hola ${name || 'cliente'},</p>
        <p>Se acreditó un depósito en tu cuenta.</p>
        <ul>
            <li><strong>Cuenta:</strong> ${accountNumber || 'N/A'}</li>
            <li><strong>Monto:</strong> Q${Number(amount || 0).toFixed(2)}</li>
            <li><strong>Nuevo saldo:</strong> Q${Number(newBalance || 0).toFixed(2)}</li>
        </ul>
        <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
    `;

    return await sendEmail(email, 'NexusBank - Depósito aplicado', html);
};

export const sendTransferSentEmail = async (email, name, transferData = {}) => {
    const { fromAccountNumber, toAccountNumber, amount, newBalance } = transferData;
    const html = `
        <p>Hola ${name || 'cliente'},</p>
        <p>Se realizó una transferencia desde tu cuenta.</p>
        <ul>
            <li><strong>Cuenta origen:</strong> ${fromAccountNumber || 'N/A'}</li>
            <li><strong>Cuenta destino:</strong> ${toAccountNumber || 'N/A'}</li>
            <li><strong>Monto:</strong> Q${Number(amount || 0).toFixed(2)}</li>
            <li><strong>Nuevo saldo:</strong> Q${Number(newBalance || 0).toFixed(2)}</li>
        </ul>
        <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
    `;

    return await sendEmail(email, 'NexusBank - Transferencia enviada', html);
};

export const sendTransferReceivedEmail = async (email, name, transferData = {}) => {
    const { fromAccountNumber, toAccountNumber, amount, newBalance } = transferData;
    const html = `
        <p>Hola ${name || 'cliente'},</p>
        <p>Recibiste una transferencia en tu cuenta.</p>
        <ul>
            <li><strong>Cuenta origen:</strong> ${fromAccountNumber || 'N/A'}</li>
            <li><strong>Cuenta destino:</strong> ${toAccountNumber || 'N/A'}</li>
            <li><strong>Monto:</strong> Q${Number(amount || 0).toFixed(2)}</li>
            <li><strong>Nuevo saldo:</strong> Q${Number(newBalance || 0).toFixed(2)}</li>
        </ul>
        <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
    `;

    return await sendEmail(email, 'NexusBank - Transferencia recibida', html);
};

export const sendDepositRevertedEmail = async (email, name, revertData = {}) => {
    const { accountNumber, amount, reason, newBalance } = revertData;
    const html = `
        <p>Hola ${name || 'cliente'},</p>
        <p>Se revirtió un depósito en tu cuenta.</p>
        <ul>
            <li><strong>Cuenta:</strong> ${accountNumber || 'N/A'}</li>
            <li><strong>Monto revertido:</strong> Q${Number(amount || 0).toFixed(2)}</li>
            <li><strong>Nuevo saldo:</strong> Q${Number(newBalance || 0).toFixed(2)}</li>
            <li><strong>Motivo:</strong> ${reason || 'No especificado'}</li>
        </ul>
        <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
    `;

    return await sendEmail(email, 'NexusBank - Reversión de depósito', html);
};

export const sendSecurityChangeEmail = async (email, name, changeData = {}) => {
    const { accountNumber, changeType, changes = {}, reason } = changeData;
    const lines = [];

    if (changes.perTransactionLimit !== undefined) {
        lines.push(`<li><strong>Límite por operación:</strong> ${changes.perTransactionLimit === null ? 'Sin límite' : 'Q' + Number(changes.perTransactionLimit).toFixed(2)}</li>`);
    }
    if (changes.dailyTransactionLimit !== undefined) {
        lines.push(`<li><strong>Límite diario:</strong> ${changes.dailyTransactionLimit === null ? 'Sin límite' : 'Q' + Number(changes.dailyTransactionLimit).toFixed(2)}</li>`);
    }
    if (changes.status !== undefined) {
        lines.push(`<li><strong>Estado de cuenta:</strong> ${changes.status ? 'Activa' : 'Inactiva'}</li>`);
    }

    const html = `
        <p>Hola ${name || 'cliente'},</p>
        <p>Se registró un cambio de seguridad en tu cuenta.</p>
        <ul>
            <li><strong>Cuenta:</strong> ${accountNumber || 'N/A'}</li>
            <li><strong>Tipo de cambio:</strong> ${changeType || 'Actualización de seguridad'}</li>
            ${lines.join('')}
        </ul>
        ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
        <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
    `;

    return await sendEmail(email, 'NexusBank - Cambio de seguridad', html);
};
