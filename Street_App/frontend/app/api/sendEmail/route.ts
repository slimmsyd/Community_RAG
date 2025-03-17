import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, content, isClientEmail, from } = await request.json();
    
    console.log("Received email request:", { to, subject, contentLength: content?.length, isClientEmail });

    // Validate required fields
    if (!to || !subject || (!content && !isClientEmail)) {
      console.log("Validation failed:", {
        hasTo: !!to,
        hasSubject: !!subject,
        hasContent: !!content
      });
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and content are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.log("Invalid email format:", to);
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // .
  

    // Configure email transporter (update with your email service details)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    if (isClientEmail) {
      // Send welcome email to client
      await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL || '',
        to: to,
        subject: "InvoieMagi | Your Payment Link Is Ready!",
        text: `Hi there!

Thank you for doing business with us. Your payment link has been generated and is ready for use.

Payment Details:
• Sent by: ${from}
• Payment Link: ${content}

If you have any questions or need assistance, please don't hesitate to reach out to the sender.

Best regards,
The InvoieMagi Team
        
Note: This is an automated message. Please do not reply directly to this email.`
      });
    } else {
      // Send notification email to admin
      await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL || '',
        to: to,
        subject: subject,
        text: content,
      });
    }

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}