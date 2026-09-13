// ════════════════════════════════════════════════
//  DATA CENTRALIZZATI — Società & Licenze di Arcamis
//  PAGES / NAV / DATA / PATENTI / TIP_SIGLE
// ════════════════════════════════════════════════
const PAGES = ['gilde', 'licenze'];

const NAV = {
  gilde: [
    { id:'panoramica',  label:'📖 Panoramica' },
    { id:'livelli',     label:'🏪 I 4 Livelli' },
    { id:'procedura',   label:'📜 Procedura Passo-Passo' },
    { id:'entrate',     label:'💰 Entrate' },
    { id:'riferimenti', label:'📚 Riferimenti (Avanzato)' },
    { id:'gestore',     label:'🎛️ Gestore di Società' },
  ],
  licenze: [
    { id:'panoramica',  label:'📖 Panoramica' },
    { id:'vantaggi',    label:'✦ Vantaggi' },
    { id:'quadro',      label:'📋 Quadro Patenti' },
    { id:'pmc',         label:'🟢 P.M.C.' },
    { id:'pmt',         label:'🔵 P.M.T.' },
    { id:'pasv',        label:'🟠 P.A.S.V.' },
    { id:'poe',         label:'🟡 P.O.E.' },
    { id:'inchiostri',  label:'🖋️ Inchiostri' },
    { id:'strumenti',   label:'🛠️ Strumenti Patenti' },
  ],
};

const SIDEBAR = [
  { pg:'gilde',   group:'🏛️ Imprese',          items: NAV.gilde },
  { pg:'licenze', group:'⚖️ Licenze & Patenti', items: NAV.licenze },
];

