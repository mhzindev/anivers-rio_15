// Micro-interações de clique: onda (ripple) a partir do ponto tocado e vibração curta onde houver suporte.
(function () {
  var reduzido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ALVOS = ".btn, .botao, .acao, .agenda__outro, .agenda__fechar";

  function onda(alvo, x, y) {
    if (reduzido) return;
    // nos ícones da capa a onda vive dentro do círculo vinho
    var host = alvo.classList.contains("acao") ? alvo.querySelector(".disco") : alvo;
    if (!host) return;
    var r = host.getBoundingClientRect();
    var d = Math.max(r.width, r.height) * 2;
    var cx = x == null ? r.width / 2 : x - r.left;
    var cy = y == null ? r.height / 2 : y - r.top;
    if (alvo.classList.contains("acao")) { cx = r.width / 2; cy = r.height / 2; }
    var s = document.createElement("span");
    s.className = "ripple";
    s.style.width = s.style.height = d + "px";
    s.style.left = cx - d / 2 + "px";
    s.style.top = cy - d / 2 + "px";
    s.addEventListener("animationend", function () { s.remove(); });
    host.appendChild(s);
  }
  function vibrar() { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} }

  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var alvo = e.target.closest && e.target.closest(ALVOS);
    if (!alvo || alvo.disabled || alvo.getAttribute("aria-disabled") === "true") return;
    onda(alvo, e.clientX, e.clientY);
    vibrar();
  }, { passive: true });

  // Ativação pelo teclado (Enter/Espaço geram click sem coordenadas)
  document.addEventListener("click", function (e) {
    if (e.detail !== 0) return;
    var alvo = e.target.closest && e.target.closest(ALVOS);
    if (alvo && !alvo.disabled) onda(alvo, null, null);
  });

  // Seleção de presente: vibração leve ao marcar
  document.addEventListener("change", function (e) {
    if (e.target.matches && e.target.matches("input[name=presente]")) vibrar();
  });
})();
