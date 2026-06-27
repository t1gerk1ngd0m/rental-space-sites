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

  // ===== Lightbox for gallery =====
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
      <button class="lightbox-prev" aria-label="前の画像">‹</button>
      <button class="lightbox-next" aria-label="次の画像">›</button>
      <img alt="" />
      <div class="lightbox-counter"><span class="current">1</span> / <span class="total">${sources.length}</span></div>
    `;
    document.body.appendChild(lightbox);

    const imgEl = lightbox.querySelector('img');
    const currentEl = lightbox.querySelector('.current');
    let idx = 0;

    const show = i => {
      idx = (i + sources.length) % sources.length;
      imgEl.src = sources[idx].src;
      imgEl.alt = sources[idx].alt;
      currentEl.textContent = String(idx + 1);
    };

    const open = i => {
      show(i);
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

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
    lightbox.querySelector('.lightbox-prev').addEventListener('click', () => show(idx - 1));
    lightbox.querySelector('.lightbox-next').addEventListener('click', () => show(idx + 1));
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });

    // Touch swipe
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lightbox.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx > 0) show(idx - 1);
        else show(idx + 1);
      }
    }, { passive: true });
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
