// === Facegen — Standalone avatar generator (inlined for demo) ===

// --- Palettes ---
const SKIN_COLORS = [
  '#FDDCB5','#F5C5A3','#E8B48A','#D4956B','#C07A50',
  '#A0623D','#8B5036','#6B3E2A','#F9D5C8','#E6C4A0',
];
const EYE_COLORS = [
  '#4A90D9','#5B7F3A','#6B4226','#2C3E50',
  '#7B6BA5','#3E8E7E','#8B6914','#2D5F2D',
];
const CHEEK_COLORS = [
  'rgba(255,140,140,0.25)','rgba(255,160,122,0.22)',
  'rgba(255,127,80,0.18)','rgba(240,128,128,0.20)','rgba(255,182,193,0.22)',
];

// --- Hash ---
function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick(hash, slot, count) {
  const mixed = ((hash >>> slot) ^ (hash >>> (slot + 13)) ^ (hash * (slot + 7))) >>> 0;
  return mixed % count;
}

function seedToParams(seed) {
  const h = djb2(seed);
  return {
    faceShape:    pick(h, 0, 5),
    skinColor:    SKIN_COLORS[pick(h, 3, SKIN_COLORS.length)],
    eyeStyle:     pick(h, 6, 6),
    eyeColor:     EYE_COLORS[pick(h, 9, EYE_COLORS.length)],
    pupilSize:    0.55 + (pick(h, 12, 7) / 20),
    eyebrowStyle: pick(h, 15, 5),
    mouthStyle:   pick(h, 18, 6),
    noseStyle:    pick(h, 21, 4),
    hasCheeks:    pick(h, 24, 3) !== 0,
    cheekColor:   CHEEK_COLORS[pick(h, 27, CHEEK_COLORS.length)],
    animDelay:    (h % 1000) / 1000,
  };
}

// --- Color helpers ---
function darken(hex, amount) {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount)) | 0;
  const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount)) | 0;
  const b = Math.max(0, (n & 0xff) * (1 - amount)) | 0;
  return `rgb(${r},${g},${b})`;
}

function darkenForLips(hex) {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  const r = Math.min(255, Math.max(0, (((n >> 16) & 0xff) * 0.7 + 40) | 0));
  const g = Math.max(0, (((n >> 8) & 0xff) * 0.5) | 0);
  const b = Math.max(0, ((n & 0xff) * 0.5) | 0);
  return `rgb(${r},${g},${b})`;
}

// --- SVG part renderers ---
function renderFaceShape(variant, fill) {
  const shapes = {
    0: `<ellipse cx="50" cy="52" rx="34" ry="38"/>`,
    1: `<rect x="16" y="14" width="68" height="76" rx="28" ry="28"/>`,
    2: `<ellipse cx="50" cy="50" rx="36" ry="36"/>`,
    3: `<path d="M50 12 C74 12 82 30 82 52 C82 76 68 88 50 88 C32 88 18 76 18 52 C18 30 26 12 50 12Z"/>`,
    4: `<path d="M50 10 C78 10 84 34 84 50 C84 70 74 90 50 90 C26 90 16 70 16 50 C16 34 22 10 50 10Z"/>`,
  };
  return `<g fill="${fill}" stroke="none">${shapes[variant] || shapes[0]}</g>`;
}

function renderCheeks(show, color) {
  if (!show) return '';
  return `<g><ellipse cx="28" cy="58" rx="6" ry="4" fill="${color}"/><ellipse cx="72" cy="58" rx="6" ry="4" fill="${color}"/></g>`;
}

