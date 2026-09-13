// ════════════════════════════════════════════════
//  APP — Società & Licenze di Arcamis
//  State, render, ricerca, theme, tracker patenti
// ════════════════════════════════════════════════
// ════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════
var currentPage = 'gilde'; // 'gilde' | 'licenze'
var currentSection = 'panoramica';

function abbr(s) {
  var m = TIP_SIGLE[s];
  return m ? '<span class="tip" data-tip="'+m+'">'+s+'</span>' : s;
}
function patBtn(sigla) {
  var p = DATA.patenti.filter(function(x){ return x.sigla === sigla; })[0];
  if (!p) return abbr(sigla);
  return '<button class="patente-badge '+p.cls.replace('row-','pat-')+' tip" data-tip="Vai alla Patente '+sigla+'" onclick="goto(\u0027licenze\u0027,\u0027'+p.sezione+'\u0027)">'+sigla+'</button>';
}
function patLink(sigla) {
  var p = DATA.patenti.filter(function(x){ return x.sigla === sigla; })[0];
  if (!p) return abbr(sigla);
  return '<button class="pat-link tip" data-tip="Vai alla Patente '+sigla+'" onclick="goto(\u0027licenze\u0027,\u0027'+p.sezione+'\u0027)">'+sigla+'</button>';
}
function secId(pg, sec) { return 'sec-' + sec + (pg === 'licenze' ? '-lic' : ''); }

function goto(pg, sec) {
  if (PAGES.indexOf(pg) === -1) pg = 'gilde';
  closeModal();
  currentPage = pg;
  currentSection = sec || 'panoramica';
  if (!document.getElementById(secId(pg, currentSection))) render();
  markSidebarActive();
  if (sec) scrollToId(secId(pg, sec)); else scrollTop();
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

//  HELPERS
// ════════════════════════════════════════════════
function sectionTitle(icon, label) {
  return `<div class="doc-section-title">${icon} ${label}</div>`;
}
function tableWrap(inner) { return `<div class="table-wrap">${inner}</div>`; }
function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

//  SEARCH / FILTER / SORT
// ════════════════════════════════════════════════
let searchState = { query: '', filters: {} };

function setupGlobalSearch() {
  const input = document.getElementById('globalSearch');
  if (!input) return;
  input.value = searchState.query;
  input.oninput = (e) => {
    searchState.query = e.target.value.toLowerCase();
    applyGlobalSearch();
  };
  input.onkeydown = (e) => { if (e.key === 'Escape') { input.value = ''; searchState.query = ''; applyGlobalSearch(); input.blur(); }};
}

function applyGlobalSearch() {
  const content = document.getElementById('content');
  const query = searchState.query;
  const filterEl = document.getElementById('activeFilters');

  const filterCount = Object.keys(searchState.filters).length;
  filterEl.innerHTML = (query || filterCount)
    ? `<span class="filter-badge">Filtri attivi: ${query ? `testo "${query}"` : ''}${query && filterCount ? ' + ' : ''}${filterCount > 0 ? `${filterCount} colonna/e` : ''} <button onclick="clearAllFilters()" title="Clear all">✕</button></span>`
    : '';

  if (!query && filterCount === 0) {
    content.querySelectorAll('.highlight').forEach(el => el.outerHTML = el.innerHTML);
    content.querySelectorAll('tbody tr').forEach(tr => tr.style.display = '');
    return;
  }

  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach(node => {
    if (node.parentElement.closest('table') || node.parentElement.closest('script') || node.parentElement.closest('style')) return;
    const text = node.textContent;
    if (!query) return;
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    if (!lower.includes(q)) return;
    const frag = document.createDocumentFragment();
    let last = 0, idx;
    while ((idx = lower.indexOf(q, last)) !== -1) {
      if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
      const mark = document.createElement('mark');
      mark.className = 'highlight';
      mark.textContent = text.slice(idx, idx + q.length);
      frag.appendChild(mark);
      last = idx + q.length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });

  content.querySelectorAll('tbody tr').forEach(tr => {
    const text = tr.textContent.toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const matchesFilters = Object.entries(searchState.filters).every(([colIdx, val]) => {
      const cell = tr.cells[colIdx];
      return !cell || !val || cell.textContent.toLowerCase().includes(val);
    });
    tr.style.display = (matchesQuery && matchesFilters) ? '' : 'none';
  });
}

function clearAllFilters() {
  searchState.query = '';
  searchState.filters = {};
  const input = document.getElementById('globalSearch');
  if (input) input.value = '';
  applyGlobalSearch();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setupTableSort() {
  document.querySelectorAll('thead th').forEach((th, colIdx) => {
    if (th.classList.contains('sortable')) return;
    th.classList.add('sortable');
    th.onclick = () => sortTable(th, colIdx);
  });
  document.querySelectorAll('table').forEach(table => {
    if (table.querySelector('.table-filter-row')) return;
    const thead = table.querySelector('thead');
    if (!thead || !thead.rows[0]) return;
    const filterRow = document.createElement('tr');
    filterRow.className = 'table-filter-row';
    thead.rows[0].querySelectorAll('th').forEach((th, i) => {
      const td = document.createElement('td');
      td.style.padding = '4px 12px';
      const input = document.createElement('input');
      input.type = 'search';
      input.placeholder = 'Filtra...';
      input.style.width = '100%';
      input.oninput = (e) => {
        searchState.filters[i] = e.target.value.toLowerCase() || null;
        if (!e.target.value) delete searchState.filters[i];
        applyGlobalSearch();
      };
      td.appendChild(input);
      filterRow.appendChild(td);
    });
    thead.appendChild(filterRow);
  });
}

function sortTable(th, colIdx) {
  const table = th.closest('table');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.rows);
  const isAsc = th.classList.contains('sort-asc');

  table.querySelectorAll('thead th').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
  th.classList.add(isAsc ? 'sort-desc' : 'sort-asc');

  const direction = isAsc ? -1 : 1;
  const getCellValue = (row, idx) => row.cells[idx]?.textContent.trim() || '';

  rows.sort((a, b) => {
    const aVal = getCellValue(a, colIdx);
    const bVal = getCellValue(b, colIdx);
    const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
    const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));
    if (!isNaN(aNum) && !isNaN(bNum)) return (aNum - bNum) * direction;
    return aVal.localeCompare(bVal, 'it', {numeric: true}) * direction;
  });

  rows.forEach(row => tbody.appendChild(row));
}

