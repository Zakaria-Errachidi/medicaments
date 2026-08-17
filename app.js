// =====================================================================
// Application "Santé au quotidien"
// Aucune donnée n'est envoyée sur internet : tout se passe dans le
// téléphone / l'ordinateur, à partir des fichiers CSV.
// =====================================================================

// ---------------------------------------------------------------
// Outils génériques : normalisation, distance de Levenshtein, CSV
// ---------------------------------------------------------------

function normalize(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // supprime les accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")       // ponctuation -> espace
    .replace(/\s+/g, " ")
    .trim();
}

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

function toleranceFor(len) {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  return 2;
}

// Parseur CSV simple (gère les guillemets et les virgules à l'intérieur
// des champs). Suppose un séparateur virgule, encodage UTF-8, en-tête
// en première ligne.
function parseCSV(text) {
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
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  const cleanRows = rows.filter(r => r.some(cell => cell.trim() !== ""));
  if (cleanRows.length === 0) return [];

  const header = cleanRows[0].map(h => h.trim().toLowerCase());
  const items = [];
  for (let i = 1; i < cleanRows.length; i++) {
    const cells = cleanRows[i];
    const obj = {};
    header.forEach((key, idx) => { obj[key] = (cells[idx] || "").trim(); });
    items.push(obj);
  }
  return items;
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function accentPattern(char) {
  const map = {
    a: "[aàâäá]", e: "[eéèêë]", i: "[iîïí]", o: "[oôöó]",
    u: "[uûüú]", c: "[cç]", n: "[nñ]"
  };
  return map[char] || escapeRegExp(char);
}

function highlight(text, queryWords) {
  if (!text) return "";
  let html = escapeHTML(text);
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

// ---------------------------------------------------------------
// Moteur de recherche générique pour une section (médicaments,
// aliments ou symptômes). `cfg` décrit les particularités de chaque
// section : fichier CSV, champs utilisés pour chercher, et fonction
// d'affichage d'une carte.
// ---------------------------------------------------------------

function createSection(cfg) {
  const key = cfg.key;
  const els = {
    input: document.getElementById(`search-input-${key}`),
    clearBtn: document.querySelector(`.clear-btn[data-clear="${key}"]`),
    results: document.getElementById(`results-${key}`),
    status: document.getElementById(`status-line-${key}`),
    empty: document.getElementById(`empty-state-${key}`),
    noResults: document.getElementById(`no-results-${key}`),
    loadError: document.getElementById(`load-error-${key}`),
  };

  let data = [];
  let dataReady = false;
  let debounceTimer = null;

  async function loadData() {
    try {
      const response = await fetch(cfg.csvFile, { cache: "no-cache" });
      if (!response.ok) throw new Error("Fichier CSV introuvable: " + cfg.csvFile);
      const text = await response.text();
      const rows = parseCSV(text);
      rows.forEach(row => {
        row._search = normalize(cfg.searchFields.map(f => row[f] || "").join(" "));
      });
      data = rows;
      dataReady = true;
      updateGlobalCount();
      if (els.input.value.trim().length > 0) runSearch(els.input.value);
    } catch (err) {
      console.error(err);
      els.loadError.hidden = false;
      els.empty.hidden = true;
    }
  }

  function scoreItem(item, queryNorm, queryWords) {
    if (item._search.includes(queryNorm)) return 0;

    const targetWords = item._search.split(" ");
    let matchedWords = 0;
    let fuzzyUsed = false;

    for (const qw of queryWords) {
      let ok = false;
      for (const tw of targetWords) {
        if (tw.startsWith(qw)) { ok = true; break; }
        if (levenshtein(qw, tw) <= toleranceFor(qw.length)) { ok = true; fuzzyUsed = true; }
      }
      if (ok) matchedWords++;
    }

    if (matchedWords === 0 || matchedWords < queryWords.length) return null;
    return fuzzyUsed ? 2 : 1;
  }

  function search(query) {
    const queryNorm = normalize(query);
    if (queryNorm === "") return [];
    const queryWords = queryNorm.split(" ").filter(Boolean);

    const scored = [];
    for (const item of data) {
      const score = scoreItem(item, queryNorm, queryWords);
      if (score !== null) scored.push({ item, score });
    }

    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return (a.item[cfg.sortField] || "").localeCompare(b.item[cfg.sortField] || "", "fr");
    });

    return scored.map(s => s.item);
  }

  function runSearch(value) {
    const trimmed = value.trim();

    if (!dataReady) {
      els.status.textContent = "Chargement en cours...";
      return;
    }

    if (trimmed === "") {
      els.results.innerHTML = "";
      els.status.textContent = "";
      els.empty.hidden = false;
      els.noResults.hidden = true;
      return;
    }

    els.empty.hidden = true;
    const queryWords = normalize(trimmed).split(" ").filter(Boolean);
    const items = search(trimmed);

    if (items.length === 0) {
      els.results.innerHTML = "";
      els.noResults.hidden = false;
      els.status.textContent = "";
      return;
    }

    els.noResults.hidden = true;
    els.status.textContent = items.length === 1 ? "1 résultat trouvé" : `${items.length} résultats trouvés`;

    els.results.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (const item of items) frag.appendChild(cfg.renderCard(item, queryWords));
    els.results.appendChild(frag);
  }

  function onInputChange() {
    const value = els.input.value;
    els.clearBtn.hidden = value.length === 0;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(value), 120);
  }

  els.input.addEventListener("input", onInputChange);
  els.clearBtn.addEventListener("click", () => {
    els.input.value = "";
    els.clearBtn.hidden = true;
    runSearch("");
    els.input.focus();
  });

  loadData();

  return { get count() { return data.length; } };
}

