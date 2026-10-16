#!/usr/bin/env python3
"""Build /de, /fr and /es pages from the English site and wire language switchers."""

from __future__ import annotations

import json
import re
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://www.27n.pt"

# (pt_url, en_url, de_url, fr_url, es_url, en_file, pt_file)
# en_file / pt_file are repo-relative paths to index.html
GROUPS = [
    ("/pt/", "/en/", "/de/", "/fr/", "/es/", "en/index.html", "pt/index.html"),
    ("/pt/shopify-partner-portugal/", "/en/shopify-partner-portugal/", "/de/shopify-partner-portugal/", "/fr/shopify-partner-portugal/", "/es/shopify-partner-portugal/", "en/shopify-partner-portugal/index.html", "pt/shopify-partner-portugal/index.html"),
    ("/pt/agencia-shopify/", "/shopify-agency/", "/de/shopify-agentur/", "/fr/agence-shopify/", "/es/agencia-shopify/", "shopify-agency/index.html", "pt/agencia-shopify/index.html"),
    ("/pt/agencia-shopify-lisboa/", "/en/shopify-agency-lisbon/", "/de/shopify-agentur-lissabon/", "/fr/agence-shopify-lisbonne/", "/es/agencia-shopify-lisboa/", "en/shopify-agency-lisbon/index.html", "pt/agencia-shopify-lisboa/index.html"),
    ("/pt/agencia-shopify-porto/", "/en/shopify-agency-porto/", "/de/shopify-agentur-porto/", "/fr/agence-shopify-porto/", "/es/agencia-shopify-oporto/", "en/shopify-agency-porto/index.html", "pt/agencia-shopify-porto/index.html"),
    ("/pt/migracao-shopify/", "/shopify-migration/", "/de/shopify-migration/", "/fr/migration-shopify/", "/es/migracion-shopify/", "shopify-migration/index.html", "pt/migracao-shopify/index.html"),
    ("/pt/migracao-shopify/woocommerce/", "/shopify-migration/woocommerce/", "/de/shopify-migration/woocommerce/", "/fr/migration-shopify/woocommerce/", "/es/migracion-shopify/woocommerce/", "shopify-migration/woocommerce/index.html", "pt/migracao-shopify/woocommerce/index.html"),
    ("/pt/migracao-shopify/magento/", "/shopify-migration/magento/", "/de/shopify-migration/magento/", "/fr/migration-shopify/magento/", "/es/migracion-shopify/magento/", "shopify-migration/magento/index.html", "pt/migracao-shopify/magento/index.html"),
    ("/pt/migracao-shopify/prestashop/", "/shopify-migration/prestashop/", "/de/shopify-migration/prestashop/", "/fr/migration-shopify/prestashop/", "/es/migracion-shopify/prestashop/", "shopify-migration/prestashop/index.html", "pt/migracao-shopify/prestashop/index.html"),
    ("/pt/shopify-plus/", "/shopify-plus/", "/de/shopify-plus/", "/fr/shopify-plus/", "/es/shopify-plus/", "shopify-plus/index.html", "pt/shopify-plus/index.html"),
    ("/pt/hydrogen-shopify/", "/en/shopify-hydrogen/", "/de/shopify-hydrogen/", "/fr/shopify-hydrogen/", "/es/shopify-hydrogen/", "en/shopify-hydrogen/index.html", "pt/hydrogen-shopify/index.html"),
    ("/pt/suporte-shopify/", "/en/shopify-support/", "/de/shopify-support/", "/fr/support-shopify/", "/es/soporte-shopify/", "en/shopify-support/index.html", "pt/suporte-shopify/index.html"),
    ("/pt/quanto-custa-loja-shopify/", "/shopify-cost/", "/de/shopify-kosten/", "/fr/cout-boutique-shopify/", "/es/coste-tienda-shopify/", "shopify-cost/index.html", "pt/quanto-custa-loja-shopify/index.html"),
    ("/pt/shopify-vs-woocommerce/", "/shopify-vs-woocommerce/", "/de/shopify-vs-woocommerce/", "/fr/shopify-vs-woocommerce/", "/es/shopify-vs-woocommerce/", "shopify-vs-woocommerce/index.html", "pt/shopify-vs-woocommerce/index.html"),
    ("/pt/trabalhos/", "/en/work/", "/de/arbeiten/", "/fr/realisations/", "/es/trabajos/", "en/work/index.html", "pt/trabalhos/index.html"),
    ("/pt/trabalhos/dime-beauty/", "/en/work/dime-beauty/", "/de/arbeiten/dime-beauty/", "/fr/realisations/dime-beauty/", "/es/trabajos/dime-beauty/", "en/work/dime-beauty/index.html", "pt/trabalhos/dime-beauty/index.html"),
    ("/pt/trabalhos/skout-organic/", "/en/work/skout-organic/", "/de/arbeiten/skout-organic/", "/fr/realisations/skout-organic/", "/es/trabajos/skout-organic/", "en/work/skout-organic/index.html", "pt/trabalhos/skout-organic/index.html"),
    ("/pt/trabalhos/cubby-beds/", "/en/work/cubby-beds/", "/de/arbeiten/cubby-beds/", "/fr/realisations/cubby-beds/", "/es/trabajos/cubby-beds/", "en/work/cubby-beds/index.html", "pt/trabalhos/cubby-beds/index.html"),
    ("/pt/trabalhos/titan-casket/", "/en/work/titan-casket/", "/de/arbeiten/titan-casket/", "/fr/realisations/titan-casket/", "/es/trabajos/titan-casket/", "en/work/titan-casket/index.html", "pt/trabalhos/titan-casket/index.html"),
    ("/pt/recursos/", "/en/resources/", "/de/ressourcen/", "/fr/ressources/", "/es/recursos/", "en/resources/index.html", "pt/recursos/index.html"),
    ("/pt/recursos/escolher-shopify-partner-portugal/", "/en/resources/choose-shopify-partner-portugal/", "/de/ressourcen/shopify-partner-portugal-waehlen/", "/fr/ressources/choisir-shopify-partner-portugal/", "/es/recursos/elegir-shopify-partner-portugal/", "en/resources/choose-shopify-partner-portugal/index.html", "pt/recursos/escolher-shopify-partner-portugal/index.html"),
    ("/pt/recursos/migrar-para-shopify-sem-perder-seo/", "/en/resources/migrate-to-shopify-without-losing-seo/", "/de/ressourcen/zu-shopify-migrieren-ohne-seo-zu-verlieren/", "/fr/ressources/migrer-vers-shopify-sans-perdre-le-seo/", "/es/recursos/migrar-a-shopify-sin-perder-seo/", "en/resources/migrate-to-shopify-without-losing-seo/index.html", "pt/recursos/migrar-para-shopify-sem-perder-seo/index.html"),
    ("/pt/recursos/shopify-plus-quando-faz-sentido/", "/en/resources/shopify-plus-when-it-makes-sense/", "/de/ressourcen/shopify-plus-wann-es-sinn-ergibt/", "/fr/ressources/shopify-plus-quand-cela-a-du-sens/", "/es/recursos/shopify-plus-cuando-tiene-sentido/", "en/resources/shopify-plus-when-it-makes-sense/index.html", "pt/recursos/shopify-plus-quando-faz-sentido/index.html"),
    ("/pt/recursos/shopify-vs-woocommerce-portugal/", "/en/resources/shopify-vs-woocommerce-portugal/", "/de/ressourcen/shopify-vs-woocommerce-portugal/", "/fr/ressources/shopify-vs-woocommerce-portugal/", "/es/recursos/shopify-vs-woocommerce-portugal/", "en/resources/shopify-vs-woocommerce-portugal/index.html", "pt/recursos/shopify-vs-woocommerce-portugal/index.html"),
    ("/pt/recursos/hydrogen-ou-online-store/", "/en/resources/hydrogen-or-online-store/", "/de/ressourcen/hydrogen-oder-online-store/", "/fr/ressources/hydrogen-ou-online-store/", "/es/recursos/hydrogen-u-online-store/", "en/resources/hydrogen-or-online-store/index.html", "pt/recursos/hydrogen-ou-online-store/index.html"),
    ("/pt/perguntas-frequentes/", "/en/faq/", "/de/faq/", "/fr/faq/", "/es/preguntas-frecuentes/", "en/faq/index.html", "pt/perguntas-frequentes/index.html"),
    ("/pt/processo/", "/en/process/", "/de/prozess/", "/fr/processus/", "/es/proceso/", "en/process/index.html", "pt/processo/index.html"),
    ("/pt/equipa/", "/team/", "/de/team/", "/fr/equipe/", "/es/equipo/", "team/index.html", "pt/equipa/index.html"),
    ("/pt/contact/", "/contact/", "/de/kontakt/", "/fr/contact/", "/es/contacto/", "contact/index.html", "pt/contact/index.html"),
    ("/pt/privacy/", "/privacy/", "/de/datenschutz/", "/fr/confidentialite/", "/es/privacidad/", "privacy/index.html", "pt/privacy/index.html"),
    ("/pt/careers/", "/careers/", "/de/karriere/", "/fr/carrieres/", "/es/empleo/", "careers/index.html", "pt/careers/index.html"),
    ("/pt/careers/candidatura-espontanea/", "/careers/candidatura-espontanea/", "/de/karriere/initiativbewerbung/", "/fr/carrieres/candidature-spontanee/", "/es/empleo/candidatura-espontanea/", "careers/candidatura-espontanea/index.html", "pt/careers/candidatura-espontanea/index.html"),
]

