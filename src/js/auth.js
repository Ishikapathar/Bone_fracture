/**
 * FractureAI — Authentication Controller
 * 
 * Handles modal navigation, form validation, password strength calculation,
 * 6-digit OTP interactions, and real session state updates.
 */

import * as api from './api.js';

class AuthController {
  constructor() {
    this.currentScreen = 'signin'; // 'signin', 'register', 'otp', 'forgot'
    this.pendingEmail = '';
    this.otpCountdownInterval = null;
    this.otpSecondsLeft = 60;
    this.currentUser = null;

    this.initElements();
    this.bindEvents();
    this.checkExistingSession();
  }

  initElements() {
    this.modal = document.getElementById('auth-modal');
    this.modalTitle = document.getElementById('auth-modal-title');
    this.tabsContainer = document.getElementById('auth-tabs');
    this.tabSigninBtn = document.getElementById('tab-btn-signin');
    this.tabRegisterBtn = document.getElementById('tab-btn-register');

    // Screens
    this.screenSignin = document.getElementById('auth-screen-signin');
    this.screenRegister = document.getElementById('auth-screen-register');
    this.screenOtp = document.getElementById('auth-screen-otp');
    this.screenForgot = document.getElementById('auth-screen-forgot');

    // Forms
    this.formSignin = document.getElementById('form-signin');
    this.formRegister = document.getElementById('form-register');
    this.formOtp = document.getElementById('form-otp');
    this.formForgot = document.getElementById('form-forgot');

    // OTP Elements
    this.otpInputs = Array.from(document.querySelectorAll('.otp-digit-input'));
    this.otpEmailDisplay = document.getElementById('otp-target-email');
    this.otpResendBtn = document.getElementById('otp-resend-btn');
    this.otpTimerText = document.getElementById('otp-timer-count');

    // Password strength
    this.registerPasswordInput = document.getElementById('register-password');
    this.strengthFill = document.getElementById('password-strength-fill');
    this.strengthLabel = document.getElementById('password-strength-label');

    // Alerts
    this.alertBox = document.getElementById('auth-alert');
    this.alertText = document.getElementById('auth-alert-text');

    // Navigation elements for active user session
    this.navActions = document.getElementById('nav-actions-container');
  }

