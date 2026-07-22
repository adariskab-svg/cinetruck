/* ============================================================
   storage.js — persistance locale des listes personnelles
   Structure sauvegardée par item (cf. cahier des charges) :
   { id, titre, type, statut: "a_voir"|"vu", note_perso, date_ajout }
   ============================================================ */

const STORAGE_KEY = "cinetrack_library";

const Storage = {
  /** Renvoie l'objet { "movie_123": {...}, "tv_456": {...} } */
  _readAll(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    }catch(e){
      console.error("Erreur de lecture du localStorage", e);
      return {};
    }
  },

  _writeAll(data){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }catch(e){
      console.error("Erreur d'écriture du localStorage", e);
    }
  },

  _key(id, type){ return `${type}_${id}`; },

  get(id, type){
    const all = this._readAll();
    return all[this._key(id, type)] || null;
  },

  getAll(){
    return Object.values(this._readAll());
  },

  getByStatus(status){
    return this.getAll().filter(item => item.statut === status);
  },

  /** Ajoute ou met à jour une entrée (fusionne avec l'existant) */
  upsert(entry){
    const all = this._readAll();
    const key = this._key(entry.id, entry.type);
    const existing = all[key] || {};
    all[key] = {
      id: entry.id,
      type: entry.type,
      titre: entry.titre ?? existing.titre,
      statut: entry.statut ?? existing.statut ?? null,
      note_perso: entry.note_perso !== undefined ? entry.note_perso : (existing.note_perso ?? null),
      date_ajout: existing.date_ajout || new Date().toISOString().slice(0,10)
    };
    this._writeAll(all);
    return all[key];
  },

  remove(id, type){
    const all = this._readAll();
    delete all[this._key(id, type)];
    this._writeAll(all);
  },

  setStatus(id, type, titre, statut){
    return this.upsert({ id, type, titre, statut });
  },

  setNote(id, type, titre, note_perso){
    return this.upsert({ id, type, titre, note_perso });
  },

  counts(){
    const all = this.getAll();
    return {
      a_voir: all.filter(i => i.statut === "a_voir").length,
      vu: all.filter(i => i.statut === "vu").length
    };
  }
};
