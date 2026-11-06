/* Presença da Eva: esfera de partículas viva (mesma do app do Eva Studio).
   Gira em dois eixos, respira, deforma como líquido e se estica na direção do cursor quando ele chega perto;
   um clique solta uma onda. Quando a Eva está respondendo (EvaOrb.falando(true)) a deformação aumenta.
   Uso: <canvas data-eva-orb class="..."></canvas> (monta sozinho). data-n = número de partículas (padrão 1600). */
(function () {
  "use strict";

  // ruído de valor 3D com tabela fixa: o desenho é o mesmo a cada carga
  var P = new Uint8Array(512), seed = 1337, i, j, t0;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  for (i = 0; i < 256; i++) P[i] = i;
  for (i = 255; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); t0 = P[i]; P[i] = P[j]; P[j] = t0; }
  for (i = 0; i < 256; i++) P[i + 256] = P[i];
  function h(x, y, z) { return P[P[P[x & 255] + (y & 255)] + (z & 255)] / 255; }
  function suave(t) { return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ruido(x, y, z) {
    var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    var fx = suave(x - X), fy = suave(y - Y), fz = suave(z - Z);
    var c00 = lerp(h(X, Y, Z), h(X + 1, Y, Z), fx), c10 = lerp(h(X, Y + 1, Z), h(X + 1, Y + 1, Z), fx);
    var c01 = lerp(h(X, Y, Z + 1), h(X + 1, Y, Z + 1), fx), c11 = lerp(h(X, Y + 1, Z + 1), h(X + 1, Y + 1, Z + 1), fx);
    return lerp(lerp(c00, c10, fy), lerp(c01, c11, fy), fz);
  }

  var falandoAlvo = 0;
  var reduz = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  function monta(cv) {
    if (cv.__orbe) return;
    cv.__orbe = true;
    var ctx = cv.getContext("2d");
    if (!ctx) return;
    var N = parseInt(cv.getAttribute("data-n"), 10) || 1600;
    var ouro = Math.PI * (3 - Math.sqrt(5));
    var pts = [];
    for (var k = 0; k < N; k++) {
      var y = 1 - (k / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = ouro * k;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }

    // cursor em coordenadas da esfera (1 = borda), suavizado; "perto" vai de 0 (longe) a 1 (em cima)
    var alvo = { x: 0, y: 0, perto: 0 }, cursor = { x: 0, y: 0, perto: 0 };
    var onda = 0, t = 0, amp = 0, anterior = performance.now(), visivel = true;

    function aoMover(e) {
      var rc = cv.getBoundingClientRect();
      var raio = Math.min(rc.width, rc.height) * 0.32;
      var x = (e.clientX - (rc.left + rc.width / 2)) / raio;
      var yy = (e.clientY - (rc.top + rc.height / 2)) / raio;
      alvo.x = x; alvo.y = yy;
      alvo.perto = Math.max(0, 1 - (Math.hypot(x, yy) - 0.6) / 2.4);
    }
    window.addEventListener("pointermove", aoMover, { passive: true });
    cv.addEventListener("pointerdown", function () { onda = 1; });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; }).observe(cv);
    }

    function desenha(agora) {
      requestAnimationFrame(desenha);
      var passo = Math.min(0.05, (agora - anterior) / 1000);
      anterior = agora;
      if (!visivel || document.hidden) return;
      var calmo = reduz.matches;
      t += passo * (calmo ? 0.35 : 1);

      // molas exponenciais: fala, cursor e onda chegam e saem sem degrau
      amp += (falandoAlvo - amp) * Math.min(1, passo * 3);
      var kk = Math.min(1, passo * 6);
      cursor.x += (alvo.x - cursor.x) * kk;
      cursor.y += (alvo.y - cursor.y) * kk;
      cursor.perto += ((calmo ? 0 : alvo.perto) - cursor.perto) * Math.min(1, passo * 4);
      onda = Math.max(0, onda - passo * 1.1);

      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = Math.round(cv.clientWidth * dpr), hh = Math.round(cv.clientHeight * dpr);
      if (!w || !hh) return;
      if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }

      // respiração + um passeio pequeno do centro: a esfera nunca fica parada
      var respira = 1 + Math.sin(t * 1.4) * 0.025 + amp * Math.sin(t * 7) * 0.02;
      var R = Math.min(w, hh) * 0.32 * respira;
      var cx = w / 2 + Math.sin(t * 0.5) * R * 0.04 + cursor.x * cursor.perto * R * 0.08;
      var cy = hh / 2 + Math.cos(t * 0.37) * R * 0.04 + cursor.y * cursor.perto * R * 0.08;

      // gira em Y sempre; inclina em X e Y na direção do cursor
      var rotY = t * 0.35 + cursor.x * cursor.perto * 0.5;
      var rotX = Math.sin(t * 0.21) * 0.25 + cursor.y * cursor.perto * 0.5;
      var cy1 = Math.cos(rotY), sy1 = Math.sin(rotY), cx1 = Math.cos(rotX), sx1 = Math.sin(rotX);

      var deform = 0.1 + amp * 0.22;
      var dirLen = Math.hypot(cursor.x, cursor.y) || 1;
      var dx = cursor.x / dirLen, dy = cursor.y / dirLen;

      ctx.clearRect(0, 0, w, hh);
      ctx.globalCompositeOperation = "lighter";
      for (var n = 0; n < pts.length; n++) {
        var px = pts[n][0], py = pts[n][1], pz = pts[n][2];
        var x1 = px * cy1 - pz * sy1, z1 = px * sy1 + pz * cy1;
        var y2 = py * cx1 - z1 * sx1, z2 = py * sx1 + z1 * cx1;

        // líquido: ruído que corre pela superfície (coordenadas do ponto, para a forma girar junto)
        var nz = ruido(px * 1.6 + t * 0.35, py * 1.6 - t * 0.25, pz * 1.6 + t * 0.3) - 0.5;
        var d = 1 + deform * nz * 2;

        // onda do clique: anel que corre do polo da frente para trás
        if (onda > 0) d += Math.sin((z2 + 1) * 6 - (1 - onda) * 14) * 0.06 * onda;

        // esticar: o lado virado para o cursor se alonga na direção dele
        var face = Math.max(0, x1 * dx + y2 * dy);
        var puxa = cursor.perto * Math.pow(face, 3) * 0.32;

        var persp = 3 / (3 + z2);
        var sx = cx + (x1 * d + dx * puxa) * R * persp;
        var sy = cy + (y2 * d + dy * puxa) * R * persp;

        var frente = (1 - z2) / 2;
        var borda = Math.pow(1 - Math.abs(z2), 0.6);
        var lat = (y2 + 1) / 2;
        var rr = lat < 0.5 ? 110 + lat * 170 : 195 + (lat - 0.5) * 110;
        var gg = lat < 0.5 ? 170 - lat * 50 : 145 - (lat - 0.5) * 90;
        var bb = lat < 0.5 ? 255 : 255 - (lat - 0.5) * 170;
        var a = (0.16 + borda * 0.4) * (0.35 + frente * 0.65) * (1 + puxa * 1.5);
        ctx.fillStyle = "rgba(" + (rr | 0) + "," + (gg | 0) + "," + (bb | 0) + "," + Math.min(1, a).toFixed(3) + ")";
        var tam = (0.9 + frente * 1.3) * persp * dpr;
        ctx.fillRect(sx - tam / 2, sy - tam / 2, tam, tam);
      }
      ctx.globalCompositeOperation = "source-over";
    }
    requestAnimationFrame(desenha);
  }

  function tudo() { [].forEach.call(document.querySelectorAll("canvas[data-eva-orb]"), monta); }

  window.EvaOrb = {
    mount: monta,
    scan: tudo,
    // true enquanto a Eva responde: a esfera deforma mais
    falando: function (v) { falandoAlvo = v ? 1 : 0; }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tudo); else tudo();
})();
