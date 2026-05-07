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

export const sendAccountApprovedEmail = async (email, name, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = `
        <p>Hola ${name || 'cliente'},</p>
        <p>¡Excelente noticia! Tu solicitud de cuenta en NexusBank ha sido <strong>aprobada</strong>.</p>
        <p>Para completar el registro, verifica tu email haciendo clic en el siguiente enlace:</p>
        <p><a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #C8A84B; color: #082238; text-decoration: none; border-radius: 4px; font-weight: bold;">Verificar Email</a></p>
        <p>O copia este código de verificación:</p>
        <p style="font-size: 18px; font-weight: bold; letter-spacing: 2px; font-family: monospace;">${token}</p>
        <p><strong>Este enlace válido por 24 horas.</strong></p>
        <p>Una vez verificado, podrás iniciar sesión en tu cuenta.</p>
        <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
        <p><small>Si no solicitaste esta cuenta, por favor contacta con soporte.</small></p>
    `;

    return await sendEmail(email, 'NexusBank - Cuenta Aprobada ✓', html);
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
// ====== ALERTAS DE FRAUDE ======

export const sendAccountBlockedEmail = async (email, name, blockData = {}) => {
    const { blockedUntil, failedAttempts, reason } = blockData;
    const blockedTime = blockedUntil ? new Date(blockedUntil).toLocaleString('es-ES') : 'N/A';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .alert-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .action-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔒 ALERTA DE SEGURIDAD - CUENTA BLOQUEADA</h1>
                </div>
                <div class="content">
                    <h2>Hola ${name},</h2>
                    <div class="alert-box">
                        <strong>⚠️ Tu cuenta ha sido bloqueada temporalmente por razones de seguridad.</strong>
                    </div>
                    
                    <h3>Detalles del Bloqueo:</h3>
                    <ul>
                        <li><strong>Razón:</strong> ${reason || 'Múltiples intentos fallidos de operaciones monetarias'}</li>
                        <li><strong>Intentos fallidos:</strong> ${failedAttempts || '3'}</li>
                        <li><strong>Bloqueado hasta:</strong> ${blockedTime}</li>
                        <li><strong>Duración:</strong> 30 minutos</li>
                    </ul>

                    <div class="action-box">
                        <h3>¿Qué hacer?</h3>
                        <p>Tu cuenta estará disponible nuevamente después del tiempo indicado. Mientras tanto:</p>
                        <ul>
                            <li>No intentes realizar más operaciones monetarias</li>
                            <li>Revisa tus intentos fallidos en la sección de seguridad</li>
                            <li>Si esto fue sospechoso, <strong>cambia tu contraseña inmediatamente</strong></li>
                            <li>Contacta a soporte si crees que esto fue un error</li>
                        </ul>
                    </div>

                    <p><strong>Si no fuiste tú quien intentó estas operaciones, por favor contacta a nuestro equipo de seguridad inmediatamente.</strong></p>
                    <p>Teléfono de soporte: +502 XXXX XXXX</p>
                    <p>Email: soporte@nexusbank.com</p>

                    <p><em>Fecha: ${new Date().toLocaleString('es-ES')}</em></p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} NexusBank. Todos los derechos reservados.</p>
                    <p>Este email fue enviado por nuestro sistema de seguridad automático.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(email, '🔒 ALERTA: Tu cuenta ha sido bloqueada temporalmente', html);
};

