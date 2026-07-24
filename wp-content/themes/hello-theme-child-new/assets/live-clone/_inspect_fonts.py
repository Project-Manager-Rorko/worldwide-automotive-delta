import re
from pathlib import Path

css_dir = Path(__file__).parent / "css"
for name in ["post-3616.css", "post-726.css", "post-737.css", "post-6.css"]:
    p = css_dir / name
    css = p.read_text(encoding="utf-8", errors="replace")
    families = set(re.findall(r"font-family:\s*'([^']+)'", css))
    print(name, "families", sorted(families))
    for m in re.finditer(r"@font-face\s*\{[^}]+\}", css):
        print(" ", m.group(0)[:250].replace("\n", " "))
    urls = re.findall(r"url\(([^)]+)\)", css)
    font_urls = [u for u in urls if any(x in u.lower() for x in [".woff", ".ttf", ".eot", "font"])]
    print(" font urls", font_urls[:15])
    print()
