(function () {
  var pre = document.getElementById("preloader");
  if (!pre) return;

  // A assinatura aparece a cada carregamento (inclusive ao atualizar a página).
  // Só é pulada em pré-visualizações de telas (#confirmado...) ou com ?intro=0.
  var pular = /[?&]intro=0\b/.test(location.search) || location.hash.length > 1;
  if (pular) { pre.remove(); return; }

  var alvo = document.getElementById("assinatura");
  var reduzido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ESCRITA = 3300, SEGURA = 700;           // ms
  var CORTE = 52;                              // % onde termina "Marcella" (a caneta "levanta" ali)
  var terminou = false, carregou = document.readyState === "complete";
  window.addEventListener("load", function () { carregou = true; });

  function suave(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  // Duas passadas (nome e sobrenome) com uma pequena pausa entre elas.
  function progresso(t) {
    var A = .46, PAUSA = .06;
    if (t < A) return CORTE * suave(t / A);
    if (t < A + PAUSA) return CORTE;
    return CORTE + (100 - CORTE) * suave((t - A - PAUSA) / (1 - A - PAUSA));
  }

  function sair() {
    if (terminou) return;
    terminou = true;
    pre.classList.add("saindo");
    setTimeout(function () { pre.remove(); }, 800);
  }
  pre.addEventListener("click", function () { alvo.style.setProperty("--p", "108%"); sair(); });

  if (reduzido) {
    alvo.style.setProperty("--p", "108%");
    setTimeout(sair, 900);
    return;
  }

  var ini = null;
  function quadro(agora) {
    if (terminou) return;
    if (ini === null) ini = agora;
    var t = Math.min(1, (agora - ini) / ESCRITA);
    alvo.style.setProperty("--p", (progresso(t) * 1.08).toFixed(2) + "%");
    if (t < 1) { requestAnimationFrame(quadro); return; }
    (function esperar() {
      if (!carregou) { setTimeout(esperar, 100); return; }
      setTimeout(sair, SEGURA);
    })();
  }
  requestAnimationFrame(quadro);
})();
