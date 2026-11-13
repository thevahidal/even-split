// Run with `node check-levels.js`. Levels with a road budget must have exactly one cheapest answer.
const { solveLevel } = require('./solver.js');
const { LEVELS } = require('./levels.js');

let failed = false;
LEVELS.forEach((lv, i) => {
  const { roads, answers } = solveLevel(lv, lv.roads ?? 16);
  let problem = '';
  if (roads === null) problem = 'no answer';
  else if (lv.roads && roads !== lv.roads) problem = `budget ${lv.roads} but cheapest answer uses ${roads}`;
  else if (lv.roads && answers.length > 1) problem = `${answers.length} cheapest answers`;
  failed ||= !!problem;
  console.log(`${problem ? 'FAIL' : 'ok  '} ${i + 1}. ${lv.name}: ${roads} road, ${answers.length} answer(s) ${problem}`);
});
process.exit(failed ? 1 : 0);
