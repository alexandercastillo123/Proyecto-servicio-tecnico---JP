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

module.exports = {
    sendResetCode
};
