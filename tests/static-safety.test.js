const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const appCore = read('app-core.js');
const adminHtml = read('admin.html');
const indexHtml = read('index.html');
const analysisExport = read('analysis-export.js');
const branding = read('branding.js');
const pdfReport = read('pdf-report.js');

assert.ok(
  appCore.includes('if(adminEntryButton)adminEntryButton.onclick'),
  'admin entry binding must tolerate admin.html without #adminBtn'
);
assert.ok(
  !adminHtml.includes('id="adminBtn"'),
  'the stability test must cover the actual admin.html structure'
);
assert.ok(
  !analysisExport.includes('renderResult=function()'),
  'AI export must not be injected into the customer result screen'
);
assert.ok(
  analysisExport.includes('redactDirectIdentifiers(exportText,assessment)'),
  'AI export must redact structured direct identifiers'
);
assert.ok(
  analysisExport.includes("['活動区分',profile.type],['事業内容',profile.business],['役職',profile.role]"),
  'AI context must exclude name, kana, company, and contact fields'
);
assert.ok(
  analysisExport.includes('「事実」「解釈」「面談仮説」の3層'),
  'AI export instructions must enforce the three-layer analysis model'
);
assert.ok(
  analysisExport.includes('商品名、価格、適職、人生方針を断定しない'),
  'AI export instructions must prohibit definitive product and life decisions'
);
assert.ok(
  !branding.includes('raw.githubusercontent.com') &&
  !pdfReport.includes('raw.githubusercontent.com'),
  'site and PDF logos must use same-origin assets'
);
assert.ok(
  indexHtml.includes('analysis-export.js?v=20260728-2') &&
  adminHtml.includes('analysis-export.js?v=20260728-2'),
  'customer and admin pages must load the stabilized cache version'
);

console.log('Static safety: admin startup, AI privacy boundary, and same-origin branding verified.');

