// Finds every cheapest road network that solves a level. Cost = road tiles the player adds.
const { solveFlow } = require('./flow.js');

function solveLevel(lv, maxRoads = 14) {
  const { cols, rows } = lv;
  const N = cols * rows;
  const idx = (x, y) => y * cols + x;
  const name = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) name.push(`${x},${y}`);
  const gate = idx(...lv.gate);
  const target = new Map(lv.houses.map(([x, y, n, d]) => [idx(x, y), n / d]));
  const blocked = new Set((lv.rocks || []).map(([x, y]) => idx(x, y)));

  const has = new Set();
  const fixedOuts = Array.from({ length: N }, () => []);
  for (const stroke of lv.built || []) {
    const cells = stroke.split(' ').map((c) => idx(...c.split(',').map(Number)));
    for (let i = 1; i < cells.length; i++) {
      fixedOuts[cells[i - 1]].push(cells[i]);
      has.add(cells[i - 1] * N + cells[i]);
    }
  }
  const builtEdges = [...has].map((e) => [Math.floor(e / N), e % N]);

  const neighbours = Array.from({ length: N }, (_, i) => {
    const x = i % cols, y = Math.floor(i / cols);
    return [[x + 1, y], [x, y + 1], [x - 1, y], [x, y - 1]]
      .filter(([a, b]) => a >= 0 && b >= 0 && a < cols && b < rows)
      .map(([a, b]) => idx(a, b))
      .filter((j) => j !== gate && !blocked.has(j));
  });

  let budget, found;
  const added = [];
  const seen = new Uint8Array(N);
  const queue = [];
  const houseIn = new Map([...target.keys()].map((h) => [h, 0]));

  function discover(v, undo) {
    if (target.has(v)) { houseIn.set(v, houseIn.get(v) + 1); undo.push(() => houseIn.set(v, houseIn.get(v) - 1)); }
    else if (!seen[v]) { seen[v] = 1; queue.push(v); undo.push(() => { seen[v] = 0; queue.pop(); }); }
  }

  function leaf() {
    for (const n of houseIn.values()) if (!n) return;
    const edges = [...builtEdges, ...added].map(([a, b]) => [name[a], name[b]]);
    const flow = solveFlow(edges, { [name[gate]]: 1 });
    if (!flow) return;
    for (const [h, want] of target) if (Math.abs((flow.water.get(name[h]) || 0) - want) > 1e-9) return;
    found.push(added.map(([a, b]) => `${name[a]}>${name[b]}`));
  }

  function dfs(qi) {
    let open = 0;
    for (let i = qi; i < queue.length; i++) if (!fixedOuts[queue[i]].length) open++;
    let missing = 0;
    for (const n of houseIn.values()) if (!n) missing++;
    if (added.length + Math.max(open, missing) > budget) return;
    if (qi === queue.length) return leaf();

    const u = queue[qi], undo = [];
    for (const v of fixedOuts[u]) discover(v, undo);
    const fixed = fixedOuts[u].length;
    const options = neighbours[u].filter((v) => !has.has(u * N + v) && !has.has(v * N + u));
    const picks = [];
    if (fixed >= 1) picks.push([]);
    if (fixed <= 1) for (const v of options) picks.push([v]);
    if (fixed === 0) for (let i = 0; i < options.length; i++) for (let j = i + 1; j < options.length; j++) picks.push([options[i], options[j]]);

    for (const pick of picks) {
      if (added.length + pick.length > budget) continue;
      const inner = [];
      for (const v of pick) { has.add(u * N + v); added.push([u, v]); discover(v, inner); }
      dfs(qi + 1);
      while (inner.length) inner.pop()();
      for (const v of pick) { has.delete(u * N + v); added.pop(); }
    }
    while (undo.length) undo.pop()();
  }

  for (budget = 0; budget <= maxRoads; budget++) {
    found = [];
    seen.fill(0);
    seen[gate] = 1;
    queue.length = 0;
    queue.push(gate);
    dfs(0);
    if (found.length) return { roads: budget, answers: found };
  }
  return { roads: null, answers: [] };
}

module.exports = { solveLevel };
