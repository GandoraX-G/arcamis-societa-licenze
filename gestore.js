// ════════════════════════════════════════════════
//  GESTORE DI SOCIETÀ — motore unico
//  Fondazione, gestione e progressione nel rispetto
//  del Codice di Arcadia (Camera del Commercio / U.R.V.)
// ════════════════════════════════════════════════
// ════════════════════════════════════════════════
//  STATS IMPRESA (formula unica, riusata ovunque)
// ════════════════════════════════════════════════
function impresaStats(data) {
  data = data || {};
  var fatt = +data.fatturato || 0;
  var rendita = (data.contratti || []).reduce(function(s,c){ return s + (+c.rendita || 0); }, 0);
  var sospeso = data.stato === 'sospesa' || data.stato === 'sanzione';
  var rendEff = sospeso ? 0 : rendita;
  var lordo = fatt + rendEff;
  var tassa = Math.round(lordo * 0.01);
  var appPG = (data.soci || []).filter(function(s){ return s.isApprendista && s.tipo === 'PG'; }).length;
  var appNPC = (data.soci || []).filter(function(s){ return s.isApprendista && s.tipo !== 'PG'; }).length;
  var apprCost = appPG * 20 + appNPC * 8;
  var riserva = Math.round(Math.max(0, lordo - tassa - apprCost) * 0.1);
  var netto = lordo - tassa - apprCost - riserva;
  return { fatt:fatt, rendita:rendita, rendEff:rendEff, sospeso:sospeso, lordo:lordo, tassa:tassa, apprCost:apprCost, riserva:riserva, netto:netto };
}

// ════════════════════════════════════════════════
//  GESTORE DI SOCIETÀ — motore unico
//  Fondazione, gestione e progressione nel rispetto
//  del Codice di Arcadia (Camera del Commercio / U.R.V.)
// ════════════════════════════════════════════════

function patTotale(sigla) {
  var p = DATA.patenti.filter(function(x){ return x.sigla === sigla; })[0];
  return p ? p.totale : 0;
}
function isLv2Struttura(nome) {
  return DATA.strutture.some(function(s){ return s.nome === nome && s.lv === 2; });
}
function statoBadge(stato) {
  var map = { attiva:['Attiva','stato-attiva'], sospesa:['Sospesa','stato-sospesa'], sanzione:['In sanzione','stato-sanzione'], sciolta:['Sciolta','stato-sciolta'] };
  var m = map[stato] || map.attiva;
  return '<span class="stato-badge ' + m[1] + '">' + m[0] + '</span>';
}
function att(v) { return escHtml(String(v == null ? '' : v)); }

// ── Storage (compatibile con il vecchio Tracker) ──
var TRACKER_KEY = 'arcamis_imprese_store';
var TRACKER_ACTIVE_KEY = 'arcamis_impresa_attiva';
var TRACKER_BACKUP_KEY = 'arcamis_imprese_autobackup';
var TRACKER_DEFAULT = { nome:'Nuova Società', livello:1, stato:'attiva', settore:'', cassa:30, fatturato:0, fondo:30, soci:[], strutture:[], contratti:[], transazioni:[], sanzioni:[], approvazione:false, note:'', notes:'' };

function trackerStore() {
  try { var s = JSON.parse(localStorage.getItem(TRACKER_KEY)); return (s && s.imprese) ? s : { imprese:{}, ordine:[] }; }
  catch(e) { return { imprese:{}, ordine:[] }; }
}
function trackerActiveId() {
  var id = localStorage.getItem(TRACKER_ACTIVE_KEY);
  var store = trackerStore();
  if (id && store.imprese[id]) return id;
  if (store.ordine.length) return store.ordine[0];
  return null;
}
function setTrackerActiveId(id) { localStorage.setItem(TRACKER_ACTIVE_KEY, id); }
function trackerSnapshot() { try { localStorage.setItem(TRACKER_BACKUP_KEY, JSON.stringify(trackerStore())); } catch(e) {} }
function trackerNew(data) {
  var store = trackerStore();
  var id = 'imp' + Date.now();
  store.imprese[id] = Object.assign({}, TRACKER_DEFAULT, data || {});
  if (store.ordine.indexOf(id) === -1) store.ordine.push(id);
  setTrackerActiveId(id);
  localStorage.setItem(TRACKER_KEY, JSON.stringify(store));
  return id;
}
function trackerLoad() {
  var id = trackerActiveId();
  var store = trackerStore();
  var base = Object.assign({}, TRACKER_DEFAULT);
  if (!id) return base;
  var d = Object.assign(base, store.imprese[id]);
  d.sanzioni = Array.isArray(d.sanzioni) ? d.sanzioni : [];
  d.settore = d.settore || '';
  if (d.notes === undefined) d.notes = d.note || '';
  return d;
}
function trackerSave(data) {
  trackerSnapshot();
  var store = trackerStore();
  var id = trackerActiveId();
  if (!id) { return trackerNew(data); }
  store.imprese[id] = Object.assign({}, TRACKER_DEFAULT, data);
  localStorage.setItem(TRACKER_KEY, JSON.stringify(store));
  return id;
}
function trackerDelete(id) {
  var store = trackerStore();
  if (!store.imprese[id]) return;
  if (!confirm('Eliminare la società "' + (store.imprese[id].nome || 'senza nome') + '"? L\u0027operazione non può essere annullata.')) return;
  trackerSnapshot();
  delete store.imprese[id];
  store.ordine = store.ordine.filter(function(o){ return o !== id; });
  localStorage.setItem(TRACKER_KEY, JSON.stringify(store));
  if (trackerActiveId() === id) localStorage.removeItem(TRACKER_ACTIVE_KEY);
  gInit();
}
function trackerRestoreSnapshot() {
  try {
    var s = JSON.parse(localStorage.getItem(TRACKER_BACKUP_KEY));
    if (!s || !s.imprese) { alert('Nessuno snapshot disponibile.'); return; }
    localStorage.setItem(TRACKER_KEY, JSON.stringify(s));
    gInit();
  } catch(e) { alert('Snapshot non valido.'); }
}

