import re
import shutil
from pathlib import Path

css_dir = Path(__file__).parent / "css"
upload_css = Path(r"C:\Users\shanm\Local Sites\wwa\app\public\wp-content\uploads\elementor\css")
for pid in (14, 1170, 1648, 3616, 6, 726, 737):
    src = upload_css / f"post-{pid}.css"
    dst = css_dir / f"post-{pid}.css"
    if src.exists() and not dst.exists():
        shutil.copy2(src, dst)
        print("copied", dst.name)
    elif dst.exists():
        print("have", dst.name)
    else:
        print("missing", pid)

h = (Path(__file__).parent / "fragments" / "page-home.html").read_text(
    encoding="utf-8", errors="replace"
)
print("\n--- media refs ---")
for m in re.finditer(r"""(?:src|poster|data-src)=["']([^"']+)["']""", h):
    u = m.group(1)
    if any(x in u.lower() for x in [".webm", ".mp4", "video", "banner", ".woff"]):
        print(u[:180])

# background urls in style attrs
for m in re.finditer(r"url\(([^)]+)\)", h):
    u = m.group(1).strip("'\"")
    if any(x in u.lower() for x in [".webm", "banner", "video"]):
        print("bg", u[:180])

public = Path(r"C:\Users\shanm\Local Sites\wwa\app\public")
print("\n--- existence of video candidates ---")
for rel in [
    "wp-content/uploads/2026/07/WWA-home-page-banner-video-new.webm",
    "wp-content/uploads/2026/06/WWA-home-page-banner-video-new.webm",
    "wp-content/uploads/2026/07/WWA-home-page-banner-video-new-scaled.webp",
    "wp-content/uploads/2026/06/WWA-home-page-banner-video-new-scaled.webp",
]:
    p = public / rel.replace("/", "\\")
    print(("OK" if p.exists() else "NO"), p, p.stat().st_size if p.exists() else 0)