// ---------------------------------------------------------------
// Petits utilitaires d'affichage communs (cartes)
// ---------------------------------------------------------------

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
// Section MÉDICAMENTS
// ---------------------------------------------------------------

function renderMedicamentCard(m, queryWords) {
  const isUnavailable = /rupture|indisponible|arret/i.test(normalize(m.statut || ""));

  const card = document.createElement("article");
  card.className = "card med-card" + (isUnavailable ? " unavailable" : "");

  const name = document.createElement("p");
  name.className = "card-title";
  name.innerHTML = highlight(m.nom, queryWords);
  card.appendChild(name);

  if (m.dosage) {
    const dosage = document.createElement("p");
    dosage.className = "card-subtitle";
    dosage.textContent = m.dosage;
    card.appendChild(dosage);
  }

  const dl = document.createElement("dl");
  dl.className = "card-details";
  addDetail(dl, "Substance", highlight(m.substance, queryWords), true);
  addDetail(dl, "Présentation", escapeHTML(m.presentation));
  addDetail(dl, "Forme", escapeHTML(m.forme));
  card.appendChild(dl);

  if (m.statut) {
    const badge = document.createElement("span");
    badge.className = "badge" + (isUnavailable ? " unavailable" : "");
    badge.textContent = m.statut;
    card.appendChild(badge);
  }

  return card;
}

// ---------------------------------------------------------------
// Section ALIMENTS
// ---------------------------------------------------------------

function renderAlimentCard(a, queryWords) {
  const card = document.createElement("article");
  card.className = "card aliment-card";

  const name = document.createElement("p");
  name.className = "card-title";
  name.innerHTML = highlight(a.aliment, queryWords);
  card.appendChild(name);

  if (a.agit_comme) {
    const subtitle = document.createElement("p");
    subtitle.className = "card-subtitle";
    subtitle.textContent = "Agit comme : " + a.agit_comme;
    card.appendChild(subtitle);
  }

  const dl = document.createElement("dl");
  dl.className = "card-details";
  addDetail(dl, "Proche de", highlight(a.substance_liee, queryWords), true);
  addDetail(dl, "Effet", escapeHTML(a.effet));
  card.appendChild(dl);

  if (a.niveau_preuve) {
    const badge = document.createElement("span");
    badge.className = "badge aliment";
    badge.textContent = a.niveau_preuve;
    card.appendChild(badge);
  }

  if (a.precaution) {
    const box = document.createElement("p");
    box.className = "precaution-box";
    box.innerHTML = "<strong>À savoir : </strong>" + escapeHTML(a.precaution);
    card.appendChild(box);
  }

  return card;
}