// ── Generatore con ruoli e patenti della meccanica ──
var GEN_NAMES_PREFIX = ['Furbo','Rossi','Bianchi','Neri','Dorati','Argentati','Fiammanti','Ombrosi','Sussurranti','Vagabondi','Coraggiosi','Nobili','Luminosi','Tempestosi','Silenti'];
var GEN_NAMES_SUFFIX = ['Martelli','Spade','Fiamme','Stelle','Ombre','Vetri','Pietre','Foglie','Cuori','Scudi','Frecce','Piume','Opere','Sogni','Cristalli'];
function lvPatente(lv) {
  var p = DATA.livelli[lv - 1];
  return p && p.patente ? p.patente : 'P.O.E.';
}
function lvMinSoc(lv) { return [2, 3, 4, 5][(lv || 1) - 1] || 2; }
var GEN_MESTIERI = [
  { name:'Oste', pat:'P.M.C.', lv:1 },
  { name:'Falegname', pat:'P.M.C.', lv:1 },
  { name:'Sarto', pat:'P.M.C.', lv:1 },
  { name:'Artista', pat:'P.M.C.', lv:1 },
  { name:'Metallurgo', pat:'P.M.T.', lv:2 },
  { name:'Artigiano', pat:'P.M.T.', lv:2 },
  { name:'Architetto', pat:'P.M.T.', lv:2 },
  { name:'Alchimista', pat:'P.A.S.V.', lv:3 },
  { name:'Artigiano Hextech', pat:'P.A.S.V.', lv:3 },
  { name:'Maestro Artigiano', pat:'P.O.E.', lv:3 },
  { name:'Arcanista delle Corporazioni', pat:'P.O.E.', lv:3 },
];
var GEN_SOCIO_NAMES = ['Aldric','Brenna','Calla','Darian','Elara','Finn','Greta','Haldor','Isolde','Jarek','Kira','Loric','Mira','Norvin','Oria','Pellin','Quinn','Renna','Sorin','Thessa','Ulric','Vessa','Wrenn','Xara','Yves','Zara'];
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function gRandomData() {
  var level = randInt(1, 4);
  var minSoc = lvMinSoc(level);
  var sociCount = randInt(Math.max(2, minSoc), 6);
  var name = rand(GEN_NAMES_PREFIX) + ' ' + rand(GEN_NAMES_SUFFIX);
  var pool = GEN_MESTIERI.filter(function(m){ return m.lv <= level; });
  var reqPat = lvPatente(level);

  function mestPat(pat) { return GEN_MESTIERI.filter(function(m){ return m.pat === pat; }); }

  var soci = [];
  var resp = rand(mestPat(reqPat).length ? mestPat(reqPat) : pool);
  soci.push({ nome: GEN_SOCIO_NAMES[0], mestiere: resp.name, patente: resp.pat, ruolo: 'Responsabile', tipo: 'PG' });
  var poolNoResp = pool.filter(function(m){ return m.name !== resp.name; });
  var mastro = rand(poolNoResp.length ? poolNoResp : pool);
  soci.push({ nome: GEN_SOCIO_NAMES[1 % GEN_SOCIO_NAMES.length], mestiere: mastro.name, patente: mastro.pat, ruolo: 'Mastro Artigiano', tipo: 'PG' });
  for (var i = 2; i < sociCount; i++) {
    var m = rand(pool);
    if (level < 3 && m.pat === 'P.O.E.') m = rand(pool.filter(function(x){ return x.pat !== 'P.O.E.'; }));
    if (i === sociCount - 1 && sociCount >= 4) {
      soci.push({ nome: GEN_SOCIO_NAMES[i % GEN_SOCIO_NAMES.length], mestiere: m.name, patente: '—', ruolo: 'Apprendista', tipo: Math.random() > .5 ? 'PG' : 'NPC', isApprendista: true });
    } else {
      soci.push({ nome: GEN_SOCIO_NAMES[i % GEN_SOCIO_NAMES.length], mestiere: m.name, patente: m.pat, ruolo: 'Socio', tipo: 'PG' });
    }
  }

  var strutture = [{ nome:'Magazzino', cost:150 }];
  if (soci.some(function(s){ return s.mestiere === 'Oste'; })) strutture.push({ nome:'Cucina', cost:70 });
  var lv2pool = DATA.strutture.filter(function(s){ return s.lv === 2; });
  if (level >= 2 && lv2pool.length) strutture.push({ nome: lv2pool[randInt(0, lv2pool.length - 1)].nome, cost:250 });

  var pats = [];
  soci.forEach(function(s){ if (!s.isApprendista && s.patente && s.patente !== '—' && pats.indexOf(s.patente) === -1) pats.push(s.patente); });
  var contratti = [];
  DATA.fornitura.forEach(function(f){
    if (contratti.length >= level) return;
    if (pats.indexOf(f.pat) !== -1) contratti.push({ patente:f.pat, cost:f.cost, rendita:f.rent });
  });
  contratti = contratti.slice(0, level);

  var fatturato = 150 + (level - 1) * 50 + contratti.reduce(function(s,c){ return s + c.rendita; }, 0);
  return {
    nome: name, livello: level, stato: 'attiva',
    settore: resp.name, cassa: 30, fatturato: fatturato, fondo: 30,
    approvazione: level === 4,
    soci: soci, strutture: strutture, contratti: contratti,
    transazioni: [], sanzioni: [], note: '', notes: ''
  };
}
function gRequisiti(d) {
  var lv = Math.min(d.livello || 1, 4);
  var soci = d.soci || [];
  var nApp = soci.filter(function(s){ return s.isApprendista; }).length;
  var resp = soci.filter(function(s){ return s.ruolo === 'Responsabile'; })[0];
  var contr = (d.contratti || []).length;
  var maxApp = (resp && resp.patente === 'P.O.E.') ? 3 : 1;
  var minSoc = lvMinSoc(lv);
  var PAT_RANK = { 'P.M.C.':1, 'P.M.T.':2, 'P.A.S.V.':3, 'P.O.E.':4 };
  var respOk = resp && lvPatente(lv) && PAT_RANK[resp.patente] && PAT_RANK[resp.patente] >= PAT_RANK[lvPatente(lv)];
  var checks = [];
  function add(cond, msg, warnOnly) { checks.push({ ok: !!cond, msg: msg, warn: !!warnOnly }); }

  add(soci.length >= minSoc, 'Livello ' + lv + ': almeno <strong>' + minSoc + ' PG soci</strong> in organico.');
  add(!!resp, 'Serve un Responsabile (★).');
  add(respOk, 'Il Responsabile deve avere la licenza minima del Livello ' + lv + ' (' + lvPatente(lv) + ' o superiore).');
  add(soci.some(function(s){ return s.ruolo === 'Mastro Artigiano'; }), 'Serve almeno un Mastro Artigiano (♦).');
  add(soci.some(function(s){ return !s.isApprendista && s.patente && s.patente !== '—'; }), 'Almeno un socio non-apprendista con una Patente valida.');
  add((d.strutture || []).some(function(s){ return s.nome === 'Magazzino'; }), 'Sede minima: Magazzino (150 Mo).');
  if (lv === 4) {
    add(!!d.approvazione, 'Grande Corporazione: <strong>approvazione</strong> della Camera di Commercio / Consiglio del Regno.');
  }
  add(contr <= lv, 'Contratti attivi ≤ Livello (max ' + lv + ').');
  add(nApp <= maxApp, 'Massimo ' + maxApp + ' apprendista/i in organico (la P.O.E. ne consente 3).');
  return { list: checks, ok: checks.filter(function(c){ return !c.ok && !c.warn; }).length === 0 };
}

function gRequisitiHtml(d) {
  var r = gRequisiti(d);
  var sospeso = d.stato === 'sospesa' || d.stato === 'sanzione';
  var html = '<div class="rule-box" style="margin-top:8px">';
  r.list.forEach(function(c) {
    var mark = c.ok ? '<span style="color:var(--green2)">✓</span>' : (c.warn ? '<span style="color:var(--amber)">⚠</span>' : '<span style="color:var(--red2)">✕</span>');
    html += '<div style="padding:2px 0;font-size:.85rem;color:var(--text2)">' + mark + ' ' + c.msg + '</div>';
  });
  html += '</div>';
  html += r.ok
    ? '<div class="note-box" style="margin-top:10px">✅ Requisiti del Livello ' + (d.livello || 1) + ' <strong>soddisfatti</strong> — la società può operare ' + (sospeso ? 'ma è ' + statoBadge(d.stato) + '.' : 'regolarmente.') + '</div>'
    : '<div class="note-box" style="margin-top:10px;border-color:rgba(192,64,64,.4)">⚠ Requisiti <strong>non completi</strong>: non puoi superare il Livello ' + (d.livello || 1) + ' finché non li soddisfi (e attenzione all\u0027ispezione U.R.V.).</div>';
  return html;
}

