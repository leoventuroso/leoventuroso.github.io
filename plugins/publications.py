"""Loads content/data/publications.yaml and exposes it to all templates
as `publications`, grouped by year (descending) and sorted within each
year by the order they appear in the YAML file.
"""

import collections

import yaml
from pelican import signals


def _load(settings):
    path = settings.get("PUBLICATIONS_DATA")
    if not path:
        return []
    with open(path, encoding="utf-8") as f:
        entries = yaml.safe_load(f) or []

    by_year = collections.OrderedDict()
    for entry in sorted(entries, key=lambda e: e["year"], reverse=True):
        by_year.setdefault(entry["year"], []).append(entry)
    return by_year


def add_publications(generators):
    for generator in generators:
        if hasattr(generator, "context"):
            generator.context["publications_by_year"] = _load(generator.settings)
            generator.context["selected_publications"] = [
                e
                for year_entries in generator.context["publications_by_year"].values()
                for e in year_entries
                if e.get("selected")
            ]
            break


def register():
    signals.all_generators_finalized.connect(add_publications)
