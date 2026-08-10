if (!customElements.get('testimonials-slider')) {
  class TestimonialsSlider extends HTMLElement {
    constructor() {
      super();
      this.track = this.querySelector('[data-testimonials-track]');
      this.prevBtn = this.querySelector('[data-testimonials-prev]');
      this.nextBtn = this.querySelector('[data-testimonials-next]');
      this.dotsContainer = this.querySelector('[data-testimonials-dots]');
      
      this.autoRotate = this.dataset.autorotate === 'true';
      this.autoRotateSpeed = (parseInt(this.dataset.speed, 10) || 5) * 1000;
      this.timer = null;
    }

    connectedCallback() {
      if (!this.track) return;

      this.cards = Array.from(this.track.children);
      if (this.cards.length === 0) return;

      if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.scrollPrev());
      if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.scrollNext());

      this.track.addEventListener('scroll', () => this.onScroll(), { passive: true });

      this.createDots();
      this.updateState();

      if (this.autoRotate) {
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

    createDots() {
      if (!this.dotsContainer || this.cards.length <= 1) return;
      this.dotsContainer.innerHTML = '';
      
      const cardsPerView = this.getCardsPerView();
      const dotCount = Math.ceil(this.cards.length / cardsPerView);

      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'testimonials-dot' + (i === 0 ? ' testimonials-dot--active' : '');
        dot.setAttribute('aria-label', `Testimonio página ${i + 1}`);
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
      const cardWidth = this.cards[0].offsetWidth;
      const gap = 24;
      this.track.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
    }

    scrollNext() {
      const cardWidth = this.cards[0].offsetWidth;
      const gap = 24;
      
      // If at end, loop back to start
      const maxScrollLeft = this.track.scrollWidth - this.track.clientWidth;
      if (this.track.scrollLeft >= maxScrollLeft - 10) {
        this.track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        this.track.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
      }
    }

    scrollToGroup(groupIndex) {
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
      const scrollLeft = this.track.scrollLeft;
      const maxScrollLeft = this.track.scrollWidth - this.track.clientWidth;

      if (this.prevBtn) {
        this.prevBtn.disabled = scrollLeft <= 5;
      }
      if (this.nextBtn) {
        this.nextBtn.disabled = scrollLeft >= maxScrollLeft - 5;
      }

      // Update active dot
      if (this.dotsContainer) {
        const dots = Array.from(this.dotsContainer.children);
        if (dots.length > 0) {
          const cardsPerView = this.getCardsPerView();
          const cardWidth = this.cards[0].offsetWidth + 24;
          const currentIndex = Math.round(scrollLeft / (cardWidth * cardsPerView));
          
          dots.forEach((dot, idx) => {
            dot.classList.toggle('testimonials-dot--active', idx === Math.min(currentIndex, dots.length - 1));
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
