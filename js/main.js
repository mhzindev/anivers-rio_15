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

  var copiar = document.getElementById("copiar-pix");
  if (copiar) {
    copiar.addEventListener("click", function () {
      var chave = document.getElementById("chave-pix").textContent.trim();
      var ok = function () { copiar.textContent = "Chave copiada!"; setTimeout(function () { copiar.textContent = "Copiar chave Pix"; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(chave).then(ok, function () {});
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
      if (!nome) {
        retorno.className = "retorno erro";
        retorno.textContent = "Informe seu nome completo.";
        return;
      }
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
        retorno.className = "retorno erro";
        retorno.textContent = "O envio ainda não está conectado ao banco de dados.";
        return;
      }
      var corpo = {
        nome: nome,
        confirmado: d.get("confirmado") === "true",
        acompanhantes: parseInt(d.get("acompanhantes"), 10) || 0,
        restricoes: (d.get("restricoes") || "").trim() || null,
        mensagem: (d.get("mensagem") || "").trim() || null
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
