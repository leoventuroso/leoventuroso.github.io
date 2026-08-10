AUTHOR = "Leonardo Venturoso"
SITENAME = "Leonardo Venturoso"
SITEURL = ""

PATH = "content"
TIMEZONE = "Europe/Rome"
DEFAULT_LANG = "en"

THEME = "theme/minimal"

ARTICLE_PATHS = ["articles"]
ARTICLE_URL = "blog/{slug}/"
ARTICLE_SAVE_AS = "blog/{slug}/index.html"

PAGE_PATHS = ["pages"]
PAGE_URL = "{slug}/"
PAGE_SAVE_AS = "{slug}/index.html"

STATIC_PATHS = [
    "images",
    "pdf",
    "videos",
    "extra/robots.txt",
    "extra/googleb0025066b98a7632.html",
]
EXTRA_PATH_METADATA = {
    "extra/robots.txt": {"path": "robots.txt"},
    "extra/googleb0025066b98a7632.html": {"path": "googleb0025066b98a7632.html"},
}

DIRECT_TEMPLATES = ["index", "archives"]

INDEX_SAVE_AS = "index.html"
ARCHIVES_URL = "blog/"
ARCHIVES_SAVE_AS = "blog/index.html"

# No per-author/category/tag pages in this minimal design — everything
# lives on the single chronological /blog/ listing.
AUTHOR_SAVE_AS = ""
CATEGORY_SAVE_AS = ""
TAG_SAVE_AS = ""

DEFAULT_PAGINATION = False

# Rebuild output/ from scratch every time, otherwise renamed/deleted source
# files leave stale copies behind that the dev server keeps serving.
DELETE_OUTPUT_DIRECTORY = True

# publications.py / talks.py plugins read these files and inject
# `publications_by_year` / `talks` into the template context of every page.
PUBLICATIONS_DATA = "content/data/publications.yaml"
TALKS_DATA = "content/data/talks.yaml"

PLUGIN_PATHS = ["plugins"]
PLUGINS = ["publications", "talks", "pelican.plugins.sitemap"]

SITEMAP = {
    "format": "xml",
    "priorities": {
        "articles": 0.6,
        "indexes": 0.6,
        "pages": 0.5,
    },
    "changefreqs": {
        "articles": "monthly",
        "indexes": "daily",
        "pages": "monthly",
    },
}

MENUITEMS = [
    ("home", "/"),
    ("about", "/about/"),
    ("publications", "/publications/"),
    ("cv", "/pdf/LeonardoVenturoso_CV.pdf"),
    ("talks", "/talks/"),
    ("blog", "/blog/"),
    ("newsletter", "https://substack.com/@leonardoventuroso"),
]

RECENT_ARTICLES_COUNT = 6

# The homepage bio is authored as a hidden page (content/pages/home-intro.md)
# rather than a plain-text setting, so it can use Markdown links and a
# {static} image reference. index.html looks it up by slug.
HOME_INTRO_SLUG = "home-intro"

# Decorative looping video banner shown at the top of every page, mirroring
# duarteocarmo.com's azulejo-banner (his is a JS-generated canvas pattern;
# this is a real muted/looping video instead).
BANNER_VIDEO = "videos/gif_cowboybebop.gif.mp4"


def _obfuscate_mailto(address):
    """Lightly obfuscate a mailto address as HTML numeric entities so
    plain-text scrapers don't pick it up, mirroring the old site's
    approach. Rendered with the `safe` filter in the template."""
    return "mailto:" + "".join(f"&#{ord(c)};" for c in address)


SOCIAL = [
    ("email", _obfuscate_mailto("leo.venturoso@gmail.com")),
    ("github", "https://github.com/leoventuroso"),
    ("linkedin", "https://www.linkedin.com/in/leonardo-venturoso"),
    ("scholar", "https://scholar.google.com/citations?user=QR6Q6eIAAAAJ&hl=it&oi=ao"),
]

# Kept off in dev for faster rebuilds; publishconf.py turns these on.
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

RELATIVE_URLS = True
