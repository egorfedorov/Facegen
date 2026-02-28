import { seedToParams } from './hash';
import type { FaceParams, FacegenOptions } from './types';

const ANIM_THRESHOLD = 32;

// --- Color helpers ---

function darken(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount)) | 0;
  const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount)) | 0;
  const b = Math.max(0, (n & 0xff) * (1 - amount)) | 0;
  return `rgb(${r},${g},${b})`;
}

function darkenForLips(hex: string): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  const r = Math.min(255, Math.max(0, (((n >> 16) & 0xff) * 0.7 + 40) | 0));
  const g = Math.max(0, (((n >> 8) & 0xff) * 0.5) | 0);
  const b = Math.max(0, ((n & 0xff) * 0.5) | 0);
  return `rgb(${r},${g},${b})`;
}

// --- Part renderers ---

function renderFaceShape(variant: number, fill: string): string {
  const shapes: Record<number, string> = {
    0: `<ellipse cx="50" cy="52" rx="34" ry="38"/>`,
    1: `<rect x="16" y="14" width="68" height="76" rx="28" ry="28"/>`,
    2: `<ellipse cx="50" cy="50" rx="36" ry="36"/>`,
    3: `<path d="M50 12 C74 12 82 30 82 52 C82 76 68 88 50 88 C32 88 18 76 18 52 C18 30 26 12 50 12Z"/>`,
    4: `<path d="M50 10 C78 10 84 34 84 50 C84 70 74 90 50 90 C26 90 16 70 16 50 C16 34 22 10 50 10Z"/>`,
  };
  return `<g fill="${fill}" stroke="none">${shapes[variant] ?? shapes[0]}</g>`;
}

function renderCheeks(show: boolean, color: string): string {
  if (!show) return '';
  return `<g><ellipse cx="28" cy="58" rx="6" ry="4" fill="${color}"/><ellipse cx="72" cy="58" rx="6" ry="4" fill="${color}"/></g>`;
}

