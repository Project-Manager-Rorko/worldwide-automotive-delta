from pathlib import Path
import re

h = Path(__file__).parent.joinpath("fragments/page-home.html").read_text(
    encoding="utf-8", errors="replace"
)
print("webm count", h.lower().count("webm"))
print("vipaccounts", re.findall(r"https?://[^\s\"']*vipaccounts[^\s\"']*", h)[:10])
for m in re.finditer(r"<video[\s\S]{0,800}?</video>", h, re.I):
    print("VIDEO BLOCK:", m.group(0)[:500])
for m in re.finditer(r"elementor-background-video[^\"]*", h):
    print("class", m.group(0)[:120])
# data-settings often holds video URL as JSON
for m in re.finditer(r"background_video_link[^,]{0,200}", h):
    print("setting", m.group(0)[:200])
for m in re.finditer(r"background_play_on_mobile[^,]{0,80}", h):
    print(m.group(0))
# any .webm
for m in re.finditer(r"[^\s\"']+\.webm", h):
    print("webm url", m.group(0)[:200])
