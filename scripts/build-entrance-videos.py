#!/usr/bin/env python3
"""Build fast-seek H.264 walkthroughs from the original 721 packed WebP frames."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess

FRAME_COUNT = 721
FPS = 24
CROP_BOTTOM = 76

def encode_profile(root: Path, profile: str) -> None:
    folder = root / "wersja-2d" / "assets" / "entrance-upstairs-v3" / profile
    manifest = json.loads((folder / "index.json").read_text(encoding="utf-8"))
    if manifest["frameCount"] != FRAME_COUNT or manifest["fps"] != FPS:
        raise ValueError(f"Unexpected animation metadata: {profile}")

    def encode(reverse: bool) -> None:
        label = "walk-reverse.mp4" if reverse else "walk.mp4"
        output = folder / label
        command = [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "image2pipe", "-framerate", str(FPS), "-vcodec", "webp",
            "-i", "pipe:0", "-vf", f"crop=iw:ih-{CROP_BOTTOM}:0:0",
            "-c:v", "libx264", "-preset", "fast", "-crf", "19" if reverse else "18",
            "-g", "12", "-keyint_min", "12", "-sc_threshold", "0", "-bf", "0",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(output)
        ]
        process = subprocess.Popen(command, stdin=subprocess.PIPE)
        assert process.stdin is not None
        total = 0
        try:
            packs = list(reversed(manifest["packs"])) if reverse else manifest["packs"]
            for pack in packs:
                data = (folder / pack["file"]).read_bytes()
                offsets = pack["offsets"]
                if len(data) != offsets[-1] or len(offsets) != pack["count"] + 1:
                    raise ValueError(f"Corrupt frame pack: {profile}/{pack['file']}")
                indices = range(pack["count"]-1, -1, -1) if reverse else range(pack["count"])
                for i in indices:
                    frame = data[offsets[i]:offsets[i + 1]]
                    if frame[:4] != b"RIFF" or frame[8:12] != b"WEBP":
                        raise ValueError(f"Corrupt WebP frame {profile}/{total}")
                    process.stdin.write(frame)
                    total += 1
        except Exception:
            process.kill()
            raise
        finally:
            try:
                process.stdin.close()
            except (BrokenPipeError, OSError):
                pass
        if process.wait() != 0 or total != FRAME_COUNT or not output.is_file() or output.stat().st_size == 0:
            raise RuntimeError(f"Encoding {profile}/{label} failed: frames={total}, code={process.returncode}")
        probe = subprocess.check_output([
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=nb_frames,width,height", "-of", "json", str(output)
        ], text=True)
        stream = json.loads(probe)["streams"][0]
        if (int(stream["nb_frames"]) != FRAME_COUNT or
            int(stream["height"]) != manifest["height"] - CROP_BOTTOM or
            int(stream["width"]) != manifest["width"]):
            raise RuntimeError(f"Output video failed validation: {profile}/{label} {stream}")
        print(f"{profile}/{label}: {total} frames, {stream['width']}x{stream['height']}, "
              f"{output.stat().st_size/1_000_000:.1f} MB", flush=True)

    encode(False)
    encode(True)
    for pack in manifest["packs"]:
        (folder / pack["file"]).unlink()

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-root", required=True)
    args = ap.parse_args()
    root = Path(args.site_root).resolve()
    if root.exists():
        shutil.rmtree(root)
    shutil.copytree(Path("dist"), root)
    for name in ("desktop", "mobile"):
        encode_profile(root, name)
    size = sum(p.stat().st_size for p in root.rglob("*") if p.is_file())
    print(f"Publishable website: {size/1_000_000:.1f} MB", flush=True)

if __name__ == "__main__":
    main()
