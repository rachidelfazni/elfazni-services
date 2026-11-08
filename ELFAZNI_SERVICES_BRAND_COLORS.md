# ELFAZNI SERVICES — Official Logo Color Audit & Visual Identity Rules

> Source: user-supplied transparent PNG logo. Values below were extracted from its most frequent **fully opaque** pixels; they are not estimates from screenshots of the website.

## 1. Exact brand colors

| Token | HEX | RGB | Meaning |
|---|---|---|---|
| `brand.blue` | `#004AA5` | `0, 74, 165` | Primary logo lettering (ELFAZNI SERVICES) |
| `brand.gold` | `#CC9048` | `204, 144, 72` | Primary logo emblem / brand gold |
| `brand.white` | `#FFFFFF` | `255, 255, 255` | Clean neutral background and reversed text |
| `brand.transparent` | `transparent` | — | Logo background is transparent, **not black** |

The apparent black background in some viewers is only a transparency preview. Do not turn it into a black logo background.

## 2. Color usage and contrast

- **Use `#CC9048` as the canonical gold**, not a darker bronze or brown. Do not replace it with `#9B6A23`, `#8B5E1A`, etc. unless explicitly designated as a separate accessibility text color.
- **Use `#004AA5` as the canonical blue**. A dark navy may be used for backgrounds or readable body text, but it must never silently replace the official logo blue.
- On **white or light surfaces**: display the original blue-and-gold transparent logo. Prefer blue for text and gold for accents, strokes, icons, or decorative elements. The gold is not sufficiently high-contrast for small text on white; use a darker accessible text token for small lettering while retaining original gold for non-text branding.
- On **navy/dark blue surfaces**: use an approved light/reversed logo variant (white lettering and the exact original gold emblem) if an actual source asset exists. Never recolor the original file by arbitrary CSS filters. If no approved light variant exists, request/design a dedicated variant from the original vector source.
- On **gold surfaces**: use a tested dark-blue/white variant with sufficient contrast. Avoid placing the gold emblem directly on a same-gold background; use a neutral container or appropriate approved variant.
- Do not add opaque white rectangles around logos; retain SVG/PNG transparency.
- Preserve emblem geometry, typography, proportions, and clear space. Never stretch, crop, distort, or add shadows that make the emblem muddy.

## 3. UI visual direction

Design a premium, clean, bright travel-services interface using the official logo palette. Use white/off-white as the dominant surface, brand blue for primary actions, and the exact brand gold as a controlled highlight. Avoid overly dark, muddy, brown-tinted gradients and low-contrast gold-on-navy combinations. Dark navy is allowed in the hero and admin sidebar as a supporting surface, not as a substitute for the official blue.

Suggested **supporting UI tokens (not sampled from logo)**:

- `surface.page`: `#F7F9FC`
- `surface.card`: `#FFFFFF`
- `text.primary`: `#102D4D`
- `border.subtle`: `#DCE6F2`
- `brand.goldTextOnWhite`: `#81521C` (only for small accessible text, not for changing the emblem)
- `brand.navySupport`: `#10345B` (supporting dark background only)

## 4. CSS design tokens

```css
:root {
  --brand-blue: #004AA5;
  --brand-gold: #CC9048;
  --brand-white: #FFFFFF;
  --brand-navy-support: #10345B;
  --brand-gold-text-on-light: #81521C;
  --surface-page: #F7F9FC;
  --surface-card: #FFFFFF;
  --text-primary: #102D4D;
  --border-subtle: #DCE6F2;
}
```

## 5. Antigravity implementation brief

1. Audit the whole website, CRM, Admin Panel, login screens, navigation, cards, buttons, badges, charts, and modal dialogs for color drift.
2. Find every hard-coded gold/bronze/brown color and map its purpose; replace **brand gold** usages with `#CC9048` while preserving distinct functional status colors and accessibility requirements.
3. Find every hard-coded primary blue; use `#004AA5` for official brand-blue elements. Keep separate support navy tokens for dark surfaces.
4. Centralize tokens in the project's existing theme system, CSS variables, and/or Tailwind configuration rather than scattering values.
5. Inspect all logo assets (horizontal, vertical, light background, blue background, gold background). Use approved variants by surface; never apply CSS filters to simulate variants.
6. Improve contrast, especially small gold text. Maintain readable Arabic typography (Bahij where available), RTL layouts, and responsive UI.
7. Preserve existing application behavior, data, routes, and permissions. Do not redesign unrelated functionality.
8. Verify desktop and mobile screenshots, color consistency, accessible contrast, and build/tests. Report every changed file and any missing logo variants.

## 6. Acceptance criteria

- Gold emblem and all official gold brand accents use exactly `#CC9048`.
- Blue logo lettering and official brand-blue accents use exactly `#004AA5`.
- No logo appears with an accidental opaque black or white background.
- Light/dark/gold surfaces select appropriate approved logo variants.
- Small text remains legible and does not rely on low-contrast gold.
- Website, CRM, and Admin Panel look like one coherent brand family.
