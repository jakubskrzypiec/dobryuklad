#!/usr/bin/env python3
"""Convert the original packed mobile WebP sequence into a contiguous 9:16
Instagram-ready 60-fps MP4. Rendering the actual source frames avoids every
browser/network/scroll buffering hitch present in live screen recordings.
"""
import json
import pathlib
import subprocess
import sys
import time

root = pathlib.Path("dist/wersja-2d/assets/entrance-upstairs-v3/mobile")
dest = pathlib.Path("/tmp/instagram_3d_frames")
dest.mkdir(parents=True, exist_ok=True)
manifest = json.loads((root / "index.json").read_text())
assert manifest["frameCount"] == 721, manifest["frameCount"]
assert manifest["width"] == 608 and manifest["height"] == 1080
frame_n = 0
for pack in manifest["packs"]:
    data = (root / pack["file"]).read_bytes()
    offsets = pack["offsets"]
    assert len(offsets) == pack["count"] + 1
    assert len(data) == offsets[-1]
    for j in range(pack["count"]):
        idx = pack["first"] + j
        assert idx == frame_n
        frame = data[offsets[j]:offsets[j + 1]]
        assert frame[:4] == b"RIFF" and frame[8:12] == b"WEBP", (idx, len(frame))
        (dest / f"frame-{idx:04d}.webp").write_bytes(frame)
        frame_n += 1
assert frame_n == 721
print(f"Extracted {frame_n} original 608×1080 mobile frames", flush=True)

# 30 fps uses the complete sequence in 24 seconds. Interpolate 2 new 60-fps
# positions between originals with optical motion estimation before scaling.
# A one-second closing hold creates a natural space for an Instagram CTA.
ending = dest / "frame-0720.webp"
for idx in range(721, 751):
    (dest / f"frame-{idx:04d}.webp").write_bytes(ending.read_bytes())

output = pathlib.Path("instagram-spacer-3d-60fps.mp4")
filter_mci = (
    "minterpolate=fps=60:mi_mode=mci:mc_mode=obmc:"
    "me_mode=bidir:me=epzs:search_param=8:vsbmc=0,"
    "scale=1080:1920:flags=lanczos,format=yuv420p"
)
filter_fallback = "framerate=fps=60:interp_start=10:interp_end=245:scene=100,scale=1080:1920:flags=lanczos,format=yuv420p"

def encode(vfilter):
    return [
      "ffmpeg", "-hide_banner", "-nostdin", "-y",
      "-threads", "2",
      "-framerate", "30",
      "-i", str(dest / "frame-%04d.webp"),
      "-vf", vfilter,
      "-c:v", "libx264", "-preset", "medium", "-crf", "19",
      "-pix_fmt", "yuv420p", "-r", "60",
      "-movflags", "+faststart", "-an",
      "-max_muxing_queue_size", "1024",
      str(output),
    ]
start = time.monotonic()
try:
    subprocess.run(encode(filter_mci), check=True)
except subprocess.CalledProcessError:
    print("Optical-flow interpolation failed; retrying high-quality frame interpolation", flush=True)
    subprocess.run(encode(filter_fallback), check=True)
print(f"Wrote {output} in {time.monotonic()-start:.1f}s; size {output.stat().st_size/1e6:.1f} MB", flush=True)
subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                "-show_entries", "stream=width,height,r_frame_rate,nb_frames,duration",
                "-of", "default=nw=1", str(output)],check=True)