LANGS = ("de", "fr", "es")
HTML_LANG = {"de": "de", "fr": "fr", "es": "es"}
OG_LOCALE = {"en": "en_GB", "pt": "pt_PT", "de": "de_DE", "fr": "fr_FR", "es": "es_ES"}
ARIA = {"en": "Language", "pt": "Idioma", "de": "Sprache", "fr": "Langue", "es": "Idioma"}
SKIP_TAGS = {"script", "style"}
ATTRS = {"alt", "title", "aria-label", "placeholder", "content"}

# Longest paths first so /shopify-migration/woocommerce/ wins over /shopify-migration/
EN_TO = {}
for pt, en, de, fr, es, *_ in GROUPS:
    EN_TO[en] = {"pt": pt, "en": en, "de": de, "fr": fr, "es": es}
EN_PATHS = sorted(EN_TO, key=len, reverse=True)


def load_catalog() -> dict[str, dict[str, str]]:
    catalog: dict[str, dict[str, str]] = {}
    for part in sorted((ROOT / "i18n").glob("part-*.jsonl")):
        for line in part.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            catalog[row["en"]] = row
    return catalog


def norm(text: str) -> str:
    return " ".join(text.split())


def translate_text(text: str, lang: str, catalog: dict) -> str:
    key = norm(text)
    row = catalog.get(key)
    if not row:
        return text
    leading = text[: len(text) - len(text.lstrip())]
    trailing = text[len(text.rstrip()) :]
    return leading + row[lang] + trailing


