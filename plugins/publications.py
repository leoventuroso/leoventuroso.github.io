"""Loads content/data/publications.yaml and exposes it to all templates:

- `publications_by_year`: entries grouped by year (descending), in YAML order
  within each year;
- `selected_publications`: entries with `selected: true`;
- `publications_graph`: JSON for the paper/co-author network on the
  publications page (theme/minimal/static/js/pub-graph.js). Nodes are papers
  and co-authors (the site author is left out, being on every paper); links
  join each paper to its co-authors. Themes come from PUBLICATION_THEMES and
  each entry's `theme` field (one id, or two for work between themes); only
  themes with at least one paper are sent.
"""

import collections
import json
import re

import yaml
from pelican import signals

_AUTHOR_SPLIT = re.compile(r",\s*(?:and\s+)?|\s+and\s+")


def _load(settings):
    path = settings.get("PUBLICATIONS_DATA")
    if not path:
        return []
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or []


def _by_year(entries):
    by_year = collections.OrderedDict()
    for entry in sorted(entries, key=lambda e: e["year"], reverse=True):
        by_year.setdefault(entry["year"], []).append(entry)
    return by_year


def _authors(entry):
    return [a.strip() for a in _AUTHOR_SPLIT.split(entry.get("authors", "")) if a.strip()]


def _graph(entries, settings):
    themes = settings.get("PUBLICATION_THEMES", [])
    slot = {t["id"]: t.get("slot", i + 1) for i, t in enumerate(themes)}  # color follows the theme
    me = settings.get("AUTHOR", "")
    nodes, links, author_index = [], [], {}
    author_themes = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0]))

    for entry in entries:
        # `theme` is one id or a list of up to two (main one first).
        raw = entry.get("theme")
        paper_themes = [t for t in (raw if isinstance(raw, list) else [raw]) if t in slot][:2]
        if not paper_themes:
            continue
        theme = paper_themes[0]
        paper = len(nodes)
        nodes.append({
            "id": entry["id"], "kind": "paper", "label": entry["title"],
            "year": entry["year"], "venue": entry.get("venue", ""),
            "theme": theme, "themes": paper_themes,
        })
        for name in _authors(entry):
            if name == me:
                continue
            if name not in author_index:
                author_index[name] = len(nodes)
                nodes.append({"id": "author:" + name, "kind": "author",
                              "label": name, "theme": theme, "papers": 0})
            nodes[author_index[name]]["papers"] += 1
            for t in paper_themes:
                stats = author_themes[name][t]
                stats[0] += 1
                stats[1] = max(stats[1], entry["year"])
            links.append([paper, author_index[name]])

    # A co-author sits in the lane where we share most papers (ties: the most
    # recent); links to papers in other lanes stay visible.
    for name, idx in author_index.items():
        nodes[idx]["theme"] = max(author_themes[name].items(), key=lambda kv: tuple(kv[1]))[0]

    used = {t for n in nodes if n["kind"] == "paper" for t in n["themes"]}
    data = {"themes": [{"id": t["id"], "label": t["label"], "slot": slot[t["id"]]}
                       for t in themes if t["id"] in used],
            "nodes": nodes, "links": links}
    # Safe to inline inside <script type="application/json">.
    return json.dumps(data, ensure_ascii=False).replace("</", "<\\/")


def add_publications(generators):
    for generator in generators:
        if hasattr(generator, "context"):
            entries = _load(generator.settings)
            by_year = _by_year(entries)
            generator.context["publications_by_year"] = by_year
            generator.context["selected_publications"] = [
                e for year_entries in by_year.values() for e in year_entries if e.get("selected")
            ]
            generator.context["publications_graph"] = _graph(
                [e for year_entries in by_year.values() for e in year_entries],
                generator.settings,
            )
            break


def register():
    signals.all_generators_finalized.connect(add_publications)