// ════════════════════════════════════════════════
//  DATA CENTRALIZZATI
// ════════════════════════════════════════════════
const DATA = {
  livelli: [
    { id:1, name:'Bottega Artigiana', patente:'P.M.C.', fee:100, feeRange:'100–150', tax:15, taxRange:'15', sumFee:100,
      motto:'Fondazione: un piccolo laboratorio o negozietto di quartiere per muovere i primi passi.',
      sede:'Un luogo modesto, non troppo piccolo ma neanche troppo grande (laboratorio o negozietto di quartiere).',
      requisiti:[
        'Almeno <strong>2 PG soci</strong> (divisibile tra <span class="nw">2+ soci</span>)',
        'Un <strong>Responsabile</strong> con la patente <strong>P.M.C.</strong>'
      ],
      benefici:[
        '<strong>Spazio Comune:</strong> cassa comune e magazzino condiviso per i soci.',
        '<strong>Crafting Base:</strong> crafting più rapido del <strong>10%</strong> nella propria sede.',
        '<strong>Vendita Diretta:</strong> possibilità di vendere manufatti base al prezzo di listino pieno, senza intermediazione.'
      ] },
    { id:2, name:'Fondaco / Officina', patente:'P.M.T.', fee:625, feeRange:'500–750', tax:50, taxRange:'50', sumFee:725,
      motto:'Espansione: più produzione e un nome nuovo <span class="nw">in città.</span>',
      sede:'Un intero edificio piccolo: negozio con retrobottega, piccola fucina o alambicco.',
      requisiti:[
        'Almeno <strong>3 PG soci</strong>',
        'Un socio con mestiere tecnico qualificato (<strong>P.M.T.</strong>)'
      ],
      benefici:[
        '<strong>Crafting Aumentato:</strong> riduce del 10% il costo in materie prime o del 25% il tempo di creazione dei manufatti.',
        '<strong>Dipendenti NPC:</strong> 1–2 NPC che producono nei Downtime (minimo <strong><span class="nw">10 Mo/mese a testa</span></strong>).',
        '<strong>Magazzino Sicuro:</strong> protezione contro furti ed eventi sfortunati per le scorte.'
      ] },
    { id:3, name:'Compagnia Commerciale', patente:'P.A.S.V.', fee:3000, feeRange:'2.500–3.500', tax:200, taxRange:'200', sumFee:3725,
      motto:'Il salto commerciale: filiali, contratti e materiali <span class="nw">rari.</span>',
      sede:'Un palazzo commerciale, un grande laboratorio o un magazzino portuale.',
      requisiti:[
        'Almeno <strong>4 PG soci</strong>',
        '<strong>Licenza speciale</strong> di commercio: <strong>P.A.S.V.</strong> per il Responsabile'
      ],
      benefici:[
        '<strong>Appalti del Regno:</strong> accesso prioritario alle missioni/bacheche di fornitura per il regno o le fazioni (ricompense in monete o reputazione).',
        '<strong>Produzione di Oggetti Rari:</strong> capacità di accedere o sintetizzare materiali rari/speciali non reperibili al mercato comune.',
        '<strong>Sconto sulle Licenze:</strong> i soci ottengono sconti o rinnovo gratuito per le licenze personali di grado inferiore.'
      ] },
    { id:4, name:'Grande Corporazione', patente:'P.O.E.', fee:12500, feeRange:'10.000–15.000', tax:875, taxRange:'750–1.000', sumFee:16225,
      motto:'Il colosso: influenza su <span class="nw">politica e commercio.</span>',
      sede:'Un complesso edilizio o una grande sede di rappresentanza (es. Palazzo della Gilda).',
      requisiti:[
        'Almeno <strong>5 PG soci</strong>',
        'Un socio con la licenza <strong>P.O.E.</strong> (Mastro Artigiano: mestiere <strong>lv 4</strong>)',
        '<strong>Approvazione</strong> della Camera di Commercio / Consiglio del Regno'
      ],
      benefici:[
        '<strong>Sconto Massivo di Gruppo:</strong> materie prime e tempi di crafting dimezzati del 50% per tutto il gruppo.',
        '<strong>Influenza Politica:</strong> accesso a informazioni riservate, contatti d\u0027alto bordo e supporto logistico nelle quest (es. trasporti gratuiti, mercenari di supporto).',
        '<span class="opt-tag">opzionale</span><strong>Diritto di Monopolio / Brevetti:</strong> diritto esclusivo su beni speciali nell\u0027area, con royalty sugli altri artigiani.'
      ] },
  ],
  fondi: { init: 30, deposit: 0 },
  fornitura: [
    { name:'Manifattura Comune',    pat:'P.M.C.',  cost:45,  rent:30  },
    { name:'Manifattura Tecnica',   pat:'P.M.T.',  cost:120, rent:80  },
    { name:'Alchimia e Sostanze Vincolate', pat:'P.A.S.V.', cost:300, rent:200 },
    { name:'Opere Eccezionali',     pat:'P.O.E.',  cost:750, rent:500 },
  ],
  patenti: [
    { sigla:'P.M.C.',  nome:'Manifattura Comune',                 costo:40, cauzione:10, totale:50,  durata:'3 anni', cls:'row-pmc',  col:'var(--common)',    sezione:'pmc',  destinatari:'Osti, Sarti, Falegnami e Artisti' },
    { sigla:'P.M.T.',  nome:'Manifattura Tecnica',                costo:85, cauzione:25, totale:110, durata:'3 anni', cls:'row-pmt',  col:'var(--uncommon)',  sezione:'pmt',  destinatari:'Fabbri, Gioiellieri, Architetti e Cartografi' },
    { sigla:'P.A.S.V.',nome:'Alchimia e Sostanze Vincolate',      costo:140,cauzione:40, totale:180, durata:'3 anni', cls:'row-pasv', col:'var(--amber)',     sezione:'pasv', destinatari:'Alchimisti e Artigiani Hextech' },
    { sigla:'P.O.E.',  nome:'Opere Eccezionali',                  costo:300,cauzione:100,totale:400, durata:'3 anni', cls:'row-poe',  col:'var(--legendary)', sezione:'poe',  destinatari:'Maestri Artigiani (LV4+)' },
  ],
  strutture: [
    { nome:'Magazzino', lv:1, cost:300, effetto:'Stoccaggio materiali, approvvigionamento più rapido.' },
    { nome:'Cucina', lv:1, cost:70, effetto:'Permette all\u0027Oste di produrre ricette (4 Mo carbone/sett.).' },
    { nome:'Orto', lv:1, cost:80, effetto:'+30 Mo di erbe/mese (max 2 per sede).' },
    { nome:'Stalla', lv:1, cost:70, effetto:'Fino a 5 animali, consegne più economiche.' },
    { nome:'Scantinato', lv:1, cost:100, effetto:'Deposito nascosto: capienza extra e meno controlli.' },
    { nome:'Recinzione', lv:1, cost:70, effetto:'Delimita il perimetro, riduce il rischio di furti.' },
    { nome:'Forgia Noxiana', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere metallurgico), 1× per Riposo Lungo.' },
    { nome:'Laboratorio', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (alchimia/incantesimi), 1× per Riposo Lungo.' },
    { nome:'Torre Difensiva', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (difesa/guardia), 1× per Riposo Lungo.' },
    { nome:'Cucina Professionale', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere culinario), 1× per Riposo Lungo.' },
    { nome:'Covo Arcano', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere arcano), 1× per Riposo Lungo.' },
    { nome:'Altare del Devoto', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere religioso), 1× per Riposo Lungo.' },
    { nome:'Sala della Musica', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere artistico), 1× per Riposo Lungo.' },
    { nome:'Stanza degli Esperimenti', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (ingegneria/hextech), 1× per Riposo Lungo.' },
    { nome:'Campo di Addestramento', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (combattimento), 1× per Riposo Lungo.' },
    { nome:'Covo del Fuorilegge', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (traffici ombra), 1× per Riposo Lungo.' },
  ],
  sanzioni: [
    { tipo:'Lieve', name:'Atto Costitutivo o Registro non aggiornato', multa:50, sosp:'—', effetto:'Regolarizzazione entro 15 giorni.', cls:'sanz-lieve' },
    { tipo:'Lieve', name:'Tassa Camera non pagata (primo richiamo)', multa:50, sosp:'—', effetto:'Pagamento arretrati + regolarizzazione entro 15 giorni.', cls:'sanz-lieve' },
    { tipo:'Lieve', name:'Insegna o segnaletica non conforme', multa:50, sosp:'—', effetto:'Sostituzione entro 15 giorni.', cls:'sanz-lieve' },
    { tipo:'Lieve', name:'Apprendista senza contratto di apprendistato', multa:50, sosp:'—', effetto:'Contratto entro 15 giorni.', cls:'sanz-lieve' },
    { tipo:'Lieve', name:'Mancata dichiarazione mensile delle armi (prima volta)', multa:50, sosp:'—', effetto:'Dichiarazione immediata.', cls:'sanz-lieve' },
    { tipo:'Grave', name:'Registro Entrate/Uscite falsificato', multa:200, sosp:'3 mesi', effetto:'Sospensione attività e controlli.', cls:'sanz-grave' },
    { tipo:'Grave', name:'Dichiarazione armi ripetutamente mancata', multa:200, sosp:'3 mesi', effetto:'Sospensione attività.', cls:'sanz-grave' },
    { tipo:'Grave', name:'Produzione magica fuori dai permessi della patente', multa:200, sosp:'3 mesi', effetto:'Sospensione + verifica requisiti.', cls:'sanz-grave' },
    { tipo:'Grave', name:'Ispezione U.R.V. fallita (requisiti non rispettati)', multa:200, sosp:'3 mesi', effetto:'Sospensione fino a regolarizzazione.', cls:'sanz-grave' },
    { tipo:'Grave', name:'Corporazione: Fondo di Categoria mancante', multa:200, sosp:'3 mesi', effetto:'Integrazione del fondo + verifica.', cls:'sanz-grave' },
    { tipo:'Gravissima', name:'Contraffazione del Timbro d\u0027Impresa', multa:0, sosp:'Scioglimento', effetto:'Scioglimento coatto + confisca cassa.', cls:'sanz-graviss' },
    { tipo:'Gravissima', name:'Esercizio senza patente valida per la categoria', multa:0, sosp:'Scioglimento', effetto:'Scioglimento coatto + Sigillo Spezzato ai soci.', cls:'sanz-graviss' },
    { tipo:'Gravissima', name:'Corporazione: uso scorretto del Sigillo', multa:0, sosp:'Scioglimento', effetto:'Revoca dell\u0027approvazione della Camera + confisca cassa + scioglimento.', cls:'sanz-graviss' },
    { tipo:'Gravissima', name:'Corporazione: abuso del Monopolio (commesse)', multa:0, sosp:'Scioglimento', effetto:'Perdita del monopolio + scioglimento.', cls:'sanz-graviss' },
  ],
  eventi: [
    { nome:'Prima Fiera della Rinascita', stagione:'Primavera', mese:'1° mese', effetto:'+15% ai prezzi di vendita per il mese.', entita:15 },
    { nome:'Grande Mercato dei Popoli', stagione:'Primavera', mese:'2° mese', effetto:'+20% alle vendite per 1 mese.', entita:20 },
    { nome:'Fiera dei Mestieri', stagione:'Primavera', mese:'3° mese', effetto:'Un apprendista gratis per un mese.', entita:0 },
    { nome:'Carovane del Marchesato', stagione:'Estate', mese:'1° mese', effetto:'Commesse militari raddoppiate per il mese.', entita:50 },
    { nome:'Carestia degli Anni Grigi', stagione:'Estate', mese:'2° mese', effetto:'−20% alle vendite di cibo per il mese; +20% prezzi materiali.', entita:-20 },
    { nome:'Dazi Imperiali', stagione:'Estate', mese:'3° mese', effetto:'+5% ai costi delle materie prime per il mese.', entita:-5 },
    { nome:'Gloria Arcana', stagione:'Autunno', mese:'1° mese', effetto:'+25% alle vendite per 3 mesi.', entita:25 },
    { nome:'Festa del Raccolto', stagione:'Autunno', mese:'2° mese', effetto:'+30% alle vendite per 1 mese.', entita:30 },
    { nome:'Assedio alle Frontiere', stagione:'Autunno', mese:'3° mese', effetto:'Commesse di difesa triplicate; +5% costi.', entita:0 },
    { nome:'Nevi Interminabili', stagione:'Inverno', mese:'1° mese', effetto:'−15% alle vendite; consegne più costose.', entita:-15 },
    { nome:'Notte delle Candele', stagione:'Inverno', mese:'2° mese', effetto:'+10% alle vendite artistiche per il mese.', entita:10 },
    { nome:'Rinascita del Regno', stagione:'Inverno', mese:'3° mese', effetto:'Fine anno: +1 tasso di Prestigio o tassa esente.', entita:10 },
  ],
  tiriEvento: [
    { range:'1',    nome:'Catastrofe', effetto:'Un focolaio colpisce l\u0027Impresa: −25% fatturato; possibile sanzione Lieve se non segnali.' },
    { range:'2–4',  nome:'Momento difficile', effetto:'Malopera o rottura: −10% fatturato per il mese.' },
    { range:'5–9',  nome:'Nulla di notevole', effetto:'Il mese scorre normale.' },
    { range:'10–14',nome:'Occasione', effetto:'Una commessa in più: +10% fatturato.' },
    { range:'15–18',nome:'Buona stella', effetto:'+20% alle vendite per il mese.' },
    { range:'19+',  nome:'Evento leggendario', effetto:'Scelta tra +40% fatturato o un rapporto autorevole al Consiglio (Prestigio).' },
  ],
  };

const PATENTI_DATA = DATA.patenti; // alias per compatibilità

// Abbreviazioni con tooltip
const TIP_SIGLE = {
  'P.M.C.':'Manifattura Comune',
  'P.M.T.':'Manifattura Tecnica',
  'P.A.S.V.':'Alchimia e Sostanze Vincolate',
  'P.O.E.':'Opere Eccezionali',
  'U.R.V.':'Ufficio del Registro e della Vigilanza',
  'Mo':'Monete d\u0027oro: la valuta del Codice',
  'DT':'Downtime: tempo libero tra le avventure',
};
