/**
 * FractureAI — Bone Health Awareness & Education Module
 * 
 * Manages the expanded Bone Health Tips modal with structured, medically responsible
 * educational content.
 */

export class AwarenessController {
  constructor() {
    this.modal = document.getElementById('awareness-modal');
    this.openBtn = document.getElementById('btn-open-awareness-modal');
    this.closeBtns = document.querySelectorAll('[data-dismiss="awareness-modal"]');

    this.bindEvents();
  }

  bindEvents() {
    if (this.openBtn) {
      this.openBtn.addEventListener('click', () => this.openModal());
    }

    this.closeBtns.forEach((btn) => {
      btn.addEventListener('click', () => this.closeModal());
    });
  }

  openModal() {
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
  }
}
