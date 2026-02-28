import { SKIN_COLORS, EYE_COLORS, CHEEK_COLORS } from './palettes';
import type { FaceParams } from './types';

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Pull a value from the hash at a specific "slot" so each param is independent */
function pick(hash: number, slot: number, count: number): number {
  const mixed = ((hash >>> slot) ^ (hash >>> (slot + 13)) ^ (hash * (slot + 7))) >>> 0;
  return mixed % count;
}

export function seedToParams(seed: string): FaceParams {
  const h = djb2(seed);

  return {
    faceShape:    pick(h, 0, 5),
    skinColor:    SKIN_COLORS[pick(h, 3, SKIN_COLORS.length)],
    eyeStyle:     pick(h, 6, 6),
    eyeColor:     EYE_COLORS[pick(h, 9, EYE_COLORS.length)],
    pupilSize:    0.55 + (pick(h, 12, 7) / 20),        // 0.55-0.85
    eyebrowStyle: pick(h, 15, 5),
    mouthStyle:   pick(h, 18, 6),
    noseStyle:    pick(h, 21, 4),
    hasCheeks:    pick(h, 24, 3) !== 0,                 // ~67%
    cheekColor:   CHEEK_COLORS[pick(h, 27, CHEEK_COLORS.length)],
    animDelay:    (h % 1000) / 1000,                    // 0-1
  };
}
