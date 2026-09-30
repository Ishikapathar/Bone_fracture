/**
 * FractureAI — Main JavaScript Entry Point
 * 
 * Coordinates navigation, modals, detection preview portal, legal dialogs,
 * and initializes submodules.
 */

import { initAnimations } from './animations.js';
import { authController } from './auth.js';
import { DoctorFinder } from './doctors.js';
import { AwarenessController } from './awareness.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize animations and observers
  initAnimations();

  // 2. Initialize Doctor Finder
  new DoctorFinder();

  // 3. Initialize Awareness Modal
  new AwarenessController();

  // 4. Mobile Navigation Hamburger
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.contains('open');
      if (isOpen) {
        mobileDrawer.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      } else {
        mobileDrawer.classList.add('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
      }
    });

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 5. Auth Trigger Buttons
  const openSigninBtns = document.querySelectorAll('[data-action="open-signin"]');
  openSigninBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      authController.openModal('signin');
      if (mobileDrawer) mobileDrawer.classList.remove('open');
    });
  });

  const openRegisterBtns = document.querySelectorAll('[data-action="open-register"]');
  openRegisterBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      authController.openModal('register');
      if (mobileDrawer) mobileDrawer.classList.remove('open');
    });
  });

  // 6. Detection Entry Point Modal ("Start Detection" & "Explore Detection")
  const detectionModal = document.getElementById('detection-modal');
  const detectionTriggers = document.querySelectorAll('[data-action="open-detection"]');
  const detectionCloseBtns = document.querySelectorAll('[data-dismiss="detection-modal"]');
  const xrayFileInput = document.getElementById('xray-file-input');
  const xrayDropzone = document.getElementById('xray-dropzone');
  const xrayPreviewContainer = document.getElementById('xray-preview-container');
  const xrayPreviewImg = document.getElementById('xray-preview-img');
  const xrayAnalysisStatus = document.getElementById('xray-analysis-status');
  const btnResetUpload = document.getElementById('btn-reset-upload');

  const openDetectionModal = () => {
    if (detectionModal) {
      detectionModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (mobileDrawer) mobileDrawer.classList.remove('open');
    }
  };

  const closeDetectionModal = () => {
    if (detectionModal) {
      detectionModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  detectionTriggers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openDetectionModal();
    });
  });

  detectionCloseBtns.forEach((btn) => {
    btn.addEventListener('click', () => closeDetectionModal());
  });

  // File Upload Preview & Pipeline demonstration
  if (xrayDropzone && xrayFileInput) {
    xrayDropzone.addEventListener('click', () => {
      xrayFileInput.click();
    });

    xrayDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      xrayDropzone.classList.add('dragover');
    });

    xrayDropzone.addEventListener('dragleave', () => {
      xrayDropzone.classList.remove('dragover');
    });

    xrayDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      xrayDropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    xrayFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    if (!file.type.match('image.*')) {
      alert('Please upload an image file (DICOM, PNG, or JPEG format).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (xrayPreviewImg) xrayPreviewImg.src = e.target.result;
      if (xrayDropzone) xrayDropzone.style.display = 'none';
      if (xrayPreviewContainer) xrayPreviewContainer.style.display = 'block';

      if (xrayAnalysisStatus) {
        xrayAnalysisStatus.innerHTML = `
          <div style="background: rgba(57, 213, 255, 0.08); border: 1px solid rgba(57, 213, 255, 0.25); border-radius: 8px; padding: 12px 16px; margin-top: 14px; font-size: 13px; color: #d7e8ff;">
            <strong>Uploaded:</strong> ${escapeHtml(file.name)} (${(file.size / 1024).toFixed(1)} KB)<br>
            <span style="color: var(--accent-cyan);">Client-side preprocessing complete.</span> Ready for CNN inference when the trained deep learning weight pipeline is connected.
          </div>
        `;
      }
    };
    reader.readAsDataURL(file);
  }

  if (btnResetUpload) {
    btnResetUpload.addEventListener('click', () => {
      if (xrayFileInput) xrayFileInput.value = '';
      if (xrayPreviewImg) xrayPreviewImg.src = '';
      if (xrayPreviewContainer) xrayPreviewContainer.style.display = 'none';
      if (xrayDropzone) xrayDropzone.style.display = 'block';
      if (xrayAnalysisStatus) xrayAnalysisStatus.innerHTML = '';
    });
  }

  // 7. Legal Modals (Privacy Policy, Terms of Use, Medical Disclaimer)
  setupGenericModal('modal-privacy', '[data-action="open-privacy"]', '[data-dismiss="modal-privacy"]');
  setupGenericModal('modal-terms', '[data-action="open-terms"]', '[data-dismiss="modal-terms"]');
  setupGenericModal('modal-disclaimer', '[data-action="open-disclaimer"]', '[data-dismiss="modal-disclaimer"]');

  function setupGenericModal(modalId, triggerSelector, dismissSelector) {
    const modal = document.getElementById(modalId);
    const triggers = document.querySelectorAll(triggerSelector);
    const dismisses = document.querySelectorAll(dismissSelector);

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (modal) {
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    dismisses.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });
  }

  // 8. Global Escape key closes any active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModals = document.querySelectorAll('.modal-overlay.active');
      activeModals.forEach((modal) => {
        modal.classList.remove('active');
      });
      document.body.style.overflow = '';
      authController.stopOtpCountdown();
    }
  });

  // 9. Backdrop click closes modal
  const allModalOverlays = document.querySelectorAll('.modal-overlay');
  allModalOverlays.forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        authController.stopOtpCountdown();
      }
    });
  });

  console.log('[FractureAI] Frontend modules loaded successfully.');
});

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[m]));
}
