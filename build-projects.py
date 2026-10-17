#!/usr/bin/env python3
"""Generates one static page per project (project-<slug>.html), plus sitemap.xml
and robots.txt, from the PROJECTS data that lives in project.html.

Why: project.html builds its content in the browser, so a link shared on
LinkedIn or crawled by a search engine saw the title "Project" and no image.
Each generated page carries its own title, description and share image in the
HTML itself, and still renders through the same script.

Run it again after adding or editing a project:   python3 build-projects.py
Needs no packages. Change SITE_URL if the domain changes."""
import io, json, re, datetime

SITE_URL = "https://bernardoblom.com"
TEMPLATE = "project.html"

src = io.open(TEMPLATE, encoding="utf-8").read()
data = src[src.index("const PROJECTS = ["):src.index("const id ")]

projects = []
for m in re.finditer(r'\n      \{\n        slug: ("[^"]+"),\n        title: ("[^"]+"),\n        year: ("[^"]+"), cat: ("[^"]+"),\n        desc: ("(?:[^"\\]|\\.)*")', data):
    projects.append({k: json.loads(v) for k, v in
                     zip(("slug", "title", "year", "cat", "desc"), m.groups())})
assert projects, "no projects parsed: has the PROJECTS layout in project.html changed?"

def esc(t):
    return (t.replace("&", "&amp;").replace('"', "&quot;")
             .replace("<", "&lt;").replace(">", "&gt;"))

def short(text, limit=158):
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0].rstrip(",;:-")
    return cut + "."

seo_re = re.compile(r"  <!-- seo:start -->.*?<!-- seo:end -->", re.S)
for p in projects:
    url = f"{SITE_URL}/project-{p['slug']}.html"
    img = f"{SITE_URL}/assets/og/{p['slug']}.jpg"
    desc = short(p["desc"])
    head = f"""  <!-- seo:start -->
  <title>{esc(p['title'])} &middot; Bernardo Blom</title>
  <meta name="description" content="{esc(desc)}" />
  <link rel="canonical" href="{url}" />
  <link rel="icon" href="favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="apple-touch-icon.png" />
  <meta name="theme-color" content="#000000" />
  <meta name="color-scheme" content="dark" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Bernardo Blom" />
  <meta property="og:title" content="{esc(p['title'])}: {esc(p['cat'])}" />
  <meta property="og:description" content="{esc(desc)}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:image" content="{img}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <!-- seo:end -->"""
    page = seo_re.sub(lambda _: head, src, count=1)

    # content a crawler can read without running the script; the script
    # replaces it with the full page, so nothing is shown twice
    fallback = (f'<main class="page" id="page">\n    <div class="project-header">\n'
                f'      <h1 class="project-title">{esc(p["title"])}</h1>\n'
                f'      <p class="project-desc">{esc(p["desc"])}</p>\n    </div>\n  </main>')
    page = page.replace('<main class="page" id="page"></main>', fallback, 1)
    page = page.replace('\n  <script>\n    function ep(raw)',
                        f'\n  <script>window.__PROJECT_ID = {json.dumps(p["slug"])};</script>\n  <script>\n    function ep(raw)', 1)
    assert "__PROJECT_ID" in page and 'og:image' in page and 'noindex' not in page
    io.open(f"project-{p['slug']}.html", "w", encoding="utf-8").write(page)

today = datetime.date.today().isoformat()
urls = [f"{SITE_URL}/"] + [f"{SITE_URL}/project-{p['slug']}.html" for p in projects]
io.open("sitemap.xml", "w", encoding="utf-8").write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>\n" for u in urls)
    + "</urlset>\n")
io.open("robots.txt", "w", encoding="utf-8").write(
    "User-agent: *\nDisallow: /assets/presentations/\nDisallow: /decks.html\nDisallow: /deck.html\nDisallow: /project.html\n\n"
    f"Sitemap: {SITE_URL}/sitemap.xml\n")
print(f"{len(projects)} project pages, sitemap.xml and robots.txt written")