// ════════════════════════════════════════════════
//  RENDER GILDE
// ════════════════════════════════════════════════
const RENDER_GILDE = {

// ─────────────────────────────────────────────
panoramica: () => `
  <div class="page-hero gilde">
    <h2>🏛️ Le Imprese di Arcadia<br><small class="hero-sub">Camera del Commercio e dei Mestieri — Regno di Arcadia</small></h2>
    <p><strong style="color:var(--gold)">Che cos'è un'Impresa?</strong> Un'Impresa è l'unione di due o più personaggi che condividono una cassa comune e una sede fisica per produrre e vendere il frutto dei propri mestieri.</p>
    <p>Il percorso di crescita è strutturato in <strong style="color:var(--gold)">4 livelli progressivi</strong>: si parte da una semplice <strong style="color:var(--gold)">Bottega Artigiana</strong> per evolversi, passo dopo passo, fino a diventare una <strong style="color:var(--gold)">Grande Corporazione</strong>. Il meccanismo di avanzamento è diretto e intuitivo: versando la tassa di espansione richiesta, l'Impresa ingrandisce la propria sede e sblocca immediatamente nuovi benefici e privilegi.</p>
    <div class="hero-links">
      ${DATA.patenti.map(p => `<button class="hero-link-btn" onclick="goto('licenze','${p.sezione}')">${p.sigla} · ${p.nome}</button>`).join('')}
    </div>
  </div>

  <div class="doc-section">
    ${sectionTitle('📋', 'Come Creare un\u0027Impresa')}
    <div class="rule-box">
      <h4>🏦 Dove si fa la pratica</h4>
      <p>I personaggi interessati devono recarsi <strong>al Castello</strong> e parlare con il <strong>Reparto Finanze</strong>. È l\u0027unico ufficio che rilascia le licenze di esercizio e registra le nuove Imprese nel Libro delle Corporazioni.</p>
    </div>

    <div class="rules-grid">
      <div class="rule-box">
        <h4>👥 Requisiti minimi (Livello 1 — Bottega Artigiana)</h4>
        <ul>
          <li>Almeno <strong>2 PG</strong>: il Responsabile e almeno un socio</li>
          <li>Un <strong>Responsabile</strong> con la patente <strong>${patLink('P.M.C.')}</strong></li>
          <li>Almeno un socio non-apprendista con una <strong>Patente valida</strong></li>
          <li>Una <strong>sede fisica modesta</strong>: Magazzino (300 Mo) o locale di quartiere</li>
        </ul>
      </div>
      <div class="rule-box">
        <h4>💰 Costi di fondazione</h4>
        <ul>
          <li><strong>Tassa di costituzione</strong> (una tantum): <span class="nw">${DATA.livelli[0].feeRange} Mo</span></li>
          <li><strong>Sede fisica modesta</strong> (es. Magazzino): <span class="nw">300 Mo</span></li>
          <li><strong>Fondo iniziale</strong> per la cassa comune: <span class="nw">${DATA.fondi.init} Mo</span></li>
          <li><strong>Manutenzione triennale</strong>: <span class="nw">${DATA.livelli[0].tax} Mo ogni 3 anni</span></li>
          <li style="color:var(--amber)">Totale minimo: <span class="nw">~${DATA.livelli[0].fee + 300 + DATA.fondi.init} Mo</span> subito, più <span class="nw">${DATA.livelli[0].tax} Mo ogni 3 anni</span>.</li>
        </ul>
      </div>
      <div class="rule-box">
        <h4>📝 Cosa portare al Castello</h4>
        <ul>
          <li>I <strong>personaggi</strong> presenti con le loro patenti</li>
          <li>La <strong>lista dei soci</strong> con nome, mestiere, ruolo e patente</li>
          <li>Il <strong>fondo comune</strong> in Mo (cassa + investimenti)</li>
          <li>La <strong>scelta del settore</strong> (mestiere principale dell\u0027Impresa)</li>
        </ul>
      </div>
      <div class="rule-box">
        <h4>⚠️ Note importanti</h4>
        <ul>
          <li>La <strong>tassa si paga una volta</strong> al momento della fondazione</li>
          <li>Il <strong>Fondo Iniziale</strong> (30 Mo) è separato dalla cassa</li>
          <li>Gli <strong>apprendisti</strong> costano 8 Mo/NPC o 20 Mo/PG al mese</li>
          <li>La <strong>tassa Camera</strong> è dell\u00271% sul fatturato lordo mensile</li>
        </ul>
      </div>
    </div>

    <div class="note-box">
      💡 <strong>Suggerimento:</strong> usa il <strong>Gestore di Società</strong> per simulare la creazione e verificare che tutti i requisiti siano soddisfatti prima di andare al Castello. Puoi anche generare un\u0027Impresa casuale con il pulsante 🎲 per avere un\u0027ispirazione.
    </div>

    <div class="note-box">
      🏷️ <strong>Scelta del settore:</strong> è il <strong>mestiere principale</strong> dell'Impresa (quello del Responsabile). <strong>Non vincola per sempre</strong>: ogni nuovo socio porta il suo mestiere e, col tempo, l'Impresa può allargarsi fino a diventare <strong>plurisettoriale</strong>.
    </div>
  </div>

  <div class="doc-section">
    ${sectionTitle('⚖️', 'I 4 Livelli in Sintesi')}
    <div class="note-box">💡 <strong>Regola d'oro:</strong> sali di livello quando hai soddisfatto i requisiti e paghi la tassa di espansione. Più è alto il Livello, più privilegi ottieni — ma anche più controlli. Ogni sigla è un pulsante: il gioco è <strong>intrecciato con le Patenti</strong>, clicca per approfondire.</div>
    <div class="lv-mini-grid">
      ${DATA.livelli.map(l => `
        <button class="lv-mini ${dataCls(l.patente).replace('row-', 'pat-')}" onclick="setSection('gilde','livelli')">
          <span class="lv-mini-num">Livello ${l.id}</span>
          <span class="lv-mini-name">${l.name}</span>
          <span class="lv-mini-pat">${l.patente}</span>
          <span class="lv-mini-motto">${l.motto.replace(/<[^>]+>/g, '')}</span>
        </button>`).join('')}
    </div>
  </div>
`,
// ─────────────────────────────────────────────
livelli: () => `
  <div class="page-hero gilde">
    <h2>🏪 I 4 Livelli dell'Impresa</h2>
    <p>Ogni Impresa parte da una <strong>Bottega Artigiana</strong>. Salendo di livello si amplia la sede produttiva, si aumenta il personale e si sbloccano <strong>più benefici meccanici</strong>; crescono anche i requisiti, le tasse di manutenzione e i controlli.</p>
  </div>

  <div class="lv-grid">
  ${DATA.livelli.map(l => `
  <div class="impresa-card">
    <div class="impresa-header">
      <h3>Livello ${l.id} — ${l.name}</h3>
      ${l.patente ? patBtn(l.patente) : ''}
      ${l.id === 4 ? '<span class="tip pat-poe" data-tip="Approvazione istituzionale, oltre alla patente" style="font-size:.9rem;padding:4px 10px;border-radius:12px">🏛 Approvazione</span>' : ''}
    </div>
    <div class="impresa-body">
      <div class="info-block">
        <p><strong>Costo ${l.id === 1 ? 'di costituzione' : 'di upgrade'}${l.id > 1 ? ' (dal livello ' + (l.id - 1) + ')' : ''}:</strong> <span class="nw">${l.feeRange} Mo</span></p>
        ${l.id > 1 ? '<p><strong>Investimento cumulativo in tasse al Livello ' + l.id + ':</strong> <span class="nw">' + l.sumFee + ' Mo</span></p>' : ''}
        <p><strong>Manutenzione triennale:</strong> <span class="nw">${l.taxRange} Mo ogni 3 anni</span></p>
        <p><strong>Sede fisica:</strong> ${l.sede}</p>
        <h5>Requisiti</h5>
        <ul class="limit-list">${l.requisiti.map(r => '<li>' + r + '</li>').join('')}</ul>
      </div>
      <div class="info-block">
        <h5>Benefici meccanici</h5>
        <ul class="benefit-list">${l.benefici.map(b => '<li>' + b + '</li>').join('')}</ul>
      </div>
    </div>
  </div>`).join('')}
</div>

  <div class="note-box">⚠ <strong>Le tasse di costituzione / upgrade si sommano:</strong> per arrivare alla Grande Corporazione servono ${DATA.livelli.map(l => l.feeRange).join(' + ')} ≈ <strong>${DATA.livelli[3].sumFee} Mo</strong> cumulativi (tasse di struttura). A queste si aggiungono le <strong>manutenzioni triennali</strong> di ogni Livello e una <strong>sede adeguata</strong>. Il Fondo Iniziale di <strong>${DATA.fondi.init} Mo</strong> è separato dalla cassa.</div>

  <div class="doc-section">
    ${sectionTitle('🧮', 'Esempio Pratico — La Bottega dei Martelli')}
    <div class="rule-box">
      <p>Un percorso concreto, passo dopo passo:</p>
      <p><strong style="color:var(--gold2)">L1 — Bottega Artigiana:</strong> Aldric (Responsabile, P.M.C. 50 Mo) e Brenna (Socia, P.M.C. 50 Mo). Costituzione 100 Mo + Magazzino 300 Mo + Fondo 30 Mo = <strong>430 Mo</strong>; manutenzione triennale 15 Mo.</p>
      <p><strong style="color:var(--gold2)">L2 — Fondaco / Officina (dopo ~3 mesi):</strong> +625 Mo di upgrade + P.M.T. per il Responsabile 110 Mo = <strong>+735 Mo</strong> (totale investito ~1.165 Mo). Apertura a un terzo socio: si lavora in 3.</p>
      <p><strong style="color:var(--gold2)">L3 — Compagnia Commerciale (dopo ~6 mesi):</strong> +3.000 Mo di upgrade + P.A.S.V. 180 Mo = <strong>+3.180 Mo</strong> (totale ~4.345 Mo). Un quarto socio apre agli appalti del Regno e alle licenze scontate.</p>
      <p><strong style="color:var(--gold2)">L4 — Grande Corporazione (il grande salto):</strong> +12.500 Mo di upgrade + P.O.E. 400 Mo + approvazione della Camera = <strong>+12.900 Mo</strong> (totale ≈ <strong>17.245 Mo</strong>). In cambio: sconto massivo sulle risorse, influenza politica e (a scelta del gruppo) monopoli.</p>
      <p class="txt-note">I numeri sono indicativi: usate i valori centrali dei range e adattateli alla vostra campagna.</p>
    </div>
  </div>
`,
// ─────────────────────────────────────────────
procedura: () => `
  <div class="page-hero gilde">
    <h2>📜 Come si fonda e si gestisce</h2>
    <p>Tutto quello che serve per creare e far funzionare un'Impresa, in pochi passi.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('📜', 'Passo 1 — Fondazione')}
    <p class="txt-intro">Per fondare: <strong>soci</strong> (2-6), una <strong>patente</strong> valida, una <strong>sede</strong>, e l'<strong>Atto Costitutivo</strong> (documento con nome, mestieri, quote e Responsabile).</p>
    ${tableWrap(`<table>
      <thead><tr><th>Cosa serve</th><th>Costo</th></tr></thead>
      <tbody>
        <tr><td>Tassa di costituzione (Bottega Artigiana)</td><td><strong><span class="nw">${DATA.livelli[0].feeRange} Mo</span></strong></td></tr>
        <tr><td>Sede minima: Magazzino (o locale modesto)</td><td><strong><span class="nw">300 Mo</span></strong></td></tr>
        <tr><td>Fondo Iniziale (cassa comune)</td><td><strong><span class="nw">${DATA.fondi.init} Mo</span></strong></td></tr>
      </tbody>
    </table>`)}
    <p class="txt-note">Presenti l'Atto alla Camera del Commercio, paghi, e ricevi il <strong>Certificato</strong> e il <strong>Timbro d'Impresa</strong>. Un socio può entrare/uscire in seguito (ingresso: voto di 2/3 dei soci, 20 Mo).</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('💰', 'Passo 2 — Gestione semplice')}
    ${tableWrap(`<table>
      <thead><tr><th>Voce</th><th>Regola</th></tr></thead>
      <tbody>
        <tr><td>Registro Entrate/Uscite</td><td>Tienilo aggiornato: l'${abbr('U.R.V.')} può chiederlo. <button class="btn secondary small" onclick="goto('gilde','gestore')">📗 Apri Gestore</button></td></tr>
        <tr><td>Fondo di Riserva</td><td>Accantona il <strong>10%</strong> dei profitti mensili.</td></tr>
        <tr><td>Tassa alla Camera</td><td><strong>1% del fatturato complessivo</strong> (vendite + contratti + affitti), trimestrale (esente i primi 3 mesi).</td></tr>
        <tr><td>Apprendisti</td><td>PG LV1 o NPC assunti. Non firmano documenti legali. Costi: NPC 8 Mo/mese, PG 20 Mo/mese.</td></tr>
      </tbody>
    </table>`)}
  </div>

  <div class="doc-section">
    ${sectionTitle('🏗️', 'Passo 3 — Sede e Strutture')}
    <p class="txt-intro">Le strutture della sede danno <strong>bonus concreti</strong>. Le LV1 sono economiche; le LV2 costano 250 Mo ciascuna e danno un <strong>bonus meccanico di classe per un PG, una volta per Riposo Lungo</strong> (tematico per ogni struttura).</p>
    ${tableWrap(`<table>
      <thead><tr><th>Struttura</th><th>Liv</th><th style="text-align:right">Costo</th><th>Effetto</th></tr></thead>
      <tbody>
        ${DATA.strutture.map(s => `<tr class="${s.lv === 2 ? 'row-pmt' : ''}"><td>${s.nome}</td><td>${s.lv}</td><td style="text-align:right">${s.cost} Mo</td><td>${s.effetto}</td></tr>`).join('')}
      </tbody>
    </table>`)}
    <p class="txt-note">Max <strong>1 struttura LV2 per tipo</strong> per sede. I costi indicati in tabella sono i <strong>prezzi dei materiali di costruzione</strong> (non prezzi di vendita): la manodopera si svolge nei Downtime dei soci (es. l\u0027Architetto per le strutture), a carico dell\u0027Impresa.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('⚠️', 'Passo 4 — Sanzioni (in breve)')}
    ${tableWrap(`<table>
      <thead><tr><th>Gravità</th><th>Sanzione</th></tr></thead>
      <tbody>
        <tr class="sanz-lieve"><td>Lieve</td><td>Multa <strong>50 Mo</strong> + regolarizzazione in 15 giorni.</td></tr>
        <tr class="sanz-grave"><td>Grave</td><td>Multa <strong>200 Mo</strong> + sospensione 3 mesi (contratti e affitti sospesi).</td></tr>
        <tr class="sanz-graviss"><td>Gravissima</td><td>Scioglimento coatto + confisca cassa (e revoca dell'approvazione per la Grande Corporazione) + Sigillo Spezzato ai soci.</td></tr>
      </tbody>
    </table>`)}
    <button class="btn secondary" onclick="goto('gilde','gestore')">⚠️ Gestione sanzioni nel Gestore</button>
    <p class="txt-note"><strong>Grande Corporazione:</strong> abuso dei privilegi istituzionali → Gravissima (revoca dell'approvazione); Fondo di Categoria mancante → Grave. Vedi l'elenco completo nello strumento qui sopra.</p>
  </div>
`,
// ─────────────────────────────────────────────
entrate: () => `
  <div class="page-hero gilde">
    <h2>💰 Entrate dell'Impresa</h2>
    <p>Tutte le fonti di guadagno in un colpo d'occhio, e come si calcola l'utile in 2 passi.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('💵', 'Le Fonti di Reddito')}
    ${tableWrap(`<table>
      <thead><tr><th>Fonte</th><th style="text-align:right">Investimento</th><th style="text-align:right">Rendita/mese</th></tr></thead>
      <tbody>
        ${DATA.fornitura.map(f => {
          const mesi = Math.ceil(f.cost / f.rent);
          return `<tr class="${dataCls(f.pat)}"><td>${patLink(f.pat)} — fornitura consegnata</td><td style="text-align:right">${f.cost} Mo</td><td style="text-align:right"><strong>${f.rent} Mo</strong> <span class="td-sub">rientro ${mesi} mesi</span></td></tr>`;
        }).join('')}
        <tr><td>Affitto di una struttura libera</td><td style="text-align:right">—</td><td style="text-align:right"><strong>10–15%</strong> del valore</td></tr>
        <tr><td>Dipendenti NPC (da L2)</td><td style="text-align:right">—</td><td style="text-align:right"><strong>10 Mo</strong> a testa</td></tr>
        <tr><td>Orto</td><td style="text-align:right">80 Mo</td><td style="text-align:right"><strong>30 Mo</strong></td></tr>
        <tr><td>Vendita diretta in bottega</td><td style="text-align:right">—</td><td style="text-align:right"><strong>+20–40%</strong> sui materiali</td></tr>
      </tbody>
    </table>`)}
    <div class="note-box">💡 <strong>Una regola sola:</strong> i contratti di fornitura sono al massimo pari al <strong>Livello</strong> dell'Impresa (1 a L1, 4 alla Grande Corporazione) e servono un socio con la patente giusta. Produzione ferma o Impresa sospesa = rendita zero.</div>
  </div>

  <div class="doc-section">
    ${sectionTitle('🧮', 'Il Calcolo in 2 Passi')}
    <div class="rule-box">
      <p><strong>1 · Il fatturato (lordo)</strong> = vendite + rendite (contratti e affitti).</p>
      <p><strong>2 · L'utile netto</strong> = lordo − spese del mese − tassa Camera 1% − riserva 10%.</p>
    </div>
  </div>

  <div class="note-box">⚠ <strong>Sospensione:</strong> con una sanzione <strong>Grave</strong> o superiore, contratti e affitti si fermano fino a regolarizzazione.</div>
`,
// ─────────────────────────────────────────────
riferimenti: () => `
  <div class="page-hero gilde">
    <h2>📚 Riferimenti Avanzati</h2>
    <p>Tutto il resto, per chi gioca da più tempo o vuole approfondire. Qui trovi alleanze, eventi, organizzazioni e glossario.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('🤝', 'Alleanze e Joint Venture')}
    <p><strong>Alleanza Commerciale</strong> (fino a 3 Imprese): registrazione 20 Mo/impresa, sconto 5% su acquisti congiunti, bandi oltre 1.000 Mo, durata 3 mesi-1 anno.</p>
    <p><strong>Joint Venture:</strong> progetto condiviso con budget dedicato. Registrazione 30 Mo alla Camera, Amministratore eletto, responsabilità separate.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('🎲', 'Eventi Stagionali')}
    <p class="txt-intro">Tira <strong>1d20</strong> a inizio mese (+2 per ogni Livello dell'Impresa) o usa gli eventi stagionali fissi qui sotto. <button class="btn secondary small" onclick="goto('gilde','gestore')">🎲 Tira l'evento nel Gestore</button></p>
    ${tableWrap(`<table>
      <thead><tr><th>Evento</th><th>Stagione</th><th>Effetto</th></tr></thead>
      <tbody>
        ${DATA.eventi.map(e => `<tr><td>${e.nome}</td><td>${e.stagione} (${e.mese})</td><td>${e.effetto}</td></tr>`).join('')}
      </tbody>
    </table>`)}
  </div>

  <div class="doc-section">
    ${sectionTitle('🏛️', 'Organizzazioni di Arcadia')}
    <p>Nomi di categoria e lore (es. Società dei Fabbri, dei Tessitori, dell'Osteria): un'Impresa di alto livello può usarli come titolo di prestigio, <strong>senza effetti meccanici extra</strong>.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('📚', 'Glossario Essenziale')}
    ${tableWrap(`<table>
      <thead><tr><th>Termine</th><th>Cosa significa</th></tr></thead>
      <tbody>
        <tr><td><strong>Camera del Commercio</strong></td><td>Dove fondi, registri e fai salire di livello l'Impresa.</td></tr>
        <tr><td><strong>U.R.V.</strong></td><td>Organo di controllo: verifica i requisiti, fa ispezioni, applica le sanzioni.</td></tr>
        <tr><td><strong>Timbro d'Impresa</strong></td><td>Marchio in ottone da apporre su ogni opera venduta.</td></tr>
        <tr><td><strong>Timbro Imperiale</strong></td><td>Sigillo premium che aumenta del 15% il valore percepito delle opere.</td></tr>
        <tr><td><strong>Fondo di Categoria</strong></td><td>Riserva obbligatoria delle Corporazioni per le commesse pubbliche.</td></tr>
        <tr><td><strong>Sigillo Spezzato</strong></td><td>Bollo di disonore su un ex socio dopo uno scioglimento coatto.</td></tr>
        <tr><td><strong>Mastro Artigiano</strong></td><td>Chi ha portato il proprio mestiere al <strong>Livello 4</strong>. Non serve per fondare un'Impresa: è il titolo richiesto (con licenza <strong>P.O.E.</strong>) dalla <strong>Grande Corporazione</strong>.</td></tr>
        <tr><td><strong>Mo</strong></td><td>Monete d'oro: tutta la valuta del Codice.</td></tr>
        <tr><td><strong>DT (Downtime)</strong></td><td>Tempo libero tra le avventure, per costruire, produrre o negoziare.</td></tr>
      </tbody>
    </table>`)}
  </div>
`,
// ─────────────────────────────────────────────
gestore: () => gestoreShell(),
};


function dataCls(sigla) {
  var p = DATA.patenti.filter(function(x){ return x.sigla === sigla; })[0];
  return p ? p.cls : 'row-app';
}


// ════════════════════════════════════════════════
//  RENDER LICENZE
// ════════════════════════════════════════════════
const RENDER_LICENZE = {

panoramica: () => `
  <div class="page-hero licenze">
    <h2>⚖️ Codice Patenti di Arcadia<br><small class="hero-sub">Ufficio del Registro e della Vigilanza (U.R.V.) — Regno di Arcadia</small></h2>
    <p>Il presente regolamento disciplina l'esercizio dei mestieri, la compravendita dei manufatti e la gestione delle sostanze speciali all'interno del Regno.</p>
    <p>Ogni licenza ha una <strong style="color:var(--gold)">validità di tre anni</strong>. Lo status legale dell'artigiano e la legittimità delle sue attività sono formalmente attestati dal possesso del <strong style="color:var(--gold)">Sigillo di Riconoscimento</strong>, un medaglione incantato personalizzato.</p>
    <div class="hero-links">
      ${DATA.patenti.map(p => `<button class="hero-link-btn" onclick="goto('licenze','${p.sezione}')">${p.sigla} · ${p.nome}</button>`).join('')}
    </div>
  </div>`,

vantaggi: () => `
  <div class="doc-section">
    ${sectionTitle('✦', 'Vantaggi Generali del Licenziatario')}
    <p class="txt-intro">Il possesso di una patente valida offre benefici immediati a ogni cittadino di Arcadia:</p>
    <div class="card-grid">
      ${[
        ['🛡️','Protezione Legale','Intervento prioritario della Guardia cittadina in caso di truffe o controversie commerciali.'],
        ['📋','Accesso ai Grandi Appalti','Solo i licenziatari possono partecipare a commesse statali superiori alle <strong>1.000 Mo</strong>.'],
        ['⭐','Prestigio Professionale','Vantaggio alle prove di <strong>Persuasione</strong> legate al proprio mestiere mostrando il Sigillo.'],
        ['🏥','Assicurazione Statale','Copertura del <strong>30% dei danni</strong> in caso di incidenti documentati in laboratorio.'],
        ['🏠','Diritto di Bottega','Esenzione dai controlli arbitrari e diritto di esporre l\u0027insegna ufficiale.'],
      ].map(([e,t,d]) => `<div class="card"><h4>${e} ${t}</h4><p>${d}</p></div>`).join('')}
    </div>
  </div>`,

quadro: () => `
  <div class="doc-section">
    ${sectionTitle('📋', 'Quadro Generale delle Patenti')}
    <div class="pat-grid">
      ${DATA.patenti.map(p => `
        <button class="pat-card" style="border-top:5px solid ${p.col}" onclick="setSection('licenze','${p.sezione}')">
          <div class="pat-card-head">
            <span class="pat-dot" style="background:${p.col}"></span>
            <span class="pat-sigla">${p.sigla}</span>
          </div>
          <div class="pat-card-name">${p.nome}</div>
          <div class="pat-card-meta">
            <div><span>Cost</span><strong>${p.costo} Mo</strong></div>
            <div><span>Cauzione</span><strong>${p.cauzione} Mo</strong></div>
            <div><span>Totale</span><strong>${p.totale} Mo</strong></div>
          </div>
          <div class="pat-card-foot">${p.durata} · ${p.destinatari}</div>
        </button>`).join('')}
    </div>
  </div>`,

pmc: () => `
  <div class="licenza-card">
    <div class="licenza-header">
      <h3 style="color:var(--common)">🟢 P.M.C. — Manifattura Comune</h3>
      <p class="lh-meta">Costo: <span class="nw">40 Mo</span> · Cauzione: <span class="nw">10 Mo</span> · <strong style="color:var(--text2)">Totale: <span class="nw">50 Mo</span></strong> · Durata: <span class="nw">3 anni</span></p>
      <p class="lh-meta">Ideale per: Osti, Sarti, Falegnami e Artisti.</p>
    </div>
    <div class="licenza-body">
      <div class="licenza-block">
        <h5>✦ Permessi</h5>
        <ul>
          <li>Vendita di beni comuni (cibo, abiti, mobili, arte non magica).</li>
          <li>Commesse fino a <strong style="color:var(--gold)">500 Mo</strong>.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>📦 Materiali</h5>
        <ul>
          <li>Acquisto libero di materie prime ordinarie.</li>
          <li>Alcol fino al Grado II.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>⚠ Limiti</h5>
        <ul>
          <li>Divieto assoluto di produrre veleni o sostanze alchemiche pure.</li>
        </ul>
      </div>
    </div>
    <div class="note-box">⚠ <strong>Nota:</strong> Ciò che il licenziatario può craftare e vendere è sempre limitato dal <strong>livello del mestiere</strong> posseduto: la Patente abilita all'esercizio dell'attività, ma non sblocca da sola le ricette o gli oggetti di livello superiore. Mestiere e Patente avanzano di pari passo.</div>
  </div>`,

pmt: () => `
  <div class="licenza-card">
    <div class="licenza-header">
      <h3 style="color:var(--uncommon)">🔵 P.M.T. — Manifattura Tecnica</h3>
      <p class="lh-meta">Costo: <span class="nw">85 Mo</span> · Cauzione: <span class="nw">25 Mo</span> · <strong style="color:var(--text2)">Totale: <span class="nw">110 Mo</span></strong> · Durata: <span class="nw">3 anni</span></p>
      <p class="lh-meta">Ideale per: Fabbri, Gioiellieri, Architetti e Cartografi ufficiali.</p>
    </div>
    <div class="licenza-body">
      <div class="licenza-block">
        <h5>✦ Permessi</h5>
        <ul>
          <li>Produzione di armi, armature pesanti, strutture civili/militari.</li>
          <li>Oggetti magici <strong style="color:var(--gold)">Comuni</strong>.</li>
          <li>Emissione di documenti e mappe ufficiali.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>📦 Materiali</h5>
        <ul>
          <li>Cristalli conduttori (Hextech Grado I).</li>
          <li>Leghe speciali (Acciaio di Noxus, ecc.).</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>⚠ Obblighi</h5>
        <ul>
          <li>Responsabilità legale sulla stabilità delle strutture costruite.</li>
          <li>Tracciabilità delle armi da guerra.</li>
        </ul>
      </div>
    </div>
    <div class="note-box">⚠ <strong>Nota:</strong> Ciò che il licenziatario può craftare e vendere è sempre limitato dal <strong>livello del mestiere</strong> posseduto: la Patente abilita all'esercizio dell'attività, ma non sblocca da sola le ricette o gli oggetti di livello superiore. Mestiere e Patente avanzano di pari passo.</div>
  </div>`,

pasv: () => `
  <div class="licenza-card">
    <div class="licenza-header">
      <h3 style="color:var(--amber)">🟠 P.A.S.V. — Alchimia e Sostanze Vincolate</h3>
      <p class="lh-meta">Costo: <span class="nw">140 Mo</span> · Cauzione: <span class="nw">40 Mo</span> · <strong style="color:var(--text2)">Totale: <span class="nw">180 Mo</span></strong> · Durata: <span class="nw">3 anni</span></p>
      <p class="lh-meta">Ideale per: Alchimisti e Artigiani Hextech.</p>
    </div>
    <div class="licenza-body">
      <div class="licenza-block">
        <h5>✦ Permessi</h5>
        <ul>
          <li>Produzione di pozioni fino a <strong style="color:var(--gold)">Non Comuni</strong>.</li>
          <li>Veleni etichettati e motori Hextech.</li>
          <li><strong style="color:var(--gold)">Unica licenza</strong> che permette l'acquisto di Inchiostri Magici.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>📦 Materiali</h5>
        <ul>
          <li>Reagenti rari (Sangue di Demone, Ghiandola di Drago).</li>
          <li>Inchiostri fino al Grado III.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>⚠ Rigore</h5>
        <ul>
          <li>Ogni boccetta è tracciata tramite il <strong style="color:var(--gold)">Marchio Spettrale</strong>.</li>
          <li>Ogni transazione registrata nel Libretto degli Acquisti.</li>
        </ul>
      </div>
    </div>
    <div class="note-box">⚠ <strong>Nota:</strong> Ciò che il licenziatario può craftare e vendere è sempre limitato dal <strong>livello del mestiere</strong> posseduto: la Patente abilita all'esercizio dell'attività, ma non sblocca da sola le ricette o gli oggetti di livello superiore. Mestiere e Patente avanzano di pari passo.</div>
  </div>`,

poe: () => `
  <div class="licenza-card">
    <div class="licenza-header">
      <h3 style="color:var(--legendary)">🟡 P.O.E. — Opere Eccezionali</h3>
      <p class="lh-meta">Costo: <span class="nw">300 Mo</span> · Cauzione: <span class="nw">100 Mo</span> · <strong style="color:var(--text2)">Totale: <span class="nw">400 Mo</span></strong> · Durata: <span class="nw">3 anni</span></p>
      <p class="lh-meta">Riservata ai Maestri Artigiani (Livello 4+).</p>
    </div>
    <div class="licenza-body">
      <div class="licenza-block">
        <h5>✦ Permessi</h5>
        <ul>
          <li>Accesso alle commesse della Corte e titoli onorifici.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>🏆 Privilegi</h5>
        <ul>
          <li>Diritto di formare fino a <strong style="color:var(--gold)">3 apprendisti</strong>.</li>
          <li>Certificare le opere di pregio: <strong style="color:var(--gold)">+20% valore di mercato</strong>.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>📦 Materiali</h5>
        <ul>
          <li>Accesso a materiali speciali su approvazione del Consiglio.</li>
        </ul>
      </div>
    </div>
    <div class="note-box">⚠ <strong>Nota:</strong> Ciò che il licenziatario può craftare e vendere è sempre limitato dal <strong>livello del mestiere</strong> posseduto: la Patente abilita all'esercizio dell'attività, ma non sblocca da sola le ricette o gli oggetti di livello superiore. Mestiere e Patente avanzano di pari passo.</div>
  </div>`,

inchiostri: () => `
  <div class="doc-section">
    ${sectionTitle('🖋️', 'Sezione Tecnica: Materiali Vincolati e Inchiostri')}
    <p class="txt-intro">L'uso di inchiostri magici è strettamente regolamentato per evitare abusi arcani. <strong style="color:var(--gold)">Solo la P.A.S.V.</strong> permette l'acquisto di inchiostri magici.</p>
    ${tableWrap(`<table>
      <thead><tr><th>Grado &amp; Patente</th><th>Limite (3 anni)</th><th>Uso Tipico</th></tr></thead>
      <tbody>
        <tr class="row-pmc">
          <td><span class="dot-i" style="background:var(--common)"></span>Grado I · <span class="nw">${abbr('P.M.C.')}</span></td>
          <td>Uso libero entro soglie ordinarie</td>
          <td>Inchiostri comuni, scrittura e documenti base.</td>
        </tr>
        <tr class="row-pmt">
          <td><span class="dot-i" style="background:var(--uncommon)"></span>Grado II · <span class="nw">${abbr('P.M.T.')}</span></td>
          <td>Tracciato nel Libretto degli Acquisti</td>
          <td>Mappe ufficiali e documenti legali sigillati.</td>
        </tr>
        <tr class="row-pasv">
          <td><span class="dot-i" style="background:var(--amber)"></span>Grado III · <span class="nw">${abbr('P.A.S.V.')}</span></td>
          <td>Tracciato con <span class="nw">Marchio Spettrale</span></td>
          <td>Pergamene, rune e componenti alchemici.</td>
        </tr>
        <tr class="row-poe">
          <td><span class="dot-i" style="background:var(--legendary)"></span>Grado IV+ · <span class="nw">${abbr('P.O.E.')} + U.R.V.</span></td>
          <td>Approvazione caso per caso</td>
          <td>Manufatti leggendari e Grimori avanzati.</td>
        </tr>
      </tbody>
    </table>`)}
    <div class="note-box">⚠ <strong>Marchio Spettrale:</strong> Ogni fiala di inchiostro di Grado III o superiore viene marchiata spettralmente dall'U.R.V. al momento dell'acquisto. Il marchio registra automaticamente data, acquirente e quantità. La rimozione del marchio è un reato grave.</div>
  </div>`,

strumenti: () => `
  <div class="page-hero licenze">
    <h2>🛠️ Strumenti per Patenti</h2>
    <p>Calcolatori e tracker per gestire le Patenti dei licenziatari di Arcadia.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('🧮', 'Confronto & Costi Patenti')}
    <p class="txt-intro">I dati delle 4 Patenti, aggregati e confrontabili. Inchiostri e materiali inclusi.</p>
    ${tableWrap(`<table>
      <thead><tr><th>Patente</th><th>Costo (3 anni)</th><th>Cauzione</th><th>Totale</th><th>Durata</th><th>Destinatari</th></tr></thead>
      <tbody>
        ${DATA.patenti.map(p => `<tr class="${p.cls}"><td><span class="nw">${p.sigla}</span><span class="td-sub">${p.nome}</span></td><td><span class="nw">${p.costo} Mo</span></td><td><span class="nw">${p.cauzione} Mo</span></td><td><strong><span class="nw">${p.totale} Mo</span></strong></td><td><span class="nw">${p.durata}</span></td><td>${p.destinatari}</td></tr>`).join('')}
      </tbody>
    </table>`)}
  </div>

  <div class="doc-section">
    ${sectionTitle('📊', 'Tracker Patenti dei Licenziatari')}
    <p class="txt-intro">Tieni traccia delle Patenti di ogni personaggio: tipo, costo, scadenza triennale e stato. Dati salvati in locale (localStorage) con export/import JSON.</p>
    <button class="btn" onclick="openPatentiTracker()">Apri Tracker Patenti</button>
  </div>
`,
};

// ════════════════════════════════════════════════
function renderPage() {
  const el = document.getElementById('content');
  const groups = [['gilde', RENDER_GILDE], ['licenze', RENDER_LICENZE]];
  const parts = [];
  groups.forEach(function(pair) {
    const pg = pair[0], map = pair[1];
    NAV[pg].forEach(function(n) {
      const fn = map[n.id];
      const body = fn ? fn() : '<p class="txt-note">Sezione non trovata.</p>';
      parts.push('<section class="page-block' + (pg === 'licenze' ? ' page-block-lic' : '') + '" id="' + secId(pg, n.id) + '" data-page="' + pg + '">' + body + '</section>');
    });
  });
  el.innerHTML = parts.join('');
  buildSidebar();
  attachScrollSpy();
  window.__gInitDone = false;
  if (currentPage === 'gilde' && currentSection === 'gestore') gInit();
  setupGlobalSearch();
  setupTableSort();
  applyGlobalSearch();
}

function buildSidebar() {
  const sb = document.getElementById('sidebarNav');
  sb.innerHTML = SIDEBAR.map(function(g) {
    return '<div class="sb-group"><div class="sb-group-title">' + g.group + '</div>' +
      g.items.map(function(n) {
        const act = (g.pg === currentPage && n.id === currentSection) ? ' active' : '';
        return '<button class="sb-btn' + act + '" data-sec="' + n.id + '" data-page="' + g.pg + '" onclick="setSection(\'' + g.pg + '\',\'' + n.id + '\')">' + n.label + '</button>';
      }).join('') +
    '</div>';
  }).join('');
}

function markSidebarActive() {
  const sb = document.getElementById('sidebarNav');
  if (!sb) return;
  sb.querySelectorAll('.sb-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.page === currentPage && b.dataset.sec === currentSection);
  });
}

