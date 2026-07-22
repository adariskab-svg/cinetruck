/* ============================================================
   app.js — logique principale : chargement, recherche, filtres,
   tri (100% côté client), onglets, modale de détail.
   ============================================================ */

const App = {
  catalogue: [],   // catalogue local complet (normalisé)
  genreList: [],   // liste des genres présents dans le catalogue
  currentTab: "catalogue",

  els: {
    grid: document.getElementById("grid"),
    search: document.getElementById("search-input"),
    filterType: document.getElementById("filter-type"),
    filterGenre: document.getElementById("filter-genre"),
    filterYear: document.getElementById("filter-year"),
    filterNote: document.getElementById("filter-note"),
    noteValue: document.getElementById("note-value"),
    filterSort: document.getElementById("filter-sort"),
    resetBtn: document.getElementById("reset-filters"),
    filterBar: document.getElementById("filter-bar"),
    tabs: document.querySelectorAll(".tab"),
    modalOverlay: document.getElementById("modal-overlay"),
    modalClose: document.getElementById("modal-close")
  },

  async init(){
    this.bindStaticEvents();
    await this.loadCatalogue();
    UI.updateTabCounts();
  },

  bindStaticEvents(){
    // Recherche + filtres : re-rendu à chaque changement, sans rechargement de page
    this.els.search.addEventListener("input", () => this.render());
    this.els.filterType.addEventListener("change", () => this.render());
    this.els.filterGenre.addEventListener("change", () => this.render());
    this.els.filterYear.addEventListener("change", () => this.render());
    this.els.filterSort.addEventListener("change", () => this.render());
    this.els.filterNote.addEventListener("input", () => {
      this.els.noteValue.textContent = this.els.filterNote.value;
      this.render();
    });
    this.els.resetBtn.addEventListener("click", () => this.resetFilters());

    this.els.tabs.forEach(tab => {
      tab.addEventListener("click", () => this.switchTab(tab.dataset.tab));
    });

    this.els.modalClose.addEventListener("click", () => this.closeDetail());
    this.els.modalOverlay.addEventListener("click", (e) => {
      if(e.target === this.els.modalOverlay) this.closeDetail();
    });
    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape") this.closeDetail();
    });
  },

  async loadCatalogue(){
    const [genreList, catalogue] = await Promise.all([
      CatalogueApi.getGenres(),
      CatalogueApi.getCatalogue()
    ]);
    this.genreList = genreList;
    this.catalogue = catalogue;

    UI.populateGenres(this.genreList);
    UI.populateYears(this.catalogue);
    this.render();
  },

  switchTab(tabName){
    this.currentTab = tabName;
    this.els.tabs.forEach(tab => {
      const active = tab.dataset.tab === tabName;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active);
    });
    // filtres/recherche cachés sur les onglets personnels (listes déjà restreintes)
    this.els.filterBar.classList.toggle("hidden", tabName !== "catalogue");
    this.render();
  },

  /** Renvoie la liste de départ selon l'onglet actif */
  getBaseList(){
    if(this.currentTab === "catalogue") return this.catalogue;

    const statut = this.currentTab === "watchlist" ? "a_voir" : "vu";
    const saved = Storage.getByStatus(statut);
    // on relie chaque entrée sauvegardée à ses données complètes du catalogue si dispo
    return saved.map(entry => {
      const full = this.catalogue.find(c => c.id === entry.id && c.type === entry.type);
      return full || {
        id: entry.id, type: entry.type, titre: entry.titre,
        genres: [], date: null, note: 0, popularite: 0, overview: ""
      };
    });
  },

  /** Applique recherche, filtres et tri — tout côté client */
  render(){
    let items = this.getBaseList();

    const query = this.els.search.value.trim().toLowerCase();
    if(query){
      items = items.filter(i => i.titre.toLowerCase().includes(query));
    }

    const type = this.els.filterType.value;
    if(type !== "all"){
      items = items.filter(i => i.type === type);
    }

    const genre = this.els.filterGenre.value;
    if(genre !== "all"){
      items = items.filter(i => (i.genres || []).includes(genre));
    }

    const year = this.els.filterYear.value;
    if(year !== "all"){
      items = items.filter(i => i.date && i.date.startsWith(year));
    }

    const minNote = Number(this.els.filterNote.value);
    if(minNote > 0){
      items = items.filter(i => i.note >= minNote);
    }

    const sortBy = this.els.filterSort.value;
    items = [...items].sort((a, b) => {
      if(sortBy === "note") return b.note - a.note;
      if(sortBy === "date") return (b.date || "").localeCompare(a.date || "");
      return (b.popularite || 0) - (a.popularite || 0);
    });

    UI.renderGrid(items);
    const label = this.currentTab === "catalogue" ? "titres"
      : this.currentTab === "watchlist" ? "titres à voir" : "titres déjà vus";
    UI.setResultsMeta(`${items.length} ${label}`);
  },

  resetFilters(){
    this.els.search.value = "";
    this.els.filterType.value = "all";
    this.els.filterGenre.value = "all";
    this.els.filterYear.value = "all";
    this.els.filterNote.value = 0;
    this.els.noteValue.textContent = "0";
    this.els.filterSort.value = "popularity";
    this.render();
  },

  /* ---------------- MODALE DE DÉTAIL ---------------- */

  async openDetail(id, type){
    this.els.modalOverlay.classList.remove("hidden");
    UI.renderDetailLoading();
    try{
      const details = await CatalogueApi.getDetails(id, type);
      this._currentDetails = details;
      UI.renderDetail(details);
    }catch(err){
      UI.renderDetailError();
    }
  },

  closeDetail(){
    this.els.modalOverlay.classList.add("hidden");
  },

  toggleStatus(details, statut){
    const existing = Storage.get(details.id, details.type);
    const newStatut = (existing && existing.statut === statut) ? null : statut;
    if(newStatut === null){
      Storage.remove(details.id, details.type);
    }else{
      Storage.setStatus(details.id, details.type, details.titre, newStatut);
    }
    UI.renderDetail(details);
    UI.updateTabCounts();
    this.render();
  },

  removeFromLists(details){
    Storage.remove(details.id, details.type);
    UI.renderDetail(details);
    UI.updateTabCounts();
    this.render();
  },

  setRating(details, value){
    const existing = Storage.get(details.id, details.type);
    const newValue = (existing && existing.note_perso === value) ? null : value;
    Storage.setNote(details.id, details.type, details.titre, newValue);
    if(!existing || !existing.statut){
      // noter une œuvre l'ajoute implicitement à "déjà vu"
      Storage.setStatus(details.id, details.type, details.titre, "vu");
    }
    UI.renderDetail(details);
    UI.updateTabCounts();
    this.render();
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
