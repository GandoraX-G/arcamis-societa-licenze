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
function goto(pg, sec) {
  if (PAGES.indexOf(pg) === -1) pg = 'gilde';
  currentPage = pg;
  currentSection = sec || 'panoramica';
  closeModal();
  closeDrawer();
  render();
  window.scrollTo({ top:0, behavior:'smooth' });
}

//  MOBILE
// ════════════════════════════════════════════════
function openDrawer() { document.getElementById('mobileDrawer').classList.add('open'); document.getElementById('drawerOverlay').classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeDrawer() { document.getElementById('mobileDrawer').classList.remove('open'); document.getElementById('drawerOverlay').classList.remove('open'); document.body.style.overflow = ''; }
function syncMobile() { const d = document.getElementById('mobileDrawerNav'); const s = document.getElementById('sidenav'); if (d && s) d.innerHTML = s.innerHTML; }

//  RENDER TABS
// ════════════════════════════════════════════════
function renderTabs() {
  const labels = { gilde:'🏛️ Società & Imprese', licenze:'⚖️ Licenze & Patenti' };
  const tabsRow = document.getElementById('tabsRow');
  tabsRow.innerHTML = PAGES.map(p =>
    `<button class="tab-btn ${p===currentPage?'active':''}" onclick="setPage('${p}')">${labels[p]}</button>`
  ).join('');
  document.getElementById('searchRow').style.display = currentPage === 'gilde' ? 'flex' : 'none';
  setupGlobalSearch();
  setupTableSort();
}

//  RENDER SIDENAV
// ════════════════════════════════════════════════
function renderSideNav() {
  const el = document.getElementById('sidenav');
  const nav = NAV[currentPage];
  let h = '<div class="sidenav-section"><div class="sidenav-title">Sezioni</div>';
  nav.forEach(n => {
    h += `<button class="sidenav-btn ${currentSection===n.id?'active':''}" onclick="setSection('${n.id}')">${n.label}</button>`;
  });
  h += '</div>';
  el.innerHTML = h;
}

// ════════════════════════════════════════════════
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
          <li>Almeno <strong>2 PG</strong> personaggi (il responsabile e almeno un socio)</li>
          <li>Un <strong>Responsabile</strong> con la patente <strong>${patLink('P.M.C.')}</strong></li>
          <li>Almeno un socio non-apprendista con una <strong>Patente valida</strong></li>
          <li>Una <strong>sede fisica modesta</strong>: Magazzino (300 Mo) o locale di quartiere</li>
        </ul>
      </div>
      <div class="rule-box">
        <h4>💰 Costi di fondazione</h4>
        <ul>
          <li><strong>Tassa di costituzione</strong> (una tantum): ${DATA.livelli[0].feeRange} Mo</li>
          <li><strong>Sede fisica modesta</strong> (es. Magazzino): 300 Mo</li>
          <li><strong>Fondo iniziale</strong> per la cassa comune: ${DATA.fondi.init} Mo</li>
          <li><strong>Manutenzione triennale</strong>: ${DATA.livelli[0].tax} Mo ogni 3 anni</li>
          <li style="color:var(--amber)">Totale minimo: ~${DATA.livelli[0].fee + 300 + DATA.fondi.init} Mo da investire subito (+ ${DATA.livelli[0].tax} Mo/3 anni)</li>
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
    ${tableWrap(`<table>
      <thead><tr><th>Livello</th><th>Nome</th><th>Patente collegata</th><th>In una frase</th></tr></thead>
      <tbody>
        <tr class="row-pmc"><td>1</td><td>Bottega Artigiana</td><td>${patLink('P.M.C.')}</td><td>${DATA.livelli[0].motto}</td></tr>
        <tr class="row-pmt"><td>2</td><td>Fondaco / Officina</td><td>${patLink('P.M.T.')}</td><td>${DATA.livelli[1].motto}</td></tr>
        <tr class="row-pasv"><td>3</td><td>Compagnia Commerciale</td><td>${patLink('P.A.S.V.')}</td><td>${DATA.livelli[2].motto}</td></tr>
        <tr class="row-poe"><td>4</td><td>Grande Corporazione</td><td>${patLink('P.O.E.')}</td><td>${DATA.livelli[3].motto}</td></tr>
      </tbody>
    </table>`)}
  </div>
`,
// ─────────────────────────────────────────────
livelli: () => `
  <div class="page-hero gilde">
    <h2>🏪 I 4 Livelli dell'Impresa</h2>
    <p>Ogni Impresa parte da una <strong>Bottega Artigiana</strong>. Salendo di livello si amplia la sede produttiva, si aumenta il personale e si sbloccano <strong>più benefici meccanici</strong>; crescono anche i requisiti, le tasse di manutenzione e i controlli.</p>
  </div>

  ${DATA.livelli.map(l => `
  <div class="impresa-card">
    <div class="impresa-header">
      <h3>Livello ${l.id} — ${l.name}</h3>
      ${l.patente ? patBtn(l.patente) : ''}
      ${l.id === 4 ? '<span class="tip pat-poe" data-tip="Approvazione istituzionale, oltre alla patente" style="font-size:.9rem;padding:4px 10px;border-radius:12px">🏛 Approvazione</span>' : ''}
    </div>
    <div class="impresa-body">
      <div class="info-block">
        <p><strong>Costo ${l.id === 1 ? 'di costituzione' : 'di upgrade'}${l.id > 1 ? ' (dal livello ' + (l.id - 1) + ')' : ''}:</strong> ${l.feeRange} Mo</p>
        ${l.id > 1 ? '<p><strong>Investimento cumulativo in tasse al Livello ' + l.id + ':</strong> ' + l.sumFee + ' Mo</p>' : ''}
        <p><strong>Manutenzione triennale:</strong> ${l.taxRange} Mo ogni 3 anni</p>
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

  <div class="note-box">⚠ <strong>Le tasse di costituzione / upgrade si sommano:</strong> per arrivare alla Grande Corporazione servono ${DATA.livelli.map(l => l.feeRange).join(' + ')} ≈ <strong>${DATA.livelli[3].sumFee} Mo</strong> cumulativi (tasse di struttura). A queste si aggiungono le <strong>manutenzioni triennali</strong> di ogni Livello e una <strong>sede adeguata</strong>. Il Fondo Iniziale di <strong>${DATA.fondi.init} Mo</strong> è separato dalla cassa.</div>

  <div class="doc-section">
    ${sectionTitle('🧮', 'Esempio Pratico — La Bottega dei Martelli')}
    <div class="rule-box">
      <p>Un percorso concreto, passo dopo passo:</p>
      <p><strong style="color:var(--gold2)">L1 — Bottega Artigiana:</strong> Aldric (Responsabile, P.M.C. 50 Mo) e Brenna (Socia, P.M.C. 50 Mo). Costituzione 100 Mo + Magazzino 300 Mo + Fondo 30 Mo = <strong>430 Mo</strong>; manutenzione triennale 15 Mo.</p>
      <p><strong style="color:var(--gold2)">L2 — Fondaco / Officina (dopo ~3 mesi):</strong> +625 Mo di upgrade + P.M.T. per il Responsabile 110 Mo ≈ <strong>+735 Mo</strong> (totale investito ~1.165 Mo). Apertura a un terzo socio: si lavora in 3.</p>
      <p><strong style="color:var(--gold2)">L3 — Compagnia Commerciale (dopo ~6 mesi):</strong> +3.000 Mo di upgrade + P.A.S.V. 180 Mo = <strong>+3.180 Mo</strong> (totale ~4.345 Mo). Un quarto socio conduce appalti del Regno e ottiene sconti sulle licenze personali.</p>
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
        <tr><td>Tassa di costituzione (Bottega Artigiana)</td><td><strong>${DATA.livelli[0].feeRange} Mo</strong></td></tr>
        <tr><td>Sede minima: Magazzino (o locale modesto)</td><td><strong>300 Mo</strong></td></tr>
        <tr><td>Fondo Iniziale (cassa comune)</td><td><strong>${DATA.fondi.init} Mo</strong></td></tr>
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
    <p>Quattro fonti di guadagno: <strong>contratti di fornitura</strong>, <strong>vendita diretta</strong>, <strong>affitti di struttura</strong> e <strong>lavori su commissione</strong>. Qui come funzionano e come si calcola il fatturato.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('💵', 'Contratti di Fornitura')}
    <p class="txt-intro">Il contratto di fornitura è una <strong>vendita garantita</strong>: l'Impresa <strong>consegna ogni mese</strong> una quota di produzione (materiali o manufatti della propria categoria) e l'ente paga la <strong>Rendita mensile</strong>. Non è denaro passivo: <em>chi non consegna, non incassa</em>.</p>
    ${tableWrap(`<table>
      <thead><tr><th>Patente richiesta</th><th style="text-align:right">Investimento</th><th style="text-align:right">Rendita/mese</th><th style="text-align:right">Rientro</th></tr></thead>
      <tbody>
        ${DATA.fornitura.map(f => {
          const mesi = Math.ceil(f.cost / f.rent);
          return `<tr class="${dataCls(f.pat)}"><td>${patLink(f.pat)}</td><td style="text-align:right">${f.cost} Mo</td><td style="text-align:right"><strong>${f.rent} Mo</strong></td><td style="text-align:right">${mesi} mesi</td></tr>`;
        }).join('')}
      </tbody>
    </table>`)}
    <p class="txt-note">Un contratto per socio dotato della patente; max pari al <strong>Livello</strong> dell'Impresa (1 al L1, 4 alla Grande Corporazione). Le consegne escono da magazzino o dalla produzione dei soci: senza produzione — o da sospesi — la rendita non matura.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('🛍️', 'Vendita diretta a Bottega')}
    <p class="txt-intro">Si vendono i manufatti al pubblico: il guadagno è la differenza tra <strong>prezzo di vendita</strong> e <strong>costo dei materiali</strong>. Regole semplici:</p>
    ${tableWrap(`<table>
      <thead><tr><th>Voce</th><th>Regola</th></tr></thead>
      <tbody>
        <tr><td>Margine tipico</td><td><strong>+20–40%</strong> sul costo delle materie prime usate (a mano libera del DM).</td></tr>
        <tr><td>In Bottega (sede)</td><td>Senza commissione se l'Impresa ha accesso al mercato comunale (Livello 1+).</td></tr>
        <tr><td>Fuori sede</td><td>Al mercato di un'altra città: <strong>10% di commissione</strong> sulle vendite.</td></tr>
        <tr><td>Contratti a termine</td><td>Ordini che richiedono più Downtime: paga anticipata <strong>50%</strong>, saldo a consegna.</td></tr>
      </tbody>
    </table>`)}
  </div>

  <div class="doc-section">
    ${sectionTitle('📝', 'Lavori su Commissione privata')}
    <p>I prezzi sotto sono <strong>stime di vendita</strong> (quanto paga il cliente per il pezzo finito), <strong>non aggiunte</strong> da sommare: l'utile dell'Impresa è la differenza tra incasso e materiali. Prezzi orientativi <em>(adattate alla campagna)</em>:</p>
    ${tableWrap(`<table>
      <thead><tr><th>Oggetto</th><th style="text-align:right">Prezzo di vendita</th></tr></thead>
      <tbody>
        <tr><td>Comune</td><td style="text-align:right">1–20 Mo</td></tr>
        <tr><td>Non comune</td><td style="text-align:right">20–80 Mo</td></tr>
        <tr><td>Raro</td><td style="text-align:right">80–200 Mo</td></tr>
        <tr><td>Molto raro</td><td style="text-align:right">200–500 Mo</td></tr>
        <tr><td>Leggendario</td><td style="text-align:right">Trattativa</td></tr>
      </tbody>
    </table>`)}
    <p class="txt-note">La <strong style="color:var(--gold2)">P.O.E.</strong> certifica la qualità: <strong>+20% valore</strong> (a parte).</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('🏠', 'Affitto di Struttura')}
    <p>Una struttura inutilizzata può essere affittata: rendita del <strong>5–10%</strong> del suo valore, ogni mese.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('🧮', 'Come calcolare il Fatturato mensile')}
    <div class="rule-box">
      <p><strong>Fatturato (lordo) = Vendite dirette + Rendita Contratti + Affitti</strong></p>
      <p>Dal lordo si tolgono le <strong>spese del mese</strong> (materie prime, apprendisti) e la <strong>Tassa Camera (1% sul lordo)</strong>; sull'utile si accantona il <strong>Fondo di Riserva (10%)</strong>. Il resto è l'<strong>utile netto</strong>.</p>
      <h5>Esempio — Osteria, Livello 1 (Oste con Cucina + Contratto)</h5>
      ${tableWrap(`<table>
        <thead><tr><th>Voce</th><th style="text-align:right">Mo/mese</th></tr></thead>
        <tbody>
          <tr><td><strong>Vendite</strong> — ricette in bottega (+25% sul materiale)</td><td style="text-align:right">+20</td></tr>
          <tr><td><strong>Rendita contratto</strong> — Manifattura Comune</td><td style="text-align:right">+15</td></tr>
          <tr><td><strong>Materiali</strong> — carbone (4 Mo/sett.)</td><td style="text-align:right">−16</td></tr>
          <tr><td><strong>Tassa Camera</strong> — 1% sul lordo ≈ 0</td><td style="text-align:right">0</td></tr>
          <tr class="total"><td><strong>Utile netto</strong> (20 + 15 − 16; riserva 10% ≈ 2)</td><td style="text-align:right"><strong>≈ 17</strong></td></tr>
        </tbody>
      </table>`)}
      <p class="txt-note">Investimento: Cucina 70 + stipula 45 = <strong>115 Mo</strong> → rientro in ~7 mesi. Un contratto da solo non copre il carbone: la rendita reale nasce da <strong>produzione + vendita + contratti</strong>.</p>
    </div>
  </div>

  <div class="note-box">⚠ <strong>Sospensione:</strong> contratti e affitti si sospendono se l'Impresa riceve una sanzione <strong>Grave</strong> o superiore.</div>
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
        <tr><td><strong>Monopolio / Brevetti</strong></td><td>Privilegio (opzionale) della Grande Corporazione di produrre o distribuire beni speciali in esclusiva.</td></tr>
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
    ${tableWrap(`<table>
      <thead><tr><th>Sigla</th><th>Denominazione</th><th style="text-align:right">Costo (3 anni)</th><th style="text-align:right">Cauzione</th><th style="text-align:right">Totale</th></tr></thead>
      <tbody>
        ${DATA.patenti.map(p => `<tr class="${p.cls}"><td>${abbr(p.sigla)}</td><td>${p.nome}</td><td style="text-align:right">${p.costo} Mo</td><td style="text-align:right">${p.cauzione} Mo</td><td style="text-align:right"><strong>${p.totale} Mo</strong></td></tr>`).join('')}
      </tbody>
    </table>`)}
  </div>`,

pmc: () => `
  <div class="licenza-card">
    <div class="licenza-header">
      <h3 style="color:var(--common)">🟢 P.M.C. — Manifattura Comune</h3>
      <p class="lh-meta">Costo: 40 Mo · Cauzione: 10 Mo · <strong style="color:var(--text2)">Totale: 50 Mo</strong> · Durata: 3 anni</p>
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
      <p class="lh-meta">Costo: 85 Mo · Cauzione: 25 Mo · <strong style="color:var(--text2)">Totale: 110 Mo</strong> · Durata: 3 anni</p>
      <p class="lh-meta">Ideale per: Fabbri, Gioiellieri, Architetti e Cartografi ufficiali.</p>
    </div>
    <div class="licenza-body">
      <div class="licenza-block">
        <h5>✦ Permessi</h5>
        <ul>
          <li>Produzione di armi, armature pesanti, strutture civili/militari.</li>
          <li>Oggetti magici <strong style="color:var(--gold)">Comuni</strong>.</li>
          <li>Emissione di documenti legali e mappe ufficiali.</li>
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
      <p class="lh-meta">Costo: 140 Mo · Cauzione: 40 Mo · <strong style="color:var(--text2)">Totale: 180 Mo</strong> · Durata: 3 anni</p>
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
      <p class="lh-meta">Costo: 300 Mo · Cauzione: 100 Mo · <strong style="color:var(--text2)">Totale: 400 Mo</strong> · Durata: 3 anni</p>
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
          <li>Certificare la qualità delle opere (<strong style="color:var(--gold)">+20% valore di mercato</strong>).</li>
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
      <thead><tr><th>Grado Inchiostro</th><th>Patente Richiesta</th><th>Limite (3 anni)</th><th>Uso Tipico</th></tr></thead>
      <tbody>
        <tr class="row-pmc">
          <td><span class="dot-i" style="background:var(--common)"></span>Grado I</td>
          <td>${abbr('P.M.C.')}</td>
          <td>Uso libero entro soglie ordinarie</td>
          <td>Inchiostri comuni, scrittura base, documenti</td>
        </tr>
        <tr class="row-pmt">
          <td><span class="dot-i" style="background:var(--uncommon)"></span>Grado II</td>
          <td>${abbr('P.M.T.')}</td>
          <td>Tracciato nel Libretto degli Acquisti</td>
          <td>Mappe ufficiali, documenti legali sigillati, Hextech Grado I</td>
        </tr>
        <tr class="row-pasv">
          <td><span class="dot-i" style="background:var(--amber)"></span>Grado III</td>
          <td>${abbr('P.A.S.V.')}</td>
          <td>Tracciato con Marchio Spettrale</td>
          <td>Pergamene magiche, Tattoo magici, componenti alchemici avanzati</td>
        </tr>
        <tr class="row-poe">
          <td><span class="dot-i" style="background:var(--legendary)"></span>Grado IV+</td>
          <td>${abbr('P.O.E.')} + approvazione U.R.V.</td>
          <td>Approvazione caso per caso</td>
          <td>Manufatti leggendari, opere della Corte, Grimori avanzati</td>
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
        ${DATA.patenti.map(p => `<tr class="${p.cls}"><td><strong>${p.sigla}</strong> — ${p.nome}</td><td>${p.costo} Mo</td><td>${p.cauzione} Mo</td><td><strong>${p.totale} Mo</strong></td><td>${p.durata}</td><td>${p.destinatari}</td></tr>`).join('')}
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
function renderContent() {
  const el = document.getElementById('content');
  const map = currentPage === 'gilde' ? RENDER_GILDE : RENDER_LICENZE;
  const fn = map[currentSection];
  el.innerHTML = fn ? fn() : '<div style="color:var(--text3);padding:40px;text-align:center">Sezione non trovata.</div>';
  if (currentPage === 'gilde' && currentSection === 'gestore') gInit();
  setupTableSort();
  applyGlobalSearch();
}

// ════════════════════════════════════════════════
//  STATE SETTERS
// ════════════════════════════════════════════════
function setPage(p) {
  currentPage = p;
  currentSection = 'panoramica';
  render();
  window.scrollTo({top:0,behavior:'smooth'});
}

function setSection(s) {
  currentSection = s;
  render();
  closeDrawer();
  window.scrollTo({top:0,behavior:'smooth'});
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
  var light = localStorage.getItem(THEME_KEY) === 'light';
  document.body.classList.toggle('light', light);
  var btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = light ? '☀️' : '🌙';
}
function toggleTheme() {
  var light = document.body.classList.toggle('light');
  localStorage.setItem(THEME_KEY, light ? 'light' : 'dark');
  applyTheme();
}
applyTheme();

function render() {
  renderTabs();
  renderSideNav();
  renderContent();
  syncMobile();
  const btn = document.getElementById('mobileNavBtn');
  if (btn) btn.style.display = 'flex';
}

render();
