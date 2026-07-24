#!/usr/bin/env python3
"""
Split each page-*.html into multiple Gutenberg Custom HTML blocks —
one block per top-level Elementor section (e-con e-parent).

Preserves the outer .elementor.elementor-XXXX wrapper so Elementor CSS
selectors and layout stay intact. Does not alter section HTML content.

Usage:
  python split_gutenberg_sections.py          # all pages
  python split_gutenberg_sections.py home     # one slug
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

FRAG = Path(__file__).resolve().parent / "fragments"

# page fragment basename (without page- / .html) -> optional aliases
PAGES = [
    "home",
    "about",
    "leadership",
    "mini-excavators",
    "mini",  # alias file page-mini.html
    "wheel-loaders",
    "attachments",
    "construction-excavators",
    "mining-excavators",
    "service-support",
    "refurbished-equipment",
    "contact",
    "privacy-policy",
    "terms-and-conditions",
]


def find_matching_close(html: str, open_pos: int) -> int:
    """Given index of '<' for an opening div, return index after its closing </div>."""
    # Find end of opening tag
    gt = html.find(">", open_pos)
    if gt < 0:
        raise ValueError("no > for open tag")
    i = gt + 1
    depth = 1
    n = len(html)
    while i < n and depth > 0:
        next_open = html.find("<div", i)
        next_close = html.find("</div>", i)
        if next_close < 0:
            raise ValueError("unbalanced div")
        if next_open >= 0 and next_open < next_close:
            # Is it a real open tag? <div or <div...
            depth += 1
            i = next_open + 4
        else:
            depth -= 1
            i = next_close + len("</div>")
    return i


def split_page_html(html: str) -> tuple[str, list[str], str]:
    """
    Returns (open_wrapper, list_of_section_html, close_wrapper).
    Sections are direct child e-parent containers of the root elementor div.
    """
    raw = html
    # Normalize: strip leading/trailing whitespace for parsing, keep content
    s = html.strip()
    # Find root elementor page wrapper
    m = re.search(
        r'<div[^>]*class="[^"]*\belementor\b[^"]*"[^>]*data-elementor-type="wp-page"[^>]*>'
        r'|<div[^>]*data-elementor-type="wp-page"[^>]*>',
        s,
        re.I,
    )
    if not m:
        # fallback: first div
        m = re.search(r"<div\b[^>]*>", s)
    if not m:
        return ("", [s], "")

    open_tag = m.group(0)
    open_end = m.end()
    # Match full root close
    root_close_end = find_matching_close(s, m.start())
    inner = s[open_end : root_close_end - len("</div>")]
    close_wrapper = "</div>"

    # Walk inner for top-level e-parent sections
    sections: list[str] = []
    i = 0
    n = len(inner)
    while i < n:
        # skip whitespace
        while i < n and inner[i] in " \t\r\n":
            i += 1
        if i >= n:
            break
        if not inner.startswith("<div", i):
            # leftover non-div content (rare) — pack as its own section
            j = inner.find("<div", i)
            if j < 0:
                chunk = inner[i:].strip()
                if chunk:
                    sections.append(chunk)
                break
            chunk = inner[i:j].strip()
            if chunk:
                sections.append(chunk)
            i = j
            continue

        # Parse this top-level div
        gt = inner.find(">", i)
        open_full = inner[i : gt + 1]
        end = find_matching_close(inner, i)
        block = inner[i:end]
        # Prefer e-parent sections; still keep non-parent top-level divs as blocks
        sections.append(block.rstrip() + "\n")
        i = end

    open_wrapper = open_tag
    return open_wrapper, sections, close_wrapper


def to_gutenberg(open_w: str, sections: list[str], close_w: str) -> str:
    """
    Emit multiple wp:html blocks.
    Block 0: open wrapper (if any sections)
    Block 1..N: each section
    Last: close wrapper

    If only one section and no meaningful split, still emit multi-block structure
    when open wrapper exists; otherwise single block.
    """
    parts: list[str] = []

    def block(html: str) -> str:
        h = html.rstrip() + "\n"
        return f"<!-- wp:html -->\n{h}<!-- /wp:html -->\n"

    if not sections:
        return block(open_w + close_w)

    # Opening wrapper alone so all sections stay under one .elementor root
    # when concatenated on the front-end (HTML blocks output raw, no wrappers).
    if open_w:
        # Put first section inside open wrapper for valid intermediate HTML in editor previews
        # Strategy: each section is a full block; open is first block, close is last.
        parts.append(block(open_w))
        for sec in sections:
            parts.append(block(sec))
        parts.append(block(close_w))
    else:
        for sec in sections:
            parts.append(block(sec))

    return "\n".join(parts) + "\n"


def process_file(page_path: Path, out_path: Path) -> dict:
    html = page_path.read_text(encoding="utf-8", errors="replace")
    open_w, sections, close_w = split_page_html(html)
    gb = to_gutenberg(open_w, sections, close_w)
    out_path.write_text(gb, encoding="utf-8", newline="\n")
    return {
        "file": page_path.name,
        "out": out_path.name,
        "sections": len(sections),
        "bytes": len(gb),
        "wp_html_blocks": gb.count("<!-- wp:html -->"),
    }


def main() -> int:
    only = sys.argv[1:] if len(sys.argv) > 1 else None
    results = []
    seen = set()
    for slug in PAGES:
        if only and slug not in only and not any(slug.startswith(o) for o in only):
            # allow filter by slug
            if only and slug not in only:
                continue
        page = FRAG / f"page-{slug}.html"
        if not page.is_file():
            continue
        # dedupe mini / mini-excavators if same file content path
        key = page.resolve()
        if key in seen:
            continue
        seen.add(key)
        # gutenberg output name: use slug; for mini use mini-excavators preferred if exists
        out_slug = slug
        if slug == "mini":
            out_slug = "mini"  # also write mini-excavators if page-mini-excavators exists separately
        out = FRAG / f"gutenberg-{out_slug}.html"
        info = process_file(page, out)
        results.append(info)
        # also write mini-excavators from page-mini-excavators if present and different
        if slug == "mini-excavators":
            pass
        print(f"{info['file']}: {info['sections']} sections -> {info['wp_html_blocks']} blocks ({info['bytes']} bytes)")

    # Ensure mini-excavators gutenberg exists (may share page-mini-excavators.html)
    mex = FRAG / "page-mini-excavators.html"
    if mex.is_file() and (not only or "mini-excavators" in only or "mini" in (only or [])):
        out = FRAG / "gutenberg-mini-excavators.html"
        info = process_file(mex, out)
        print(f"{info['file']}: {info['sections']} sections -> {info['wp_html_blocks']} blocks ({info['bytes']} bytes)")

    print(f"Done. {len(results)} page file(s) processed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
