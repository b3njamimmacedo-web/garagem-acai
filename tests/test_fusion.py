import json

from asimov_agent.experts.fusion import fuse
from asimov_agent.experts.registry import load_experts

from fakes import FakeLLM


def make_expert(root, slug, domain, order, concepts=None):
    d = root / slug
    d.mkdir(parents=True)
    (d / "profile.json").write_text(json.dumps({
        "slug": slug, "kind": "module", "order": order, "name": f"Expert {slug}",
        "domain": domain, "description": "", "when_to_consult": domain,
        "system_prompt": f"sp {slug}", "key_concepts": concepts or [domain.lower()],
        "procedures": [], "pitfalls": [], "glossary": [], "course": "C", "module": slug,
    }))
    (d / "chunks.jsonl").write_text(json.dumps({"source": "a/lesson.md", "text": f"texto {slug}"}) + "\n")


def test_new_module_joins_existing_theme_and_singletons_stay(tmp_path):
    make_expert(tmp_path, "pandas-1", "Pandas", 1)
    make_expert(tmp_path, "sql-1", "SQL", 2)
    llm = FakeLLM()
    state = fuse(llm, tmp_path)
    assert not (tmp_path / "_themes" / "pandas").exists()  # tema com 1 membro não funde
    assert set(load_experts(tmp_path)) == {"pandas-1", "sql-1"}

    make_expert(tmp_path, "pandas-2", "Pandas", 3)
    state = fuse(llm, tmp_path)
    assert state["themes"]["pandas"]["members"] == ["pandas-1", "pandas-2"]
    council = load_experts(tmp_path)
    assert set(council) == {"pandas", "sql-1"}
    sources = [c.source for c in council["pandas"].index.chunks]
    assert sources == ["pandas-1/a/lesson.md", "pandas-2/a/lesson.md"]


def test_offline_grouping_by_similarity(tmp_path):
    make_expert(tmp_path, "a", "Pandas", 1, ["pandas", "dataframe", "groupby"])
    make_expert(tmp_path, "b", "Pandas avançado", 2, ["pandas", "dataframe", "merge"])
    make_expert(tmp_path, "c", "Streamlit", 3, ["streamlit", "dashboard"])
    state = fuse(None, tmp_path)
    groups = sorted(sorted(v["members"]) for v in state["themes"].values())
    assert groups == [["a", "b"], ["c"]]
    assert load_experts(tmp_path)["pandas"].profile["members"] == ["a", "b"]