def rewrite_url(url: str, lang: str) -> str:
    if not url or url.startswith(("#", "mailto:", "tel:", "javascript:")):
        return url
    absolute = url.startswith(SITE)
    path = url[len(SITE) :] if absolute else url
    hash_ = ""
    if "#" in path:
        path, hash_ = path.split("#", 1)
        hash_ = "#" + hash_
    if path.endswith("index.html"):
        path = path[: -len("index.html")]
    if path == "":
        path = "/"
    if not path.startswith("/"):
        return url
    if path not in ("/",) and not path.endswith("/") and "." not in path.rsplit("/", 1)[-1]:
        path += "/"
    if path in ("/", "/en", "/en/"):
        out = EN_TO["/en/"][lang] + hash_
        return (SITE + out) if absolute else out
    for src in EN_PATHS:
        if path == src or (src != "/" and path.startswith(src)):
            dest = EN_TO[src][lang] + path[len(src) :]
            out = dest + hash_
            return (SITE + out) if absolute else out
    return url


def apply_translations(soup: BeautifulSoup, lang: str, catalog: dict) -> None:
    for el in soup.find_all(True):
        if el.name in SKIP_TAGS:
            continue
        for attr in list(el.attrs):
            if attr not in ATTRS:
                continue
            val = el.get(attr)
            if not isinstance(val, str):
                continue
            # meta robots / viewport stay
            if el.name == "meta" and el.get("name") in {"robots", "viewport", "theme-color", "geo.region"}:
                continue
            key = norm(val)
            if key in catalog:
                el[attr] = catalog[key][lang]
        if el.name == "a":
            href = el.get("href")
            if isinstance(href, str):
                el["href"] = rewrite_url(href, lang)
    for node in list(soup.find_all(string=True)):
        parent = node.parent
        if parent is None or parent.name in SKIP_TAGS:
            continue
        if not isinstance(node, NavigableString):
            continue
        if not norm(str(node)):
            continue
        new = translate_text(str(node), lang, catalog)
        if new != str(node):
            node.replace_with(new)
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string or ""
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        script.string = json.dumps(translate_json(data, lang, catalog), ensure_ascii=False, indent=2)


