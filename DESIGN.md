---
name: Rasha
description: A dual-theme glassmorphism car-wash booking app for Khartoum, Sudan
colors:
  primary-light: "#155058"
  primary-dark: "#74f5ff"
  background-light: "#f8fffe"
  background-dark: "#070d1a"
  on-surface-light: "#0d1825"
  on-surface-dark: "#ffffff"
  error-light: "#c0392b"
  error-dark: "#ff6b6b"
typography:
  display:
    fontFamily: "Montserrat, Noto Kufi Arabic, sans-serif"
  body:
    fontFamily: "Inter, Noto Kufi Arabic, sans-serif"
rounded:
  xl: "12px"
  "2xl": "20px"
  "3xl": "24px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.primary-light}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "12px 24px"
---

# Design System: Rasha (Customer App)

## Overview

**Creative North Star: "The Tidal Glass"**

The customer app is a dual-theme glassmorphism system: white frosted-glass cards on an off-white, teal-tinted background in light mode (`#155058` primary teal, `#f8fffe` background), and near-black navy glass with a cyan glow (`#74f5ff`) in dark mode. Both are intended as a single coherent identity — "water" expressed as clean daylight teal by default, and as glowing night water in dark mode.

**As currently shipped, the two themes are not yet equally finished.** Live inspection (dark mode: coherent, polished, glowing hero; light mode: white glass cards render correctly, but the hero section and areas below "Our Services" still show dark/black background bleeding through) shows light mode is a real but incomplete pass, not a rendering bug to hand-wave — treat this as a known implementation gap, not part of the intended design language. Do not silently document light mode as if it fully matches the dark-mode standard; the `/impeccable audit` or a targeted `/impeccable harden` pass should close that gap before further world decisions are layered on top of it.

**Key Characteristics:**
- Dual-theme by design: light = teal-on-white glass, dark = cyan-glow-on-navy glass
- Frosted-glass card language throughout (both themes)
- Fully rounded pill CTAs, xl (12px) inputs/buttons, up to 3xl (24px) hero/feature cards
- Bilingual EN/AR, same type family as the sibling Rasha Staff Portal (Montserrat/Inter)
- **Known gap:** light-mode background does not yet consistently apply below the hero — flagged for hardening, not treated as intentional

## Colors

### Primary
- **Light mode — Deep Teal** (`#155058`): primary buttons, links, active nav, on-primary is white.
- **Dark mode — Signal Cyan** (`#74f5ff`): the equivalent accent role in dark mode — glowing text, active states, primary button gradients.

### Neutral
- **Light:** off-white background (`#f8fffe`), white glass cards, dark navy text (`#0d1825`).
- **Dark:** near-black navy background (`#070d1a`), translucent navy glass cards, white text.

### Error
- Light: `#c0392b` (a warm red distinct from the teal system). Dark: `#ff6b6b`.

## Typography

**Display Font:** Montserrat. **Body Font:** Inter (with Noto Kufi Arabic fallback in both).

## Layout

Same structural grammar as documented previously: `max-w-*` centered containers, fixed top nav / bottom mobile nav, generous section spacing. Not re-verified page-by-page in this pass.

## Elevation & Depth

Frosted glass (`backdrop-filter: blur`) carries depth in both themes; dark mode adds a cyan-tinted inset glow on top of the same glass base, light mode relies on blur + soft shadow only (`--glass-shadow-card`).

## Shapes

Full-round pills for primary CTAs, 12px radius for inputs/standard buttons, up to 24px for large cards — consistent radius scale across both themes.

## Components

### Buttons
- **Primary:** solid teal (light) / cyan-hydro-gradient (dark), rounded-full, white/dark on-primary text.

### Cards
- White frosted glass (light) / translucent navy glass with cyan glow (dark), consistently used for services, loyalty, and booking cards.

## Do's and Don'ts

### Do:
- **Do** treat light and dark mode as one identity expressed two ways, not two separate design systems.
- **Do** finish the light-mode background pass before adding new light-mode-only components.

### Don't:
- **Don't** assume light mode is production-ready from the token layer alone — verify rendered output before relying on it as a reference.
- **Don't** mix this app's teal/glow vocabulary with Rasha Staff Portal's teal/cream vocabulary as if they're the same system — they share type and market context but are visually distinct products.
