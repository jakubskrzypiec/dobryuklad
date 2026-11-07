#!/usr/bin/env python3
"""Fast motion-blended 60-fps Reels export with the original 721 WebP frames."""
import json, pathlib, subprocess
root=pathlib.Path("dist/wersja-2d/assets/entrance-upstairs-v3/mobile")
m=json.loads((root/"index.json").read_text())
frames=pathlib.Path("/tmp/reel-frames")
frames.mkdir(parents=True,exist_ok=True)
count=0
for pack in m["packs"]:
 data=(root/pack["file"]).read_bytes()
 offsets=pack["offsets"]
 assert len(data)==offsets[-1]
 for local in range(pack["count"]):
  idx=pack["first"]+local
  frame=data[offsets[local]:offsets[local+1]]
  assert frame[:4]==b"RIFF" and frame[8:12]==b"WEBP"
  (frames/f"f-{idx:04d}.webp").write_bytes(frame)
  count+=1
assert count==721
for n in range(721,751):
 (frames/f"f-{n:04d}.webp").write_bytes((frames/"f-0720.webp").read_bytes())
print(f"Extracted {count} frames",flush=True)
subprocess.run([
 "ffmpeg","-hide_banner","-nostdin","-y","-threads","2",
 "-framerate","30","-i",str(frames/"f-%04d.webp"),
 "-vf","framerate=fps=60:interp_start=10:interp_end=245:scene=100,scale=1080:1920:flags=lanczos,format=yuv420p",
 "-c:v","libx264","-preset","veryfast","-crf","18",
 "-pix_fmt","yuv420p","-r","60","-movflags","+faststart","-an",
 "instagram-spacer-3d-ready.mp4"
],check=True)
subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height,r_frame_rate,nb_frames","-of","default=nw=1","instagram-spacer-3d-ready.mp4"],check=True)