var __scrollSpy = null;
function attachScrollSpy() {
  if (__scrollSpy) { window.removeEventListener('scroll', __scrollSpy); window.removeEventListener('resize', __scrollSpy); }
  const content = document.getElementById('content');
  const OFFSET = 140;
  __scrollSpy = function () {
    let cur = null, curPg = null;
    content.querySelectorAll('section.page-block').forEach(s => {
      if (s.getBoundingClientRect().top <= OFFSET) { cur = s.id.slice(4); curPg = s.dataset.page; }
    });
    if (cur && (curPg !== currentPage || cur !== currentSection)) {
      if (curPg === 'licenze' && cur.slice(-4) === '-lic') cur = cur.slice(0, -4);
      currentPage = curPg;
      currentSection = cur;
      markSidebarActive();
    }
    if (currentSection === 'gestore' && typeof gInit === 'function' && !window.__gInitDone) {
      window.__gInitDone = true;
      try { gInit(); } catch (e) {}
    }
  };
  if (typeof window.addEventListener !== 'function') { __scrollSpy(); return; }
  window.addEventListener('scroll', __scrollSpy, { passive: true });
  window.addEventListener('resize', __scrollSpy);
  __scrollSpy();
}

// ════════════════════════════════════════════════
//  STATE SETTERS
// ════════════════════════════════════════════════
function setPage(p) {
  goto(p, 'panoramica');
}