// ── Percorso di crescita (costi verso i livelli superiori) ──
function gPathHtml(d) {
  var lv = Math.min(d.livello || 1, 4);
  var have = {};
  (d.soci || []).forEach(function(s){ if (!s.isApprendista && s.patente && s.patente !== '—') have[s.patente] = true; });
  var html = '';
  for (var L = lv + 1; L <= 4; L++) {
    var fee = 0, parts = [];
    for (var i = lv; i < L; i++) { fee += DATA.livelli[i].fee; parts.push(DATA.livelli[i].fee + ' (L' + (i + 1) + ')'); }
    var tot = fee, notes = ['Tasse: ' + parts.join(' + ') + ' = ' + fee + ' Mo'];
    var minSoc = lvMinSoc(L);
    if ((d.soci || []).length < minSoc) notes.push(minSoc + ' PG soci richiesti');
    var pats = [];
    for (var j = lv; j < L; j++) {
      var pt = lvPatente(j);
      if (!have[pt]) { pats.push(pt + ' ' + patTotale(pt) + ' Mo'); tot += patTotale(pt); }
    }
    if (pats.length) notes.push('Patenti da acquisire: ' + pats.join(', '));
    if (L === 4 && !d.approvazione) notes.push('Approvazione Camera / Consiglio (Downtime politico)');
    html += '<div class="calc-row"><span class="label">→ L' + L + ' — ' + DATA.livelli[L - 1].name + '</span><span class="value">' + tot + ' Mo</span></div>';
    html += '<div class="calc-row" style="border-bottom:none;font-size:.74rem;color:var(--text3)"><span class="label">' + notes.join(' · ') + '</span><span class="value"></span></div>';
    for (var k = lv; k < L; k++) have[lvPatente(k)] = true;
  }
  if (!html) html = '<p style="color:var(--text3);font-size:.92rem">Sei già al livello massimo (Grande Corporazione).</p>';
  return html;
}

// ── Situazione economica (tassa 1%, apprendisti, riserva 10%) ──
function gFinanzeHtml(d) {
  var st = impresaStats(d);
  var appPG = (d.soci || []).filter(function(s){ return s.isApprendista && s.tipo === 'PG'; }).length;
  var appNPC = (d.soci || []).filter(function(s){ return s.isApprendista && s.tipo !== 'PG'; }).length;
  var html = '<div class="calc-row"><span class="label">Vendite dirette (fatturato mensile)</span><span class="value">+' + (d.fatturato || 0) + ' Mo/mese</span></div>';
  html += '<div class="calc-row"><span class="label">Rendita contratti fornitura</span><span class="value">' + (st.sospeso ? '<span style="color:var(--red2)">SOSPESA</span>' : '+' + st.rendita) + ' Mo/mese</span></div>';
  html += '<div class="calc-row"><span class="label">Lordo mensile (fatturato complessivo)</span><span class="value">' + st.lordo + ' Mo</span></div>';
  html += '<div class="calc-row"><span class="label">Tassa Camera (1% lordo)</span><span class="value" style="color:var(--red2)">-' + st.tassa + ' Mo</span></div>';
  html += '<div class="calc-row"><span class="label">Apprendisti (PG ' + appPG + ' × 20 · NPC ' + appNPC + ' × 8)</span><span class="value" style="color:var(--red2)">-' + (appPG * 20 + appNPC * 8) + ' Mo</span></div>';
  html += '<div class="calc-row"><span class="label">Fondo di Riserva (10% netto)</span><span class="value" style="color:var(--red2)">-' + st.riserva + ' Mo</span></div>';
  var lvl = Math.min(d.livello || 1, 4);
  html += '<div class="calc-row"><span class="label">Manutenzione triennale (L' + (d.livello || 1) + ')</span><span class="value" style="color:var(--amber)">' + DATA.livelli[lvl - 1].tax + ' Mo / 3 anni</span></div>';
  html += '<div class="calc-row total"><span class="label">Utile Netto Stimato</span><span class="value">' + st.netto + ' Mo/mese</span></div>';
  if (st.sospeso) html += '<div class="note-box" style="margin-top:10px">⚠ <strong>Sospensione attiva:</strong> rendita contratti e affitti azzerata fino a regolarizzazione.</div>';
  if ((d.livello || 1) >= 4) html += '<div class="note-box" style="margin-top:10px">🏯 <strong>Grande Corporazione:</strong> richiesta l\u0027approvazione della Camera di Commercio / Consiglio del Regno.</div>';
  return html;
}

// ── TOP: elenco società + azioni ──
function gTopHtml() {
  var store = trackerStore();
  var active = trackerActiveId();
  var html = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">'
    + '<button class="btn" onclick="trackerNew({}); gInit()">＋ Nuova Società</button>'
    + '<button class="btn" onclick="trackerNew(gRandomData()); gInit()">🎲 Nuova Casuale</button>'
    + '<button class="btn secondary" onclick="gImportCompany()">📂 Import Società</button>'
    + '<button class="btn secondary" onclick="gExportCompany()">💾 Export Attiva</button>'
    + '<button class="btn secondary" onclick="gExportSheet()">🖨️ Scheda Stampa</button>'
    + '<button class="btn secondary" onclick="trackerRestoreSnapshot()">↩ Snapshot</button>'
    + '<button class="btn secondary" onclick="backupAll()">💾 Backup completo</button>'
    + '<button class="btn secondary" onclick="restoreAll()">📂 Ripristina backup</button>'
    + '</div>';
  if (!store.ordine.length) {
    html += '<p style="color:var(--text3);font-size:.92rem">Nessuna società salvata: creane una nuova o generane una casuale.</p>';
    return html;
  }
  html += '<table><thead><tr><th>Società</th><th>Livello</th><th>Stato</th><th>Soci</th><th>Strutture</th><th>Contratti</th><th>Netto/mese</th><th></th></tr></thead><tbody>';
  store.ordine.forEach(function(id) {
    var t = store.imprese[id] || {};
    var st = impresaStats(t);
    var isAct = id === active;
    var emoji = (t.livello || 1) >= 4 ? ' 🏯' : ((t.livello || 1) === 3 ? ' 🏛' : ((t.livello || 1) === 2 ? ' 🔧' : ''));
    html += '<tr' + (isAct ? ' style="background:rgba(201,168,76,.12)"' : '') + '>'
      + '<td><button class="btn secondary small" onclick="gSelect(\'' + id + '\')">' + att(t.nome || 'senza nome') + emoji + '</button>' + (isAct ? ' <span style="color:var(--green2)">●</span>' : '') + '</td>'
      + '<td>L' + (t.livello || 1) + '</td>'
      + '<td>' + statoBadge(t.stato) + '</td>'
      + '<td>' + (t.soci || []).length + '</td>'
      + '<td>' + (t.strutture || []).length + '</td>'
      + '<td>' + (t.contratti || []).length + '/' + (t.livello || 1) + '</td>'
      + '<td>' + (t.nome ? st.netto + ' Mo' : '—') + '</td>'
      + '<td>' + (isAct ? '' : '<button class="btn danger small" onclick="trackerDelete(\'' + id + '\')">🗑</button>') + '</td>'
      + '</tr>';
  });
  html += '</tbody></table>';
  return html;
}
function gSelect(id) {
  var store = trackerStore();
  if (store.imprese[id]) { setTrackerActiveId(id); gInit(); }
}

