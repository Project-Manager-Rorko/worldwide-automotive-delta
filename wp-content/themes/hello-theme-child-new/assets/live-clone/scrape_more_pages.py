#!/usr/bin/env python3
"""Scrape remaining live product/service pages into fragments."""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

LIVE = "https://vipaccounts.org/WWA"
LOCAL = "http://wwa.local"
ROOT = Path(__file__).resolve().parent
HTML_DIR = ROOT / "html"
FRAG = ROOT / "fragments"
CSS_DIR = ROOT / "css"
WP_PUBLIC = Path(r"C:\Users\shanm\Local Sites\wwa\app\public")

# slug -> live path
PAGES = {
    "wheel-loaders": "/wheel-loaders/",
    "attachments": "/attachments/",
    "construction-excavators": "/construction-excavators/",
    "mining-excavators": "/mining-excavators/",
    "service-support": "/service-support/",
    # alternate paths sometimes used
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "WWA-Clone/1.0"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return resp.read().decode("utf-8", errors="replace")


def rewrite(html: str) -> str:
    html = html.replace(LIVE + "/", LOCAL + "/")
    html = html.replace(LIVE, LOCAL)
    html = html.replace("//vipaccounts.org/WWA/", LOCAL + "/")
    html = html.replace("http://vipaccounts.org/WWA", LOCAL)
    return html


def extract_page(html: str) -> str | None:
    m = re.search(
        r'(?s)(<div\s+data-elementor-type="wp-page"[^>]*>.*)</main>',
        html,
    )
    return m.group(1).rstrip() if m else None


def extract_page_id(html: str) -> int | None:
    m = re.search(r'data-elementor-id="(\d+)"[^>]*data-elementor-type="wp-page"', html)
    if m:
        return int(m.group(1))
    m = re.search(r'data-elementor-type="wp-page"[^>]*data-elementor-id="(\d+)"', html)
    if m:
        return int(m.group(1))
    m = re.search(r"elementor-page-(\d+)", html)
    return int(m.group(1)) if m else None


def extract_css_ids(html: str) -> list[int]:
    ids = []
    for m in re.finditer(r"elementor-post-(\d+)-css", html):
        i = int(m.group(1))
        if i not in ids:
            ids.append(i)
    return ids


def download_css(post_id: int) -> None:
    url = f"{LIVE}/wp-content/uploads/elementor/css/post-{post_id}.css"
    dest_theme = CSS_DIR / f"post-{post_id}.css"
    dest_upload = WP_PUBLIC / "wp-content" / "uploads" / "elementor" / "css" / f"post-{post_id}.css"
    for dest in (dest_theme, dest_upload):
        if dest.exists() and dest.stat().st_size > 100:
            continue
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "WWA-Clone/1.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read().decode("utf-8", errors="replace")
            data = rewrite(data)
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(data, encoding="utf-8")
            print(f"  CSS post-{post_id} -> {dest}")
        except Exception as e:
            print(f"  CSS fail {post_id}: {e}")


def ensure_assets(html: str) -> None:
    urls = set(re.findall(r"https?://vipaccounts\.org/WWA(/wp-content/[^\"'\s\)]+)", html))
    # after rewrite look for local paths that don't exist - collect from original
    for path in urls:
        path = path.split("?")[0]
        dest = WP_PUBLIC / path.lstrip("/").replace("/", "\\")
        if dest.exists() and dest.stat().st_size > 0:
            continue
        url = LIVE + path
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            req = urllib.request.Request(url, headers={"User-Agent": "WWA-Clone/1.0"})
            with urllib.request.urlopen(req, timeout=90) as resp:
                dest.write_bytes(resp.read())
            print(f"  asset {path} ({dest.stat().st_size})")
        except Exception as e:
            print(f"  asset fail {path}: {e}")


def main() -> None:
    HTML_DIR.mkdir(exist_ok=True)
    FRAG.mkdir(exist_ok=True)
    map_extra = {}

    # discover product URLs from home nav if needed
    for slug, path in list(PAGES.items()):
        url = LIVE + path
        print(f"\n=== {slug} {url} ===")
        try:
            html = fetch(url)
        except Exception as e:
            print("  FETCH FAIL", e)
            # try alternate
            continue
        (HTML_DIR / f"{slug}-full.html").write_text(html, encoding="utf-8")
        page = extract_page(html)
        if not page:
            print("  no page content")
            continue
        ensure_assets(html)
        pid = extract_page_id(html)
        css_ids = extract_css_ids(html)
        print(f"  page_id={pid} css={css_ids} len={len(page)}")
        (FRAG / f"page-{slug}.html").write_text(rewrite(page), encoding="utf-8")
        for cid in css_ids:
            if cid not in (6, 726, 737):  # kit/header/footer always loaded
                download_css(cid)
        map_extra[slug] = {
            "fragment": f"page-{slug}",
            "css": [c for c in css_ids if c not in (6, 726, 737)],
            "body": [f"elementor-page", f"elementor-page-{pid}"] if pid else ["elementor-page"],
            "page_id": pid,
        }

    out = FRAG / "page-map-extra.json"
    out.write_text(json.dumps(map_extra, indent=2), encoding="utf-8")
    print("\nWrote", out)


if __name__ == "__main__":
    main()
