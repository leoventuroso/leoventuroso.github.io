# leoventuroso.github.io

Personal site of Leonardo Venturoso, built with [Pelican](https://getpelican.com/) and a small hand-rolled theme (no CSS framework).

## Local development

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

make devserver   # autoreloading dev server at http://localhost:8500
```

Other targets:

```sh
make html      # build with pelicanconf.py (relative URLs, no feed)
make publish   # build with publishconf.py (absolute URLs, feed, sitemap)
make serve     # serve an already-built output/ at http://localhost:8500
make clean     # remove output/
```

## Content

- `content/pages/about.md` — bio shown on the homepage
- `content/articles/` — blog posts (one Markdown file per post, filename-date-prefixed for readability; the authoritative date is the `Date:` metadata field)
- `content/data/publications.yaml` — publications list, including BibTeX; rendered by `plugins/publications.py` and `theme/minimal/templates/publications.html`. Set `selected: true` on an entry to surface it on the homepage.
- `content/data/talks.yaml` — talks list; rendered by `plugins/talks.py` and `theme/minimal/templates/talks.html`. See "Adding a talk" below.
- `content/pdf/LeonardoVenturoso_CV.pdf` — the nav "cv" link points straight at this file (no HTML CV page)

### Adding a talk

1. Open `content/data/talks.yaml`.
2. Add a new entry **at the top** of the list (newest first) in this form:

   ```yaml
   - title: "Talk title"
     links:
       - label: "Venue name"
         url: "https://example.com/"
       - label: "Slides"
         url: "/pdf/my-slides.pdf"
       - label: "Video"
         url: "https://youtu.be/..."
   ```

3. `links` is a plain list — include only the ones that actually exist for that talk (venue/website, Slides, Video, Podcast, ...), in any order, at least one.
4. If you have a slides PDF to host yourself: drop it in `content/pdf/` and reference it as `/pdf/filename.pdf` (matches the `cv` link's pattern). External links (YouTube, podcast platforms, conference sites) just go in as full URLs.
5. Save, then check it locally: `make devserver`, open `http://localhost:8500/talks/`.
6. Commit and push — no other file needs touching.

### Sidenotes, margin notes and figures in blog posts

Blog posts get a Tufte-style layout (scoped to `.blog-post` in `style.css`, site font unchanged). Notes are written as standard Markdown footnotes; `plugins/sidenotes.py` turns them into sidenotes on the article page only (the feed keeps plain footnotes):

```markdown
A claim.[^1] A remark.[^m-photo]

[^1]: Numbered sidenote, shown in the right margin on wide screens, tap-to-reveal on mobile.
[^m-photo]: Labels starting with `m-` become unnumbered margin notes.
```

Keep notes inline (text, links, emphasis, inline code); multiple paragraphs are joined with a line break. Figures:

```markdown
<figure markdown="1">
![Alt text]({static}/images/example.jpg)
<figcaption>Caption shown in the margin on wide screens.</figcaption>
</figure>

<figure class="fullwidth" markdown="1">
![Alt text]({static}/images/wide.jpg)
<figcaption>Full-width figure, up to 60rem.</figcaption>
</figure>
```

## Deployment

Pushing to `master` triggers `.github/workflows/pages.yml`, which builds the site with Pelican and publishes it via GitHub Pages' "Actions" deployment source (Settings → Pages → Source: GitHub Actions). No `gh-pages` branch, no generated HTML committed to git.
