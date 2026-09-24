"""'Assistir' a aula = obter a transcrição do vídeo.

Estratégia: 1) legendas (do player ou do yt-dlp) → 2) áudio + Whisper local.
O áudio é temporário e apagado ao fim (a menos que media.keep_audio=true).
"""

from __future__ import annotations

import json
import re
import tempfile
from pathlib import Path

from .config import Settings


def storage_state_to_netscape(state_file: Path, out: Path) -> Path:
    """Converte os cookies do Playwright para o formato que o yt-dlp lê."""
    cookies = json.loads(state_file.read_text())["cookies"]
    lines = ["# Netscape HTTP Cookie File"]
    for c in cookies:
        domain = c["domain"]
        lines.append("\t".join([
            domain,
            "TRUE" if domain.startswith(".") else "FALSE",
            c.get("path", "/"),
            "TRUE" if c.get("secure") else "FALSE",
            str(int(c.get("expires", 0)) if c.get("expires", -1) > 0 else 0),
            c["name"],
            c["value"],
        ]))
    out.write_text("\n".join(lines) + "\n")
    out.chmod(0o600)
    return out


def vtt_to_text(vtt: str) -> str:
    """Remove cabeçalho, timestamps, tags e linhas repetidas de um .vtt/.srt."""
    out: list[str] = []
    for line in vtt.splitlines():
        line = line.strip()
        if (not line or line.startswith(("WEBVTT", "NOTE", "Kind:", "Language:"))
                or "-->" in line or line.isdigit()):
            continue
        line = re.sub(r"<[^>]+>", "", line)
        if not out or out[-1] != line:
            out.append(line)
    return " ".join(out)


def _ydl_opts(s: Settings, referer: str, cookiefile: Path, workdir: Path) -> dict:
    return {
        "quiet": True,
        "no_warnings": True,
        "cookiefile": str(cookiefile),
        "http_headers": {"Referer": referer},
        "outtmpl": str(workdir / "%(id)s.%(ext)s"),
    }


def fetch_captions(s: Settings, video_url: str, referer: str, cookiefile: Path) -> str | None:
    import yt_dlp

    with tempfile.TemporaryDirectory() as tmp:
        opts = _ydl_opts(s, referer, cookiefile, Path(tmp)) | {
            "skip_download": True,
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitleslangs": ["pt.*", "pt", "en.*"],
            "subtitlesformat": "vtt/srt/best",
        }
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([video_url])
        subs = sorted(Path(tmp).glob("*.vtt")) + sorted(Path(tmp).glob("*.srt"))
        return vtt_to_text(subs[0].read_text(errors="ignore")) if subs else None


def transcribe_audio(s: Settings, video_url: str, referer: str, cookiefile: Path, keep_dir: Path) -> str:
    import yt_dlp

    try:
        from faster_whisper import WhisperModel
    except ImportError as e:  # pragma: no cover
        raise RuntimeError("Instale o extra: pip install -e '.[whisper]'") from e

    workdir = keep_dir if s.get("media.keep_audio") else Path(tempfile.mkdtemp())
    opts = _ydl_opts(s, referer, cookiefile, workdir) | {"format": "bestaudio/best"}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(video_url, download=True)
        audio = Path(ydl.prepare_filename(info))

    model = WhisperModel(s.get("media.whisper_model", "small"), compute_type="int8")
    segments, _ = model.transcribe(str(audio), language=s.get("media.whisper_language", "pt"))
    text = " ".join(seg.text.strip() for seg in segments)
    if not s.get("media.keep_audio"):
        audio.unlink(missing_ok=True)
    return text


def transcribe_lesson(s: Settings, video_urls: list[str], caption_urls: list[str],
                      lesson_url: str, lesson_dir: Path, cookiefile: Path,
                      http_get=None) -> str:
    """Retorna a transcrição concatenada de todos os vídeos da aula."""
    parts: list[str] = []
    for cap in caption_urls:
        if http_get:
            parts.append(vtt_to_text(http_get(cap)))
    if parts:
        return "\n\n".join(parts)
    for url in video_urls:
        text = None
        if s.get("media.prefer_captions", True):
            try:
                text = fetch_captions(s, url, lesson_url, cookiefile)
            except Exception:  # noqa: BLE001 — player sem legendas acessíveis
                text = None
        if not text:
            text = transcribe_audio(s, url, lesson_url, cookiefile, lesson_dir)
        parts.append(text)
    return "\n\n".join(parts)
