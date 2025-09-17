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
    // Fallback: on first user interaction (click), attempt to start audio if it didn't autoplay
    const tryPlayOnInteraction = () => {
      if (bgAudio.paused) {
        bgAudio.play().catch(() => {
          // still blocked
        });
      }
      // remove listener after first attempt
      document.removeEventListener('click', tryPlayOnInteraction);
    };
    document.addEventListener('click', tryPlayOnInteraction);
  }

  // Audio toggle button control
  const audioToggle = document.getElementById('audio-toggle');
  if (bgAudio && audioToggle) {
    // Initialize button label based on autoplay state
    // If the audio is paused (autoplay blocked), prompt to play
    audioToggle.textContent = bgAudio.paused ? 'Play Sound' : 'Pause Sound';
    audioToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (bgAudio.paused) {
        bgAudio.play().then(() => {
          audioToggle.textContent = 'Pause Sound';
        }).catch(() => {
          // still blocked; keep prompt to play
          audioToggle.textContent = 'Play Sound';
        });
      } else {
        bgAudio.pause();
        audioToggle.textContent = 'Play Sound';
      }
    });
  }
});