function renderEyes(variant: number, color: string, pupilSize: number, skinColor: string, shouldAnimate: boolean, blinkDelay?: string): string {
  const lx = 36, rx = 64, y = 46;
  const r = 5.5;
  const pr = r * pupilSize;

  let eyeShapes = '';

  if (variant === 0) {
    eyeShapes = `
      <circle cx="${lx}" cy="${y}" r="${r}" fill="white"/>
      <circle cx="${rx}" cy="${y}" r="${r}" fill="white"/>
      <circle cx="${lx}" cy="${y}" r="${pr}" fill="${color}"/>
      <circle cx="${rx}" cy="${y}" r="${pr}" fill="${color}"/>
      <circle cx="${lx + 1}" cy="${y - 1}" r="${pr * 0.45}" fill="#111"/>
      <circle cx="${rx + 1}" cy="${y - 1}" r="${pr * 0.45}" fill="#111"/>`;
  } else if (variant === 1) {
    eyeShapes = `
      <ellipse cx="${lx}" cy="${y}" rx="${r + 1}" ry="${r - 1}" fill="white"/>
      <ellipse cx="${rx}" cy="${y}" rx="${r + 1}" ry="${r - 1}" fill="white"/>
      <circle cx="${lx}" cy="${y}" r="${pr * 0.9}" fill="${color}"/>
      <circle cx="${rx}" cy="${y}" r="${pr * 0.9}" fill="${color}"/>
      <circle cx="${lx + 0.8}" cy="${y - 0.8}" r="${pr * 0.4}" fill="#111"/>
      <circle cx="${rx + 0.8}" cy="${y - 0.8}" r="${pr * 0.4}" fill="#111"/>`;
  } else if (variant === 2) {
    eyeShapes = `
      <ellipse cx="${lx}" cy="${y}" rx="${r - 1}" ry="${r + 1}" fill="white"/>
      <ellipse cx="${rx}" cy="${y}" rx="${r - 1}" ry="${r + 1}" fill="white"/>
      <circle cx="${lx}" cy="${y}" r="${pr * 0.85}" fill="${color}"/>
      <circle cx="${rx}" cy="${y}" r="${pr * 0.85}" fill="${color}"/>
      <circle cx="${lx}" cy="${y - 0.5}" r="${pr * 0.38}" fill="#111"/>
      <circle cx="${rx}" cy="${y - 0.5}" r="${pr * 0.38}" fill="#111"/>`;
  } else if (variant === 3) {
    eyeShapes = `
      <circle cx="${lx}" cy="${y}" r="3.5" fill="#222"/>
      <circle cx="${rx}" cy="${y}" r="3.5" fill="#222"/>
      <circle cx="${lx + 0.8}" cy="${y - 0.8}" r="1" fill="white" opacity="0.7"/>
      <circle cx="${rx + 0.8}" cy="${y - 0.8}" r="1" fill="white" opacity="0.7"/>`;
  } else if (variant === 4) {
    eyeShapes = `
      <ellipse cx="${lx}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="white"/>
      <ellipse cx="${rx}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="white"/>
      <circle cx="${lx}" cy="${y + 0.5}" r="${pr * 0.7}" fill="${color}"/>
      <circle cx="${rx}" cy="${y + 0.5}" r="${pr * 0.7}" fill="${color}"/>
      <circle cx="${lx + 0.5}" cy="${y}" r="${pr * 0.32}" fill="#111"/>
      <circle cx="${rx + 0.5}" cy="${y}" r="${pr * 0.32}" fill="#111"/>`;
  } else {
    eyeShapes = `
      <circle cx="${lx}" cy="${y}" r="${r + 1}" fill="white"/>
      <circle cx="${rx}" cy="${y}" r="${r + 1}" fill="white"/>
      <circle cx="${lx}" cy="${y}" r="${pr}" fill="${color}"/>
      <circle cx="${rx}" cy="${y}" r="${pr}" fill="${color}"/>
      <circle cx="${lx + 0.5}" cy="${y - 0.5}" r="${pr * 0.42}" fill="#111"/>
      <circle cx="${rx + 0.5}" cy="${y - 0.5}" r="${pr * 0.42}" fill="#111"/>
      <circle cx="${lx + 2}" cy="${y - 2}" r="1.2" fill="white" opacity="0.9"/>
      <circle cx="${rx + 2}" cy="${y - 2}" r="1.2" fill="white" opacity="0.9"/>`;
  }

  // Eyelid blink overlays
  const delayStyle = blinkDelay ? `animation-delay:${blinkDelay}` : '';
  const eyelidW = (r + 1.5) * 2;
  const eyelidH = (r + 2) * 2;
  const eyelids = `
    <rect class="ga-eyelid" x="${lx - r - 1.5}" y="${y - r - 2}" width="${eyelidW}" height="${eyelidH}" rx="${r}" fill="${skinColor}" style="transform-origin:${lx}px ${y}px;${delayStyle}"/>
    <rect class="ga-eyelid" x="${rx - r - 1.5}" y="${y - r - 2}" width="${eyelidW}" height="${eyelidH}" rx="${r}" fill="${skinColor}" style="transform-origin:${rx}px ${y}px;${delayStyle}"/>`;

  const animClass = shouldAnimate ? ' class="ga-eyes-animated"' : '';
  return `<g${animClass}>${eyeShapes}${eyelids}</g>`;
}

function renderEyebrows(variant: number, skinColor: string): string {
  const browColor = darken(skinColor, 0.35);
  const ly = 36, ry = 36;
  const lx = 36, rx = 64;

  let brows = '';
  if (variant === 0) {
    brows = `<line x1="${lx - 5}" y1="${ly}" x2="${lx + 5}" y2="${ly}"/><line x1="${rx - 5}" y1="${ry}" x2="${rx + 5}" y2="${ry}"/>`;
  } else if (variant === 1) {
    brows = `<path d="M${lx - 5} ${ly + 1} Q${lx} ${ly - 4} ${lx + 5} ${ly + 1}"/><path d="M${rx - 5} ${ry + 1} Q${rx} ${ry - 4} ${rx + 5} ${ry + 1}"/>`;
  } else if (variant === 2) {
    brows = `<line x1="${lx - 5}" y1="${ly + 2}" x2="${lx + 4}" y2="${ly - 2}"/><line x1="${rx - 4}" y1="${ry - 2}" x2="${rx + 5}" y2="${ry + 2}"/>`;
  } else if (variant === 3) {
    brows = `<line x1="${lx - 5}" y1="${ly - 2}" x2="${lx + 4}" y2="${ly + 1}"/><line x1="${rx - 4}" y1="${ry + 1}" x2="${rx + 5}" y2="${ry - 2}"/>`;
  } else {
    brows = `<line x1="${lx - 5}" y1="${ly}" x2="${lx + 5}" y2="${ly}" stroke-width="2.4"/><line x1="${rx - 5}" y1="${ry}" x2="${rx + 5}" y2="${ry}" stroke-width="2.4"/>`;
  }

  return `<g fill="none" stroke="${browColor}" stroke-width="1.6" stroke-linecap="round">${brows}</g>`;
}

