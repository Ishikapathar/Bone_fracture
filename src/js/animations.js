/**
 * FractureAI — Animations & Scroll Observer Module
 * 
 * Provides smooth scroll observation, navbar active section tracking,
 * and responsive micro-interactions.
 */

export function initAnimations() {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Navbar background styling on scroll
  const siteHeader = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (siteHeader) {
      if (window.scrollY > 30) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
    }
  }, { passive: true });

  // 2. Scroll-triggered reveal animations
  const revealElements = document.querySelectorAll('.reveal-init');
  if (!isReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1,
    });

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    // If reduced motion or observer not supported, immediately display
    revealElements.forEach((el) => el.classList.add('reveal-visible'));
  }

  // 3. Navigation active section indicator
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href === `#${currentId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, {
      rootMargin: '-30% 0px -60% 0px',
      threshold: 0,
    });

    sections.forEach((section) => navObserver.observe(section));
  }

  // 4. Image fallback protection for Hero X-Ray visual
  const heroXrayImg = document.getElementById('hero-xray-img');
  const xrayFallback = document.getElementById('hero-xray-fallback');

  if (heroXrayImg && xrayFallback) {
    heroXrayImg.addEventListener('error', () => {
      heroXrayImg.style.display = 'none';
      xrayFallback.classList.add('active');
    });
  }
}
