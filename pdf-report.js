const baseRenderResultForPdf=renderResult;

const pdfTraitGuides={
  E:{summary:'人との交流、発言、行動開始、外部から刺激を得る傾向を表します。社交性の優劣ではなく、どの環境でエネルギーが高まりやすいかの違いです。',highGood:'自分から声をかける、場を動かす、販売・発信・人脈形成を進めやすい。',highRisk:'話しながら考えて判断が早まりやすい。予定を入れすぎ、内省や一人の回復時間が不足しやすい。',lowGood:'深く考える、集中する、聞き役になる、少人数で信頼を築くことに向きやすい。',lowRisk:'最初の声かけや自己発信が遅れ、実力が周囲に伝わりにくいことがある。'},
  A:{summary:'共感、配慮、協力、対立への向き合い方など、他者との調整方法に関係する傾向です。',highGood:'相手の感情をくみ取り、安心感と協力関係をつくる。チームの調整や顧客支援に活かしやすい。',highRisk:'相手を優先しすぎて断れない、価格や条件を譲る、必要な指摘を避けることがある。',lowGood:'感情に流されず、条件交渉、客観的評価、厳しい判断、問題提起を行いやすい。',lowRisk:'表現が直接的になり、冷たい・強いと受け取られたり、感情面の情報を見落とすことがある。'},
  C:{summary:'計画性、整理、継続、責任、品質管理など、物事を着実に進める方法に表れやすい傾向です。',highGood:'準備、期限管理、品質維持、継続実行が得意で、約束を守る信頼につながりやすい。',highRisk:'完璧を求めて着手が遅れる、変更に硬くなる、自分で抱え込み委任しにくいことがある。',lowGood:'状況に応じた変更、即興、試行錯誤、スピード重視の立ち上げに強みが出やすい。',lowRisk:'抜け漏れ、先延ばし、整理不足、継続の波が起きやすく、仕組み化による補助が必要になりやすい。'},
  S:{summary:'不安、ストレス、感情変化への反応と、プレッシャー下での落ち着きに関係する傾向です。',highGood:'緊急時にも落ち着いて判断しやすく、感情に左右されず一定の対応を続けやすい。',highRisk:'危険や相手の不安を軽く見積もる、感情が伝わりにくい、問題への反応が遅れることがある。',lowGood:'小さな変化やリスクを察知し、事前に備える。相手の不安や痛みに気づきやすい。',lowRisk:'心配や緊張が続きやすく、ストレスが判断・睡眠・行動量に影響しやすい。回復方法の設計が重要。'},
  I:{summary:'新しい考え、抽象的思考、想像、学習、未知のものへの関心に関係する傾向です。知能の高低ではありません。',highGood:'新しい発想、企画、学習、複数分野の統合、将来像を描くことに強みが出やすい。',highRisk:'アイデアが増えすぎて焦点が散る、説明が複雑になる、実行前に次の関心へ移ることがある。',lowGood:'実用性、分かりやすさ、既に確立された方法、現場で再現できる手順を重視しやすい。',lowRisk:'新しい方法への抵抗、選択肢の狭まり、環境変化への対応の遅れにつながることがある。'}
};

function pdfBand(scoreValue){if(scoreValue>=70)return'高め';if(scoreValue<=30)return'低め';return'中間'}
function pdfBandInterpretation(scoreValue){
  if(scoreValue>=70)return`今回の${scoreValue}点は高めです。高い側の特徴が自然に表れやすいため、強みとして活かす場面と、過剰に出たときの注意点を確認してください。`;
  if(scoreValue<=30)return`今回の${scoreValue}点は低めです。低い側にも固有の強みがあります。無理に高く見せず、必要な場面だけ仕組みや役割分担で補うことが重要です。`;
  return`今回の${scoreValue}点は中間域です。状況・相手・役割に応じて、高い側と低い側の特徴を使い分けやすい可能性があります。`;
}
function pdfTraitCard(key,pct){
  const guide=pdfTraitGuides[key],value=pct[key];
  return `<article class="pdf-trait-card pdf-trait-${key}"><div class="pdf-trait-head"><h2>${esc(traits[key])}</h2><div class="pdf-score"><strong>${value}</strong><span>${pdfBand(value)}</span></div></div><p class="pdf-summary">${esc(guide.summary)}</p><p class="pdf-current"><b>今回の見方：</b>${esc(pdfBandInterpretation(value))}</p><div class="pdf-high-low"><section><h3>高い場合</h3><p><b>強み：</b>${esc(guide.highGood)}</p><p><b>注意：</b>${esc(guide.highRisk)}</p></section><section><h3>低い場合</h3><p><b>強み：</b>${esc(guide.lowGood)}</p><p><b>注意：</b>${esc(guide.lowRisk)}</p></section></div></article>`;
}
function buildPortraitPdfSheet(s,pct){
  document.getElementById('pdfSheet')?.remove();
  const sheet=document.createElement('section');
  sheet.id='pdfSheet';sheet.className='pdf-sheet';
  const completedDate=s.completedAt?new Date(s.completedAt):new Date();
  sheet.innerHTML=`<header class="pdf-header"><div class="pdf-brand"><img class="pdf-logo-mark" src="assets/kodama-logo-mark.jpg" alt="Kodama Corporation ロゴ"><div class="pdf-brand-text"><div class="pdf-kicker">PERSONA CORE</div><div class="pdf-subtitle">あなたの設計診断</div><h1>Big Five 性格傾向レポート</h1></div></div><div class="pdf-person"><strong>${esc(s.profile.name||'')}</strong><span>診断日：${completedDate.toLocaleDateString('ja-JP')}</span></div></header><div class="pdf-overview"><div class="pdf-radar-wrap"><canvas id="pdfRadar" class="pdf-radar"></canvas></div><div class="pdf-score-panel"><h2>5つの傾向</h2>${Object.keys(traits).map(k=>`<div class="pdf-score-row"><span>${esc(traits[k])}</span><div><strong>${pct[k]}</strong><small>${pdfBand(pct[k])}</small></div></div>`).join('')}<p>数値は回答範囲を0〜100に換算したもので、偏差値や順位ではありません。高低は優劣ではなく、強みの出方と注意点の違いを示します。</p></div></div><div class="pdf-trait-grid">${Object.keys(traits).map(k=>pdfTraitCard(k,pct)).join('')}</div><footer class="pdf-footer"><span>本結果は医学的・心理学的診断ではありません。単独で適性や成功を決定するものではなく、経験・実績・価値観と合わせて面談で検討します。</span><strong>株式会社Kodama Corporation</strong></footer>`;
  document.body.appendChild(sheet);
  radar(sheet.querySelector('#pdfRadar'),pct);
}
renderResult=function(){baseRenderResultForPdf();const s=state.active;buildPortraitPdfSheet(s,score(s).pct)};
