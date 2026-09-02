if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');
        if (!this.elements.thumbnails) return;

        this.elements.viewer.addEventListener('slideChanged', debounce(this.onSlideChanged.bind(this), 500));

        const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

        this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
          const button = mediaToSwitch.querySelector('button');
          if (!button) return;

          const targetMediaId = mediaToSwitch.dataset.target;

          // Click trigger (supports touch and manual clicks)
          button.addEventListener('click', () => {
            this.setActiveMedia(targetMediaId, false, true);
          });

          // Apple Design: Instant, zero-latency tactile hover response for mouse / trackpad
          button.addEventListener('pointerenter', (event) => {
            if (event.pointerType === 'mouse' || event.pointerType === 'pen' || isFinePointer.matches) {
              this.setActiveMedia(targetMediaId, false, false);
            }
          });

          // Focus trigger for keyboard navigation
          button.addEventListener('focus', () => {
            if (isFinePointer.matches) {
              this.setActiveMedia(targetMediaId, false, false);
            }
          });
        });

        const prevBtn = this.elements.viewer.querySelector('button[name="previous"]');
        const nextBtn = this.elements.viewer.querySelector('button[name="next"]');
        if (prevBtn) {
          prevBtn.addEventListener('click', (e) => {
            if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) {
              e.preventDefault();
              e.stopPropagation();
              this.stepActiveMedia(-1);
            }
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener('click', (e) => {
            if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) {
              e.preventDefault();
              e.stopPropagation();
              this.stepActiveMedia(1);
            }
          });
        }

        if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) this.removeListSemantic();
      }

      stepActiveMedia(direction) {
        const mediaItems = Array.from(this.elements.viewer.querySelectorAll('li.product__media-item[data-media-id]'));
        if (mediaItems.length <= 1) return;
        const currentIndex = mediaItems.findIndex((item) => item.classList.contains('is-active'));
        const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
        let newIndex = (safeCurrentIndex + direction + mediaItems.length) % mediaItems.length;
        const targetMediaId = mediaItems[newIndex].dataset.mediaId;
        this.setActiveMedia(targetMediaId, false, true);
      }

      onSlideChanged(event) {
        const thumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${event.detail.currentElement.dataset.mediaId}"]`
        );
        this.setActiveThumbnail(thumbnail);
      }

      setActiveMedia(mediaId, prepend, shouldScroll = true) {
        const activeMedia =
          this.elements.viewer.querySelector(`li.product__media-item[data-media-id="${mediaId}"]`) ||
          this.elements.viewer.querySelector('li.product__media-item[data-media-id]');
        if (!activeMedia) {
          return;
        }

        // Avoid redundant animations and re-renders if already active
        if (activeMedia.classList.contains('is-active') && !prepend) {
          return;
        }

        this.elements.viewer.querySelectorAll('li.product__media-item').forEach((element) => {
          element.classList.remove('is-active');
        });
        activeMedia.classList.add('is-active');

        if (prepend) {
          activeMedia.parentElement.firstChild !== activeMedia && activeMedia.parentElement.prepend(activeMedia);

          if (this.elements.thumbnails) {
            const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
            if (activeThumbnail) {
              activeThumbnail.parentElement.firstChild !== activeThumbnail && activeThumbnail.parentElement.prepend(activeThumbnail);
            }
          }

          if (this.elements.viewer.slider) this.elements.viewer.resetPages();
        }

        this.preventStickyHeader();
        window.setTimeout(() => {
          if (!this.mql.matches || this.elements.thumbnails) {
            activeMedia.parentElement.scrollTo({ left: activeMedia.offsetLeft });
          }
          if (shouldScroll) {
            const activeMediaRect = activeMedia.getBoundingClientRect();
            // Don't scroll if the image is already in view
            if (activeMediaRect.top > -0.5) return;
            const top = activeMediaRect.top + window.scrollY;
            window.scrollTo({ top: top, behavior: 'smooth' });
          }
        });
        this.playActiveMedia(activeMedia);

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
        if (activeThumbnail) {
          this.setActiveThumbnail(activeThumbnail);
          this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
        }
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        thumbnail.querySelector('button')?.setAttribute('aria-current', true);

        if (this.dataset.desktopLayout === 'thumbnail_left' && this.mql.matches) {
          thumbnail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return;
        }

        if (this.elements.thumbnails.isSlideVisible && this.elements.thumbnails.isSlideVisible(thumbnail, 10)) return;

        if (this.elements.thumbnails.slider) {
          this.elements.thumbnails.slider.scrollTo({ left: thumbnail.offsetLeft });
        }
      }

      announceLiveRegion(activeItem, position) {
        const image = activeItem.querySelector('.product__modal-opener--image img');
        if (!image) return;
        image.onload = () => {
          this.elements.liveRegion.setAttribute('aria-hidden', false);
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace('[index]', position);
          setTimeout(() => {
            this.elements.liveRegion.setAttribute('aria-hidden', true);
          }, 2000);
        };
        image.src = image.src;
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems.forEach((slide) => slide.setAttribute('role', 'presentation'));
      }
    }
  );
}
