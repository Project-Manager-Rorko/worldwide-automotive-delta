# WWA Home Page — Gutenberg Implementation Notes

## Stack

- Parent: Hello Elementor
- Child: `hello-theme-child-new` (this theme)
- Page builder: **None** (core Gutenberg + Custom HTML where needed for pixel layout)
- Font: **Geist** only (woff2 400/500/600/700)
- SEO: Yoast SEO

## URLs

- Site: http://wwa.local/
- Admin: http://wwa.local/wp-admin/
- Home page ID: `7` (static front page)

## Gutenberg structure (Home)

| Section | CSS class | Content approach |
|---------|-----------|------------------|
| Hero | `wwa-home-hero` | Group + Custom HTML (video) + Heading/Paragraph/Button blocks |
| At a Glance | `wwa-home-glance` | Custom HTML structure for stats grid + dealer card |
| Our Product | `wwa-home-products` | Custom HTML product grid |
| Sales / Service | `wwa-home-service` | Custom HTML dark band |
| Global Presence | `wwa-home-presence` | Custom HTML stats + pills |
| Header / Footer | PHP templates | `header.php`, `footer.php` |

Edit Home: **Pages → Home → Edit** (block editor).

## Theme files

```
functions.php
header.php
footer.php
style.css                    # @font-face Geist only
assets/css/tokens.css
assets/css/utilities.css
assets/css/header-footer.css
assets/css/home.css
assets/js/home.js
assets/fonts/Geist-*.woff2
```

## Design tokens (seed)

| Token | Value |
|-------|--------|
| Red | `#FF2D16` |
| Dark | `#211D1D` |
| Teal | `#5AB5AC` |
| Cream | `#F6EFE5` |
| Container | `1280px` |

## Assets

- Logos: `uploads/2026/07/WWA-logo.svg`, `WWA-logo-black.svg`
- Hero video: `WWA-home-page-banner-video-new.webm`
- Poster / glance: `WWA-home-2nd-sec.webp`
- Products: `DES-WWA-PRDT-01` … `05.webp`
- Service: `DES-WWA-Sales-Service-Support-01/02.webp`

### Image optimization recommendations

- Keep WebP; compress with quality ~75–85
- Provide `width`/`height` (already set in markup)
- Lazy-load below fold; hero poster for LCP
- Compress hero WebM further if LCP > 2.5s
- Export missing map graphic from Figma for Global Presence

## Yoast SEO (Home)

| Field | Value |
|-------|--------|
| Focus keyphrase | Hyundai construction equipment |
| SEO title | Hyundai Construction Equipment \| Worldwide Automotive |
| Meta description | Authorized Hyundai construction equipment dealer. Mini excavators, loaders and more—plus sales, service and support. Connect with our team today. |
| OG title | Powering Projects with Hyundai Excellence \| WWA |
| OG description | Authorized Hyundai construction equipment dealer delivering machines, service, and support across the region. |
| Twitter title/description | Mirror OG (shorter CTA variant) |

## Accessibility checklist

- [x] One H1 (hero)
- [x] Section H2s
- [x] Skip link
- [x] Nav aria-labels
- [x] Alt text on content images
- [x] Focus-visible styles
- [x] Reduced-motion media query
- [ ] Manual keyboard pass on mobile drawer
- [ ] Contrast audit on teal stats text

## Responsive checklist

- [ ] 1920 desktop
- [ ] 1440 laptop
- [ ] 1024 tablet landscape
- [ ] 768 tablet portrait
- [ ] 390 / 360 mobile
- [ ] No horizontal scroll

## Performance checklist

- [x] Font subset (4 weights, woff2)
- [x] Preload primary font
- [x] Defer site JS
- [x] Lazy images below fold
- [ ] Lighthouse ≥ 95 (run on staging / production-like host)
- [ ] Hero video size audit

## Menus

| Location | Menu |
|----------|------|
| `wwa-primary` | WWA Primary |
| `wwa-footer-quick` | WWA Footer Quick |
| `wwa-footer-business` | WWA Footer Business |

Appearance → Menus to refine labels (Company / Products dropdowns).
