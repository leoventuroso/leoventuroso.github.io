import sys
import os

sys.path.append(os.curdir)
from pelicanconf import *  # noqa

SITEURL = "https://leoventuroso.github.io"
RELATIVE_URLS = False

FEED_ALL_ATOM = "feed.xml"
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None

DELETE_OUTPUT_DIRECTORY = True

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
