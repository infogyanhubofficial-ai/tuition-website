// app/api/send-email/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// 1. Define strict TypeScript types based on your DB Schema
type EmailType = 'COURSE_ENROLLMENT' | 'ORDER_VERIFIED';

interface EmailPayload {
  emailType: EmailType;
  userEmail: string;
  userName: string;
  courseName: string;
  // These map to your DB fields which can be null
  startDate?: string | null; 
  duration?: string | null;
  timing?: string | null;
  // These map to numeric(10,2) in your DB
  fullFee?: number | string | null; 
  offeredFee?: number | string | null;
  paidAmount?: number | string | null;
}

export async function POST(request: Request) {
  try {
    // 2. Parse and validate the request body
    const body: EmailPayload = await request.json();
    
    const { 
      emailType, 
      userEmail, 
      userName, 
      courseName,
      startDate,
      duration,
      timing,
      fullFee,
      offeredFee,
      paidAmount
    } = body;

    // Safety check: ensure required fields exist
    if (!emailType || !userEmail || !userName || !courseName) {
      return NextResponse.json(
        { error: "Missing required fields: emailType, userEmail, userName, or courseName." }, 
        { status: 400 }
      );
    }

    // 3. Configure Nodemailer securely
    const transporter = nodemailer.createTransport({
      host: "mail.gyanhub.com.np",
      port: 465,
      secure: true,
      auth: {
        // Fallback to empty string prevents TypeScript "undefined" errors
        user: process.env.EMAIL_USER || "", 
        pass: process.env.EMAIL_PASSWORD || "", 
      },
    });

    // 4. Prepare Email Content Variables
    let emailSubject = "";
    let emailHtml = "";

    // 5. Build Template Based on Action
    switch (emailType) {
      case "COURSE_ENROLLMENT":
        emailSubject = `Welcome to GyanHub! Enrollment Details for ${courseName}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
            <p>Dear ${userName},</p>
            
            <p>Thank you for enrolling in our <strong>${courseName}</strong> course. We warmly welcome you to GyanHub.</p>
            
            <p>We are excited to inform you that your course details are as follows:</p>
            
            <ul style="list-style-type: none; padding-left: 0;">
              <li><strong>Course Start Date:</strong> ${startDate ? startDate : 'To be announced'}</li>
              <li><strong>Course Duration:</strong> ${duration ? duration : 'To be determined'}</li>
              <li><strong>Class Timing:</strong> ${timing ? timing : 'To be determined'}</li>
            </ul>
            
            <p><strong>Course Fee:</strong></p>
            <ul style="list-style-type: none; padding-left: 0;">
              <li><strong>Full Fee:</strong> Rs. ${fullFee ? fullFee : 'N/A'}</li>
              <li><strong>Offered Fee:</strong> Rs. ${offeredFee ? offeredFee : 'N/A'}</li>
            </ul>
            
            <p>To confirm your seat and secure the offered fee, we kindly request you to pay a 10% advance deposit as soon as possible.<br/>
            The remaining amount can be paid after the orientation session.</p>
            
            <p>📌 <strong>Important Information:</strong></p>
            <ul>
              <li>All classes will be recorded for revision purposes.</li>
              <li>Recorded lectures and study materials will be provided via Google Classroom with lifetime access.</li>
              <li>A professional certificate will be awarded upon successful course completion.</li>
            </ul>
            
            <p>We look forward to supporting your learning journey and helping you achieve your goals.</p>
            
            <p>Best regards,<br/><strong>GyanHub Team</strong></p>
          </div>
        `;
        break;

      case "ORDER_VERIFIED":
        emailSubject = `Payment Confirmed: ${courseName}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
            <p>Dear ${userName},</p>
            
            <p>Thank you for your purchase from GyanHub.</p>
            
            <p>We are pleased to confirm that your payment of <strong>Rs. ${paidAmount ? paidAmount : '0.00'}</strong> has been successfully received.</p>
            
            <p><strong>Order Details:</strong><br/>
            ${courseName}</p>
            
            <p>You can track your payment and order status anytime from your dashboard:<br/>
            👉 <a href="https://gyanhub.com.np/dashboard" style="color: #2563eb; text-decoration: none;">https://gyanhub.com.np/dashboard</a></p>
            
            <p>We appreciate your trust in GyanHub and look forward to serving you again.</p>
            
            <p>Best regards,<br/><strong>GyanHub Team</strong></p>
          </div>
        `;
        break;

      default:
        return NextResponse.json({ error: "Invalid email type provided." }, { status: 400 });
    }

    // 6. Send the Email
    const info = await transporter.sendMail({
      from: '"GyanHub" <admin@gyanhub.com.np>',
      to: userEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error: any) {
    console.error("Email API Error:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message }, 
      { status: 500 }
    );
  }
}