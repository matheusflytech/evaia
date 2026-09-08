(function () {
  "use strict";

  var STORAGE_KEY = "eva_lang";
  var FLAGS = {
    pt: '<svg viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="14" fill="#009c3b"/><polygon points="10,2 18,7 10,12 2,7" fill="#ffdf00"/><circle cx="10" cy="7" r="3" fill="#002776"/></svg>',
    en: '<svg viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="14" fill="#fff"/><rect y="0" width="20" height="1.08" fill="#B22234"/><rect y="2.15" width="20" height="1.08" fill="#B22234"/><rect y="4.31" width="20" height="1.08" fill="#B22234"/><rect y="6.46" width="20" height="1.08" fill="#B22234"/><rect y="8.62" width="20" height="1.08" fill="#B22234"/><rect y="10.77" width="20" height="1.08" fill="#B22234"/><rect y="12.92" width="20" height="1.08" fill="#B22234"/><rect width="8" height="7.5" fill="#3C3B6E"/></svg>',
    es: '<svg viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="14" fill="#AA151B"/><rect y="3.5" width="20" height="7" fill="#F1BF00"/></svg>'
  };
  var LABELS = { pt: "Português", en: "English", es: "Español" };
  var CODES = { pt: "PT", en: "EN", es: "ES" };

  var DICT = {
    en: {
      "topbar.fale": "Contact Us",
      "topbar.central": "Help Center",
      "topbar.quemsomos": "About Us",

      "nav.web": "Web &amp; Product",
      "nav.ia": "AI Agents",
      "nav.infra": "Infrastructure",
      "nav.automacao": "Automation",
      "nav.quemsomos": "About Us",
      "nav.faq": "FAQ",
      "nav.contato": "Contact",
      "nav.solucoes": "Solutions",
      "nav.mega.web.tag": "Web &amp; Product",
      "nav.mega.web.title": "Sites &amp; Digital Products",
      "nav.mega.ia.tag": "Artificial Intelligence",
      "nav.mega.ia.title": "AI Agents",
      "nav.mega.infra.tag": "Cloud &amp; Infra",
      "nav.mega.infra.title": "Infrastructure",
      "nav.mega.automacao.tag": "Operations",
      "nav.mega.automacao.title": "Automation",
      "nav.mega.foot": "See all solutions →",
      "header.cta": "Talk to Eva",

      "hero.eyebrow": "Technology Holding",
      "hero.title1": "We build",
      "hero.title2": "the digital",
      "hero.title3": "engine of the <em>future</em>",
      "hero.lead": "Eva Holding brings together products, teams and technology under one purpose: transforming entire operations through software, artificial intelligence and infrastructure built to fit.",
      "hero.explore": "Explore",

      "marquee.1": "AI Agents", "marquee.2": "Process Automation", "marquee.3": "Smart Chatbots",
      "marquee.4": "Integrations &amp; APIs", "marquee.5": "Cloud Infrastructure", "marquee.6": "Generative AI",
      "marquee.7": "Web &amp; Digital Products", "marquee.8": "Automated Service", "marquee.9": "Dashboards &amp; BI",
      "marquee.10": "DevOps &amp; Scalability",

      "verticais.label": "What we move",
      "verticais.title": "Four fronts,<br>one engineering.",
      "vertical.web.tag": "Web &amp; Product",
      "vertical.web.title": "Sites &amp; Digital Products",
      "vertical.web.desc": "Institutional sites, platforms and high-performance web products, premium design backed by real engineering.",
      "vertical.ia.tag": "Artificial Intelligence",
      "vertical.ia.title": "AI Agents",
      "vertical.ia.desc": "Agents that serve, sell, qualify and decide, trained to operate within your business's real workflow, 24/7.",
      "vertical.infra.tag": "Cloud &amp; Infra",
      "vertical.infra.title": "Infrastructure",
      "vertical.infra.desc": "Server, data and integration architecture designed to scale without breaking, secure, observable and under control.",
      "vertical.automacao.tag": "Operations",
      "vertical.automacao.title": "Automation",
      "vertical.automacao.desc": "Manual processes become automatic flows between systems, teams and customers, less operation, more results.",

      "sobre.label": "Who is Eva",
      "sobre.title": "We're not an agency.<br>We're the <em>tech team</em><br>your company doesn't have.",
      "sobre.text": "Eva Holding was born to eliminate the distance between a good idea and a system running in production. We bring together software engineering, data science and design in a lean structure, capable of taking off the ground and keeping in the air what large tech companies take years to build.",
      "sobre.stat1": "integrated verticals",
      "sobre.stat2": "AI-assisted operation",
      "sobre.stat3": "team, from design to deploy",
      "sobre.cta": "Get to know Eva Holding",

      "abordagem.label": "How we think",
      "abordagem.title": "Principles that guide<br>every line of code.",
      "approach.1.title": "Speed with judgment",
      "approach.1.desc": "We deliver fast because we cut the superfluous, not the quality.",
      "approach.2.title": "Invisible technology",
      "approach.2.desc": "The best infrastructure is the one nobody notices, you just feel it working.",
      "approach.3.title": "Applied AI, not a showcase",
      "approach.3.desc": "Agents that solve real business problems, not pretty demos.",
      "approach.4.title": "Long-term partnership",
      "approach.4.desc": "We build as partners in the outcome, not as a one-off vendor.",

      "cta.label": "Let's build",
      "cta.title": "Ready to put <em>Eva</em><br>to work for you?",
      "cta.lead": "Tell us a bit about your company's challenge. We reply personally.",
      "cta.btn": "Talk to us",

      "footer.blurb": "Technology holding: sites, AI agents, infrastructure and automation for companies that want to scale.",
      "footer.h5.solucoes": "Solutions",
      "footer.h5.institucional": "About",
      "footer.h5.contato": "Contact",
      "footer.rights": "© 2025 Eva Holding. All rights reserved.",
      "footer.madewith": "Built with our own engineering.",

      "chat.greeting": "Hi! I'm Eva 👋 I can explain our sites, AI agents, infrastructure or automation. Type or send an audio 🎙️",
      "chat.placeholder": "Type your question...",
      "chat.status": "online now"
    },
    es: {
      "topbar.fale": "Contáctenos",
      "topbar.central": "Centro de Ayuda",
      "topbar.quemsomos": "Quiénes Somos",

      "nav.web": "Web &amp; Producto",
      "nav.ia": "Agentes de IA",
      "nav.infra": "Infraestructura",
      "nav.automacao": "Automatización",
      "nav.quemsomos": "Quiénes Somos",
      "nav.faq": "Preguntas Frecuentes",
      "nav.contato": "Contacto",
      "nav.solucoes": "Soluciones",
      "nav.mega.web.tag": "Web &amp; Producto",
      "nav.mega.web.title": "Sitios &amp; Productos Digitales",
      "nav.mega.ia.tag": "Inteligencia Artificial",
      "nav.mega.ia.title": "Agentes de IA",
      "nav.mega.infra.tag": "Cloud &amp; Infra",
      "nav.mega.infra.title": "Infraestructura",
      "nav.mega.automacao.tag": "Operación",
      "nav.mega.automacao.title": "Automatización",
      "nav.mega.foot": "Ver todas las soluciones →",
      "header.cta": "Hablar con Eva",

      "hero.eyebrow": "Holding de Tecnología",
      "hero.title1": "Construimos",
      "hero.title2": "el motor",
      "hero.title3": "digital del <em>futuro</em>",
      "hero.lead": "Eva Holding reúne productos, equipos y tecnología bajo un mismo propósito: transformar operaciones enteras a través de software, inteligencia artificial e infraestructura a medida.",
      "hero.explore": "Explorar",

      "marquee.1": "Agentes de IA", "marquee.2": "Automatización de Procesos", "marquee.3": "Chatbots Inteligentes",
      "marquee.4": "Integraciones &amp; APIs", "marquee.5": "Infraestructura Cloud", "marquee.6": "IA Generativa",
      "marquee.7": "Web &amp; Productos Digitales", "marquee.8": "Atención Automatizada", "marquee.9": "Dashboards &amp; BI",
      "marquee.10": "DevOps &amp; Escalabilidad",

      "verticais.label": "Lo que movemos",
      "verticais.title": "Cuatro frentes,<br>una sola ingeniería.",
      "vertical.web.tag": "Web &amp; Producto",
      "vertical.web.title": "Sitios &amp; Productos Digitales",
      "vertical.web.desc": "Sitios institucionales, plataformas y productos web de alto rendimiento, diseño premium con ingeniería real detrás.",
      "vertical.ia.tag": "Inteligencia Artificial",
      "vertical.ia.title": "Agentes de IA",
      "vertical.ia.desc": "Agentes que atienden, venden, califican y deciden, entrenados para operar dentro del flujo real de su negocio, 24/7.",
      "vertical.infra.tag": "Cloud &amp; Infra",
      "vertical.infra.title": "Infraestructura",
      "vertical.infra.desc": "Arquitectura de servidores, datos e integraciones diseñada para escalar sin romperse, segura, observable y bajo control.",
      "vertical.automacao.tag": "Operación",
      "vertical.automacao.title": "Automatización",
      "vertical.automacao.desc": "Procesos manuales se convierten en flujos automáticos entre sistemas, equipos y clientes, menos operación, más resultado.",

      "sobre.label": "Quién es Eva",
      "sobre.title": "No somos una agencia.<br>Somos el <em>equipo de tecnología</em><br>que su empresa no tiene.",
      "sobre.text": "Eva Holding nació para eliminar la distancia entre una buena idea y un sistema funcionando en producción. Reunimos ingeniería de software, ciencia de datos y diseño en una estructura ágil, capaz de despegar y mantener en el aire lo que las grandes empresas de tecnología tardan años en construir.",
      "sobre.stat1": "verticales integradas",
      "sobre.stat2": "operación asistida por IA",
      "sobre.stat3": "equipo, del diseño al despliegue",
      "sobre.cta": "Conocer Eva Holding",

      "abordagem.label": "Cómo pensamos",
      "abordagem.title": "Principios que guían<br>cada línea de código.",
      "approach.1.title": "Velocidad con criterio",
      "approach.1.desc": "Entregamos rápido porque recortamos lo superfluo, no la calidad.",
      "approach.2.title": "Tecnología invisible",
      "approach.2.desc": "La mejor infraestructura es la que nadie percibe, solo se siente que funciona.",
      "approach.3.title": "IA aplicada, no vitrina",
      "approach.3.desc": "Agentes que resuelven un problema real de negocio, no demos bonitas.",
      "approach.4.title": "Asociación a largo plazo",
      "approach.4.desc": "Construimos como socios del resultado, no como proveedor puntual.",

      "cta.label": "Vamos a construir",
      "cta.title": "¿Listo para poner<br>a <em>Eva</em> a trabajar?",
      "cta.lead": "Cuéntenos un poco sobre el desafío de su empresa. Respondemos personalmente.",
      "cta.btn": "Hable con nosotros",

      "footer.blurb": "Holding de tecnología: sitios, agentes de IA, infraestructura y automatización para empresas que quieren escalar.",
      "footer.h5.solucoes": "Soluciones",
      "footer.h5.institucional": "Institucional",
      "footer.h5.contato": "Contacto",
      "footer.rights": "© 2025 Eva Holding. Todos los derechos reservados.",
      "footer.madewith": "Hecho con ingeniería propia.",

      "chat.greeting": "¡Hola! Soy Eva 👋 Puedo explicarte sobre sitios, agentes de IA, infraestructura o automatización. Escribe o envía un audio 🎙️",
      "chat.placeholder": "Escribe tu pregunta...",
      "chat.status": "en línea ahora"
    }
  };

  function getLang() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "pt";
    } catch (e) {
      return "pt";
    }
  }

  function setLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  function applyLang(lang) {
    var dict = DICT[lang];
    document.documentElement.lang = lang === "en" ? "en" : lang === "es" ? "es" : "pt-BR";

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (lang === "pt") {
        if (el.hasAttribute("data-i18n-orig")) el.innerHTML = el.getAttribute("data-i18n-orig");
        return;
      }
      if (!el.hasAttribute("data-i18n-orig")) el.setAttribute("data-i18n-orig", el.innerHTML);
      var text = dict && dict[key];
      if (text) el.innerHTML = text;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (lang === "pt") {
        if (el.hasAttribute("data-i18n-placeholder-orig")) el.setAttribute("placeholder", el.getAttribute("data-i18n-placeholder-orig"));
        return;
      }
      if (!el.hasAttribute("data-i18n-placeholder-orig")) el.setAttribute("data-i18n-placeholder-orig", el.getAttribute("placeholder"));
      var text = dict && dict[key];
      if (text) el.setAttribute("placeholder", text);
    });

    var flagEl = document.getElementById("langFlag");
    var codeEl = document.getElementById("langCode");
    if (flagEl) flagEl.innerHTML = FLAGS[lang];
    if (codeEl) codeEl.textContent = CODES[lang];

    document.querySelectorAll(".lang-switch-menu button").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === lang);
    });
  }

  function initSwitcher() {
    var wrap = document.getElementById("langSwitch");
    var btn = document.getElementById("langSwitchBtn");
    var menu = document.getElementById("langSwitchMenu");
    if (!wrap || !btn || !menu) return;

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      wrap.classList.toggle("is-open");
    });
    document.addEventListener("click", function () {
      wrap.classList.remove("is-open");
    });
    menu.querySelectorAll("button").forEach(function (item) {
      item.addEventListener("click", function () {
        var lang = item.getAttribute("data-lang");
        setLang(lang);
        applyLang(lang);
        wrap.classList.remove("is-open");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSwitcher();
    applyLang(getLang());
  });

  window.EvaI18n = { getLang: getLang };
})();
