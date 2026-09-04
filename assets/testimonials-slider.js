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
      this.productMap = {};
    }

    connectedCallback() {
      if (!this.track) return;

      const mapEl = this.section?.querySelector('[data-tc-products]');
      if (mapEl) {
        try {
          this.productMap = JSON.parse(mapEl.textContent || '{}');
        } catch (_) {}
      }

      // Inject any locally submitted reviews by the current user
      this.injectLocalReviews();

      // Load live reviews from Judge.me API widgets and deduplicate local reviews
      this.loadJudgeMeReviews();

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

    decodeHtml(html) {
      if (!html) return '';
      const txt = document.createElement('textarea');
      txt.innerHTML = html;
      return txt.value;
    }

    normalizeString(str) {
      return (str || '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/&amp;/g, '')
        .replace(/&/g, '')
        .replace(/[^a-z0-9]/g, '');
    }

    getProductUrl(productTitle = '', rawUrl = '') {
      if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() !== '') {
        return rawUrl.trim();
      }
      if (!productTitle || typeof productTitle !== 'string') return '';
      const decoded = this.decodeHtml(productTitle).trim();
      if (!decoded) return '';

      const lower = decoded.toLowerCase();
      if (lower === 'contrario brand' || lower === 'general store review') {
        return '/collections/all';
      }

      // 1. Direct match in product map
      if (this.productMap && this.productMap[decoded]) {
        return this.productMap[decoded];
      }

      // 2. Normalized match in product map
      if (this.productMap) {
        const norm = this.normalizeString(decoded);
        for (const [title, url] of Object.entries(this.productMap)) {
          if (this.normalizeString(title) === norm) {
            return url;
          }
        }
      }

      // 3. Fallback handle slug generator
      const slug = decoded
        .toLowerCase()
        .replace(/&/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      return slug ? `/products/${slug}` : '';
    }

    isMatchForCurrentProduct({ productId = '', productTitle = '', productUrl = '' }) {
      if (!this.section) return false;
      const currentProdId = this.section.dataset.currentProductId;
      const currentProdTitle = this.section.dataset.currentProductTitle || '';
      const currentProdHandle = this.section.dataset.currentProductHandle || '';

      // 1. Check product ID
      if (productId && currentProdId && String(productId) === String(currentProdId)) {
        return true;
      }

      // 2. Check title normalized
      const normReviewTitle = this.normalizeString(this.decodeHtml(productTitle));
      const normCurrentTitle = this.normalizeString(currentProdTitle);
      if (normReviewTitle && normCurrentTitle && normReviewTitle === normCurrentTitle) {
        return true;
      }

      // 3. Check resolved URL / handle
      const resolvedUrl = (productUrl || this.getProductUrl(productTitle) || '').toLowerCase();
      const cleanHandle = currentProdHandle.toLowerCase();
      if (cleanHandle && (resolvedUrl.includes('/products/' + cleanHandle) || resolvedUrl.endsWith('/' + cleanHandle))) {
        return true;
      }

      return false;
    }

    createReviewCard({ rating = 5, quote = '', author = 'MEMBER', verified = true, productTitle = '', productUrl = '', isUserSubmission = false }) {
      const card = document.createElement('div');
      card.className = 'tc-card tc-card--clean' + (isUserSubmission ? ' tc-card--user-submission' : '');
      if (author) card.dataset.author = author.trim().toLowerCase();

      let starsHtml = '';
      const ratingNum = parseInt(rating, 10) || 5;
      for (let i = 1; i <= 5; i++) {
        if (i <= ratingNum) {
          starsHtml += '<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
        } else {
          starsHtml += '<svg viewBox="0 0 24 24" style="opacity: 0.25;"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>';
        }
      }

      const safeQuote = this.escapeHtml(quote);
      const safeAuthor = this.escapeHtml(author);
      const cleanProductTitle = this.decodeHtml(productTitle).trim();
      const safeProduct = this.escapeHtml(cleanProductTitle);
      const resolvedProductUrl = this.getProductUrl(cleanProductTitle, productUrl);
      const initial = safeAuthor.charAt(0).toUpperCase() || 'M';

      let productTagHtml = '';
      if (safeProduct) {
        if (resolvedProductUrl) {
          productTagHtml = `
            <a href="${resolvedProductUrl}" class="tc-product-tag" title="View ${safeProduct}">
              <span>🏷️ ${safeProduct}</span>
            </a>
          `;
        } else {
          productTagHtml = `
            <span class="tc-product-tag">
              <span>🏷️ ${safeProduct}</span>
            </span>
          `;
        }
      }

      card.innerHTML = `
        <div class="tc-card__header">
          <div class="tc-stars" aria-label="${ratingNum} out of 5 stars">${starsHtml}</div>
          <svg class="tc-quote-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
          </svg>
        </div>
        <div class="tc-card__body">
          ${isUserSubmission ? '<span class="tc-user-badge">YOUR REVIEW (PENDING APPROVAL)</span>' : ''}
          <p class="tc-text">“${safeQuote}”</p>
          ${productTagHtml}
        </div>
        <div class="tc-card__footer">
          <div class="tc-avatar"><span>${initial}</span></div>
          <div class="tc-author-meta">
            <div class="tc-author-name-wrap">
              <h3 class="tc-author-name">${safeAuthor}</h3>
              ${verified ? `
                <span class="tc-verified-badge" title="Verified Buyer">
                  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </span>` : ''}
            </div>
            <p class="tc-author-info">${isUserSubmission ? 'RECENT BUYER' : (verified ? 'VERIFIED BUYER' : 'MEMBER')}</p>
          </div>
        </div>
      `;
      return card;
    }

    injectLocalReviews() {
      if (!this.grid) return;
      try {
        const rawReviews = localStorage.getItem('contrario_user_reviews');
        if (!rawReviews) return;
        const reviews = JSON.parse(rawReviews);
        if (!Array.isArray(reviews) || reviews.length === 0) return;

        const isProductPage = this.section?.dataset.isProductPage === 'true';
        const filterCurrentProduct = this.section?.dataset.filterCurrentProduct === 'true';
        const emptyState = this.track.querySelector('.tc-empty-state');
        let injectedCount = 0;

        reviews.reverse().forEach((item) => {
          if (isProductPage && filterCurrentProduct) {
            const isMatch = this.isMatchForCurrentProduct({
              productId: item.productId,
              productTitle: item.productTitle,
              productUrl: item.productUrl
            });
            if (!isMatch) return;
          }

          const card = this.createReviewCard({
            rating: item.rating,
            quote: item.quote,
            author: item.author || 'You',
            verified: true,
            productTitle: item.productTitle,
            productUrl: item.productUrl || this.getProductUrl(item.productTitle),
            isUserSubmission: true
          });

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

    deduplicateLocalReviews(liveAuthorNames) {
      if (!liveAuthorNames || liveAuthorNames.length === 0) return;
      try {
        const rawReviews = localStorage.getItem('contrario_user_reviews');
        if (!rawReviews) return;
        const reviews = JSON.parse(rawReviews);
        if (!Array.isArray(reviews) || reviews.length === 0) return;

        const filtered = reviews.filter(rev => {
          const authorLower = (rev.author || '').trim().toLowerCase();
          return !liveAuthorNames.includes(authorLower);
        });

        if (filtered.length === 0) {
          localStorage.removeItem('contrario_user_reviews');
        } else {
          localStorage.setItem('contrario_user_reviews', JSON.stringify(filtered));
        }

        // Remove any duplicate pending cards from the DOM
        this.grid.querySelectorAll('.tc-card--user-submission').forEach(card => {
          const cardAuthor = (card.dataset.author || '').trim().toLowerCase();
          if (liveAuthorNames.includes(cardAuthor)) {
            card.remove();
          }
        });
      } catch (err) {
        console.warn('Deduplicate error:', err);
      }
    }

    async loadJudgeMeReviews() {
      if (!this.grid) return;
      const shopDomain = this.section?.dataset.shopDomain || 'contrario-brand.myshopify.com';
      const judgemeToken = this.section?.dataset.judgemeToken || window.jdgmSettings?.apiToken || '0bAfNHnpbeSdGq2XlrWZNa3Ehj4';
      if (!shopDomain || !judgemeToken) return;

      const isProductPage = this.section?.dataset.isProductPage === 'true';
      const filterCurrentProduct = this.section?.dataset.filterCurrentProduct === 'true';
      const currentProdHandle = this.section?.dataset.currentProductHandle;
      const emptyState = this.track.querySelector('.tc-empty-state');
      const loadedAuthors = [];
      const seenReviewIds = new Set();

      try {
        // Strategy 1: If on product page with filter, query Judge.me product review widget
        if (isProductPage && filterCurrentProduct && currentProdHandle) {
          const widgetUrl = `https://judge.me/api/v1/widgets/product_review?api_token=${encodeURIComponent(judgemeToken)}&shop_domain=${encodeURIComponent(shopDomain)}&handle=${encodeURIComponent(currentProdHandle)}`;
          const widgetRes = await fetch(widgetUrl);
          if (widgetRes.ok) {
            const widgetData = await widgetRes.json();
            if (widgetData?.widget) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(widgetData.widget, 'text/html');
              const reviewItems = doc.querySelectorAll('.jdgm-rev');

              if (reviewItems && reviewItems.length > 0) {
                reviewItems.forEach((revEl) => {
                  const reviewId = revEl.getAttribute('data-review-id');
                  if (reviewId && seenReviewIds.has(reviewId)) return;

                  const rating = parseInt(revEl.querySelector('.jdgm-rev__rating')?.getAttribute('data-score') || '5', 10);
                  const author = revEl.querySelector('.jdgm-rev__author')?.textContent?.trim() || 'Customer';
                  const title = revEl.querySelector('.jdgm-rev__title')?.textContent?.trim() || '';
                  const body = revEl.querySelector('.jdgm-rev__body')?.textContent?.trim() || '';
                  const verified = !revEl.classList.contains('jdgm--unverified');
                  const productTitle = revEl.getAttribute('data-product-title') || this.section?.dataset.currentProductTitle || '';
                  const productUrl = revEl.getAttribute('data-product-url') || '';

                  if (reviewId) seenReviewIds.add(reviewId);
                  loadedAuthors.push(author.toLowerCase());

                  const card = this.createReviewCard({
                    rating,
                    quote: body || title || '',
                    author,
                    verified,
                    productTitle,
                    productUrl,
                    isUserSubmission: false
                  });
                  this.grid.appendChild(card);
                });
              }
            }
          }
        }

        // Strategy 2: Query Judge.me featured_carousel widget
        // If on product page with filterCurrentProduct: ONLY keep reviews belonging to this product!
        // If not filtering by product: show all reviews.
        const carouselUrl = `https://judge.me/api/v1/widgets/featured_carousel?api_token=${encodeURIComponent(judgemeToken)}&shop_domain=${encodeURIComponent(shopDomain)}`;
        const carouselRes = await fetch(carouselUrl);
        if (carouselRes.ok) {
          const carouselData = await carouselRes.json();
          if (carouselData?.featured_carousel) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(carouselData.featured_carousel, 'text/html');
            const items = doc.querySelectorAll('.jdgm-carousel-item');

            if (items && items.length > 0) {
              items.forEach((itemEl) => {
                const reviewId = itemEl.getAttribute('data-review-id');
                if (reviewId && seenReviewIds.has(reviewId)) return;

                const prodImg = itemEl.querySelector('.jdgm-carousel-item__product-image');
                const rawProductTitle = prodImg ? prodImg.getAttribute('alt') : (itemEl.classList.contains('jdgm--shop-review') ? 'CONTRARIO BRAND' : '');
                const productTitle = this.decodeHtml(rawProductTitle || '');
                const productLinkEl = itemEl.querySelector('a');
                const productUrl = productLinkEl ? productLinkEl.getAttribute('href') : '';

                if (isProductPage && filterCurrentProduct) {
                  const isMatch = this.isMatchForCurrentProduct({
                    productTitle,
                    productUrl
                  });
                  if (!isMatch) {
                    return; // Skip review from different product!
                  }
                }

                const starsCount = itemEl.querySelectorAll('.jdgm-star.jdgm--on').length || 5;
                const author = itemEl.querySelector('.jdgm-carousel-item__reviewer-name')?.textContent?.trim() || 'Customer';
                const title = itemEl.querySelector('.jdgm-carousel-item__review-title')?.textContent?.trim() || '';
                const body = itemEl.querySelector('.jdgm-carousel-item__review-body')?.textContent?.trim() || '';

                if (reviewId) seenReviewIds.add(reviewId);
                loadedAuthors.push(author.toLowerCase());

                const card = this.createReviewCard({
                  rating: starsCount,
                  quote: body || title || '',
                  author,
                  verified: true,
                  productTitle,
                  productUrl,
                  isUserSubmission: false
                });
                this.grid.appendChild(card);
              });
            }
          }
        }

        this.deduplicateLocalReviews(loadedAuthors);
        this.updateCards();

        if (this.cards.length > 0) {
          if (emptyState) emptyState.style.display = 'none';
        } else {
          if (emptyState) emptyState.style.display = 'flex';
        }

        this.createDots();
        this.updateState();
      } catch (err) {
        console.warn('Judge.me reviews fetch error:', err);
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
  // Clean up any lingering contact_posted=true from URL so reload doesn't trigger modal
  if (window.location.search.includes('contact_posted=true')) {
    const cleanSearch = window.location.search
      .replace(/[?&]contact_posted=true(&|$)/, '$1')
      .replace(/[?&]$/, '');
    const cleanUrl = window.location.pathname + (cleanSearch ? '?' + cleanSearch.replace(/^[?&]/, '') : '');
    window.history.replaceState({}, document.title, cleanUrl);
  }

  // Modal triggers
  document.querySelectorAll('[data-tc-modal-open]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute('data-tc-modal-open');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
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

  // Handle product select change to sync ID and title
  document.querySelectorAll('[data-product-select]').forEach((select) => {
    const parentForm = select.closest('form');
    const titleInput = parentForm?.querySelector('[data-product-title]');
    const idInput = parentForm?.querySelector('[data-product-id]');

    select.addEventListener('change', () => {
      const opt = select.options[select.selectedIndex];
      if (titleInput) titleInput.value = opt ? (opt.dataset.title || '') : '';
      if (idInput) idInput.value = opt ? opt.value : '';
    });
  });

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

  // Form submission: async AJAX send to Judge.me & Shopify without reloading or URL redirect
  document.querySelectorAll('.tc-review-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('.tc-btn--submit');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>SUBMITTING...</span>';
      }

      try {
        const author = form.querySelector('[data-author-input]')?.value?.trim();
        const quote = form.querySelector('[data-quote-input]')?.value?.trim();
        const rating = form.querySelector('[data-rating-input]')?.value || '5';
        const productTitle = form.querySelector('[data-product-title]')?.value?.trim();
        const productId = form.querySelector('[data-product-id]')?.value;
        const email = form.querySelector('[data-email-input]')?.value?.trim();

        if (author && quote) {
          // 1. Dispatch to Judge.me API
          const modal = form.closest('.tc-modal');
          const section = modal ? document.getElementById(modal.id.replace('TestimonialsModal-', 'TestimonialsContrario-')) : null;
          const shopDomain = section?.dataset.shopDomain || 'contrario-brand.myshopify.com';
          const apiToken = section?.dataset.judgemeToken || '0bAfNHnpbeSdGq2XlrWZNa3Ehj4';

          if (shopDomain && apiToken) {
            const payload = new URLSearchParams();
            payload.append('api_token', apiToken);
            payload.append('shop_domain', shopDomain);
            payload.append('platform', 'shopify');
            if (productId) payload.append('id', productId);
            payload.append('name', author);
            if (email) payload.append('email', email);
            payload.append('rating', rating);
            payload.append('body', quote);

            fetch('https://judge.me/api/v1/reviews', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: payload.toString()
            }).then(r => r.json()).then(data => {
              console.log('Judge.me review submitted:', data);
            }).catch(err => console.warn('Judge.me submit error:', err));
          }

          // 2. Send Shopify contact form asynchronously in background
          try {
            const formData = new FormData(form);
            fetch(form.action || '/contact', {
              method: 'POST',
              body: formData
            }).catch(() => {});
          } catch (_) {}

          // 3. Show smooth success notification inside modal
          let statusBox = modal.querySelector('.tc-form-status--success');
          if (!statusBox) {
            statusBox = document.createElement('div');
            statusBox.className = 'tc-form-status tc-form-status--success';
            statusBox.innerHTML = `
              <div class="tc-form-status__icon">✓</div>
              <div>
                <strong>Thank you for your review!</strong>
                <p>Your review has been submitted successfully and will be published shortly.</p>
              </div>
            `;
            form.parentNode.insertBefore(statusBox, form);
          } else {
            statusBox.style.display = 'flex';
          }

          form.style.display = 'none';

          // 4. Save review in localStorage
          const isProductPage = section?.dataset.isProductPage === 'true';
          const filterCurrentProduct = section?.dataset.filterCurrentProduct === 'true';
          const slider = section?.querySelector('testimonials-slider');
          const resolvedProductUrl = isProductPage ? window.location.pathname : (slider ? slider.getProductUrl(productTitle) : '');

          const newReview = {
            author,
            quote,
            rating,
            productTitle: productTitle || '',
            productId: productId || '',
            productUrl: resolvedProductUrl,
            createdAt: Date.now(),
          };

          const raw = localStorage.getItem('contrario_user_reviews');
          let list = [];
          if (raw) {
            try { list = JSON.parse(raw) || []; } catch (_) {}
          }
          list.push(newReview);
          localStorage.setItem('contrario_user_reviews', JSON.stringify(list));

          // 5. Update slider immediately
          if (slider) {
            const isMatch = !isProductPage || !filterCurrentProduct || slider.isMatchForCurrentProduct({
              productId,
              productTitle,
              productUrl: resolvedProductUrl
            });

            if (isMatch) {
              const newCard = slider.createReviewCard({
                rating,
                quote,
                author: author || 'You',
                verified: true,
                productTitle: productTitle || '',
                productUrl: resolvedProductUrl,
                isUserSubmission: true
              });
              slider.grid.prepend(newCard);
              const emptyState = slider.track.querySelector('.tc-empty-state');
              if (emptyState) emptyState.style.display = 'none';
              slider.updateCards();
              slider.createDots();
              slider.updateState();
            }
          }

          // Auto-close modal after 3 seconds without altering page URL
          setTimeout(() => {
            closeModal(modal);
            setTimeout(() => {
              form.reset();
              form.style.display = '';
              if (statusBox) statusBox.remove();
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
              }
            }, 400);
          }, 3000);
        }
      } catch (err) {
        console.warn('Review submission error:', err);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  });
});
