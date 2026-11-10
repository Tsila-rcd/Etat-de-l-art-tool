/* ============================================================
   GraphView — carte des thèmes (force layout D3)
   ============================================================ */

const GraphView = (() => {
  let svg, g, sim, zoomBehavior;
  let currentNodes = [], currentLinks = [];

  function clear(svgEl) {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
  }

  /**
   * data : { nodes: [{id,label,count,community}], links: [{source,target,weight}] }
   * opts : { palette: [hex...], ink, linkColor, surface }
   * cb   : { onNodeClick(id), onBackgroundClick() }
   */
  function render(svgEl, data, opts, cb) {
    cb = cb || {};
    if (sim) sim.stop();
    clear(svgEl);

    const W = svgEl.clientWidth || 900;
    const H = svgEl.clientHeight || 600;

    svg = d3.select(svgEl);
    g = svg.append('g');

    zoomBehavior = d3.zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', ev => g.attr('transform', ev.transform));
    svg.call(zoomBehavior);
    svg.on('click', (ev) => {
      if (ev.target === svgEl && cb.onBackgroundClick) cb.onBackgroundClick();
    });

    currentNodes = data.nodes.map(d => Object.assign({}, d));
    currentLinks = data.links.map(d => Object.assign({}, d));

    const maxCount = d3.max(currentNodes, d => d.count) || 1;
    const rScale = d3.scaleSqrt().domain([1, Math.max(2, maxCount)]).range([7, 24]);
    const maxW = d3.max(currentLinks, d => d.weight) || 1;
    const wScale = d3.scaleLinear().domain([1, Math.max(2, maxW)]).range([1.2, 5]);

    const color = i => (i < opts.palette.length ? opts.palette[i] : opts.inkMuted);

    const link = g.append('g')
      .selectAll('line')
      .data(currentLinks)
      .join('line')
      .attr('stroke', opts.linkColor)
      .attr('stroke-opacity', 0.55)
      .attr('stroke-width', d => wScale(d.weight))
      .attr('stroke-linecap', 'round');

    const node = g.append('g')
      .selectAll('g')
      .data(currentNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (ev, d) => {
          if (!ev.active) sim.alphaTarget(0.25).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end', (ev, d) => {
          if (!ev.active) sim.alphaTarget(0);
          d.fx = null; d.fy = null;
        }));

    node.append('circle')
      .attr('r', d => rScale(d.count))
      .attr('fill', d => color(d.community))
      .attr('stroke', opts.surface)
      .attr('stroke-width', 2);

    node.append('text')
      .text(d => d.label)
      .attr('x', d => rScale(d.count) + 5)
      .attr('y', 4)
      .attr('font-family', 'system-ui, -apple-system, "Segoe UI", sans-serif')
      .attr('font-size', d => (10 + Math.min(6, d.count)) + 'px')
      .attr('font-weight', 600)
      .attr('fill', opts.ink)
      .attr('paint-order', 'stroke')
      .attr('stroke', opts.surface)
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round');

    node.on('click', (ev, d) => {
      ev.stopPropagation();
      highlight(d.id);
      if (cb.onNodeClick) cb.onNodeClick(d.id);
    });

    function highlight(id) {
      const neigh = new Set([id]);
      currentLinks.forEach(l => {
        const s = l.source.id || l.source, t = l.target.id || l.target;
        if (s === id) neigh.add(t);
        if (t === id) neigh.add(s);
      });
      node.attr('opacity', d => neigh.has(d.id) ? 1 : 0.18);
      link.attr('stroke-opacity', l => {
        const s = l.source.id || l.source, t = l.target.id || l.target;
        return (s === id || t === id) ? 0.85 : 0.08;
      });
    }

    function unhighlight() {
      node.attr('opacity', 1);
      link.attr('stroke-opacity', 0.55);
    }
    GraphView.unhighlight = unhighlight;

    sim = d3.forceSimulation(currentNodes)
      .force('link', d3.forceLink(currentLinks).id(d => d.id)
        .distance(d => 90 - Math.min(40, d.weight * 6))
        .strength(d => Math.min(1, 0.3 + d.weight * 0.1)))
      .force('charge', d3.forceManyBody().strength(-320))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide().radius(d => rScale(d.count) + 14))
      .force('x', d3.forceX(W / 2).strength(0.04))
      .force('y', d3.forceY(H / 2).strength(0.05));

    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }

  function recenter(svgEl) {
    if (!svg || !zoomBehavior) return;
    svg.transition().duration(350)
      .call(zoomBehavior.transform, d3.zoomIdentity);
  }

  // Exporte le SVG courant en fichier téléchargeable
  function exportSVG(svgEl, filename, surface) {
    const cloned = svgEl.cloneNode(true);
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    cloned.setAttribute('width', svgEl.clientWidth);
    cloned.setAttribute('height', svgEl.clientHeight);
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', surface);
    cloned.insertBefore(bg, cloned.firstChild);
    const blob = new Blob([new XMLSerializer().serializeToString(cloned)],
      { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return { render, recenter, exportSVG, unhighlight: () => {} };
})();
