const renderResultBeforeAnalysisExport=renderResult;

function analysisExportText(assessment){
  const result=score(assessment).pct;
  const assetLines=assetQs.map(([key,question])=>{
    const item=assessment.assets&&assessment.assets[key]||{};
    return `【${question}】\n選択：${item.kind||'未選択'}\n回答：${item.text||'未入力'}`;
  }).join('\n\n');
  const currentEntries=Object.entries(assessment.current||{}).filter(([,value])=>String(value||'').trim());
  return [
    '【株式会社Kodama Corporation｜強み・商品設計診断 分析用データ】',
    `氏名：${assessment.profile&&assessment.profile.name||''}`,
    `活動区分：${assessment.profile&&assessment.profile.type||''}`,
    `会社名・屋号：${assessment.profile&&assessment.profile.company||''}`,
    `事業内容：${assessment.profile&&assessment.profile.business||''}`,
    '',
    '【BIG5得点】',
    Object.keys(traits).map(key=>`${traits[key]}：${result[key]}`).join('\n'),
    '',
    '【20答法】',
    (assessment.twenty||[]).map((value,index)=>`${index+1}. ${value||'未入力'}`).join('\n'),
    '',
    '【経験・実績・強みの棚卸し】',
    assetLines,
    '',
    '【現在の仕事・悩み・希望】',
    currentEntries.length?currentEntries.map(([key,value])=>`${key}：${value}`).join('\n'):'未入力',
    '',
    '※本人回答をもとに分析してください。医学的・心理学的診断ではなく、仮説として扱ってください。'
  ].join('\n');
}

async function copyAnalysisExport(button){
  const text=analysisExportText(state.active);
  const original=button.textContent;
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
    button.textContent='コピーしました';
    setTimeout(()=>{button.textContent=original},2200);
  }catch(_){
    const dialog=document.createElement('section');
    dialog.className='card analysis-export-dialog';
    dialog.innerHTML='<h2>分析用データ</h2><p class="small">下の文章を長押しして「すべて選択」→「コピー」してください。</p><textarea id="analysisExportArea" readonly></textarea><div class="actions"><div></div><button id="closeAnalysisExport" type="button">閉じる</button></div>';
    dialog.querySelector('textarea').value=text;
    document.body.appendChild(dialog);
    dialog.querySelector('textarea').focus();
    dialog.querySelector('textarea').select();
    dialog.querySelector('#closeAnalysisExport').onclick=()=>dialog.remove();
  }
}

renderResult=function(){
  renderResultBeforeAnalysisExport();
  const actions=document.querySelector('#report .actions.no-print');
  if(!actions||document.getElementById('copyAnalysisData'))return;
  const button=document.createElement('button');
  button.type='button';
  button.id='copyAnalysisData';
  button.className='secondary';
  button.textContent='分析用データをコピー';
  button.onclick=()=>copyAnalysisExport(button);
  actions.insertBefore(button,actions.firstChild);
};
