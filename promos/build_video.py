#!/usr/bin/env python3
"""Assemble the CodeMaster Ghana brag video (vertical 1080x1920).

Frames are rendered in Python (PIL) — Ken Burns moves, burned-in
captions, logo cards, fades — piped raw into ffmpeg for H.264 encoding.
Audio: per-scene TTS narration (trimmed + tempo-lifted by ffmpeg) mixed
over a synthesized beat bed (numpy).
"""
import re
import subprocess
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/home/user/natthesisa/promos")
FF = "/home/user/natthesisa/.venv-ffmpeg/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
W, H, FPS = 1080, 1920, 30
LEAD, TAIL = 0.25, 0.45
TEMPO = 1.25
LOGO = Path("/home/user/natthesisa/public/branding/logo-1024.jpg")

SCENES = [
    dict(id="s1", img="scenes/s1-hook.jpg",
         big="GHANA'S NEXT GREAT DEVELOPER", sub="could be you.", sub2=None,
         zoom=lambda fr: (1 + 0.10 * fr, 0.5, 0.5), logo=True),
    dict(id="s2", img="scenes/s2-flex.jpg",
         big="28 COURSES", sub="12 PROGRAMS  •  148 LESSONS", sub2=None,
         zoom=lambda fr: (1.10 - 0.10 * fr, 0.5, 0.5), logo=False),
    dict(id="s3", img="scenes/s3-directions.jpg",
         big="PICK YOUR DIRECTION", sub="WEB • APPS • BACKEND • CYBER",
         sub2="DATA • DESIGN • CLOUD • AI",
         zoom=lambda fr: (1.05 + 0.08 * fr, fr, 0.5), logo=False),
    dict(id="s4", img="scenes/s4-studio.jpg",
         big="A REAL CODE EDITOR", sub="IN YOUR BROWSER — FREE", sub2=None,
         zoom=lambda fr: (1 + 0.10 * fr, 0.5, fr), logo=False),
    dict(id="s5", img="scenes/s5-natthesisa.jpg",
         big="STUCK AT MIDNIGHT?", sub="ASK NATTHESISA", sub2=None,
         zoom=lambda fr: (1.10 - 0.10 * fr, 0.5, 0.5), logo=False),
    dict(id="s6", img="scenes/s6-progress.jpg",
         big="NARRATED LESSON VIDEOS", sub="STREAKS • GOALS • SAVED PROGRESS", sub2=None,
         zoom=lambda fr: (1.08 + 0.08 * fr, 0.5, 1 - fr), logo=False),
    dict(id="s7", img="scenes/s7-certificate.jpg",
         big="FINISH. EARN. VERIFY.", sub="A CERTIFICATE ANY EMPLOYER CAN SCAN", sub2=None,
         zoom=lambda fr: (1 + 0.12 * fr, 0.5, 0.5), logo=False),
    dict(id="s8", img="scenes/s8-cta.jpg",
         big="LEARN. BUILD. BECOME.", sub="CREATE YOUR FREE ACCOUNT",
         sub2="codemastergh.online",
         zoom=lambda fr: (1.10 - 0.06 * fr, 0.5, 0.5), logo=True, cta=True),
]


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"FAILED: {' '.join(map(str, cmd))}\n{p.stderr[-3000:]}")
    return p


def probe(path):
    p = subprocess.run([FF, "-i", str(path)], capture_output=True, text=True)
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", p.stderr)
    if not m:
        raise RuntimeError(f"cannot probe {path}: {p.stderr[-500:]}")
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


# ---------------------------------------------------------------- audio
def prep_audio():
    durs = {}
    for s in SCENES:
        src, dst = ROOT / f"audio/{s['id']}.mp3", ROOT / f"audio/{s['id']}_proc.wav"
        af = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,"
              "areverse,"
              "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,"
              "areverse,atempo=%.2f" % TEMPO)
        run([FF, "-y", "-v", "error", "-i", str(src), "-af", af,
             "-ar", "44100", "-ac", "2", str(dst)])
        durs[s["id"]] = probe(dst)
    return durs


def read_wav(path):
    with wave.open(str(path), "rb") as w:
        n = w.getnframes()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
        data = data.reshape(-1, w.getnchannels())
        if w.getnchannels() == 1:
            data = np.repeat(data, 2, axis=1)
        return data


