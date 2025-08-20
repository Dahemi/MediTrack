import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter for Gmail SMTP
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter configuration error:', error);
  } else {
    console.log('Email transporter is ready to send messages');
  }
});

export const sendVerificationEmail = async (
  email: string,
  verificationToken: string
): Promise<void> => {
  const verificationUrl = `${process.env.BASE_URL}/api/auth/verify/${verificationToken}`;
  
  const mailOptions = {
    from: {
      name: 'MediTrack',
      address: process.env.EMAIL_USER!,
    },
    to: email,
    subject: 'Verify Your MediTrack Account',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">MediTrack</h1>
          <p style="color: #6b7280; margin: 5px 0;">Smart Clinic Management System</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1f2937; margin-top: 0;">Welcome to MediTrack!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Thank you for registering with MediTrack. To complete your registration and start using our platform, 
            please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; font-weight: 600; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #2563eb; font-size: 14px; word-break: break-all; margin-top: 5px;">
            ${verificationUrl}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create an account with MediTrack, please ignore this email.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

export default transporter;