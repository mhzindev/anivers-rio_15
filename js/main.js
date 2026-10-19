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

  // ---- Validação e formatação do RSVP ----
  var form = document.getElementById("form-rsvp");
  var retorno = document.getElementById("retorno-rsvp");

  function limparNome(v) { return v.replace(/\s+/g, " ").trim(); }

  // Pelo menos dois nomes, cada um com 2+ letras; só letras, espaço, apóstrofo e hífen.
  function validarNome(v) {
    v = limparNome(v);
    if (!v) return "Informe seu nome.";
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' -]*$/.test(v)) return "Use apenas letras no nome.";
    var partes = v.split(" ").filter(function (p) { return p.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "").length >= 2; });
    if (partes.length < 2) return "Informe nome e sobrenome.";
    return "";
  }

  function soDigitos(v) { return v.replace(/\D/g, ""); }

  function formatarTelefone(v) {
    var d = soDigitos(v);
    if (d.length > 11 && d.slice(0, 2) === "55") d = d.slice(2);
    d = d.slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  // DDD válido (11–99, sem zero) + 10 dígitos (fixo) ou 11 com 9 após o DDD (celular).
  function validarTelefone(v) {
    var d = soDigitos(v);
    if (!d) return "Informe seu número.";
    if (d.length < 10) return "Número incompleto. Use DDD + número.";
    if (!/^[1-9][1-9]/.test(d)) return "DDD inválido.";
    if (d.length === 11 && d.charAt(2) !== "9") return "Celular deve começar com 9 após o DDD.";
    if (/^(\d)\1+$/.test(d.slice(2))) return "Número inválido.";
    return "";
  }

  function mostrarErro(input, msg) {
    var alvo = document.getElementById(input.getAttribute("aria-describedby"));
    alvo.textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  if (form) {
    var inNome = form.elements.nome, inTel = form.elements.telefone;
    inTel.addEventListener("input", function () {
      inTel.value = formatarTelefone(inTel.value);
      if (inTel.getAttribute("aria-invalid") === "true") mostrarErro(inTel, validarTelefone(inTel.value));
    });
    inNome.addEventListener("input", function () {
      if (inNome.getAttribute("aria-invalid") === "true") mostrarErro(inNome, validarNome(inNome.value));
    });
    inNome.addEventListener("blur", function () {
      inNome.value = limparNome(inNome.value);
      if (inNome.value) mostrarErro(inNome, validarNome(inNome.value));
    });
    inTel.addEventListener("blur", function () {
      if (inTel.value) mostrarErro(inTel, validarTelefone(inTel.value));
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      retorno.className = "retorno";
      retorno.textContent = "";
      var nome = limparNome(inNome.value);
      var okNome = mostrarErro(inNome, validarNome(nome));
      var okTel = mostrarErro(inTel, validarTelefone(inTel.value));
      if (!okNome || !okTel) {
        (okNome ? inTel : inNome).focus();
        return;
      }
      var telefone = soDigitos(inTel.value);
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
        inNome.setAttribute("aria-invalid", "false");
        inTel.setAttribute("aria-invalid", "false");
        retorno.textContent = "Obrigada! Sua resposta foi registrada.";
      }).catch(function () {
        retorno.className = "retorno erro";
        retorno.textContent = "Não foi possível enviar agora. Tente novamente.";
      });
    });
  }
})();
