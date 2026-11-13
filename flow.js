// Water arriving at a cell splits evenly between the roads leaving it.
// edges: [[fromKey, toKey]], sources: { key: amount }. Returns null if water is trapped in a loop.
function solveFlow(edges, sources) {
  const nodes = [...new Set([...Object.keys(sources), ...edges.flat()])];
  const index = new Map(nodes.map((k, i) => [k, i]));
  const outs = new Map(nodes.map((k) => [k, 0]));
  for (const [a] of edges) outs.set(a, outs.get(a) + 1);

  const n = nodes.length;
  const m = nodes.map((_, i) => { const row = new Array(n + 1).fill(0); row[i] = 1; return row; });
  for (const [a, b] of edges) m[index.get(b)][index.get(a)] -= 1 / outs.get(a);
  for (const [k, v] of Object.entries(sources)) m[index.get(k)][n] += v;

  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    if (Math.abs(m[p][c]) < 1e-12) return null;
    [m[c], m[p]] = [m[p], m[c]];
    for (let r = 0; r < n; r++) {
      if (r === c || m[r][c] === 0) continue;
      const f = m[r][c] / m[c][c];
      for (let k = c; k <= n; k++) m[r][k] -= f * m[c][k];
    }
  }
  const water = new Map(nodes.map((k, i) => [k, m[i][n] / m[i][i]]));
  return { water, outs, along: (a) => water.get(a) / outs.get(a) };
}

// True if some water can never leave: every cell must lead to a road end.
function trapped(edges) {
  const outs = new Map(), back = new Map();
  for (const [a, b] of edges) {
    outs.set(a, (outs.get(a) || 0) + 1);
    if (!back.has(b)) back.set(b, []);
    back.get(b).push(a);
  }
  const nodes = new Set(edges.flat());
  const reach = new Set([...nodes].filter((k) => !outs.get(k)));
  const todo = [...reach];
  while (todo.length) for (const a of back.get(todo.pop()) || []) if (!reach.has(a)) { reach.add(a); todo.push(a); }
  return reach.size < nodes.size;
}

function fraction(x) {
  if (Math.abs(x) < 1e-9) return '0';
  for (let d = 1; d <= 512; d++) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 1e-7) return d === 1 ? `${n}` : `${n}/${d}`;
  }
  return x.toFixed(3);
}

if (typeof module !== 'undefined') module.exports = { solveFlow, trapped, fraction };
