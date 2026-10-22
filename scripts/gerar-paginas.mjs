// Gera, a partir das páginas em português (fonte) e do js/i18n.js:
//  - as versões em inglês e espanhol (en.html, es.html, en/*.html, es/*.html) com o texto já gravado no HTML,
//  - o bloco de SEO de cada página (title, description, canonical, hreflang, Open Graph, JSON-LD),
//  - robots.txt, sitemap.xml, llms.txt e vercel.json.
// Rode `node scripts/gerar-paginas.mjs` depois de mudar texto no HTML ou no js/i18n.js. É idempotente.
// Endereço-base: variável SITE_URL (padrão https://www.evaholdingroup.com.br).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = (process.env.SITE_URL || "https://www.evaholdingroup.com.br").replace(/\/$/, "");
const LANGS = ["pt", "en", "es"];
const HTML_LANG = { pt: "pt-BR", en: "en", es: "es" };
const OG_LOCALE = { pt: "pt_BR", en: "en_US", es: "es_ES" };
const OG_IMAGE = SITE + "/assets/og-eva-holding.jpg";
const MARCA = "Eva Holding";
const EMAIL = "evaholdingroup@gmail.com";
const FONE = "+55 21 96915-6116";

const PAGINAS = [
  { slug: "index", prioridade: "1.0",
    desc: { pt: "Eva Holding é um grupo de tecnologia que constrói produtos digitais, agentes de IA, infraestrutura e automações para empresas que querem escalar.",
            en: "Eva Holding is a technology group that builds digital products, AI agents, infrastructure and automation for companies that want to scale.",
            es: "Eva Holding es un grupo de tecnología que construye productos digitales, agentes de IA, infraestructura y automatizaciones para empresas que quieren escalar." } },
  { slug: "quem-somos", prioridade: "0.7",
    desc: { pt: "A Eva Holding é uma holding de tecnologia que reúne engenharia de software, IA e infraestrutura em um só time.",
            en: "Eva Holding is a technology holding that brings software engineering, AI and infrastructure together in a single team.",
            es: "Eva Holding es una holding de tecnología que reúne ingeniería de software, IA e infraestructura en un solo equipo." } },
  { slug: "equipe", prioridade: "0.6",
    desc: { pt: "Conheça quem está por trás da Eva Holding: o fundador e o time de engenharia de software, automação e IA.",
            en: "Meet the people behind Eva Holding: the founder and the software engineering, automation and AI team.",
            es: "Conoce a quienes están detrás de Eva Holding: el fundador y el equipo de ingeniería de software, automatización e IA." } },
  { slug: "contato", prioridade: "0.7",
    desc: { pt: "Fale com a Eva Holding sobre sites, agentes de IA, infraestrutura ou automações para o seu negócio.",
            en: "Talk to Eva Holding about websites, AI agents, infrastructure or automation for your business.",
            es: "Habla con Eva Holding sobre sitios web, agentes de IA, infraestructura o automatizaciones para tu negocio." } },
  { slug: "faq", prioridade: "0.7", faq: true,
    desc: { pt: "Tire suas dúvidas sobre como a Eva Holding trabalha com sites, agentes de IA, infraestrutura e automações.",
            en: "Get your questions answered about how Eva Holding works with websites, AI agents, infrastructure and automation.",
            es: "Resuelve tus dudas sobre cómo trabaja Eva Holding con sitios web, agentes de IA, infraestructura y automatizaciones." } },
  { slug: "solucoes-web", prioridade: "0.9", servico: true, faq: true,
    desc: { pt: "Sites, plataformas e painéis sob medida, incluídos em cada projeto da Eva Holding, com design próprio, SEO técnico e integrações.",
            en: "Custom websites, platforms and dashboards, included in every Eva Holding project, with original design, technical SEO and integrations.",
            es: "Sitios, plataformas y paneles a medida, incluidos en cada proyecto de Eva Holding, con diseño propio, SEO técnico e integraciones." } },
  { slug: "solucoes-ia", prioridade: "0.9", servico: true, faq: true,
    desc: { pt: "Agentes de IA que atendem, vendem, qualificam e decidem, treinados para operar dentro do fluxo real do seu negócio, 24/7.",
            en: "AI agents that answer, sell, qualify and decide, trained to operate inside your business's real flow, 24/7.",
            es: "Agentes de IA que atienden, venden, califican y deciden, entrenados para operar dentro del flujo real de tu negocio, 24/7." } },
  { slug: "solucoes-infraestrutura", prioridade: "0.9", servico: true, faq: true,
    desc: { pt: "Arquitetura de servidores, dados e integrações desenhada para escalar sem quebrar, segura, observável e sob controle.",
            en: "Server, data and integration architecture designed to scale without breaking: secure, observable and under control.",
            es: "Arquitectura de servidores, datos e integraciones pensada para escalar sin romperse: segura, observable y bajo control." } },
  { slug: "solucoes-automacao", prioridade: "0.9", servico: true, faq: true,
    desc: { pt: "Processos manuais viram fluxos automáticos entre sistemas, times e clientes, menos operação, mais resultado.",
            en: "Manual processes become automatic flows between systems, teams and customers: less operation, more results.",
            es: "Los procesos manuales se vuelven flujos automáticos entre sistemas, equipos y clientes: menos operación, más resultados." } }
];
const SLUGS = new Set(PAGINAS.map((p) => p.slug));

