import nodemailer from 'nodemailer';

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: {
        name: 'Kinnected Family',
        address: process.env.SMTP_FROM_EMAIL || 'sales@kinnected.life'
      },
      to,
      subject,
      html
    };

    console.log('Sending email:', {
      to,
      from: process.env.SMTP_FROM_EMAIL
    });

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
} 