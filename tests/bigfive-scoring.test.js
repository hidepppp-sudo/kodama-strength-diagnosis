const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const questionsSource = fs.readFileSync(path.join(root, 'questions.js'), 'utf8');
const resultsSource = fs.readFileSync(path.join(root, 'app-results.js'), 'utf8');
const scoreSource = resultsSource.match(/function score\(s\)\{[^\n]+\}/)?.[0];

assert.ok(scoreSource, 'score function must be present');

const context = vm.createContext({});
vm.runInContext(
  `${questionsSource}\n${scoreSource}\nglobalThis.testQuestions=questions;globalThis.testScore=score;`,
  context
);

const questions = context.testQuestions;
const score = context.testScore;
const traitKeys = ['E', 'A', 'C', 'S', 'I'];
const expectedReverseItems = [
  4, 6, 8, 9, 12, 16, 18, 19, 22, 24, 26, 28,
  29, 32, 34, 36, 39, 40, 43, 45, 46, 47, 49, 50
];

assert.equal(questions.length, 50, 'Big Five must contain exactly 50 items');
for (const trait of traitKeys) {
  assert.equal(
    questions.filter(([key]) => key === trait).length,
    10,
    `${trait} must contain exactly 10 items`
  );
}

const actualReverseItems = questions
  .map(([, direction], index) => direction === -1 ? index + 1 : null)
  .filter(Boolean);
assert.deepEqual(
  Array.from(actualReverseItems),
  expectedReverseItems,
  'reverse-item mapping must match the reviewed 50-item key'
);

const neutral = Array(50).fill(3);
assert.deepEqual(
  JSON.parse(JSON.stringify(score({ bigfive: neutral }))),
  {
    raw: { E: 30, A: 30, C: 30, S: 30, I: 30 },
    pct: { E: 50, A: 50, C: 50, S: 50, I: 50 }
  },
  'all neutral responses must produce 50 on every displayed scale'
);

const keyedMaximum = questions.map(([, direction]) => direction === 1 ? 5 : 1);
assert.deepEqual(
  JSON.parse(JSON.stringify(score({ bigfive: keyedMaximum }))),
  {
    raw: { E: 50, A: 50, C: 50, S: 50, I: 50 },
    pct: { E: 100, A: 100, C: 100, S: 100, I: 100 }
  },
  'normal and reverse items must both score toward the maximum correctly'
);

const keyedMinimum = questions.map(([, direction]) => direction === 1 ? 1 : 5);
assert.deepEqual(
  JSON.parse(JSON.stringify(score({ bigfive: keyedMinimum }))),
  {
    raw: { E: 10, A: 10, C: 10, S: 10, I: 10 },
    pct: { E: 0, A: 0, C: 0, S: 0, I: 0 }
  },
  'normal and reverse items must both score toward the minimum correctly'
);

questions.forEach(([trait, direction], index) => {
  const favorable = neutral.slice();
  favorable[index] = direction === 1 ? 5 : 1;
  const unfavorable = neutral.slice();
  unfavorable[index] = direction === 1 ? 1 : 5;

  assert.equal(
    score({ bigfive: favorable }).raw[trait],
    32,
    `item ${index + 1} must add two raw points in its keyed direction`
  );
  assert.equal(
    score({ bigfive: unfavorable }).raw[trait],
    28,
    `item ${index + 1} must subtract two raw points against its keyed direction`
  );
});

console.log('Big Five scoring: 50/50 items, reverse key, 0/50/100 conversions verified.');