function setSection(pg, s) {
  currentPage = pg;
  currentSection = s;
  markSidebarActive();
  closeSidebar();
  scrollToId(secId(pg, s));
}

// ════════════════════════════════════════════════
//  SIDEBAR (responsive)
// ════════════════════════════════════════════════
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarBackdrop').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('open');
}

// ════════════════════════════════════════════════
//  MODAL HELPERS
// ════════════════════════════════════════════════
function openModal(title, bodyHtml, footerHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalFooter').innerHTML = footerHtml || '<button class="btn secondary" onclick="closeModal()">Chiudi</button>';
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ════════════════════════════════════════════════
//  TRACKER PATENTI (pagina Licenze)
// ════════════════════════════════════════════════
var PATENTI_STORE_KEY = 'arcamis_patenti_store';

function loadPatenti() {
  try {
    var s = JSON.parse(localStorage.getItem(PATENTI_STORE_KEY));
    return Array.isArray(s) ? s : [];
  } catch(e) { return []; }
}
function savePatenti(list) { localStorage.setItem(PATENTI_STORE_KEY, JSON.stringify(list)); }

function openPatentiTracker() {
  var list = loadPatenti();
  var body = '<div class="calc-section"><h4>Patenti Registrate (U.R.V.)</h4>';
  if (!list.length) {
    body += '<p style="color:var(--text3);font-size:.82rem">Nessuna patente registrata. Aggiungi la prima patente di un licenziatario.</p>';
  } else {
    body += '<table><thead><tr><th>Licenziatario</th><th>Patente</th><th>Costo</th><th>Scadenza</th><th>Stato</th><th></th></tr></thead><tbody>';
    body += list.map(function(p, i) {
      var cls = DATA.patenti.filter(function(x) { return x.sigla === p.sigla; })[0];
      var rowCls = cls ? cls.cls : '';
      var stato = p.stato || 'attiva';
      var badge = stato === 'attiva' ? '<span style="color:var(--green2);font-weight:700">Attiva</span>' : (stato === 'scaduta' ? '<span style="color:var(--red2);font-weight:700">Scaduta</span>' : '<span style="color:var(--amber);font-weight:700">' + escHtml(stato) + '</span>');
      body += '<tr class="' + rowCls + '"><td><strong>' + escHtml(p.nome) + '</strong></td><td>' + escHtml(p.sigla) + '</td><td>' + (p.costo || '') + ' Mo</td><td>' + escHtml(p.scadenza || '-') + '</td><td>' + badge + '</td><td><button class="btn secondary" style="padding:4px 8px;font-size:.72rem" onclick="togglePatenteStato(' + i + ')">↺</button> <button class="btn danger" style="padding:4px 8px;font-size:.72rem" onclick="removePatente(' + i + ')">✕</button></td></tr>';
    }).join('');
    body += '</tbody></table>';
  }
  body += '<button class="btn secondary" style="margin-top:8px" onclick="addPatente()">+ Aggiungi Patente</button></div>';
  var footer = '<button class="btn secondary" onclick="patentiExport()">💾 Export JSON</button><button class="btn secondary" onclick="patentiImport()">📂 Import JSON</button><button class="btn" onclick="closeModal()">Chiudi</button>';
  openModal('📊 Tracker Patenti', body, footer);
}
function addPatente() {
  var nome = prompt('Nome del licenziatario:');
  if (!nome) return;
  var sigla = prompt('Patente (P.M.C. / P.M.T. / P.A.S.V. / P.O.E.):');
  if (!sigla) return;
  sigla = sigla.toUpperCase();
  var pd = DATA.patenti.filter(function(x) { return x.sigla === sigla; })[0];
  var costo = pd ? pd.totale : (parseInt(prompt('Costo totale (Mo):')) || 0);
  var scadenza = prompt('Data scadenza (es. 01/2029):') || '-';
  var list = loadPatenti();
  list.push({ nome: nome, sigla: sigla, costo: costo, scadenza: scadenza, stato: 'attiva' });
  savePatenti(list);
  openPatentiTracker();
}
function removePatente(i) {
  var list = loadPatenti();
  if (!list[i]) return;
  if (!confirm('Rimuovere la patente di "' + list[i].nome + '"?')) return;
  list.splice(i, 1);
  savePatenti(list);
  openPatentiTracker();
}
function togglePatenteStato(i) {
  var list = loadPatenti();
  if (!list[i]) return;
  list[i].stato = list[i].stato === 'attiva' ? 'scaduta' : 'attiva';
  savePatenti(list);
  openPatentiTracker();
}
function patentiExport() {
  var list = loadPatenti();
  if (!list.length) { alert('Nessuna patente da esportare.'); return; }
  downloadJson(list, 'patenti_arcamis.json');
}
function patentiImport() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) { savePatenti(data); openPatentiTracker(); }
        else alert('File JSON non valido (attesa una lista).');
      }
      catch(err) { alert('File JSON non valido.'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ════════════════════════════════════════════════
//  THEME
// ════════════════════════════════════════════════
var THEME_KEY = 'arcamis_theme';
function applyTheme() {
  var dark = localStorage.getItem(THEME_KEY) === 'dark';
  document.body.classList.toggle('dark', dark);
  var btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = dark ? '☀️' : '🌙';
}
function toggleTheme() {
  var dark = document.body.classList.toggle('dark');
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  applyTheme();
}
applyTheme();

function render() {
  renderPage();
}

render();
