const pdfTraitGuides={
  E:{summary:'人との交流、発言、行動開始、外部から刺激を得る傾向です。',high:'自分から声をかけ、場を動かし、発信を進めやすい。',low:'深く考え、聞き役になり、少人数で信頼を築きやすい。'},
  A:{summary:'共感、配慮、協力、対立への向き合い方に関係する傾向です。',high:'相手の感情をくみ取り、安心感と協力関係をつくりやすい。',low:'感情に流されず、条件交渉や客観的な判断を行いやすい。'},
  C:{summary:'計画性、整理、継続、責任、品質管理に表れやすい傾向です。',high:'準備、期限管理、品質維持、継続実行に強みが出やすい。',low:'状況に応じた変更、即興、試行錯誤に強みが出やすい。'},
  S:{summary:'ストレスや感情変化への反応、プレッシャー下の落ち着きに関係します。',high:'緊急時にも落ち着いて判断し、一定の対応を続けやすい。',low:'小さな変化やリスク、相手の不安や痛みに気づきやすい。'},
  I:{summary:'新しい考え、想像、学習、未知のものへの関心に関係する傾向です。',high:'新しい発想、企画、学習、複数分野の統合に強みが出やすい。',low:'実用性、分かりやすさ、再現できる手順を重視しやすい。'}
};