function renderEyes(variant, color, pupilSize, skinColor, shouldAnimate, blinkDelay) {
  const lx = 36, rx = 64, y = 46;
  const r = 5.5;
  const pr = r * pupilSize;
  let eyeShapes = '';

  if (variant === 0) {
    eyeShapes = `<circle cx="${lx}" cy="${y}" r="${r}" fill="white"/><circle cx="${rx}" cy="${y}" r="${r}" fill="white"/><circle cx="${lx}" cy="${y}" r="${pr}" fill="${color}"/><circle cx="${rx}" cy="${y}" r="${pr}" fill="${color}"/><circle cx="${lx+1}" cy="${y-1}" r="${pr*0.45}" fill="#111"/><circle cx="${rx+1}" cy="${y-1}" r="${pr*0.45}" fill="#111"/>`;
  } else if (variant === 1) {
    eyeShapes = `<ellipse cx="${lx}" cy="${y}" rx="${r+1}" ry="${r-1}" fill="white"/><ellipse cx="${rx}" cy="${y}" rx="${r+1}" ry="${r-1}" fill="white"/><circle cx="${lx}" cy="${y}" r="${pr*0.9}" fill="${color}"/><circle cx="${rx}" cy="${y}" r="${pr*0.9}" fill="${color}"/><circle cx="${lx+0.8}" cy="${y-0.8}" r="${pr*0.4}" fill="#111"/><circle cx="${rx+0.8}" cy="${y-0.8}" r="${pr*0.4}" fill="#111"/>`;
  } else if (variant === 2) {
    eyeShapes = `<ellipse cx="${lx}" cy="${y}" rx="${r-1}" ry="${r+1}" fill="white"/><ellipse cx="${rx}" cy="${y}" rx="${r-1}" ry="${r+1}" fill="white"/><circle cx="${lx}" cy="${y}" r="${pr*0.85}" fill="${color}"/><circle cx="${rx}" cy="${y}" r="${pr*0.85}" fill="${color}"/><circle cx="${lx}" cy="${y-0.5}" r="${pr*0.38}" fill="#111"/><circle cx="${rx}" cy="${y-0.5}" r="${pr*0.38}" fill="#111"/>`;
  } else if (variant === 3) {
    eyeShapes = `<circle cx="${lx}" cy="${y}" r="3.5" fill="#222"/><circle cx="${rx}" cy="${y}" r="3.5" fill="#222"/><circle cx="${lx+0.8}" cy="${y-0.8}" r="1" fill="white" opacity="0.7"/><circle cx="${rx+0.8}" cy="${y-0.8}" r="1" fill="white" opacity="0.7"/>`;
  } else if (variant === 4) {
    eyeShapes = `<ellipse cx="${lx}" cy="${y}" rx="${r}" ry="${r*0.6}" fill="white"/><ellipse cx="${rx}" cy="${y}" rx="${r}" ry="${r*0.6}" fill="white"/><circle cx="${lx}" cy="${y+0.5}" r="${pr*0.7}" fill="${color}"/><circle cx="${rx}" cy="${y+0.5}" r="${pr*0.7}" fill="${color}"/><circle cx="${lx+0.5}" cy="${y}" r="${pr*0.32}" fill="#111"/><circle cx="${rx+0.5}" cy="${y}" r="${pr*0.32}" fill="#111"/>`;
  } else {
    eyeShapes = `<circle cx="${lx}" cy="${y}" r="${r+1}" fill="white"/><circle cx="${rx}" cy="${y}" r="${r+1}" fill="white"/><circle cx="${lx}" cy="${y}" r="${pr}" fill="${color}"/><circle cx="${rx}" cy="${y}" r="${pr}" fill="${color}"/><circle cx="${lx+0.5}" cy="${y-0.5}" r="${pr*0.42}" fill="#111"/><circle cx="${rx+0.5}" cy="${y-0.5}" r="${pr*0.42}" fill="#111"/><circle cx="${lx+2}" cy="${y-2}" r="1.2" fill="white" opacity="0.9"/><circle cx="${rx+2}" cy="${y-2}" r="1.2" fill="white" opacity="0.9"/>`;
  }

  const delayStyle = blinkDelay ? `animation-delay:${blinkDelay}` : '';
  const eyelidW = (r + 1.5) * 2;
  const eyelidH = (r + 2) * 2;
  const eyelids = `<rect class="ga-eyelid" x="${lx-r-1.5}" y="${y-r-2}" width="${eyelidW}" height="${eyelidH}" rx="${r}" fill="${skinColor}" style="transform-origin:${lx}px ${y}px;${delayStyle}"/><rect class="ga-eyelid" x="${rx-r-1.5}" y="${y-r-2}" width="${eyelidW}" height="${eyelidH}" rx="${r}" fill="${skinColor}" style="transform-origin:${rx}px ${y}px;${delayStyle}"/>`;

  const animClass = shouldAnimate ? ' class="ga-eyes-animated"' : '';
  return `<g${animClass}>${eyeShapes}${eyelids}</g>`;
}

