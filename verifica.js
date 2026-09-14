// Verifica del foglio di stile e del rendering.
// Uso: node verifica.js
//
// Serve a non rompere in silenzio ciò che non si vede a occhio: classi usate
// dal markup ma assenti nel CSS, token citati e non definiti, testo troppo
// piccolo, contrasti sotto soglia, HTML malformato.
const fs = require('fs');
const vm = require('vm');

let problemi = 0;
const esito = (etichetta, ok, dettaglio) => {
  console.log((ok ? '  ✓ ' : '  ✗ ') + etichetta + (!ok && dettaglio ? ' → ' + dettaglio : ''));
  if (!ok) problemi++;
};

const css = fs.readFileSync('styles.css', 'utf8');
const pulito = css.replace(/\/\*[\s\S]*?\*\//g, '');

// ── 1 · Sintassi del CSS ──────────────────────────────
console.log('\n— CSS —');
let graffe = 0;
for (const c of pulito) { if (c === '{') graffe++; if (c === '}') graffe--; }
esito('graffe bilanciate', graffe === 0, 'residue ' + graffe);

const definiti = new Set([...pulito.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const usati = new Set([...pulito.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
const nonDefiniti = [...usati].filter((v) => !definiti.has(v));
esito('nessun token citato e non definito', nonDefiniti.length === 0, nonDefiniti.join(', '));
const morti = [...definiti].filter((v) => !usati.has(v));
esito('nessun token definito e inutilizzato', morti.length === 0, morti.join(', '));

// ── 2 · Contrasto WCAG di ogni colore di testo ────────
console.log('\n— Contrasto (soglia AA 4.5:1 su testo normale) —');
const rgb = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lum = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrasto = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function token(sel) {
  const i = pulito.indexOf(sel);
  const j = pulito.indexOf('}', i);
  const out = {};
  for (const m of pulito.slice(i, j).matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}
const chiaro = token(':root {');
const scuro = { ...chiaro, ...token('body.dark {') };
// --ink-4 in tema chiaro è usato da placeholder e sottotitoli, quindi è testo;
// --accent-soft e simili sono fondi e non vanno misurati.
const daMisurare = ['--ink', '--ink-2', '--ink-3', '--ink-4', '--accent', '--olive', '--amber', '--danger', '--ok', '--common', '--uncommon', '--legendary'];

for (const [nome, tema] of [['chiaro', chiaro], ['scuro', scuro]]) {
  const peggiori = [];
  for (const t of daMisurare) {
    if (!tema[t]) continue;
    const min = Math.min(contrasto(tema[t], tema['--paper']), contrasto(tema[t], tema['--surface']));
    if (min < 4.5) peggiori.push(t + ' ' + min.toFixed(2) + 'x');
  }
  esito('tema ' + nome + ': tutti i colori di testo ≥ 4.5:1', peggiori.length === 0, peggiori.join(', '));
}

// ── 3 · Dimensioni del testo ──────────────────────────
console.log('\n— Dimensioni del testo (minimo 12px) —');
const misure = [...new Set([
  ...[...pulito.matchAll(/font-size:\s*([\d.]+)rem/g)].map((m) => parseFloat(m[1])),
  ...[...pulito.matchAll(/--t-[\w-]+:\s*(?:clamp\([^)]*,\s*)?([\d.]+)rem/g)].map((m) => parseFloat(m[1])),
])].sort((a, b) => a - b);
const troppoPiccole = misure.filter((r) => r * 16 < 12);
esito('nessun testo sotto i 12px', troppoPiccole.length === 0, troppoPiccole.map((r) => (r * 16).toFixed(1) + 'px').join(', '));
esito('scala contenuta (≤ 12 tagli)', misure.length <= 12, misure.length + ' tagli');
console.log('    tagli in uso: ' + misure.map((r) => (r * 16).toFixed(1)).join(', ') + ' px');

// ── 4 · Copertura delle classi ────────────────────────
console.log('\n— Classi —');
let src = ['app.js', 'gestore.js', 'data.js', 'index.html']
  .map((f) => fs.readFileSync(f, 'utf8')).join('\n').replace(/\\/g, '');
// La scheda stampa è un documento HTML a sé, con un suo <style> interno: le
// classi che usa (note, meta, total) non appartengono a questo foglio di stile.
src = src.split('\n').filter((riga) => !/printContent/.test(riga)).join('\n');
const classi = new Set();
// Solo nomi di classe plausibili: la concatenazione in JS lascia dentro le
// stringhe dei frammenti di codice che non c'entrano nulla con il markup.
for (const m of src.matchAll(/class="([a-zA-Z][a-zA-Z0-9_\- ]*)"/g)) {
  for (const c of m[1].split(/\s+/)) if (c) classi.add(c);
}
// Queste sono composte o concatenate, quindi il rilevamento sopra non le vede.
[
 // struttura della pagina, non leggibile dal markup
 'page-block', 'is-first', 'content', 'search-input',
 'filter-row', 'filter-badge', 'sb-group', 'sb-group-title', 'sb-btn', 'stato-badge',
 // righe per rarità
 'row-app', 'row-art', 'row-mst', 'row-gran', 'row-on', 'row-pmc', 'row-pmt', 'row-pasv', 'row-poe',
 'pat-pmc', 'pat-pmt', 'pat-pasv', 'pat-poe', 'pat-mista',
 // stati legali
 'stato-attiva', 'stato-sospesa', 'stato-sanzione', 'stato-sciolta',
 // sanzioni
 'sanz-lieve', 'sanz-grave', 'sanz-graviss', 'sanz-gilda-g', 'sanz-gilda-r',
 // aggiunte o tolte dal codice a runtime
 'sort-asc', 'sort-desc', 'sortable', 'table-filter-row', 'highlight', 'open', 'dark', 'active',
 // esiti e misure
 'num-in', 'num-out', 'dot-ok', 'dot-bad', 'row-active', 'num', 'total',
 'value', 'neg', 'pos', 'warn', 'label', 'small',
 // utilità
 'btn-bar', 'btn-block', 'muted-note', 'req-row', 'note-line', 'warn-border', 'align-end',
 'notes-area', 'mt', 'mb', 'mt-sm', 'approv-chip',
].forEach((c) => classi.add(c));
const definite = new Set([...pulito.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const mancanti = [...classi].filter((c) => !definite.has(c)).sort();
esito('ogni classe usata esiste nel CSS', mancanti.length === 0, mancanti.join(', '));
console.log('    classi verificate: ' + classi.size);

// ── 5 · Rendering reale con un DOM finto ──────────────
console.log('\n— Rendering —');
const cache = {};
function el(id) {
  const set = new Set();
  return {
    id, innerHTML: '', textContent: '', value: '', checked: false,
    style: {}, dataset: {}, cells: [], rows: [], attrs: {},
    classList: {
      add: (c) => set.add(c), remove: (c) => set.delete(c),
      toggle: (c, on) => (on === undefined ? (set.has(c) ? set.delete(c) : set.add(c)) : (on ? set.add(c) : set.delete(c))),
      contains: (c) => set.has(c),
    },
    addEventListener() {}, removeEventListener() {}, appendChild() {},
    insertBefore() {}, replaceChild() {},
    querySelectorAll: () => [], querySelector: () => null, closest: () => null,
    scrollIntoView() {}, focus() {}, blur() {}, click() {},
    setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k] ?? null; },
  };
}
global.document = {
  getElementById: (id) => cache[id] || (cache[id] = el(id)),
  querySelectorAll: () => [], createElement: () => el('new'),
  createDocumentFragment: () => ({ appendChild() {} }),
  createTreeWalker: () => ({ nextNode: () => false, currentNode: null }),
  addEventListener() {},
  body: Object.assign(el('body'), { style: {} }),
  documentElement: { scrollHeight: 4000 },
};
global.window = { addEventListener() {}, removeEventListener() {}, scrollTo() {}, scrollY: 0, innerHeight: 800, innerWidth: 1280 };
global.NodeFilter = { SHOW_TEXT: 4 };
global.localStorage = { _d: {}, getItem(k) { return k in this._d ? this._d[k] : null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
global.alert = () => {}; global.confirm = () => true; global.prompt = () => '';

const rotte = [];
for (const f of ['data.js', 'gestore.js', 'app.js']) {
  try { vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f }); }
  catch (e) { rotte.push(f + ': ' + e.message); }
}
esito('i tre script si caricano', rotte.length === 0, rotte.join(' · '));

if (rotte.length === 0) {
  const vuote = [];
  for (const [k, fn] of Object.entries(RENDER_GILDE)) { try { if (!fn().trim()) vuote.push('gilde.' + k); } catch (e) { vuote.push('gilde.' + k + ': ' + e.message); } }
  for (const [k, fn] of Object.entries(RENDER_LICENZE)) { try { if (!fn().trim()) vuote.push('licenze.' + k); } catch (e) { vuote.push('licenze.' + k + ': ' + e.message); } }
  esito('15 sezioni renderizzate', vuote.length === 0, vuote.join(', '));

  const schede = [];
  for (const id of ['gTop', 'gScheda', 'gSoci', 'gStrutt', 'gContr', 'gTrans', 'gSan', 'gEv', 'gNote']) {
    gInit(); if (!cache[id].innerHTML.trim()) schede.push(id);
  }
  esito('9 schede del Gestore renderizzate', schede.length === 0, schede.join(', '));

  try {
    trackerNew(gRandomData()); gInit();
    const html = cache.content.innerHTML;
    esito('nessun doppio attributo class', !/<[a-z0-9]+[^>]*class="[^"]*"[^>]*class="/i.test(html));
    const apri = (html.match(/<div\b/g) || []).length, chiudi = (html.match(/<\/div>/g) || []).length;
    esito('div bilanciati', apri === chiudi, apri + ' aperti, ' + chiudi + ' chiusi');
    const inline = [...html.matchAll(/style="[^"]*"/g)].map((m) => m[0]);
    const sporchi = inline.filter((s) => !/var\(--(common|uncommon|legendary|amber|olive)\)/.test(s) && !/\.col/.test(s));
    esito('solo colori data-driven inline nel markup', sporchi.length === 0, sporchi.slice(0, 3).join(' | '));
  } catch (e) { esito('società casuale + struttura HTML', false, e.message); }

  // etichette di colonna per l'impilamento su mobile
  const ths = ['Nome', 'Mestiere', 'Patente', ''].map((t) => ({ textContent: t }));
  const tds = ths.map(() => el('td'));
  labelTableCells({ querySelectorAll: (s) => (s === 'table' ? [{
    querySelector: (q) => (q === 'thead tr' ? { cells: ths } : null),
    querySelectorAll: (q) => (q === 'tbody tr' ? [{ cells: tds }] : []),
  }] : []) });
  esito('data-label copiato nell\'ordine giusto',
    JSON.stringify(tds.map((t) => t.attrs['data-label'])) === JSON.stringify(['Nome', 'Mestiere', 'Patente', '']));
  esito('colonna comandi senza etichetta', tds[3].attrs['data-label'] === '');
}

// ── 6 · Cache-busting ─────────────────────────────────
console.log('\n— Pubblicazione —');
const html = fs.readFileSync('index.html', 'utf8');
const ver = [...new Set([...html.matchAll(/\?v=([0-9a-z]+)/g)].map((m) => m[1]))];
esito('versione cache presente', ver.length === 1, ver.join(', '));
const assetSenzaVersione = ['styles.css', 'data.js', 'gestore.js', 'app.js']
  .filter((a) => !new RegExp(a.replace('.', '\\.') + '\\?v=').test(html));
esito('tutti e quattro gli asset sono versionati', assetSenzaVersione.length === 0, assetSenzaVersione.join(', '));
esito('un solo font caricato', (html.match(/fonts\.googleapis\.com\/css2/g) || []).length === 1);
esito('nessun serif display residuo', !/Fraunces/.test(html) && !/--font-display/.test(css));

console.log('\n' + (problemi === 0 ? '✅ TUTTO VERDE' : '❌ ' + problemi + ' PROBLEMI'));
process.exit(problemi === 0 ? 0 : 1);
