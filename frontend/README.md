# Frontend — HarborGuard AI

React/TypeScript components for the HarborGuard maritime risk platform. These are designed to be integrated into a Vite or Next.js build toolchain.

## Components

### Pages

- **`LandingPage.tsx`** — Full editorial-style dark-theme landing page with animated sections, feature grid, and CTAs. Ported from HTF_Hackathonb.

### Components

- **`SupplyChainGlobe.tsx`** — Canvas-based 3D rotating globe with animated trade route arcs (Asia ↔ USA). Ported from HTF_Hackathonb.
- **`LiveSignalsPanel.tsx`** — Real-time RSS signal feed with auto-refresh (60s), keyword match highlights, and source/time metadata. Fetches from `/api/signals`. Ported from WorldMonitor.
- **`KeywordMonitor.tsx`** — "Risk Radar" keyword input and tag UI. Supports comma-separated batch input and color-coded tags. Filters the `LiveSignalsPanel` feed via backend keyword matching. Ported from WorldMonitor.

### Hooks

- **`useScrollAnimations.ts`** — Scroll reveal, count-up animation, and parallax effect hooks using IntersectionObserver. Ported from HTF_Hackathonb.

## Setup

These components require a React build toolchain. To set up:

```bash
cd frontend
npm init -y
npm install react react-dom
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react
```

## Design System

All components follow the HarborGuard dark theme:
- Background: `#08080e`
- Text: `#e4e0d8`
- Accent gold: `#e8c872`
- Success: `#4ade80`
- Warning: `#f87171`
- Muted: `#8a8a96`
- Font: Inter (Google Fonts)

## Origin

| Component | Source Project |
|---|---|
| LandingPage, SupplyChainGlobe, useScrollAnimations | HTF_Hackathonb |
| LiveSignalsPanel, KeywordMonitor | WorldMonitor |