def translate_json(data, lang, catalog):
    if isinstance(data, dict):
        out = {}
        for k, v in data.items():
            if k == "inLanguage" and v in ("en", "pt-PT"):
                out[k] = HTML_LANG[lang]
            elif k == "availableLanguage" and isinstance(v, list):
                out[k] = ["Portuguese", "English", "German", "French", "Spanish"]
            elif k == "inLanguage" and isinstance(v, list):
                out[k] = ["pt-PT", "en", "de", "fr", "es"]
            else:
                out[k] = translate_json(v, lang, catalog)
        return out
    if isinstance(data, list):
        return [translate_json(v, lang, catalog) for v in data]
    if isinstance(data, str):
        key = norm(data)
        if key in catalog:
            return catalog[key][lang]
        if data.startswith(SITE) or data.startswith("/"):
            return rewrite_url(data, lang)
        return data
    return data


def urls_for(group) -> dict[str, str]:
    pt, en, de, fr, es, *_ = group
    return {"pt": pt, "en": en, "de": de, "fr": fr, "es": es}


def lang_inner(active: str, urls: dict[str, str]) -> str:
    bits = []
    for code, label, hl in (
        ("en", "EN", "en"),
        ("pt", "PT", "pt-PT"),
        ("de", "DE", "de"),
        ("fr", "FR", "fr"),
        ("es", "ES", "es"),
    ):
        current = ' class="is-active" aria-current="true"' if code == active else ""
        bits.append(f'<a href="{urls[code]}"{current} hreflang="{hl}">{label}</a>')
    return "\n        ".join(bits)


def patch_switchers(html: str, active: str, urls: dict[str, str]) -> str:
    aria = ARIA[active]

    def repl(match: re.Match) -> str:
        classes = match.group(1)
        return (
            f'<div class="{classes}" role="group" aria-label="{aria}">\n        '
            + lang_inner(active, urls)
            + "\n      </div>"
        )

    return re.sub(
        r'<div class="(lang[^"]*)" role="group" aria-label="[^"]*">.*?</div>',
        repl,
        html,
        flags=re.S,
    )


def hreflang_block(urls: dict[str, str]) -> str:
    lines = []
    for code, hl in (("pt", "pt-PT"), ("en", "en"), ("de", "de"), ("fr", "fr"), ("es", "es")):
        lines.append(f'  <link rel="alternate" hreflang="{hl}" href="{SITE}{urls[code]}" />')
    lines.append(f'  <link rel="alternate" hreflang="x-default" href="{SITE}{urls["pt"]}" />')
    return "\n".join(lines)


