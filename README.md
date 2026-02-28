# facegen

Generate unique animated faces from any string. Zero dependencies, deterministic, SVG + CSS animations.

```
npm i facegen
```

## React

```tsx
import { Facegen } from 'facegen';
import 'facegen/css';

<Facegen seed="alice@example.com" size={48} animate />
```

## Vanilla JS

```js
import { generateFaceSvg } from 'facegen';

const svg = generateFaceSvg('alice@example.com', { size: 48, animate: true });
document.getElementById('avatar').innerHTML = svg;
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `seed` | `string` | — | Any string. Determines the face. |
| `size` | `number` | `64` | Avatar size in px. Below 32px animations are disabled. |
| `animate` | `boolean` | `true` | Enable blink / float / twitch animations. |
| `alt` | `string` | `"Avatar"` | Accessible label (React only). |

## How it works

1. DJB2 hash of the seed string
2. Slot-based parameter extraction (face shape, skin color, eyes, etc.)
3. Pure SVG string generation — no canvas, no WebGL
4. CSS keyframe animations with unique phase offsets

## License

MIT
