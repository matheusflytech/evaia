// Primeira tela: comportamento do chat estilo ChatGPT (o título recolhe quando a conversa começa; painel "por trás" abre sob demanda).
(function () {
  "use strict";

  /* ---------- chat: modo conversa ---------- */
  var corpo = document.getElementById("liveBody"), live = document.getElementById("ao-vivo");
  var secao = document.querySelector(".hero-chat-sec"), botao = document.getElementById("heroTraceBtn");
  if (corpo && live && secao) {
    var atualiza = function () {
      var conversando = corpo.children.length > 1; // a saudação sozinha ainda não é conversa
      live.classList.toggle("is-conv", conversando);
      secao.classList.toggle("is-conv", conversando);
      if (botao) botao.hidden = !conversando;
      if (!conversando) live.classList.remove("mostra-trace");
    };
    new MutationObserver(atualiza).observe(corpo, { childList: true });
    atualiza();
    if (botao) botao.addEventListener("click", function () {
      var abriu = live.classList.toggle("mostra-trace");
      botao.setAttribute("aria-expanded", abriu ? "true" : "false");
    });
  }
})();
