/* ============================================================
   BibTeX — analyseur tolérant pour l'import de bibliographies
   ============================================================ */

const BibTeX = (() => {

  const TYPE_MAP = {
    article: 'article',
    book: 'ouvrage',
    inbook: 'chapitre',
    incollection: 'chapitre',
    inproceedings: 'article',
    conference: 'article',
    phdthesis: 'these',
    mastersthesis: 'these',
    techreport: 'rapport',
    unpublished: 'autre',
    misc: 'autre',
    online: 'web',
    electronic: 'web'
  };

  function looksLikeBibtex(text) {
    return /@\s*[a-zA-Z]+\s*\{/.test(text);
  }

  // Retire les accolades LaTeX et quelques commandes courantes
  function cleanValue(v) {
    v = v.trim();
    while ((v.startsWith('{') && v.endsWith('}')) ||
           (v.startsWith('"') && v.endsWith('"'))) {
      v = v.slice(1, -1).trim();
    }
    return v
      .replace(/\\['"`^~=.uvHtcdb]\{?([a-zA-Z])\}?/g, '$1')
      .replace(/\\[a-zA-Z]+\s*/g, ' ')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Découpe le corps d'une entrée en champs, en respectant les accolades imbriquées
  function parseFields(body) {
    const fields = {};
    let i = 0;
    while (i < body.length) {
      // nom de champ
      const m = /^[\s,]*([a-zA-Z_-]+)\s*=\s*/.exec(body.slice(i));
      if (!m) break;
      const name = m[1].toLowerCase();
      i += m[0].length;

      let value = '';
      if (body[i] === '{') {
        let depth = 0, start = i;
        for (; i < body.length; i++) {
          if (body[i] === '{') depth++;
          else if (body[i] === '}') { depth--; if (depth === 0) { i++; break; } }
        }
        value = body.slice(start, i);
      } else if (body[i] === '"') {
        let start = i; i++;
        while (i < body.length && body[i] !== '"') i++;
        i++;
        value = body.slice(start, i);
      } else {
        let start = i;
        while (i < body.length && body[i] !== ',') i++;
        value = body.slice(start, i);
      }
      fields[name] = cleanValue(value);
    }
    return fields;
  }

  // Retourne une liste d'objets « source » prêts pour Store.addSource
  // (les thèmes restent des libellés : à résoudre via ensureTheme)
  function parse(text) {
    const entries = [];
    const re = /@\s*([a-zA-Z]+)\s*\{/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const type = m[1].toLowerCase();
      if (type === 'comment' || type === 'preamble' || type === 'string') continue;

      // trouve la fin de l'entrée (accolades équilibrées)
      let depth = 1, i = re.lastIndex;
      for (; i < text.length && depth > 0; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') depth--;
      }
      let body = text.slice(re.lastIndex, i - 1);
      re.lastIndex = i;

      // retire la clé de citation (jusqu'à la première virgule)
      const comma = body.indexOf(',');
      if (comma >= 0) body = body.slice(comma + 1);

      const f = parseFields(body);
      if (!f.title) continue;

      const authors = (f.author || f.editor || '')
        .split(/\s+and\s+/i)
        .map(a => {
          const parts = a.split(',').map(x => x.trim());
          return parts.length === 2 ? parts[1] + ' ' + parts[0] : a.trim();
        })
        .filter(Boolean)
        .join(', ');

      const themeLabels = (f.keywords || '')
        .split(/[;,]/)
        .map(k => k.trim().toLowerCase())
        .filter(k => k && k.length < 60);

      entries.push({
        title: f.title,
        authors,
        year: (f.year || '').replace(/\D/g, '').slice(0, 4),
        type: TYPE_MAP[type] || 'autre',
        url: f.url || (f.doi ? 'https://doi.org/' + f.doi : ''),
        abstract: f.abstract || '',
        notes: [f.journal, f.booktitle, f.publisher].filter(Boolean).join(' — '),
        themeLabels
      });
    }
    return entries;
  }

  return { parse, looksLikeBibtex };
})();