// ── Scheda attiva ──
function gSchedaHtml(d) {
  var lvOpts = '';
  for (var l = 1; l <= 4; l++) lvOpts += '<option value="' + l + '" ' + (l === (d.livello || 1) ? 'selected' : '') + '>L' + l + ' — ' + DATA.livelli[l - 1].name + '</option>';
  var statoOpts = [['attiva','Attiva'],['sospesa','Sospesa'],['sanzione','In sanzione'],['sciolta','Sciolta']]
    .map(function(o){ return '<option value="' + o[0] + '" ' + (d.stato === o[0] ? 'selected' : '') + '>' + o[1] + '</option>'; }).join('');
  var mest = [];
  GEN_MESTIERI.forEach(function(m){ if (mest.indexOf(m.name) === -1) mest.push(m.name); });
  var settore = '<select id="gSettore" onchange="gSave()"><option value="">— Scegli settore —</option>'
    + mest.map(function(m){ return '<option' + (d.settore === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select>';
  var html = '<div class="calc-section"><h4>🏷 Anagrafica</h4><div class="calc-grid">'
    + '<div class="calc-field"><label>Nome Società</label><input type="text" id="gNome" value="' + att(d.nome) + '" onchange="gSave()"></div>'
    + '<div class="calc-field"><label>Livello</label><select id="gLivello" onchange="gSave()">' + lvOpts + '</select></div>'
    + '<div class="calc-field"><label>Settore</label>' + settore + '</div>'
    + '<div class="calc-field"><label class="tip" data-tip="Attiva · Sospesa (sanzione Grave) · In sanzione · Sciolta">Stato legale</label><select id="gStato" onchange="gSave()">' + statoOpts + '</select></div>'
    + '<div class="calc-field"><label>Fondo Iniziale (Mo)</label><input type="number" id="gFondo" value="' + (d.fondo || 0) + '" onchange="gSave()"></div>'
    + '<div class="calc-field"><label>Cassa (Mo)</label><input type="number" id="gCassa" value="' + (d.cassa || 0) + '" onchange="gSave()"></div>'
    + '<div class="calc-field"><label>Fatturato mensile (Mo)</label><input type="number" id="gFatt" value="' + (d.fatturato || 0) + '" onchange="gSave()"></div>'
    + '<div class="calc-field" style="justify-content:flex-end"><label class="chk tip" data-tip="Necessaria per la Grande Corporazione. Concessa dalla Camera di Commercio / Consiglio del Regno"><input type="checkbox" id="gApprov" ' + (d.approvazione ? 'checked' : '') + ' onchange="gSave()"> Approvazione Camera/Consiglio</label></div>'
    + '</div></div>';
  html += '<div class="calc-section"><h4>✅ Requisiti del Livello</h4>' + gRequisitiHtml(d) + '</div>';
  html += '<div class="calc-section"><h4>📈 Percorso di crescita</h4>' + gPathHtml(d) + '</div>';
  html += '<div class="calc-section"><h4>💵 Situazione economica</h4>' + gFinanzeHtml(d) + '</div>';
  return html;
}

function gSave() {
  var d = trackerLoad();
  function v(id) { var el = document.getElementById(id); return el ? el.value : undefined; }
  if (document.getElementById('gNome')) d.nome = v('gNome');
  if (document.getElementById('gLivello')) d.livello = parseInt(v('gLivello'), 10);
  if (document.getElementById('gSettore')) d.settore = v('gSettore');
  if (document.getElementById('gStato')) d.stato = v('gStato');
  if (document.getElementById('gFondo')) d.fondo = parseInt(v('gFondo'), 10) || 0;
  if (document.getElementById('gCassa')) d.cassa = parseInt(v('gCassa'), 10) || 0;
  if (document.getElementById('gFatt')) d.fatturato = parseInt(v('gFatt'), 10) || 0;
  if (document.getElementById('gApprov')) d.approvazione = !!document.getElementById('gApprov').checked;
  if (document.getElementById('gNotes')) d.notes = v('gNotes');
  trackerSave(d);
  gInit();
}

function gestoreShell() {
  return `
  <div class="page-hero gilde">
    <h2>🎛️ Gestore di Società</h2>
    <p>Una sola schermata per fondare, gestire e far crescere le società nel rispetto del Codice di Arcadia: requisiti dei 4 Livelli verificati in automatico (2→3→4→5 soci), tasse di espansione, manutenzione triennale, tasse (1%), riserve (10%), apprendisti, sanzioni, eventi e registro.</p>
  </div>

  <div class="doc-section" id="gTop"></div>
  <div class="doc-section" id="gScheda"></div>
  <div class="doc-section" id="gSoci"></div>
  <div class="doc-section" id="gStrutt"></div>
  <div class="doc-section" id="gContr"></div>
  <div class="doc-section" id="gTrans"></div>
  <div class="doc-section" id="gSan"></div>
  <div class="doc-section" id="gEv"></div>
  <div class="doc-section" id="gNote"></div>`;
}

function gInit() {
  if (!document.getElementById('gTop')) return;
  var d = trackerLoad();
  document.getElementById('gTop').innerHTML = gTopHtml();
  document.getElementById('gScheda').innerHTML = gSchedaHtml(d);
  document.getElementById('gSoci').innerHTML = gSociHtml(d);
  document.getElementById('gStrutt').innerHTML = gStruttHtml(d);
  document.getElementById('gContr').innerHTML = gContrHtml(d);
  document.getElementById('gTrans').innerHTML = gTransHtml(d);
  document.getElementById('gSan').innerHTML = gSanHtml(d);
  document.getElementById('gEv').innerHTML = gEvHtml(d);
  document.getElementById('gNote').innerHTML = gNoteHtml(d);
  if (typeof setupTableSort === 'function') setupTableSort();
}
var RUOLI = ['Responsabile', 'Mastro Artigiano', 'Socio', 'Apprendista'];

function gSociHtml(d) {
  var soci = d.soci || [];
  var html = '<h4>👥 Soci e dipendenti <span class="small" style="color:var(--text3)">(' + soci.length + ' in organico)</span></h4>';
  var maxApp = (soci.some(function(s){ return s.ruolo === 'Responsabile'; }) && soci.filter(function(s){ return s.ruolo === 'Responsabile'; })[0].patente === 'P.O.E.') ? 3 : 1;
  var nApp = soci.filter(function(s){ return s.isApprendista; }).length;
  var addForm = '<div class="add-row"><input type="text" id="sNome" placeholder="Nome socio" value="">'
    + '<select id="sMestiere">' + GEN_MESTIERI.map(function(m){ return '<option>' + m.name + '</option>'; }).join('') + '</select>'
    + '<select id="sPatente" onchange="sSyncPat()">' + DATA.patenti.map(function(p){ return '<option value="' + p.sigla + '">' + p.sigla + '</option>'; }).join('') + '<option value="—">—</option></select>'
    + '<select id="sRuolo">' + RUOLI.map(function(r){ return '<option>' + r + '</option>'; }).join('') + '</select>'
    + '<select id="sTipo"><option>PG</option><option>NPC</option></select>'
    + '<label class="chk"><input type="checkbox" id="sApp"> Apprendista</label>'
    + '<button class="btn" onclick="gAddSocio()">＋ Aggiungi</button></div>';
  if (nApp >= maxApp) addForm = '<div class="note-box" style="margin-bottom:8px">⚠ Limite apprendisti raggiunto (' + nApp + '/' + maxApp + '): serve un Responsabile con P.O.E. per averne 3.</div>' + addForm;
  html += addForm;
  if (!soci.length) return html + '<p style="color:var(--text3);font-size:.92rem">Nessun socio: aggiungi almeno un Responsabile, un Mastro Artigiano e altri soci (min 2).</p>';
  html += '<table><thead><tr><th>Nome</th><th>Mestiere</th><th>Patente</th><th>Ruolo</th><th>Tipo</th><th>Cost. Appr.</th><th></th></tr></thead><tbody>';
  soci.forEach(function(s, i) {
    var cost = s.isApprendista ? (s.tipo === 'PG' ? 20 : 8) + ' Mo' : '—';
    html += '<tr>'
      + '<td><input class="cell" value="' + att(s.nome) + '" onchange="gUpdSocio(' + i + ',\'nome\',this.value)"></td>'
      + '<td>' + s.mestiere + '</td>'
      + '<td><select class="cell" onchange="gUpdSocio(' + i + ',\'patente\',this.value)">' + DATA.patenti.map(function(p){ return '<option' + (s.patente === p.sigla ? ' selected' : '') + '>' + p.sigla + '</option>'; }).join('') + '<option' + (!s.patente || s.patente === '—' ? ' selected' : '') + ' value="">—</option></select></td>'
      + '<td><select class="cell" onchange="gUpdSocio(' + i + ',\'ruolo\',this.value)">' + RUOLI.map(function(r){ return '<option' + (s.ruolo === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></td>'
      + '<td><select class="cell" onchange="gUpdSocio(' + i + ',\'tipo\',this.value)"><option' + (s.tipo !== 'NPC' ? ' selected' : '') + '>PG</option><option' + (s.tipo === 'NPC' ? ' selected' : '') + '>NPC</option></select></td>'
      + '<td>' + cost + '</td>'
      + '<td><button class="btn danger small" onclick="gDelSocio(' + i + ')">✕</button></td>'
      + '</tr>';
  });
  html += '</tbody></table>';
  return html;
}
function sSyncPat() {
  var sel = document.getElementById('sMestiere');
  var patSel = document.getElementById('sPatente');
  var m = GEN_MESTIERI.filter(function(x){ return x.name === sel.value; })[0];
  if (m) patSel.value = m.pat;
}
function gAddSocio() {
  var d = trackerLoad();
  var mest = document.getElementById('sMestiere').value;
  var m = GEN_MESTIERI.filter(function(x){ return x.name === mest; })[0];
  var pat = document.getElementById('sPatente').value;
  if (!m) { pat = '—'; }
  d.soci.push({
    nome: document.getElementById('sNome').value || 'Nuovo socio',
    mestiere: mest,
    patente: pat,
    ruolo: document.getElementById('sRuolo').value,
    tipo: document.getElementById('sTipo').value,
    isApprendista: !!document.getElementById('sApp').checked
  });
  trackerSave(d); gInit();
}
function gUpdSocio(i, field, value) {
  var d = trackerLoad();
  if (d.soci[i]) { d.soci[i][field] = value; trackerSave(d); gInit(); }
}
function gDelSocio(i) {
  var d = trackerLoad();
  if (d.soci[i]) {
    d.soci.splice(i, 1);
    if (d.soci.length === 0) d.soci = [];
    trackerSave(d); gInit();
  }
}

// ── STRUTTURE ──
function gStruttHtml(d) {
  var strutt = d.strutture || [];
  var opts = DATA.strutture.map(function(s) {
    return '<option value="' + s.nome + '">' + s.nome + ' · ' + s.cost + ' Mo' + (s.lv === 2 ? ' (LV2)' : '') + '</option>';
  }).join('');
  var html = '<h4>🏗 Strutture e sedi <span class="small" style="color:var(--text3)">(' + strutt.length + ')</span></h4>';
  html += '<div class="add-row"><select id="tNome">' + opts + '</select>'
    + '<button class="btn" onclick="gAddStrutt()">＋ Acquista</button></div>';
  if (!strutt.length) return html + '<p style="color:var(--text3);font-size:.92rem">Nessuna struttura: ogni società deve partire dal Magazzino (150 Mo).</p>';
  html += '<table><thead><tr><th>Struttura</th><th>Costo</th><th>Tipo</th><th></th></tr></thead><tbody>';
  var totCost = 0;
  strutt.forEach(function(s, i) {
    var lv2 = isLv2Struttura(s.nome);
    var info = DATA.strutture.filter(function(x){ return x.nome === s.nome; })[0];
    totCost += s.cost || (info ? info.cost : 0);
    html += '<tr><td>' + att(s.nome) + (lv2 ? ' <span class="lv2-tag">LV2</span>' : '') + '</td>'
      + '<td>' + (s.cost || (info ? info.cost : '—')) + ' Mo</td>'
      + '<td>' + (info ? (info.desc || (lv2 ? 'Officina' : 'Base')) : '—') + '</td>'
      + '<td><button class="btn danger small" onclick="gDelStrutt(' + i + ')">✕</button></td></tr>';
  });
  html += '<tr class="total"><td>Totale investito</td><td>' + totCost + ' Mo</td><td></td><td></td></tr>';
  html += '</tbody></table>';
  return html;
}
function gAddStrutt() {
  var d = trackerLoad();
  var n = document.getElementById('tNome').value;
  var info = DATA.strutture.filter(function(x){ return x.nome === n; })[0];
  if (info && d.strutture.some(function(s){ return s.nome === n; })) { alert('Struttura già posseduta.'); return; }
  var cost = info ? info.cost : 0;
  d.cassa = (d.cassa || 0) - cost;
  d.strutture.push({ nome: n, cost: cost });
  d.transazioni.push({ tipo: ('Struttura: ' + n), importo: -cost, data: (new Date()).toISOString().slice(0, 10) });
  trackerSave(d); gInit();
}
function gDelStrutt(i) {
  var d = trackerLoad();
  if (d.strutture[i]) { d.strutture.splice(i, 1); trackerSave(d); gInit(); }
}

// ── CONTRATTI FORNITURA ──
function gContrHtml(d) {
  var contr = d.contratti || [];
  var max = d.livello || 1;
  var soci = d.soci || [];
  var opts = DATA.fornitura.map(function(f) {
    var has = soci.some(function(s){ return s.patente === f.pat; });
    return '<option value="' + f.pat + '|' + f.cost + '|' + f.rent + '"' + (has ? '' : ' disabled') + '>' + f.name + ' · ' + f.cost + ' Mo · ' + f.rent + ' Mo/ges</option>';
  }).join('');
  var html = '<h4>📜 Contratti di Fornitura <span class="small" style="color:var(--text3)">(' + contr.length + '/' + max + ' — max pari al Livello)</span></h4>';
  var can = contr.length < max;
  html += '<div class="add-row"><select id="cSel">' + opts + '</select>'
    + '<button class="btn" onclick="gAddContratto()" ' + (can ? '' : 'disabled') + '>＋ Stipula</button></div>';
  if (!can) html += '<div class="note-box" style="margin-top:8px">⚠ Hai raggiunto il limite di contratti pari al Livello (' + max + '). Aumenta il Livello per stipularne altri.</div>';
  if (!contr.length) return html + '<p style="color:var(--text3);font-size:.92rem">Nessun contratto attivo con la Camera del Commercio.</p>';
  html += '<table><thead><tr><th>Contratto</th><th>Patente</th><th>Costo stipula</th><th>Rendita</th><th></th></tr></thead><tbody>';
  contr.forEach(function(c, i) {
    html += '<tr><td>' + att(c.name || c.patente) + '</td><td>' + (c.patente || '') + '</td>'
      + '<td>' + (c.cost || '—') + ' Mo</td><td>+' + (c.rent || 0) + ' Mo/ges</td>'
      + '<td><button class="btn danger small" onclick="gDelContratto(' + i + ')">✕</button></td></tr>';
  });
  html += '</tbody></table>';
  return html;
}
function gAddContratto() {
  var d = trackerLoad();
  var sel = document.getElementById('cSel').value.split('|');
  if (d.contratti.length >= (d.livello || 1)) { alert('Limite contratti raggiunto (pari al Livello).'); return; }
  d.contratti.push({ patente: sel[0], cost: parseInt(sel[1], 10), rendita: parseInt(sel[2], 10), name: DATA.fornitura.filter(function(f){ return f.pat === sel[0]; })[0].name });
  d.cassa = (d.cassa || 0) - parseInt(sel[1], 10);
  d.transazioni.push({ tipo: 'Stipula contratto (' + sel[0] + ')', importo: -parseInt(sel[1], 10), data: (new Date()).toISOString().slice(0, 10) });
  trackerSave(d); gInit();
}
function gDelContratto(i) {
  var d = trackerLoad();
  if (d.contratti[i]) {
    d.transazioni.push({ tipo: 'Annullo contratto (' + (d.contratti[i].name || d.contratti[i].patente) + ')', importo: 0, data: (new Date()).toISOString().slice(0, 10) });
    d.contratti.splice(i, 1);
    trackerSave(d); gInit();
  }
}
function gTransHtml(d) {
  var tx = d.transazioni || [];
  var html = '<h4>📔 Registro Entrate/Uscite <span class="small" style="color:var(--text3)">(cassa: <strong>' + (d.cassa || 0) + ' Mo</strong>)</span></h4>';
  html += '<div class="add-row">'
    + '<input type="text" id="xDesc" placeholder="Descrizione" value="">'
    + '<input type="number" id="xImp" placeholder="Importo (+/-)" value="0">'
    + '<button class="btn primary" onclick="gAddTrans(true)">＋ Entrata</button>'
    + '<button class="btn danger" onclick="gAddTrans(false)">− Uscita</button>'
    + '<button class="btn secondary" onclick="gMese()">🗓 Chiudi mese</button>'
    + '</div>';
  html += '<div class="add-row" style="margin-top:4px">'
    + '<label class="chk"><input type="checkbox" id="xAutoRis" checked onchange="gAutoRisToggle()"> Accantonamento automatico Fondo di Riserva (10%)</label>'
    + '<label class="chk"><input type="checkbox" id="xAutoTassa" checked onchange="gAutoTassaToggle()"> Versamento tassa Camera 1%</label>'
    + '</div>';
  if (!tx.length) return html + '<p style="color:var(--text3);font-size:.92rem">Registro vuoto.</p>';
  html += '<table><thead><tr><th>Data</th><th>Voce</th><th>Importo</th><th>Cassa</th><th></th></tr></thead><tbody>';
  var tot = 0;
  var runs = tx.slice().reverse();
  runs.forEach(function(t, idx) {
    tot += (t.importo || 0);
    html += '<tr><td>' + att(t.data || '—') + '</td><td>' + att(t.tipo) + '</td>'
      + '<td style="color:' + ((t.importo || 0) < 0 ? 'var(--red2)' : 'var(--green2)') + '">' + ((t.importo || 0) > 0 ? '+' : '') + (t.importo || 0) + '</td>'
      + '<td>' + tot + '</td>'
      + '<td><button class="btn danger small" onclick="gDelTrans(' + (tx.length - 1 - idx) + ')">✕</button></td></tr>';
  });
  html += '</tbody></table>';
  return html;
}
function gAddTrans(isEntry) {
  var d = trackerLoad();
  var imp = parseInt(document.getElementById('xImp').value, 10) || 0;
  var desc = document.getElementById('xDesc').value || (isEntry ? 'Entrata' : 'Uscita');
  if (!isEntry) imp = -Math.abs(imp);
  if (imp === 0) { alert('Importo nullo.'); return; }
  d.cassa = (d.cassa || 0) + imp;
  d.transazioni.push({ tipo: desc, importo: imp, data: (new Date()).toISOString().slice(0, 10) });
  trackerSave(d); gInit();
}
function gDelTrans(i) {
  var d = trackerLoad();
  if (d.transazioni[i]) {
    d.cassa = (d.cassa || 0) - (d.transazioni[i].importo || 0);
    d.transazioni.splice(i, 1);
    trackerSave(d); gInit();
  }
}
function gMese() {
  var d = trackerLoad();
  var st = impresaStats(d);
  var res = [];
  if (document.getElementById('xAutoTassa') && document.getElementById('xAutoTassa').checked) {
    d.cassa = (d.cassa || 0) - st.tassa;
    res.push({ tipo: 'Tassa Camera 1%', importo: -st.tassa });
  }
  var appCost = st.apprCost;
  if (appCost) { d.cassa = (d.cassa || 0) - appCost; res.push({ tipo: 'Costi apprendisti', importo: -appCost }); }
  if (document.getElementById('xAutoRis') && document.getElementById('xAutoRis').checked && st.riserva) {
    var f = d.fondo || 0;
    d.fondo = f + st.riserva;
    res.push({ tipo: '→ Fondo di Riserva 10%', importo: -st.riserva });
  }
  if (!st.sospeso) {
    d.cassa = (d.cassa || 0) + st.lordo;
    res.push({ tipo: 'Vendite + contratti', importo: st.lordo });
  }
  res.forEach(function(r) {
    d.transazioni.push({ tipo: r.tipo, importo: r.importo, data: (new Date()).toISOString().slice(0, 10) });
  });
  var tick = 'Mese chiuso: ' + (st.sospeso ? 'cassa bloccata (sospensione) — ' : 'incassati ' + st.lordo + ' Mo');
  alert(tick);
  trackerSave(d); gInit();
}

// ── SANZIONI (meccanica U.R.V.) ──
function gSanHtml(d) {
  var san = d.sanzioni || [];
  var attive = san.filter(function(s){ return s.stato !== 'regolarizzata' && s.stato !== 'decaduta'; });
  var html = '<h4>⚖ Sanzioni e Ispezioni U.R.V.</h4>';
  if (attive.length) {
    html += '<div class="calc-row" style="margin-bottom:6px"><span class="label">Stato vigente</span><span class="value">' + statoBadge(d.stato) + '</span></div>';
  }
  html += '<div class="add-row"><select id="sanSel">'
    + DATA.sanzioni.map(function(s, i){ return '<option value="' + i + '">' + s.name + ' (' + s.multa + ' Mo · ' + (s.sosp && s.sosp !== '—' ? s.sosp : '') + ')</option>'; }).join('')
    + '</select>'
    + '<button class="btn" onclick="gAddSanzione()">＋ Applica sanzione</button>'
    + '</div>';
  if (!san.length) return html + '<p style="color:var(--text3);font-size:.92rem">Nessuna sanzione registrata. Società pulita.</p>';
  html += '<table><thead><tr><th>Sanzione</th><th>Tipo</th><th>Penale</th><th>Stato</th><th></th></tr></thead><tbody>';
  san.forEach(function(s, i) {
    html += '<tr><td>' + att(s.name || s.tipo) + '</td><td>' + att(s.tipo) + '</td><td>' + (s.penal || 0) + ' Mo</td>'
      + '<td>' + att(s.stato) + '</td>'
      + '<td>' + (s.stato === 'attiva' && s.tipo !== 'Gravissima' ? '<button class="btn small" onclick="gRegolarizza(' + i + ')">✔ Paga</button>' : '') + ' <button class="btn danger small" onclick="gDelSanzione(' + i + ')">✕</button></td></tr>';
  });
  html += '</tbody></table>';
  return html;
}
function gAddSanzione() {
  var d = trackerLoad();
  var idx = parseInt(document.getElementById('sanSel').value, 10);
  var s = DATA.sanzioni[idx];
  if (!s) return;
  if (s.tipo === 'Gravissima') {
    if (!confirm('Sanzione GRAVISSIMA: scioglimento della società ' + (d.nome || '') + ', confisca della cassa' + ((d.livello || 1) >= 4 ? ' e revoca dell\u0027approvazione della Camera' : '') + '. Procedere?')) return;
    d.sanzioni.push({ tipo: s.tipo, name: s.name, penal: s.multa || 0, desc: s.effetto, stato: 'attiva' });
    d.cassa = 0;
    if ((d.livello || 1) >= 4) d.approvazione = false;
    d.stato = 'sciolta';
    trackerSave(d); gInit();
    alert('La società è stata sciolta: cassa confiscata' + ((d.livello || 1) >= 4 ? ', approvazione revocata.' : '.') + ' Puoi ricostituirla da zero o crearne un\u0027altra.');
    return;
  }
  var dPen = s.multa || 0;
  d.sanzioni.push({ tipo: s.tipo, name: s.name, penal: dPen, desc: s.effetto, stato: 'attiva' });
  if (s.tipo === 'Grave') { d.stato = 'sospesa'; }
  d.cassa = Math.max(0, (d.cassa || 0) - dPen);
  d.transazioni.push({ tipo: 'Penale ' + s.name, importo: -dPen, data: (new Date()).toISOString().slice(0, 10) });
  trackerSave(d); gInit();
}
function gRegolarizza(i) {
  var d = trackerLoad();
  var s = d.sanzioni[i];
  if (!s) return;
  var pay = s.penal || 0;
  d.cassa = Math.max(0, (d.cassa || 0) - pay);
  d.transazioni.push({ tipo: 'Risarcimento ' + (s.name || s.tipo), importo: -pay, data: (new Date()).toISOString().slice(0, 10) });
  s.stato = 'regolarizzata';
  if (d.stato === 'sospesa' || d.stato === 'sanzione') d.stato = 'attiva';
  trackerSave(d); gInit();
}
function gDelSanzione(i) {
  var d = trackerLoad();
  if (d.sanzioni[i]) d.sanzioni.splice(i, 1);
  trackerSave(d); gInit();
}

// ── EVENTI STAGIONALI ──
function gEvHtml(d) {
  var html = '<h4>🎲 Eventi stagionali <span class="small" style="color:var(--text3)">(d20 + 2 per Livello)</span></h4>';
  html += '<div class="add-row"><button class="btn" onclick="gRoll()">🎲 Tira d20 per l\u0027evento</button></div>';
  html += '<p style="color:var(--text3);font-size:.9rem;margin-top:6px">A ogni stagione tira il dado: il risultato indica l\u0027evento che coinvolge la società (tabella nella guida). Molti eventi chiedono una parata o una penale: trascrivi l\u0027esito nel registro.</p>';
  return html;
}
function gRoll() {
  var d = trackerLoad();
  var raw = randInt(1, 20);
  var bonus = 2 * (d.livello || 1);
  var roll = raw + bonus;
  function match(item) {
    var r = item.range;
    if (r === '19+') return roll >= 19;
    var m = r.split('\u2013');
    var min = parseInt(m[0], 10), max = m[1] ? parseInt(m[1], 10) : min;
    return roll >= min && roll <= max;
  }
  var e = DATA.tiriEvento.filter(match)[0] || null;
  var msg = 'd20 + 2×Liv' + (d.livello || 1) + ' = ' + raw + ' + ' + bonus + ' → ' + roll + '\n\n';
  if (e) msg += e.nome + ' (' + e.range + '):\n' + e.effetto;
  else msg += 'Lunga pace: nessun evento degno di nota.';
  alert(msg);
}

// ── NOTE ──
function gNoteHtml(d) {
  return '<h4>📝 Note libere</h4>'
    + '<textarea id="gNotes" rows="4" style="width:100%;resize:vertical" onchange="gSave()">' + att(d.notes || '') + '</textarea>'
    + '<p style="color:var(--text3);font-size:.88rem;margin-top:4px">Memorizza accordi, legami, obiettivi e cronaca della società. Il salvataggio è automatico a ogni uscita dal campo.</p>';
}
function gExportCompany() {
  var d = trackerLoad();
  if (!d.nome) { alert('Nessuna società attiva da esportare.'); return; }
  downloadJson(d, 'societa_' + d.nome.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.json');
}
function gImportCompany() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var d = JSON.parse(ev.target.result);
        if (!d || typeof d !== 'object' || !('nome' in d)) { alert('File non valido: serve un oggetto società.'); return; }
        d = Object.assign({}, TRACKER_DEFAULT, d);
        d.sanzioni = Array.isArray(d.sanzioni) ? d.sanzioni : [];
        d.transazioni = Array.isArray(d.transazioni) ? d.transazioni : [];
        var n = (d.nome || 'Importata') + ' (importata)';
        var id = trackerNew(d);
        var store = trackerStore();
        store.imprese[id].nome = n;
        localStorage.setItem(TRACKER_KEY, JSON.stringify(store));
        gInit();
        alert('Società importata come "' + n + '".');
      } catch(err) { alert('File JSON non valido.'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ── Scheda stampabile (export HTML) ──
function gExportSheet() {
  var data = trackerLoad();
  if (!data.nome) { alert('Nessuna società attiva: creane una prima di esportare la scheda.'); return; }
  var st = impresaStats(data);
  var statoLabels = { attiva:'Attiva', sospesa:'Sospesa', sanzione:'In sanzione', sciolta:'Sciolta' };
  var printContent = '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Scheda '+escHtml(data.nome)+'</title><style>body{font-family:Georgia,serif;color:#222;max-width:700px;margin:0 auto;padding:30px;line-height:1.5}h1{font-size:1.6rem;border-bottom:2px solid #333;padding-bottom:6px;margin-bottom:4px}h2{font-size:1rem;color:#555;margin-top:20px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #ccc;padding-bottom:4px}.meta{color:#888;font-size:.85rem;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:.88rem}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f5f0e8}.total{font-weight:bold;border-top:2px solid #333}.note{color:#666;font-style:italic;font-size:.82rem;margin-top:20px}.badge{display:inline-block;border:1px solid #999;border-radius:10px;padding:1px 8px;font-size:.8rem}</style></head><body>';
  printContent += '<h1>🎛️ '+escHtml(data.nome)+'</h1>';
  printContent += '<p class="meta">'+DATA.livelli[Math.min((data.livello||1),4)-1].name+' · Livello '+(data.livello||1)+' · Settore: '+escHtml(data.settore||'—')+' · Camera del Commercio di Arcadia<br>Stato legale: <span class="badge">'+(statoLabels[data.stato]||'Attiva')+'</span>'+(st.sospeso?' <span class="badge" style="border-color:#c00;color:#c00">CONTRATTI SOSPESI</span>':'')+'</p>';
  printContent += '<h2>📋 Soci</h2><table><thead><tr><th>Nome</th><th>Mestiere</th><th>Patente</th><th>Ruolo</th><th>Tipo</th></tr></thead><tbody>';
  (data.soci||[]).forEach(function(s) { printContent += '<tr><td>'+escHtml(s.nome)+'</td><td>'+escHtml(s.mestiere)+'</td><td>'+escHtml(s.patente||'—')+'</td><td>'+(s.ruolo||'Socio')+'</td><td>'+(s.tipo||'PG')+'</td></tr>'; });
  if (!(data.soci||[]).length) printContent += '<tr><td colspan="5" style="color:#999">Nessun socio</td></tr>';
  printContent += '</tbody></table>';
  printContent += '<h2>🏗️ Sede</h2><table><thead><tr><th>Struttura</th><th>Costo</th></tr></thead><tbody>';
  (data.strutture||[]).forEach(function(s) { printContent += '<tr><td>'+escHtml(s.nome)+'</td><td>'+s.cost+' Mo</td></tr>'; });
  if (!(data.strutture||[]).length) printContent += '<tr><td colspan="2" style="color:#999">Nessuna struttura</td></tr>';
  printContent += '</tbody></table>';
  printContent += '<h2>💵 Finanziario</h2><table><tr><td>Fondo iniziale</td><td>'+(data.fondo||DATA.fondi.init)+' Mo</td></tr><tr><td>Cassa</td><td><strong>'+(data.cassa||0)+' Mo</strong></td></tr><tr><td>Fatturato mensile</td><td>'+(data.fatturato||0)+' Mo</td></tr><tr><td>Rendita contratti fornitura</td><td>'+(st.sospeso?'<span style="color:#c00">SOSPESA</span>':'+'+st.rendita)+' Mo/mese</td></tr><tr><td>Tassa Camera (1% lordo)</td><td>-'+st.tassa+' Mo</td></tr><tr><td>Costi apprendisti (PG20/NPC8)</td><td>-'+st.apprCost+' Mo</td></tr><tr><td>Fondo di Riserva (10%)</td><td>-'+st.riserva+' Mo</td></tr><tr class="total"><td>Utile Netto Stimato</td><td>'+st.netto+' Mo/mese</td></tr></table>';
  printContent += '<h2>📜 Contratti Attivi</h2><table><thead><tr><th>Patente</th><th>Investimento</th><th>Rendita/mese</th></tr></thead><tbody>';
  (data.contratti||[]).forEach(function(c) { printContent += '<tr><td>'+escHtml(c.patente)+'</td><td>'+(c.cost||'—')+' Mo</td><td>'+(st.sospeso?'<span style="color:#c00">—</span>':'+'+c.rendita+' Mo')+'</td></tr>'; });
  if (!(data.contratti||[]).length) printContent += '<tr><td colspan="3" style="color:#999">Nessun contratto</td></tr>';
  printContent += '</tbody></table>';
  if ((data.sanzioni||[]).length) {
    printContent += '<h2>⚖️ Sanzioni U.R.V.</h2><table><thead><tr><th>Sanzione</th><th>Stato</th></tr></thead><tbody>';
    (data.sanzioni||[]).forEach(function(s) { printContent += '<tr><td>'+escHtml(s.name||s.tipo)+'</td><td>'+escHtml(s.stato)+'</td></tr>'; });
    printContent += '</tbody></table>';
  }
  if ((data.transazioni||[]).length) printContent += '<h2>🧾 Registro</h2><div style="font-size:.85rem">Ultime voci: '+(data.transazioni||[]).slice(-8).reverse().map(function(v){ return escHtml(v.data||'?')+' '+escHtml(v.tipo)+' '+(v.importo>0?'+':'')+v.importo+' Mo'; }).join(' · ')+'</div>';
  if (data.notes) printContent += '<h2>📌 Note</h2><p style="font-size:.88rem">'+escHtml(data.notes)+'</p>';
  printContent += '<p class="note">Documento generato da Società & Licenze di Arcamis · '+new Date().toLocaleDateString('it-IT')+'</p></body></html>';
  var win = window.open('', '_blank');
  win.document.write(printContent);
  win.document.close();
  setTimeout(function() { win.print(); }, 300);
}

// ── Backup completo / ripristino ──
function backupAll() {
  var data = {
    imprese: trackerStore(),
    patenti: loadPatenti(),
    pianificatore: loadPlan(),
    theme: localStorage.getItem('arcamis_theme'),
    versione: 'gestore-v1'
  };
  downloadJson(data, 'arcamis_backup.json');
}
function restoreAll() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var d = JSON.parse(ev.target.result);
        if (d.imprese && d.imprese.imprese) { localStorage.setItem(TRACKER_KEY, JSON.stringify(d.imprese)); }
        if (Array.isArray(d.patenti)) { localStorage.setItem(PATENTI_STORE_KEY, JSON.stringify(d.patenti)); }
        if (Array.isArray(d.pianificatore)) { localStorage.setItem(PLAN_KEY, JSON.stringify(d.pianificatore)); }
        if (d.theme) { localStorage.setItem('arcamis_theme', d.theme); }
        if (typeof applyTheme === 'function') applyTheme();
        gInit();
        alert('Backup ripristinato con successo.');
      } catch(err) { alert('File JSON non valido.'); }
    };
    reader.readAsText(file);
  };
  input.click();
}
function downloadJson(obj, filename) {
  var blob = new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Pianificatore (legacy, mantenuto per backup) ──
var PLAN_KEY = 'arcamis_pianificatore';
function loadPlan() {
  try { var p = JSON.parse(localStorage.getItem(PLAN_KEY)); return Array.isArray(p) ? p : []; }
  catch(e) { return []; }
}
function savePlan(p) { localStorage.setItem(PLAN_KEY, JSON.stringify(p)); }
