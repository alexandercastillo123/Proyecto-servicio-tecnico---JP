const nodemailer = require('nodemailer');

// SMTP Configuration from User
const transporter = nodemailer.createTransport({
    host: 'mail.codecta.pe',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'mail_sender@codecta.pe',
        pass: '&WmNltbeU~Y='
    }
});

/**
 * Send a verification code to user email
 * @param {string} email - Recipient email
 * @param {string} code - 6-digit verification code
 * @returns {Promise<boolean>}
 */
const sendResetCode = async (email, code) => {
    try {
        const mailOptions = {
            from: '"J&P Periféricos S.A.C" <mail_sender@codecta.pe>',
            to: email,
            subject: 'Código de recuperación de contraseña',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #3B28FF;">Recuperación de Cuenta</h2>
                    </div>
                    <p>Hola,</p>
                    <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar con el proceso:</p>
                    <div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #f5f7fa; border-radius: 5px;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3B28FF;">${code}</span>
                    </div>
                    <p>Este código <strong>expirará en 10 minutos</strong>. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
                    <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #757575; text-align: center;">
                        &copy; ${new Date().getFullYear()} J&P Periféricos S.A.C. Todos los derechos reservados.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

/**
 * Send a payment confirmation email for orders or appointments
 * @param {string} email - Recipient email
 * @param {Object} details - Details of the purchase (item name, amount, id, etc)
 */
const sendPaymentConfirmation = async (email, details) => {
    try {
        const { type, id, itemName, amount, date } = details;
        const title = type === 'order' ? 'Confirmación de Pedido' : 'Confirmación de Cita';
        const referenceLabel = type === 'order' ? 'Pedido #' : 'Cita #';

        const mailOptions = {
            from: '"J&P Periféricos S.A.C" <mail_sender@codecta.pe>',
            to: email,
            subject: `✔ Pago Exitoso - ${title} ${id}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #3B28FF 0%, #8B5CF6 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">¡Pago Exitoso!</h1>
                        <p style="color: #e0e0e0; margin-top: 10px;">Gracias por confiar en J&P Periféricos</p>
                    </div>

                    <!-- Body -->
                    <div style="padding: 30px; color: #333333;">
                        <p style="font-size: 16px;">Hola,</p>
                        <p style="font-size: 16px; line-height: 1.6;">Queremos informarte que hemos recibido tu pago correctamente a través de <strong>Culqi</strong>. Tu ${type === 'order' ? 'pedido' : 'cita'} ha sido confirmado automáticamente y ya está siendo procesado.</p>
                        
                        <!-- Details Card -->
                        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #3B28FF;">
                            <h3 style="margin-top: 0; color: #3B28FF; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Resumen de Transacción</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">${referenceLabel}</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${id}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Concepto:</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${itemName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Monto Pagado:</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #10b981; font-size: 18px;">S/ ${parseFloat(amount).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Fecha:</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${new Date().toLocaleDateString()}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="#" style="background-color: #3B28FF; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver mi Cuenta</a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
                        <p style="margin-bottom: 5px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
                        <p><strong>J&P Periféricos S.A.C</strong><br>Av. Wilson, Lima, Perú</p>
                        <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} Todos los derechos reservados.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Payment Confirmation Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending payment confirmation email:', error);
        return false;
    }
};

module.exports = {
    sendResetCode,
    sendPaymentConfirmation
};
