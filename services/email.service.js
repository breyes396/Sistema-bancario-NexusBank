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