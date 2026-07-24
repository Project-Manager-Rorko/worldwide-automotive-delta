from pathlib import Path
import re

p = Path(__file__).parent / "fragments" / "footer.html"
t = p.read_text(encoding="utf-8", errors="replace")
print("before len", len(t), "Connect", t.count("Connect With Team"))

# Remove mobile footer block starting at element 1a36801
pat = re.compile(
    r'\s*<div class="elementor-element elementor-element-1a36801[\s\S]*?(?=</footer>)',
    re.I,
)
t2, n = pat.subn("", t)
print("regex removed", n)

if n == 0:
    marker = "elementor-element-1a36801"
    i = t.find(marker)
    if i >= 0:
        start = t.rfind("<div", 0, i)
        end = t.rfind("</footer>")
        t2 = t[:start] + t[end:]
        print("fallback remove", start, end)
    else:
        t2 = t
        print("mobile block not found")

t2 = re.sub(r"\n{3,}", "\n\n", t2)
p.write_text(t2, encoding="utf-8")
print("after len", len(t2), "Connect", t2.count("Connect With Team"))
print("has 1a36801", "1a36801" in t2)
print("has hidden-desktop", "elementor-hidden-desktop" in t2)