function renderNose(variant: number): string {
  const cx = 50, cy = 56;
  const shadow = 'rgba(0,0,0,0.12)';

  if (variant === 0) {
    return `<circle cx="${cx}" cy="${cy}" r="1.8" fill="${shadow}"/>`;
  } else if (variant === 1) {
    return `<line x1="${cx}" y1="${cy - 2}" x2="${cx}" y2="${cy + 2}" stroke="${shadow}" stroke-width="1.5" stroke-linecap="round"/>`;
  } else if (variant === 2) {
    return `<circle cx="${cx - 2.2}" cy="${cy}" r="1.2" fill="${shadow}"/><circle cx="${cx + 2.2}" cy="${cy}" r="1.2" fill="${shadow}"/>`;
  } else {
    return `<path d="M${cx} ${cy - 2} L${cx + 2.5} ${cy + 2} L${cx - 2.5} ${cy + 2}Z" fill="${shadow}"/>`;
  }
}

function renderMouth(variant: number, skinColor: string, shouldAnimate: boolean, animDelay?: string): string {
  const cx = 50, cy = 66;
  const lipColor = darkenForLips(skinColor);

  let mouth = '';
  if (variant === 0) {
    mouth = `<path d="M${cx - 6} ${cy} Q${cx} ${cy + 5} ${cx + 6} ${cy}" fill="none" stroke="${lipColor}" stroke-width="1.5" stroke-linecap="round"/>`;
  } else if (variant === 1) {
    mouth = `<path d="M${cx - 9} ${cy - 1} Q${cx} ${cy + 7} ${cx + 9} ${cy - 1}" fill="none" stroke="${lipColor}" stroke-width="1.5" stroke-linecap="round"/>`;
  } else if (variant === 2) {
    mouth = `<path d="M${cx - 7} ${cy} Q${cx} ${cy + 8} ${cx + 7} ${cy}" fill="#3a1c1c" fill-opacity="0.6" stroke="${lipColor}" stroke-width="1.2"/>`;
  } else if (variant === 3) {
    mouth = `<line x1="${cx - 5}" y1="${cy}" x2="${cx + 5}" y2="${cy}" stroke="${lipColor}" stroke-width="1.5" stroke-linecap="round"/>`;
  } else if (variant === 4) {
    mouth = `<ellipse cx="${cx}" cy="${cy}" rx="3" ry="3.5" fill="#3a1c1c" fill-opacity="0.5" stroke="${lipColor}" stroke-width="1.2"/>`;
  } else {
    mouth = `<path d="M${cx - 6} ${cy + 1} Q${cx - 1} ${cy - 2} ${cx + 6} ${cy - 3}" fill="none" stroke="${lipColor}" stroke-width="1.5" stroke-linecap="round"/>`;
  }

  const animClass = shouldAnimate ? ' class="ga-mouth-animated"' : '';
  const delayStyle = animDelay ? ` style="animation-delay:${animDelay}"` : '';
  return `<g${animClass}${delayStyle}>${mouth}</g>`;
}

// --- Main export ---

/**
 * Generate an SVG string for a face avatar from a seed string.
 */
export function generateFaceSvg(seed: string, options: FacegenOptions = {}): string {
  const { size = 64, animate = true } = options;
  const params = seedToParams(seed);
  const shouldAnimate = animate && size >= ANIM_THRESHOLD;

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

export { seedToParams };