function renderEyebrows(variant, skinColor) {
  const browColor = darken(skinColor, 0.35);
  const ly = 36, ry = 36, lx = 36, rx = 64;
  let brows = '';
  if (variant === 0) {
    brows = `<line x1="${lx-5}" y1="${ly}" x2="${lx+5}" y2="${ly}"/><line x1="${rx-5}" y1="${ry}" x2="${rx+5}" y2="${ry}"/>`;
  } else if (variant === 1) {
    brows = `<path d="M${lx-5} ${ly+1} Q${lx} ${ly-4} ${lx+5} ${ly+1}"/><path d="M${rx-5} ${ry+1} Q${rx} ${ry-4} ${rx+5} ${ry+1}"/>`;
  } else if (variant === 2) {
    brows = `<line x1="${lx-5}" y1="${ly+2}" x2="${lx+4}" y2="${ly-2}"/><line x1="${rx-4}" y1="${ry-2}" x2="${rx+5}" y2="${ry+2}"/>`;
  } else if (variant === 3) {
    brows = `<line x1="${lx-5}" y1="${ly-2}" x2="${lx+4}" y2="${ly+1}"/><line x1="${rx-4}" y1="${ry+1}" x2="${rx+5}" y2="${ry-2}"/>`;
  } else {
    brows = `<line x1="${lx-5}" y1="${ly}" x2="${lx+5}" y2="${ly}" stroke-width="2.4"/><line x1="${rx-5}" y1="${ry}" x2="${rx+5}" y2="${ry}" stroke-width="2.4"/>`;
  }
  return `<g fill="none" stroke="${browColor}" stroke-width="1.6" stroke-linecap="round">${brows}</g>`;
}

function renderNose(variant) {
  const cx = 50, cy = 56;
  const shadow = 'rgba(0,0,0,0.12)';
  if (variant === 0) return `<circle cx="${cx}" cy="${cy}" r="1.8" fill="${shadow}"/>`;
  if (variant === 1) return `<line x1="${cx}" y1="${cy-2}" x2="${cx}" y2="${cy+2}" stroke="${shadow}" stroke-width="1.5" stroke-linecap="round"/>`;
  if (variant === 2) return `<circle cx="${cx-2.2}" cy="${cy}" r="1.2" fill="${shadow}"/><circle cx="${cx+2.2}" cy="${cy}" r="1.2" fill="${shadow}"/>`;
  return `<path d="M${cx} ${cy-2} L${cx+2.5} ${cy+2} L${cx-2.5} ${cy+2}Z" fill="${shadow}"/>`;
}

function renderMouth(variant, skinColor, shouldAnimate, animDelay) {
  const cx = 50, cy = 66;
  const lipColor = darkenForLips(skinColor);
  let mouth = '';
  if (variant === 0) mouth = `<path d="M${cx-6} ${cy} Q${cx} ${cy+5} ${cx+6} ${cy}" fill="none" stroke="${lipColor}" stroke-width="1.5" stroke-linecap="round"/>`;
  else if (variant === 1) mouth = `<path d="M${cx-9} ${cy-1} Q${cx} ${cy+7} ${cx+9} ${cy-1}" fill="none" stroke="${lipColor}" stroke-width="1.5" stroke-linecap="round"/>`;
  else if (variant === 2) mouth = `<path d="M${cx-7} ${cy} Q${cx} ${cy+8} ${cx+7} ${cy}" fill="#3a1c1c" fill-opacity="0.6" stroke="${lipColor}" stroke-width="1.2"/>`;
  else if (variant === 3) mouth = `<line x1="${cx-5}" y1="${cy}" x2="${cx+5}" y2="${cy}" stroke="${lipColor}" stroke-width="1.5" stroke-linecap="round"/>`;
  else if (variant === 4) mouth = `<ellipse cx="${cx}" cy="${cy}" rx="3" ry="3.5" fill="#3a1c1c" fill-opacity="0.5" stroke="${lipColor}" stroke-width="1.2"/>`;
  else mouth = `<path d="M${cx-6} ${cy+1} Q${cx-1} ${cy-2} ${cx+6} ${cy-3}" fill="none" stroke="${lipColor}" stroke-width="1.5" stroke-linecap="round"/>`;

  const animClass = shouldAnimate ? ' class="ga-mouth-animated"' : '';
  const delayStyle = animDelay ? ` style="animation-delay:${animDelay}"` : '';
  return `<g${animClass}${delayStyle}>${mouth}</g>`;
}

