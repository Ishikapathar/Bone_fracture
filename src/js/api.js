/**
 * FractureAI — API Client Module
 * 
 * Provides clean HTTP contracts for user authentication, OTP verification,
 * and service health monitoring.
 */

export const API_BASE_URL = window.location.origin;

/**
 * Generic request helper with robust error handling and network status checking.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.message || `Server responded with status ${response.status}`;
      const err = new Error(errorMessage);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const networkError = new Error(
        'Unable to connect to the FractureAI backend server. Please verify the Express backend is running on port 3000.'
      );
      networkError.isOffline = true;
      throw networkError;
    }
    throw err;
  }
}

/**
 * Register a new user account.
 * Contract: POST /api/auth/register
 * Payload: { name, email, password, termsAccepted }
 */
export async function register(userData) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/**
 * Send or resend a 6-digit email OTP.
 * Contract: POST /api/auth/send-otp
 * Payload: { email, reason?: string }
 */
export async function sendOtp(email, reason = 'verification') {
  return request('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email, reason }),
  });
}

/**
 * Verify a 6-digit email OTP.
 * Contract: POST /api/auth/verify-otp
 * Payload: { email, otp }
 */
export async function verifyOtp(email, otp) {
  return request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

/**
 * User sign in.
 * Contract: POST /api/auth/login
 * Payload: { email, password, rememberMe?: boolean }
 */
export async function login(credentials) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

/**
 * Request password reset instructions.
 * Contract: POST /api/auth/forgot-password
 * Payload: { email }
 */
export async function forgotPassword(email) {
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Terminate current session.
 * Contract: POST /api/auth/logout
 */
export async function logout() {
  return request('/api/auth/logout', {
    method: 'POST',
  });
}

/**
 * Check backend health & availability.
 * Contract: GET /api/health
 */
export async function checkHealth() {
  return request('/api/health', {
    method: 'GET',
  });
}
