from pathlib import Path
import re
import urllib.request
from urllib.parse import urlparse

PUBLIC = Path(r"C:\Users\shanm\Local Sites\wwa\app\public")
LIVE = "https://vipaccounts.org/WWA"
css_path = Path(__file__).parent / "css" / "post-3423.css"
frag = Path(__file__).parent / "fragments" / "page-refurbished-equipment.html"
texts = []
if css_path.exists():
    texts.append(css_path.read_text(encoding="utf-8", errors="replace"))
if frag.exists():
    texts.append(frag.read_text(encoding="utf-8", errors="replace"))

urls = set()
for t in texts:
    for m in re.finditer(
        r"""(?:src|data-src|poster)=["']([^"']+)["']|url\(["']?([^"')]+)["']?\)""",
        t,
        re.I,
    ):
        u = (m.group(1) or m.group(2) or "").split("?")[0]
        if u:
            urls.add(u)

for u in sorted(urls):
    if u.startswith("data:"):
        continue
    path = urlparse(u).path if u.startswith("http") else u
    path = path.replace("/WWA/wp-content", "/wp-content")
    if "/wp-content/" not in path:
        continue
    idx = path.find("/wp-content/")
    rel = path[idx + 1 :]
    fp = PUBLIC / rel.replace("/", "\\")
    if fp.exists() and fp.stat().st_size > 50:
        continue
    live_url = LIVE + "/" + rel
    try:
        fp.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(live_url, fp)
        print("dl", rel, fp.stat().st_size)
    except Exception as e:
        print("fail", rel, e)
print("done")
