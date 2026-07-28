function score(s){const raw={E:0,A:0,C:0,S:0,I:0};questions.forEach((q,i)=>raw[q[0]]+=q[1]===1?s.bigfive[i]:6-s.bigfive[i]);const pct={};Object.keys(raw).forEach(k=>pct[k]=Math.round((raw[k]-10)/40*100));return{raw,pct}}
function radar(canvas,pct){const ctx=canvas.getContext('2d'),dpr=devicePixelRatio||1,w=520,h=430;canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width='100%';ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);const cx=w/2,cy=h/2+10,R=145,keys=['E','A','C','S','I'];ctx.font='14px sans-serif';ctx.textAlign='center';for(let ring=1;ring<=5;ring++){ctx.beginPath();keys.forEach((k,i)=>{const a=-Math.PI/2+i*2*Math.PI/5,r=R*ring/5,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.strokeStyle='#dbe2ea';ctx.stroke()}keys.forEach((k,i)=>{const a=-Math.PI/2+i*2*Math.PI/5,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(x,y);ctx.strokeStyle='#e2e8f0';ctx.stroke();const lx=cx+Math.cos(a)*(R+45),ly=cy+Math.sin(a)*(R+30);ctx.fillStyle='#1e293b';ctx.fillText(traits[k],lx,ly);ctx.fillStyle='#132238';ctx.font='bold 15px sans-serif';ctx.fillText(String(pct[k]),lx,ly+18);ctx.font='14px sans-serif'});ctx.beginPath();keys.forEach((k,i)=>{const a=-Math.PI/2+i*2*Math.PI/5,r=R*pct[k]/100,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fillStyle='rgba(19,34,56,.16)';ctx.fill();ctx.strokeStyle='#132238';ctx.lineWidth=3;ctx.stroke()}
function renderResult(){const s=state.active,{pct}=score(s);app.innerHTML=`<section id="report" class="card"><div class="eyebrow">BIG FIVE RESULT</div><h1>${esc(s.profile.name)}さんの性格傾向</h1><p class="small">診断日：${new Date(s.completedAt).toLocaleDateString('ja-JP')}</p><div class="result-grid"><canvas id="radar"></canvas><div class="score-list">${Object.keys(traits).map(k=>`<div class="score-item"><div><b>${traits[k]}</b><div class="small">回答範囲を0〜100に換算</div></div><div class="score-num">${pct[k]}</div></div>`).join('')}</div></div><div class="notice">この数値は偏差値や他者との順位ではありません。高い・低いは優劣を意味せず、傾向の表れ方を示します。</div>${Object.keys(traits).map(k=>`<h3>${traits[k]} <span class="pill">${pct[k]}</span></h3><p>${desc[k]}</p>`).join('')}<div class="notice"><b>次の段階</b><br>自己認識と経験・実績を掛け合わせた強みや商品設計の検討は、小玉英明との面談で行います。</div><p class="small">本結果は医学的・心理学的診断ではありません。50項目はGoldbergのBig-Five factor markersを表現するIPIP項目を基礎としています。日本語表現は本MVP用の暫定訳です。</p><div class="actions no-print"><button class="secondary" id="png">画像を保存</button><div class="right"><button class="secondary" id="print">PDFを保存</button></div></div></section>`;radar(document.getElementById('radar'),pct);document.getElementById('print').onclick=()=>downloadPdfResult(s,pct);document.getElementById('png').onclick=()=>downloadImage(pct)}
function canvasToBlob(canvas,type,quality){
  const dataUrl=canvas.toDataURL(type,quality),binary=atob(dataUrl.split(',')[1]),bytes=new Uint8Array(binary.length);
  for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);
  return new Blob([bytes],{type});
}
function isAppleMobile(){return/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
async function saveGeneratedFile(blob,filename,title){
  const file=new File([blob],filename,{type:blob.type});
  if(isAppleMobile()&&navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title});return true}catch(error){if(error&&error.name==='AbortError')return false}
  }
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=filename;link.rel='noopener';link.style.display='none';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  return true;
}
async function runSaveButton(button,workingText,saveAction){
  const original=button.textContent;button.disabled=true;button.textContent=workingText;
  try{const saved=await saveAction();button.textContent=saved===false?'保存を中止しました':'保存を開始しました'}
  catch(error){console.error(error);button.textContent='保存できませんでした';alert('保存できませんでした。通信状態を確認して、もう一度お試しください。')}
  finally{setTimeout(()=>{button.disabled=false;button.textContent=original},1800)}
}
async function downloadImage(pct){
  const button=document.getElementById('png');
  return runSaveButton(button,'画像を作成中…',()=>{
    const c=document.createElement('canvas');c.width=1080;c.height=1500;const x=c.getContext('2d');
    x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.fillStyle='#132238';x.font='700 44px sans-serif';x.fillText('Persona Core｜あなたの設計診断',70,90);x.font='28px sans-serif';x.fillText('Big Five 性格傾向',70,140);
    const rc=document.createElement('canvas');radar(rc,pct);x.drawImage(rc,120,210,840,695);
    x.font='700 30px sans-serif';Object.keys(traits).forEach((k,i)=>x.fillText(`${traits[k]}  ${pct[k]}`,110,970+i*72));
    x.font='22px sans-serif';x.fillStyle='#64748b';x.fillText('高い・低いは優劣を意味しません。',70,1370);x.fillText('開発・運営：株式会社Kodama Corporation',70,1420);
    const blob=canvasToBlob(c,'image/png');
    return saveGeneratedFile(blob,'persona-core-bigfive.png','Persona Core 性格傾向');
  });
}

