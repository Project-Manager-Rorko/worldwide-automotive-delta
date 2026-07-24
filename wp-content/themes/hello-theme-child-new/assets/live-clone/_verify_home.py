import re
import urllib.request
from pathlib import Path

url = "http://wwa.local/"
req = urllib.request.Request(url, headers={"User-Agent": "WWA-Verify/1.0"})
with urllib.request.urlopen(req, timeout=30) as resp:
    html = resp.read().decode("utf-8", errors="replace")

print("status len", len(html))
checks = [
    "elementor-726",
    "elementor-3616",
    "hdr-menu-main-sec",
    "wwa-live-clone",
    "elementor-location-header",
    "elementor-location-footer",
    "live-clone/css/post-3616",
    "live-clone/css/post-726",
    "live-clone/css/post-737",
    "live-clone/css/post-6",
    ".webm",
    "Space Grotesk",
    "Syne",
    "Geist",
]
for c in checks:
    print(("OK " if c in html else "NO "), c)

# CSS file checks
for css in [
    "http://wwa.local/wp-content/themes/hello-theme-child-new/assets/live-clone/css/post-6.css",
    "http://wwa.local/wp-content/themes/hello-theme-child-new/assets/live-clone/css/post-3616.css",
]:
    with urllib.request.urlopen(css, timeout=20) as r:
        body = r.read().decode("utf-8", errors="replace")
    print(css.split("/")[-1], "Syne" in body, "Geist" in body, "Space Grotesk" in body, "len", len(body))

# video src
for m in re.finditer(r'(?:src|poster)="([^"]+\.(?:webm|mp4|webp))"', html):
    print("media", m.group(1)[:140])

# ensure 06 video
src = Path(r"C:\Users\shanm\Local Sites\wwa\app\public\wp-content\uploads\2026\07\WWA-home-page-banner-video-new.webm")
dst = Path(r"C:\Users\shanm\Local Sites\wwa\app\public\wp-content\uploads\2026\06\WWA-home-page-banner-video-new.webm")
if src.exists() and not dst.exists():
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(src.read_bytes())
    print("copied video to 2026/06")
elif dst.exists():
    print("video 06 size", dst.stat().st_size)
