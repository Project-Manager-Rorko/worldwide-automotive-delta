# Worldwide Automotive (Delta)

WordPress local rebuild of [Worldwide Automotive](https://vipaccounts.org/WWA/).

## Repository contents

| Path | Description |
|------|-------------|
| `wp-content/themes/hello-theme-child-new/` | Active child theme (header, footer, CSS, fonts, JS) |
| `wp-content/themes/` | Other themes present on the Local site |
| `wp-content/plugins/` | Active plugins (e.g. Yoast SEO) |
| `wp-content/uploads/` | Media library (images, video, logos) |
| `database/local.sql` | Local site database export |
| `conf/` | Local by Flywheel nginx/php/mysql templates |

## Local environment

| Item | Value |
|------|--------|
| Path | `C:\Users\shanm\Local Sites\wwa` |
| URL | http://wwa.local |
| Theme | Hello Elementor Child (`hello-theme-child-new`) |
| Parent | Hello Elementor |

## Restore notes

1. Create a WordPress site (Local or other) with Hello Elementor installed.
2. Copy `wp-content` into the site (merge carefully).
3. Import `database/local.sql` and update URLs (`wwa.local` or search-replace as needed).
4. Activate **Hello Elementor Child**.
5. Do **not** commit `wp-config.php` (credentials).

## Design

- Live site: Elementor on production.
- Local: PHP header/footer + Gutenberg page content; styles aligned to live kit colors/type.

## License

Proprietary — Rorko / Delta Group project use.
