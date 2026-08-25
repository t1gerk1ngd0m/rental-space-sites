(function () {
  'use strict';

  // ===== Header scroll state =====
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ===== Lightbox for gallery (vertical scroll through all photos) =====
  const galleryItems = Array.from(document.querySelectorAll('[data-gallery-item]'));
  if (galleryItems.length > 0) {
    const sources = galleryItems.map(el => ({
      src: el.dataset.full || el.style.backgroundImage.replace(/url\(["']?(.+?)["']?\)/, '$1'),
      alt: el.getAttribute('aria-label') || ''
    }));

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="閉じる">✕</button>
      <div class="lightbox-counter"><span class="current">1</span> / <span class="total">${sources.length}</span></div>
      <div class="lightbox-track"></div>
    `;
    document.body.appendChild(lightbox);

    const track = lightbox.querySelector('.lightbox-track');
    const currentEl = lightbox.querySelector('.current');
    const imgEls = sources.map(s => {
      const img = document.createElement('img');
      img.alt = s.alt;
      img.loading = 'lazy';
      img.src = s.src;
      track.appendChild(img);
      return img;
    });

    const close = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    const open = i => {
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
      // Jump (no animation) to the clicked photo once layout is ready
      window.requestAnimationFrame(() => {
        const target = imgEls[i];
        if (target) lightbox.scrollTop = target.offsetTop - 16;
        currentEl.textContent = String(i + 1);
      });
    };

    // Counter: a reference line slides top→bottom as you scroll, so the very
    // top reads 1 and the very bottom reads the last photo (where several end
    // up visible at once and can no longer be scrolled to the top).
    let ticking = false;
    const updateCounter = () => {
      const max = lightbox.scrollHeight - lightbox.clientHeight;
      const frac = max > 0 ? lightbox.scrollTop / max : 0;
      const anchor = lightbox.scrollTop + frac * (lightbox.clientHeight - 1);
      let best = 0;
      for (let i = 0; i < imgEls.length; i++) {
        if (imgEls[i].offsetTop <= anchor) best = i;
        else break;
      }
      currentEl.textContent = String(best + 1);
    };
    lightbox.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateCounter();
        ticking = false;
      });
    }, { passive: true });

    galleryItems.forEach((el, i) => {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click', () => open(i));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(i);
        }
      });
    });

    lightbox.querySelector('.lightbox-close').addEventListener('click', close);

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') close();
    });
  }

  // ===== Mobile gallery carousel counter =====
  const galleryEl = document.querySelector('.gallery');
  const counterCurrent = document.querySelector('[data-gallery-counter] .current');
  if (galleryEl && counterCurrent) {
    const items = galleryEl.querySelectorAll('.gallery-item');
    const updateCounter = () => {
      if (!items.length) return;
      const step = items[0].getBoundingClientRect().width + 10; // slide width + gap
      if (step <= 0) return;
      const i = Math.round(galleryEl.scrollLeft / step);
      counterCurrent.textContent = String(Math.min(Math.max(i + 1, 1), items.length));
    };
    let ticking = false;
    galleryEl.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateCounter();
        ticking = false;
      });
    }, { passive: true });
    updateCounter();
  }

  // ===== Video placeholder click → load embed =====
  document.querySelectorAll('[data-video-embed]').forEach(wrap => {
    const placeholder = wrap.querySelector('.video-placeholder');
    if (!placeholder) return;
    placeholder.addEventListener('click', () => {
      const src = wrap.dataset.videoEmbed;
      if (!src) return;
      const iframe = document.createElement('iframe');
      iframe.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.title = '行き方動画';
      placeholder.replaceWith(iframe);
    });
  });
})();
