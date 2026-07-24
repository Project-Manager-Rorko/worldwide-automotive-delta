from pathlib import Path
import urllib.request
import re

font_dir = Path(
    r"C:\Users\shanm\Local Sites\wwa\app\public\wp-content\plugins\elementskit-lite\modules\elementskit-icon-pack\assets\fonts"
)
font_dir.mkdir(parents=True, exist_ok=True)
base = "https://vipaccounts.org/WWA/wp-content/plugins/elementskit-lite/modules/elementskit-icon-pack/assets/fonts/"
for name in ("elementskit.woff", "elementskit.ttf", "elementskit.eot", "elementskit.svg"):
    dest = font_dir / name
    if dest.exists() and dest.stat().st_size > 100:
        print("have", name, dest.stat().st_size)
        continue
    try:
        urllib.request.urlretrieve(base + name, dest)
        print("dl", name, dest.stat().st_size)
    except Exception as e:
        print("fail", name, e)

# Fix ekiticons.css
p = Path(__file__).parent / "css" / "extra" / "ekiticons.css"
t = p.read_text(encoding="utf-8", errors="replace")
local = "/wp-content/plugins/elementskit-lite/modules/elementskit-icon-pack/assets/fonts/elementskit.woff"
face = (
    "@font-face{font-family:elementskit;"
    f"src:url('{local}') format('woff');"
    "font-weight:400;font-style:normal;font-display:swap}"
)
t2 = re.sub(r"@font-face\{[^}]+\}", face, t, count=1)
# ensure .icon::before uses elementskit
if "font-family:elementskit" not in t2:
    t2 += "\n.icon::before,.e-n-accordion-item-title-icon .icon::before{font-family:elementskit!important;}\n"
p.write_text(t2, encoding="utf-8")
print("ekiticons updated")
print(t2[:250])