// ---- i18n.js: dicionários en/es e títulos (executa o arquivo com um "navegador" de mentira) ----
function carregaI18n() {
  const src = fs.readFileSync(path.join(RAIZ, "js/i18n.js"), "utf8");
  const win = {};
  const noop = () => {};
  const doc = { addEventListener: noop, getElementById: () => null, querySelectorAll: () => [], documentElement: { lang: "pt-BR", getAttribute: () => null } };
  new Function("window", "document", "localStorage", "location", src)(win, doc, { getItem: () => null, setItem: noop }, { pathname: "/", hash: "" });
  if (!win.EvaI18n || !win.EvaI18n.DICT || !win.EvaI18n.TITLES) throw new Error("i18n.js nao expõe DICT e TITLES");
  return win.EvaI18n;
}
const I18N = carregaI18n();

// ---- utilidades de HTML ----
const norm = (t) => t.replace(/\r\n/g, "\n");
const escAttr = (s) => s.replace(/&(?!amp;|lt;|gt;|quot;|#)/g, "&amp;").replace(/"/g, "&quot;");
const semTags = (h) => h.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"').replace(/&middot;/g, "·").replace(/&mdash;/g, "-").replace(/\s+/g, " ").trim();
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

// acha o fim do elemento que abre em `iniFim` (posição logo depois do ">" da abertura), contando aninhamento
function fimDoElemento(h, tag, iniFim) {
  const re = new RegExp("<(/?)" + tag + "\\b[^>]*>", "gi");
  re.lastIndex = iniFim;
  let prof = 1, m;
  while ((m = re.exec(h))) {
    if (m[1]) { prof--; if (prof === 0) return { ini: m.index, fim: m.index + m[0].length }; }
    else if (!m[0].endsWith("/>")) prof++;
  }
  throw new Error("elemento <" + tag + "> sem fechamento");
}

function traduz(h, dict, faltas) {
  let out = "", pos = 0;
  const re = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?\sdata-i18n="([^"]+)"[^>]*>/g;
  let m;
  while ((m = re.exec(h))) {
    const tag = m[1].toLowerCase();
    if (VOID.has(tag)) continue;
    const abre = m.index + m[0].length;
    const f = fimDoElemento(h, tag, abre);
    const texto = dict[m[2]];
    if (texto === undefined) { faltas.add(m[2]); re.lastIndex = abre; continue; }
    out += h.slice(pos, abre) + texto;
    pos = f.ini;
    re.lastIndex = f.ini;
  }
  out += h.slice(pos);
  // placeholders
  out = out.replace(/<[^>]*\sdata-i18n-placeholder="([^"]+)"[^>]*>/g, (tagTxt, key) => {
    const t = dict[key];
    if (t === undefined) { faltas.add(key); return tagTxt; }
    return tagTxt.replace(/\splaceholder="[^"]*"/, ' placeholder="' + escAttr(t) + '"');
  });
  return out;
}

// href/src: páginas viram endereços sem .html (com prefixo do idioma) e arquivos viram caminhos absolutos
function ajustaLinks(h, lang) {
  const prefixo = lang === "pt" ? "" : "/" + lang;
  return h.replace(/\b(href|src)="([^"]*)"/g, (tudo, attr, v) => {
    if (!v || /^(https?:|\/\/|mailto:|tel:|#|data:|javascript:)/i.test(v)) return tudo;
    const m = v.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
    let p = m[1], q = m[2] || "", hash = m[3] || "";
    p = p.replace(/^\.?\//, "").replace(/^\//, "");
    const slug = p.replace(/\.html$/, "");
    if (p === "" || slug === "index" || /^(en|es)$/.test(p)) return `${attr}="${(lang === "pt" ? "/" : prefixo) + q + hash}"`;
    if (SLUGS.has(slug) && !/[./]/.test(slug.replace(/-/g, ""))) return `${attr}="${prefixo}/${slug}${q}${hash}"`;
    return `${attr}="/${p}${q}${hash}"`;
  });
}

