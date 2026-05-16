---
name: Prism Light
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#494552'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#7a7583'
  outline-variant: '#cac4d4'
  surface-tint: '#674bb5'
  primary: '#674bb5'
  on-primary: '#ffffff'
  primary-container: '#a78bfa'
  on-primary-container: '#3c1989'
  inverse-primary: '#cebdff'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#6a5f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#af9e00'
  on-tertiary-container: '#3b3500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e8ddff'
  primary-fixed-dim: '#cebdff'
  on-primary-fixed: '#21005e'
  on-primary-fixed-variant: '#4f319c'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#f8e454'
  tertiary-fixed-dim: '#dbc839'
  on-tertiary-fixed: '#201c00'
  on-tertiary-fixed-variant: '#504700'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  code-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter-sm: 16px
  gutter-md: 24px
  margin-sm: 16px
  margin-lg: 48px
  container-max: 1440px
---

## Brand & Style

This design system is built for technical audiences who demand high-density information without the cognitive load of cluttered interfaces. It employs a **Glass-Minimalist** aesthetic, merging the precision of developer tools with an airy, high-contrast clarity.

The brand personality is authoritative yet approachable—"Developer-grade" precision wrapped in a clean, sophisticated shell. It evokes a sense of organized intelligence through generous white space, crisp lines, and subtle translucent layering. The UI should feel like a high-end laboratory instrument: functional, transparent, and impeccably sharp.

## Colors

The palette is anchored by a pure white background and a secondary light gray (#F8FAFC) used for subtle differentiation of interface regions. 

The primary accent is a signature **Violet (#A78BFA)**, carefully balanced to maintain its vibrancy against light backgrounds while remaining accessible. Text and iconography utilize **Deep Charcoal (#1E293B)** to ensure maximum readability and a professional, grounded feel. Functional colors (success, error, warning) should follow a similar desaturated but high-contrast logic to maintain the "Precision" aesthetic.

## Typography

This design system uses **Geist** exclusively to maintain a technical, engineering-focused atmosphere. The typography system prioritizes horizontal rhythm and legibility.

Headlines feature tight tracking and bold weights to provide strong visual anchors. Body text is optimized for long-form reading with a 1.6x line height to allow the UI to "breathe." A dedicated code style is utilized for technical data, ensuring that monospaced characters align with the grid-based logic of the layout.

## Layout & Spacing

The layout is governed by an **8px grid system** (4px for micro-adjustments). It utilizes a **12-column fluid grid** for dashboard views, transitioning to a centered, fixed-width model (max 1440px) for documentation or settings pages to prevent line lengths from becoming excessive.

Breakpoints are set at 768px (Tablet) and 1024px (Desktop). On mobile, gutters and margins are reduced to 16px to maximize screen real estate, while desktop layouts employ 48px margins to emphasize the airy, high-contrast aesthetic.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and subtle tonal layering rather than heavy shadows.

1.  **Base Layer:** Pure White (#FFFFFF) for the lowest level.
2.  **Surface Tiers:** Off-white (#F8FAFC) or light gray borders (1px, #E2E8F0) to define containers.
3.  **Floating Elements:** Use a backdrop filter (blur: 12px) with a translucent white fill `rgba(255, 255, 255, 0.7)`.
4.  **Shadows:** When necessary for modals, use a "Developer Shadow"—a low-opacity, large-radius neutral shadow (`0 20px 25px -5px rgba(30, 41, 59, 0.04)`) that feels clinical rather than decorative.

## Shapes

The design system utilizes a consistent **12px (0.75rem)** corner radius for primary containers and cards, providing a modern, approachable feel that offsets the technicality of the typeface.

Interactive elements like buttons and input fields default to 8px (0.5rem) to feel more precise. Small utility elements like tags or chips can utilize a full pill-shape (999px) to distinguish them from structural components. Borders should always be thin (1px) and use neutral grays to maintain the "Precision" look.

## Components

### Buttons
Primary buttons use the Violet (#A78BFA) fill with white text. Secondary buttons use a white background with a 1px border (#E2E8F0) and charcoal text. State changes (hover/active) should be subtle shifts in saturation rather than brightness.

### Cards
Cards are the primary organizational unit. They should feature a 1px border (#F1F5F9) and the signature 12px roundedness. For "glass" variants, apply the backdrop blur and translucent fill.

### Input Fields
Inputs should use the #F8FAFC background with a 1px #E2E8F0 border. Upon focus, the border transitions to the Violet accent. Use Geist's monospaced capabilities for numerical inputs or technical parameters.

### Chips & Badges
Small, low-contrast pills with a light violet background (`rgba(167, 139, 250, 0.1)`) and violet text for status indicators. This maintains color branding without overpowering the high-contrast charcoal text of the main content.

### Code Blocks
For this developer-grade system, code blocks should use a very light gray background (#F1F5F9) with no border, using Geist Mono to maintain alignment with the rest of the typography.