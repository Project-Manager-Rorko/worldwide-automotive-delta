from pathlib import Path
import re

root = Path(__file__).parent / "css"
# Do not rewrite comments/docs in these files
SKIP = {"typography-visibility.css", "site-fixes.css", "live-bridge.css"}
count = 0
for p in root.rglob("*.css"):
    if p.name in SKIP:
        continue
    t = p.read_text(encoding="utf-8", errors="replace")
    nt = t
    nt = nt.replace("Space Grotesk", "Geist")
    nt = nt.replace("Syne", "Geist")
    if nt != t:
        p.write_text(nt, encoding="utf-8")
        count += 1
        print("updated", p.name)
print("files", count)

# Also rewrite kit post-6 font-face to only Geist (remove Syne faces pointing to Syne files)
p6 = root / "post-6.css"
if p6.exists():
    t = p6.read_text(encoding="utf-8", errors="replace")
    # Redirect any remaining Syne file urls to Geist
    t2 = t.replace("Syne-Regular", "Geist-Regular").replace("Syne-SemiBold", "Geist-SemiBold").replace(
        "Syne-Bold", "Geist-Bold"
    )
    t2 = t2.replace("SpaceGrotesk-Regular", "Geist-Regular").replace(
        "SpaceGrotesk-SemiBold", "Geist-SemiBold"
    ).replace("SpaceGrotesk-Bold", "Geist-Bold")
    p6.write_text(t2, encoding="utf-8")
    print("post-6 font files remapped")

p3616 = root / "post-3616.css"
if p3616.exists():
    t = p3616.read_text(encoding="utf-8", errors="replace")
    t2 = t.replace("SpaceGrotesk-Regular", "Geist-Regular").replace(
        "SpaceGrotesk-SemiBold", "Geist-SemiBold"
    ).replace("SpaceGrotesk-Bold", "Geist-Bold")
    p3616.write_text(t2, encoding="utf-8")
    print("post-3616 font files remapped")
