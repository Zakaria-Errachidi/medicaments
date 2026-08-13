// =====================================================================
// Application de recherche de médicaments
// Aucune donnée n'est envoyée sur internet : tout se passe dans le
// téléphone / l'ordinateur, à partir du fichier medicaments.csv.
// =====================================================================

const CSV_URL = "medicaments.csv";

const searchInput = document.getElementById("search-input");
const clearBtn = document.getElementById("clear-btn");
const resultsEl = document.getElementById("results");
const statusLine = document.getElementById("status-line");
const emptyState = document.getElementById("empty-state");
const noResults = document.getElementById("no-results");
const loadError = document.getElementById("load-error");
const updateInfo = document.getElementById("update-info");

let medicaments = [];   // tableau d'objets {nom, dosage, substance, presentation, forme, statut}
let dataReady = false;

// ---------------------------------------------------------------
// 1. Lecture du CSV (parseur maison, sans dépendance externe,
//    pour que l'application fonctionne aussi hors connexion)
// ---------------------------------------------------------------

async function loadData() {
  try {
    const response = await fetch(CSV_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error("Fichier CSV introuvable");
    const text = await response.text();
    medicaments = parseCSV(text);
    dataReady = true;
    updateInfo.textContent = `${medicaments.length} médicaments dans la base`;
    // Si l'utilisateur avait déjà commencé à taper pendant le chargement
    if (searchInput.value.trim().length > 0) {
      runSearch(searchInput.value);
    }
  } catch (err) {
    console.error(err);
    loadError.hidden = false;
    emptyState.hidden = true;
  }
}

// Parseur CSV simple gérant les guillemets et les virgules à l'intérieur
// des champs (ex: "0,25 mg"). Suppose un séparateur virgule et un
// encodage UTF-8, la première ligne étant l'en-tête.
function parseCSV(text) {
  // Retire un éventuel BOM
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(field); field = ""; }
      else if (c === '\r') { /* ignore */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else { field += c; }
    }
  }
  // dernière ligne si le fichier ne finit pas par un retour à la ligne
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  const cleanRows = rows.filter(r => r.some(cell => cell.trim() !== ""));
  if (cleanRows.length === 0) return [];

  const header = cleanRows[0].map(h => h.trim().toLowerCase());
  const items = [];
  for (let i = 1; i < cleanRows.length; i++) {
    const cells = cleanRows[i];
    const obj = {};
    header.forEach((key, idx) => { obj[key] = (cells[idx] || "").trim(); });
    // Champ de recherche combiné (nom + substance), normalisé une seule fois
    obj._search = normalize(`${obj.nom || ""} ${obj.substance || ""}`);
    items.push(obj);
  }
  return items;
}

// ---------------------------------------------------------------
// 2. Normalisation du texte : minuscules + suppression des accents
// ---------------------------------------------------------------

function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // supprime les accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")       // ponctuation -> espace
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------
// 3. Distance de Levenshtein (tolérance aux petites fautes de frappe)
// ---------------------------------------------------------------

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

// Seuil de tolérance selon la longueur du mot tapé
function toleranceFor(len) {
  if (len <= 3) return 0;   // mots très courts : orthographe exacte requise
  if (len <= 6) return 1;   // une petite faute tolérée
  return 2;                 // mots longs : deux fautes tolérées
}

// Un mot de la recherche correspond-il à un mot du texte source ?
function wordMatches(queryWord, targetWord) {
  if (targetWord.startsWith(queryWord)) return true; // recherche progressive
  const dist = levenshtein(queryWord, targetWord);
  return dist <= toleranceFor(queryWord.length);
}

// ---------------------------------------------------------------
// 4. Recherche + score (0 = meilleure correspondance)
// ---------------------------------------------------------------

function scoreItem(item, queryNorm, queryWords) {
  // Correspondance exacte de toute la requête -> meilleur score
  if (item._search.includes(queryNorm)) return 0;

  const targetWords = item._search.split(" ");
  let matchedWords = 0;
  let fuzzyUsed = false;

  for (const qw of queryWords) {
    let bestForWord = false;
    for (const tw of targetWords) {
      if (tw.startsWith(qw)) { bestForWord = true; break; }
      if (levenshtein(qw, tw) <= toleranceFor(qw.length)) {
        bestForWord = true;
        fuzzyUsed = true;
      }
    }
    if (bestForWord) matchedWords++;
  }

  if (matchedWords === 0) return null; // aucune correspondance
  if (matchedWords < queryWords.length) return null; // tous les mots doivent matcher

  return fuzzyUsed ? 2 : 1;
}

