/* ============================================================
   ui.js — génération dynamique de l'affichage (DOM)
   Les cartes et le contenu de la modale sont entièrement
   créés en JS à partir des données de l'API / du localStorage.
   ============================================================ */

const UI = {

  grid: document.getElementById("grid"),
  emptyState: document.getElementById("empty-state"),
  resultsMeta: document.getElementById("results-meta"),

  /** Génère une teinte stable à partir d'une chaîne (pour les affiches de substitution) */
  hashHue(str){
    let hash = 0;
    for(let i = 0; i < str.length; i++){
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
  },

  /** Applique une affiche stylisée générée (dégradé + titre + genre) — pas d'image réelle en mode local */
  applyPosterPlaceholder(container, item){
    const hue = this.hashHue(item.titre);
    container.style.background = `linear-gradient(160deg, hsl(${hue} 45% 16%), hsl(${(hue + 40) % 360} 40% 9%))`;
    const ph = document.createElement("div");
    ph.className = "no-poster";
    const icon = document.createElement("div");
    icon.className = "no-poster-icon";
    icon.textContent = item.type === "movie" ? "🎬" : "📺";
    const label = document.createElement("div");
    label.className = "no-poster-title";
    label.textContent = item.titre;
    ph.append(icon, label);
    container.appendChild(ph);
  },

  /** Construit une carte de film/série (élément DOM) */
  buildCard(item){
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = item.id;
    card.dataset.type = item.type;

    const posterWrap = document.createElement("div");
    posterWrap.className = "card-poster";
    this.applyPosterPlaceholder(posterWrap, item);

    const ratingBadge = document.createElement("span");
    ratingBadge.className = "rating-badge";
    ratingBadge.innerHTML = `★ ${item.note ? item.note.toFixed(1) : "—"}`;
    posterWrap.appendChild(ratingBadge);

    const typeBadge = document.createElement("span");
    typeBadge.className = "type-badge";
    typeBadge.textContent = item.type === "movie" ? "Film" : "Série";
    posterWrap.appendChild(typeBadge);

    const saved = Storage.get(item.id, item.type);
    if(saved && saved.statut){
      const flag = document.createElement("span");
      flag.className = `status-flag ${saved.statut}`;
      flag.textContent = saved.statut === "a_voir" ? "À voir" : "Déjà vu";
      posterWrap.appendChild(flag);
    }

    const perf = document.createElement("div");
    perf.className = "card-perf";

    const info = document.createElement("div");
    info.className = "card-info";
    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = item.titre;
    const meta = document.createElement("div");
    meta.className = "card-meta";
    const year = item.date ? item.date.slice(0,4) : "—";
    meta.textContent = year;
    info.append(title, meta);

    card.append(posterWrap, perf, info);
    card.addEventListener("click", () => App.openDetail(item.id, item.type));
    return card;
  },

  renderGrid(items){
    this.grid.innerHTML = "";
    if(items.length === 0){
      this.emptyState.classList.remove("hidden");
      this.grid.classList.add("hidden");
      return;
    }
    this.emptyState.classList.add("hidden");
    this.grid.classList.remove("hidden");
    const frag = document.createDocumentFragment();
    items.forEach(item => frag.appendChild(this.buildCard(item)));
    this.grid.appendChild(frag);
  },

  setResultsMeta(text){
    this.resultsMeta.textContent = text;
  },

  populateGenres(genreList){
    const select = document.getElementById("filter-genre");
    genreList.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
  },

  populateYears(items){
    const select = document.getElementById("filter-year");
    const years = new Set();
    items.forEach(i => { if(i.date) years.add(i.date.slice(0,4)); });
    [...years].sort((a,b) => b - a).forEach(y => {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      select.appendChild(opt);
    });
  },

  updateTabCounts(){
    const counts = Storage.counts();
    document.getElementById("count-watchlist").textContent = counts.a_voir;
    document.getElementById("count-seen").textContent = counts.vu;
  },

  showStatus(message, isError = false){
    const banner = document.getElementById("status-banner");
    banner.innerHTML = `<p>${message}</p>`;
    banner.classList.remove("hidden");
    banner.classList.toggle("error", isError);
  },

  hideStatus(){
    document.getElementById("status-banner").classList.add("hidden");
  },

  /* ---------------- MODAL DE DÉTAIL ---------------- */

  renderDetailLoading(){
    document.getElementById("modal-body").innerHTML = `
      <div class="detail-section"><p>Chargement de la fiche…</p></div>`;
  },

  renderDetailError(){
    document.getElementById("modal-body").innerHTML = `
      <div class="detail-section"><p>Impossible de charger cette fiche pour le moment.</p></div>`;
  },

  renderDetail(details){
    const saved = Storage.get(details.id, details.type) || {};
    const year = details.date ? details.date.slice(0,4) : "—";
    const duree = details.type === "movie"
      ? (details.duree ? `${details.duree} min` : "Durée inconnue")
      : (details.saisons ? `${details.saisons} saison${details.saisons > 1 ? "s" : ""}` : "");
    const hue = this.hashHue(details.titre);

    const body = document.getElementById("modal-body");
    body.innerHTML = `
      <div class="detail-hero">
        <div class="detail-poster" style="background: linear-gradient(160deg, hsl(${hue} 45% 16%), hsl(${(hue + 40) % 360} 40% 9%)); display:flex; align-items:center; justify-content:center; font-size:2.4rem;">
          ${details.type === "movie" ? "🎬" : "📺"}
        </div>
        <div>
          <h2 class="detail-title" id="modal-title">${details.titre}</h2>
          <div class="detail-meta-row">
            <span class="gold">★ ${details.note.toFixed(1)}</span>
            <span>${year}</span>
            <span>${details.type === "movie" ? "Film" : "Série"}</span>
            ${duree ? `<span>${duree}</span>` : ""}
            ${details.genres.length ? `<span>${details.genres.join(" · ")}</span>` : ""}
          </div>
          <p class="detail-overview">${details.overview || "Aucun synopsis disponible."}</p>

          <div class="detail-actions">
            <button class="btn ${saved.statut === "a_voir" ? "active" : ""}" id="btn-a-voir">
              ${saved.statut === "a_voir" ? "✓ Dans la watchlist" : "+ À voir"}
            </button>
            <button class="btn ${saved.statut === "vu" ? "active vu" : ""}" id="btn-vu">
              ${saved.statut === "vu" ? "✓ Déjà vu" : "Marquer comme vu"}
            </button>
            ${saved.statut ? `<button class="btn danger" id="btn-remove">Retirer de mes listes</button>` : ""}
          </div>

          <div class="rating-row">
            <label>Ma note</label>
            <div class="star-picker" id="star-picker">
              ${[1,2,3,4,5].map(n => `<button data-value="${n}" class="${saved.note_perso >= n ? 'filled' : ''}">★</button>`).join("")}
            </div>
          </div>
        </div>
      </div>

      ${details.cast.length ? `
      <div class="detail-section">
        <h3>Casting</h3>
        <div class="cast-row">
          ${details.cast.map(actor => `
            <div class="cast-item">
              <div class="no-photo">🎭</div>
              <div class="cast-name">${actor.name}</div>
              <div class="cast-role">${actor.character || ""}</div>
            </div>
          `).join("")}
        </div>
      </div>` : ""}
    `;

    document.getElementById("btn-a-voir").addEventListener("click", () => App.toggleStatus(details, "a_voir"));
    document.getElementById("btn-vu").addEventListener("click", () => App.toggleStatus(details, "vu"));
    const removeBtn = document.getElementById("btn-remove");
    if(removeBtn) removeBtn.addEventListener("click", () => App.removeFromLists(details));

    document.querySelectorAll("#star-picker button").forEach(btn => {
      btn.addEventListener("click", () => App.setRating(details, Number(btn.dataset.value)));
    });
  }
};