def make_music(total):
    sr = 44100
    n = int(total * sr)
    out = np.zeros((n, 2), dtype=np.float32)
    bpm = 124.0
    beat = 60.0 / bpm
    rng = np.random.default_rng(7)

    def add(sig, start):
        i0 = int(start * sr)
        i1 = min(n, i0 + len(sig))
        if i0 < n:
            out[i0:i1] += sig[: i1 - i0, None] if sig.ndim == 1 else sig[: i1 - i0]

    def kick(dur=0.22):
        tt = np.arange(int(dur * sr)) / sr
        f = 45 + 105 * np.exp(-tt * 30)
        ph = 2 * np.pi * np.cumsum(f) / sr
        return (np.sin(ph) * np.exp(-tt * 9) * 0.9).astype(np.float32)

    def hat(dur=0.05):
        tt = np.arange(int(dur * sr)) / sr
        x = np.diff(rng.standard_normal(int(dur * sr)), prepend=0)
        return (x * np.exp(-tt * 90) * 0.22).astype(np.float32)

    def clap(dur=0.16):
        tt = np.arange(int(dur * sr)) / sr
        x = rng.standard_normal(int(dur * sr))
        return (x * np.exp(-tt * 28) * 0.4).astype(np.float32)

    def bass(freq, dur):
        tt = np.arange(int(dur * sr)) / sr
        x = 2 * (tt * freq % 1) - 1
        y = np.zeros_like(x)
        a, acc = 0.08, 0.0
        for i in range(len(x)):
            acc += a * (x[i] - acc)
            y[i] = acc
        return (y * np.exp(-tt * 2.2) * 0.5).astype(np.float32)

    def pluck(freq, dur=0.18):
        tt = np.arange(int(dur * sr)) / sr
        sig = np.sin(2 * np.pi * freq * tt) * 0.7 + np.sin(2 * np.pi * freq * 2 * tt) * 0.2
        return (sig * np.exp(-tt * 16) * 0.14).astype(np.float32)

    bars = int(total / (4 * beat)) + 1
    prog = [110.0, 87.31, 130.81, 98.0]  # Am F C G
    penta = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0]
    for b in range(bars):
        root = prog[b % 4]
        bar_start = b * 4 * beat
        if bar_start >= total:
            break
        for k in range(4):
            add(kick(), bar_start + k * beat)
            add(hat(), bar_start + k * beat + beat / 2)
            if k in (1, 3):
                add(clap(), bar_start + k * beat)
            add(bass(root, beat * 0.9), bar_start + k * beat)
        for s16 in range(16):
            add(pluck(penta[(b * 3 + s16 * 2) % len(penta)]),
                bar_start + s16 * beat / 4)

    d = int(0.375 * beat * sr)
    echo = np.zeros_like(out)
    echo[d:] = out[:-d] * 0.3
    out = out + echo

    fi, fo = int(0.6 * sr), int(2.0 * sr)
    out[:fi] *= np.linspace(0, 1, fi)[:, None]
    out[-fo:] *= np.linspace(1, 0, fo)[:, None]
    out = out / (np.max(np.abs(out)) + 1e-9) * 0.72
    pcm = (out * 32767).astype(np.int16)
    wav_path = ROOT / "music.wav"
    with wave.open(str(wav_path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    return out


# ---------------------------------------------------------------- visuals
BW, BH = 1188, 2112  # 1.1x cover base for Ken Burns headroom


def load_cover(path):
    im = Image.open(path).convert("RGB")
    scale = max(BW / im.width, BH / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    left, top = (im.width - BW) // 2, (im.height - BH) // 2
    return im.crop((left, top, left + BW, top + BH))


def make_logo_card(size=360):
    im = Image.open(LOGO).convert("RGB")
    im.thumbnail((size - 24, size - 24), Image.LANCZOS)
    card = Image.new("RGB", (size, size), (255, 255, 255))
    card.paste(im, ((size - im.width) // 2, (size - im.height) // 2))
    return card


def text_spec(s):
    """Caption text lines for a scene."""
    lines = [(s["big"], 76 if not s.get("cta") else 80, (255, 255, 255), True)]
    sub_y = 1470
    lines.append((s["sub"], 42, (255, 207, 89) if s.get("cta") else (255, 255, 255), True))
    if s["sub2"]:
        lines.append((s["sub2"], 58 if s.get("cta") else 36,
                      (255, 207, 89) if s.get("cta") else (255, 255, 255), True))
    return lines


def caption_overlay(s):
    """RGBA overlay with all caption lines + watermark."""
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    y_big = 1120 if s.get("cta") else 1330
    ys = [y_big, y_big + 140, y_big + 250]
    for (text, size, color, boxed), y in zip(text_spec(s), ys):
        font = ImageFont.truetype(FONT, size)
        bbox = d.textbbox((W / 2, y), text, font=font, anchor="ma")
        if boxed:
            d.rounded_rectangle([bbox[0] - 26, bbox[1] - 14, bbox[2] + 26, bbox[3] + 14],
                                radius=20, fill=(12, 8, 24, 115))
        d.text((W / 2 + 2, y + 3), text, font=font, anchor="ma",
               fill=(0, 0, 0, 160))
        d.text((W / 2, y), text, font=font, anchor="ma", fill=color + (255,),
               stroke_width=2, stroke_fill=(20, 12, 35, 255))
    if not s.get("cta"):
        font = ImageFont.truetype(FONT, 30)
        d.text((W / 2, 1830), "codemastergh.online", font=font, anchor="ma",
               fill=(255, 255, 255, 150))
    return ov


def render_frames():
    """Yield (scene_id, frame_rgb_bytes, scene_dur) for every frame."""
    durs = prep_audio()
    timeline = []
    t = 0.0
    for s in SCENES:
        dur = LEAD + durs[s["id"]] + TAIL
        timeline.append((s, dur, t))
        t += dur
    total = t

    logo_card = make_logo_card()
    for s, dur, t0 in timeline:
        base = load_cover(ROOT / s["img"])
        cap = caption_overlay(s)
        cap_alpha = cap.split()[3]
        n = max(1, round(dur * FPS))
        print(f"scene {s['id']}: {dur:.2f}s ({n} frames)")
        for i in range(n):
            fr = i / max(1, n - 1)
            z, px, py = s["zoom"](fr)
            zw, zh = W / z, H / z
            x0 = (BW - zw) * px
            y0 = (BH - zh) * py
            frame = base.resize((W, H), box=(x0, y0, x0 + zw, y0 + zh),
                                resample=Image.BILINEAR)
            # caption + logo fades
            fade = min(1.0, i / (0.35 * FPS), (n - i) / (0.5 * FPS))
            if fade > 0.01:
                a = cap_alpha.point(lambda p, f=fade: int(p * f))
                frame.paste(cap, (0, 0), mask=a)
                if s["logo"]:
                    la = logo_card.split()[
                        3] if logo_card.mode == "RGBA" else None
                    card_x, card_y = (W - 360) // 2, 150
                    if la is None:
                        frame.paste(logo_card, (card_x, card_y))
                    else:
                        frame.paste(logo_card, (card_x, card_y),
                                    mask=la.point(lambda p, f=fade: int(p * f)))
            # scene fade to/from black
            bf = min(1.0, i / (0.35 * FPS), (n - 1 - i) / (0.35 * FPS))
            if bf < 1.0:
                arr = np.asarray(frame).astype(np.float32) * bf
                frame = Image.fromarray(arr.astype(np.uint8))
            yield s["id"], frame.tobytes(), total


def main():
    # audio timeline
    durs = prep_audio()
    starts, t = {}, 0.0
    for s in SCENES:
        dur = LEAD + durs[s["id"]] + TAIL
        starts[s["id"]] = (t, dur)
        t += dur
    total = t

    # mix narration + music in numpy
    sr = 44100
    mix = np.zeros((int(total * sr) + sr, 2), dtype=np.float32)
    for s in SCENES:
        nar = read_wav(ROOT / f"audio/{s['id']}_proc.wav")
        i0 = int((starts[s["id"]][0] + LEAD) * sr)
        mix[i0:i0 + len(nar)] += nar
    music = make_music(total)
    mix[: len(music)] += music * 0.13
    mix = np.tanh(mix * 1.1) * 0.92
    mix_wav = ROOT / "final_audio.wav"
    with wave.open(str(mix_wav), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())

    # video: raw frames -> ffmpeg
    final = ROOT / "codemasterghana-brag-9x16.mp4"
    p = subprocess.Popen(
        [FF, "-y", "-v", "error",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-",
         "-i", str(mix_wav),
         "-map", "0:v", "-map", "1:a",
         "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
         "-movflags", "+faststart", "-shortest", str(final)],
        stdin=subprocess.PIPE)
    for scene_id, frame_bytes, _ in render_frames():
        p.stdin.write(frame_bytes)
    p.stdin.close()
    p.wait()
    if p.returncode != 0:
        raise RuntimeError("ffmpeg encode failed")
    print(f"FINAL: {final}  ({probe(final):.2f}s)")


if __name__ == "__main__":
    main()
