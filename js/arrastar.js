// Arrastar para baixo fecha os painéis (sheets): pela barra/título (mouse, toque) e pelo corpo
// quando o conteúdo está no topo (toque).
(function () {
  var LIMITE = 110;     // px arrastados que confirmam o fechamento
  var VELOCIDADE = 0.55; // px/ms (gesto rápido também fecha)
  var reduzido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("dialog.folha").forEach(function (folha) {
    var topo = folha.querySelector(".folha__topo");
    var y0 = 0, dy = 0, t0 = 0, ativo = false, arrastou = false, origem = null;

    function aplicar(v) {
      dy = Math.max(0, v);
      folha.style.transform = "translateY(" + dy + "px)";
      folha.style.setProperty("--fade", String(Math.max(0, 1 - dy / (folha.offsetHeight || 600))));
    }
    function limpar() {
      folha.style.transition = "";
      folha.style.transform = "";
      folha.style.removeProperty("--fade");
      folha.classList.remove("arrastando");
    }
    function comecar(y, de) {
      ativo = true; arrastou = false; origem = de; y0 = y; t0 = performance.now(); dy = 0;
      folha.style.transition = "none";
    }
    function mover(y) {
      if (!ativo) return false;
      var d = y - y0;
      if (!arrastou && d > 6) { arrastou = true; folha.classList.add("arrastando"); }
      if (arrastou) aplicar(d);
      return arrastou;
    }
    function soltar() {
      if (!ativo) return;
      ativo = false;
      if (!arrastou) { limpar(); return; }
      var v = dy / Math.max(1, performance.now() - t0);
      var fecha = dy > LIMITE || v > VELOCIDADE;
      if (reduzido) { fecha ? (limpar(), folha.close()) : limpar(); return; }
      folha.style.transition = "transform .22s ease";
      if (fecha) {
        folha.style.transform = "translateY(" + (folha.offsetHeight + 40) + "px)";
        folha.style.setProperty("--fade", "0");
        setTimeout(function () { folha.close(); limpar(); }, 200);
      } else {
        folha.style.transform = "translateY(0)";
        folha.style.setProperty("--fade", "1");
        setTimeout(limpar, 230);
      }
    }

    // 1) Barra/título: ponteiro (mouse e toque)
    if (topo) {
      topo.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        comecar(e.clientY, "topo");
        try { topo.setPointerCapture(e.pointerId); } catch (_) {}
      });
      topo.addEventListener("pointermove", function (e) { mover(e.clientY); });
      topo.addEventListener("pointerup", soltar);
      topo.addEventListener("pointercancel", soltar);
      // um arraste não deve contar como toque na barra (que fecha o painel)
      topo.addEventListener("click", function (e) { if (arrastou) { e.preventDefault(); e.stopPropagation(); arrastou = false; } }, true);
    }

    // 2) Corpo do painel: só começa se o conteúdo estiver no topo e o gesto for para baixo
    var tocando = false, ty0 = 0;
    folha.addEventListener("touchstart", function (e) {
      if (topo && topo.contains(e.target)) return;      // já tratado pelo ponteiro
      if (folha.scrollTop > 0 || e.touches.length !== 1) return;
      tocando = true; ty0 = e.touches[0].clientY;
    }, { passive: true });
    folha.addEventListener("touchmove", function (e) {
      if (!tocando) return;
      var y = e.touches[0].clientY;
      if (!ativo) {
        if (folha.scrollTop > 0 || y - ty0 < 10) return;   // rolagem normal do conteúdo
        comecar(ty0, "corpo");
      }
      if (mover(y)) e.preventDefault();
    }, { passive: false });
    function fimToque() { if (tocando) { tocando = false; if (origem === "corpo") soltar(); } }
    folha.addEventListener("touchend", fimToque);
    folha.addEventListener("touchcancel", fimToque);
  });
})();
