if (!customElements.get('testimonials-slider')) {
  class TestimonialsSlider extends HTMLElement {
    constructor() {
      super();
      this.track = this.querySelector('[data-testimonials-track]');
      this.grid = this.querySelector('.testimonials-contrario__grid');
      this.prevBtn = this.querySelector('[data-testimonials-prev]');
      this.nextBtn = this.querySelector('[data-testimonials-next]');
      this.dotsContainer = this.querySelector('[data-testimonials-dots]');
      this.section = this.closest('.testimonials-contrario');

      this.autoRotate = this.dataset.autorotate === 'true';
      this.autoRotateSpeed = (parseInt(this.dataset.speed, 10) || 5) * 1000;
      this.timer = null;
    }

    connectedCallback() {
      if (!this.track) return;

      // Inject any locally submitted reviews by the current user
      this.injectLocalReviews();

      this.updateCards();
      if (this.cards.length === 0) return;

      if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.scrollPrev());
      if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.scrollNext());

      this.track.addEventListener('scroll', () => this.onScroll(), { passive: true });

      this.createDots();
      this.updateState();

      if (this.autoRotate && this.cards.length > 1) {
        this.startAutoRotate();
        this.addEventListener('mouseenter', () => this.stopAutoRotate());
        this.addEventListener('mouseleave', () => this.startAutoRotate());
        this.addEventListener('touchstart', () => this.stopAutoRotate(), { passive: true });
      }

      // Handle Shopify Theme Editor events
      document.addEventListener('shopify:block:select', (e) => {
        if (this.contains(e.target)) {
          this.scrollToCard(e.target);
        }
      });
    }

    updateCards() {
      this.cards = Array.from(this.track.querySelectorAll('.tc-card'));
    }

    injectLocalReviews() {
      if (!this.grid) return;
      try {
        const rawReviews = localStorage.getItem('contrario_user_reviews');
        if (!rawReviews) return;
        const reviews = JSON.parse(rawReviews);
        if (!Array.isArray(reviews) || reviews.length === 0) return;

        const isProductPage = this.section?.dataset.isProductPage === 'true';
        const currentProdId = this.section?.dataset.currentProductId;
        const currentProdTitle = this.section?.dataset.currentProductTitle;

        // Hide empty state if present
        const emptyState = this.track.querySelector('.tc-empty-state');

        let injectedCount = 0;
        reviews.reverse().forEach((item) => {
          if (isProductPage && currentProdId) {
            const matchesId = item.productId && String(item.productId) === String(currentProdId);
            const matchesTitle = item.productTitle && currentProdTitle && item.productTitle.trim().toLowerCase() === currentProdTitle.trim().toLowerCase();
            if (!matchesId && !matchesTitle) return;
          }

          // Generate card element
          const card = document.createElement('div');
          card.className = 'tc-card tc-card--clean tc-card--user-submission';

          let starsHtml = '';
          const ratingNum = parseInt(item.rating, 10) || 5;
          for (let i = 1; i <= 5; i++) {
            if (i <= ratingNum) {
              starsHtml += '<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
            } else {
              starsHtml += '<svg viewBox="0 0 24 24" style="opacity: 0.25;"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>';
            }
          }

          const safeQuote = this.escapeHtml(item.quote || '');
          const safeAuthor = this.escapeHtml(item.author || 'You');
          const safeProduct = this.escapeHtml(item.productTitle || '');
          const initial = safeAuthor.charAt(0).toUpperCase() || 'Y';

          card.innerHTML = `
            <div class="tc-card__header">
              <div class="tc-stars" aria-label="${ratingNum} out of 5 stars">${starsHtml}</div>
              <svg class="tc-quote-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
              </svg>
            </div>
            <div class="tc-card__body">
              <span class="tc-user-badge">YOUR REVIEW (PENDING APPROVAL)</span>
              <p class="tc-text">“${safeQuote}”</p>
              ${safeProduct ? `<span class="tc-product-tag"><span>🏷️ ${safeProduct}</span></span>` : ''}
            </div>
            <div class="tc-card__footer">
              <div class="tc-avatar"><span>${initial}</span></div>
              <div class="tc-author-meta">
                <div class="tc-author-name-wrap">
                  <h3 class="tc-author-name">${safeAuthor}</h3>
                  <span class="tc-verified-badge" title="Verified Buyer">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  </span>
                </div>
                <p class="tc-author-info">RECENT BUYER</p>
              </div>
            </div>
          `;

          this.grid.prepend(card);
          injectedCount++;
        });

        if (injectedCount > 0 && emptyState) {
          emptyState.style.display = 'none';
        }
      } catch (err) {
        console.warn('Contrario reviews storage:', err);
      }
    }

    escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    createDots() {
      if (!this.dotsContainer || this.cards.length <= 1) {
        if (this.dotsContainer) this.dotsContainer.innerHTML = '';
        return;
      }
      this.dotsContainer.innerHTML = '';

      const cardsPerView = this.getCardsPerView();
      const dotCount = Math.ceil(this.cards.length / cardsPerView);

      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'tc-dot' + (i === 0 ? ' tc-dot--active' : '');
        dot.setAttribute('aria-label', `Page ${i + 1}`);
        dot.addEventListener('click', () => this.scrollToGroup(i));
        this.dotsContainer.appendChild(dot);
      }
    }

    getCardsPerView() {
      const width = window.innerWidth;
      const cols = parseInt(this.dataset.colsDesktop, 10) || 3;
      if (width < 600) return 1;
      if (width < 990) return Math.min(2, cols);
      return cols;
    }

    scrollPrev() {
      this.updateCards();
      if (this.cards.length === 0) return;
      const cardWidth = this.cards[0].offsetWidth;
      const gap = 24;
      this.track.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
    }

    scrollNext() {
      this.updateCards();
      if (this.cards.length === 0) return;
      const cardWidth = this.cards[0].offsetWidth;
      const gap = 24;

      const maxScrollLeft = this.track.scrollWidth - this.track.clientWidth;
      if (this.track.scrollLeft >= maxScrollLeft - 10) {
        this.track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        this.track.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
      }
    }

    scrollToGroup(groupIndex) {
      this.updateCards();
      const cardsPerView = this.getCardsPerView();
      const targetCardIndex = Math.min(groupIndex * cardsPerView, this.cards.length - 1);
      this.scrollToCard(this.cards[targetCardIndex]);
    }

    scrollToCard(card) {
      if (!card) return;
      this.track.scrollTo({ left: card.offsetLeft - this.track.offsetLeft, behavior: 'smooth' });
    }

    onScroll() {
      this.updateState();
    }

    updateState() {
      if (!this.track) return;
      this.updateCards();
      if (this.cards.length === 0) return;

      const scrollLeft = this.track.scrollLeft;
      const maxScrollLeft = this.track.scrollWidth - this.track.clientWidth;

      if (this.prevBtn) {
        this.prevBtn.disabled = scrollLeft <= 5;
      }
      if (this.nextBtn) {
        this.nextBtn.disabled = scrollLeft >= maxScrollLeft - 5;
      }

      if (this.dotsContainer) {
        const dots = Array.from(this.dotsContainer.children);
        if (dots.length > 0) {
          const cardsPerView = this.getCardsPerView();
          const cardWidth = this.cards[0].offsetWidth + 24;
          const currentIndex = Math.round(scrollLeft / (cardWidth * cardsPerView));

          dots.forEach((dot, idx) => {
            dot.classList.toggle('tc-dot--active', idx === Math.min(currentIndex, dots.length - 1));
          });
        }
      }
    }

    startAutoRotate() {
      this.stopAutoRotate();
      this.timer = setInterval(() => this.scrollNext(), this.autoRotateSpeed);
    }

    stopAutoRotate() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }

  customElements.define('testimonials-slider', TestimonialsSlider);
}

