"""Turns Markdown footnotes into Tufte-style sidenotes and margin notes.

Registers a `sidenotes` Jinja filter, applied only in article.html
(`{{ article.content|sidenotes }}`). The stored content is left untouched,
so the Atom feed and any other template keep plain footnotes.

Authoring (standard Markdown footnotes, from the `extra` extension):

    A claim.[^1] A remark.[^m-photo]

    [^1]: Becomes a numbered sidenote.
    [^m-photo]: Labels starting with "m-" become unnumbered margin notes.

A note is rendered inside a <span>, so it should hold inline content only
(text, links, emphasis, inline code); multiple paragraphs are joined with
<br>. If the footnote block cannot be parsed, the content is returned
unchanged.
"""

import html
import re

from markupsafe import Markup
from pelican import signals

MARGIN_PREFIX = "m-"

_FOOTNOTE_DIV = '<div class="footnote">'
_ITEM_SPLIT = re.compile(r'<li id="fn:([^"]+)">')
_BACKREF = re.compile(r'(?:&#160;)?<a class="footnote-backref"[^>]*>.*?</a>')
_REF = re.compile(
    r'<sup id="fnref\d*:(?P<label>[^"]+)">'
    r'<a class="footnote-ref" href="#fn:(?P=label)">\d+</a></sup>'
)


def _note_body(raw):
    """Footnote <li> body -> inline HTML suitable for a <span>."""
    body = re.sub(r"</li>\s*$", "", raw.strip())
    body = _BACKREF.sub("", body).strip()
    paragraphs = re.findall(r"<p>(.*?)</p>", body, flags=re.S)
    if paragraphs:
        body = "<br>".join(p.strip() for p in paragraphs)
    return body


def _parse_footnotes(block):
    """Returns {label: inline_html} from the footnote <div>, or None."""
    block = re.sub(r"</ol>\s*</div>\s*$", "", block.strip())
    parts = _ITEM_SPLIT.split(block)
    # parts = [preamble, label1, body1, label2, body2, ...]
    if len(parts) < 3:
        return None
    return {parts[i]: _note_body(parts[i + 1]) for i in range(1, len(parts), 2)}


def sidenotes(content):
    content = str(content)
    start = content.rfind(_FOOTNOTE_DIV)
    if start == -1:
        return Markup(content)
    notes = _parse_footnotes(content[start + len(_FOOTNOTE_DIV):])
    if not notes:
        return Markup(content)

    seen = {}

    def replace(match):
        label = match.group("label")
        if label not in notes:
            return match.group(0)
        seen[label] = seen.get(label, 0) + 1
        is_margin = label.startswith(MARGIN_PREFIX)
        kind = "mn" if is_margin else "sn"
        uid = html.escape(f"{kind}-{label}-{seen[label]}", quote=True)
        if is_margin:
            toggle = f'<label for="{uid}" class="margin-toggle" aria-label="Show margin note">&#8853;</label>'
            note_class = "marginnote"
        else:
            toggle = f'<label for="{uid}" class="margin-toggle sidenote-number" aria-label="Show sidenote"></label>'
            note_class = "sidenote"
        return (
            f'{toggle}<input type="checkbox" id="{uid}" class="margin-toggle">'
            f'<span class="{note_class}">{notes[label]}</span>'
        )

    body = _REF.sub(replace, content[:start])
    return Markup(body)


def add_filter(generator):
    generator.env.filters["sidenotes"] = sidenotes


def register():
    signals.generator_init.connect(add_filter)
