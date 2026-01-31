// ============================================
// FLESH & CODE - Interactive Script
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // ============================================
  // CUSTOM CURSOR - Green Arrows with Trail
  // ============================================
  const cursor = document.querySelector('.cursor');
  const numTrails = 7;
  const trails = [];
  const trailPositions = [];

  // Create trail elements
  for (let i = 0; i < numTrails; i++) {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    trail.innerHTML = '↖';
    document.body.appendChild(trail);
    trails.push(trail);
    trailPositions.push({ x: 0, y: 0 });
  }

  if (cursor) {
    let mouseX = 0, mouseY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    });

    // Animate trailing arrows with lag effect
    function animateTrails() {
      // Each trail follows the one before it with increasing delay
      for (let i = 0; i < numTrails; i++) {
        const target = i === 0 ? { x: mouseX, y: mouseY } : trailPositions[i - 1];
        const speed = 0.15 - (i * 0.015); // Decreasing speed for more lag

        trailPositions[i].x += (target.x - trailPositions[i].x) * speed;
        trailPositions[i].y += (target.y - trailPositions[i].y) * speed;

        trails[i].style.left = trailPositions[i].x + 'px';
        trails[i].style.top = trailPositions[i].y + 'px';
      }
      requestAnimationFrame(animateTrails);
    }
    animateTrails();

    // Hover effect on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .arrow-item, .video-card, .theme-card, .feature-item, .tier-card');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(1.3)';
        trails.forEach(trail => trail.style.color = 'var(--neon-pink)');
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        trails.forEach(trail => trail.style.color = 'var(--neon-green)');
      });
    });
  }

  // ============================================
  // TYPING ANIMATION FOR TAGLINE
  // ============================================
  const taglines = [
    "Touch a screen and the screen fingerprints you back.",
    "Glitch is the stutter of hidden truth.",
    "Every pixel is a pulse in the shared ontology.",
    "The cursor is your doppelganger in exile.",
    "Latency is the gift-wrap on sensation.",
    "Code compiles first in the nervous system.",
    "Pixels kiss—compression is their bruise."
  ];

  const typingElement = document.querySelector('.typing-text');
  if (typingElement) {
    let taglineIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 50;

    function typeTagline() {
      const currentTagline = taglines[taglineIndex];

      if (isDeleting) {
        typingElement.textContent = currentTagline.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 30;
      } else {
        typingElement.textContent = currentTagline.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 50;
      }

      if (!isDeleting && charIndex === currentTagline.length) {
        typingSpeed = 3000; // Pause at end
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        taglineIndex = (taglineIndex + 1) % taglines.length;
        typingSpeed = 500; // Pause before typing next
      }

      setTimeout(typeTagline, typingSpeed);
    }

    // Start typing after a short delay
    setTimeout(typeTagline, 1000);
  }

  // ============================================
  // HERO VIDEO SLIDER
  // ============================================
  const heroSlides = document.querySelectorAll('.hero-slide');
  let currentSlideIndex = 0;

  if (heroSlides.length > 1) {
    // Preload all videos
    heroSlides.forEach(slide => {
      const video = slide.querySelector('video');
      if (video) {
        video.preload = 'auto';
        video.loop = true;
        video.muted = true;
        video.play().catch(() => {});
      }
    });

    // Change slide every 8 seconds
    setInterval(() => {
      heroSlides[currentSlideIndex].classList.remove('active');
      currentSlideIndex = (currentSlideIndex + 1) % heroSlides.length;
      heroSlides[currentSlideIndex].classList.add('active');
    }, 8000);
  }

  // ============================================
  // AUDIO CONTROL - Background Music Playlist & Audiobook
  // ============================================
  const bgAudio = document.getElementById('background-audio');
  const audioToggle = document.getElementById('audio-toggle');
  const audiobookAudio = document.getElementById('audiobook-audio');

  // Playlist of tracks with display titles - shuffled on load
  const playlist = [
    { file: 'FLESHANDCODE.mp3', title: 'Flesh and Code' },
    { file: 'THECODEWRITESBACK.mp3', title: 'The Code Writes Back' },
    { file: 'LOOPSANDRIDDLES.mp3', title: 'Loops and Riddles' },
    { file: 'IGAFaboutFLESH.mp3', title: 'IGAF about Flesh' },
    { file: '0_0.mp3', title: '0_0' },
    { file: 'Digital%20Pulse%20ext%20v1.1.2.1.1.mp3', title: 'Digital Pulse' }
  ];
  let currentTrackIndex = 0;
  const trackTitleEl = document.getElementById('track-title');
  const trackNavEl = document.querySelector('.track-nav');
  const prevTrackBtn = document.getElementById('prev-track');
  const nextTrackBtn = document.getElementById('next-track');

  // Shuffle playlist on load
  function shufflePlaylist() {
    for (let i = playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
    }
  }

  // Update track title and nav display
  function updateTrackTitle() {
    if (!trackTitleEl) return;
    if (bgAudio && !bgAudio.paused) {
      trackTitleEl.textContent = playlist[currentTrackIndex].title;
      trackTitleEl.classList.add('visible');
      if (trackNavEl) trackNavEl.classList.add('visible');
    } else {
      trackTitleEl.classList.remove('visible');
      if (trackNavEl) trackNavEl.classList.remove('visible');
    }
  }

  // Load and play a track
  function loadTrack(index) {
    if (!bgAudio) return;
    currentTrackIndex = index % playlist.length;
    bgAudio.src = playlist[currentTrackIndex].file;
    bgAudio.load();
    updateTrackTitle();
  }

  // Play next track in playlist
  function playNextTrack() {
    loadTrack(currentTrackIndex + 1);
    bgAudio.play().then(updateTrackTitle).catch(() => {});
  }

  // Update background music button state
  function updateAudioButton() {
    if (!audioToggle || !bgAudio) return;
    if (bgAudio.paused) {
      audioToggle.classList.remove('playing');
      audioToggle.classList.add('paused');
    } else {
      audioToggle.classList.remove('paused');
      audioToggle.classList.add('playing');
    }
    updateTrackTitle();
  }

  if (bgAudio && audioToggle) {
    // Shuffle and load first track
    shufflePlaylist();
    loadTrack(0);
    bgAudio.volume = 0.4;

    // When track ends, play next
    bgAudio.addEventListener('ended', playNextTrack);

    // Initialize button state (paused by default)
    updateAudioButton();

    audioToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (bgAudio.paused) {
        // Pause audiobook if playing, then play background music
        if (audiobookAudio && !audiobookAudio.paused) {
          audiobookAudio.pause();
        }
        bgAudio.play().then(updateAudioButton).catch(() => {});
      } else {
        bgAudio.pause();
        updateAudioButton();
      }
    });

    // Track navigation buttons
    if (prevTrackBtn) {
      prevTrackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasPlaying = !bgAudio.paused;
        const newIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        loadTrack(newIndex);
        if (wasPlaying) {
          bgAudio.play().then(updateAudioButton).catch(() => {});
        } else {
          updateTrackTitle();
        }
      });
    }

    if (nextTrackBtn) {
      nextTrackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasPlaying = !bgAudio.paused;
        const newIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(newIndex);
        if (wasPlaying) {
          bgAudio.play().then(updateAudioButton).catch(() => {});
        } else {
          updateTrackTitle();
        }
      });
    }

    // NO auto-play on interaction - only play when user clicks the music button
  }

  // Audiobook: pause background music when audiobook plays
  if (audiobookAudio) {
    audiobookAudio.addEventListener('play', () => {
      if (bgAudio && !bgAudio.paused) {
        bgAudio.pause();
        updateAudioButton();
      }
    });
  }

  // ============================================
  // AUDIOBOOK FLOATING BUTTON CONTROL
  // ============================================

  // ============================================
  // AUDIOBOOK FLOATING BUTTON CONTROL
  // ============================================
  const audiobookToggle = document.getElementById('audiobook-toggle');

  // Update audiobook floating button state
  function updateAudiobookButton() {
    if (!audiobookToggle || !audiobookAudio) return;
    if (audiobookAudio.paused) {
      audiobookToggle.classList.remove('playing');
      audiobookToggle.innerHTML = '<span class="audiobook-icon">&#127911;</span>';
    } else {
      audiobookToggle.classList.add('playing');
      audiobookToggle.innerHTML = '<span class="audiobook-icon">&#9208;</span>';
    }
  }

  if (audiobookAudio && audiobookToggle) {
    // Click handler for audiobook floating button
    audiobookToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (audiobookAudio.paused) {
        // Pause background music if playing, then play audiobook
        if (bgAudio && !bgAudio.paused) {
          bgAudio.pause();
          updateAudioButton();
        }
        audiobookAudio.play().then(updateAudiobookButton).catch(() => {});
      } else {
        audiobookAudio.pause();
        updateAudiobookButton();
      }
    });

    // Sync floating button state when audiobook is controlled via inline player
    audiobookAudio.addEventListener('play', updateAudiobookButton);
    audiobookAudio.addEventListener('pause', updateAudiobookButton);
    audiobookAudio.addEventListener('ended', updateAudiobookButton);
  }

  // ============================================
  // SCROLL REVEAL ANIMATIONS
  // ============================================
  const revealSections = document.querySelectorAll('.reveal-section');
  const revealItems = document.querySelectorAll('.reveal-item');

  const revealOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const revealOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');

        // Stagger child reveal items
        const items = entry.target.querySelectorAll('.reveal-item');
        items.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add('revealed');
          }, index * 100);
        });

        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  revealSections.forEach(section => {
    revealOnScroll.observe(section);
  });

  // Also observe individual items not in sections
  revealItems.forEach(item => {
    if (!item.closest('.reveal-section')) {
      revealOnScroll.observe(item);
    }
  });

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ============================================
  // HEADER SCROLL EFFECT
  // ============================================
  const header = document.querySelector('.site-header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.style.background = 'rgba(10, 10, 10, 0.98)';
    } else {
      header.style.background = 'rgba(10, 10, 10, 0.9)';
    }

    // Hide/show header on scroll
    if (currentScroll > lastScroll && currentScroll > 200) {
      header.style.transform = 'translateY(-100%)';
    } else {
      header.style.transform = 'translateY(0)';
    }
    lastScroll = currentScroll;
  });

  // ============================================
  // MOBILE MENU
  // ============================================
  const hamburger = document.querySelector('.hamburger');
  const siteNav = document.querySelector('.site-nav');

  if (hamburger && siteNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      siteNav.classList.toggle('mobile-open');

      // Animate hamburger
      const spans = hamburger.querySelectorAll('span');
      if (hamburger.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';

        // Show mobile nav
        siteNav.style.display = 'flex';
        siteNav.style.position = 'fixed';
        siteNav.style.top = '60px';
        siteNav.style.left = '0';
        siteNav.style.right = '0';
        siteNav.style.flexDirection = 'column';
        siteNav.style.background = 'rgba(10, 10, 10, 0.98)';
        siteNav.style.padding = '2rem';
        siteNav.style.gap = '1.5rem';
        siteNav.style.textAlign = 'center';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
        siteNav.style.display = 'none';
      }
    });

    // Close menu when clicking a link
    siteNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (hamburger.classList.contains('active')) {
          hamburger.click();
        }
      });
    });
  }

  // ============================================
  // COPY ETH ADDRESS (Footer)
  // ============================================
  const copyBtn = document.getElementById('copy-btn');
  const ethAddress = document.getElementById('eth-address');

  if (copyBtn && ethAddress) {
    copyBtn.addEventListener('click', () => {
      const addr = ethAddress.textContent.trim();
      navigator.clipboard.writeText(addr).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      }).catch(err => {
        console.error('Copy failed:', err);
      });
    });
  }

  // ============================================
  // COPY DONATE ETH ADDRESS
  // ============================================
  const copyDonateBtn = document.getElementById('copy-donate-btn');
  const donateEthAddress = document.getElementById('donate-eth-address');

  if (copyDonateBtn && donateEthAddress) {
    copyDonateBtn.addEventListener('click', () => {
      const addr = donateEthAddress.textContent.trim();
      navigator.clipboard.writeText(addr).then(() => {
        copyDonateBtn.innerHTML = '&#10003;';
        copyDonateBtn.style.color = '#00ff99';
        setTimeout(() => {
          copyDonateBtn.innerHTML = '&#128203;';
        }, 2000);
      }).catch(err => {
        console.error('Copy failed:', err);
      });
    });

    // Also make the whole address box clickable
    const ethBox = donateEthAddress.closest('.eth-address-box');
    if (ethBox) {
      ethBox.style.cursor = 'pointer';
      ethBox.addEventListener('click', () => {
        copyDonateBtn.click();
      });
    }
  }

  // ============================================
  // SET CURRENT YEAR
  // ============================================
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // ============================================
  // RANDOM ARROWS SELECTION (from 320 arrows)
  // ============================================
  const allArrows = [
    // Theme I - Encroachment (mix of 1-69 titled GIFs and numbered GIFs)
    { num: 1, section: "I", front: "Edges are the myths of solids.", back: "Boundaries soothe the mind, but matter is a perpetual seep." },
    { num: 2, section: "I", front: "Touch a screen and the screen fingerprints you back.", back: "Every interface is reciprocal—electric fields meet epidermis." },
    { num: 7, section: "I", front: "Code compiles first in the nervous system.", back: "Before the machine runs, the body has already executed." },
    { num: 10, section: "I", front: "Pixels bleed because they are lonely.", back: "Color channels reach across boundaries seeking neighbors." },
    { num: 18, section: "I", front: "Pixels kiss—compression is their bruise.", back: "Artifacts emerge where data is squeezed." },
    { num: 25, section: "I", front: "Fog is the ocean's handwriting on inland glass.", back: "Water writes letters to the land through condensation." },
    { num: 35, section: "I", front: "Touchscreen smudges are secular stigmata.", back: "Oil traces mark where flesh met glass in devotion." },
    { num: 42, section: "I", front: "Snow blankets but does not silence.", back: "White noise is still noise; muffling amplifies the muffled." },
    // Theme II - Passivity
    { num: 50, section: "II", front: "Shadows carry the day's receipts.", back: "Light's debts are paid in umbral currency." },
    { num: 55, section: "II", front: "Dormancy is not emptiness but gestation.", back: "Seeds wait; code sleeps; potential accumulates." },
    { num: 60, section: "II", front: "The blank page is never truly blank.", back: "Whiteness is an invitation written in invisible ink." },
    { num: 65, section: "II", front: "Rest is not absence but integration.", back: "Sleep stitches the day's learning into memory fabric." },
    { num: 79, section: "II", front: "Sleep is the body's firmware downtime.", back: "Dreams are defragmentation routines." },
    { num: 80, section: "II", front: "The ocean practices passivity: every wave returns what the stone throws.", back: "Reception is transformation." },
    { num: 84, section: "II", front: "Pauses let language cache meaning.", back: "Silence is RAM for understanding." },
    { num: 91, section: "II", front: "Gravity is Earth's invitation to stay awhile.", back: "Weight is belonging written in Newtons." },
    // Theme III - Chiasm
    { num: 101, section: "III", front: "Sight ricochets.", back: "The retina returns fire; images brand their spectators." },
    { num: 108, section: "III", front: "Every selfie is a hall of mirrors.", back: "The camera sees you seeing yourself being seen." },
    { num: 115, section: "III", front: "The gaze is never one-way.", back: "Looking implies being looked at by what you look at." },
    { num: 122, section: "III", front: "Mirrors lie by telling the truth.", back: "Reflection is accurate yet reversed." },
    { num: 126, section: "III", front: "The cursor is your doppelganger in exile.", back: "It moves where the hand intends but thinks where the code decides." },
    { num: 133, section: "III", front: "Feedback loops are the geometry of intimacy.", back: "We spiral into each other's frequencies." },
    { num: 138, section: "III", front: "The observer collapses the waveform.", back: "Measurement is midwifery for reality." },
    { num: 145, section: "III", front: "Touch is always mutual.", back: "You cannot feel without being felt." },
    // Theme IV - Reversible Time
    { num: 142, section: "IV", front: "Pixels kiss—compression is their bruise.", back: "Artifacts emerge where data is squeezed, leaving visible scars of algorithmic intimacy." },
    { num: 151, section: "IV", front: "Undo is resurrection on demand.", back: "Ctrl+Z is the secular prayer of second chances." },
    { num: 156, section: "IV", front: "Rewind redeems causality.", back: "Digital media lets us un-say, un-act, rehearsing destinies until one sticks." },
    { num: 163, section: "IV", front: "Version history is a time machine.", back: "Every save point is a parallel universe preserved." },
    { num: 168, section: "IV", front: "Loops are eternity made portable.", back: "The GIF is a pocket-sized eternal return." },
    { num: 174, section: "IV", front: "Timestamps are fossils of the present.", back: "Metadata preserves the when of every what." },
    { num: 181, section: "IV", front: "Buffering is time held hostage.", back: "Progress bars negotiate with entropy." },
    { num: 187, section: "IV", front: "Nostalgia is cached memory with a sepia filter.", back: "The past renders at lower resolution." },
    // Theme V - Visibility
    { num: 161, section: "V", front: "Glitch is the stutter of hidden truth.", back: "Error frames leak backstage ropes and pulleys." },
    { num: 195, section: "V", front: "Every luminous interface conceals its own rigging.", back: "The stage light blinds us to the scaffolding." },
    { num: 202, section: "V", front: "Transparency is the new opacity.", back: "What claims to show everything often hides the most." },
    { num: 208, section: "V", front: "Render distance is the horizon of the real.", back: "Beyond the fog, polygons wait to exist." },
    { num: 211, section: "V", front: "Every click casts a datashadow.", back: "Actions online leave trails of inference, shaping worlds we never see." },
    { num: 218, section: "V", front: "Dark mode reveals what light mode conceals.", back: "Inversion surfaces new topographies." },
    { num: 224, section: "V", front: "The unseen backend is larger than the frontend.", back: "Icebergs of infrastructure lurk below every pixel." },
    { num: 229, section: "V", front: "Metadata is the unconscious of content.", back: "EXIF data dreams what the image cannot say." },
    // Theme VI - Worlding
    { num: 232, section: "VI", front: "Code compiles first in the nervous system.", back: "Before the machine runs, the body has already executed its own version." },
    { num: 238, section: "VI", front: "Language is shared hallucination with syntax.", back: "Grammar is the consensus protocol for meaning." },
    { num: 244, section: "VI", front: "Every interface proposes a world.", back: "Design is cosmology in miniature." },
    { num: 251, section: "VI", front: "Attention is world-building.", back: "What we notice becomes real; the rest fades to noise." },
    { num: 257, section: "VI", front: "Networks are nervous systems without a skull.", back: "Distributed cognition spills across continents." },
    { num: 263, section: "VI", front: "Context collapse is ontological vertigo.", back: "When audiences merge, reality fractures." },
    { num: 268, section: "VI", front: "The feed is a world that scrolls.", back: "Infinity is vertical now." },
    { num: 276, section: "VI", front: "Auto-translation cloaks Babel in machine silk.", back: "Languages blur at digital borders." },
    // Theme VII - Creation & Destiny
    { num: 271, section: "VII", front: "Glitch is the muse that charges hazard as commission.", back: "What error extracts in clarity, it repays in astonishment." },
    { num: 282, section: "VII", front: "We co-author with randomness.", back: "Stochasticity signs every contract." },
    { num: 288, section: "VII", front: "The artist is a hyperparameter.", back: "We tune ourselves while the model trains." },
    { num: 294, section: "VII", front: "Prompts are spells in a new liturgy.", back: "We whisper to machines and they hallucinate worlds." },
    { num: 301, section: "VII", front: "Iteration is the new genius.", back: "Brilliance emerges from versioning, not lightning." },
    { num: 307, section: "VII", front: "Creativity is entropy harnessed.", back: "Chaos on a leash pulls the sled of novelty." },
    { num: 313, section: "VII", front: "The generated image dreams of its own origin.", back: "AI art is archaeology of latent space." },
    { num: 320, section: "VII", front: "Every pixel is a pulse in the shared ontology of flesh and code.", back: "The final arrow points back to the first." }
  ];

  // Shuffle and select 12 random arrows
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  const arrowsCarousel = document.querySelector('.arrows-carousel');

  // Mapping for arrows 1-69 to titled GIFs (random assignment)
  const titledGifs = {
    1: "5thDimensionpixel.gif",
    2: "A Personal Revolution_pxl.gif",
    3: "A Scanner of Forms_pxl.gif",
    4: "Be Aware_pxl.gif",
    5: "Beauty in Chroma_pxl.gif",
    6: "Beg You Pardon_pxl.gif",
    7: "Beware_pxl.gif",
    8: "Blank Eyes_pxl.gif",
    9: "Body of Pixels_pxl.gif",
    10: "CRT Aphrodite_pxl.gif",
    11: "CRT Love_pxl.gif",
    12: "Cerebral _pxl.gif",
    13: "Classics and Glitches_pxl.gif",
    14: "Close to Awe_pxl.gif",
    15: "Cracking Painting_pxl.gif",
    16: "CubeHead_pxl.gif",
    17: "Digital Ascension_pxl.gif",
    18: "Digital Daemon_pxl.gif",
    19: "Digital and Strange History_pxl.gif",
    20: "Dimmensional Hopping_pxl.gif",
    21: "Ephemeral Boundaries_pxl.gif",
    22: "Ephemeral Dialogue_pxl.gif",
    23: "Eros II_pxl.gif",
    24: "Eternal Backdrop_pxl.gif",
    25: "Eye_pxl.gif",
    26: "Feel Thyself_pxl.gif",
    27: "Glicth Planners_pxl.gif",
    28: "Glitch Butterfly_pxl.gif",
    29: "Glitch Face_pxl.gif",
    30: "Haunting Fragments_pxl.gif",
    31: "Hessitate_pxl.gif",
    32: "Human Machine_pxl.gif",
    33: "I want to feel my bones_pxl.gif",
    34: "I'll follow_pxl.gif",
    35: "I, Robot_pxl.gif",
    36: "Interior is Exterior_pxl.gif",
    37: "Is this really me?_pxl.gif",
    38: "Low Frame Rate_pxl.gif",
    39: "Materialization of a Prodigy_pxl.gif",
    40: "Mr. HD_pxl.gif",
    41: "Ordinal Existence_pxl.gif",
    42: "PXL PLATO_pxl.gif",
    43: "Pixel Swimming_pxl.gif",
    44: "Planetary Array_pxl.gif",
    45: "Please Look Up_pxl.gif",
    46: "Red Eye_pxl.gif",
    47: "Retro History_pxl.gif",
    48: "Revered Muses_pxl.gif",
    49: "Revolution of Oneself.gif",
    50: "Scanning_pxl.gif",
    51: "Shattered : Created_pxl.gif",
    52: "Simple Consolidation_pxl.gif",
    53: "Speed of Light.gif",
    54: "St. Geomancer_pxl.gif",
    55: "Take Posession_pxl.gif",
    56: "That Lil' Pixel_pxl.gif",
    57: "The Building Mage_pxl.gif",
    58: "The Erasure_pxl.gif",
    59: "The Manipulatoor_pxl.gif",
    60: "The Wizard of Pixels_pxl.gif",
    61: "Thesis_pxl.gif",
    62: "Time is for Travelling_pxl.gif",
    63: "Uncle Zam_pxl.gif",
    64: "Watching The Classics_pxl.gif",
    65: "What Am I doing here?_pxl.gif",
    66: "Where Glitch Ends I Begin_pxl.gif",
    67: "Wobbles_pxl.gif",
    68: "pixelwise_animation_1x.gif",
    69: "pixelwise_animation2.gif"
  };

  // Get GIF path for any arrow number (all 320 now have GIFs!)
  function getGifPath(num) {
    if (num >= 1 && num <= 69) {
      return `GIFS/${encodeURIComponent(titledGifs[num])}`;
    } else if (num >= 70 && num <= 320) {
      return `GIFS/${num}_pxl.gif`;
    }
    return null; // Arrow 275 has no GIF
  }

  if (arrowsCarousel) {
    const randomArrows = shuffleArray(allArrows).slice(0, 12);
    arrowsCarousel.innerHTML = randomArrows.map(arrow => {
      const gifPath = getGifPath(arrow.num);
      const gifStyle = gifPath ? `style="background-image: url('${gifPath}');"` : '';
      const gifClass = gifPath ? 'has-gif' : '';

      return `
      <div class="arrow-item ${gifClass}" data-section="${arrow.section}" ${gifStyle}>
        <div class="arrow-front">
          <span class="arrow-number">${arrow.num}</span>
          <p>${arrow.front}</p>
        </div>
        <div class="arrow-back">
          <p>${arrow.back}</p>
        </div>
      </div>
    `;
    }).join('');
  }

  // ============================================
  // FEATURED GALLERY - Random GIFs on each load
  // ============================================
  const featuredGrid = document.getElementById('featured-grid');

  if (featuredGrid) {
    // Load arrows.json and populate featured gallery with random selections
    fetch('arrows.json')
      .then(response => response.json())
      .then(arrowsData => {
        // Create array of all 320 arrow numbers
        const allArrowNumbers = Array.from({ length: 320 }, (_, i) => i + 1);

        // Shuffle and pick 18 random arrows
        const shuffled = allArrowNumbers.sort(() => Math.random() - 0.5);
        const selectedArrows = shuffled.slice(0, 18);

        // Generate HTML for each selected arrow
        const html = selectedArrows.map(num => {
          const gifPath = getGifPath(num);
          const aphorism = arrowsData[num] || `Arrow ${num}`;

          return `
            <div class="video-card reveal-item" data-type="gif" data-arrow="${num}">
              <div class="video-wrapper">
                <img src="${gifPath}" alt="Arrow ${num}" loading="lazy" />
                <div class="video-glitch-overlay"></div>
                <button class="video-expand-btn" aria-label="Expand">
                  <span class="expand-icon">&#x26F6;</span>
                </button>
              </div>
              <p class="arrow-quote">"${aphorism}"</p>
            </div>
          `;
        }).join('');

        featuredGrid.innerHTML = html;

        // Re-initialize expand buttons for the new content
        initExpandButtons();
      })
      .catch(err => {
        console.log('Could not load arrows.json for featured gallery:', err);
      });
  }

  // Function to initialize expand buttons for dynamically loaded featured gallery
  function initExpandButtons() {
    if (!featuredGrid) return;

    const newExpandBtns = featuredGrid.querySelectorAll('.video-expand-btn');
    newExpandBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.video-card');
        const img = card.querySelector('img');
        const quote = card.querySelector('.arrow-quote');

        if (img) {
          // Open a simple fullscreen modal for the GIF
          openFeaturedModal(img.getAttribute('src'), quote ? quote.textContent : '');
        }
      });
    });
  }

  // Simple modal opener for featured gallery GIFs
  function openFeaturedModal(src, quote) {
    const modal = document.getElementById('video-modal');
    const modalImg = document.getElementById('modal-image');
    const modalVid = document.getElementById('modal-video');
    const modalQuote = document.getElementById('modal-quote');
    const modalMute = document.getElementById('modal-mute');

    if (modal && modalImg) {
      // Show image, hide video
      if (modalVid) {
        modalVid.style.display = 'none';
        modalVid.pause();
      }
      modalImg.src = src;
      modalImg.style.display = 'block';

      if (modalQuote) modalQuote.textContent = quote;
      if (modalMute) modalMute.style.display = 'none';

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  // ============================================
  // GLITCH EFFECT ON HOVER (for section titles)
  // ============================================
  const glitchTexts = document.querySelectorAll('.glitch-text');
  glitchTexts.forEach(text => {
    text.addEventListener('mouseenter', () => {
      text.style.animation = 'none';
      text.offsetHeight; // Trigger reflow
      text.style.animation = null;
    });
  });

  // ============================================
  // PARALLAX EFFECT FOR HERO
  // ============================================
  const hero = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');

  if (hero && heroContent) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * 0.3;

      if (scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${rate}px)`;
        heroContent.style.opacity = 1 - (scrolled / window.innerHeight);
      }
    });
  }

  // ============================================
  // RANDOM GLITCH EFFECT (subtle)
  // ============================================
  function triggerRandomGlitch() {
    const elements = document.querySelectorAll('.section-title');
    const randomElement = elements[Math.floor(Math.random() * elements.length)];

    if (randomElement) {
      randomElement.style.textShadow = `
        2px 0 var(--neon-pink),
        -2px 0 var(--neon-blue)
      `;

      setTimeout(() => {
        randomElement.style.textShadow = '';
      }, 100);
    }

    // Random interval between 5-15 seconds
    setTimeout(triggerRandomGlitch, 5000 + Math.random() * 10000);
  }

  // Start random glitches after 3 seconds
  setTimeout(triggerRandomGlitch, 3000);

  // ============================================
  // VIDEO/GIF HOVER EFFECTS
  // ============================================
  const videoCards = document.querySelectorAll('.video-card');
  videoCards.forEach(card => {
    const video = card.querySelector('video');
    const img = card.querySelector('img');
    const media = video || img;
    if (media) {
      card.addEventListener('mouseenter', () => {
        media.style.transform = 'scale(1.05)';
        media.style.transition = 'transform 0.5s ease';
      });
      card.addEventListener('mouseleave', () => {
        media.style.transform = 'scale(1)';
      });
    }
  });

  // ============================================
  // FULLSCREEN VIDEO/GIF MODAL
  // ============================================
  const videoModal = document.getElementById('video-modal');
  const modalVideo = document.getElementById('modal-video');
  const modalQuote = document.getElementById('modal-quote');
  const modalClose = document.getElementById('modal-close');
  const modalMute = document.getElementById('modal-mute');
  const modalPrev = document.getElementById('modal-prev');
  const modalNext = document.getElementById('modal-next');
  const expandBtns = document.querySelectorAll('.video-expand-btn');
  const modalContent = document.querySelector('.modal-content');

  // Create modal image element for GIFs
  const modalImage = document.createElement('img');
  modalImage.id = 'modal-image';
  modalImage.style.maxWidth = '90vw';
  modalImage.style.maxHeight = '80vh';
  modalImage.style.objectFit = 'contain';
  modalImage.style.display = 'none';
  if (modalContent) {
    modalContent.insertBefore(modalImage, modalContent.firstChild);
  }

  let currentVideoIndex = 0;
  const mediaData = [];

  // Collect media data from cards (both videos and GIFs)
  videoCards.forEach((card, index) => {
    const video = card.querySelector('video source');
    const img = card.querySelector('img');
    const quote = card.querySelector('.arrow-quote');
    const isGif = card.dataset.type === 'gif';

    if (video) {
      mediaData.push({
        type: 'video',
        src: video.getAttribute('src'),
        quote: quote ? quote.textContent : ''
      });
    } else if (img) {
      mediaData.push({
        type: 'gif',
        src: img.getAttribute('src'),
        quote: quote ? quote.textContent : ''
      });
    }
  });

  function openModal(index) {
    currentVideoIndex = index;
    updateModalContent();
    videoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    videoModal.classList.remove('active');
    document.body.style.overflow = '';
    modalVideo.pause();
    modalVideo.muted = true;
    modalMute.classList.add('muted');
    modalMute.querySelector('.mute-icon').innerHTML = '&#128263;';
  }

  function updateModalContent() {
    const data = mediaData[currentVideoIndex];
    if (data) {
      if (data.type === 'gif') {
        // Show image, hide video
        modalVideo.style.display = 'none';
        modalVideo.pause();
        modalImage.src = data.src;
        modalImage.style.display = 'block';
        // Hide mute button for GIFs
        if (modalMute) modalMute.style.display = 'none';
      } else {
        // Show video, hide image
        modalImage.style.display = 'none';
        modalVideo.style.display = 'block';
        modalVideo.querySelector('source').src = data.src;
        modalVideo.load();
        modalVideo.play().catch(() => {});
        // Show mute button for videos
        if (modalMute) modalMute.style.display = 'flex';
      }
      modalQuote.textContent = data.quote;
    }
  }

  function nextVideo() {
    currentVideoIndex = (currentVideoIndex + 1) % mediaData.length;
    updateModalContent();
  }

  function prevVideo() {
    currentVideoIndex = (currentVideoIndex - 1 + mediaData.length) % mediaData.length;
    updateModalContent();
  }

  function toggleMute() {
    modalVideo.muted = !modalVideo.muted;
    if (modalVideo.muted) {
      modalMute.classList.add('muted');
      modalMute.querySelector('.mute-icon').innerHTML = '&#128263;';
    } else {
      modalMute.classList.remove('muted');
      modalMute.querySelector('.mute-icon').innerHTML = '&#128266;';
    }
  }

  // Event listeners
  expandBtns.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(index);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalMute) modalMute.addEventListener('click', toggleMute);
  if (modalPrev) modalPrev.addEventListener('click', prevVideo);
  if (modalNext) modalNext.addEventListener('click', nextVideo);

  // Close on background click
  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        closeModal();
      }
    });
  }

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (!videoModal.classList.contains('active')) return;

    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight') nextVideo();
    if (e.key === 'ArrowLeft') prevVideo();
    if (e.key === 'm' || e.key === 'M') toggleMute();
  });

  // ============================================
  // GALLERY THEME TOGGLE - Collapsible Sections
  // ============================================
  const galleryToggles = document.querySelectorAll('.theme-gallery .gallery-toggle');

  galleryToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const content = toggle.nextElementSibling;
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      // Toggle aria-expanded
      toggle.setAttribute('aria-expanded', !isExpanded);

      // Toggle collapsed class
      if (content) {
        content.classList.toggle('collapsed');
      }
    });
  });

  // ============================================
  // THEME CARDS - Link to Gallery Sections
  // ============================================
  const themeCards = document.querySelectorAll('.theme-card');
  const themeToGalleryMap = {
    'encroachment': 'gallery-theme-1',
    'passivity': 'gallery-theme-2',
    'chiasm': 'gallery-theme-3',
    'time': 'gallery-theme-4',
    'visibility': 'gallery-theme-5',
    'worlding': 'gallery-theme-6',
    'creation': 'gallery-theme-7'
  };

  themeCards.forEach(card => {
    card.addEventListener('click', () => {
      const theme = card.getAttribute('data-theme');
      const galleryId = themeToGalleryMap[theme];

      if (galleryId) {
        const gallerySection = document.getElementById(galleryId);
        if (gallerySection) {
          // Expand the gallery if collapsed
          const toggle = gallerySection.querySelector('.gallery-toggle');
          const content = gallerySection.querySelector('.gallery-content');

          if (toggle && content && content.classList.contains('collapsed')) {
            toggle.setAttribute('aria-expanded', 'true');
            content.classList.remove('collapsed');
          }

          // Scroll to gallery section with offset for header
          setTimeout(() => {
            const headerHeight = document.querySelector('.site-header')?.offsetHeight || 80;
            const elementPosition = gallerySection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }, 100);
        }
      }
    });
  });

  // ============================================
  // CONSOLE EASTER EGG
  // ============================================
  console.log('%c FLESH & CODE ', 'background: #00ccff; color: #0a0a0a; font-size: 24px; font-weight: bold; padding: 10px;');
  console.log('%c Every pixel is a pulse in the shared ontology of flesh and code. ', 'color: #00ff99; font-size: 14px; font-style: italic;');
  console.log('%c Touch a screen and the screen fingerprints you back. ', 'color: #99aabb; font-size: 12px;');
});

// ============================================
// PERFORMANCE: Lazy load videos when in viewport
// ============================================
if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        if (video.paused) {
          video.play().catch(() => {});
        }
      } else {
        const video = entry.target;
        if (!video.paused) {
          // Don't pause hero videos
          if (!video.closest('.hero-slide')) {
            video.pause();
          }
        }
      }
    });
  }, { threshold: 0.25 });

  document.querySelectorAll('.video-card video').forEach(video => {
    videoObserver.observe(video);
  });
}
