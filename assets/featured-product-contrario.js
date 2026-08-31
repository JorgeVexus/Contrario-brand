/**
 * Featured Product Contrario - Apple Fluid UI Interaction Controller
 */

if (!customElements.get('featured-product-contrario')) {
  class FeaturedProductContrario extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.initElements();
      this.bindEvents();
    }

    initElements() {
      this.gallery = this.querySelector('[data-fpc-gallery]');
      this.mainImages = this.querySelectorAll('[data-fpc-media-id]');
      this.thumbs = this.querySelectorAll('[data-fpc-thumb-id]');
      
      this.variantInputs = this.querySelectorAll('[data-fpc-option-input]');
      this.variantLabels = this.querySelectorAll('[data-fpc-option-selected-label]');
      this.variantsDataEl = this.querySelector('[data-fpc-variants-json]');
      this.variantsData = this.variantsDataEl ? JSON.parse(this.variantsDataEl.textContent) : [];

      this.variantIdInput = this.querySelector('input[name="id"]');
      this.priceEl = this.querySelector('[data-fpc-price]');
      this.comparePriceEl = this.querySelector('[data-fpc-compare-price]');
      this.saveBadgeEl = this.querySelector('[data-fpc-save-badge]');
      
      this.qtyMinusBtn = this.querySelector('[data-fpc-qty-minus]');
      this.qtyPlusBtn = this.querySelector('[data-fpc-qty-plus]');
      this.qtyInput = this.querySelector('[data-fpc-qty-input]');
      
      this.buyBtn = this.querySelector('[data-fpc-buy-btn]');
      this.buyBtnText = this.querySelector('[data-fpc-btn-text]');
      this.form = this.querySelector('form');

      this.accordionHeaders = this.querySelectorAll('[data-fpc-accordion-header]');
    }

    bindEvents() {
      // Thumbnail clicks
      if (this.thumbs) {
        this.thumbs.forEach((thumb) => {
          thumb.addEventListener('click', (e) => {
            const mediaId = thumb.dataset.fpcThumbId;
            this.switchMedia(mediaId);
          });
        });
      }

      // Variant radio changes
      if (this.variantInputs) {
        this.variantInputs.forEach((input) => {
          input.addEventListener('change', () => {
            this.onVariantChange();
          });
        });
      }

      // Quantity controls
      if (this.qtyMinusBtn && this.qtyPlusBtn && this.qtyInput) {
        this.qtyMinusBtn.addEventListener('click', () => {
          const val = parseInt(this.qtyInput.value, 10) || 1;
          if (val > 1) {
            this.qtyInput.value = val - 1;
          }
        });

        this.qtyPlusBtn.addEventListener('click', () => {
          const val = parseInt(this.qtyInput.value, 10) || 1;
          this.qtyInput.value = val + 1;
        });
      }

      // Accordion toggles
      if (this.accordionHeaders) {
        this.accordionHeaders.forEach((header) => {
          header.addEventListener('click', () => {
            const item = header.closest('.fpc-accordion-item');
            const content = item.querySelector('.fpc-accordion-content');
            const isOpen = item.classList.contains('is-open');

            // Close all others
            this.querySelectorAll('.fpc-accordion-item').forEach((otherItem) => {
              if (otherItem !== item) {
                otherItem.classList.remove('is-open');
                const otherContent = otherItem.querySelector('.fpc-accordion-content');
                if (otherContent) otherContent.style.maxHeight = null;
              }
            });

            if (isOpen) {
              item.classList.remove('is-open');
              content.style.maxHeight = null;
            } else {
              item.classList.add('is-open');
              content.style.maxHeight = content.scrollHeight + 'px';
            }
          });
        });
      }

      // Form submission (Ajax Add to Cart)
      if (this.form) {
        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
      }
    }

    switchMedia(mediaId) {
      if (!mediaId) return;

      // Update active thumbnail
      this.thumbs.forEach((thumb) => {
        if (thumb.dataset.fpcThumbId === String(mediaId)) {
          thumb.classList.add('is-active');
        } else {
          thumb.classList.remove('is-active');
        }
      });

      // Update active main image
      this.mainImages.forEach((imgWrap) => {
        if (imgWrap.dataset.fpcMediaId === String(mediaId)) {
          imgWrap.classList.add('is-active');
        } else {
          imgWrap.classList.remove('is-active');
        }
      });
    }

    getSelectedOptions() {
      const selectedOptions = [];
      const optionGroups = this.querySelectorAll('[data-fpc-option-group]');

      optionGroups.forEach((group, index) => {
        const checkedInput = group.querySelector('input:checked');
        if (checkedInput) {
          selectedOptions.push(checkedInput.value);

          // Update header label
          const label = group.querySelector('[data-fpc-option-selected-label]');
          if (label) {
            label.textContent = checkedInput.value;
          }
        }
      });

      return selectedOptions;
    }

    onVariantChange() {
      if (!this.variantsData || this.variantsData.length === 0) return;

      const selectedOptions = this.getSelectedOptions();
      
      const currentVariant = this.variantsData.find((variant) => {
        return variant.options.every((optValue, index) => optValue === selectedOptions[index]);
      });

      if (!currentVariant) {
        // Variant combination does not exist
        if (this.buyBtn) {
          this.buyBtn.setAttribute('disabled', 'disabled');
          if (this.buyBtnText) this.buyBtnText.textContent = 'UNAVAILABLE';
        }
        return;
      }

      // Update variant ID
      if (this.variantIdInput) {
        this.variantIdInput.value = currentVariant.id;
      }

      // Update price
      if (this.priceEl) {
        this.priceEl.textContent = this.formatMoney(currentVariant.price);
      }

      // Update compare-at price
      if (this.comparePriceEl) {
        if (currentVariant.compare_at_price && currentVariant.compare_at_price > currentVariant.price) {
          this.comparePriceEl.textContent = this.formatMoney(currentVariant.compare_at_price);
          this.comparePriceEl.style.display = 'inline';
          if (this.saveBadgeEl) this.saveBadgeEl.style.display = 'inline-block';
        } else {
          this.comparePriceEl.style.display = 'none';
          if (this.saveBadgeEl) this.saveBadgeEl.style.display = 'none';
        }
      }

      // Update media if variant has featured media
      if (currentVariant.featured_media && currentVariant.featured_media.id) {
        this.switchMedia(currentVariant.featured_media.id);
      } else if (currentVariant.featured_image && currentVariant.featured_image.id) {
        this.switchMedia(currentVariant.featured_image.id);
      }

      // Update Add to Cart button state
      if (this.buyBtn && this.buyBtnText) {
        if (currentVariant.available) {
          this.buyBtn.removeAttribute('disabled');
          this.buyBtnText.textContent = 'ADD TO CART';
        } else {
          this.buyBtn.setAttribute('disabled', 'disabled');
          this.buyBtnText.textContent = 'SOLD OUT';
        }
      }
    }

    formatMoney(cents) {
      if (window.Shopify && Shopify.formatMoney) {
        return Shopify.formatMoney(cents);
      }
      return '$' + (cents / 100).toFixed(2);
    }

    handleFormSubmit(e) {
      e.preventDefault();
      if (!this.buyBtn || this.buyBtn.hasAttribute('disabled')) return;

      this.buyBtn.classList.add('is-loading');

      const formData = new FormData(this.form);
      const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');

      if (cart) {
        formData.append(
          'sections',
          cart.getSectionsToRender().map((section) => section.id)
        );
        formData.append('sections_url', window.location.pathname);
      }

      const fetchUrl = (window.routes && window.routes.cart_add_url) ? window.routes.cart_add_url : '/cart/add.js';

      fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/javascript'
        },
        body: formData
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.status && response.status === 422) {
            alert(response.description || 'Error adding product to cart.');
            return;
          }

          // Publish event for global subscribers (if theme uses pubsub)
          if (window.PUB_SUB_EVENTS && window.publish) {
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'featured-product-contrario',
              productVariantId: formData.get('id'),
              cartData: response,
            });
          }

          // Open cart drawer or redirect
          if (cart) {
            cart.renderContents(response);
          } else {
            window.location = (window.routes && window.routes.cart_url) ? window.routes.cart_url : '/cart';
          }
        })
        .catch((err) => {
          console.error('Error adding to cart:', err);
        })
        .finally(() => {
          this.buyBtn.classList.remove('is-loading');
        });
    }
  }

  customElements.define('featured-product-contrario', FeaturedProductContrario);
}