export const sendFraudAlertEmail = async (email, name, alertData = {}) => {
    const { alertType, severity, description, detectedAt } = alertData;
    
    const severityColors = {
        'CRITICAL': '#dc2626',
        'HIGH': '#ea580c',
        'MEDIUM': '#f59e0b',
        'LOW': '#3b82f6'
    };

    const severityColor = severityColors[severity] || '#6b7280';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, ${severityColor} 0%, rgba(0,0,0,0.1) 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .alert-box { background: #f0f9ff; border-left: 4px solid ${severityColor}; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .severity { display: inline-block; padding: 5px 10px; background: ${severityColor}; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ ALERTA DE FRAUDE DETECTADA</h1>
                </div>
                <div class="content">
                    <h2>Hola ${name},</h2>
                    <p>Nuestro sistema de seguridad ha detectado una actividad sospechosa en tu cuenta.</p>
                    
                    <div class="alert-box">
                        <p><strong>Tipo de alerta:</strong> ${getAlertTypeInSpanish(alertType)}</p>
                        <p><strong>Severidad:</strong> <span class="severity">${severity}</span></p>
                        <p><strong>Descripción:</strong> ${description}</p>
                        <p><strong>Detectado:</strong> ${new Date(detectedAt || Date.now()).toLocaleString('es-ES')}</p>
                    </div>

                    <h3>¿Qué significa esto?</h3>
                    <p>Hemos detectado un patrón inusual en tu cuenta que podría indicar fraude. Esto puede incluir:</p>
                    <ul>
                        <li>Múltiples intentos fallidos de operaciones</li>
                        <li>Acceso desde múltiples ubicaciones geográficas</li>
                        <li>Transacciones inusualmente rápidas</li>
                        <li>Montos anormalmente altos</li>
                    </ul>

                    <h3>Recomendaciones:</h3>
                    <ul>
                        <li>✅ <strong>Revisa tu cuenta</strong> en la sección de seguridad para ver más detalles</li>
                        <li>✅ <strong>Verifica tus intentos fallidos</strong> para confirmar la actividad</li>
                        <li>✅ <strong>Cambia tu contraseña</strong> si sospechas acceso no autorizado</li>
                        <li>✅ <strong>Contacta a soporte</strong> si no reconoces la actividad</li>
                    </ul>

                    <p style="color: #666; font-style: italic;">Si realizaste estas operaciones, puedes ignorar este email. Está todo bajo control.</p>

                    <p><strong>Contacto de seguridad:</strong><br>
                    Email: seguridad@nexusbank.com<br>
                    Teléfono: +502 XXXX XXXX</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} NexusBank. Todos los derechos reservados.</p>
                    <p>Este email fue enviado por nuestro sistema de seguridad automático.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(email, `⚠️ ALERTA: Actividad sospechosa detectada en tu cuenta (${severity})`, html);
};

export const sendFailedAttemptEmail = async (email, name, attemptData = {}) => {
    const { type, amount, reason, ipAddress, attemptNumber } = attemptData;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .warning { color: #b45309; font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Intento de operación fallido</h1>
                </div>
                <div class="content">
                    <h2>Hola ${name},</h2>
                    <p>Se registró un intento fallido de operación en tu cuenta.</p>
                    
                    <div class="info-box">
                        <p><strong>Tipo de operación:</strong> ${getOperationTypeInSpanish(type)}</p>
                        <p><strong>Monto:</strong> Q${Number(amount).toFixed(2)}</p>
                        <p><strong>Razón del fallo:</strong> ${reason}</p>
                        <p><strong>Ubicación (IP):</strong> ${ipAddress || 'No disponible'}</p>
                        <p><strong>Intento #:</strong> ${attemptNumber || 1}</p>
                        <p><strong>Hora:</strong> ${new Date().toLocaleString('es-ES')}</p>
                    </div>

                    <div class="info-box" style="border-left-color: #dc2626; background: #fee2e2;">
                        <p class="warning">⚠️ ATENCIÓN: Si acumulas 3 intentos fallidos en 1 hora, tu cuenta será bloqueada por 30 minutos.</p>
                        <p class="warning">Intentos registrados en tu sesión: ${attemptNumber || 1} de 3</p>
                    </div>

                    <h3>¿Qué hacer?</h3>
                    <ul>
                        <li>Revisa que los datos sean correctos</li>
                        <li>Asegúrate de tener saldo suficiente</li>
                        <li>Verifica que el monto no supere los límites</li>
                        <li>Si el problema persiste, contacta a soporte</li>
                    </ul>

                    <p style="color: #666; margin-top: 30px;">No necesitas tomar acción si este fue un error tuyo. Puedes reintentar en unos iros.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} NexusBank. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(email, `⚠️ Intento fallido: ${getOperationTypeInSpanish(type)}`, html);
};

