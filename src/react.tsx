import React, { useMemo } from 'react';
import { seedToParams } from './hash';
import { generateFaceSvg } from './svg';
import type { FacegenProps } from './types';

/**
 * React component that renders a generative face avatar.
 *
 * Uses dangerouslySetInnerHTML with the pure SVG generator
 * to avoid duplicating rendering logic.
 */
export function Facegen({
  seed,
  size = 64,
  animate = true,
  alt = 'Avatar',
  className,
  style,
}: FacegenProps) {
  const svgString = useMemo(
    () => generateFaceSvg(seed, { size, animate }),
    [seed, size, animate],
  );

  return (
    <span
      className={className}
      style={{ display: 'inline-block', lineHeight: 0, ...style }}
      role="img"
      aria-label={alt}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
