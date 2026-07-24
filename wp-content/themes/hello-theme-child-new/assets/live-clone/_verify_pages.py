import re
import urllib.request
from pathlib import Path

pages = [
    ("home", "http://wwa.local/"),
    ("about", "http://wwa.local/about/"),
    ("leadership", "http://wwa.local/leadership/"),
    ("mini", "http://wwa.local/mini-excavators/"),
    ("wheel", "http://wwa.local/wheel-loaders/"),
    ("attach", "http://wwa.local/attachments/"),
    ("const", "http://wwa.local/construction-excavators/"),
    ("mining", "http://wwa.local/mining-excavators/"),
    ("service", "http://wwa.local/service-support/"),
]

markers = {
    "home": ["elementor-3616", "hdr-menu-main-sec", "elementor-location-footer", "background_video_link"],
    "about": ["elementor-page-14", "elementor-14", "hdr-menu-main-sec"],
    "leadership": ["elementor-page-1648", "elementor-1648", "hdr-menu-main-sec"],
    "mini": ["elementor-page-1170", "elementor-1170"],
    "wheel": ["elementor-page-1348", "elementor-1348"],
    "attach": ["elementor-page-1377", "elementor-1377"],
    "const": ["elementor-page-1543", "elementor-1543"],
    "mining": ["elementor-page-1397", "elementor-1397"],
    "service": ["elementor-page-1425", "elementor-1425"],
}

public = Path(r"C:\Users\shanm\Local Sites\wwa\app\public")

for name, url in pages:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "WWA-Verify/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            status = resp.status
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"FAIL {name}: {e}")
        continue
    ms = markers.get(name, [])
    hits = [m for m in ms if m in html]
    miss = [m for m in ms if m not in html]
    has_header = "elementor-location-header" in html
    has_footer = "elementor-location-footer" in html
    print(
        f"{name:12} status={status} len={len(html):6} header={has_header} footer={has_footer} "
        f"hits={hits} miss={miss}"
    )

# sample image 404 check from home
req = urllib.request.Request("http://wwa.local/", headers={"User-Agent": "WWA-Verify/1.0"})
with urllib.request.urlopen(req, timeout=30) as resp:
    html = resp.read().decode("utf-8", errors="replace")
urls = re.findall(r'http://wwa\.local/wp-content/uploads/[^"\'\s\)]+', html)
urls = list(dict.fromkeys(urls))[:40]
print("\nChecking", len(urls), "upload URLs from home...")
bad = 0
for u in urls:
    path = public / u.replace("http://wwa.local/", "").replace("/", "\\")
    # strip query
    path = Path(str(path).split("?")[0])
    if not path.exists():
        print(" MISSING", u)
        bad += 1
print("missing count", bad)
