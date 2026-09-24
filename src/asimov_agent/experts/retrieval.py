"""Busca BM25 local e sem dependências sobre os trechos de um expert."""

from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass

STOPWORDS = set(
    "a o e de da do das dos em no na nos nas um uma uns umas para por com como que se "
    "é ao aos à às ou mais mas não sim eu você ele ela isso esse essa este esta the of and to in is".split()
)


def tokenize(text: str) -> list[str]:
    text = unicodedata.normalize("NFKD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return [t for t in re.findall(r"[a-z0-9_]+", text) if t not in STOPWORDS and len(t) > 1]


def chunk_text(text: str, size: int = 1200, overlap: int = 200) -> list[str]:
    """Divide em janelas de ~size caracteres, cortando em quebras de parágrafo/frase."""
    text = text.strip()
    if len(text) <= size:
        return [text] if text else []
    chunks, start = [], 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            cut = max(text.rfind("\n", start, end), text.rfind(". ", start, end))
            if cut > start + size // 2:
                end = cut + 1
        chunks.append(text[start:end].strip())
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return [c for c in chunks if c]


@dataclass
class Chunk:
    source: str
    text: str


class BM25:
    def __init__(self, chunks: list[Chunk], k1: float = 1.5, b: float = 0.75):
        self.chunks = chunks
        self.k1, self.b = k1, b
        self.docs = [Counter(tokenize(c.text)) for c in chunks]
        self.lens = [sum(d.values()) for d in self.docs]
        self.avg = (sum(self.lens) / len(self.lens)) if self.lens else 0.0
        df: Counter[str] = Counter()
        for d in self.docs:
            df.update(d.keys())
        n = len(self.docs)
        self.idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}

    def search(self, query: str, k: int = 6) -> list[Chunk]:
        q = tokenize(query)
        scores = []
        for i, d in enumerate(self.docs):
            s = 0.0
            for t in q:
                if t not in d:
                    continue
                tf = d[t]
                s += self.idf[t] * tf * (self.k1 + 1) / (
                    tf + self.k1 * (1 - self.b + self.b * self.lens[i] / (self.avg or 1))
                )
            if s > 0:
                scores.append((s, i))
        scores.sort(reverse=True)
        return [self.chunks[i] for _, i in scores[:k]]
