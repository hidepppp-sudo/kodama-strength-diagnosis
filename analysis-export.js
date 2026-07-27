const renderResultBeforeAnalysisExport=renderResult;
const showDetailBeforeAnalysisExport=typeof showDetail==='function'?showDetail:null;

function bigFiveAnswerLines(assessment){
  return questions.map((question,index)=>{
    const [trait,direction,text]=question;
    const value=assessment.bigfive&&assessment.bigfive[index];
    const label=Number.isInteger(value)?labels[value-1]:'未回答';
    const scoring=direction===-1?'逆転項目':'通常項目';
    return `${index+1}. [${traits[trait]}／${scoring}] ${text}\n回答：${value??'未回答'}（${label}）`;
  }).join('\n\n');
}

function profileLines(assessment){
  const profile=assessment.profile||{};
  const fields=[
    ['氏名',profile.name],['ふりがな',profile.kana],['活動区分',profile.type],
    ['会社名・屋号',profile.company],['事業内容',profile.business],['役職',profile.role],
    ['連絡先・表示名',profile.contact]
  ];
  return fields.map(([label,value])=>`${label}：${value||'未入力'}`).join('\n');
}

function currentAnswerLines(assessment){
  const current=assessment.current||{};
  const regular=currentQs.map(([key,question])=>`【${question}】\n${current[key]||'未入力'}`);
  const numbers=[
    ['現在の月商・年商',current.sales],['目標月商',current.target],
    ['現在の商品単価',current.price],['月に使える時間',current.time]
  ].map(([label,value])=>`【${label}】\n${value||'未入力'}`);
  return [...regular,...numbers].join('\n\n');
}

function analysisExportText(assessment){
  const bigFiveComplete=Array.isArray(assessment.bigfive)&&assessment.bigfive.length===50&&assessment.bigfive.every(Number.isInteger);
  const result=bigFiveComplete?score(assessment).pct:null;
  const assetLines=assetQs.map(([key,question])=>{
    const item=assessment.assets&&assessment.assets[key]||{};
    return `【${question}】\n回答状況：${item.kind||'未選択'}\n本人回答：${item.text||'未入力'}`;
  }).join('\n\n');
  const completedDate=assessment.completedAt?new Date(assessment.completedAt).toLocaleString('ja-JP'):'未完了';
  return [
    '【Persona Core｜あなたの設計診断　全回答データ】',
    '開発・運営：株式会社Kodama Corporation',
    `回答完了日時：${completedDate}`,
    '',
    '【基本情報】',
    profileLines(assessment),
    '',
    '【BIG5得点】',
    result?Object.keys(traits).map(key=>`${traits[key]}：${result[key]}`).join('\n'):'未完了のため得点は未確定',
    '',
    '【BIG5 50問の本人回答】',
    bigFiveAnswerLines(assessment),
    '',
    '【20答法】',
    (assessment.twenty||[]).map((value,index)=>`${index+1}. ${value||'未入力'}`).join('\n'),
    '',
    '【経験・実績・強みの棚卸し】',
    assetLines,
    '',
    '【現在の仕事・悩み・希望】',
    currentAnswerLines(assessment),
    '',
    '【分析時の注意】',
    '本人回答を根拠に、人間性、長所、弱点、内面の葛藤、抱えている悩み、強みの発揮条件、消耗条件、適した役割、商品化できる能力を統合分析してください。医学的・心理学的診断ではなく、仮説として扱ってください。'
  ].join('\n');
}

function showExportFallback(text){
  document.querySelector('.analysis-export-dialog')?.remove();
  const dialog=document.createElement('section');
  dialog.className='card analysis-export-dialog';
  dialog.innerHTML='<div class="analysis-dialog-head"><div><div class="eyebrow">AI ANALYSIS EXPORT</div><h2>全回答データ</h2></div><button id="closeAnalysisExport" class="ghost" type="button">閉じる</button></div><p class="small">下の文章を長押しして「すべて選択」→「コピー」してください。</p><textarea id="analysisExportArea" readonly></textarea>';
  dialog.querySelector('textarea').value=text;
  document.body.appendChild(dialog);
  const area=dialog.querySelector('textarea');
  area.focus();
  area.select();
  dialog.querySelector('#closeAnalysisExport').onclick=()=>dialog.remove();
}

async function copyAnalysisText(text,button){
  const original=button.textContent;
  button.disabled=true;
  try{
    if(navigator.clipboard&&window.isSecureContext){
      await navigator.clipboard.writeText(text);
    }else{
      const area=document.createElement('textarea');
      area.value=text;
      area.setAttribute('readonly','');
      area.style.position='fixed';
      area.style.opacity='0';
      document.body.appendChild(area);
      area.select();
      if(!document.execCommand('copy'))throw new Error('copy failed');
      area.remove();
    }
    button.textContent='全回答をコピーしました';
    setTimeout(()=>{button.textContent=original;button.disabled=false},2200);
  }catch(_){
    button.disabled=false;
    button.textContent=original;
    showExportFallback(text);
  }
}

renderResult=function(){
  renderResultBeforeAnalysisExport();
  const actions=document.querySelector('#report .actions.no-print');
  if(!actions||document.getElementById('copyAnalysisData'))return;
  const button=document.createElement('button');
  button.type='button';
  button.id='copyAnalysisData';
  button.className='secondary analysis-copy-button';
  button.textContent='全回答をコピー（AI分析用）';
  button.onclick=()=>copyAnalysisText(analysisExportText(state.active),button);
  actions.insertBefore(button,actions.firstChild);
};

if(showDetailBeforeAnalysisExport){
  showDetail=async function(id){
    await showDetailBeforeAnalysisExport(id);
    const actions=document.querySelector('#detail .detail-actions');
    if(!actions||document.getElementById('detailCopyAnalysis'))return;
    const button=document.createElement('button');
    button.type='button';
    button.id='detailCopyAnalysis';
    button.className='analysis-copy-button';
    button.textContent='全回答をコピー（AI分析用）';
    button.onclick=async()=>{
      const original=button.textContent;
      button.disabled=true;
      button.textContent='回答データを取得中…';
      try{
        const row=await cloudRpc('admin_get_assessment',{p_token:adminToken,p_id:id});
        if(!row)throw new Error('回答データを取得できませんでした。');
        const assessment=normalizeActive(row.response_data||blank());
        button.disabled=false;
        button.textContent=original;
        await copyAnalysisText(analysisExportText(assessment),button);
      }catch(error){
        button.disabled=false;
        button.textContent=original;
        alert(error.message||'回答データをコピーできませんでした。');
      }
    };
    actions.insertBefore(button,actions.firstChild);
  };
}