// ---------------------------------------------------------------
// Section SYMPTÔMES
// ---------------------------------------------------------------

function renderSymptomeCard(s, queryWords) {
  const card = document.createElement("article");
  card.className = "card symptome-card";

  const name = document.createElement("p");
  name.className = "card-title";
  name.innerHTML = highlight(s.symptome, queryWords);
  card.appendChild(name);

  const dl = document.createElement("dl");
  dl.className = "card-details";
  addDetail(dl, "Causes possibles", escapeHTML(s.causes_possibles));
  addDetail(dl, "Conseils", escapeHTML(s.conseils));
  card.appendChild(dl);

  if (s.urgence) {
    const box = document.createElement("p");
    box.className = "urgence-box";
    box.innerHTML = "<strong>⚠ Consultez si : </strong>" + escapeHTML(s.urgence);
    card.appendChild(box);
  }

  return card;
}

// ---------------------------------------------------------------
// Menu à onglets
// ---------------------------------------------------------------

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      buttons.forEach(b => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".view").forEach(view => {
        view.hidden = view.id !== `view-${target}`;
      });
    });
  });
}

// ---------------------------------------------------------------
// Compteur global (pied de page)
// ---------------------------------------------------------------

const sectionCounts = {};
function updateGlobalCount() {
  const parts = [];
  if (sectionCounts.medicaments != null) parts.push(`${sectionCounts.medicaments} médicaments`);
  if (sectionCounts.aliments != null) parts.push(`${sectionCounts.aliments} aliments`);
  if (sectionCounts.symptomes != null) parts.push(`${sectionCounts.symptomes} symptômes`);
  document.getElementById("update-info").textContent = parts.length ? parts.join(" · ") : "";
}

// ---------------------------------------------------------------
// Démarrage
// ---------------------------------------------------------------

setupTabs();

const medicamentsSection = createSection({
  key: "medicaments",
  csvFile: "medicaments.csv",
  searchFields: ["nom", "substance"],
  sortField: "nom",
  renderCard: renderMedicamentCard,
});

const alimentsSection = createSection({
  key: "aliments",
  csvFile: "aliments.csv",
  searchFields: ["aliment", "agit_comme", "substance_liee"],
  sortField: "aliment",
  renderCard: renderAlimentCard,
});

const symptomesSection = createSection({
  key: "symptomes",
  csvFile: "symptomes.csv",
  searchFields: ["symptome"],
  sortField: "symptome",
  renderCard: renderSymptomeCard,
});

// Rafraîchit le compteur du pied de page à intervalle court le temps
// que les 3 fichiers CSV finissent de charger (asynchrones).
const countPoll = setInterval(() => {
  sectionCounts.medicaments = medicamentsSection.count || sectionCounts.medicaments;
  sectionCounts.aliments = alimentsSection.count || sectionCounts.aliments;
  sectionCounts.symptomes = symptomesSection.count || sectionCounts.symptomes;
  updateGlobalCount();
  if (sectionCounts.medicaments && sectionCounts.aliments && sectionCounts.symptomes) {
    clearInterval(countPoll);
  }
}, 200);

// ---------------------------------------------------------------
// PWA : enregistrement du service worker
// ---------------------------------------------------------------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(err => {
      console.warn("Service worker non installé :", err);
    });
  });
}