def patch_head(html: str, active: str, urls: dict[str, str]) -> str:
    block = hreflang_block(urls)
    html2, n = re.subn(
        r'(?:  <link rel="alternate" hreflang="[^"]+" href="[^"]+" />\n)+',
        block + "\n",
        html,
        count=1,
    )
    if n == 0:
        html2 = html.replace(
            f'<link rel="canonical" href="{SITE}{urls[active]}" />',
            f'<link rel="canonical" href="{SITE}{urls[active]}" />\n{block}',
            1,
        )
    # og locale alternates
    locales = [OG_LOCALE[c] for c in ("pt", "en", "de", "fr", "es") if c != active]
    alt_tags = "\n".join(
        f'  <meta property="og:locale:alternate" content="{loc}" />' for loc in locales
    )
    html2 = re.sub(
        r'  <meta property="og:locale" content="[^"]+" />\n(?:  <meta property="og:locale:alternate" content="[^"]+" />\n)*',
        f'  <meta property="og:locale" content="{OG_LOCALE[active]}" />\n{alt_tags}\n',
        html2,
        count=1,
    )
    return html2


def set_canonical(html: str, url: str) -> str:
    html = re.sub(
        r'<link rel="canonical" href="[^"]+" />',
        f'<link rel="canonical" href="{SITE}{url}" />',
        html,
        count=1,
    )
    html = re.sub(
        r'<meta property="og:url" content="[^"]+" />',
        f'<meta property="og:url" content="{SITE}{url}" />',
        html,
        count=1,
    )
    return html


def finalize_soup(soup: BeautifulSoup, lang: str, urls: dict[str, str]) -> None:
    canon = SITE + urls[lang]
    link = soup.find("link", rel="canonical")
    if link:
        link["href"] = canon
    ogurl = soup.find("meta", attrs={"property": "og:url"})
    if ogurl:
        ogurl["content"] = canon
    for alt in soup.find_all("link", rel="alternate"):
        alt.decompose()
    ref = link
    if ref is not None:
        for code, hl in (("pt", "pt-PT"), ("en", "en"), ("de", "de"), ("fr", "fr"), ("es", "es")):
            tag = soup.new_tag("link", rel="alternate", hreflang=hl, href=SITE + urls[code])
            ref.insert_after(tag)
            ref = tag
        xref = soup.new_tag("link", rel="alternate", hreflang="x-default", href=SITE + urls["pt"])
        ref.insert_after(xref)
    ogl = soup.find("meta", attrs={"property": "og:locale"})
    if ogl:
        ogl["content"] = OG_LOCALE[lang]
        for alt in soup.find_all("meta", attrs={"property": "og:locale:alternate"}):
            alt.decompose()
        ref = ogl
        for code in ("pt", "en", "de", "fr", "es"):
            if code == lang:
                continue
            tag = soup.new_tag("meta")
            tag["property"] = "og:locale:alternate"
            tag["content"] = OG_LOCALE[code]
            ref.insert_after(tag)
            ref = tag
    labels = (("en", "EN", "en"), ("pt", "PT", "pt-PT"), ("de", "DE", "de"), ("fr", "FR", "fr"), ("es", "ES", "es"))
    for div in soup.select("div.lang"):
        div["aria-label"] = ARIA[lang]
        div.clear()
        for code, label, hl in labels:
            a = soup.new_tag("a", href=urls[code], hreflang=hl)
            if code == lang:
                a["class"] = ["is-active"]
                a["aria-current"] = "true"
            a.string = label
            div.append("\n        ")
            div.append(a)
        div.append("\n      ")