function pdfBand(value){if(value>=70)return'高め';if(value<=30)return'低め';return'中間'}
function pdfCurrentGuide(key,value){
  const guide=pdfTraitGuides[key];
  if(value>=70)return`高い側の特徴が表れやすい結果です。${guide.high}`;
  if(value<=30)return`低い側にも固有の強みがあります。${guide.low}`;
  return`状況や役割に応じて、高い側と低い側の特徴を使い分けやすい可能性があります。`;
}
function pdfRoundedRect(ctx,x,y,width,height,radius,fill,stroke){
  ctx.beginPath();ctx.roundRect(x,y,width,height,radius);
  if(fill){ctx.fillStyle=fill;ctx.fill()}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}
}
function pdfLines(ctx,text,maxWidth){
  const lines=[];let line='';
  for(const character of String(text||'')){
    if(character==='\n'){lines.push(line);line='';continue}
    const next=line+character;
    if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=character}else line=next;
  }
  if(line||!lines.length)lines.push(line);
  return lines;
}
function pdfDrawText(ctx,text,x,y,maxWidth,lineHeight,maxLines){
  const lines=pdfLines(ctx,text,maxWidth).slice(0,maxLines);
  lines.forEach((line,index)=>ctx.fillText(line,x,y+index*lineHeight));
  return y+lines.length*lineHeight;
}
function buildPdfCanvas(assessment,pct){
  const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;
  const ctx=canvas.getContext('2d');const keys=Object.keys(traits);
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.textBaseline='top';ctx.fillStyle='#132238';
  pdfRoundedRect(ctx,64,58,72,72,16,'#132238');
  ctx.fillStyle='#c6a15b';ctx.font='700 27px sans-serif';ctx.textAlign='center';ctx.fillText('KC',100,79);ctx.textAlign='left';
  ctx.fillStyle='#9a7739';ctx.font='700 18px sans-serif';ctx.fillText('PERSONA CORE',160,60);
  ctx.fillStyle='#132238';ctx.font='700 38px sans-serif';ctx.fillText('Big Five 性格傾向レポート',160,91);
  const completed=assessment.completedAt?new Date(assessment.completedAt):new Date();
  ctx.textAlign='right';ctx.font='700 21px sans-serif';ctx.fillText(assessment.profile?.name||'',1176,66);
  ctx.fillStyle='#64748b';ctx.font='18px sans-serif';ctx.fillText(`診断日：${completed.toLocaleDateString('ja-JP')}`,1176,101);ctx.textAlign='left';
  ctx.fillStyle='#c6a15b';ctx.fillRect(64,158,1112,3);

  pdfRoundedRect(ctx,64,193,670,500,22,'#f8fafc','#dbe2ea');
  const radarCanvas=document.createElement('canvas');radar(radarCanvas,pct);
  ctx.drawImage(radarCanvas,100,217,598,448);
  pdfRoundedRect(ctx,758,193,418,500,22,'#132238');
  ctx.fillStyle='#c6a15b';ctx.font='700 20px sans-serif';ctx.fillText('5つの傾向',792,226);
  keys.forEach((key,index)=>{
    const y=278+index*62;
    ctx.fillStyle='#ffffff';ctx.font='600 21px sans-serif';ctx.fillText(traits[key],792,y);
    ctx.textAlign='right';ctx.font='700 30px sans-serif';ctx.fillText(String(pct[key]),1124,y-6);
    ctx.textAlign='left';ctx.fillStyle='#cbd5e1';ctx.font='16px sans-serif';ctx.fillText(pdfBand(pct[key]),1065,y+29);
    if(index<keys.length-1){ctx.fillStyle='rgba(255,255,255,.14)';ctx.fillRect(792,y+49,332,1)}
  });
  ctx.fillStyle='#cbd5e1';ctx.font='16px sans-serif';
  pdfDrawText(ctx,'回答範囲を0〜100へ換算した表示値です。偏差値や順位ではなく、高低は優劣を意味しません。',792,608,332,24,3);

  const positions=[
    [64,727,541,218],[635,727,541,218],
    [64,969,541,218],[635,969,541,218],
    [64,1211,1112,218]
  ];
  keys.forEach((key,index)=>{
    const [x,y,w,h]=positions[index],value=pct[key],guide=pdfTraitGuides[key];
    pdfRoundedRect(ctx,x,y,w,h,18,'#ffffff','#dbe2ea');
    ctx.fillStyle='#132238';ctx.font='700 24px sans-serif';ctx.fillText(traits[key],x+26,y+22);
    ctx.textAlign='right';ctx.fillStyle='#9a7739';ctx.font='700 25px sans-serif';ctx.fillText(`${value}｜${pdfBand(value)}`,x+w-26,y+22);ctx.textAlign='left';
    ctx.fillStyle='#475569';ctx.font='17px sans-serif';
    let textY=pdfDrawText(ctx,guide.summary,x+26,y+68,w-52,27,3);
    ctx.fillStyle='#132238';ctx.font='600 17px sans-serif';ctx.fillText('今回の見方',x+26,textY+8);
    ctx.fillStyle='#475569';ctx.font='17px sans-serif';
    pdfDrawText(ctx,pdfCurrentGuide(key,value),x+26,textY+37,w-52,27,3);
  });

  pdfRoundedRect(ctx,64,1461,1112,112,18,'#f8fafc','#dbe2ea');
  ctx.fillStyle='#132238';ctx.font='700 18px sans-serif';ctx.fillText('結果の位置づけ',88,1484);
  ctx.fillStyle='#475569';ctx.font='16px sans-serif';
  pdfDrawText(ctx,'本結果は医学的・心理学的診断ではありません。性格だけで商品や適職を決めず、自己認識、経験・実績、現在の事業状況と合わせて、小玉英明との面談で意味を確認します。',88,1517,1064,25,2);
  ctx.fillStyle='#c6a15b';ctx.fillRect(64,1620,1112,2);
  ctx.fillStyle='#64748b';ctx.font='16px sans-serif';ctx.fillText('Persona Core｜あなたの設計診断',64,1647);
  ctx.textAlign='right';ctx.fillText('株式会社Kodama Corporation',1176,1647);ctx.textAlign='left';
  return canvas;
}
function pdfBytes(parts){
  const encoder=new TextEncoder(),chunks=[];let length=0;
  const push=value=>{const bytes=typeof value==='string'?encoder.encode(value):value;chunks.push(bytes);length+=bytes.byteLength};
  const offsets=[0];
  push('%PDF-1.4\n% Persona Core\n');
  offsets[1]=length;push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  offsets[2]=length;push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  offsets[3]=length;push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');
  offsets[4]=length;push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${parts.width} /Height ${parts.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${parts.jpeg.byteLength} >>\nstream\n`);push(parts.jpeg);push('\nendstream\nendobj\n');
  const content=encoder.encode('q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n');
  offsets[5]=length;push(`5 0 obj\n<< /Length ${content.byteLength} >>\nstream\n`);push(content);push('endstream\nendobj\n');
  const xref=length;push('xref\n0 6\n0000000000 65535 f \n');
  for(let index=1;index<=5;index++)push(`${String(offsets[index]).padStart(10,'0')} 00000 n \n`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks,{type:'application/pdf'});
}
function buildSinglePagePdf(assessment,pct){
  const canvas=buildPdfCanvas(assessment,pct);
  const dataUrl=canvas.toDataURL('image/jpeg',0.94),binary=atob(dataUrl.split(',')[1]),jpeg=new Uint8Array(binary.length);
  for(let index=0;index<binary.length;index++)jpeg[index]=binary.charCodeAt(index);
  return pdfBytes({jpeg,width:canvas.width,height:canvas.height});
}
async function downloadPdfResult(assessment,pct){
  const button=document.getElementById('print');
  return runSaveButton(button,'PDFを作成中…',()=>{
    const pdf=buildSinglePagePdf(assessment,pct);
    return saveGeneratedFile(pdf,'persona-core-report.pdf','Persona Core レポート');
  });
}

