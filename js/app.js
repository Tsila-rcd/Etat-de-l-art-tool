/* ============================================================
   App — interface : onglets, capture, tri, sources, carte,
   angles morts, tableau de bord
   ============================================================ */

(() => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  const STATUS_LABELS = {
    inbox: '📥 À classer',
    a_lire: 'À lire',
    lu: 'Lu',
    exploite: 'Exploité dans le livre'
  };
  const TYPE_LABELS = {
    article: 'Article', ouvrage: 'Ouvrage', chapitre: 'Chapitre',
    these: 'Thèse', rapport: 'Rapport', web: 'Web', video: 'Vidéo', autre: 'Autre'
  };

  let activeTab = 'capture';
  let state = Store.load();

  /* ================= utilitaires ================= */

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function esc(s) {
    return (s || '').replace(/[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function graphPalette() {
    return [1, 2, 3, 4, 5, 6, 7, 8].map(i => cssVar('--series-' + i));
  }

  /* ================= widget « chips » (thèmes) ================= */

  // Crée un champ de saisie de thèmes avec puces + autocomplétion.
  function createChipsInput(container, initialLabels) {
    let labels = [...(initialLabels || [])];

    const wrap = document.createElement('div');
    wrap.className = 'chips-input';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Ajouter un thème puis Entrée…';
    const listId = 'dl-' + Math.random().toString(36).slice(2, 8);
    const datalist = document.createElement('datalist');
    datalist.id = listId;
    input.setAttribute('list', listId);

    function refreshDatalist() {
      datalist.innerHTML = state.themes
        .map(t => `<option value="${esc(t.label)}">`).join('');
    }

    function render() {
      wrap.querySelectorAll('.chip').forEach(c => c.remove());
      labels.forEach(label => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.innerHTML = `${esc(label)}<span class="x" title="Retirer">×</span>`;
        chip.querySelector('.x').addEventListener('click', () => {
          labels = labels.filter(l => l !== label);
          render();
        });
        wrap.insertBefore(chip, input);
      });
    }

    function add(label) {
      label = (label || '').trim();
      if (!label) return;
      if (!labels.some(l => Store.norm(l) === Store.norm(label))) {
        labels.push(label);
        render();
      }
      input.value = '';
    }

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        add(input.value);
      } else if (e.key === 'Backspace' && !input.value && labels.length) {
        labels.pop();
        render();
      }
    });
    input.addEventListener('change', () => { if (input.value.trim()) add(input.value); });
    input.addEventListener('focus', refreshDatalist);
    wrap.addEventListener('click', () => input.focus());

    wrap.appendChild(input);
    wrap.appendChild(datalist);
    container.innerHTML = '';
    container.appendChild(wrap);
    render();

    return {
      getLabels: () => {
        if (input.value.trim()) add(input.value); // n'oublie pas le texte en cours
        return [...labels];
      },
      addLabel: add,
      setLabels: ls => { labels = [...ls]; render(); }
    };
  }

  function labelsToThemeIds(labels) {
    return labels.map(l => Store.ensureTheme(l)).filter(Boolean);
  }

  /* ================= onglets ================= */

  function switchTab(name) {
    activeTab = name;
    $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
    renderActive();
  }

  function renderActive() {
    $('#countSources').textContent = state.sources.length;
    if (activeTab === 'capture') { renderInbox(); }
    else if (activeTab === 'sources') { renderSources(); }
    else if (activeTab === 'carte') { renderGraph(); }
    else if (activeTab === 'angles') { renderGaps(); }
    else if (activeTab === 'bord') { renderDashboard(); }
  }

  /* ================= capture : dépôt rapide ================= */

  // Transforme du texte libre en sources (BibTeX, liste de références, ou extrait unique)
  function parseQuickText(text) {
    text = (text || '').trim();
    if (!text) return [];

    if (BibTeX.looksLikeBibtex(text)) {
      return BibTeX.parse(text);
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const refLike = lines.filter(l => l.length > 25 && /\b(19|20)\d{2}\b/.test(l));
    if (lines.length >= 2 && refLike.length >= 2) {
      // une référence par ligne
      return refLike.map(l => {
        const year = (l.match(/\b(19|20)\d{2}\b/) || [''])[0];
        const url = (l.match(/https?:\/\/\S+/) || [''])[0];
        return { title: l.replace(/https?:\/\/\S+/, '').trim(), year, url, abstract: '', themeLabels: [] };
      });
    }

    // un seul dépôt : première ligne = titre, le reste = extrait
    const url = (text.match(/https?:\/\/\S+/) || [''])[0];
    const year = (text.match(/\b(19|20)\d{2}\b/) || [''])[0];
    const title = lines[0].replace(/https?:\/\/\S+/, '').trim().slice(0, 220) || 'Sans titre';
    const abstract = lines.slice(1).join('\n');
    return [{ title, year, url, abstract, themeLabels: [] }];
  }

  function addParsedSources(entries, origin) {
    let added = 0;
    entries.forEach(e => {
      const themeIds = labelsToThemeIds(e.themeLabels || []);
      Store.addSource({
        title: e.title, authors: e.authors, year: e.year, type: e.type,
        url: e.url, abstract: e.abstract, notes: e.notes,
        themes: themeIds,
        status: themeIds.length ? 'a_lire' : 'inbox'
      });
      added++;
    });
    if (added) toast(`${added} source(s) déposée(s)${origin ? ' depuis ' + origin : ''}.`);
    return added;
  }

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      try {
        if (file.name.endsWith('.json')) {
          importJSONInteractive(text);
        } else if (BibTeX.looksLikeBibtex(text)) {
          addParsedSources(BibTeX.parse(text), file.name);
        } else {
          addParsedSources(parseQuickText(text), file.name);
        }
      } catch (err) {
        toast('Import impossible : ' + err.message);
      }
      renderActive();
    };
    reader.readAsText(file);
  }

  function importJSONInteractive(text) {
    if (state.sources.length === 0) {
      Store.importJSON(text, 'replace');
      toast('Projet importé.');
    } else {
      const replace = confirm(
        'Ce fichier est un export Cartographe.\n\n' +
        'OK  →  REMPLACER le projet actuel\n' +
        'Annuler  →  FUSIONNER avec le projet actuel (doublons ignorés)');
      Store.importJSON(text, replace ? 'replace' : 'merge');
      toast(replace ? 'Projet remplacé.' : 'Projets fusionnés.');
    }
    $('#projectName').value = state.projectName;
  }

  /* ================= capture : boîte de tri ================= */

  function suggestionsFor(source) {
    const assigned = source.themes.map(id => Store.themeLabel(id));
    const text = [source.title, source.abstract, source.notes].join(' ');
    return Analysis.extractTerms(text, assigned, 7);
  }

  function renderInbox() {
    const inbox = state.sources.filter(s => s.status === 'inbox' || s.themes.length === 0);
    $('#inboxCount').textContent = inbox.length;
    const list = $('#inboxList');

    if (!inbox.length) {
      list.innerHTML = `<div class="empty-state" style="padding:30px 10px">
        <div class="big">✨</div>Rien à trier. Tout est classé !</div>`;
      return;
    }

    list.innerHTML = '';
    inbox.slice(0, 30).forEach(s => {
      const item = document.createElement('div');
      item.className = 'inbox-item';
      const sugg = suggestionsFor(s);
      item.innerHTML = `
        <div class="title">${esc(s.title)}</div>
        <div class="meta">${esc(s.authors || '—')}${s.year ? ' · ' + esc(s.year) : ''}</div>
        <div class="themes" style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px">
          ${s.themes.map(id => `<span class="chip readonly">${esc(Store.themeLabel(id))}</span>`).join('')}
        </div>
        ${sugg.length ? `<div class="meta" style="margin:0 0 2px">Thèmes suggérés :</div>` : ''}
        <div class="suggestions"></div>
        <div style="display:flex;gap:6px;margin-top:8px;align-items:center">
          <input type="text" placeholder="autre thème + Entrée" style="flex:1;font-size:13px;padding:5px 8px">
          <button class="btn small primary">Classé ✓</button>
          <button class="btn small ghost" title="Ouvrir la fiche">✎</button>
        </div>`;

      const suggBox = item.querySelector('.suggestions');
      sugg.forEach(c => {
        const b = document.createElement('button');
        b.className = 'suggestion-chip';
        b.textContent = '+ ' + c.term;
        b.addEventListener('click', () => {
          const id = Store.ensureTheme(c.term);
          if (!s.themes.includes(id)) {
            Store.updateSource(s.id, { themes: [...s.themes, id] });
          }
        });
        suggBox.appendChild(b);
      });

      const input = item.querySelector('input');
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && input.value.trim()) {
          const id = Store.ensureTheme(input.value.trim());
          if (!s.themes.includes(id)) {
            Store.updateSource(s.id, { themes: [...s.themes, id] });
          }
          input.value = '';
        }
      });

      item.querySelector('.btn.primary').addEventListener('click', () => {
        if (!s.themes.length) { toast('Ajoutez au moins un thème avant de valider.'); return; }
        Store.updateSource(s.id, { status: s.status === 'inbox' ? 'a_lire' : s.status });
      });
      item.querySelector('.btn.ghost').addEventListener('click', () => openDrawer(s.id));

      list.appendChild(item);
    });
  }

  /* ================= sources ================= */

  function renderSources() {
    const q = Store.norm($('#srcSearch').value);
    const themeF = $('#srcThemeFilter').value;
    const statusF = $('#srcStatusFilter').value;
    const sort = $('#srcSort').value;

    // options du filtre thèmes
    const sel = $('#srcThemeFilter');
    const cur = sel.value;
    sel.innerHTML = '<option value="">Tous les thèmes</option>' +
      [...state.themes].sort((a, b) => a.label.localeCompare(b.label, 'fr'))
        .map(t => `<option value="${t.id}">${esc(t.label)}</option>`).join('');
    sel.value = cur;

    let list = state.sources.filter(s => {
      if (themeF && !s.themes.includes(themeF)) return false;
      if (statusF && s.status !== statusF) return false;
      if (q) {
        const hay = Store.norm([s.title, s.authors, s.abstract, s.notes,
          ...s.themes.map(id => Store.themeLabel(id))].join(' '));
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sort === 'year') list.sort((a, b) => (b.year || '0').localeCompare(a.year || '0'));
    else if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    else if (sort === 'importance') list.sort((a, b) => (b.importance || 0) - (a.importance || 0));
    else list.sort((a, b) => b.addedAt - a.addedAt);

    const grid = $('#sourceGrid');
    $('#sourcesEmpty').hidden = state.sources.length > 0;
    grid.innerHTML = '';

    list.forEach(s => {
      const card = document.createElement('div');
      card.className = 'source-card';
      card.innerHTML = `
        <div class="title">${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener" style="color:inherit">${esc(s.title)}</a>` : esc(s.title)}</div>
        <div class="meta">
          <span class="type-badge">${TYPE_LABELS[s.type] || s.type}</span>
          ${esc(s.authors || '')}${s.year ? ' · ' + esc(s.year) : ''}
          ${'★'.repeat(s.importance || 0)}
        </div>
        <div class="themes">
          ${s.themes.map(id => `<span class="chip readonly">${esc(Store.themeLabel(id))}</span>`).join('') ||
            '<span class="meta">aucun thème</span>'}
        </div>
        <div class="actions">
          <span><span class="status-dot status-${s.status}"></span></span>
          <select title="Statut">
            ${Object.entries(STATUS_LABELS).map(([k, v]) =>
              `<option value="${k}" ${k === s.status ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
          <span class="spacer"></span>
          <button class="btn small ghost" title="Modifier">✎</button>
        </div>`;
      card.querySelector('select').addEventListener('change', e => {
        Store.updateSource(s.id, { status: e.target.value });
      });
      card.querySelector('.btn.ghost').addEventListener('click', () => openDrawer(s.id));
      grid.appendChild(card);
    });
  }

  /* ================= drawer d'édition ================= */

  let drawerSourceId = null;
  let drawerChips = null;

  function openDrawer(id) {
    const s = Store.getSource(id);
    if (!s) return;
    drawerSourceId = id;

    $('#drawerBody').innerHTML = `
      <div class="field"><label>Titre</label><input type="text" id="dTitle" value="${esc(s.title)}"></div>
      <div class="field-row">
        <div class="field"><label>Auteur·es</label><input type="text" id="dAuthors" value="${esc(s.authors)}"></div>
        <div class="field" style="max-width:100px"><label>Année</label><input type="text" id="dYear" value="${esc(s.year)}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Type</label>
          <select id="dType">${Object.entries(TYPE_LABELS).map(([k, v]) =>
            `<option value="${k}" ${k === s.type ? 'selected' : ''}>${v}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Statut</label>
          <select id="dStatus">${Object.entries(STATUS_LABELS).map(([k, v]) =>
            `<option value="${k}" ${k === s.status ? 'selected' : ''}>${v}</option>`).join('')}</select>
        </div>
        <div class="field" style="max-width:120px"><label>Importance</label>
          <select id="dImportance">
            <option value="1" ${s.importance === 1 ? 'selected' : ''}>★</option>
            <option value="2" ${s.importance === 2 ? 'selected' : ''}>★★</option>
            <option value="3" ${s.importance === 3 ? 'selected' : ''}>★★★</option>
          </select>
        </div>
      </div>
      <div class="field"><label>Lien</label><input type="url" id="dUrl" value="${esc(s.url)}"></div>
      <div class="field"><label>Résumé / extrait</label><textarea id="dAbstract" rows="4">${esc(s.abstract)}</textarea></div>
      <div class="field"><label>Notes</label><textarea id="dNotes" rows="3">${esc(s.notes)}</textarea></div>
      <div class="field"><label>Thèmes</label><div id="dThemes"></div>
        <div class="suggestions" id="dSuggestions"></div>
      </div>`;

    drawerChips = createChipsInput($('#dThemes'), s.themes.map(id => Store.themeLabel(id)));

    const suggBox = $('#dSuggestions');
    suggestionsFor(s).forEach(c => {
      const b = document.createElement('button');
      b.className = 'suggestion-chip';
      b.textContent = '+ ' + c.term;
      b.addEventListener('click', () => drawerChips.addLabel(c.term));
      suggBox.appendChild(b);
    });

    $('#drawerBackdrop').classList.add('open');
    $('#drawer').classList.add('open');
  }

  function closeDrawer() {
    $('#drawerBackdrop').classList.remove('open');
    $('#drawer').classList.remove('open');
    drawerSourceId = null;
  }

  function saveDrawer() {
    if (!drawerSourceId) return;
    Store.updateSource(drawerSourceId, {
      title: $('#dTitle').value.trim() || 'Sans titre',
      authors: $('#dAuthors').value.trim(),
      year: $('#dYear').value.trim(),
      type: $('#dType').value,
      status: $('#dStatus').value,
      importance: parseInt($('#dImportance').value, 10),
      url: $('#dUrl').value.trim(),
      abstract: $('#dAbstract').value,
      notes: $('#dNotes').value,
      themes: labelsToThemeIds(drawerChips.getLabels())
    });
    closeDrawer();
    toast('Source mise à jour.');
  }

  /* ================= carte (graphe) ================= */

  function buildGraphData() {
    const counts = Analysis.themeCounts(state);
    const cooc = Analysis.cooccurrence(state);
    const comm = Analysis.communities(state, cooc);
    const minCooc = parseInt($('#minCooc').value, 10);
    const showIsolated = $('#showIsolated').checked;

    const links = [];
    cooc.forEach((w, k) => {
      if (w >= minCooc) {
        const [a, b] = k.split('|');
        links.push({ source: a, target: b, weight: w });
      }
    });

    const linked = new Set();
    links.forEach(l => { linked.add(l.source); linked.add(l.target); });

    const nodes = state.themes
      .filter(t => (counts.get(t.id) || 0) > 0)
      .filter(t => showIsolated || linked.has(t.id))
      .map(t => ({
        id: t.id,
        label: t.label,
        count: counts.get(t.id) || 0,
        community: comm.get(t.id) ?? 0
      }));

    const nodeIds = new Set(nodes.map(n => n.id));
    return {
      nodes,
      links: links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target)),
      communities: comm
    };
  }

  function renderGraph() {
    const svgEl = $('#graphSvg');
    const data = buildGraphData();
    $('#minCoocVal').textContent = $('#minCooc').value;

    const opts = {
      palette: graphPalette(),
      ink: cssVar('--text-primary'),
      inkMuted: cssVar('--text-muted'),
      linkColor: cssVar('--baseline'),
      surface: cssVar('--page')
    };

    GraphView.render(svgEl, data, opts, {
      onNodeClick: openGraphPanel,
      onBackgroundClick: () => {
        $('#graphPanel').classList.remove('open');
        GraphView.unhighlight();
      }
    });

    // légende des familles
    const commSizes = new Map();
    data.nodes.forEach(n => commSizes.set(n.community, (commSizes.get(n.community) || 0) + 1));
    const legend = $('#graphLegend');
    const fams = [...commSizes.entries()]
      .filter(([, size]) => size >= 2)
      .sort((a, b) => a[0] - b[0])
      .slice(0, 8);
    legend.innerHTML = fams.map(([c]) => {
      const members = data.nodes.filter(n => n.community === c)
        .sort((a, b) => b.count - a.count);
      const label = members.slice(0, 2).map(m => m.label).join(', ') +
        (members.length > 2 ? '…' : '');
      return `<span class="legend-item"><span class="legend-swatch"
        style="background:${opts.palette[c] || opts.inkMuted}"></span>${esc(label)}</span>`;
    }).join('') +
    (data.nodes.length ? '' : '<span>Aucun thème à afficher : classez des sources d\'abord.</span>');
  }

  function openGraphPanel(themeId) {
    const t = state.themes.find(t => t.id === themeId);
    if (!t) return;
    const sources = state.sources.filter(s => s.themes.includes(themeId));
    const others = state.themes.filter(x => x.id !== themeId)
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));

    const panel = $('#graphPanel');
    panel.innerHTML = `
      <label>Thème</label>
      <input type="text" id="gpLabel" value="${esc(t.label)}" style="font-weight:600">
      <p class="hint" style="margin:8px 0 4px">${sources.length} source(s)</p>
      <div style="display:flex;gap:6px;margin:10px 0">
        <select id="gpMerge" style="flex:1">
          <option value="">Fusionner dans…</option>
          ${others.map(o => `<option value="${o.id}">${esc(o.label)}</option>`).join('')}
        </select>
        <button class="btn small danger" id="gpDelete">Suppr.</button>
      </div>
      <div class="panel-sources">
        ${sources.map(s => `
          <div class="panel-source">
            <div>${esc(s.title)}</div>
            <div class="meta">${esc(s.authors || '')}${s.year ? ' · ' + esc(s.year) : ''}</div>
          </div>`).join('')}
      </div>`;

    $('#gpLabel').addEventListener('change', e => {
      Store.renameTheme(themeId, e.target.value);
    });
    $('#gpMerge').addEventListener('change', e => {
      if (!e.target.value) return;
      if (confirm(`Fusionner « ${t.label} » dans « ${Store.themeLabel(e.target.value)} » ?`)) {
        Store.mergeThemes(themeId, e.target.value);
        Store.save();
        panel.classList.remove('open');
      } else e.target.value = '';
    });
    $('#gpDelete').addEventListener('click', () => {
      if (confirm(`Supprimer le thème « ${t.label} » ? (les sources sont conservées)`)) {
        Store.deleteTheme(themeId);
        panel.classList.remove('open');
      }
    });

    panel.classList.add('open');
  }

  /* ================= angles morts ================= */

  const GAP_TAG_LABELS = {
    vide: 'intersection vide',
    pont: 'pont entre familles',
    faible: 'croisement marginal'
  };
  const GAP_MIN_SOURCES = 2;

  function renderGaps() {
    const res = Analysis.gaps(state, { minSources: GAP_MIN_SOURCES, maxResults: 15 });
    const list = $('#gapList');
    $('#gapMinLabel').textContent = GAP_MIN_SOURCES;
    $('#gapsEmpty').hidden = res.opportunities.length > 0 || res.underdocumented.length > 0;

    const cards = [];
    res.opportunities.forEach((o, i) => {
      const explain = o.type === 'faible'
        ? `Vous avez ${o.ca} source(s) sur « ${esc(o.a.label)} » et ${o.cb} sur « ${esc(o.b.label)} », mais une seule les croise. Le lien existe à peine : il y a de la place pour le creuser.`
        : `Vous avez ${o.ca} source(s) sur « ${esc(o.a.label)} » et ${o.cb} sur « ${esc(o.b.label)} », mais aucune ne traite les deux ensemble.${o.type === 'pont' ? ' Ces deux thèmes appartiennent à des familles différentes de votre corpus : les relier serait un angle original.' : ''}`;
      cards.push(`
        <div class="gap-card">
          <div class="gap-rank">${i + 1}</div>
          <div class="gap-body">
            <div class="gap-title">${esc(o.a.label)}<span class="x-sep">×</span>${esc(o.b.label)}</div>
            <div class="gap-explain">${explain}</div>
          </div>
          <span class="gap-tag ${o.type}">${GAP_TAG_LABELS[o.type]}</span>
        </div>`);
    });

    if (res.underdocumented.length) {
      const names = res.underdocumented.slice(0, 8)
        .map(e => `« ${esc(e.theme.label)} » (${e.count})`).join(', ');
      cards.push(`
        <div class="gap-card">
          <div class="gap-rank">·</div>
          <div class="gap-body">
            <div class="gap-title">Thèmes sous-documentés</div>
            <div class="gap-explain">Ces thèmes n'ont qu'une source : ${names}.
            Soit ils méritent plus de lectures, soit ils peuvent être fusionnés dans un thème voisin (via la Carte).</div>
          </div>
          <span class="gap-tag sous-doc">à étoffer</span>
        </div>`);
    }

    list.innerHTML = cards.join('');
    renderHeatmap(res);
  }

  function renderHeatmap(res) {
    const wrap = $('#heatmapWrap');
    const counts = res.counts;
    const comm = res.communities;

    let themes = state.themes.filter(t => (counts.get(t.id) || 0) > 0);
    themes.sort((a, b) =>
      (comm.get(a.id) ?? 99) - (comm.get(b.id) ?? 99) ||
      (counts.get(b.id) || 0) - (counts.get(a.id) || 0));

    const truncated = themes.length > 22;
    if (truncated) {
      themes = [...themes].sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0))
        .slice(0, 22)
        .sort((a, b) =>
          (comm.get(a.id) ?? 99) - (comm.get(b.id) ?? 99) ||
          (counts.get(b.id) || 0) - (counts.get(a.id) || 0));
    }

    if (themes.length < 2) { wrap.innerHTML = '<p class="hint">Pas assez de thèmes.</p>'; return; }

    const seq = [cssVar('--seq-250'), cssVar('--seq-400'), cssVar('--seq-550'), cssVar('--seq-700')];
    const cellColor = v => v <= 0 ? '' : seq[Math.min(seq.length - 1, v - 1)];

    let html = '<table class="heatmap"><thead><tr><th></th>' +
      themes.map(t => `<th title="${esc(t.label)}">${esc(t.label)}</th>`).join('') +
      '</tr></thead><tbody>';

    themes.forEach(a => {
      html += `<tr><th title="${esc(a.label)}">${esc(a.label)}</th>`;
      themes.forEach(b => {
        if (a.id === b.id) {
          html += `<td class="diag" title="${esc(a.label)} : ${counts.get(a.id)} source(s)">${counts.get(a.id)}</td>`;
        } else {
          const k = [a.id, b.id].sort().join('|');
          const v = res.cooc.get(k) || 0;
          const isGap = v === 0 &&
            (counts.get(a.id) || 0) >= GAP_MIN_SOURCES &&
            (counts.get(b.id) || 0) >= GAP_MIN_SOURCES;
          const bg = cellColor(v);
          html += `<td class="${isGap ? 'gap-cell' : ''}"
            title="${esc(a.label)} × ${esc(b.label)} : ${v} source(s)${isGap ? ' — angle mort potentiel' : ''}"
            style="${bg ? 'background:' + bg : ''}">${v || ''}</td>`;
        }
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    if (truncated) html += '<p class="hint">Matrice limitée aux 22 thèmes les plus documentés.</p>';
    wrap.innerHTML = html;
  }

  /* ================= tableau de bord ================= */

  function barChart(container, rows, color) {
    const max = Math.max(1, ...rows.map(r => r.value));
    container.innerHTML = rows.map(r => `
      <div class="bar-row">
        <div class="bar-label" title="${esc(r.label)}">${esc(r.label)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(r.value / max * 100).toFixed(1)}%${color ? ';background:' + color : ''}"></div></div>
        <div class="bar-value">${r.value}</div>
      </div>`).join('') || '<p class="hint">Aucune donnée.</p>';
  }

  function renderDashboard() {
    const total = state.sources.length;
    const read = state.sources.filter(s => s.status === 'lu' || s.status === 'exploite').length;
    const inbox = state.sources.filter(s => s.status === 'inbox' || s.themes.length === 0).length;
    const pct = total ? Math.round(read / total * 100) : 0;

    $('#statRow').innerHTML = `
      <div class="stat-tile"><div class="value">${total}</div><div class="label">sources</div></div>
      <div class="stat-tile"><div class="value">${state.themes.length}</div><div class="label">thèmes</div></div>
      <div class="stat-tile"><div class="value">${pct}%</div><div class="label">lues ou exploitées</div></div>
      <div class="stat-tile"><div class="value">${inbox}</div><div class="label">à classer</div></div>`;

    const counts = Analysis.themeCounts(state);
    const themeRows = [...state.themes]
      .map(t => ({ label: t.label, value: counts.get(t.id) || 0 }))
      .filter(r => r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 14);
    barChart($('#chartThemes'), themeRows);

    const statusRows = Object.entries(STATUS_LABELS).map(([k, v]) => ({
      label: v, value: state.sources.filter(s => s.status === k).length
    }));
    barChart($('#chartStatus'), statusRows);

    const decades = new Map();
    state.sources.forEach(s => {
      const y = parseInt(s.year, 10);
      const label = isNaN(y) ? 'sans date' : (Math.floor(y / 10) * 10) + 's';
      decades.set(label, (decades.get(label) || 0) + 1);
    });
    const decadeRows = [...decades.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));
    barChart($('#chartYears'), decadeRows);
  }

  /* ================= capture : formulaire détaillé ================= */

  let formChips = null;

  function initDetailedForm() {
    formChips = createChipsInput($('#fThemes'), []);

    let debounce;
    $('#fAbstract').addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const text = $('#fTitle').value + ' ' + $('#fAbstract').value;
        const sugg = Analysis.extractTerms(text, formChips.getLabels(), 7);
        const box = $('#fSuggestions');
        box.innerHTML = '';
        sugg.forEach(c => {
          const b = document.createElement('button');
          b.className = 'suggestion-chip';
          b.textContent = '+ ' + c.term;
          b.addEventListener('click', () => b.remove() || formChips.addLabel(c.term));
          box.appendChild(b);
        });
      }, 400);
    });

    $('#btnAddDetailed').addEventListener('click', () => {
      const title = $('#fTitle').value.trim();
      if (!title) { toast('Le titre est obligatoire.'); return; }
      const themeIds = labelsToThemeIds(formChips.getLabels());
      Store.addSource({
        title,
        authors: $('#fAuthors').value,
        year: $('#fYear').value.trim(),
        type: $('#fType').value,
        url: $('#fUrl').value,
        abstract: $('#fAbstract').value,
        notes: $('#fNotes').value,
        themes: themeIds,
        status: themeIds.length ? 'a_lire' : 'inbox'
      });
      ['fTitle', 'fAuthors', 'fYear', 'fUrl', 'fAbstract', 'fNotes'].forEach(id => $('#' + id).value = '');
      formChips.setLabels([]);
      $('#fSuggestions').innerHTML = '';
      toast('Source ajoutée.');
    });
  }

  /* ================= export / import ================= */

  function doExport() {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = URL.createObjectURL(blob);
    a.download = `cartographe-${d}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Export téléchargé. Gardez-le précieusement : c\'est votre sauvegarde.');
  }

  /* ================= initialisation ================= */

  function init() {
    $('#projectName').value = state.projectName;
    $('#projectName').addEventListener('change', e => Store.setProjectName(e.target.value));

    $$('.tabs button').forEach(b =>
      b.addEventListener('click', () => switchTab(b.dataset.tab)));

    // dépôt rapide
    $('#btnQuickAdd').addEventListener('click', () => {
      const text = $('#quickPaste').value;
      const entries = parseQuickText(text);
      if (!entries.length) { toast('Rien à déposer.'); return; }
      addParsedSources(entries);
      $('#quickPaste').value = '';
    });

    $('#btnLoadSample').addEventListener('click', () => {
      if (state.sources.length &&
          !confirm('Ajouter le corpus d\'exemple aux sources existantes ?')) return;
      SAMPLE_DATA.sources.forEach(e => {
        Store.addSource({
          title: e.title, authors: e.authors, year: e.year, type: e.type,
          abstract: e.abstract, status: e.status, importance: e.importance,
          themes: labelsToThemeIds(e.themeLabels)
        });
      });
      if (!state.sources.length) Store.setProjectName(SAMPLE_DATA.projectName);
      toast('Corpus d\'exemple chargé — allez voir la Carte et les Angles morts.');
    });

    // zone de dépôt de fichiers
    const dz = $('#dropzone');
    dz.addEventListener('click', () => $('#fileInput').click());
    $('#fileInput').addEventListener('change', e => {
      [...e.target.files].forEach(handleFile);
      e.target.value = '';
    });
    ;['dragover', 'dragenter'].forEach(ev =>
      dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('dragover'); }));
    ;['dragleave', 'drop'].forEach(ev =>
      dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('dragover'); }));
    dz.addEventListener('drop', e => [...e.dataTransfer.files].forEach(handleFile));

    initDetailedForm();

    // sources : filtres
    ['srcSearch', 'srcThemeFilter', 'srcStatusFilter', 'srcSort'].forEach(id =>
      $('#' + id).addEventListener('input', renderSources));

    // carte
    $('#minCooc').addEventListener('input', renderGraph);
    $('#showIsolated').addEventListener('change', renderGraph);
    $('#btnRecenter').addEventListener('click', () => GraphView.recenter($('#graphSvg')));
    $('#btnExportSvg').addEventListener('click', () =>
      GraphView.exportSVG($('#graphSvg'), 'carte-themes.svg', cssVar('--page')));

    // drawer
    $('#drawerClose').addEventListener('click', closeDrawer);
    $('#drawerCancel').addEventListener('click', closeDrawer);
    $('#drawerBackdrop').addEventListener('click', closeDrawer);
    $('#drawerSave').addEventListener('click', saveDrawer);
    $('#drawerDelete').addEventListener('click', () => {
      if (drawerSourceId && confirm('Supprimer définitivement cette source ?')) {
        Store.deleteSource(drawerSourceId);
        closeDrawer();
        toast('Source supprimée.');
      }
    });

    // import / export
    $('#btnExport').addEventListener('click', doExport);
    $('#btnImport').addEventListener('click', () => $('#importFileInput').click());
    $('#importFileInput').addEventListener('change', e => {
      [...e.target.files].forEach(handleFile);
      e.target.value = '';
    });

    // re-rendu sur tout changement de données
    Store.onChange(() => { state = Store.state; renderActive(); });

    // re-rendu du graphe quand la fenêtre ou le thème change
    let resizeT;
    window.addEventListener('resize', () => {
      if (activeTab !== 'carte') return;
      clearTimeout(resizeT);
      resizeT = setTimeout(renderGraph, 250);
    });
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => renderActive());
    }

    switchTab('capture');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
