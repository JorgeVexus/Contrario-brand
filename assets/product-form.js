if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[name="add"]') || this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton?.querySelector('span');
        this.buyNowButton = this.querySelector('[data-action="buy-now"]');
        this.buyNowButtonText = this.buyNowButton?.querySelector('span');

        if (this.submitButton) {
          this.submitButton.addEventListener('click', () => {
            this._clickedSubmitter = this.submitButton;
          });
        }
        if (this.buyNowButton) {
          this.buyNowButton.addEventListener('click', () => {
            this._clickedSubmitter = this.buyNowButton;
          });
        }

        if (document.querySelector('cart-drawer') && this.submitButton) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        const submitter = evt.submitter || this._clickedSubmitter || this.submitButton;
        const isBuyNow = (submitter && (submitter.dataset.action === 'buy-now' || submitter.name === 'buy-now')) || false;
        const activeBtn = submitter || this.submitButton;

        if (activeBtn && (activeBtn.getAttribute('aria-disabled') === 'true' || activeBtn.disabled)) return;

        this.handleErrorMessage();

        if (activeBtn) {
          activeBtn.setAttribute('aria-disabled', true);
          activeBtn.classList.add('loading');
          activeBtn.querySelector('.loading__spinner')?.classList.remove('hidden');
        }

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (!formData.has('quantity')) {
          const externalQty = document.querySelector(`input[name="quantity"][form="${this.form.id}"]`);
          if (externalQty) formData.append('quantity', externalQty.value);
        }

        if (!isBuyNow && this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              if (activeBtn) {
                const soldOutMessage = activeBtn.querySelector('.sold-out-message');
                if (soldOutMessage) {
                  activeBtn.setAttribute('aria-disabled', true);
                  const span = activeBtn.querySelector('span');
                  span?.classList.add('hidden');
                  soldOutMessage.classList.remove('hidden');
                }
              }
              this.error = true;
              return;
            }

            if (isBuyNow) {
              window.location.href = window.routes?.cart_checkout_url || '/checkout';
              return;
            }

            if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            const startMarker = CartPerformance.createStartingMarker('add:wait-for-subscribers');
            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              }).then(() => {
                CartPerformance.measureFromMarker('add:wait-for-subscribers', startMarker);
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    CartPerformance.measure("add:paint-updated-sections", () => {
                      this.cart.renderContents(response);
                    });
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              CartPerformance.measure("add:paint-updated-sections", () => {
                this.cart.renderContents(response);
              });
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            if (activeBtn) {
              activeBtn.classList.remove('loading');
              if (!this.error) activeBtn.removeAttribute('aria-disabled');
              activeBtn.querySelector('.loading__spinner')?.classList.add('hidden');
            }
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');

            CartPerformance.measureFromEvent("add:user-action", evt);
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton?.setAttribute('disabled', 'disabled');
          if (text && this.submitButtonText) this.submitButtonText.textContent = text;
          if (this.buyNowButton) {
            this.buyNowButton.setAttribute('disabled', 'disabled');
            if (text && this.buyNowButtonText) this.buyNowButtonText.textContent = text;
          }
        } else {
          this.submitButton?.removeAttribute('disabled');
          if (this.submitButtonText) this.submitButtonText.textContent = window.variantStrings.addToCart;
          if (this.buyNowButton) {
            this.buyNowButton.removeAttribute('disabled');
            if (this.buyNowButtonText) {
              this.buyNowButtonText.textContent = this.buyNowButton.dataset.defaultText || 'Buy it now';
            }
          }
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}
