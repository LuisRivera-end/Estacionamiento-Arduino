---
name: Smart Parking Cyber-Glass Design System
colors:
  surface: '#070b13'
  surface-dim: '#0b1120'
  surface-bright: '#111b30'
  surface-container-lowest: '#0a0f1d'
  surface-container-low: '#0d1527'
  surface-container: '#101b33'
  surface-container-high: '#152443'
  surface-container-highest: '#1a2d53'
  on-surface: '#e5edf7'
  on-surface-variant: '#92a4bc'
  inverse-surface: '#e5edf7'
  inverse-on-surface: '#070b13'
  outline: '#1e2e4a'
  outline-variant: '#2a3f65'
  surface-tint: '#06b6d4'
  primary: '#06b6d4'
  on-primary: '#ffffff'
  primary-container: '#0891b2'
  on-primary-container: '#e0f7fa'
  inverse-primary: '#0891b2'
  secondary: '#10b981'
  on-secondary: '#ffffff'
  secondary-container: '#059669'
  on-secondary-container: '#e6fbf4'
  tertiary: '#f59e0b'
  on-tertiary: '#ffffff'
  tertiary-container: '#d97706'
  on-tertiary-container: '#fef3c7'
  error: '#ef4444'
  on-error: '#ffffff'
  error-container: '#dc2626'
  on-error-container: '#fee2e2'
  primary-fixed: '#e0f7fa'
  primary-fixed-dim: '#a5f3fc'
  on-primary-fixed: '#083344'
  on-primary-fixed-variant: '#0369a1'
  secondary-fixed: '#e6fbf4'
  secondary-fixed-dim: '#a7f3d0'
  on-secondary-fixed: '#064e3b'
  on-secondary-fixed-variant: '#047857'
  background: '#070b13'
  on-background: '#e5edf7'
  surface-variant: '#0d1527'
typography:
  display-lg:
    fontFamily: Orbitron
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: '0.05em'
  headline-lg:
    fontFamily: Orbitron
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: '0.02em'
  headline-md:
    fontFamily: Orbitron
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

The chosen design style is a dark **Cybernetic Glassmorphism** model. It blends deep slate-blue background layers with semi-transparent frosted-glass containers, thin energetic outlines, and neon-glowing color accents to provide depth, visual hierarchy, and intuitive operational focus.

## Colors

The color palette is engineered to provide clear status indications and excellent readability under high-tech, low-light conditions:

- **Primary (Electric Cyan - #06b6d4):** Used for primary operations, active states, main navigations, and principal CTAs. It provides an immediate technical edge.
- **Secondary (Emerald Green - #10b981):** Represents active/available status, success indications, paid tickets, and operational health.
- **Tertiary (Neon Amber - #f59e0b):** Denotes mid-level attention states, simulated financial summaries, active transaction phases, and edit options.
- **Error/Alert (Vibrant Crimson - #ef4444):** Reserved for occupied spaces warning thresholds, lost tickets, backup errors, or terminal failures.
- **Neutral Backgrounds:** Deep space blues and rich charcoal shades (`#070b13` to `#101b33`) serve as the canvas. Text is rendered in crisp, slightly tinted white (`#e5edf7`) to minimize eye strain.

## Typography

To enhance the high-tech IoT control center atmosphere, a dual-font strategy is deployed:

- **Data & Numbers (Orbitron):** This modern, futuristic geometric font is used for all prominent numeric readings, statistics, times, and key headings. The blocky, clean digital structure reflects real-time hardware clock and IoT sensor outputs.
- **Interface & Content (Inter):** A refined, highly-legible geometric sans-serif is used for structural UI controls, navigation lists, descriptive tables, and supportive text.
- **Hierarchy:** Strong contrast between data readings (bold, spaced Orbitron metrics) and functional descriptions (medium-weight Inter labels) allows for immediate telemetry scanning.

## Layout & Spacing

The layout is built upon a standard responsive grid designed to scale from desktop control panels to mobile ticketing interfaces.

- **Grid:** A responsive 12-column grid system is used on desktops, with standard 24px gutters.
- **Rhythm:** All internal padding and margin sizes are multiples of the 8px base unit. This ensures alignment, structured telemetry panels, and visual consistency across all forms and tables.
- **Alignment:** Central responsive alignment on mobile payment pages, and asymmetrical sidebar-centric dashboards on administrative control screens.

## Elevation & Depth: Glassmorphic Layers

Visual layers are established using **Tonal Opacities** and **Diffused Backlight Shadows** rather than traditional opaque elevations:

- **Base Layer:** The solid deep space background (`#070b13`).
- **Glass Panels:** Semi-transparent container panels (`#0d1527` with 80% opacity) utilizing `backdrop-filter: blur(20px)` and thin `1px` translucent borders (`rgba(30, 46, 74, 0.4)`).
- **Active Backlights:** Subtle, extra-diffused glowing shadows behind containers tinted with the status color of the metric. For instance, a green metric card has a soft green glow: `box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15)`.

## Shapes

- **Buttons & Small Controls:** Consistent `8px` rounded corners to keep them sharp and professional.
- **Cards & Primary Panels:** Soft `16px` to `24px` rounded corners (`rounded-lg` to `rounded-xl`) to contrast beautifully against the geometric typography and grid lines.
- **Pills/Badges:** Fully rounded (`rounded-full`) for high-contrast tag structures like status badges or coupon types.

## Components

- **Sidebar Nav:** Frosted glass panel with vertical neon indicator bars showing active routes. Subtly glowing icons in cyan or muted slate-blue.
- **Metric Cards:** Rounded glass panels displaying active sensor readings. Large Orbitron digits glowing with appropriate status colors (cyan, green, amber, red).
- **Interactive Forms:** Boxed fields with high-opacity borders that glow and transition their outline color when focused.
- **Tables:** Alternating rows using slight background shifts, translucent cian borders, and rounded headers for a clean, grid-integrated look.
