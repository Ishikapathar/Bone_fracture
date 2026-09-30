# FractureAI — Premium Bone Fracture Detection Landing Page

FractureAI is an educational AI research prototype and healthcare landing page designed to explore intelligent bone fracture screening using deep convolutional neural networks (CNNs) and transfer learning.

---

## 1. Architecture & Tech Stack

This project is built using modular standard web technologies without heavy frontend frameworks:
- **HTML5:** Semantic, accessible layout with Schema.org JSON-LD structured data.
- **CSS3:** Custom design system featuring dark navy backgrounds (`#07111F`, `#0C192A`), electric cyan accents (`#39D5FF`), glassmorphism cards, scanline animations, and full `prefers-reduced-motion` compliance.
- **JavaScript (ES Modules):** Clean, modular interactions across auth controllers, geolocation/map directories, educational modals, and API services.
- **Node.js & Express (`server.ts`):** Serves authentic RESTful authentication and health endpoints, ready for SMTP/Nodemailer and deep learning integration.
- **Google Fonts:** Inter (Body) & Space Grotesk (Headings).

---

## 2. Project Structure

```
fracture-ai/
├── public/
│   └── images/
│       ├── hero_xray_forearm.jpg       # Clinical forearm X-ray radiograph
│       └── orthopedic_care_map.jpg     # Orthopedic directory map illustration
├── src/
│   ├── css/
│   │   ├── styles.css                  # Core design tokens, layout & responsive grid
│   │   ├── animations.css              # Keyframes, scanning beam & scroll reveals
│   │   └── auth.css                    # Auth modal dialogs, OTP inputs & meters
│   └── js/
│       ├── main.js                     # Central application entry point & event coordinator
│       ├── api.js                      # Configurable HTTP client & endpoint contracts
│       ├── auth.js                     # Sign In, Register, 6-digit OTP & Forgot Password
│       ├── doctors.js                  # Geolocation & verified Google Maps specialist search
│       ├── awareness.js                # Bone health educational tips modal
│       └── animations.js               # IntersectionObserver and scroll tracking
├── index.html                          # Landing page entry point
├── server.ts                           # Express server with auth endpoints & Vite dev middleware
├── package.json                        # Scripts & dependencies
├── .env.example                        # Environment variables template
└── README.md                           # Documentation
```

---

## 3. Backend API Endpoints & Contract Specification

All authentication requests run through `src/js/api.js` to `/api/auth/*`.

### `POST /api/auth/register`
- **Request Body:**
  ```json
  {
    "name": "Dr. Jane Doe",
    "email": "jane@hospital.org",
    "password": "SecurePassword123!",
    "termsAccepted": true
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account registered. Verification code has been dispatched to your email.",
    "email": "jane@hospital.org",
    "requireOtp": true
  }
  ```

### `POST /api/auth/send-otp`
- **Request Body:**
  ```json
  {
    "email": "jane@hospital.org",
    "reason": "resend"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "A fresh 6-digit verification code has been dispatched."
  }
  ```

### `POST /api/auth/verify-otp`
- **Request Body:**
  ```json
  {
    "email": "jane@hospital.org",
    "otp": "492817"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Email address verified successfully. Welcome to FractureAI!",
    "token": "tok_usr_123456789",
    "user": {
      "id": "usr_123456789",
      "name": "Dr. Jane Doe",
      "email": "jane@hospital.org",
      "isVerified": true
    }
  }
  ```

### `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "email": "jane@hospital.org",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Signed in successfully.",
    "token": "tok_usr_123456789",
    "user": {
      "id": "usr_123456789",
      "name": "Dr. Jane Doe",
      "email": "jane@hospital.org"
    }
  }
  ```

### `POST /api/auth/forgot-password`
- **Request Body:**
  ```json
  {
    "email": "jane@hospital.org"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password reset instructions have been dispatched to your email address."
  }
  ```

### `POST /api/auth/logout`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Session terminated successfully."
  }
  ```

---

## 4. Connecting Nodemailer & SMTP in Production

When deploying with a live email delivery provider (SendGrid, AWS SES, Resend, or standard SMTP):
1. Configure credentials in `.env`:
   ```bash
   SMTP_HOST="smtp.yourprovider.com"
   SMTP_PORT=587
   SMTP_USER="apikey"
   SMTP_PASS="YOUR_SECRET_KEY"
   ```
2. Install Nodemailer:
   ```bash
   npm install nodemailer @types/nodemailer
   ```
3. In `server.ts`, import `nodemailer` and create a transporter:
   ```typescript
   import nodemailer from 'nodemailer';

   const transporter = nodemailer.createTransporter({
     host: process.env.SMTP_HOST,
     port: parseInt(process.env.SMTP_PORT || '587'),
     secure: process.env.SMTP_SECURE === 'true',
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
     },
   });

   async function sendOtpEmail(to: string, otp: string) {
     await transporter.sendMail({
       from: process.env.SMTP_FROM || '"FractureAI Security" <notifications@fractureai.org>',
       to,
       subject: `Your FractureAI Verification Code: ${otp}`,
       text: `Your 6-digit verification code is: ${otp}. It expires in 10 minutes.`,
     });
   }
   ```

---

## 5. Connecting the Deep Learning Model Later

The detection portal is designed to connect to a Python/PyTorch inference microservice or ONNX Web Runtime:
1. Radiograph preprocessing in `src/js/main.js` normalizes contrast and resizes images to `224x224` or `512x512`.
2. Connect `POST /api/detection/predict` to forward the multipart radiograph to your trained ResNet-50 / DenseNet-121 CNN.
3. Return Grad-CAM saliency coordinates to overlay directly on the canvas preview.

---

## 6. Running the Project Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (runs Express + Vite on port 3000)
npm run dev

# 3. Open in your browser
http://localhost:3000
```

---

## 7. Mandatory Medical Disclaimer

> **Notice:** FractureAI is an educational AI research prototype. Its output is not a medical diagnosis and must not replace evaluation by a qualified healthcare professional.
