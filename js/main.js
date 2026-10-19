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

  var qtd = document.getElementById("qtd-acompanhantes");
  var nomesBox = document.getElementById("nomes-acompanhantes");
  if (qtd) {
    qtd.addEventListener("change", function () {
      var n = parseInt(qtd.value, 10) || 0, html = "";
      for (var i = 1; i <= n; i++) {
        html += '<label>Nome do acompanhante ' + i + '<input name="acompanhante" required autocomplete="off"></label>';
      }
      nomesBox.innerHTML = html;
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
      var nomes = d.getAll("acompanhante").map(function (x) { return x.trim(); });
      if (!nome || !telefone || nomes.some(function (x) { return !x; })) {
        retorno.className = "retorno erro";
        retorno.textContent = "Preencha seu nome, seu número e o nome de cada acompanhante.";
        return;
      }
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
        retorno.className = "retorno erro";
        retorno.textContent = "O envio ainda não está conectado ao banco de dados.";
        return;
      }
      var corpo = {
        nome: nome,
        telefone: telefone,
        acompanhantes: nomes.length,
        nomes_acompanhantes: nomes
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
        nomesBox.innerHTML = "";
        retorno.textContent = "Obrigada! Sua resposta foi registrada.";
      }).catch(function () {
        retorno.className = "retorno erro";
        retorno.textContent = "Não foi possível enviar agora. Tente novamente.";
      });
    });
  }
})();