// Global modal and interactive rating controller
document.addEventListener('DOMContentLoaded', () => {
  // Modal triggers
  document.querySelectorAll('[data-tc-modal-open]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute('data-tc-modal-open');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        const firstInput = modal.querySelector('input:not([type="hidden"]), textarea');
        if (firstInput) setTimeout(() => firstInput.focus(), 150);
      }
    });
  });

  const closeModal = (modal) => {
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.tc-modal').forEach((modal) => {
    modal.querySelectorAll('[data-tc-modal-close]').forEach((closeBtn) => {
      closeBtn.addEventListener('click', () => closeModal(modal));
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.tc-modal:not([hidden])');
      if (openModal) closeModal(openModal);
    }
  });

  // Auto-open modal if form returned with success or error message
  const statusSuccess = document.querySelector('.tc-form-status--success');
  if (statusSuccess) {
    const parentModal = statusSuccess.closest('.tc-modal');
    if (parentModal) {
      parentModal.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  // Interactive Star Rating Pickers
  document.querySelectorAll('[data-rating-picker]').forEach((picker) => {
    const input = picker.querySelector('[data-rating-input]');
    const feedback = picker.querySelector('[data-rating-feedback]');
    const buttons = Array.from(picker.querySelectorAll('.tc-star-btn'));

    const setRating = (val) => {
      if (input) input.value = val;
      if (feedback) feedback.textContent = `${val} out of 5 stars`;

      buttons.forEach((b, idx) => {
        const starVal = idx + 1;
        b.classList.toggle('is-active', starVal <= val);
        b.classList.remove('is-hovered');
      });
    };

    buttons.forEach((btn) => {
      const val = parseInt(btn.dataset.starValue, 10);

      btn.addEventListener('mouseenter', () => {
        buttons.forEach((b, idx) => {
          b.classList.toggle('is-hovered', idx + 1 <= val);
        });
      });

      picker.addEventListener('mouseleave', () => {
        const currentVal = parseInt(input?.value, 10) || 5;
        buttons.forEach((b, idx) => {
          b.classList.remove('is-hovered');
          b.classList.toggle('is-active', idx + 1 <= currentVal);
        });
      });

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        setRating(val);
      });
    });
  });

  // Form submission: save user review in localStorage for instant local feedback
  document.querySelectorAll('.tc-review-form').forEach((form) => {
    form.addEventListener('submit', () => {
      try {
        const author = form.querySelector('[data-author-input]')?.value?.trim();
        const quote = form.querySelector('[data-quote-input]')?.value?.trim();
        const rating = form.querySelector('[data-rating-input]')?.value;
        const productTitle = form.querySelector('[data-product-title]')?.value?.trim();
        const productId = form.querySelector('[data-product-id]')?.value;

        if (author && quote) {
          const newReview = {
            author,
            quote,
            rating: rating || 5,
            productTitle: productTitle || '',
            productId: productId || '',
            createdAt: Date.now(),
          };

          const raw = localStorage.getItem('contrario_user_reviews');
          let list = [];
          if (raw) {
            try { list = JSON.parse(raw) || []; } catch (_) {}
          }
          list.push(newReview);
          localStorage.setItem('contrario_user_reviews', JSON.stringify(list));
        }
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
    });
  });
});
