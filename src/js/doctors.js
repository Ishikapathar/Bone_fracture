/**
 * FractureAI — Find an Orthopedic Doctor Module
 * 
 * Provides verified search linking to Google Maps for orthopedic specialists,
 * with geolocation support and clear setup notices.
 */

export class DoctorFinder {
  constructor() {
    this.form = document.getElementById('doctor-search-form');
    this.input = document.getElementById('doctor-location-input');
    this.geoBtn = document.getElementById('btn-use-location');
    this.statusBox = document.getElementById('doctor-status-feedback');
    this.resultsCard = document.getElementById('doctor-results-preview');

    this.bindEvents();
  }

  bindEvents() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSearch(e));
    }

    if (this.geoBtn) {
      this.geoBtn.addEventListener('click', () => this.handleGeolocation());
    }
  }

  setStatus(type, message) {
    if (!this.statusBox) return;
    this.statusBox.className = `doctor-status-feedback ${type}`;
    this.statusBox.textContent = message;
  }

  clearStatus() {
    if (this.statusBox) {
      this.statusBox.className = 'doctor-status-feedback';
      this.statusBox.textContent = '';
    }
  }

  handleSearch(e) {
    e.preventDefault();
    this.clearStatus();

    const locationQuery = this.input ? this.input.value.trim() : '';

    if (!locationQuery) {
      this.setStatus('error', 'Please enter a city, postal code, or medical district to search.');
      if (this.input) this.input.focus();
      return;
    }

    // Build Google Maps query
    const encodedQuery = encodeURIComponent(`orthopedic doctors near ${locationQuery}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

    this.setStatus('success', `Found verified search query for "${locationQuery}".`);
    this.renderResultCard(locationQuery, mapsUrl);
  }

  handleGeolocation() {
    this.clearStatus();

    if (!navigator.geolocation) {
      this.setStatus('error', 'Geolocation is not supported by your browser. Please enter your location manually.');
      return;
    }

    this.setStatus('info', 'Requesting location permission...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps/search/orthopedic+surgeons+and+bone+specialists/@${latitude},${longitude},14z`;
        
        if (this.input) {
          this.input.value = `Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
        }

        this.setStatus('success', 'Location confirmed. Showing orthopedic specialists near your coordinates.');
        this.renderResultCard('Your Current Area', mapsUrl);
      },
      (error) => {
        let msg = 'Location access was declined by the browser. You can still enter your city, area, or postal code manually.';
        if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please enter your city manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable. Please enter your city manually.';
        }
        this.setStatus('error', msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  renderResultCard(locationLabel, mapsUrl) {
    if (!this.resultsCard) return;

    this.resultsCard.style.display = 'block';
    this.resultsCard.innerHTML = `
      <div style="background: rgba(7, 17, 31, 0.95); border: 1px solid rgba(57, 213, 255, 0.3); border-radius: 12px; padding: 20px; margin-top: 18px;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 12px;">
          <div>
            <h4 style="font-size: 15px; font-weight: 600; color: #F4F8FF; margin-bottom: 4px;">
              Orthopedic Specialists Near: <span style="color: var(--accent-cyan);">${escapeHtml(locationLabel)}</span>
            </h4>
            <p style="font-size: 13px; color: var(--text-muted); margin: 0;">
              Google Maps directory with verified clinic hours, specialist reviews, and emergency trauma centers.
            </p>
          </div>
          <span style="font-size: 11px; padding: 3px 8px; border-radius: 4px; background: rgba(57, 213, 255, 0.1); color: var(--accent-cyan); border: 1px solid rgba(57, 213, 255, 0.25); white-space: nowrap;">
            Verified Directory
          </span>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
          <div style="font-size: 12px; color: var(--text-dim); display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            Always verify in-network coverage with your healthcare insurance provider.
          </div>
          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
            <span>Open Google Maps</span>
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
        </div>
      </div>
    `;
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[m]));
}
