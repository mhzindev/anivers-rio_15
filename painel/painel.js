(function () {
  var cfg = window.CONVITE_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var TZ = "America/Fortaleza";
  var PRAZO = new Date("2026-11-01T23:59:59-03:00").getTime();
  var EVENTO = new Date("2026-11-14T19:00:00-03:00").getTime();
  var LIMITE = 10;

  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });

  var dados = [], filtro = "todos", termo = "", aberta = false;
  var wrap = $("wrap"), btnTodas = $("ver-todas");

  // Tudo que vem do banco é texto de terceiros: sempre escapar antes de ir para o HTML.
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function tela(nome) {
    ["login", "sem-acesso", "app"].forEach(function (id) { $(id).classList.toggle("oculto", id !== nome); });
  }

  // ---------- formatação ----------
  function telMascarado(t) { return "(" + t.slice(0, 2) + ") 9••••-" + t.slice(-4); }
  function telCompleto(t) {
    return t.length === 11 ? "(" + t.slice(0, 2) + ") " + t.slice(2, 7) + "-" + t.slice(7)
                           : "(" + t.slice(0, 2) + ") " + t.slice(2, 6) + "-" + t.slice(6);
  }
  function diaLocal(d) { return new Date(d).toLocaleDateString("en-CA", { timeZone: TZ }); } // AAAA-MM-DD
  function quando(iso) {
    var seg = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (seg < 60) return "agora";
    if (seg < 3600) return "há " + Math.floor(seg / 60) + " min";
    if (seg < 86400) return "há " + Math.floor(seg / 3600) + " h";
    var dias = Math.round((new Date(diaLocal(Date.now())) - new Date(diaLocal(iso))) / 86400000);
    return dias === 1 ? "ontem" : "há " + dias + " dias";
  }
  function dataHora(iso) {
    var d = new Date(iso);
    var dm = d.toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" });
    var hm = d.toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).replace(":", "h");
    return dm + ", " + hm;
  }
  function textoPresente(r) {
    if (!r.confirmado) return "—";
    if (r.presente_outro) return "Outro: " + r.presente;
    return r.presente + (r.presente_detalhe ? " · " + r.presente_detalhe : "");
  }

  // ---------- login / sessão ----------
  $("form-login").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, erro = $("erro-login"), btn = $("btn-entrar");
    var email = f.email.value.trim().toLowerCase(), senha = f.senha.value;
    erro.textContent = "";
    if (!email || !senha) { erro.textContent = "Informe e-mail e senha."; return; }
    btn.disabled = true; btn.textContent = "Entrando…";
    sb.auth.signInWithPassword({ email: email, password: senha }).then(function (r) {
      if (r.error) { erro.textContent = "E-mail ou senha incorretos."; return; }
      f.senha.value = "";
      return entrar();
    }).catch(function () {
      erro.textContent = "Não foi possível entrar agora. Tente novamente.";
    }).finally(function () { btn.disabled = false; btn.textContent = "Entrar"; });
  });
  document.querySelectorAll("[data-sair]").forEach(function (b) {
    b.addEventListener("click", function () { sb.auth.signOut().then(function () { dados = []; tela("login"); }); });
  });

  function entrar() {
    return sb.rpc("is_admin").then(function (r) {
      if (r.error || r.data !== true) { tela("sem-acesso"); return; }
      tela("app");
      return carregar();
    });
  }

  // ---------- dados ----------
  function carregar() {
    $("app").classList.add("carregando");
    return sb.from("rsvps")
      .select("nome,telefone,confirmado,presente,presente_detalhe,presente_outro,criado_em,atualizado_em")
      .order("atualizado_em", { ascending: false }).limit(1000)
      .then(function (r) {
        if (r.error) {
          // sessão expirada ou sem permissão
          if (r.error.code === "PGRST301" || r.error.status === 401) { tela("login"); return; }
          $("cont").textContent = "Não foi possível carregar as respostas."; return;
        }
        dados = r.data || [];
        renderTudo();
      })
      .finally(function () { $("app").classList.remove("carregando"); });
  }
  $("btn-atualizar").addEventListener("click", function () { carregar(); });
  setInterval(function () { if (!document.hidden && !$("app").classList.contains("oculto")) carregar(); }, 60000);

  // ---------- renderização ----------
  function renderTudo() { renderKpis(); renderDias(); renderPresentes(); renderTabela(); }

  function renderKpis() {
    var sim = dados.filter(function (r) { return r.confirmado; }), nao = dados.length - sim.length;
    var pc = function (n) { return dados.length ? Math.round(n / dados.length * 100) + "% das respostas" : "—"; };
    var outros = sim.filter(function (r) { return r.presente_outro; }).length;
    $("k-total").textContent = dados.length; $("k-sim").textContent = sim.length; $("k-nao").textContent = nao;
    $("k-sim-p").textContent = pc(sim.length); $("k-nao-p").textContent = pc(nao);
    $("k-pres").textContent = sim.length; $("k-outro").textContent = outros + " em “Outro”";
    $("n-todos").textContent = dados.length; $("n-sim").textContent = sim.length; $("n-nao").textContent = nao;
    $("prop-sim").style.width = dados.length ? (sim.length / dados.length * 100) + "%" : "0";
    $("prop-nao").style.width = dados.length ? (nao / dados.length * 100) + "%" : "0";
    $("prop-txt").textContent = "Proporção total: " + sim.length + " confirmaram · " + nao + " rejeitaram";
    $("ultima").textContent = dados.length ? quando(dados[0].atualizado_em) : "—";
  }

  function renderDias() {
    var hoje = new Date(diaLocal(Date.now()) + "T12:00:00");
    var lista = [];
    for (var i = 9; i >= 0; i--) { var d = new Date(hoje); d.setDate(d.getDate() - i); lista.push(d.toLocaleDateString("en-CA")); }
    var cont = {};
    lista.forEach(function (k) { cont[k] = [0, 0]; });
    dados.forEach(function (r) { var k = diaLocal(r.atualizado_em); if (cont[k]) cont[k][r.confirmado ? 0 : 1]++; });
    var maxV = Math.max.apply(null, lista.map(function (k) { return cont[k][0] + cont[k][1]; }));
    var topo = Math.max(5, Math.ceil(maxV / 5) * 5);
    var h = function (v) { return (v / topo * 100).toFixed(1) + "%"; };
    $("dias").innerHTML = '<div class="eixo"><span>0</span><span>' + Math.round(topo / 2) + "</span><span>" + topo + "</span></div>" +
      lista.map(function (k) {
        var c = cont[k][0], n = cont[k][1], dd = k.slice(8) + "/" + k.slice(5, 7);
        return '<div class="dia"><div class="tip">' + dd + " · " + c + " confirmaram · " + n + ' rejeitaram</div><div class="pilha">' +
          (c ? '<div class="seg c" style="height:' + h(c) + '"></div>' : "") + (n ? '<div class="seg r" style="height:' + h(n) + '"></div>' : "") +
          "</div><label>" + k.slice(8) + "</label></div>";
      }).join("");
  }

  function renderPresentes() {
    var sim = dados.filter(function (r) { return r.confirmado; });
    var cont = {}, outros = {};
    sim.forEach(function (r) {
      if (r.presente_outro) { var k = r.presente.toLowerCase(); outros[k] = outros[k] || { t: r.presente, n: 0 }; outros[k].n++; cont["Outro presente"] = (cont["Outro presente"] || 0) + 1; }
      else cont[r.presente] = (cont[r.presente] || 0) + 1;
    });
    var rank = Object.keys(cont).map(function (k) { return [k, cont[k]]; }).sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); });
    var max = rank.length ? rank[0][1] : 1;
    $("pres").innerHTML = rank.length ? rank.map(function (p) {
      return "<li><span>" + esc(p[0]) + '</span><span class="barra"><i style="width:' + (p[1] / max * 100) + '%"></i></span><span class="v">' + p[1] + "</span></li>";
    }).join("") : '<li class="nota-vazia" style="display:block;grid-column:1/-1">Nenhum presente escolhido ainda.</li>';
    var lo = Object.keys(outros).map(function (k) { return outros[k]; });
    $("outros").classList.toggle("oculto", !lo.length);
    $("outros-tit").textContent = "Escreveram em “Outro” (" + lo.reduce(function (s, o) { return s + o.n; }, 0) + ")";
    $("outros-chips").innerHTML = lo.map(function (o) { return '<span class="chip">' + esc(o.t) + (o.n > 1 ? " ×" + o.n : "") + "</span>"; }).join("");
  }

  var ICO = {
    sim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.8l4.4 4.4L19 7.4"/></svg>',
    nao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>'
  };
  var WA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z"/></svg>';

  function renderTabela() {
    var rows = dados.filter(function (r) {
      var st = r.confirmado ? "sim" : "nao";
      return (filtro === "todos" || st === filtro) && (r.nome + " " + textoPresente(r)).toLowerCase().indexOf(termo) > -1;
    });
    var filtrando = termo !== "" || filtro !== "todos";
    var mostra = (aberta || filtrando) ? rows : rows.slice(0, LIMITE);
    $("linhas").innerHTML = mostra.map(function (r) {
      var st = r.confirmado ? "sim" : "nao";
      return '<tr><td class="c-nome nome">' + esc(r.nome) + '</td><td class="c-tel tel">' + esc(telMascarado(r.telefone)) +
        '</td><td class="c-wa"><a class="wa" href="https://wa.me/55' + esc(r.telefone) + '" target="_blank" rel="noopener noreferrer" aria-label="Abrir WhatsApp de ' + esc(r.nome) + '">' + WA + "</a></td>" +
        '<td class="c-st"><span class="st ' + st + '">' + ICO[st] + (r.confirmado ? "Confirmou" : "Rejeitou") + "</span></td>" +
        '<td class="c-pres">' + esc(textoPresente(r)) + '</td><td class="c-quando" title="' + esc(dataHora(r.atualizado_em)) + '">' + esc(quando(r.atualizado_em)) + "</td></tr>";
    }).join("");
    $("vazio").style.display = rows.length ? "none" : "block";
    $("vazio").textContent = dados.length ? "Nenhuma resposta encontrada." : "Nenhuma resposta recebida ainda.";
    $("cont").textContent = "Mostrando " + mostra.length + " de " + rows.length + (filtrando ? " resultados" : "");
    var temMais = !filtrando && rows.length > LIMITE;
    btnTodas.style.display = temMais ? "" : "none";
    btnTodas.textContent = aberta ? "Mostrar menos" : "Ver todas (" + rows.length + ")";
    btnTodas.setAttribute("aria-expanded", aberta);
    wrap.classList.toggle("aberta", aberta && mostra.length > LIMITE);
  }
  btnTodas.addEventListener("click", function () {
    aberta = !aberta; renderTabela();
    if (!aberta) { wrap.scrollTop = 0; $("t-resp").scrollIntoView({ behavior: "smooth", block: "start" }); }
  });
  wrap.addEventListener("scroll", function () { wrap.classList.toggle("rolou", wrap.scrollLeft > 2); });
  document.querySelectorAll(".seg-ctrl button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".seg-ctrl button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      filtro = b.dataset.f; wrap.scrollTop = 0; renderTabela();
    });
  });
  $("q").addEventListener("input", function (e) { termo = e.target.value.trim().toLowerCase(); wrap.scrollTop = 0; renderTabela(); });

  // ---------- prazos ----------
  function relogio() {
    var resta = PRAZO - Date.now();
    if (resta <= 0) { $("prazo-tit").innerHTML = "Confirmações <b>encerradas</b> em 01/11"; $("prazo-num").textContent = "Prazo encerrado"; }
    else {
      var s = Math.floor(resta / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
      $("prazo-num").textContent = d + " dias e " + h + " h" + (d === 0 ? " " + m + " min" : "");
    }
    var ev = Math.ceil((EVENTO - Date.now()) / 86400000);
    $("evento-em").textContent = ev > 0 ? ev + " dias" : "hoje";
  }
  relogio(); setInterval(relogio, 30000);

  // ---------- Exportar PDF (impressão do relatório aprovado) ----------
  $("btn-pdf").addEventListener("click", function () {
    var sim = dados.filter(function (r) { return r.confirmado; }).sort(function (a, b) { return new Date(a.atualizado_em) - new Date(b.atualizado_em); });
    var nao = dados.filter(function (r) { return !r.confirmado; }).sort(function (a, b) { return new Date(a.atualizado_em) - new Date(b.atualizado_em); });
    var gerado = new Date().toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
    var linhasSim = sim.map(function (r, i) { return '<tr><td class="n">' + (i + 1) + '</td><td class="nome">' + esc(r.nome) + '</td><td class="tel">' + esc(telCompleto(r.telefone)) + "</td><td>" + esc(textoPresente(r)) + '</td><td class="tel">' + esc(dataHora(r.atualizado_em)) + "</td></tr>"; }).join("");
    var linhasNao = nao.map(function (r, i) { return '<tr><td class="n">' + (i + 1) + '</td><td class="nome">' + esc(r.nome) + '</td><td class="tel">' + esc(telCompleto(r.telefone)) + '</td><td class="tel">' + esc(dataHora(r.atualizado_em)) + "</td></tr>"; }).join("");
    $("relatorio").innerHTML =
      '<section class="rel-capa"><div><p>Relatório de confirmações</p><h1>Karoline · 15 anos</h1><p>Sábado, 14 de novembro de 2026 · 19h00 · Chapéu de Palha, Imperatriz - MA</p></div><div class="sel">Gerado em<br><b>' + esc(gerado) + "</b></div></section>" +
      "<h2>Quem confirmou <small>(" + sim.length + ")</small></h2><table><thead><tr><th>#</th><th>Nome</th><th>WhatsApp</th><th>Presente</th><th>Respondeu em</th></tr></thead><tbody>" + (linhasSim || '<tr><td colspan="5">Ninguém confirmou ainda.</td></tr>') + "</tbody></table>" +
      "<h2>Quem rejeitou <small>(" + nao.length + ")</small></h2><table><thead><tr><th>#</th><th>Nome</th><th>WhatsApp</th><th>Respondeu em</th></tr></thead><tbody>" + (linhasNao || '<tr><td colspan="4">Ninguém rejeitou.</td></tr>') + "</tbody></table>";
    var tit = document.title; document.title = "Relatório de confirmações · Karoline 15 anos";
    window.print();
    document.title = tit;
  });

  // ---------- início ----------
  sb.auth.getSession().then(function (r) {
    if (r.data && r.data.session) entrar(); else tela("login");
  });
  sb.auth.onAuthStateChange(function (ev) { if (ev === "SIGNED_OUT") tela("login"); });
})();
