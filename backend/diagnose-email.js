import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const testEmail = async () => {
  console.log('--- Email Diagnosis Start ---');
  console.log(`Host: ${process.env.SMTP_HOST}`);
  console.log(`Port: ${process.env.SMTP_PORT}`);
  console.log(`User: ${process.env.SMTP_USER}`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    debug: true, // show debug output
    logger: true, // log information in console
  });

  try {
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully!');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // send to self
      subject: 'ShopAI Email Test',
      text: 'If you see this, email is working!',
      html: '<b>If you see this, email is working!</b>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ Email test failed!');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    if (err.response) console.error('SMTP Response:', err.response);
  }
  console.log('--- Email Diagnosis End ---');
};

testEmail();
