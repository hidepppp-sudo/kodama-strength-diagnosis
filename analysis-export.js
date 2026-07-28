const showDetailBeforeAnalysisExport=typeof showDetail==='function'?showDetail:null;

function bigFiveAnswerLines(assessment){
  const answers=Array.isArray(assessment.bigfive)?assessment.bigfive:[];
  return Array.from({length:50},(_,index)=>{
    const value=answers[index];
    return `${index+1}:${Number.isInteger(value)?value:'-'}`;
  }).join(' ');
}

function aiContextLines(assessment){
  const profile=assessment.profile||{};
  const fields=[
    ['活動区分',profile.type],['事業内容',profile.business],['役職',profile.role]
  ];
  return fields.map(([label,value])=>`${label}：${value||'未入力'}`).join('\n');
}

function redactDirectIdentifiers(text,assessment){
  const profile=assessment.profile||{};
  const identifiers=[profile.name,profile.kana,profile.company,profile.contact]
    .map(value=>String(value||'').trim())
    .filter(value=>value.length>=2)
    .sort((a,b)=>b.length-a.length);
  return identifiers.reduce(
    (output,value)=>output.split(value).join('[直接識別情報を除外]'),
    text
  );
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
  const exportText=[
    '【Persona Core｜あなたの設計診断　匿名化回答データ】',
    '開発・運営：株式会社Kodama Corporation',
    `回答完了日時：${completedDate}`,
    '氏名・ふりがな・会社名・連絡先はAIへ渡さないため除外しています。',
    '',
    '【匿名化した基本情報】',
    aiContextLines(assessment),
    '',
    '【BIG5得点】',
    result?Object.keys(traits).map(key=>`${traits[key]}：${result[key]}`).join('\n'):'未完了のため得点は未確定',
    '',
    '【BIG5 回答番号（設問番号:回答番号）】',
    '回答番号：1=まったく当てはまらない／2=あまり当てはまらない／3=どちらともいえない／4=やや当てはまる／5=とても当てはまる',
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
    '【分析ルール】',
    '出力を「事実」「解釈」「面談仮説」の3層に明確に分けてください。事実は回答・得点・実績として確認できる内容だけ、解釈は複数回答から考えられる意味、面談仮説は面談で確認しなければ分からない内容として記述してください。',
    '総合サマリー、強みの明確度、自己認識の安定度、経験・実績の蓄積、商品化の準備度、顧客像の明確度、提供方法の明確度、発信・営業の障壁、消耗リスク、3層の一致点、食い違い・矛盾、強みの大枠仮説（最大3件）、現在の課題仮説（最大3件）、面談で確認する質問（最大10問）を整理してください。',
    '商品名、価格、適職、人生方針を断定しないでください。医学的・心理学的診断を行わず、本人の価値や成功可能性を決めつけないでください。'
  ].join('\n');
  return redactDirectIdentifiers(exportText,assessment);
}

function showExportFallback(text){
  document.querySelector('.analysis-export-dialog')?.remove();
  const dialog=document.createElement('section');
  dialog.className='card analysis-export-dialog';
  dialog.innerHTML='<div class="analysis-dialog-head"><div><div class="eyebrow">AI ANALYSIS EXPORT</div><h2>匿名化した回答データ</h2></div><button id="closeAnalysisExport" class="ghost" type="button">閉じる</button></div><p class="small">氏名・ふりがな・会社名・連絡先は除外済みです。下の文章を長押しして「すべて選択」→「コピー」してください。</p><textarea id="analysisExportArea" readonly></textarea>';
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
    button.textContent='匿名化データをコピーしました';
    setTimeout(()=>{button.textContent=original;button.disabled=false},2200);
  }catch(_){
    button.disabled=false;
    button.textContent=original;
    showExportFallback(text);
  }
}

if(showDetailBeforeAnalysisExport){
  showDetail=async function(id){
    await showDetailBeforeAnalysisExport(id);
    const actions=document.querySelector('#detail .detail-actions');
    if(!actions||document.getElementById('detailCopyAnalysis'))return;
    const button=document.createElement('button');
    button.type='button';
    button.id='detailCopyAnalysis';
    button.className='analysis-copy-button';
    button.textContent='匿名化データをコピー（AI分析用）';
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

