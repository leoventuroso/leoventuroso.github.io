"""Loads content/data/talks.yaml and content/data/press.yaml and exposes
them to all templates as `talks` and `press`, in the order given in each
YAML file (newest first, by convention). Both render on the /talks/ page.
"""

import yaml
from pelican import signals


def _load(settings, key):
    path = settings.get(key)
    if not path:
        return []
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or []


def add_talks(generators):
    for generator in generators:
        if hasattr(generator, "context"):
            generator.context["talks"] = _load(generator.settings, "TALKS_DATA")
            generator.context["press"] = _load(generator.settings, "PRESS_DATA")
            break


def register():
    signals.all_generators_finalized.connect(add_talks)
