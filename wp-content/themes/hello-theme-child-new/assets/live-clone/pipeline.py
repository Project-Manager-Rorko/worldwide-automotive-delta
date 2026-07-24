#!/usr/bin/env python3
"""
WWA live-clone pipeline:
- scrape page HTML
- extract header/footer/page
- rewrite URLs safely (never strip WWA- from filenames)
- download missing media from HTML + CSS
- bake video src/poster into empty video tags
- write fragments + optional gutenberg block file
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse, unquote

LIVE = "https://vipaccounts.org/WWA"
LOCAL = "http://wwa.local"
ROOT = Path(__file__).resolve().parent
HTML_DIR = ROOT / "html"
FRAG = ROOT / "fragments"
CSS_DIR = ROOT / "css"
PUBLIC = Path(r"C:\Users\shanm\Local Sites\wwa\app\public")
UA = {"User-Agent": "WWA-Clone-Pipeline/2.0"}

# slug -> live path
PAGE_PATHS = {
    "home": "/",
    "about": "/about/",
    "leadership": "/leadership/",
    "mini": "/mini-excavators/",
    "mini-excavators": "/mini-excavators/",
    "wheel-loaders": "/wheel-loaders/",
    "attachments": "/attachments/",
    "construction-excavators": "/construction-excavators/",
    "mining-excavators": "/mining-excavators/",
    "service-support": "/service-support/",
    "refurbished-equipment": "/refurbished-equipment/",
    "contact": "/contact/",
    "privacy-policy": "/privacy-policy/",
    "terms-and-conditions": "/terms-and-conditions/",
}


def fetch(url: str, binary: bool = False):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = resp.read()
    return data if binary else data.decode("utf-8", errors="replace")


def rewrite_urls(text: str) -> str:
    """Rewrite live host to local without breaking WWA-* filenames."""
    # Order matters: full base first
    text = text.replace(LIVE + "/", LOCAL + "/")
    text = text.replace(LIVE, LOCAL)
    text = text.replace("https://vipaccounts.org/delta/", LOCAL + "/")
    text = text.replace("http://vipaccounts.org/WWA/", LOCAL + "/")
    text = text.replace("http://vipaccounts.org/WWA", LOCAL)
    # Protocol-relative
    text = text.replace("//vipaccounts.org/WWA/", LOCAL + "/")
    # JSON-escaped
    text = text.replace("https:\\/\\/vipaccounts.org\\/WWA", LOCAL.replace("/", "\\/"))
    # Decode HTML-entity quotes inside url() so CSS backgrounds work
    text = text.replace("url(&#039;", "url('").replace("&#039;)", "')")
    text = text.replace("url(&quot;", 'url("').replace("&quot;)", '")')
    return text


def extract_header(html: str) -> str | None:
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
    if not m:
        return None
    footer = m.group(1)
    # Drop Elementor mobile-only footer clone (elementor-hidden-desktop) so it
    # never renders twice when hide-CSS is overridden.
    footer = re.sub(
        r'\s*<div class="elementor-element elementor-element-1a36801[\s\S]*?(?=</footer>)',
        "",
        footer,
        count=1,
        flags=re.I,
    )
    footer = footer.replace(" elementor-invisible", "").replace("elementor-invisible ", "")
    return footer


def extract_page(html: str) -> str | None:
    m = re.search(
        r'(?s)(<div\s+data-elementor-type="wp-page"[^>]*>.*)</main>',
        html,
    )
    return m.group(1).rstrip() if m else None


def extract_page_id(html: str) -> int | None:
    m = re.search(
        r'data-elementor-type="wp-page"[^>]*data-elementor-id="(\d+)"',
        html,
    )
    if m:
        return int(m.group(1))
    m = re.search(
        r'data-elementor-id="(\d+)"[^>]*data-elementor-type="wp-page"',
        html,
    )
    if m:
        return int(m.group(1))
    m = re.search(r"elementor-page-(\d+)", html)
    return int(m.group(1)) if m else None


def extract_css_ids(html: str) -> list[int]:
    ids: list[int] = []
    for m in re.finditer(r"elementor-post-(\d+)-css", html):
        i = int(m.group(1))
        if i not in ids:
            ids.append(i)
    return ids


def extract_title_meta(html: str) -> dict:
    title = ""
    m = re.search(r"<title>([^<]+)</title>", html, re.I)
    if m:
        title = re.sub(r"\s+", " ", m.group(1)).strip()
    desc = ""
    m = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\']',
        html,
        re.I,
    )
    if not m:
        m = re.search(
            r'<meta\s+content=["\']([^"\']*)["\']\s+name=["\']description["\']',
            html,
            re.I,
        )
    if m:
        desc = m.group(1).strip()
    return {"title": title, "description": desc}


def collect_media_urls(*texts: str) -> set[str]:
    urls: set[str] = set()
    patterns = [
        r"""(?:src|data-src|data-lazy-src|poster)=["']([^"']+)["']""",
        r"""url\(["']?([^"')]+)["']?\)""",
        r"""background_video_link&quot;:&quot;([^&]+)""",
        r""""background_video_link":"([^"]+)""",
    ]
    for text in texts:
        for pat in patterns:
            for m in re.finditer(pat, text, re.I):
                u = m.group(1).replace("\\/", "/").strip()
                if not u or u.startswith("data:"):
                    continue
                urls.add(u.split("?")[0])
    return urls


def to_public_path(url: str) -> Path | None:
    """Map absolute or root-relative URL to local public file path."""
    if url.startswith("//"):
        url = "https:" + url
    path = ""
    if url.startswith("http"):
        p = urlparse(url)
        # only local / live WWA / delta assets
        if "vipaccounts.org" not in p.netloc and "wwa.local" not in p.netloc:
            return None
        path = unquote(p.path)
    elif url.startswith("/"):
        path = unquote(url)
    else:
        return None

    # normalize /WWA prefix
    if path.startswith("/WWA/"):
        path = path[4:]
    if path.startswith("/delta/"):
        path = "/wp-content/" + path.split("/wp-content/", 1)[-1] if "/wp-content/" in path else path

    if "/wp-content/" not in path:
        return None
    # keep only wp-content/...
    idx = path.find("/wp-content/")
    rel = path[idx + 1 :]  # wp-content/...
    return PUBLIC / rel.replace("/", "\\")


def live_url_for_path(path: str) -> str:
    if path.startswith("/wp-content/"):
        return LIVE + path
    if path.startswith("wp-content/"):
        return LIVE + "/" + path
    return LIVE + path


def download_missing(urls: set[str]) -> tuple[int, int]:
    ok = fail = 0
    seen: set[str] = set()
    for u in sorted(urls):
        dest = to_public_path(u if "://" in u or u.startswith("/") else "/" + u)
        if dest is None:
            continue
        key = str(dest).lower()
        if key in seen:
            continue
        seen.add(key)
        if dest.exists() and dest.stat().st_size > 50:
            ok += 1
            continue
        # build live URL from dest relative path
        rel = dest.relative_to(PUBLIC).as_posix()
        live_url = LIVE + "/" + rel
        # also try original if still on live host
        candidates = [live_url]
        if "vipaccounts.org" in u:
            candidates.insert(0, u.split("?")[0])
        downloaded = False
        for cand in candidates:
            try:
                data = fetch(cand, binary=True)
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
                print(f"  DL {rel} ({len(data):,} bytes)")
                downloaded = True
                ok += 1
                break
            except Exception:
                continue
        if not downloaded:
            print(f"  FAIL {rel}")
            fail += 1
    return ok, fail


def bake_videos(html: str) -> str:
    """Set src on empty Elementor background videos from data-settings ancestors."""

    def find_video_link(before: str) -> str | None:
        # search last 4000 chars for background_video_link
        chunk = before[-5000:]
        m = re.search(
            r"background_video_link&quot;:&quot;([^&]+)&quot;",
            chunk,
        )
        if m:
            return m.group(1).replace("\\/", "/")
        m = re.search(r'"background_video_link"\s*:\s*"([^"]+)"', chunk)
        if m:
            return m.group(1).replace("\\/", "/")
        return None

    def find_poster(before: str) -> str | None:
        chunk = before[-8000:]
        # common poster in style background on same section
        m = re.search(
            r'background(?:-image)?:\s*url\(["\']?([^"\')]+(?:banner|video|scaled)[^"\')]*\.(?:webp|jpg|png))',
            chunk,
            re.I,
        )
        if m:
            return m.group(1)
        return None

    out = []
    pos = 0
    for m in re.finditer(r"<video\b[^>]*>", html, re.I):
        out.append(html[pos : m.start()])
        tag = m.group(0)
        before = html[: m.start()]
        if re.search(r'\ssrc=["\'][^"\']+["\']', tag, re.I):
            out.append(tag)
        else:
            link = find_video_link(before)
            if link:
                link = rewrite_urls(link)
                # inject src
                tag = re.sub(r"<video\b", f'<video src="{link}"', tag, count=1, flags=re.I)
                if "muted" not in tag.lower():
                    tag = tag.replace("<video", "<video muted", 1)
                if "autoplay" not in tag.lower():
                    tag = tag.replace("<video", "<video autoplay", 1)
                if "playsinline" not in tag.lower():
                    tag = tag.replace("<video", "<video playsinline", 1)
                if "loop" not in tag.lower():
                    tag = tag.replace("<video", "<video loop", 1)
                print(f"  baked video src -> {link[:90]}")
            out.append(tag)
        pos = m.end()
    out.append(html[pos:])
    return "".join(out)


def download_page_css(post_ids: list[int]) -> None:
    for pid in post_ids:
        url = f"{LIVE}/wp-content/uploads/elementor/css/post-{pid}.css"
        for dest in (
            CSS_DIR / f"post-{pid}.css",
            PUBLIC / "wp-content" / "uploads" / "elementor" / "css" / f"post-{pid}.css",
        ):
            try:
                raw = fetch(url)
                fixed = rewrite_urls(raw)
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(fixed, encoding="utf-8")
                print(f"  CSS post-{pid} -> {dest.name}")
            except Exception as e:
                print(f"  CSS fail {pid}: {e}")


def gutenberg_block(html: str) -> str:
    # Escape not needed inside wp:html if we don't use -- >
    safe = html.replace("<!--", "< !--")  # avoid breaking block comments inside
    return f"<!-- wp:html -->\n{html}\n<!-- /wp:html -->\n"


def process_page(slug: str, also_chrome: bool = False) -> dict:
    path = PAGE_PATHS.get(slug)
    if not path:
        raise SystemExit(f"Unknown slug: {slug}")
    url = LIVE + path
    print(f"\n=== scrape {slug} {url} ===")
    html = fetch(url)
    HTML_DIR.mkdir(exist_ok=True)
    FRAG.mkdir(exist_ok=True)
    (HTML_DIR / f"{slug}-full.html").write_text(html, encoding="utf-8")

    meta = extract_title_meta(html)
    page_id = extract_page_id(html)
    css_ids = extract_css_ids(html)
    print(f"  page_id={page_id} css={css_ids}")
    print(f"  title={meta['title'][:80]}")

    if also_chrome or slug == "home":
        header = extract_header(html)
        footer = extract_footer(html)
        if header:
            header = rewrite_urls(header)
            header = bake_videos(header)
            (FRAG / "header.html").write_text(header, encoding="utf-8")
            print(f"  header {len(header):,} bytes")
        if footer:
            footer = rewrite_urls(footer)
            (FRAG / "footer.html").write_text(footer, encoding="utf-8")
            print(f"  footer {len(footer):,} bytes")

    page = extract_page(html)
    if not page:
        raise SystemExit("No page content extracted")
    page = rewrite_urls(page)
    page = bake_videos(page)
    frag_name = f"page-{slug}.html"
    (FRAG / frag_name).write_text(page, encoding="utf-8")
    print(f"  page fragment {len(page):,} bytes")

    # gutenberg dump for PHP inject
    gb = gutenberg_block(page)
    (FRAG / f"gutenberg-{slug}.html").write_text(gb, encoding="utf-8")

    # CSS
    download_page_css(css_ids)

    # Media from html + related css
    texts = [page, html]
    for pid in css_ids:
        css_path = CSS_DIR / f"post-{pid}.css"
        if css_path.exists():
            texts.append(css_path.read_text(encoding="utf-8", errors="replace"))
    # always include kit/header/footer css
    for pid in (6, 726, 737):
        css_path = CSS_DIR / f"post-{pid}.css"
        if css_path.exists():
            texts.append(css_path.read_text(encoding="utf-8", errors="replace"))

    media = collect_media_urls(*texts)
    print(f"  media candidates: {len(media)}")
    o, f = download_missing(media)
    print(f"  media ok/skip={o} fail={f}")

    info = {
        "slug": slug,
        "path": path,
        "page_id": page_id,
        "css": [c for c in css_ids if c not in (6, 726, 737)],
        "body": [
            "elementor-page",
            f"elementor-page-{page_id}" if page_id else "elementor-page",
        ],
        "fragment": f"page-{slug}",
        "title": meta["title"],
        "description": meta["description"],
    }
    # merge into map file
    map_path = FRAG / "page-map-full.json"
    full = {}
    if map_path.exists():
        try:
            full = json.loads(map_path.read_text(encoding="utf-8"))
        except Exception:
            full = {}
    full[slug] = info
    # alias mini
    if slug == "mini":
        full["mini-excavators"] = {**info, "slug": "mini-excavators"}
    map_path.write_text(json.dumps(full, indent=2), encoding="utf-8")
    return info


def download_all_css_media() -> None:
    print("\n=== scan all post-*.css for media ===")
    texts = []
    for p in CSS_DIR.glob("post-*.css"):
        texts.append(p.read_text(encoding="utf-8", errors="replace"))
    for p in FRAG.glob("page-*.html"):
        texts.append(p.read_text(encoding="utf-8", errors="replace"))
    for name in ("header.html", "footer.html"):
        fp = FRAG / name
        if fp.exists():
            texts.append(fp.read_text(encoding="utf-8", errors="replace"))
    media = collect_media_urls(*texts)
    print(f"  candidates {len(media)}")
    download_missing(media)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["page", "media", "home"])
    ap.add_argument("--slug", default="home")
    ap.add_argument("--chrome", action="store_true", help="also extract header/footer")
    args = ap.parse_args()

    if args.command == "media":
        download_all_css_media()
        return 0
    if args.command == "home":
        process_page("home", also_chrome=True)
        download_all_css_media()
        return 0
    if args.command == "page":
        process_page(args.slug, also_chrome=args.chrome)
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
