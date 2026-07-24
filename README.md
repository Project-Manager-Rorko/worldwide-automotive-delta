# Worldwide Automotive (Delta)

Full WordPress package for the local rebuild of [Worldwide Automotive](https://vipaccounts.org/WWA/).

## Repository contents

| Path | Description |
|------|-------------|
| `wp-admin/` | WordPress admin core |
| `wp-includes/` | WordPress core libraries |
| Root PHP files | `index.php`, `wp-load.php`, `wp-login.php`, etc. |
| `wp-config-sample.php` | Sample config (copy to `wp-config.php` and set DB credentials) |
| `wp-content/themes/` | Themes including **hello-theme-child-new** |
| `wp-content/plugins/` | Plugins (e.g. Yoast SEO) |
| `wp-content/uploads/` | Media library |
| `database/local.sql` | Local site database export |
| `conf/` | Local by Flywheel nginx/php/mysql templates |

## Not committed

- **`wp-config.php`** — contains database passwords; create locally from `wp-config-sample.php` or your Local site export.

## Local environment

| Item | Value |
|------|--------|
| Path | `C:\Users\shanm\Local Sites\wwa` |
| URL | http://wwa.local |
| Theme | Hello Elementor Child (`hello-theme-child-new`) |

## Restore

1. Clone this repo into a web root (or merge into a Local site `app/public`).
2. Copy `wp-config-sample.php` → `wp-config.php` and set DB credentials (or use Local’s existing config).
3. Import `database/local.sql` and search-replace URLs if the domain is not `wwa.local`.
4. Ensure parent theme **Hello Elementor** is present; activate **Hello Elementor Child**.

## License

Proprietary — Rorko / Delta Group project use. WordPress core is GPLv2+.
