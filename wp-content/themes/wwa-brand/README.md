# WWA Brand (Gutenberg-only)

Minimal **Twenty Twenty-Five** child theme for **Worldwide Automotive**.

## Rules

- **Build all pages in the block editor** (`Pages → Edit`).
- **Header / footer / global styles** in **Appearance → Editor** (Site Editor).
- **Do not** add custom `templates/*.html` or PHP block patterns for page layouts.
- **Geist only** (no Syne, no Elementor).

## Local site

| Item | Value |
|------|--------|
| Path | `C:\Users\shanm\Local Sites\wwa` |
| URL | http://wwa.local |
| Theme folder | `wp-content/themes/wwa-brand` |

### Start

1. Open **Local** app → start site **WWA**.
2. Visit http://wwa.local and http://wwa.local/wp-admin.
3. Confirm active theme is **WWA Brand**.

### Design workflow

1. Open Figma: `Downloads\WWA home page.fig`.
2. **Media → Add** DES/MOB assets and logos as needed.
3. **Pages → Home → Edit** — build sections with Cover, Group, Columns, Image, Buttons, etc.
4. **Appearance → Editor** — Header, Footer, Styles (colors already seeded with brand red + Geist).

### CSS classes (optional)

In a block’s **Advanced → Additional CSS class(es)**:

| Class | Use |
|-------|-----|
| `wwa-hero` | Hero Cover min-height |
| `wwa-card` | Soft white card shell |
| `wwa-circle-btn` | Pill / circle button |
| `wwa-stat-number` | Large stat figure |

### Deploy note

Page layouts live in the **database**. Version this theme folder in Git for fonts/tokens; use Local export / migration plugin for content when moving to staging.

## Design assets

- Figma: `C:\Users\shanm\Downloads\WWA home page.fig`
- Images: `DES - WWA - *` / `MOB - WWA - *` under Downloads
- Logos: `WWA-logo.svg`, `WWA  logo - black.svg`
