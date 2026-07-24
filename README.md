# Worldwide Automotive (Delta)

Local WordPress rebuild of [Worldwide Automotive](https://vipaccounts.org/WWA/) using the **Hello Elementor Child** theme and Gutenberg-editable page content.

## Local environment

| Item | Value |
|------|--------|
| Local path | `C:\Users\shanm\Local Sites\wwa` |
| URL | http://wwa.local |
| Theme | `wp-content/themes/hello-theme-child-new` |
| Admin | `radmin` (Local site credentials) |

## What’s in this repo

- **`wp-content/themes/hello-theme-child-new`** — production theme (header/footer, design tokens, home + inner-page CSS, fonts: Geist, Syne, Space Grotesk)
- Optional **`wwa-brand`** — unused Twenty Twenty-Five child scaffold (kept for reference)

Page content, media library uploads, and the database live in the Local site (`app/public` / MySQL) and are not fully versioned here. Deploy by installing the theme on WordPress and rebuilding pages from the live design or a content export.

## Install theme on WordPress

1. Copy `wp-content/themes/hello-theme-child-new` into the site’s `wp-content/themes/`.
2. Ensure parent theme **Hello Elementor** is installed.
3. Activate **Hello Elementor Child**.
4. Assign menus to theme locations: Primary (`wwa-primary`), footer menus if used.
5. Set homepage and media as needed.

## Design notes

- Live site uses Elementor; this local build uses PHP header/footer + Gutenberg (Custom HTML blocks for complex home sections).
- Brand colors and type scale are aligned to the live Elementor kit (`#1A1A2E`, `#EC2633`, Syne/Space Grotesk/Geist).
- Do not modify the live production site from this repo.

## License

Proprietary — Rorko / Delta Group project use.
