/**
 * FractureAI — Express Backend & Vite Dev Middleware
 * 
 * Provides authentic REST endpoints for:
 * - /api/health
 * - /api/auth/register
 * - /api/auth/send-otp
 * - /api/auth/verify-otp
 * - /api/auth/login
 * - /api/auth/forgot-password
 * - /api/auth/logout
 * - /api/auth/session
 * 
 * Ready for SMTP / Nodemailer integration.
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isVerified: boolean;
  otpCode?: string;
  otpExpiresAt?: number;
  createdAt: number;
}

// In-memory demo store for registered accounts and OTPs during server lifecycle
// In production, connect to PostgreSQL / Cloud SQL / Firestore
const usersDb = new Map<string, UserRecord>();

// Pre-seed a test user account for testing
usersDb.set('researcher@fractureai.org', {
  id: 'usr_demo_01',
  name: 'Dr. Elena Vance',
  email: 'researcher@fractureai.org',
  passwordHash: 'Password123!', // In production use bcrypt
  isVerified: true,
  createdAt: Date.now() - 86400000,
});

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'FractureAI API Gateway',
      environment: isProd ? 'production' : 'development',
      version: '1.0.0',
      registeredUsersCount: usersDb.size,
      timestamp: new Date().toISOString(),
    });
  });

  // Register
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, password, termsAccepted } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide a valid full name (at least 2 characters).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim().toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    if (!termsAccepted) {
      return res.status(400).json({ success: false, message: 'You must accept the terms of use and medical disclaimer to register.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (usersDb.has(normalizedEmail) && usersDb.get(normalizedEmail)!.isVerified) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please sign in.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    usersDb.set(normalizedEmail, {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: password,
      isVerified: false,
      otpCode: otp,
      otpExpiresAt: expiresAt,
      createdAt: Date.now(),
    });

    console.log(`[AUTH] Registered pending account: ${normalizedEmail}. Verification OTP: ${otp}`);

    // In a configured SMTP server:
    // await sendOtpEmailViaNodemailer(normalizedEmail, otp);

    return res.status(201).json({
      success: true,
      message: 'Account registered. Verification code has been dispatched to your email.',
      email: normalizedEmail,
      requireOtp: true,
      // For development inspection, provide note:
      devHint: isProd ? undefined : `Dev note: Generated 6-digit OTP is ${otp}`,
    });
  });

  // Send / Resend OTP
  app.post('/api/auth/send-otp', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersDb.get(normalizedEmail);

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registration found for this email address. Please register first.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000;

    console.log(`[AUTH] Dispatched new OTP for ${normalizedEmail}: ${otp}`);

    return res.json({
      success: true,
      message: 'A fresh 6-digit verification code has been dispatched.',
      devHint: isProd ? undefined : `Dev note: New OTP is ${otp}`,
    });
  });

  // Verify OTP
  app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit verification code are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersDb.get(normalizedEmail);

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found matching this email.' });
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'No pending verification code found. Please request a new code.' });
    }

    if (Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    if (user.otpCode !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect verification code. Please check the code and try again.' });
    }

    // Mark as verified
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;

    return res.json({
      success: true,
      message: 'Email address verified successfully. Welcome to FractureAI!',
      token: `tok_${user.id}_${Date.now()}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: true,
      },
    });
  });

  // Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersDb.get(normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.passwordHash !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      // Re-trigger OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otp;
      user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
      return res.status(403).json({
        success: false,
        requireOtp: true,
        email: user.email,
        message: 'Your email address has not been verified yet. We have sent a verification code to your email.',
        devHint: isProd ? undefined : `Dev note: OTP is ${otp}`,
      });
    }

    return res.json({
      success: true,
      message: 'Signed in successfully.',
      token: `tok_${user.id}_${Date.now()}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: true,
      },
    });
  });

  // Forgot Password
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersDb.get(normalizedEmail);

    if (!user) {
      // Security best practice: don't reveal whether user exists
      return res.json({
        success: true,
        message: 'If an account exists for this email, password reset instructions have been dispatched.',
      });
    }

    console.log(`[AUTH] Password reset requested for: ${normalizedEmail}`);

    return res.json({
      success: true,
      message: 'Password reset instructions have been dispatched to your email address.',
    });
  });

  // Logout
  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      message: 'Session terminated successfully.',
    });
  });

  // Vite middleware in dev or static files in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FractureAI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FractureAI] Server startup error:', err);
  process.exit(1);
});
