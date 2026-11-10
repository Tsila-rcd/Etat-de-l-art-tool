/* ============================================================
   Analysis — extraction de termes, co-occurrences,
   détection de communautés, analyse des angles morts
   ============================================================ */

const Analysis = (() => {

  /* ---------- mots vides FR + EN ---------- */

  const STOPWORDS = new Set(("au aux avec ce ces cet cette dans de des du elle elles en et eux il ils je la le les leur " +
    "leurs lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes " +
    "toi ton tu un une vos votre vous c d j l m n s t y a ont est sont etait etaient ete etre avoir fait faire plus moins " +
    "tres peu tout tous toute toutes autre autres meme memes aussi comme entre vers chez sans sous apres avant depuis " +
    "pendant contre ainsi alors cependant donc or ni car si quand lorsque afin selon dont quel quelle quels quelles " +
    "celui celle ceux celles cela ca ci la-bas ici peut peuvent doit doivent sera seront deja encore bien non oui " +
    "notamment partir cas fois lors via etc article etude etudes travaux recherche recherches analyse analyses " +
    "approche approches resultat resultats papier revue chapitre livre ouvrage auteur auteurs page pages exemple " +
    "the of and a an in on at to for from by with without about into over under between among is are was were be been " +
    "being have has had do does did will would shall should may might can could must this that these those it its it's " +
    "he she they them his her their our your my we you i us not no nor but or so if then than as such also more most " +
    "less least very much many few some any all both each other another same own just only even still yet however " +
    "therefore thus hence moreover furthermore nevertheless while whereas because since until during through per via " +
    "based using used use new one two three first second third study studies research paper papers article articles " +
    "review approach approaches result results analysis analyses chapter book author authors eg ie et al etal " +
    "toward towards within upon across against hal www http https doi org com fr").split(/\s+/));

  function normToken(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function tokenize(text) {
    // conserve les mots avec tirets et apostrophes internes
    const raw = (text || '').match(/[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ'’-]*[a-zA-ZÀ-ÿ]|[a-zA-ZÀ-ÿ]{2,}/g) || [];
    return raw.map(w => w.replace(/^[dl]['’]/i, '')); // d'identité -> identité
  }

  /* ---------- extraction de termes candidats ---------- */

  // Retourne jusqu'à `limit` termes candidats triés par score,
  // en excluant les libellés déjà présents dans `excludeLabels`.
  function extractTerms(text, excludeLabels, limit) {
    excludeLabels = new Set((excludeLabels || []).map(normToken));
    limit = limit || 10;

    const tokens = tokenize(text);
    const uni = new Map();   // forme normalisée -> {display, count}
    const bi = new Map();

    const isStop = t => {
      const n = normToken(t);
      return n.length < 3 || STOPWORDS.has(n);
    };

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (!isStop(t)) {
        const n = normToken(t);
        const e = uni.get(n) || { display: t.toLowerCase(), count: 0 };
        e.count++;
        uni.set(n, e);
      }
      if (i + 1 < tokens.length) {
        const t2 = tokens[i + 1];
        if (!isStop(t) && !isStop(t2)) {
          const n = normToken(t) + ' ' + normToken(t2);
          const e = bi.get(n) || { display: (t + ' ' + t2).toLowerCase(), count: 0 };
          e.count++;
          bi.set(n, e);
        }
      }
    }

    const candidates = [];
    bi.forEach((e, n) => {
      if (excludeLabels.has(n)) return;
      candidates.push({ term: e.display, score: e.count * 2.2, norm: n });
    });
    uni.forEach((e, n) => {
      if (excludeLabels.has(n)) return;
      // un unigramme déjà couvert par un bigramme fréquent est moins utile
      candidates.push({ term: e.display, score: e.count, norm: n });
    });

    candidates.sort((a, b) => b.score - a.score);

    // dédoublonnage : si un bigramme retenu contient l'unigramme, on saute l'unigramme
    const chosen = [];
    const chosenNorms = [];
    for (const c of candidates) {
      if (chosen.length >= limit) break;
      if (c.norm.indexOf(' ') < 0 &&
          chosenNorms.some(n => n.split(' ').includes(c.norm))) continue;
      if (chosenNorms.includes(c.norm)) continue;
      chosen.push(c);
      chosenNorms.push(c.norm);
    }
    return chosen;
  }

  /* ---------- statistiques sur les thèmes ---------- */

  function themeCounts(state) {
    const counts = new Map();
    state.themes.forEach(t => counts.set(t.id, 0));
    state.sources.forEach(s => {
      new Set(s.themes).forEach(id => {
        if (counts.has(id)) counts.set(id, counts.get(id) + 1);
      });
    });
    return counts;
  }

  // Map "idA|idB" (ids triés) -> nombre de sources partagées
  function cooccurrence(state) {
    const cooc = new Map();
    state.sources.forEach(s => {
      const ids = [...new Set(s.themes)].sort();
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const k = ids[i] + '|' + ids[j];
          cooc.set(k, (cooc.get(k) || 0) + 1);
        }
      }
    });
    return cooc;
  }

  /* ---------- détection de communautés (propagation de labels) ---------- */

  // Retourne Map themeId -> indice de communauté (0 = la plus grosse)
  function communities(state, cooc) {
    const ids = state.themes.map(t => t.id);
    if (!ids.length) return new Map();

    // adjacence pondérée
    const adj = new Map(ids.map(id => [id, []]));
    cooc.forEach((w, k) => {
      const [a, b] = k.split('|');
      if (adj.has(a) && adj.has(b)) {
        adj.get(a).push({ id: b, w });
        adj.get(b).push({ id: a, w });
      }
    });

    const label = new Map(ids.map((id, i) => [id, i]));

    // générateur pseudo-aléatoire déterministe (mulberry32)
    let seed = 42;
    const rng = () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let iter = 0; iter < 20; iter++) {
      const order = [...ids].sort(() => rng() - 0.5);
      let changed = false;
      for (const id of order) {
        const neigh = adj.get(id);
        if (!neigh.length) continue;
        const tally = new Map();
        neigh.forEach(({ id: nid, w }) => {
          const l = label.get(nid);
          tally.set(l, (tally.get(l) || 0) + w);
        });
        let best = label.get(id), bestW = -1;
        tally.forEach((w, l) => { if (w > bestW) { bestW = w; best = l; } });
        if (best !== label.get(id)) { label.set(id, best); changed = true; }
      }
      if (!changed) break;
    }

    // renumérote : 0 = communauté la plus peuplée
    const sizes = new Map();
    label.forEach(l => sizes.set(l, (sizes.get(l) || 0) + 1));
    const ranked = [...sizes.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
    const renum = new Map(ranked.map((l, i) => [l, i]));
    const out = new Map();
    label.forEach((l, id) => out.set(id, renum.get(l)));
    return out;
  }

  /* ---------- angles morts ---------- */

  // Produit la liste classée des « angles d'attaque » :
  //  - vide  : deux thèmes documentés jamais croisés dans une même source
  //  - pont  : idem, mais entre deux familles (communautés) différentes
  //  - faible: croisement existant mais marginal au regard du volume
  // + liste des thèmes sous-documentés.
  function gaps(state, opts) {
    opts = opts || {};
    const minSources = opts.minSources || 2;   // seuil « thème documenté »
    const maxResults = opts.maxResults || 15;

    const counts = themeCounts(state);
    const cooc = cooccurrence(state);
    const comm = communities(state, cooc);

    const established = state.themes.filter(t => (counts.get(t.id) || 0) >= minSources);

    const results = [];
    for (let i = 0; i < established.length; i++) {
      for (let j = i + 1; j < established.length; j++) {
        const a = established[i], b = established[j];
        const ca = counts.get(a.id), cb = counts.get(b.id);
        const k = [a.id, b.id].sort().join('|');
        const c = cooc.get(k) || 0;
        const potential = Math.min(ca, cb);
        const crossFamily = comm.get(a.id) !== comm.get(b.id);

        if (c === 0) {
          results.push({
            type: crossFamily ? 'pont' : 'vide',
            a, b, ca, cb, cooc: c,
            score: potential * (crossFamily ? 1.5 : 1)
          });
        } else if (c === 1 && potential >= 4) {
          results.push({
            type: 'faible',
            a, b, ca, cb, cooc: c,
            score: potential * 0.5
          });
        }
      }
    }
    results.sort((x, y) => y.score - x.score ||
      (y.ca + y.cb) - (x.ca + x.cb));

    // règle de diversité : un même thème n'apparaît pas plus de 3 fois
    // dans le classement, pour éviter qu'un gros thème ne sature la liste
    const appearances = new Map();
    const diversified = [];
    for (const r of results) {
      const na = appearances.get(r.a.id) || 0;
      const nb = appearances.get(r.b.id) || 0;
      if (na >= 3 || nb >= 3) continue;
      appearances.set(r.a.id, na + 1);
      appearances.set(r.b.id, nb + 1);
      diversified.push(r);
    }

    const under = state.themes
      .map(t => ({ theme: t, count: counts.get(t.id) || 0 }))
      .filter(e => e.count > 0 && e.count < minSources)
      .sort((x, y) => x.count - y.count);

    return {
      opportunities: diversified.slice(0, maxResults),
      underdocumented: under,
      counts, cooc, communities: comm
    };
  }

  return { extractTerms, themeCounts, cooccurrence, communities, gaps, STOPWORDS };
})();
