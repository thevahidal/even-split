// houses: [x, y, numerator, denominator]
const LEVELS = [
  { name: 'Halves', cols: 5, rows: 5, gate: [0, 2], rocks: [],
    houses: [[4, 0, 1, 2], [4, 4, 1, 2]],
    hint: 'Drag a road from the spring. Start a second road from the middle of the first.',
    why: 'A road splits the water evenly. Two ways, half each.' },
  { name: 'Three quarters', cols: 6, rows: 5, gate: [0, 2], rocks: [],
    houses: [[5, 0, 3, 4], [5, 4, 1, 4]],
    hint: 'Roads can join. Their water adds up.',
    why: 'A half and a quarter joined make three quarters.' },
  { name: 'Three houses', cols: 6, rows: 5, gate: [0, 2], rocks: [],
    houses: [[5, 0, 1, 2], [5, 2, 1, 4], [5, 4, 1, 4]],
    hint: 'A road can split in two, never three.',
    why: 'Split, then split one half again.' },
  { name: 'Thirds', cols: 6, rows: 5, gate: [0, 1], rocks: [],
    houses: [[5, 1, 2, 3], [5, 4, 1, 3]],
    hint: 'Halves never make a third... unless some water goes round again.',
    why: 'Water sent back passes the fork again. A quarter of it keeps coming round, and that makes thirds.' },
  { name: 'Three thirds', cols: 6, rows: 6, gate: [0, 1], rocks: [],
    houses: [[5, 1, 1, 3], [5, 3, 1, 3], [5, 5, 1, 3]],
    hint: 'Make thirds first.',
    why: 'Two thirds split in half is a third and a third.' },
  { name: 'Fifths', cols: 7, rows: 6, gate: [0, 1], rocks: [],
    houses: [[6, 1, 4, 5], [6, 5, 1, 5]],
    hint: 'How much has to go round to make fifths?',
    why: 'Send back three eighths and the fork sees eight fifths of the water. An eighth of that is a fifth.' }
];

if (typeof module !== 'undefined') module.exports = { LEVELS };