function search(query) {
  const queryNorm = normalize(query);
  if (queryNorm === "") return [];
  const queryWords = queryNorm.split(" ").filter(Boolean);

  const scored = [];
  for (const item of medicaments) {
    const score = scoreItem(item, queryNorm, queryWords);
    if (score !== null) scored.push({ item, score });
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.item.nom.localeCompare(b.item.nom, "fr");
  });

  return scored.map(s => s.item);
}

// ---------------------------------------------------------------
// 5. Affichage
// ---------------------------------------------------------------

function highlight(text, queryWords) {
  if (!text) return "";
  let html = escapeHTML(text);
  const normed = normalize(text);
  // Construit les positions à surligner en comparant texte normalisé / original
  // Approche simple et robuste : on surligne les correspondances exactes de
  // préfixe de chaque mot de la requête dans le texte affiché (insensible
  // aux accents/majuscules), suffisant pour guider visuellement l'oeil.
  for (const qw of queryWords) {
    if (qw.length < 2) continue;
    const re = new RegExp(
      "(" + escapeRegExp(qw).replace(/./g, c => accentPattern(c)) + ")",
      "gi"
    );
    html = html.replace(re, "<mark>$1</mark>");
  }
  return html;
}

// Construit un motif regex qui accepte les variantes accentuées d'une lettre
function accentPattern(char) {
  const map = {
    a: "[aàâäá]", e: "[eéèêë]", i: "[iîïí]", o: "[oôöó]",
    u: "[uûüú]", c: "[cç]", n: "[nñ]"
  };
  return map[char] || escapeRegExp(char);
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderResults(items, queryWords) {
  resultsEl.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const m of items) {
    const isUnavailable = /rupture|indisponible|arret/i.test(normalize(m.statut || ""));

    const card = document.createElement("article");
    card.className = "med-card" + (isUnavailable ? " unavailable" : "");

    const name = document.createElement("p");
    name.className = "med-name";
    name.innerHTML = highlight(m.nom, queryWords);
    card.appendChild(name);

    if (m.dosage) {
      const dosage = document.createElement("p");
      dosage.className = "med-dosage";
      dosage.textContent = m.dosage;
      card.appendChild(dosage);
    }

    const dl = document.createElement("dl");
    dl.className = "med-details";
    addDetail(dl, "Substance", highlight(m.substance, queryWords), true);
    addDetail(dl, "Présentation", escapeHTML(m.presentation));
    addDetail(dl, "Forme", escapeHTML(m.forme));
    card.appendChild(dl);

    if (m.statut) {
      const badge = document.createElement("span");
      badge.className = "status-badge" + (isUnavailable ? " unavailable" : "");
      badge.textContent = m.statut;
      card.appendChild(badge);
    }

    frag.appendChild(card);
  }

  resultsEl.appendChild(frag);
}

function addDetail(dl, label, valueHTML, isHTML) {
  if (!valueHTML) return;
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  if (isHTML) dd.innerHTML = valueHTML; else dd.textContent = valueHTML;
  dl.appendChild(dt);
  dl.appendChild(dd);
}

// ---------------------------------------------------------------
// 6. Gestion de la saisie (avec un léger anti-rebond)
// ---------------------------------------------------------------

let debounceTimer = null;

function onInputChange() {
  const value = searchInput.value;
  clearBtn.hidden = value.length === 0;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => runSearch(value), 120);
}

function runSearch(value) {
  const trimmed = value.trim();

  if (!dataReady) {
    statusLine.textContent = "Chargement de la liste des médicaments...";
    return;
  }

  if (trimmed === "") {
    resultsEl.innerHTML = "";
    statusLine.textContent = "";
    emptyState.hidden = false;
    noResults.hidden = true;
    return;
  }

  emptyState.hidden = true;
  const queryWords = normalize(trimmed).split(" ").filter(Boolean);
  const items = search(trimmed);

  if (items.length === 0) {
    resultsEl.innerHTML = "";
    noResults.hidden = false;
    statusLine.textContent = "";
    return;
  }

  noResults.hidden = true;
  statusLine.textContent = items.length === 1
    ? "1 médicament trouvé"
    : `${items.length} médicaments trouvés`;
  renderResults(items, queryWords);
}

searchInput.addEventListener("input", onInputChange);
clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearBtn.hidden = true;
  runSearch("");
  searchInput.focus();
});

// ---------------------------------------------------------------
// 7. PWA : enregistrement du service worker
// ---------------------------------------------------------------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(err => {
      console.warn("Service worker non installé :", err);
    });
  });
}

// ---------------------------------------------------------------
// Démarrage
// ---------------------------------------------------------------

loadData();
