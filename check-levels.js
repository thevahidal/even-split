// Run with `node check-levels.js`: every level must be solvable by its sample answer.
const { solveFlow, trapped, fraction } = require('./flow.js');
const { LEVELS } = require('./levels.js');

const ANSWERS = [
  ['0,2 1,2 2,2 2,1 2,0 3,0 4,0', '2,2 2,3 2,4 3,4 4,4'],
  ['0,2 1,2 2,2 2,1 2,0 3,0 4,0 5,0', '2,2 3,2 4,2 4,3 4,4 5,4', '4,2 4,1 4,0'],
  ['0,2 1,2 1,1 1,0 2,0 3,0 4,0 5,0', '1,2 2,2 3,2 4,2 5,2', '3,2 3,3 3,4 4,4 5,4'],
  ['0,1 1,1 2,1 3,1 4,1 5,1', '3,1 3,2 3,3 4,3 4,4 5,4', '3,3 2,3 1,3 1,2 1,1'],
  ['0,1 1,1 2,1 3,1 4,1 5,1', '4,1 4,2 4,3 5,3', '2,1 2,2 2,3 2,4 3,4 3,5 4,5 5,5', '2,4 1,4 1,3 1,2 1,1'],
  ['0,1 1,1 2,1 3,1 4,1 5,1 6,1', '3,1 3,2 3,3 3,4 3,5 4,5 5,5 6,5', '3,3 2,3 2,2 2,1', '3,4 2,4 1,4 1,3 1,2 1,1']
];

let failed = false;
LEVELS.forEach((lv, i) => {
  const gate = lv.gate.join(','), houses = new Set(lv.houses.map(([x, y]) => `${x},${y}`));
  const used = new Set([gate]), edges = [], problems = [];
  for (const stroke of ANSWERS[i]) {
    const cells = stroke.split(' ');
    if (!used.has(cells[0])) problems.push(`stroke starts off-road at ${cells[0]}`);
    cells.slice(1).forEach((c, j) => {
      const last = j === cells.length - 2;
      if (used.has(c) && !last) problems.push(`stroke crosses a road at ${c}`);
      if (houses.has(c) && !last) problems.push(`stroke passes through a house at ${c}`);
      edges.push([cells[j], c]);
    });
    cells.forEach((c) => { if (!houses.has(c)) used.add(c); });
  }
  const outs = {};
  for (const [a] of edges) outs[a] = (outs[a] || 0) + 1;
  for (const k in outs) if (outs[k] > 2) problems.push(`${k} splits ${outs[k]} ways`);
  if (trapped(edges)) problems.push('water is trapped');
  const flow = solveFlow(edges, { [gate]: 1 });
  for (const [x, y, n, d] of lv.houses) {
    const got = flow ? flow.water.get(`${x},${y}`) || 0 : 0;
    if (Math.abs(got - n / d) > 1e-9) problems.push(`house ${x},${y} wants ${n}/${d}, got ${fraction(got)}`);
  }
  failed ||= problems.length > 0;
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${i + 1}. ${lv.name}${problems.map((p) => `\n     ${p}`).join('')}`);
});
process.exit(failed ? 1 : 0);