export const sendTransferReversalEmail = async (email, name, reversalData = {}) => {
    const { accountNumber, amount, reason, newBalance, type, recipient, sender } = reversalData;

    const isRefund = type === 'REFUNDED';
    const headerColor = isRefund ? '#10b981' : '#f59e0b'; // Verde para reembolso, Naranja para reversión
    const headerBg = isRefund 
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    const title = isRefund ? '✅ Dinero reembolsado' : '↩️ Transferencia revertida';
    const description = isRefund 
        ? 'Tu dinero ha sido reembolsado a tu cuenta.' 
        : 'Una transferencia ha sido revertida desde tu cuenta.';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: ${headerBg}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: #f0fdf4; border-left: 4px solid ${headerColor}; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .amount { font-size: 24px; font-weight: bold; color: ${headerColor}; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                .detail-label { font-weight: bold; color: #666; }
                .detail-value { color: #333; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${title}</h1>
                </div>
                <div class="content">
                    <h2>Hola ${name},</h2>
                    <p>${description}</p>
                    
                    <div class="info-box">
                        <p><strong>Monto:</strong> <span class="amount">Q${Number(amount).toFixed(2)}</span></p>
                        <div class="detail-row">
                            <span class="detail-label">Tu cuenta:</span>
                            <span class="detail-value">${accountNumber}</span>
                        </div>
                        ${isRefund 
                            ? `<div class="detail-row">
                                <span class="detail-label">Remitente original:</span>
                                <span class="detail-value">${recipient || 'Cuenta desconocida'}</span>
                            </div>`
                            : `<div class="detail-row">
                                <span class="detail-label">Destinatario:</span>
                                <span class="detail-value">${recipient || sender || 'Cuenta desconocida'}</span>
                            </div>`
                        }
                        <div class="detail-row">
                            <span class="detail-label">Razón:</span>
                            <span class="detail-value">${reason || 'Reversión dentro de ventana de 5 minutos'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Nuevo saldo:</span>
                            <span class="detail-value"><strong>Q${Number(newBalance).toFixed(2)}</strong></span>
                        </div>
                        <div class="detail-row" style="border-bottom: none;">
                            <span class="detail-label">Fecha y hora:</span>
                            <span class="detail-value">${new Date().toLocaleString('es-ES')}</span>
                        </div>
                    </div>

                    ${isRefund 
                        ? `<h3>Detalles del reembolso:</h3>
                            <p>El dinero fue reembolsado exitosamente a tu cuenta. Este cambio puede tardar algunos minutos en reflejarse completamente.</p>`
                        : `<h3>Detalles de la reversión:</h3>
                            <p>La transferencia fue revertida dentro de la ventana de 5 minutos permitida. El dinero se retiró de tu cuenta.</p>`
                    }

                    <h3>¿Preguntas?</h3>
                    <p>Si tienes dudas sobre esta transacción o no reconoces este movimiento, contacta a nuestro equipo de soporte:</p>
                    <ul>
                        <li>Email: soporte@nexusbank.com</li>
                        <li>Teléfono: +502 XXXX XXXX</li>
                        <li>Chat en vivo: disponible de Lunes a Viernes, 8am - 6pm</li>
                    </ul>

                    <p style="color: #666; margin-top: 30px; font-size: 12px;">Esta es una notificación automática de tu cuenta. Por favor no respondas a este email.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} NexusBank. Todos los derechos reservados.</p>
                    <p>¿Necesitas ayuda? Visita nuestro centro de soporte en support.nexusbank.com</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const subject = isRefund 
        ? `✅ Reembolso de Q${Number(amount).toFixed(2)} - NexusBank`
        : `↩️ Reversión de transferencia - Q${Number(amount).toFixed(2)} - NexusBank`;

    return await sendEmail(email, subject, html);
};

// Funciones auxiliares
function getAlertTypeInSpanish(alertType) {
    const types = {
        'EXCESSIVE_FAILED_ATTEMPTS': 'Múltiples intentos fallidos',
        'RAPID_TRANSACTIONS': 'Transacciones rápidas sospechosas',
        'UNUSUAL_AMOUNT': 'Monto inusualmente alto',
        'UNUSUAL_LOCATION': 'Acceso desde ubicación inusual',
        'NEW_RECIPIENT': 'Nuevo destinatario detectado',
        'BLOCKED_ACCOUNT': 'Cuenta bloqueada',
        'MULTIPLE_IPS': 'Múltiples ubicaciones geográficas',
        'PATTERN_DETECTED': 'Patrón sospechoso detectado'
    };
    return types[alertType] || alertType;
}

function getOperationTypeInSpanish(type) {
    const types = {
        'TRANSFER': 'Transferencia',
        'DEPOSIT': 'Depósito',
        'WITHDRAWAL': 'Retiro'
    };
    return types[type] || type;
}

/**
 * Enviar correo de cuenta congelada por administrador
 */
export const sendAccountFrozenEmail = async (email, name, freezeData = {}) => {
    const { accountNumber, reason, reasonDetails, frozenAt, performedByName } = freezeData;
    const frozenTime = frozenAt ? new Date(frozenAt).toLocaleString('es-ES') : new Date().toLocaleString('es-ES');

    // Traducir razones al español
    const reasonsInSpanish = {
        'FRAUD_SUSPICION': 'Sospecha de fraude',
        'SECURITY_REVIEW': 'Revisión de seguridad',
        'COMPLIANCE_CHECK': 'Verificación de cumplimiento normativo',
        'USER_REQUEST': 'Solicitud del usuario',
        'ADMINISTRATIVE_ACTION': 'Acción administrativa',
        'SUSPICIOUS_ACTIVITY': 'Actividad sospechosa',
        'RISK_ASSESSMENT': 'Evaluación de riesgo',
        'INVESTIGATION': 'Investigación en curso',
        'OTHER': 'Otras razones'
    };

    const reasonText = reasonsInSpanish[reason] || reason;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                .header { 
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center; 
                    border-radius: 0; 
                }
                .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.95; }
                .content { 
                    padding: 40px 30px; 
                    background: #ffffff; 
                }
                .alert-box { 
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border-left: 5px solid #f59e0b; 
                    padding: 20px; 
                    margin: 25px 0; 
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .alert-box strong { 
                    display: block; 
                    font-size: 18px; 
                    color: #92400e; 
                    margin-bottom: 10px; 
                }
                .alert-box p { 
                    margin: 5px 0; 
                    color: #78350f; 
                }
                .info-section { 
                    background: #f8fafc; 
                    border: 1px solid #e2e8f0; 
                    padding: 20px; 
                    margin: 25px 0; 
                    border-radius: 8px; 
                }
                .info-section h3 { 
                    margin: 0 0 15px 0; 
                    color: #1e293b; 
                    font-size: 18px; 
                    border-bottom: 2px solid #f59e0b;
                    padding-bottom: 8px;
                }
                .info-item { 
                    display: flex; 
                    padding: 8px 0; 
                    border-bottom: 1px solid #e2e8f0; 
                }
                .info-item:last-child { border-bottom: none; }
                .info-label { 
                    font-weight: 600; 
                    color: #475569; 
                    min-width: 140px; 
                }
                .info-value { 
                    color: #1e293b; 
                    flex: 1; 
                }
                .action-box { 
                    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                    border: 1px solid #3b82f6; 
                    padding: 20px; 
                    margin: 25px 0; 
                    border-radius: 8px; 
                }
                .action-box h3 { 
                    margin: 0 0 12px 0; 
                    color: #1e40af; 
                    font-size: 18px; 
                }
                .action-box ul { 
                    margin: 10px 0; 
                    padding-left: 20px; 
                }
                .action-box li { 
                    margin: 8px 0; 
                    color: #1e3a8a; 
                }
                .warning-text { 
                    background: #fee; 
                    border-left: 4px solid #dc2626; 
                    padding: 15px; 
                    margin: 20px 0; 
                    border-radius: 4px;
                    color: #991b1b;
                    font-weight: 500;
                }
                .contact-section { 
                    background: #f1f5f9; 
                    padding: 20px; 
                    margin: 25px 0; 
                    border-radius: 8px;
                    text-align: center;
                }
                .contact-section h3 { 
                    margin: 0 0 15px 0; 
                    color: #1e293b; 
                }
                .contact-item { 
                    margin: 10px 0; 
                    font-size: 15px; 
                }
                .contact-item strong { 
                    color: #f59e0b; 
                }
                .footer { 
                    background: #1e293b; 
                    color: #94a3b8; 
                    text-align: center; 
                    padding: 25px; 
                    font-size: 13px; 
                }
                .footer p { margin: 5px 0; }
                .footer strong { color: #f59e0b; }
                .timestamp { 
                    color: #64748b; 
                    font-size: 13px; 
                    font-style: italic; 
                    margin-top: 20px; 
                    padding-top: 15px; 
                    border-top: 1px solid #e2e8f0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>❄️ CUENTA CONGELADA</h1>
                    <p>Acción administrativa sobre tu cuenta</p>
                </div>
                <div class="content">
                    <h2 style="color: #1e293b; margin-top: 0;">Estimado/a ${name},</h2>
                    
                    <div class="alert-box">
                        <strong>⚠️ Tu cuenta ha sido temporalmente congelada</strong>
                        <p>Tu cuenta bancaria ha sido suspendida temporalmente por nuestro equipo administrativo y no podrás realizar transacciones hasta que sea descongelada.</p>
                    </div>
                    
                    <div class="info-section">
                        <h3>📋 Información del Congelamiento</h3>
                        <div class="info-item">
                            <span class="info-label">Cuenta:</span>
                            <span class="info-value">${accountNumber || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Motivo:</span>
                            <span class="info-value">${reasonText}</span>
                        </div>
                        ${reasonDetails ? `
                        <div class="info-item">
                            <span class="info-label">Detalles:</span>
                            <span class="info-value">${reasonDetails}</span>
                        </div>
                        ` : ''}
                        <div class="info-item">
                            <span class="info-label">Fecha de congelamiento:</span>
                            <span class="info-value">${frozenTime}</span>
                        </div>
                        ${performedByName ? `
                        <div class="info-item">
                            <span class="info-label">Gestionado por:</span>
                            <span class="info-value">${performedByName}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="action-box">
                        <h3>🔍 ¿Qué significa esto?</h3>
                        <p>Mientras tu cuenta esté congelada:</p>
                        <ul>
                            <li><strong>No podrás</strong> realizar transferencias</li>
                            <li><strong>No podrás</strong> hacer depósitos</li>
                            <li><strong>No podrás</strong> retirar fondos</li>
                            <li><strong>Sí podrás</strong> consultar tu saldo</li>
                            <li><strong>Sí podrás</strong> ver el historial de transacciones</li>
                        </ul>
                    </div>

                    <div class="warning-text">
                        <strong>⏰ Acción Requerida:</strong> Por favor contacta a nuestro equipo de soporte para resolver esta situación y reactivar tu cuenta.
                    </div>

                    <div class="contact-section">
                        <h3>💬 Contáctanos</h3>
                        <div class="contact-item">
                            <strong>📧 Email:</strong> soporte@nexusbank.com
                        </div>
                        <div class="contact-item">
                            <strong>📞 Teléfono:</strong> +502 2345-6789
                        </div>
                        <div class="contact-item">
                            <strong>🕐 Horario:</strong> Lunes a Viernes, 8:00 AM - 6:00 PM
                        </div>
                    </div>

                    <p style="color: #64748b; font-size: 14px;">
                        Nuestro equipo está comprometido con la seguridad de tu cuenta. Trabajaremos contigo para resolver esta situación lo antes posible.
                    </p>

                    <div class="timestamp">
                        Notificación generada automáticamente el ${frozenTime}
                    </div>
                </div>
                <div class="footer">
                    <p><strong>NexusBank</strong> - Tu socio financiero de confianza</p>
                    <p>© ${new Date().getFullYear()} NexusBank. Todos los derechos reservados.</p>
                    <p style="margin-top: 10px; font-size: 12px;">Este es un correo automático, por favor no responder a esta dirección.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(email, '❄️ IMPORTANTE: Tu cuenta NexusBank ha sido congelada', html);
};

/**
 * Enviar correo de cuenta descongelada
 */
export const sendAccountUnfrozenEmail = async (email, name, unfreezeData = {}) => {
    const { accountNumber, previousReason, unfrozenAt, performedByName } = unfreezeData;
    const unfrozenTime = unfrozenAt ? new Date(unfrozenAt).toLocaleString('es-ES') : new Date().toLocaleString('es-ES');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                .header { 
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center; 
                    border-radius: 0; 
                }
                .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.95; }
                .content { 
                    padding: 40px 30px; 
                    background: #ffffff; 
                }
                .success-box { 
                    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                    border-left: 5px solid #10b981; 
                    padding: 20px; 
                    margin: 25px 0; 
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .success-box strong { 
                    display: block; 
                    font-size: 18px; 
                    color: #065f46; 
                    margin-bottom: 10px; 
                }
                .success-box p { 
                    margin: 5px 0; 
                    color: #047857; 
                }
                .info-section { 
                    background: #f8fafc; 
                    border: 1px solid #e2e8f0; 
                    padding: 20px; 
                    margin: 25px 0; 
                    border-radius: 8px; 
                }
                .info-section h3 { 
                    margin: 0 0 15px 0; 
                    color: #1e293b; 
                    font-size: 18px; 
                    border-bottom: 2px solid #10b981;
                    padding-bottom: 8px;
                }
                .info-item { 
                    display: flex; 
                    padding: 8px 0; 
                    border-bottom: 1px solid #e2e8f0; 
                }
                .info-item:last-child { border-bottom: none; }
                .info-label { 
                    font-weight: 600; 
                    color: #475569; 
                    min-width: 140px; 
                }
                .info-value { 
                    color: #1e293b; 
                    flex: 1; 
                }
                .features-box { 
                    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                    border: 1px solid #3b82f6; 
                    padding: 20px; 
                    margin: 25px 0; 
                    border-radius: 8px; 
                }
                .features-box h3 { 
                    margin: 0 0 12px 0; 
                    color: #1e40af; 
                    font-size: 18px; 
                }
                .features-box ul { 
                    margin: 10px 0; 
                    padding-left: 20px; 
                }
                .features-box li { 
                    margin: 8px 0; 
                    color: #1e3a8a; 
                }
                .tips-section { 
                    background: #fef3c7; 
                    border-left: 4px solid #f59e0b; 
                    padding: 15px; 
                    margin: 20px 0; 
                    border-radius: 4px;
                }
                .tips-section h4 { 
                    margin: 0 0 10px 0; 
                    color: #92400e; 
                }
                .tips-section ul { 
                    margin: 5px 0; 
                    padding-left: 20px; 
                }
                .tips-section li { 
                    margin: 5px 0; 
                    color: #78350f; 
                }
                .footer { 
                    background: #1e293b; 
                    color: #94a3b8; 
                    text-align: center; 
                    padding: 25px; 
                    font-size: 13px; 
                }
                .footer p { margin: 5px 0; }
                .footer strong { color: #10b981; }
                .timestamp { 
                    color: #64748b; 
                    font-size: 13px; 
                    font-style: italic; 
                    margin-top: 20px; 
                    padding-top: 15px; 
                    border-top: 1px solid #e2e8f0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ CUENTA REACTIVADA</h1>
                    <p>Tu cuenta ha sido descongelada exitosamente</p>
                </div>
                <div class="content">
                    <h2 style="color: #1e293b; margin-top: 0;">¡Excelentes noticias, ${name}!</h2>
                    
                    <div class="success-box">
                        <strong>🎉 Tu cuenta ha sido descongelada</strong>
                        <p>Tu cuenta bancaria ha sido reactivada y ahora puedes volver a realizar todas tus transacciones con normalidad.</p>
                    </div>
                    
                    <div class="info-section">
                        <h3>📋 Información de la Reactivación</h3>
                        <div class="info-item">
                            <span class="info-label">Cuenta:</span>
                            <span class="info-value">${accountNumber || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Estado actual:</span>
                            <span class="info-value" style="color: #10b981; font-weight: 600;">ACTIVA</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fecha de reactivación:</span>
                            <span class="info-value">${unfrozenTime}</span>
                        </div>
                        ${performedByName ? `
                        <div class="info-item">
                            <span class="info-label">Gestionado por:</span>
                            <span class="info-value">${performedByName}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="features-box">
                        <h3>✨ Servicios Disponibles</h3>
                        <p>Ahora puedes volver a usar todos nuestros servicios:</p>
                        <ul>
                            <li><strong>✓</strong> Realizar transferencias a otras cuentas</li>
                            <li><strong>✓</strong> Hacer depósitos en tu cuenta</li>
                            <li><strong>✓</strong> Retirar fondos cuando lo necesites</li>
                            <li><strong>✓</strong> Consultar tu saldo y movimientos</li>
                            <li><strong>✓</strong> Gestionar tus favoritos y beneficiarios</li>
                        </ul>
                    </div>

                    <div class="tips-section">
                        <h4>💡 Recomendaciones de Seguridad</h4>
                        <ul>
                            <li>Asegúrate de mantener tu contraseña segura</li>
                            <li>Revisa regularmente tus transacciones</li>
                            <li>Reporta cualquier actividad sospechosa inmediatamente</li>
                            <li>Mantén actualizada tu información de contacto</li>
                        </ul>
                    </div>

                    <p style="color: #1e293b; font-size: 15px; margin-top: 25px;">
                        Gracias por tu paciencia durante este proceso. En NexusBank, la seguridad de tu cuenta es nuestra prioridad.
                    </p>

                    <p style="color: #64748b; font-size: 14px; margin-top: 15px;">
                        Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos en <strong style="color: #10b981;">soporte@nexusbank.com</strong> o al <strong style="color: #10b981;">+502 2345-6789</strong>.
                    </p>

                    <div class="timestamp">
                        Notificación generada automáticamente el ${unfrozenTime}
                    </div>
                </div>
                <div class="footer">
                    <p><strong>NexusBank</strong> - Tu socio financiero de confianza</p>
                    <p>© ${new Date().getFullYear()} NexusBank. Todos los derechos reservados.</p>
                    <p style="margin-top: 10px; font-size: 12px;">Este es un correo automático, por favor no responder a esta dirección.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(email, '✅ ¡Buenas noticias! Tu cuenta NexusBank ha sido reactivada', html);
};