// Set current year in footer
document.addEventListener('DOMContentLoaded', () => {
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
  // Copy ETH address to clipboard
  const copyBtn = document.getElementById('copy-btn');
  const ethAddressSpan = document.getElementById('eth-address');
  if (copyBtn && ethAddressSpan) {
    copyBtn.addEventListener('click', () => {
      const addr = ethAddressSpan.textContent.trim();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(addr).then(() => {
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = 'Copy address';
            copyBtn.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('Copy failed', err);
        });
      }
    });
  }

  // Simple hero slider logic
  const heroSlides = document.querySelectorAll('.hero-slide');
  let currentHeroIndex = 0;
  if (heroSlides.length > 1) {
    setInterval(() => {
      heroSlides[currentHeroIndex].classList.remove('active');
      currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
      heroSlides[currentHeroIndex].classList.add('active');
    }, 8000); // change slide every 8 seconds
  }

  // Attempt to play looping background audio at a moderate volume
  const bgAudio = document.getElementById('background-audio');
  if (bgAudio) {
    try {
      bgAudio.volume = 0.5;
      const playPromise = bgAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay might be blocked by the browser; user interaction will trigger it later.
        });
      }
    } catch (e) {
      console.warn('Background audio could not play automatically', e);
    }
  }
});