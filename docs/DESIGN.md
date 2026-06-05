---
name: Smart Parking Cyber-Glass Design System
colors:
  opsBg:
    dark: '#070b19'
    light: '#eef4ff'
  opsPanel:
    dark: '#0f172a'
    light: '#ffffff'
  opsPanelMuted:
    dark: '#1e293b'
    light: '#f8faff'
  opsBorder:
    dark: '#1e293b'
    light: '#c7d9f5'
  opsText:
    dark: '#f8fafc'
    light: '#0f2057'
  opsMuted:
    dark: '#64748b'
    light: '#4e6490'
  opsGreen:
    dark: '#10b981'
    light: '#15803d'
  opsRed:
    dark: '#ef4444'
    light: '#dc2626'
  opsYellow:
    dark: '#f59e0b'
    light: '#b45309'
  opsCyan:
    dark: '#0ea5e9'
    light: '#0ea5e9'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: '0.02em'
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: '0.02em'
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: '0.02em'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0.05em'
rounded:
  sm: 4px
  DEFAULT: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style: "Cybernetic Glassmorphism"

The brand personality for **Smart Parking (Estacionamiento Inteligente Arduino)** is defined by **High-Tech Operational Efficiency** and **Futuristic Reliability**. The interface represents a high-performance control center that monitors and coordinates hardware events, public payments, and pricing schemes in real time. It aims to invoke immediate confidence in users, signaling clean, state-of-the-art automation.

The chosen design style is a **Cybernetic Glassmorphism** model supporting both Dark and Light modes. It blends deep slate-blue background layers (or soft ice-blue layers in light mode) with semi-transparent frosted-glass containers, thin clean outlines, and neon/vibrant glowing color accents to provide depth, visual hierarchy, and intuitive operational focus.

## Colors

The color palette is engineered as semantic tokens (`ops*`) to provide clear status indications and excellent readability under high-tech, low-light (dark mode) and high-visibility (light mode) conditions:

- **opsCyan (Sky Blue - #0ea5e9):** Used for primary operations, active states, main navigations, and principal CTAs. It provides an immediate technical edge.
- **opsGreen (Emerald/Forest Green - Dark: #10b981 / Light: #15803d):** Represents active/available status, success indications, paid tickets, and operational health.
- **opsYellow (Amber - Dark: #f59e0b / Light: #b45309):** Denotes mid-level attention states, simulated financial summaries, active transaction phases, and edit options.
- **opsRed (Crimson - Dark: #ef4444 / Light: #dc2626):** Reserved for occupied spaces warning thresholds, lost tickets, backup errors, or terminal failures.
- **Neutral Backgrounds & Panels:**
  - Dark mode canvas utilizes `opsBg` (`#070b19`) and `opsPanel` (`#0f172a`).
  - Light mode canvas utilizes `opsBg` (`#eef4ff`) and `opsPanel` (`#ffffff`).
  - Text is rendered using `opsText` (Dark: `#f8fafc`, Light: `#0f2057`) and `opsMuted` (Dark: `#64748b`, Light: `#4e6490`) to ensure contrast.

## Typography

To enhance the high-tech IoT control center atmosphere, a dual-font strategy is deployed:

- **Headings & Large Elements (Outfit):** A clean, modern geometric sans-serif loaded from Google Fonts used for all prominent titles and metrics.
- **Interface & Content (Inter):** A refined, highly-legible geometric sans-serif used for structural UI controls, navigation lists, descriptive tables, and supportive text.
- **Hierarchy:** Strong contrast between data readings (bold, spaced Outfit metrics) and functional descriptions (medium-weight Inter labels) allows for immediate telemetry scanning.

## Layout & Spacing

The layout is built upon a standard responsive grid designed to scale from desktop control panels to mobile ticketing interfaces.

- **Grid:** A responsive 12-column grid system is used on desktops, with standard 24px gutters.
- **Rhythm:** All internal padding and margin sizes are multiples of the 8px base unit. This ensures alignment, structured telemetry panels, and visual consistency across all forms and tables.
- **Alignment:** Central responsive alignment on mobile payment pages, and asymmetrical sidebar-centric dashboards on administrative control screens.

## Elevation & Depth: Glassmorphic Layers

Visual layers are established using **Tonal Opacities** and **Diffused Backlight Shadows** rather than traditional opaque elevations:

- **Base Layer:** The solid deep space background (`opsBg`).
- **Glass Panels:** Semi-transparent container panels (`opsPanel` / `opsPanelMuted`) utilizing `backdrop-filter: blur(20px)` and thin `1px` translucent borders (`opsBorder`).
- **Active Backlights:** Subtle, extra-diffused glowing shadows behind containers tinted with the status color of the metric. For instance, a green metric card has a soft green glow: `box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15)`.

## Shapes

- **Buttons & Small Controls:** Consistent `8px` rounded corners to keep them sharp and professional.
- **Cards & Primary Panels:** Soft `16px` to `24px` rounded corners (`rounded-lg` to `rounded-xl`) to contrast beautifully against the geometric typography and grid lines.
- **Pills/Badges:** Fully rounded (`rounded-full`) for high-contrast tag structures like status badges or coupon types.

## Components

- **Sidebar Nav:** Frosted glass panel with vertical neon indicator bars showing active routes. Subtly glowing icons in cyan or muted slate-blue.
- **Metric Cards:** Rounded glass panels displaying active sensor readings. Large Outfit/Inter digits glowing with appropriate status colors (`opsCyan`, `opsGreen`, `opsYellow`, `opsRed`).
- **Interactive Forms:** Boxed fields with high-opacity borders that glow and transition their outline color when focused.
- **Tables:** Alternating rows using slight background shifts, translucent borders, and rounded headers for a clean, grid-integrated look.
