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
      if (e.target === folha) (window.fecharFolha ? window.fecharFolha(folha) : folha.close());
    });
  });

  function copiarTexto(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texto);
    return new Promise(function (resolve, reject) {
      var t = document.createElement("textarea");
      t.value = texto; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(t); t.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(t);
      ok ? resolve() : reject();
    });
  }

  var copiarEnd = document.getElementById("copiar-endereco");
  var avisoCopia = document.getElementById("aviso-copia");
  var timerAviso;
  if (copiarEnd) {
    copiarEnd.addEventListener("click", function () {
      var texto = "Chapéu de Palha, " + document.getElementById("endereco").textContent.trim();
      copiarTexto(texto).then(function () {
        avisoCopia.textContent = "O endereço foi copiado";
        avisoCopia.classList.add("visivel");
        clearTimeout(timerAviso);
        timerAviso = setTimeout(function () { avisoCopia.classList.remove("visivel"); }, 2500);
      }, function () {
        avisoCopia.textContent = "Não foi possível copiar. Copie o endereço manualmente.";
        avisoCopia.classList.add("visivel");
      });
    });
  }

  // ---- Adicionar à agenda ----
  // iPhone/Mac: .ics abre direto o Calendário. Demais: link do Google Agenda. A outra opção fica em "Usar outro calendário".
  function prepararAgenda() {
    var apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
    var ics = document.getElementById("ag-ics"), goo = document.getElementById("ag-google");
    var prim = apple ? ics : goo, alt = apple ? goo : ics;
    prim.hidden = false; prim.classList.remove("secundario");
    alt.hidden = true; alt.classList.add("secundario");
    document.getElementById("ag-outro").hidden = false;
    document.getElementById("ag-aviso").textContent = "";
  }
  var agOutro = document.getElementById("ag-outro");
  if (agOutro) {
    agOutro.addEventListener("click", function () {
      var ics = document.getElementById("ag-ics"), goo = document.getElementById("ag-google");
      (ics.hidden ? ics : goo).hidden = false;
      var alt = ics.classList.contains("secundario") ? ics : goo;
      alt.querySelector("span").textContent = alt === ics ? "Baixar arquivo .ics (Apple, Outlook)" : "Abrir no Google Agenda";
      agOutro.hidden = true;
    });
    document.getElementById("ag-ics").addEventListener("click", function () {
      document.getElementById("ag-aviso").textContent = "Toque no arquivo baixado para adicionar o evento à agenda.";
    });
    document.getElementById("ag-google").addEventListener("click", function () {
      document.getElementById("ag-aviso").textContent = "Abrindo o Google Agenda…";
    });
    document.getElementById("ag-fechar").addEventListener("click", function () {
      window.fecharFolha(document.getElementById("folha-sucesso"));
    });
  }

  var SELO_OK = '<img src="assets/icone-confirmar.webp" alt="">';
  var SELO_NAO = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function mostrarSucesso(rejeitou, titulo, sub) {
    ["folha-confirmar", "folha-presentes"].forEach(function (id) {
      var f = document.getElementById(id);
      if (f.open) f.close();
    });
    var ok = document.getElementById("folha-sucesso");
    document.getElementById("t-sucesso").textContent = titulo || (rejeitou ? "Sentiremos sua falta" : "Sua presença foi confirmada");
    var subEl = document.getElementById("sucesso-sub");
    subEl.textContent = sub || "";
    subEl.hidden = !sub;
    document.getElementById("selo").innerHTML = rejeitou ? SELO_NAO : SELO_OK;
    document.getElementById("agenda").hidden = !!rejeitou;
    ok.classList.toggle("com-agenda", !rejeitou);
    if (!rejeitou) prepararAgenda();
    if (!ok.open) ok.showModal();
  }
  // Pré-visualização das telas: index.html#confirmado ou #rejeitado
  if (location.hash === "#confirmado") mostrarSucesso(false, null, "Presente: Anel · Tamanho 18");
  if (location.hash === "#rejeitado") mostrarSucesso(true);

  // ---- Prazo de confirmação: até 25/10/2026 23:59:59 (Brasília) ----
  var PRAZO = new Date("2026-10-25T23:59:59-03:00").getTime();
  var prazo = document.getElementById("prazo");
  var formRsvp = document.getElementById("form-rsvp");
  var encerrado = false;
  function dois(n) { return (n < 10 ? "0" : "") + n; }
  function atualizarPrazo() {
    var resta = PRAZO - Date.now();
    if (resta <= 0) {
      if (!encerrado) {
        encerrado = true;
        prazo.classList.add("encerrado");
        formRsvp.classList.add("encerrado");
        document.getElementById("prazo-tit").textContent = "O prazo para confirmar presença foi encerrado.";
        clearInterval(relogio);
      }
      return;
    }
    var seg = Math.floor(resta / 1000);
    document.getElementById("cd-d").textContent = dois(Math.floor(seg / 86400));
    document.getElementById("cd-h").textContent = dois(Math.floor(seg % 86400 / 3600));
    document.getElementById("cd-m").textContent = dois(Math.floor(seg % 3600 / 60));
    document.getElementById("cd-s").textContent = dois(seg % 60);
  }
  var relogio = setInterval(atualizarPrazo, 1000);
  atualizarPrazo();

  // ---- Validação e formatação do RSVP ----
  // ---- Teclado virtual ----
  // iOS e Chrome (Android) não redimensionam o layout com o teclado aberto: medimos a área visível
  // e levantamos o painel acima do teclado. Em navegadores que redimensionam, a diferença é 0.
  var vv = window.visualViewport;
  if (vv) {
    var raiz = document.documentElement;
    var ajustarTeclado = function () {
      var kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      if (kb > 80) {
        raiz.style.setProperty("--teclado", kb + "px");
        raiz.style.setProperty("--vvh", Math.round(vv.height) + "px");
      } else {
        raiz.style.removeProperty("--teclado");
        raiz.style.removeProperty("--vvh");
      }
    };
    vv.addEventListener("resize", ajustarTeclado);
    vv.addEventListener("scroll", ajustarTeclado);
  }
  // Ao focar um campo dentro de um painel, garante que ele fique visível acima do teclado.
  document.addEventListener("focusin", function (e) {
    var el = e.target;
    if (!el.closest || !el.closest("dialog.folha") || !el.matches("input, textarea, select")) return;
    setTimeout(function () { el.scrollIntoView({ block: "center", behavior: "smooth" }); }, 300);
  });

  var form = document.getElementById("form-rsvp");
  var retorno = document.getElementById("retorno-rsvp");

  function limparNome(v) { return v.replace(/\s+/g, " ").trim(); }

  // Pelo menos dois nomes, cada um com 2+ letras; só letras e espaços.
  function validarNome(v) {
    v = limparNome(v);
    if (!v) return "Informe seu nome.";
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
    var grupoPres = form.querySelector(".escolha--form");
    var campoOutro = document.getElementById("outro-campo");
    var textoOutro = document.getElementById("outro-texto");
    var erroPres = document.getElementById("erro-presente");

    function presenteAtual() {
      var r = form.querySelector("input[name=presente]:checked");
      if (!r) return null;
      if (r.value === "__outro") {
        return { outro: true, presente: textoOutro.value.replace(/\s+/g, " ").trim(), detalhe: "" };
      }
      return { outro: false, presente: r.value, detalhe: r.dataset.detalhe || "" };
    }
    function validarPresente() {
      var p = presenteAtual();
      if (!p) return "Escolha como você vai presentear.";
      if (p.presente.length < 3) return "Escreva qual presente você vai dar.";
      return "";
    }
    function mostrarErroPresente(msg) {
      erroPres.textContent = msg;
      grupoPres.classList.toggle("invalido", !!msg);
    }
    form.addEventListener("change", function (e) {
      if (!e.target.matches("input[name=presente]")) return;
      var outro = form.querySelector("input[value=__outro]").checked;
      campoOutro.hidden = !outro;
      if (outro) textoOutro.focus();
      mostrarErroPresente("");
    });
    textoOutro.addEventListener("input", function () { if (erroPres.textContent) mostrarErroPresente(validarPresente()); });
    inTel.addEventListener("input", function () {
      inTel.value = formatarTelefone(inTel.value);
      if (inTel.getAttribute("aria-invalid") === "true") mostrarErro(inTel, validarTelefone(inTel.value));
    });
    inNome.addEventListener("input", function () {
      var limpo = inNome.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, "");
      if (limpo !== inNome.value) {
        var pos = inNome.selectionStart - (inNome.value.length - limpo.length);
        inNome.value = limpo;
        inNome.setSelectionRange(pos, pos);
      }
      if (inNome.getAttribute("aria-invalid") === "true") mostrarErro(inNome, validarNome(inNome.value));
    });
    inNome.addEventListener("blur", function () {
      inNome.value = limparNome(inNome.value);
      if (inNome.value) mostrarErro(inNome, validarNome(inNome.value));
    });
    inTel.addEventListener("blur", function () {
      if (inTel.value) mostrarErro(inTel, validarTelefone(inTel.value));
    });

    var dlgConf = document.getElementById("folha-confirmar");
    // Desabilita os botões durante o envio (evita toque duplo) e mostra o spinner no botão acionado.
    function setEnviando(sim, botao) {
      form.setAttribute("aria-busy", sim ? "true" : "false");
      form.querySelectorAll("button").forEach(function (b) { b.disabled = sim; });
      if (botao) botao.classList.toggle("carregando", sim);
    }
    function irEtapa(n) {
      dlgConf.dataset.etapa = String(n);
      document.getElementById("passo2").className = n === 2 ? "on" : "";
      document.getElementById("t-confirmar").textContent = n === 2 ? "Escolha como presentear" : "Confirmar presença";
      document.getElementById("sub-confirmar").textContent = n === 2 ? "último passo para confirmar a sua presença" : "preencha seus dados para continuar";
      dlgConf.scrollTo(0, 0);
    }
    document.getElementById("voltar-etapa").addEventListener("click", function () { irEtapa(1); });
    dlgConf.addEventListener("close", function () { irEtapa(1); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (encerrado) return;
      var acao = e.submitter ? e.submitter.value : "avancar";
      // Enter no campo "Outro" (etapa 2) é envio implícito: o botão padrão do form é o da etapa 1.
      if (dlgConf.dataset.etapa === "2" && acao !== "confirmar") acao = "confirmar";
      var rejeitar = acao === "rejeitar";
      var botaoAcao = acao === "confirmar" ? form.querySelector(".so-etapa2 .btn--sim") : e.submitter;
      retorno.className = "retorno";
      retorno.textContent = "";
      var nome = limparNome(inNome.value);
      var okNome = mostrarErro(inNome, validarNome(nome));
      var okTel = mostrarErro(inTel, validarTelefone(inTel.value));
      if (!okNome || !okTel) {
        irEtapa(1);
        (okNome ? inTel : inNome).focus();
        return;
      }
      if (acao === "avancar") {
        document.getElementById("resumo-etapa2").textContent = "Olá, " + nome.split(" ")[0] + "! Selecione uma sugestão ou conte o seu presente em “Outro”.";
        mostrarErroPresente("");
        irEtapa(2);
        return;
      }
      var erroP = rejeitar ? "" : validarPresente();
      mostrarErroPresente(erroP);
      if (erroP) {
        (presenteAtual() ? textoOutro : form.querySelector("input[name=presente]")).focus();
        return;
      }
      var pres = rejeitar ? null : presenteAtual();
      var telefone = soDigitos(inTel.value);
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
        retorno.className = "retorno erro";
        retorno.textContent = "O envio não está configurado.";
        return;
      }
      // A gravação passa só pela função segura registrar_resposta (valida tudo e respeita o prazo).
      // Mesmo número = mesma pessoa: quem já confirmou pode desconfirmar (e vice-versa).
      var corpo = {
        p_nome: nome,
        p_telefone: telefone,
        p_confirmado: !rejeitar,
        p_presente: pres ? pres.presente : null,
        p_detalhe: pres && pres.detalhe ? pres.detalhe : null,
        p_outro: pres ? pres.outro : false
      };
      var MSG = {
        prazo_encerrado: "O prazo para confirmar presença foi encerrado.",
        nome_invalido: "Confira seu nome: use nome e sobrenome, só com letras.",
        telefone_invalido: "Confira seu número: use DDD + número.",
        presente_obrigatorio: "Escolha como você vai presentear.",
        limite_atingido: "Não foi possível registrar agora. Fale com a família."
      };
      setEnviando(true, botaoAcao);
      retorno.textContent = "Enviando…";
      fetch(cfg.supabaseUrl + "/rest/v1/rpc/registrar_resposta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.supabaseAnonKey,
          Authorization: "Bearer " + cfg.supabaseAnonKey
        },
        body: JSON.stringify(corpo)
      }).then(function (r) {
        if (!r.ok) {
          return r.json().catch(function () { return {}; }).then(function (e) { var err = new Error(e.message || r.status); err.codigo = e.message; throw err; });
        }
        setEnviando(false, botaoAcao);
        form.reset();
        inNome.setAttribute("aria-invalid", "false");
        inTel.setAttribute("aria-invalid", "false");
        retorno.textContent = "";
        campoOutro.hidden = true;
        mostrarSucesso(rejeitar, null, pres ? "Presente: " + pres.presente + (pres.detalhe ? " · " + pres.detalhe : "") : "");
      }).catch(function (err) {
        setEnviando(false, botaoAcao);
        retorno.className = "retorno erro";
        retorno.textContent = MSG[err && err.codigo] || "Não foi possível enviar agora. Tente novamente.";
        if (err && err.codigo === "prazo_encerrado") {
          encerrado = true;
          prazo.classList.add("encerrado");
          formRsvp.classList.add("encerrado");
          document.getElementById("prazo-tit").textContent = "O prazo para confirmar presença foi encerrado.";
          irEtapa(1);
        }
      });
    });
  }

})();