// --- Main generator ---
function generateFaceSvg(seed, options = {}) {
  const { size = 64, animate = true } = options;
  const params = seedToParams(seed);
  const shouldAnimate = animate && size >= 32;

  const floatDelay = shouldAnimate ? `${(params.animDelay * 6).toFixed(2)}s` : undefined;
  const blinkDelay = shouldAnimate ? `${(params.animDelay * 4).toFixed(2)}s` : undefined;
  const mouthDelay = shouldAnimate ? `${(params.animDelay * 7).toFixed(2)}s` : undefined;

  const floatClass = shouldAnimate ? ' class="ga-face-animated"' : '';
  const floatStyle = floatDelay ? ` style="animation-delay:${floatDelay}"` : '';

  const parts = [
    renderFaceShape(params.faceShape, params.skinColor),
    renderCheeks(params.hasCheeks, params.cheekColor),
    renderEyes(params.eyeStyle, params.eyeColor, params.pupilSize, params.skinColor, shouldAnimate, blinkDelay),
    renderEyebrows(params.eyebrowStyle, params.skinColor),
    renderNose(params.noseStyle),
    renderMouth(params.mouthStyle, params.skinColor, shouldAnimate, mouthDelay),
  ].join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Avatar for ${seed}" style="flex-shrink:0;border-radius:50%"><g${floatClass}${floatStyle}>${parts}</g></svg>`;
}

// ============================================================
// Demo page logic
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // --- Hero grid ---
  const heroSeeds = [
    'Alice', 'Bob', 'Charlie', 'Diana',
    'Edward', 'Fiona', 'George', 'Hannah',
    'Ivan', 'Julia', 'Kevin', 'Luna',
  ];
  const heroGrid = document.getElementById('hero-grid');
  if (heroGrid) {
    heroGrid.innerHTML = heroSeeds.map(s => generateFaceSvg(s, { size: 80, animate: true })).join('');
  }

  // --- Install tabs ---
  const commands = {
    npm: 'npm i facegen',
    bun: 'bun add facegen',
    pnpm: 'pnpm add facegen',
    yarn: 'yarn add facegen',
  };
  const installCode = document.getElementById('install-code');
  const installTabs = document.querySelectorAll('.install-tab');

  installTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      installTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (installCode) installCode.textContent = commands[tab.dataset.pm] || commands.npm;
    });
  });

  // Copy button
  const copyBtn = document.getElementById('copy-install');
  if (copyBtn && installCode) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(installCode.textContent).then(() => {
        copyBtn.textContent = 'copied!';
        setTimeout(() => { copyBtn.textContent = 'copy'; }, 1500);
      });
    });
  }

  // --- Playground ---
  const playInput = document.getElementById('play-input');
  const previewSmall = document.getElementById('preview-small');
  const previewMedium = document.getElementById('preview-medium');
  const previewLarge = document.getElementById('preview-large');
  const sizeBtns = document.querySelectorAll('.size-btn');
  const animToggle = document.getElementById('anim-toggle');

  let playSize = 64;
  let playAnimate = true;

  function updatePlayground() {
    const seed = playInput ? playInput.value || 'facegen' : 'facegen';
    if (previewSmall)  previewSmall.innerHTML  = generateFaceSvg(seed, { size: 32, animate: playAnimate });
    if (previewMedium) previewMedium.innerHTML = generateFaceSvg(seed, { size: 64, animate: playAnimate });
    if (previewLarge)  previewLarge.innerHTML  = generateFaceSvg(seed, { size: 96, animate: playAnimate });
  }

  if (playInput) {
    playInput.addEventListener('input', updatePlayground);
    updatePlayground();
  }

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      playSize = parseInt(btn.dataset.size, 10);
      updatePlayground();
    });
  });

  if (animToggle) {
    animToggle.addEventListener('click', () => {
      playAnimate = !playAnimate;
      animToggle.classList.toggle('active', playAnimate);
      animToggle.textContent = playAnimate ? 'animate: on' : 'animate: off';
      updatePlayground();
    });
  }

  // --- Gallery ---
  const gallerySeeds = [
    'alex@mail.com', 'sam.dev', 'robot-42', 'neo', 'trinity', 'morpheus',
    'ada-lovelace', 'grace-hopper', 'linus-torvalds', 'margaret-hamilton',
    'john-carmack', 'satoshi', 'vitalik', 'dhh', 'matz', 'guido',
    'user_1337', 'hello@world', 'foo.bar.baz', 'anon#9999',
    'cosmic-ray', 'pixel-punk', 'quantum-bit', 'neon-cat',
  ];
  const galleryGrid = document.getElementById('gallery-grid');
  if (galleryGrid) {
    galleryGrid.innerHTML = gallerySeeds.map(s =>
      `<div class="gallery-item">${generateFaceSvg(s, { size: 72, animate: true })}<span class="gallery-seed">${s}</span></div>`
    ).join('');
  }

  // --- Scroll fade-in ---
  const faders = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  faders.forEach(el => observer.observe(el));

  // --- Code copy buttons ---
  document.querySelectorAll('.code-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const block = btn.closest('.code-block');
      const code = block.querySelector('code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'copied!';
        setTimeout(() => { btn.textContent = 'copy'; }, 1500);
      });
    });
  });
});