// ---- endereços ----
function urlPagina(slug, lang) {
  if (slug === "index") return lang === "pt" ? SITE + "/" : SITE + "/" + lang;
  return SITE + (lang === "pt" ? "" : "/" + lang) + "/" + slug;
}
function arquivoSaida(slug, lang) {
  if (lang === "pt") return slug + ".html";
  return slug === "index" ? lang + ".html" : path.join(lang, slug + ".html");
}

// ---- bloco de SEO ----
function perguntasDoHtml(h) {
  const itens = [];
  const re = /<span class="faq-q-text"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<div class="faq-a">\s*<p[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(h))) itens.push({ q: semTags(m[1]), a: semTags(m[2]) });
  return itens;
}

function blocoSeo(pg, lang, titulo, h) {
  const url = urlPagina(pg.slug, lang);
  const desc = pg.desc[lang];
  const alt = LANGS.map((l) => `<link rel="alternate" hreflang="${HTML_LANG[l]}" href="${urlPagina(pg.slug, l)}" />`).join("\n") +
    `\n<link rel="alternate" hreflang="x-default" href="${urlPagina(pg.slug, "pt")}" />`;
  const org = {
    "@type": "Organization", "@id": SITE + "/#org", name: MARCA, url: SITE + "/",
    logo: SITE + "/assets/logo-crisp.png", email: EMAIL, telephone: FONE,
    description: PAGINAS[0].desc[lang],
    founder: { "@type": "Person", name: "Matheus Paes" },
    contactPoint: { "@type": "ContactPoint", contactType: "sales", email: EMAIL, telephone: FONE, availableLanguage: ["pt", "en", "es"] }
  };
  const grafo = [org];
  if (pg.slug === "index") grafo.push({ "@type": "WebSite", "@id": SITE + "/#site", url: SITE + "/", name: MARCA, inLanguage: HTML_LANG[lang], publisher: { "@id": SITE + "/#org" } });
  grafo.push({ "@type": "WebPage", "@id": url + "#pagina", url, name: titulo.replace(/&amp;/g, "&"), description: desc, inLanguage: HTML_LANG[lang], isPartOf: { "@id": SITE + "/#site" }, about: { "@id": SITE + "/#org" } });
  if (pg.servico) grafo.push({ "@type": "Service", "@id": url + "#servico", name: titulo.split("|")[0].replace(/&amp;/g, "&").trim(), description: desc, provider: { "@id": SITE + "/#org" }, url });
  if (pg.faq) {
    const qa = perguntasDoHtml(h);
    if (qa.length) grafo.push({ "@type": "FAQPage", "@id": url + "#faq", mainEntity: qa.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })) });
  }
  const ld = JSON.stringify({ "@context": "https://schema.org", "@graph": grafo }).replace(/</g, "\\u003c");
  const outras = LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALE[l]}" />`).join("\n");
  return `<!-- seo:inicio -->
<title>${titulo}</title>
<meta name="description" content="${escAttr(desc)}" />
<link rel="canonical" href="${url}" />
${alt}
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${MARCA}" />
<meta property="og:title" content="${escAttr(titulo.replace(/&amp;/g, "&"))}" />
<meta property="og:description" content="${escAttr(desc)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${OG_IMAGE}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="${OG_LOCALE[lang]}" />
${outras}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escAttr(titulo.replace(/&amp;/g, "&"))}" />
<meta name="twitter:description" content="${escAttr(desc)}" />
<meta name="twitter:image" content="${OG_IMAGE}" />
<script type="application/ld+json">${ld}</script>
<!-- seo:fim -->`;
}

// ---- monta cada página ----
function limpaFonte(h, slug) {
  // o título em português vem do <title> atual (solto ou dentro do bloco de SEO)
  const t = h.match(/<title>([\s\S]*?)<\/title>/);
  const tituloPt = t ? t[1] : null;
  // remove bloco antigo (se houver), <title> e meta description soltos
  h = h.replace(/<!-- seo:inicio -->[\s\S]*?<!-- seo:fim -->\n?/, "");
  h = h.replace(/\s*<title>[\s\S]*?<\/title>\n?/, "\n").replace(/\s*<meta name="description"[^>]*>\n?/, "\n");
  h = h.replace(/<html([^>]*)>/, (m, a) => {
    a = a.replace(/\sdata-pagina="[^"]*"/, "").replace(/\slang="[^"]*"/, "");
    return `<html lang="pt-BR" data-pagina="${slug}"${a}>`;
  });
  return { h, tituloPt };
}

const TITULOS_PT = {};
const faltasPorPagina = {};
const saidas = [];