  bindEvents() {
    // Tab switching
    if (this.tabSigninBtn) {
      this.tabSigninBtn.addEventListener('click', () => this.showScreen('signin'));
    }
    if (this.tabRegisterBtn) {
      this.tabRegisterBtn.addEventListener('click', () => this.showScreen('register'));
    }

    // Modal Close buttons
    const closeButtons = document.querySelectorAll('[data-dismiss="auth-modal"]');
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => this.closeModal());
    });

    // Forgot password links
    const forgotLinks = document.querySelectorAll('[data-action="show-forgot"]');
    forgotLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showScreen('forgot');
      });
    });

    // Return to sign in
    const returnSigninLinks = document.querySelectorAll('[data-action="return-signin"]');
    returnSigninLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showScreen('signin');
      });
    });

    // Password visibility toggles
    const toggleBtns = document.querySelectorAll('.toggle-password-btn');
    toggleBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const inputId = btn.getAttribute('data-target');
        const targetInput = document.getElementById(inputId);
        if (targetInput) {
          const isPassword = targetInput.type === 'password';
          targetInput.type = isPassword ? 'text' : 'password';
          btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
          btn.innerHTML = isPassword
            ? `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
            : `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        }
      });
    });

    // Password strength meter
    if (this.registerPasswordInput) {
      this.registerPasswordInput.addEventListener('input', () => {
        this.evaluatePasswordStrength(this.registerPasswordInput.value);
      });
    }

    // OTP Digit Inputs
    this.otpInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val ? val[0] : '';
        if (val && index < this.otpInputs.length - 1) {
          this.otpInputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          this.otpInputs[index - 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
        const digits = pasteData.replace(/[^0-9]/g, '').slice(0, 6);
        if (digits) {
          digits.split('').forEach((char, i) => {
            if (this.otpInputs[i]) {
              this.otpInputs[i].value = char;
            }
          });
          const nextIndex = Math.min(digits.length, this.otpInputs.length - 1);
          this.otpInputs[nextIndex].focus();
        }
      });
    });

    // Resend OTP
    if (this.otpResendBtn) {
      this.otpResendBtn.addEventListener('click', () => this.handleResendOtp());
    }

    // Form Submissions
    if (this.formSignin) {
      this.formSignin.addEventListener('submit', (e) => this.handleSigninSubmit(e));
    }
    if (this.formRegister) {
      this.formRegister.addEventListener('submit', (e) => this.handleRegisterSubmit(e));
    }
    if (this.formOtp) {
      this.formOtp.addEventListener('submit', (e) => this.handleOtpSubmit(e));
    }
    if (this.formForgot) {
      this.formForgot.addEventListener('submit', (e) => this.handleForgotSubmit(e));
    }
  }

  checkExistingSession() {
    try {
      const saved = localStorage.getItem('fracture_ai_user');
      if (saved) {
        this.currentUser = JSON.parse(saved);
        this.updateNavForSession();
      }
    } catch {
      this.currentUser = null;
    }
  }

  updateNavForSession() {
    if (!this.navActions) return;

    if (this.currentUser) {
      this.navActions.innerHTML = `
        <div class="user-session-pill">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span class="user-session-name">${this.currentUser.name}</span>
        </div>
        <button id="nav-btn-signout" class="btn btn-secondary btn-sm">Sign Out</button>
      `;

      const signoutBtn = document.getElementById('nav-btn-signout');
      if (signoutBtn) {
        signoutBtn.addEventListener('click', () => this.handleSignOut());
      }
    } else {
      this.navActions.innerHTML = `
        <button id="nav-btn-signin" class="btn btn-ghost">Sign In</button>
        <button id="nav-btn-getstarted" class="btn btn-primary">Get Started</button>
      `;

      const signinBtn = document.getElementById('nav-btn-signin');
      const getStartedBtn = document.getElementById('nav-btn-getstarted');

      if (signinBtn) signinBtn.addEventListener('click', () => this.openModal('signin'));
      if (getStartedBtn) getStartedBtn.addEventListener('click', () => this.openModal('register'));
    }
  }

  async handleSignOut() {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('fracture_ai_user');
    this.currentUser = null;
    this.updateNavForSession();
  }

  openModal(screen = 'signin', email = '') {
    if (email) this.pendingEmail = email;
    this.clearAlert();
    this.showScreen(screen);
    if (this.modal) {
      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove('active');
      document.body.style.overflow = '';
    }
    this.stopOtpCountdown();
  }

  showScreen(screen) {
    this.currentScreen = screen;
    this.clearAlert();

    // Toggle tab active states
    if (this.tabsContainer) {
      if (screen === 'signin' || screen === 'register') {
        this.tabsContainer.style.display = 'flex';
        this.tabSigninBtn.classList.toggle('active', screen === 'signin');
        this.tabRegisterBtn.classList.toggle('active', screen === 'register');
      } else {
        this.tabsContainer.style.display = 'none';
      }
    }

    // Toggle screens
    const screens = [
      { id: 'signin', el: this.screenSignin, title: 'Welcome Back' },
      { id: 'register', el: this.screenRegister, title: 'Create Research Account' },
      { id: 'otp', el: this.screenOtp, title: 'Email OTP Verification' },
      { id: 'forgot', el: this.screenForgot, title: 'Reset Your Password' },
    ];

    screens.forEach((s) => {
      if (s.el) {
        s.el.classList.toggle('active', s.id === screen);
        if (s.id === screen && this.modalTitle) {
          this.modalTitle.textContent = s.title;
        }
      }
    });

    if (screen === 'otp') {
      if (this.otpEmailDisplay) {
        this.otpEmailDisplay.textContent = this.pendingEmail || 'your email';
      }
      this.clearOtpInputs();
      this.startOtpCountdown();
      if (this.otpInputs[0]) this.otpInputs[0].focus();
    }
  }

  evaluatePasswordStrength(password) {
    if (!this.strengthFill || !this.strengthLabel) return;

    if (!password) {
      this.strengthFill.className = 'strength-meter-fill';
      this.strengthLabel.textContent = '';
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    this.strengthFill.className = 'strength-meter-fill';
    if (score <= 1) {
      this.strengthFill.classList.add('weak');
      this.strengthLabel.textContent = 'Weak password';
      this.strengthLabel.style.color = '#ff6b6b';
    } else if (score === 2) {
      this.strengthFill.classList.add('fair');
      this.strengthLabel.textContent = 'Fair password';
      this.strengthLabel.style.color = '#fcc419';
    } else if (score === 3) {
      this.strengthFill.classList.add('good');
      this.strengthLabel.textContent = 'Good password';
      this.strengthLabel.style.color = '#74c0fc';
    } else {
      this.strengthFill.classList.add('strong');
      this.strengthLabel.textContent = 'Strong password';
      this.strengthLabel.style.color = '#51cf66';
    }
  }

  startOtpCountdown() {
    this.stopOtpCountdown();
    this.otpSecondsLeft = 60;
    if (this.otpResendBtn) this.otpResendBtn.disabled = true;
    this.updateOtpTimerDisplay();

    this.otpCountdownInterval = setInterval(() => {
      this.otpSecondsLeft -= 1;
      this.updateOtpTimerDisplay();
      if (this.otpSecondsLeft <= 0) {
        this.stopOtpCountdown();
        if (this.otpResendBtn) this.otpResendBtn.disabled = false;
      }
    }, 1000);
  }

  stopOtpCountdown() {
    if (this.otpCountdownInterval) {
      clearInterval(this.otpCountdownInterval);
      this.otpCountdownInterval = null;
    }
  }

  updateOtpTimerDisplay() {
    if (this.otpTimerText) {
      this.otpTimerText.textContent = `${this.otpSecondsLeft}s`;
    }
  }

  clearOtpInputs() {
    this.otpInputs.forEach((inp) => (inp.value = ''));
  }

  showAlert(type, message) {
    if (!this.alertBox || !this.alertText) return;
    this.alertBox.className = `auth-alert ${type} visible`;
    this.alertText.textContent = message;
  }

  clearAlert() {
    if (this.alertBox) {
      this.alertBox.className = 'auth-alert';
      this.alertBox.classList.remove('visible');
    }
  }

  setButtonLoading(button, isLoading, text = '') {
    if (!button) return;
    button.disabled = isLoading;
    if (isLoading) {
      button.dataset.originalText = button.innerHTML;
      button.innerHTML = `<span class="spinner"></span> <span>${text || 'Processing...'}</span>`;
    } else if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }

  // --- Submission Handlers ---

  async handleSigninSubmit(e) {
    e.preventDefault();
    this.clearAlert();

    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showAlert('error', 'Please enter a valid email address.');
      return;
    }
    if (!password) {
      this.showAlert('error', 'Please enter your account password.');
      return;
    }

    this.setButtonLoading(submitBtn, true, 'Signing in...');

    try {
      const response = await api.login({ email, password });
      this.showAlert('success', response.message || 'Authentication successful.');
      this.currentUser = response.user;
      localStorage.setItem('fracture_ai_user', JSON.stringify(response.user));
      this.updateNavForSession();

      setTimeout(() => {
        this.closeModal();
      }, 1000);
    } catch (err) {
      if (err.data && err.data.requireOtp) {
        this.pendingEmail = err.data.email || email;
        this.showAlert('info', err.message);
        setTimeout(() => {
          this.showScreen('otp');
        }, 1200);
      } else {
        this.showAlert('error', err.message || 'Unable to sign in. Please verify your credentials.');
      }
    } finally {
      this.setButtonLoading(submitBtn, false);
    }
  }

  async handleRegisterSubmit(e) {
    e.preventDefault();
    this.clearAlert();

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    const terms = document.getElementById('register-terms').checked;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!name || name.length < 2) {
      this.showAlert('error', 'Please enter your full name (at least 2 characters).');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showAlert('error', 'Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      this.showAlert('error', 'Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      this.showAlert('error', 'Passwords do not match. Please re-enter.');
      return;
    }
    if (!terms) {
      this.showAlert('error', 'You must agree to the Terms of Use and Medical Disclaimer.');
      return;
    }

    this.setButtonLoading(submitBtn, true, 'Creating Account...');

    try {
      const response = await api.register({
        name,
        email,
        password,
        termsAccepted: terms,
      });

      this.pendingEmail = email;
      this.showAlert('success', response.message || 'Account initiated.');

      setTimeout(() => {
        this.showScreen('otp');
        if (response.devHint) {
          this.showAlert('info', response.devHint);
        }
      }, 1200);
    } catch (err) {
      this.showAlert('error', err.message || 'Registration failed.');
    } finally {
      this.setButtonLoading(submitBtn, false);
    }
  }

  async handleOtpSubmit(e) {
    e.preventDefault();
    this.clearAlert();

    const otpCode = this.otpInputs.map((i) => i.value.trim()).join('');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (otpCode.length !== 6) {
      this.showAlert('error', 'Please enter the complete 6-digit verification code.');
      return;
    }

    this.setButtonLoading(submitBtn, true, 'Verifying Code...');

    try {
      const response = await api.verifyOtp(this.pendingEmail, otpCode);
      this.showAlert('success', response.message || 'Email verified successfully!');
      this.currentUser = response.user;
      localStorage.setItem('fracture_ai_user', JSON.stringify(response.user));
      this.updateNavForSession();

      setTimeout(() => {
        this.closeModal();
      }, 1200);
    } catch (err) {
      this.showAlert('error', err.message || 'Invalid or expired OTP code.');
    } finally {
      this.setButtonLoading(submitBtn, false);
    }
  }

  async handleResendOtp() {
    if (this.otpSecondsLeft > 0) return;
    this.clearAlert();

    try {
      const response = await api.sendOtp(this.pendingEmail, 'resend');
      this.showAlert('success', response.message || 'New OTP dispatched.');
      this.clearOtpInputs();
      this.startOtpCountdown();
      if (response.devHint) {
        setTimeout(() => this.showAlert('info', response.devHint), 1500);
      }
    } catch (err) {
      this.showAlert('error', err.message || 'Failed to dispatch new OTP.');
    }
  }

  async handleForgotSubmit(e) {
    e.preventDefault();
    this.clearAlert();

    const email = document.getElementById('forgot-email').value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showAlert('error', 'Please enter a valid email address.');
      return;
    }

    this.setButtonLoading(submitBtn, true, 'Sending Instructions...');

    try {
      const response = await api.forgotPassword(email);
      this.showAlert('success', response.message || 'Reset link sent.');
      setTimeout(() => {
        this.showScreen('signin');
        this.showAlert('info', 'Check your inbox for password reset instructions.');
      }, 2000);
    } catch (err) {
      this.showAlert('error', err.message || 'Failed to process password reset request.');
    } finally {
      this.setButtonLoading(submitBtn, false);
    }
  }
}

export const authController = new AuthController();
