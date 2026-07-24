#!/usr/bin/env python3
"""
Build pixel-accurate live clone fragments from scraped Elementor HTML.
- Extracts header, footer, and page content
- Rewrites vipaccounts.org/WWA URLs to local
- Collects remote asset URLs and downloads missing media/CSS into theme or uploads
"""
from __future__ import annotations

import hashlib
import os
import re
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urlparse, unquote

LIVE_BASE = "https://vipaccounts.org/WWA"
LOCAL_BASE = "http://wwa.local"

ROOT = Path(__file__).resolve().parent
HTML_DIR = ROOT / "html"
OUT_DIR = ROOT / "fragments"
CSS_DIR = ROOT / "css"
ASSETS_DIR = ROOT / "assets"  # fonts, icons downloaded here

# WordPress public uploads (for media that already exists or we sideload)
WP_PUBLIC = Path(r"C:\Users\shanm\Local Sites\wwa\app\public")
UPLOADS = WP_PUBLIC / "wp-content" / "uploads"

PAGES = {
    "home": "home-full.html",
    "about": "about-full.html",
    "leadership": "leadership-full.html",
    "mini": "mini-full.html",
}

# CSS already present under css/
# We'll also pull any linked CSS we don't have yet into css/extra/


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  wrote {path} ({len(content):,} bytes)")


def extract_between(html: str, start_marker: str, end_marker: str) -> str | None:
    i = html.find(start_marker)
    if i < 0:
        return None
    j = html.find(end_marker, i)
    if j < 0:
        return None
    return html[i:j]


def extract_header(html: str) -> str | None:
    # <header data-elementor-type="header" ...> ... </header></header>
    m = re.search(
        r'(?s)(<header\s+data-elementor-type="header".*?</header>\s*</header>)',
        html,
    )
    return m.group(1) if m else None


def extract_footer(html: str) -> str | None:
    m = re.search(
        r'(?s)(<footer\s+data-elementor-type="footer".*?</footer>)',
        html,
    )
    return m.group(1) if m else None


def extract_page(html: str) -> str | None:
    # Elementor page root through end of its tree (before </main>)
    m = re.search(
        r'(?s)(<div\s+data-elementor-type="wp-page"[^>]*>.*)</main>',
        html,
    )
    if m:
        return m.group(1).rstrip()
    # fallback: page-content inner
    m = re.search(
        r'(?s)<div class="page-content">\s*(.*?)\s*</div>\s*</main>',
        html,
    )
    return m.group(1).strip() if m else None


def extract_head_extras(html: str) -> str:
    """Inline styles + Google font links from <head> that Elementor needs."""
    parts: list[str] = []
    # Google fonts / elementor fonts
    for m in re.finditer(
        r"<link[^>]+(?:fonts\.googleapis|fonts\.gstatic|elementor/google-fonts)[^>]*>",
        html,
        re.I,
    ):
        parts.append(m.group(0))
    # <style id="..."> blocks in head (elementor-frontend-inline, etc.)
    head = re.search(r"(?s)<head[^>]*>(.*?)</head>", html)
    if head:
        for m in re.finditer(r"(?s)<style[^>]*>.*?</style>", head.group(1)):
            block = m.group(0)
            # skip tiny empty
            if len(block) < 40:
                continue
            parts.append(block)
    return "\n".join(parts)


def rewrite_urls(html: str, local_base: str = LOCAL_BASE) -> str:
    """Point live site URLs at local, keep external CDNs."""
    out = html
    # Absolute live URLs
    out = out.replace(LIVE_BASE + "/", local_base.rstrip("/") + "/")
    out = out.replace(LIVE_BASE, local_base.rstrip("/"))
    # Protocol-relative
    out = out.replace("//vipaccounts.org/WWA/", local_base.rstrip("/") + "/")
    # Escaped JSON-ish in data attrs
    out = out.replace("https:\\/\\/vipaccounts.org\\/WWA", local_base.replace("/", "\\/"))
    # http variant
    out = out.replace("http://vipaccounts.org/WWA", local_base.rstrip("/"))
    return out


def collect_asset_urls(text: str) -> set[str]:
    urls: set[str] = set()
    for m in re.finditer(
        r"https?://vipaccounts\.org/WWA(/wp-content/[^\"'\s\)]+)",
        text,
    ):
        urls.add(LIVE_BASE + m.group(1).split("?")[0])
    # also after rewrite won't match; collect from original only
    return urls


def download(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "WWA-Clone/1.0"},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
        dest.write_bytes(data)
        print(f"  downloaded {url} -> {dest} ({len(data):,} bytes)")
        return True
    except Exception as e:
        print(f"  FAIL {url}: {e}")
        return False


def local_path_for_live_url(url: str) -> Path | None:
    """Map https://vipaccounts.org/WWA/wp-content/... to public path."""
    prefix = LIVE_BASE + "/"
    if not url.startswith(prefix):
        return None
    rel = unquote(url[len(prefix) :].split("?")[0])
    return WP_PUBLIC / rel.replace("/", os.sep)


def ensure_assets(urls: set[str]) -> None:
    """Download missing wp-content assets into local public tree."""
    for url in sorted(urls):
        dest = local_path_for_live_url(url)
        if dest is None:
            continue
        # Prefer existing uploads/theme files
        if dest.exists() and dest.stat().st_size > 0:
            continue
        download(url, dest)


