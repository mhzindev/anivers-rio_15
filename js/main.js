(function () {
  var cfg = window.CONVITE_CONFIG || {};

  document.querySelectorAll("[data-abrir]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      var folha = document.getElementById("folha-" + botao.dataset.abrir);
      if (folha && folha.showModal) folha.showModal();
    });
  });

  // Fecha ao tocar fora do painel
  document.querySelectorAll("dialog.folha").forEach(function (folha) {
    folha.addEventListener("click", function (e) {
      if (e.target === folha) folha.close();
    });
  });

  function copiarTexto(botao, texto, rotulo) {
    var ok = function () { botao.textContent = "Copiado!"; setTimeout(function () { botao.textContent = rotulo; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(texto).then(ok, function () {});
  }
  var copiarEnd = document.getElementById("copiar-endereco");
  if (copiarEnd) {
    copiarEnd.addEventListener("click", function () {
      copiarTexto(copiarEnd, "Chapéu de Palha, " + document.getElementById("endereco").textContent.trim(), "Copiar endereço");
    });
  }

  var form = document.getElementById("form-rsvp");
  var retorno = document.getElementById("retorno-rsvp");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      retorno.className = "retorno";
      var d = new FormData(form);
      var nome = (d.get("nome") || "").trim();
      var telefone = (d.get("telefone") || "").trim();
      if (!nome || !telefone) {
        retorno.className = "retorno erro";
        retorno.textContent = "Preencha seu nome e seu número.";
        return;
      }
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
        retorno.className = "retorno erro";
        retorno.textContent = "O envio ainda não está conectado ao banco de dados.";
        return;
      }
      var corpo = {
        nome: nome,
        telefone: telefone
      };
      retorno.textContent = "Enviando…";
      fetch(cfg.supabaseUrl + "/rest/v1/rsvps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.supabaseAnonKey,
          Authorization: "Bearer " + cfg.supabaseAnonKey,
          Prefer: "return=minimal"
        },
        body: JSON.stringify(corpo)
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset();
        retorno.textContent = "Obrigada! Sua resposta foi registrada.";
      }).catch(function () {
        retorno.className = "retorno erro";
        retorno.textContent = "Não foi possível enviar agora. Tente novamente.";
      });
    });
  }
})();