def build_locale_page(group, lang: str, catalog: dict) -> None:
    _pt, _en, _de, _fr, _es, en_file, _pt_file = group
    urls = urls_for(group)
    src = (ROOT / en_file).read_text(encoding="utf-8")
    soup = BeautifulSoup(src, "html.parser")
    if soup.html:
        soup.html["lang"] = HTML_LANG[lang]
    apply_translations(soup, lang, catalog)
    finalize_soup(soup, lang, urls)
    html = str(soup)
    if not html.startswith("<!DOCTYPE"):
        html = "<!DOCTYPE html>\n" + html
    dest_url = urls[lang]
    dest = ROOT / dest_url.strip("/") / "index.html"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(html, encoding="utf-8")


def patch_existing(group) -> None:
    urls = urls_for(group)
    for active, filename in (("en", group[5]), ("pt", group[6])):
        path = ROOT / filename
        html = path.read_text(encoding="utf-8")
        html = patch_head(html, active, urls)
        html = patch_switchers(html, active, urls)
        # expand availableLanguage if present
        html = html.replace(
            '"availableLanguage": ["Portuguese", "English"]',
            '"availableLanguage": ["Portuguese", "English", "German", "French", "Spanish"]',
        )
        html = html.replace(
            '"inLanguage": ["en", "pt-PT"]',
            '"inLanguage": ["pt-PT", "en", "de", "fr", "es"]',
        )
        html = html.replace(
            '"inLanguage": ["pt-PT", "en"]',
            '"inLanguage": ["pt-PT", "en", "de", "fr", "es"]',
        )
        path.write_text(html, encoding="utf-8")


def extra_sitemap_urls() -> list[str]:
    pairs = [
        ("/de/shopify-partner-deutschland/", "/en/shopify-partner-germany/", "de", "0.95", "0.85"),
        ("/fr/shopify-partner-france/", "/en/shopify-partner-france/", "fr", "0.95", "0.85"),
    ]
    block = []
    for local, en, hl, local_priority, en_priority in pairs:
        for loc, priority in ((local, local_priority), (en, en_priority)):
            block.append("  <url>")
            block.append(f"    <loc>{SITE}{loc}</loc>")
            block.append(f'    <xhtml:link rel="alternate" hreflang="{hl}" href="{SITE}{local}"/>')
            block.append(f'    <xhtml:link rel="alternate" hreflang="en" href="{SITE}{en}"/>')
            block.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{en}"/>')
            block.append("    <lastmod>2026-10-16</lastmod>")
            block.append("    <changefreq>weekly</changefreq>")
            block.append(f"    <priority>{priority}</priority>")
            block.append("  </url>")
    return block


def build_sitemap() -> None:
    # Keep priorities simple: pt 1.0 home else 0.8, others slightly lower
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]
    for group in GROUPS:
        urls = urls_for(group)
        for code in ("pt", "en", "de", "fr", "es"):
            loc = SITE + urls[code]
            priority = "1.0" if code == "pt" and urls[code] == "/pt/" else ("0.9" if code == "pt" else "0.8")
            lines.append("  <url>")
            lines.append(f"    <loc>{loc}</loc>")
            for c, hl in (("pt", "pt-PT"), ("en", "en"), ("de", "de"), ("fr", "fr"), ("es", "es")):
                lines.append(
                    f'    <xhtml:link rel="alternate" hreflang="{hl}" href="{SITE}{urls[c]}"/>'
                )
            lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{urls["pt"]}"/>')
            lines.append("    <lastmod>2026-10-16</lastmod>")
            lines.append("    <changefreq>weekly</changefreq>")
            lines.append(f"    <priority>{priority}</priority>")
            lines.append("  </url>")
    lines.extend(extra_sitemap_urls())
    lines.append("</urlset>")
    lines.append("")
    (ROOT / "sitemap.xml").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    catalog = load_catalog()
    missing = []
    # quick coverage check against extracted keys is done by caller
    for group in GROUPS:
        for lang in LANGS:
            build_locale_page(group, lang, catalog)
        patch_existing(group)
    build_sitemap()
    print(f"catalog {len(catalog)} groups {len(GROUPS)} pages {len(GROUPS)*3}")


if __name__ == "__main__":
    main()