def rewrite_css_urls(css: str) -> str:
    """Fix relative and absolute URLs inside CSS files for local use."""
    css = rewrite_urls(css)
    # Elementor CSS often has url('/WWA/wp-content/...') or relative ../
    css = re.sub(
        r"url\(\s*['\"]?/WWA/",
        f"url('{LOCAL_BASE}/",
        css,
    )
    return css


def process_css_files() -> None:
    for css_path in CSS_DIR.glob("*.css"):
        raw = read(css_path)
        fixed = rewrite_css_urls(raw)
        if fixed != raw:
            write(css_path, fixed)
            print(f"  rewrote URLs in {css_path.name}")


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    all_asset_urls: set[str] = set()
    header_html = None
    footer_html = None
    head_extras = None

    for slug, filename in PAGES.items():
        path = HTML_DIR / filename
        if not path.exists():
            print(f"MISSING {path}")
            continue
        print(f"\n=== {slug} ({filename}) ===")
        html = read(path)
        all_asset_urls |= collect_asset_urls(html)

        if header_html is None:
            header_html = extract_header(html)
            print(f"  header: {len(header_html) if header_html else 0} chars")
        if footer_html is None:
            footer_html = extract_footer(html)
            print(f"  footer: {len(footer_html) if footer_html else 0} chars")
        if head_extras is None:
            head_extras = extract_head_extras(html)
            print(f"  head extras: {len(head_extras)} chars")

        page = extract_page(html)
        if not page:
            print("  ERROR: no page content")
            continue
        print(f"  page: {len(page):,} chars")
        page = rewrite_urls(page)
        write(OUT_DIR / f"page-{slug}.html", page)

    if header_html:
        write(OUT_DIR / "header.html", rewrite_urls(header_html))
    if footer_html:
        write(OUT_DIR / "footer.html", rewrite_urls(footer_html))
    if head_extras:
        write(OUT_DIR / "head-extras.html", rewrite_urls(head_extras))

    print(f"\n=== Assets referenced: {len(all_asset_urls)} ===")
    # Download missing into local public
    ensure_assets(all_asset_urls)

    # Also download extra CSS linked from home that we may lack
    extra_css = [
        "/wp-content/plugins/header-footer-elementor/inc/widgets-css/frontend.css",
        "/wp-content/plugins/elementor/assets/css/widget-divider.min.css",
        "/wp-content/plugins/elementor-pro/assets/css/modules/sticky.min.css",
        "/wp-content/plugins/elementor/assets/css/widget-counter.min.css",
        "/wp-content/plugins/elementor-pro/assets/css/widget-posts.min.css",
        "/wp-content/plugins/elementor/assets/lib/eicons/css/elementor-icons.min.css",
        "/wp-content/plugins/elementor/assets/css/widget-social-icons.min.css",
        "/wp-content/plugins/elementor/assets/lib/font-awesome/css/brands.css",
        "/wp-content/plugins/elementor/assets/lib/font-awesome/css/fontawesome.css",
        "/wp-content/plugins/elementor/assets/lib/font-awesome/css/solid.css",
        "/wp-content/plugins/elementor-pro/assets/css/widget-nav-menu.min.css",
        "/wp-content/plugins/elementskit-lite/widgets/init/assets/css/widget-styles.css",
        "/wp-content/plugins/elementskit-lite/widgets/init/assets/css/responsive.css",
        "/wp-content/plugins/elementskit-lite/modules/elementskit-icon-pack/assets/css/ekiticons.css",
        "/wp-content/uploads/elementor/css/custom-widget-icon-list.min.css",
        "/wp-content/themes/hello-elementor/assets/css/header-footer.css",
    ]
    extra_dir = CSS_DIR / "extra"
    extra_dir.mkdir(exist_ok=True)
    for rel in extra_css:
        url = LIVE_BASE + rel
        name = Path(rel).name
        # namespace by parent folder if collisions
        dest = extra_dir / name
        if "elementskit" in rel and name == "responsive.css":
            dest = extra_dir / "ekit-responsive.css"
        elif "elementskit" in rel and name == "widget-styles.css":
            dest = extra_dir / "ekit-widget-styles.css"
        elif "header-footer-elementor" in rel and name == "frontend.css":
            dest = extra_dir / "hfe-widgets-frontend.css"
        elif "hello-elementor" in rel and name == "header-footer.css":
            dest = extra_dir / "hello-header-footer.css"
        download(url, dest)
        if dest.exists():
            raw = read(dest)
            fixed = rewrite_css_urls(raw)
            # Fix relative font paths in FA/eicons to absolute live or local
            if "font-awesome" in rel or "eicons" in rel or "ekiticons" in rel:
                # leave webfonts — rewrite ../ to live absolute for reliability
                parent = str(Path(rel).parent).replace("\\", "/")
                # e.g. /wp-content/plugins/elementor/assets/lib/font-awesome/css
                base_url = LIVE_BASE + str(Path(rel).parent).replace("\\", "/") + "/"
                fixed = re.sub(
                    r"url\(\s*['\"]?\.\./",
                    f"url('{LIVE_BASE}{str(Path(rel).parent.parent).replace(chr(92), '/')}/",
                    fixed,
                )
            write(dest, fixed)

    process_css_files()

    # Manifest for PHP
    manifest = {
        "local_base": LOCAL_BASE,
        "live_base": LIVE_BASE,
        "pages": list(PAGES.keys()),
        "version": "1.0.0",
    }
    import json

    write(OUT_DIR / "manifest.json", json.dumps(manifest, indent=2))
    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
