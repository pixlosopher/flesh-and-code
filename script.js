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
    }, 10000); // change slide every 10 seconds for smoother transitions
  }

      // Preload all hero videos and ensure they loop seamlessly
      const heroVideos = document.querySelectorAll('.hero-slide video');
      heroVideos.forEach((video) => {
        // Explicitly set loop property to true (redundant with attribute but ensures behaviour)
        video.loop = true;
        // Ensure the video is loaded ahead of time
        video.preload = 'auto';
        // Kick off loading and handle any errors
        const promise = video.play();
        if (promise !== undefined) {
          promise.catch(() => {
            // ignore autoplay failures; will be started by user interaction or slider activation
          });
        }
        // Restart video on end if loop fails for any reason
        video.addEventListener('ended', () => {
          video.currentTime = 0;
          video.play();
        });
      });

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