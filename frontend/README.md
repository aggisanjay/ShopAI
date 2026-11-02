# ShopAI frontend (redesign)

Drop-in replacement for your `frontend/` folder. Same API layer, Redux store, hooks, routes and backend contract; new visual layer and a real 3D hero.

```bash
cp ../old-frontend/.env .env      # keep your existing env (VITE_API_URL, Stripe key)
npm install
npm run dev
```

## What changed

| Area | Before | Now |
|---|---|---|
| Hero | Unsplash carousel | **Real 3D sneaker** (GLB, Draco + WebP, 1.3 MB) with drag-rotate + inertia, 3 live colourways (glTF `KHR_materials_variants`), colourway-themed accent, scroll-linked motion |
| Navigation | Fixed bar | Floating glass pill, animated active state, **⌘K search palette** with live results, mobile full-screen menu |
| Product card | Basic | Hover image swap, wishlist spring, **quick view**, add-to-bag success state, low-stock urgency, touch-friendly add button |
| Home | Sections | Brand marquee, bento categories, **scroll-snap product sliders**, deal of the day with countdown, editorial duo, perks, join CTA, **recently viewed** (localStorage) |
| Products | Sidebar + grid | Sticky toolbar, category chips, sort menu, active-filter pills, filter sidebar / mobile bottom sheet. Filters are URL-driven |
| Product detail | Tabs | Hover-zoom gallery, accordion, rating histogram, sticky buy bar, 3 related rails |
| Cart drawer | List | **Free-shipping progress**, promo-code field (wired to your `applyCoupon`), summary |
| Fonts | Google Fonts | Self-hosted (`@fontsource`): Instrument Serif, Inter Variable, JetBrains Mono |

Checkout, Orders, Order details, Profile, Admin and the Auth modal are **not rewritten**. They inherit the new look through the retuned `obsidian` / `gold` tokens and `.glass`, `.btn-*`, `.input-field` classes.

## Edit marketing copy in one place
`src/config/site.js`: announcements, stats, brand list, nav links, perks, colourways.
**The stats (30+ brands, 1M+ customers, 4.8, 2hr) are carried over from your old hero. Replace them with real numbers.**

## Bug fixed on the way
"Buy now" used `window.location.href`, which reloaded the app and dropped Redux state. It now navigates client-side and only proceeds if add-to-cart succeeded.

## 3D notes
- Lazy-loaded (`three` + r3f are separate chunks, ~305 KB gz); first paint uses a baked poster.
- Falls back to the poster for: reduced-motion, Save-Data, no WebGL, memory ≤ 1 GB. Rendering pauses when the hero is off-screen.
- Draco decoder is served from `/public/draco`; no CDN dependency.
- To swap the model: replace `public/models/shoe.glb` (keep it ≤ ~2 MB: `gltf-transform optimize`), update `COLORWAYS` in `site.js`, and re-bake the posters. If your model has no `KHR_materials_variants` it still renders; the colour chips just won't change materials.

## 21st.dev
I could not install from 21st.dev here (its registry needs your personal API key). The components were hand-built in the same stack (shadcn-style `cn()`, Tailwind, Framer Motion) following the patterns of its ecommerce product cards, hero and bento blocks. To use originals instead, open the component page on 21st.dev, copy its **Install** command (`npx shadcn@latest add "https://21st.dev/r/..."`) and run it in this folder; check each component's licence first. Natural swaps: `ProductCard.jsx`, `CategoryBento.jsx`, `Footer.jsx`.

## Credits
Sneaker model "Materials Variants Shoe" © 2021 Shopify, licensed **CC BY 4.0** (attribution is in the footer; keep it).