function adminLogin(){
  if(location.pathname.endsWith('/admin.html')){location.hash='admin';render();return}
  location.href='admin.html#admin';
}
function renderAdminLogin(){app.innerHTML='<section class="card" style="max-width:560px;margin:40px auto"><div class="eyebrow">ADMINISTRATION</div><h1>管理者ログイン</h1><p>管理者パスワードを入力してください。</p><label for="adminPassword">パスワード</label><input id="adminPassword" type="password" autocomplete="current-password"><p id="adminError" class="small" style="color:var(--danger);min-height:1.7em"></p><div class="actions"><button class="secondary" id="adminBack">顧客画面へ戻る</button><button id="loginAdmin">ログイン</button></div></section>';const input=document.getElementById('adminPassword'),login=document.getElementById('loginAdmin'),error=document.getElementById('adminError'),submit=async()=>{login.disabled=true;error.textContent='確認中…';try{const token=await cloudRpc('admin_login',{p_password:input.value});if(!token)throw new Error('パスワードが違います。');adminToken=token;adminAuthorized=true;sessionStorage.setItem(ADMIN_KEY,token);await renderAdmin()}catch(e){error.textContent=e.message||'ログインできませんでした。';input.focus()}finally{login.disabled=false}};login.onclick=submit;input.onkeydown=e=>{if(e.key==='Enter')submit()};document.getElementById('adminBack').onclick=()=>{location.hash='';render()};input.focus()}
function aiSummary(s){const {pct}=score(s),top=Object.keys(pct).sort((a,b)=>pct[b]-pct[a]).slice(0,2),texts=s.twenty.filter(Boolean).join(' '),assets=Object.values(s.assets).map(v=>v.text||'').join(' ');return{summary:`${traits[top[0]]}と${traits[top[1]]}が相対的に表れています。自己認識と経験の回答を照合し、これらが実際の成果や継続意欲と一致するかを面談で確認する価値があります。`,stage:assets.length>300?'仮説段階':'発掘段階',points:[`「${texts.slice(0,32)||'自己認識'}」に関連する記述の背景,`,`${traits[top[0]]}が成果として表れた具体的場面`,'得意だが消耗する活動と、自然に続けられる活動の違い'],questions:['最も自然に成果を出せた場面では、何をしていましたか？','人から評価されたことのうち、自分では普通だと思っていることは何ですか？','成果は出せるが、今後は続けたくないことは何ですか？','どのような相手を支援したとき、疲労より充実感が残りますか？']}}
async function renderAdminLegacy(){app.innerHTML='<section class="card"><div class="eyebrow">ADMINISTRATION</div><h1>Kodama Corporation 管理画面</h1><p>顧客一覧を読み込んでいます。</p></section>';try{const clients=await cloudRpc('admin_list_assessments',{p_token:adminToken});app.innerHTML=`<section class="card"><div class="eyebrow">ADMINISTRATION</div><h1>Kodama Corporation 管理画面</h1><div class="actions no-print"><button class="secondary" id="logoutAdmin">ログアウト</button><div class="right"><button id="issue">新しい診断を発行</button></div></div></section><section id="issued"></section><section class="card"><h2>顧客一覧</h2>${clients.length?`<div style="overflow:auto"><table class="admin-table"><thead><tr><th>顧客</th><th>会社・区分</th><th>事業内容</th><th>状態</th><th></th></tr></thead><tbody>${clients.map(c=>{const p=c.profile||{};return`<tr><td><b>${esc(p.name||`未入力顧客 #${c.client_number}`)}</b><br><span class="small">${new Date(c.created_at).toLocaleDateString('ja-JP')}</span></td><td>${esc(p.company||p.type||'—')}</td><td>${esc(p.business||'—')}</td><td class="status">${esc(c.status==='completed'?'回答完了':c.status==='in_progress'?'回答途中':'未入力')}</td><td><button class="ghost view" data-id="${esc(c.id)}">詳細</button></td></tr>`}).join('')}</tbody></table></div>`:'<p>発行済みの診断はまだありません。</p>'}</section><section id="detail"></section>`;document.getElementById('logoutAdmin').onclick=adminLogout;document.getElementById('issue').onclick=issueAssessment;document.querySelectorAll('.view').forEach(b=>b.onclick=()=>showDetail(b.dataset.id))}catch(e){adminSessionFailed(e)}}
async function issueAssessmentLegacy(){const issueButton=document.getElementById('issue');issueButton.disabled=true;try{const token=await cloudRpc('admin_issue_assessment',{p_token:adminToken});if(!token)throw new Error('発行できませんでした。');const url=customerUrl(token);const issued=document.getElementById('issued');issued.innerHTML=`<section class="card issued-card"><div class="eyebrow">専用URLを発行しました</div><h2>このURLを顧客へ送ってください</h2><input id="issuedUrl" readonly value="${esc(url)}"><div class="actions"><a class="button-link" href="${esc(url)}" target="_blank" rel="noopener">回答画面を確認</a><button id="copyUrl">URLをコピー</button></div></section>`;document.getElementById('copyUrl').onclick=async e=>{await navigator.clipboard.writeText(url);e.currentTarget.textContent='コピーしました'};setTimeout(()=>renderAdmin(),1200)}catch(e){alert(e.message)}finally{issueButton.disabled=false}}
async function refreshAdminList(){setTimeout(()=>renderAdmin(),800)}
async function showDetailLegacy(id){const d=document.getElementById('detail');d.innerHTML='<section class="card"><p>詳細を読み込んでいます。</p></section>';try{const row=await cloudRpc('admin_get_assessment',{p_token:adminToken,p_id:id});if(!row)return alert('データを取得できませんでした。');const c=normalizeActive(row.response_data||blank());const completed=row.status==='completed'&&c.bigfive.every(v=>Number.isInteger(v));const a=completed?aiSummary(c):null;const pct=completed?score(c).pct:null;d.innerHTML=`<section class="card"><h2>${esc(c.profile.name||`未入力顧客 #${row.client_number}`)}｜面談前アセスメント</h2><div class="grid2"><div><b>会社・屋号</b><p>${esc(c.profile.company||'—')}</p></div><div><b>事業内容</b><p>${esc(c.profile.business||'—')}</p></div></div>${completed?`<h3>大枠サマリー</h3><div class="notice">${esc(a.summary)}</div><p><b>商品化の現在地：</b>${esc(a.stage)}</p><h3>Big Five</h3><p>${Object.keys(pct).map(k=>`${traits[k]} ${pct[k]}`).join(' ／ ')}</p><h3>20答法・自己認識</h3><ol>${c.twenty.filter(Boolean).map(v=>`<li>${esc(v)}</li>`).join('')}</ol><h3>経験・実績の素材</h3>${assetQs.map(([k,q])=>`<details><summary>${esc(q)}</summary><p>${esc(c.assets[k]?.text||'未入力')}</p></details>`).join('')}<h3>注目ポイント</h3><ul>${a.points.map(v=>`<li>${esc(v)}</li>`).join('')}</ul><h3>面談で確認する質問候補</h3><ol>${a.questions.map(v=>`<li>${esc(v)}</li>`).join('')}</ol>`:'<div class="notice">この顧客はまだ回答を完了していません。</div>'}<h3>面談後の小玉所見</h3><textarea id="kodamaNote" placeholder="核となる強み、発揮条件、消耗条件、顧客候補、商品の方向性、次の行動を記録">${esc(row.admin_note||'')}</textarea><button id="saveNote">所見を保存</button></section>`;const saveButton=document.getElementById('saveNote'),note=document.getElementById('kodamaNote');saveButton.onclick=async()=>{saveButton.disabled=true;try{await cloudRpc('admin_save_note',{p_token:adminToken,p_id:id,p_note:note.value});saveButton.textContent='保存しました'}catch(e){alert(e.message)}finally{saveButton.disabled=false}}}catch(e){adminSessionFailed(e)}}
async function adminLogout(){try{await cloudRpc('admin_logout',{p_token:adminToken})}catch(_){}adminToken='';adminAuthorized=false;sessionStorage.removeItem(ADMIN_KEY);renderAdminLogin()}
function adminSessionFailed(e){
  const message=String(e&&e.message||e||'');
  if(/session|token|権限|invalid|unauthorized|not authorized|forbidden|expired|jwt/i.test(message)){
    adminToken='';
    adminAuthorized=false;
    sessionStorage.removeItem(ADMIN_KEY);
    renderAdminLogin();
    const error=document.getElementById('adminError');
    if(error)error.textContent='ログインの有効期限が切れました。管理者パスワードを再入力してください。';
    return;
  }
  app.innerHTML=`<section class="card"><h1>管理画面を読み込めませんでした</h1><p>${esc(message)}</p><button onclick="location.reload()">再読み込み</button></section>`;
}

var adminClientsCache=[];
var lastIssuedUrl='';

function adminStatusLabel(status){
  return status==='completed'?'回答完了':status==='in_progress'?'回答途中':'未入力';
}

function adminDisplayName(client){
  const profile=client.profile||{};
  return profile.name||`未入力顧客 #${client.client_number}`;
}

function adminIssuedCard(){
  if(!lastIssuedUrl)return '';
  return `<section class="card issued-card" id="issuedCard">
    <div class="eyebrow">新しい回答URLを発行しました</div>
    <h2>このURLを顧客へ送ってください</h2>
    <p class="small">URLを受け取った方は、同じURLから途中回答を再開できます。</p>
    <div class="url-box">
      <input id="issuedUrl" readonly value="${esc(lastIssuedUrl)}" aria-label="発行した回答URL">
      <button id="copyIssuedUrl">URLをコピー</button>
    </div>
    <div class="actions">
      <a class="button-link secondary" href="${esc(lastIssuedUrl)}" target="_blank" rel="noopener">回答画面を確認</a>
      <button class="ghost" id="closeIssued">閉じる</button>
    </div>
  </section>`;
}

function adminRow(client){
  const profile=client.profile||{};
  const name=adminDisplayName(client);
  const url=customerUrl(client.access_token);
  const statusGroup=['completed','in_progress'].includes(client.status)?client.status:'pending';
  const searchable=[name,profile.company,profile.type,profile.business,adminStatusLabel(client.status)]
    .filter(Boolean).join(' ').toLowerCase();
  return `<tr data-status="${esc(statusGroup)}" data-search="${esc(searchable)}">
    <td><b>${esc(name)}</b><br><span class="small">#${esc(client.client_number)}・${new Date(client.created_at).toLocaleDateString('ja-JP')}</span></td>
    <td>${esc(profile.company||profile.type||'—')}</td>
    <td>${esc(profile.business||'—')}</td>
    <td><span class="status-badge status-${esc(statusGroup)}">${esc(adminStatusLabel(client.status))}</span></td>
    <td>
      <div class="row-actions">
        <button class="ghost copy-client-url" data-url="${esc(url)}">URLコピー</button>
        <a class="button-link ghost" href="${esc(url)}" target="_blank" rel="noopener">開く</a>
        <button class="ghost view" data-id="${esc(client.id)}">詳細</button>
        <button class="danger-button delete-client" data-id="${esc(client.id)}" data-name="${esc(name)}">削除</button>
      </div>
    </td>
  </tr>`;
}

async function copyAdminUrl(url,button){
  try{
    await navigator.clipboard.writeText(url);
    const original=button.textContent;
    button.textContent='コピー済み';
    setTimeout(()=>button.textContent=original,1600);
  }catch(_){
    window.prompt('このURLをコピーしてください',url);
  }
}

function filterAdminRows(){
  const query=(document.getElementById('adminSearch')?.value||'').trim().toLowerCase();
  const status=document.getElementById('adminStatusFilter')?.value||'all';
  let visible=0;
  document.querySelectorAll('#adminRows tr').forEach(row=>{
    const matchesText=!query||(row.dataset.search||'').includes(query);
    const matchesStatus=status==='all'||row.dataset.status===status;
    row.hidden=!(matchesText&&matchesStatus);
    if(!row.hidden)visible++;
  });
  const count=document.getElementById('visibleCount');
  if(count)count.textContent=`${visible}件を表示`;
}

async function renderAdmin(){
  app.innerHTML='<section class="card"><div class="eyebrow">ADMINISTRATION</div><h1>Kodama Corporation 管理画面</h1><p>顧客データを読み込んでいます。</p></section>';
  try{
    const clients=await cloudRpc('admin_list_assessments',{p_token:adminToken});
    adminClientsCache=Array.isArray(clients)?clients:[];
    const counts={
      all:adminClientsCache.length,
      completed:adminClientsCache.filter(c=>c.status==='completed').length,
      in_progress:adminClientsCache.filter(c=>c.status==='in_progress').length,
      pending:adminClientsCache.filter(c=>!['completed','in_progress'].includes(c.status)).length
    };
    app.innerHTML=`<section class="card admin-hero">
      <div>
        <div class="eyebrow">ADMINISTRATION</div>
        <h1>Kodama Corporation 管理画面</h1>
        <p class="small">回答URLの発行、顧客データの確認・削除、面談所見の管理ができます。</p>
      </div>
      <div class="admin-primary-actions no-print">
        <button class="secondary" id="logoutAdmin">ログアウト</button>
        <button id="issue">＋ 新しい回答URLを発行</button>
      </div>
    </section>
    <section id="issued">${adminIssuedCard()}</section>
    <section class="admin-stats" aria-label="回答状況">
      <div class="stat-card"><span>すべて</span><strong>${counts.all}</strong></div>
      <div class="stat-card"><span>回答完了</span><strong>${counts.completed}</strong></div>
      <div class="stat-card"><span>回答途中</span><strong>${counts.in_progress}</strong></div>
      <div class="stat-card"><span>未入力</span><strong>${counts.pending}</strong></div>
    </section>
    <section class="card">
      <div class="admin-list-head">
        <div><h2>顧客・回答一覧</h2><p id="visibleCount" class="small">${counts.all}件を表示</p></div>
        <div class="admin-filters no-print">
          <label class="sr-only" for="adminSearch">顧客を検索</label>
          <input id="adminSearch" type="search" placeholder="氏名・会社名・事業内容で検索">
          <label class="sr-only" for="adminStatusFilter">状態で絞り込み</label>
          <select id="adminStatusFilter">
            <option value="all">すべての状態</option>
            <option value="completed">回答完了</option>
            <option value="in_progress">回答途中</option>
            <option value="pending">未入力</option>
          </select>
        </div>
      </div>
      ${adminClientsCache.length?`<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>顧客</th><th>会社・区分</th><th>事業内容</th><th>状態</th><th>操作</th></tr></thead>
        <tbody id="adminRows">${adminClientsCache.map(adminRow).join('')}</tbody>
      </table></div>`:'<div class="admin-empty"><h3>回答URLはまだありません</h3><p>「新しい回答URLを発行」から最初のURLを作成してください。</p></div>'}
    </section>
    <section id="detail"></section>`;

    document.getElementById('logoutAdmin').onclick=adminLogout;
    document.getElementById('issue').onclick=issueAssessment;
    document.getElementById('adminSearch')?.addEventListener('input',filterAdminRows);
    document.getElementById('adminStatusFilter')?.addEventListener('change',filterAdminRows);
    document.querySelectorAll('.copy-client-url').forEach(button=>{
      button.onclick=()=>copyAdminUrl(button.dataset.url,button);
    });
    document.querySelectorAll('.view').forEach(button=>{
      button.onclick=()=>showDetail(button.dataset.id);
    });
    document.querySelectorAll('.delete-client').forEach(button=>{
      button.onclick=()=>deleteAssessment(button.dataset.id,button.dataset.name);
    });
    const copyIssued=document.getElementById('copyIssuedUrl');
    if(copyIssued)copyIssued.onclick=()=>copyAdminUrl(lastIssuedUrl,copyIssued);
    const closeIssued=document.getElementById('closeIssued');
    if(closeIssued)closeIssued.onclick=()=>{lastIssuedUrl='';document.getElementById('issued').innerHTML=''};
  }catch(e){
    adminSessionFailed(e);
  }
}

async function issueAssessment(){
  const button=document.getElementById('issue');
  button.disabled=true;
  button.textContent='発行中…';
  try{
    const token=await cloudRpc('admin_issue_assessment',{p_token:adminToken});
    if(!token)throw new Error('回答URLを発行できませんでした。');
    lastIssuedUrl=customerUrl(token);
    await renderAdmin();
    document.getElementById('issuedCard')?.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){
    adminSessionFailed(e);
  }finally{
    if(document.body.contains(button)){
      button.disabled=false;
      button.textContent='＋ 新しい回答URLを発行';
    }
  }
}

async function deleteAssessment(id,name){
  const confirmed=window.confirm(`「${name}」の回答を完全に削除します。\n\n入力内容・診断結果・管理者メモは元に戻せません。削除してよろしいですか？`);
  if(!confirmed)return;
  try{
    const deleted=await cloudRpc('admin_delete_assessment',{p_token:adminToken,p_id:id});
    if(!deleted)throw new Error('対象の回答が見つかりませんでした。');
    const detail=document.getElementById('detail');
    if(detail)detail.innerHTML='';
    await renderAdmin();
  }catch(e){
    adminSessionFailed(e);
  }
}

async function showDetail(id){
  const detail=document.getElementById('detail');
  detail.innerHTML='<section class="card"><p>詳細を読み込んでいます。</p></section>';
  detail.scrollIntoView({behavior:'smooth',block:'start'});
  try{
    const row=await cloudRpc('admin_get_assessment',{p_token:adminToken,p_id:id});
    if(!row)throw new Error('データを取得できませんでした。');
    const client=normalizeActive(row.response_data||blank());
    const completed=row.status==='completed'&&client.bigfive.every(v=>Number.isInteger(v));
    const summary=completed?aiSummary(client):null;
    const pct=completed?score(client).pct:null;
    const name=client.profile.name||`未入力顧客 #${row.client_number}`;
    const url=customerUrl(row.access_token);
    detail.innerHTML=`<section class="card detail-card">
      <div class="detail-head">
        <div><div class="eyebrow">CUSTOMER DETAIL</div><h2>${esc(name)}</h2></div>
        <button class="ghost" id="closeDetail">閉じる</button>
      </div>
      <div class="detail-actions no-print">
        <button class="ghost" id="detailCopyUrl">回答URLをコピー</button>
        <a class="button-link ghost" href="${esc(url)}" target="_blank" rel="noopener">回答画面を開く</a>
        <button class="danger-button" id="detailDelete">この回答を削除</button>
      </div>
      <div class="grid2">
        <div><b>会社・屋号</b><p>${esc(client.profile.company||'—')}</p></div>
        <div><b>事業内容</b><p>${esc(client.profile.business||'—')}</p></div>
      </div>
      ${completed?`<h3>面談前の簡易整理（AI分析ではありません）</h3><div class="notice"><b>面談仮説：</b>${esc(summary.summary)}</div>
        <p><b>商品化の現在地（暫定）：</b>${esc(summary.stage)}</p>
        <h3>Big Five</h3><p>${Object.keys(pct).map(k=>`${traits[k]} ${pct[k]}`).join(' ／ ')}</p>
        <h3>20答法・自己認識</h3><ol>${client.twenty.filter(Boolean).map(v=>`<li>${esc(v)}</li>`).join('')}</ol>
        <h3>経験・実績の素材</h3>${assetQs.map(([k,q])=>`<details><summary>${esc(q)}</summary><p>${esc(client.assets[k]?.text||'未入力')}</p></details>`).join('')}
        <h3>注目ポイント</h3><ul>${summary.points.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>
        <h3>面談で確認する質問候補</h3><ol>${summary.questions.map(v=>`<li>${esc(v)}</li>`).join('')}</ol>`
        :'<div class="notice">この顧客はまだ回答を完了していません。</div>'}
      <h3>面談後の小玉所見</h3>
      <textarea id="kodamaNote" placeholder="核となる強み、発揮条件、消耗条件、顧客候補、商品の方向性、次の行動を記録">${esc(row.admin_note||'')}</textarea>
      <div class="actions"><button id="saveNote">所見を保存</button></div>
    </section>`;
    const saveButton=document.getElementById('saveNote');
    const note=document.getElementById('kodamaNote');
    saveButton.onclick=async()=>{
      saveButton.disabled=true;
      try{
        await cloudRpc('admin_save_note',{p_token:adminToken,p_id:id,p_note:note.value});
        saveButton.textContent='保存しました';
      }catch(e){
        adminSessionFailed(e);
      }finally{
        saveButton.disabled=false;
      }
    };
    document.getElementById('detailCopyUrl').onclick=event=>copyAdminUrl(url,event.currentTarget);
    document.getElementById('detailDelete').onclick=()=>deleteAssessment(id,name);
    document.getElementById('closeDetail').onclick=()=>{detail.innerHTML='';window.scrollTo({top:0,behavior:'smooth'})};
  }catch(e){
    adminSessionFailed(e);
  }
}
initApp();