for (const pg of PAGINAS) {
  const arq = path.join(RAIZ, pg.slug + ".html");
  const bruto = norm(fs.readFileSync(arq, "utf8"));
  const { h: base, tituloPt } = limpaFonte(bruto, pg.slug);
  if (tituloPt) TITULOS_PT[pg.slug] = tituloPt;
  const tituloPtFinal = TITULOS_PT[pg.slug] || PAGINAS_FALLBACK(pg.slug);
  for (const lang of LANGS) {
    const faltas = new Set();
    let h = ajustaLinks(base, lang);
    if (lang !== "pt") {
      h = traduz(h, I18N.DICT[lang], faltas);
      h = h.replace(/<html lang="pt-BR"/, `<html lang="${HTML_LANG[lang]}"`);
    }
    const titulo = lang === "pt" ? tituloPtFinal : escAttr((I18N.TITLES[pg.slug] || {})[lang] || tituloPtFinal);
    const seo = blocoSeo(pg, lang, titulo, h);
    if (!/<meta name="viewport"[^>]*>/.test(h)) throw new Error("sem viewport em " + pg.slug);
    h = h.replace(/(<meta name="viewport"[^>]*>)/, "$1\n" + seo);
    saidas.push({ pg, lang, arquivo: arquivoSaida(pg.slug, lang), html: h });
    if (faltas.size) (faltasPorPagina[pg.slug + ":" + lang] = faltasPorPagina[pg.slug + ":" + lang] || []).push(...faltas);
  }
}
function PAGINAS_FALLBACK(slug) { return MARCA; }

// validação simples de balanceamento
function confere(h, nome) {
  const semScript = h.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  for (const tag of ["div", "section", "ul", "ol", "button", "a", "p", "span", "nav", "header", "footer", "main", "h1", "h2", "h3"]) {
    const ab = (semScript.match(new RegExp("<" + tag + "(\\s[^>]*)?>", "gi")) || []).filter((x) => !x.endsWith("/>")).length;
    const fe = (semScript.match(new RegExp("</" + tag + ">", "gi")) || []).length;
    if (ab !== fe) throw new Error(`tags <${tag}> desbalanceadas em ${nome}: ${ab} abrem, ${fe} fecham`);
  }
}
for (const s of saidas) {
  confere(s.html, s.arquivo);
  const f = path.join(RAIZ, s.arquivo);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, s.html);
}

// ---- robots, sitemap, llms, vercel.json ----
const hoje = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(RAIZ, "robots.txt"), `User-agent: *
Allow: /

# buscadores e assistentes de IA que citam sites nas respostas
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

let sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
for (const lang of LANGS) {
  for (const pg of PAGINAS) {
    sm += `  <url>\n    <loc>${urlPagina(pg.slug, lang)}</loc>\n    <lastmod>${hoje}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${lang === "pt" ? pg.prioridade : (parseFloat(pg.prioridade) - 0.1).toFixed(1)}</priority>\n`;
    for (const l of LANGS) sm += `    <xhtml:link rel="alternate" hreflang="${HTML_LANG[l]}" href="${urlPagina(pg.slug, l)}"/>\n`;
    sm += `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlPagina(pg.slug, "pt")}"/>\n  </url>\n`;
  }
}
sm += "</urlset>\n";
fs.writeFileSync(path.join(RAIZ, "sitemap.xml"), sm);

const linha = (pg) => `- [${(TITULOS_PT[pg.slug] || MARCA).replace(/&amp;/g, "&")}](${urlPagina(pg.slug, "pt")}): ${pg.desc.pt}`;
fs.writeFileSync(path.join(RAIZ, "llms.txt"), `# ${MARCA}

> ${PAGINAS[0].desc.pt} A Eva Holding atua em três frentes integradas: agentes de IA, infraestrutura e automações. Sites, plataformas e painéis entram em todo projeto.

Contato: ${EMAIL} | WhatsApp ${FONE}. O site existe em português (${SITE}/), inglês (${SITE}/en) e espanhol (${SITE}/es).

## Soluções
${PAGINAS.filter((p) => p.servico).map(linha).join("\n")}

## Sobre a empresa
${PAGINAS.filter((p) => !p.servico).map(linha).join("\n")}

## Em inglês e espanhol
- English: ${SITE}/en (AI agents, automation, infrastructure and websites)
- Español: ${SITE}/es (agentes de IA, automatizaciones, infraestructura y sitios web)
`);

fs.writeFileSync(path.join(RAIZ, "vercel.json"), JSON.stringify({ cleanUrls: true, trailingSlash: false }, null, 2) + "\n");

const totalFaltas = Object.values(faltasPorPagina).reduce((a, b) => a + b.length, 0);
console.log(`${saidas.length} páginas geradas | robots.txt, sitemap.xml (${LANGS.length * PAGINAS.length} URLs), llms.txt e vercel.json | base: ${SITE}`);
if (totalFaltas) {
  console.log("textos sem tradução (ficam em português):");
  for (const [k, v] of Object.entries(faltasPorPagina)) console.log("  " + k + ": " + [...new Set(v)].join(", "));
}
