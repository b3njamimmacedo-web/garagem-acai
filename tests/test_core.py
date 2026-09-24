import json

from asimov_agent.experts.retrieval import BM25, Chunk, chunk_text, tokenize
from asimov_agent.models import folder_name
from asimov_agent.storage import Store
from asimov_agent.transcribe import storage_state_to_netscape, vtt_to_text


def test_folder_name_keeps_order_and_slug():
    assert folder_name(3, "Pandas: Básico!") == "03-pandas-basico"


def test_tokenize_strips_accents_and_stopwords():
    assert tokenize("A função é ótima") == ["funcao", "otima"]


def test_chunk_text_covers_text():
    text = "Frase. " * 600
    chunks = chunk_text(text, size=500, overlap=50)
    assert len(chunks) > 1 and all(len(c) <= 500 for c in chunks)


def test_bm25_ranks_relevant_first():
    idx = BM25([
        Chunk("a", "loops for e while em python"),
        Chunk("b", "dataframes do pandas, groupby e merge"),
    ])
    assert idx.search("como usar groupby no pandas")[0].source == "b"


def test_vtt_to_text():
    vtt = "WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.000\n<c>Olá</c> mundo\n\n2\n00:00:02.000 --> 00:00:03.000\nOlá mundo\n"
    assert vtt_to_text(vtt) == "Olá mundo"


def test_store_order_and_progress(tmp_path):
    st = Store(tmp_path / "s.db")
    c2 = st.upsert_course("u2", "Curso B", 2)
    c1 = st.upsert_course("u1", "Curso A", 1)
    m = st.upsert_module(c2, "M1", 1)
    st.upsert_module(c1, "M1", 1)
    lid = st.upsert_lesson(m, "l1", "Aula", 1)
    st.set_lesson(lid, status="done")
    assert [r["course_title"] for r in st.modules_in_order()] == ["Curso A", "Curso B"]
    assert st.progress()["done"] == 1


def test_cookie_export(tmp_path):
    state = tmp_path / "state.json"
    state.write_text(json.dumps({"cookies": [
        {"domain": ".asimov.academy", "path": "/", "secure": True, "expires": 2000000000,
         "name": "sid", "value": "x"}]}))
    out = storage_state_to_netscape(state, tmp_path / "c.txt").read_text()
    assert ".asimov.academy\tTRUE\t/\tTRUE\t2000000000\tsid\tx" in out
