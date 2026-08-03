"""Loads content/data/talks.yaml and exposes it to all templates as
`talks`, in the order given in the YAML file (newest first, by convention).
"""

import yaml
from pelican import signals


def _load(settings):
    path = settings.get("TALKS_DATA")
    if not path:
        return []
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or []


def add_talks(generators):
    for generator in generators:
        if hasattr(generator, "context"):
            generator.context["talks"] = _load(generator.settings)
            break


def register():
    signals.all_generators_finalized.connect(add_talks)
