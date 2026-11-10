/* ============================================================
   Store — couche de données (localStorage + import/export)
   ============================================================ */

const Store = (() => {
  const KEY = 'cartographe-edla-v1';
  let state = null;
  const listeners = [];

  const uid = () =>
    Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

  function blank() {
    return {
      version: 1,
      projectName: "Mon état de l'art",
      sources: [],
      themes: []
    };
  }

  /* ---------- persistance ---------- */

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : blank();
      if (!state.sources) state.sources = [];
      if (!state.themes) state.themes = [];
    } catch (e) {
      console.warn('Lecture du stockage impossible, démarrage à vide.', e);
      state = blank();
    }
    return state;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Sauvegarde impossible', e);
    }
    emit();
  }

  function onChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(fn => fn(state)); }

  /* ---------- normalisation ---------- */

  // minuscules + accents retirés, pour comparer des libellés
  function norm(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ---------- thèmes ---------- */

  function findTheme(label) {
    const n = norm(label);
    return state.themes.find(t => norm(t.label) === n) || null;
  }

  // retourne l'id du thème, en le créant si besoin
  function ensureTheme(label) {
    label = (label || '').trim();
    if (!label) return null;
    const existing = findTheme(label);
    if (existing) return existing.id;
    const t = { id: uid(), label };
    state.themes.push(t);
    return t.id;
  }

  function renameTheme(id, newLabel) {
    newLabel = (newLabel || '').trim();
    if (!newLabel) return;
    const clash = findTheme(newLabel);
    if (clash && clash.id !== id) { mergeThemes(id, clash.id); save(); return; }
    const t = state.themes.find(t => t.id === id);
    if (t) { t.label = newLabel; save(); }
  }

  // fusionne fromId dans toId
  function mergeThemes(fromId, toId) {
    if (fromId === toId) return;
    state.sources.forEach(s => {
      if (s.themes.includes(fromId)) {
        s.themes = s.themes.filter(x => x !== fromId);
        if (!s.themes.includes(toId)) s.themes.push(toId);
      }
    });
    state.themes = state.themes.filter(t => t.id !== fromId);
  }

  function deleteTheme(id) {
    state.themes = state.themes.filter(t => t.id !== id);
    state.sources.forEach(s => { s.themes = s.themes.filter(x => x !== id); });
    save();
  }

  // supprime les thèmes plus utilisés par aucune source
  function pruneThemes() {
    const used = new Set();
    state.sources.forEach(s => s.themes.forEach(t => used.add(t)));
    state.themes = state.themes.filter(t => used.has(t.id));
  }

  function themeLabel(id) {
    const t = state.themes.find(t => t.id === id);
    return t ? t.label : '?';
  }

  /* ---------- sources ---------- */

  function addSource(data) {
    const s = {
      id: uid(),
      title: (data.title || 'Sans titre').trim(),
      authors: (data.authors || '').trim(),
      year: data.year || '',
      type: data.type || 'article',
      url: (data.url || '').trim(),
      abstract: (data.abstract || '').trim(),
      notes: (data.notes || '').trim(),
      themes: data.themes || [],          // ids de thèmes
      status: data.status || 'inbox',     // inbox | a_lire | lu | exploite
      importance: data.importance || 2,   // 1..3
      addedAt: Date.now()
    };
    state.sources.unshift(s);
    save();
    return s;
  }

  function updateSource(id, patch) {
    const s = state.sources.find(s => s.id === id);
    if (!s) return;
    Object.assign(s, patch);
    pruneThemes();
    save();
  }

  function deleteSource(id) {
    state.sources = state.sources.filter(s => s.id !== id);
    pruneThemes();
    save();
  }

  function getSource(id) { return state.sources.find(s => s.id === id); }

  /* ---------- import / export ---------- */

  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  // mode: 'replace' | 'merge'
  function importJSON(text, mode) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.sources)) {
      throw new Error('Format inattendu : il manque la liste "sources".');
    }
    if (mode === 'replace') {
      state = Object.assign(blank(), {
        projectName: data.projectName || state.projectName,
        sources: data.sources,
        themes: data.themes || []
      });
    } else {
      // fusion : les thèmes sont réconciliés par libellé
      const idMap = {};
      (data.themes || []).forEach(t => { idMap[t.id] = ensureTheme(t.label); });
      const existingTitles = new Set(state.sources.map(s => norm(s.title)));
      data.sources.forEach(src => {
        if (existingTitles.has(norm(src.title))) return; // doublon ignoré
        state.sources.push(Object.assign({}, src, {
          id: uid(),
          themes: (src.themes || []).map(t => idMap[t]).filter(Boolean)
        }));
      });
    }
    pruneThemes();
    save();
  }

  function setProjectName(name) {
    state.projectName = name || "Mon état de l'art";
    save();
  }

  function replaceAll(newState) { state = newState; save(); }

  return {
    load, save, onChange, norm,
    ensureTheme, renameTheme, mergeThemes, deleteTheme, themeLabel, findTheme,
    addSource, updateSource, deleteSource, getSource,
    exportJSON, importJSON, setProjectName, replaceAll,
    get state() { return state; }
  };
})();
