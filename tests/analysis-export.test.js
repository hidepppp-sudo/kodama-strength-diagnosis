const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'analysis-export.js'), 'utf8');
const compactFunction = source.match(/function bigFiveAnswerLines\(assessment\)\{[\s\S]*?\n\}/)?.[0];

assert.ok(compactFunction, 'compact Big Five export function must be present');

const context = vm.createContext({});
vm.runInContext(`${compactFunction}\nglobalThis.bigFiveAnswerLines=bigFiveAnswerLines;`, context);

const answers = Array.from({ length: 50 }, (_, index) => index % 5 + 1);
const output = context.bigFiveAnswerLines({ bigfive: answers });

assert.equal(output.split(' ').length, 50, 'copy text must contain exactly 50 compact answers');
assert.ok(output.startsWith('1:1 2:2 3:3 4:4 5:5'), 'answers must use question:answer numbering');
assert.ok(output.endsWith('46:1 47:2 48:3 49:4 50:5'), 'all 50 answers must be included');
assert.ok(!output.includes('回答：') && !output.includes('逆転項目'), 'question details must not be copied');

console.log('AI copy export: 50 Big Five answers compacted to question:answer numbering.');

