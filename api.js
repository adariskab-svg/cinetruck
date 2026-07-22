/* ============================================================
   api.js — couche d'accès aux données du catalogue.
   Remplace un appel réseau à une API externe par une lecture du
   jeu de données local (data.js) : aucune clé, aucun compte requis.
   Les fonctions restent asynchrones (Promise) pour garder une
   structure identique à celle d'un vrai appel API.
   ============================================================ */

const CatalogueApi = {

  /** Liste triée des genres présents dans le catalogue */
  async getGenres(){
    const set = new Set();
    LOCAL_CATALOGUE.forEach(item => item.genres.forEach(g => set.add(g)));
    return [...set].sort((a, b) => a.localeCompare(b));
  },

  /** Catalogue complet, normalisé (popularité dérivée de la note pour le tri) */
  async getCatalogue(){
    return LOCAL_CATALOGUE.map(item => ({
      id: item.id,
      type: item.type,
      titre: item.titre,
      genres: item.genres,
      date: item.date,
      note: item.note,
      popularite: item.note * 10, // pas de vraies stats de popularité en local
      overview: item.overview
    }));
  },

  async getDetails(id, type){
    const item = LOCAL_CATALOGUE.find(i => i.id === id && i.type === type);
    if(!item) throw new Error("NOT_FOUND");
    return {
      id: item.id,
      type: item.type,
      titre: item.titre,
      overview: item.overview,
      note: item.note,
      date: item.date,
      genres: item.genres,
      duree: item.duree || null,
      saisons: item.saisons || null,
      cast: item.cast || []
    };
  },

  /** Pas d'affiches réelles en mode local : on génère un visuel de substitution côté UI */
  posterUrl(){
    return null;
  }
};
