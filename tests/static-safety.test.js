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
const appResults = read('app-results.js');

assert.ok(
  appCore.includes('if(adminEntryButton)adminEntryButton.onclick'),
  'admin entry binding must tolerate admin.html without #adminBtn'
);
assert.ok(
  appCore.includes("window.addEventListener('online'") &&
  appCore.includes('localUpdatedAt>remoteUpdatedAt') &&
  appCore.includes('if(useLocalDraft)save()'),
  'newer local drafts must survive a failed cloud save and retry after reconnect'
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
  indexHtml.includes('analysis-export.js?v=20260728-3') &&
  adminHtml.includes('analysis-export.js?v=20260728-3'),
  'customer and admin pages must load the stabilized cache version'
);
assert.ok(
  !appResults.includes('window.print()') &&
  appResults.includes('PDFを保存') &&
  pdfReport.includes('/Count 1'),
  'PDF save must create a real single-page PDF instead of opening print preview'
);
assert.ok(
  appResults.includes("navigator.canShare({files:[file]})") &&
  appResults.includes("canvasToBlob(c,'image/png')"),
  'image save must use a file Blob and the iPhone share sheet when available'
);
assert.ok(
  analysisExport.includes('【BIG5 回答番号（設問番号:回答番号）】') &&
  analysisExport.includes("return `${index+1}:${Number.isInteger(value)?value:'-'}`") &&
  !analysisExport.includes('const [trait,direction,text]=question'),
  'AI copy must contain compact numbered Big Five answers without question text'
);

console.log('Static safety: admin startup, AI privacy boundary, and same-origin branding verified.');

