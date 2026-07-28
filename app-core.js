const APP_KEY='kodama_strength_cloud_v1';
const ADMIN_KEY='kodama_admin_session_v1';
const customerToken=customerTokenFromUrl();
let cloudSaveTimer=null;
let cloudLoaded=false;
let state=load();
let adminToken=sessionStorage.getItem(ADMIN_KEY)||'';
let adminAuthorized=Boolean(adminToken);

function makeId(){try{if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID()}catch(e){}return'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12)}
function blank(){return{id:makeId(),createdAt:new Date().toISOString(),status:'未入力',step:0,profile:{},bigfive:Array(50).fill(null),twenty:Array(20).fill(''),assets:{},current:{},submitted:false}}
function normalizeActive(value){
  const a=value&&typeof value==='object'?value:blank();
  if(!Number.isInteger(a.step)||a.step<0||a.step>12)a.step=0;
  if(!Array.isArray(a.bigfive)||a.bigfive.length!==50)a.bigfive=Array(50).fill(null);
  if(!Array.isArray(a.twenty)||a.twenty.length!==20)a.twenty=Array(20).fill('');
  if(!a.profile||typeof a.profile!=='object')a.profile={};
  if(!a.assets||typeof a.assets!=='object')a.assets={};
  if(!a.current||typeof a.current!=='object')a.current={};
  return a;
}
function load(){
  try{
    const all=JSON.parse(localStorage.getItem(APP_KEY))||{};
    return{active:normalizeActive(customerToken&&all.tokens?all.tokens[customerToken]:all.active)};
  }catch(_){return{active:blank()}}
}
function saveLocal(){
  try{
    const all=JSON.parse(localStorage.getItem(APP_KEY))||{};
    all.tokens=all.tokens||{};
    if(customerToken)all.tokens[customerToken]=state.active;else all.active=state.active;
    localStorage.setItem(APP_KEY,JSON.stringify(all));
  }catch(e){console.warn('端末内保存を利用できません。',e)}
}
function save(){
  state.active.updatedAt=new Date().toISOString();
  saveLocal();
  if(!customerToken||!cloudLoaded||state.active.submitted)return;
  clearTimeout(cloudSaveTimer);
  setCloudState('保存中…');
  cloudSaveTimer=setTimeout(async()=>{
    try{
      const ok=await cloudRpc('save_assessment',{p_access_token:customerToken,p_payload:state.active});
      if(!ok)throw new Error('専用URLが無効です。');
      setCloudState('クラウド保存済み');
    }catch(e){setCloudState('保存できませんでした。再接続時に再試行します。',true)}
  },650);
}
function setCloudState(message,isError=false){
  const node=document.getElementById('cloudState');
  if(node){node.textContent=message;node.style.color=isError?'var(--danger)':''}
}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const app=document.getElementById('app');
const adminEntryButton=document.getElementById('adminBtn');
if(adminEntryButton)adminEntryButton.onclick=()=>adminLogin();
function el(tag,attrs={},html=''){const x=document.createElement(tag);Object.assign(x,attrs);x.innerHTML=html;return x}

async function initApp(){
  window.addEventListener('hashchange',render);
  window.addEventListener('online',()=>{
    if(customerToken&&cloudLoaded&&!state.active.submitted)save();
  });
  if(location.hash==='#admin')return render();
  if(!customerToken)return renderLinkRequired();
  app.innerHTML='<section class="card hero"><div class="eyebrow">SECURE CONNECTION</div><h1>診断データを読み込んでいます</h1><p>専用URLを確認しています。</p></section>';
  try{
    const remote=await cloudRpc('get_assessment',{p_access_token:customerToken});
    if(!remote)return renderInvalidLink();
    const localDraft=normalizeActive(state.active);
    const remotePayload=normalizeActive(remote.response_data||blank());
    const localUpdatedAt=Date.parse(localDraft.updatedAt||'')||0;
    const remoteUpdatedAt=Date.parse(remotePayload.updatedAt||'')||0;
    const useLocalDraft=remote.status!=='completed'&&!localDraft.submitted&&localUpdatedAt>remoteUpdatedAt;
    const payload=useLocalDraft?localDraft:remotePayload;
    payload.cloudId=remote.id;
    payload.clientNumber=remote.client_number;
    payload.submitted=remote.status==='completed';
    payload.status=payload.submitted?'回答完了':(remote.status==='in_progress'?'回答途中':'未入力');
    if(remote.completed_at)payload.completedAt=remote.completed_at;
    state.active=payload;
    cloudLoaded=true;
    saveLocal();
    render();
    if(useLocalDraft)save();
  }catch(e){
    app.innerHTML=`<section class="card"><h1>通信を確認してください</h1><p>診断データを読み込めませんでした。通信環境を確認して再読み込みしてください。</p><p class="small">${esc(e.message)}</p><button onclick="location.reload()">再読み込み</button></section>`;
  }
}
function renderLinkRequired(){
  app.innerHTML=`<section class="card hero"><div class="eyebrow">株式会社Kodama Corporation</div><h1>強み・商品設計診断</h1><p class="lead">この診断は、お一人ずつ発行される専用URLから回答します。</p><div class="notice">小玉英明または株式会社Kodama Corporationから届いた専用URLを開いてください。</div><div class="actions"><div></div><button id="openAdmin">管理者画面を開く</button></div></section>`;
  document.getElementById('openAdmin').onclick=()=>adminLogin();
}
function renderInvalidLink(){
  app.innerHTML='<section class="card hero"><div class="eyebrow">LINK ERROR</div><h1>この専用URLは利用できません</h1><p>URLが途中で切れていないか確認してください。解決しない場合は発行元へお問い合わせください。</p></section>';
}
function render(){
  try{
    saveLocal();
    const s=state.active;
    if(location.hash==='#admin')return adminAuthorized?renderAdmin():renderAdminLogin();
    if(!customerToken)return renderLinkRequired();
    if(s.submitted)return renderResult();
    const pages=[intro,profile,bigIntro,...Array.from({length:5},(_,i)=>()=>bigPage(i)),twentyIntro,twentyPage,assetsPage,currentPage,review];
    (pages[s.step]||intro)();
  }catch(error){
    console.error(error);
    app.innerHTML=`<section class="card"><div class="eyebrow">SYSTEM RECOVERY</div><h1>画面を再読み込みしてください</h1><p>入力内容は端末内にも保存されています。</p><pre class="small" style="white-space:pre-wrap">${esc(error&&error.message||error)}</pre><button onclick="location.reload()">再読み込み</button></section>`;
  }
}
function shell(title,body,progress=true){
  app.innerHTML='';
  const c=el('section',{className:'card'},`<div class="eyebrow">強み・商品設計診断</div><h2>${esc(title)}</h2><div id="cloudState" class="cloud-state">クラウド保存済み</div>${progress?`<div class="progress"><div style="width:${Math.min(100,state.active.step/11*100)}%"></div></div>`:''}`);
  c.append(body);app.append(c);
}
function nav(prev=true,next=true,nextText='次へ'){
  const d=el('div',{className:'actions no-print'});
  d.innerHTML=`<div>${prev?'<button class="secondary" id="prev">戻る</button>':''}</div><div class="right">${next?`<button id="next">${esc(nextText)}</button>`:''}</div>`;
  if(prev)d.querySelector('#prev').onclick=()=>{state.active.step--;save();render()};
  return d;
}
function intro(){
  app.innerHTML=`<section class="card hero"><div class="eyebrow">株式会社Kodama Corporation</div><h1>強み・商品設計診断</h1><p class="lead">性格傾向、自己認識、経験・実績を整理し、小玉英明との面談で、本人もまだ言語化できていない価値を見つけるための事前アセスメントです。</p><div class="notice"><b>このシステムだけで答えを決めるものではありません。</b><br>結果と回答内容は、商品設計面談のための資料として使用します。</div><p class="small">本サービスは医学的・心理学的な診断、治療、能力の優劣判定、成功の保証を目的とするものではありません。</p><label><input id="consent" type="checkbox" style="width:auto"> 説明を読み、回答情報の利用に同意します</label><div class="actions"><div></div><button id="start">回答を始める</button></div></section>`;
  document.getElementById('start').onclick=()=>{if(!document.getElementById('consent').checked)return alert('同意を確認してください。');state.active.consentAt=new Date().toISOString();state.active.step=1;save();render()}
}
function profile(){
  const p=state.active.profile,b=el('div');
  b.innerHTML=`<div class="grid2"><div><label>個人名 *</label><input id="name" value="${esc(p.name)}"></div><div><label>ふりがな</label><input id="kana" value="${esc(p.kana)}"></div><div><label>活動区分 *</label><select id="type"><option></option>${['法人経営者','個人事業主','副業・事業準備中','会社員','その他'].map(v=>`<option ${p.type===v?'selected':''}>${v}</option>`).join('')}</select></div><div><label>会社名・屋号</label><input id="company" value="${esc(p.company)}"></div></div><label>事業内容 *</label><textarea id="business">${esc(p.business)}</textarea><div class="grid2"><div><label>役職</label><input id="role" value="${esc(p.role)}"></div><div><label>LINE表示名またはメール</label><input id="contact" value="${esc(p.contact)}"></div></div>`;
  const n=nav(false);n.querySelector('#next').onclick=()=>{const value=id=>document.getElementById(id).value.trim();const q={name:value('name'),kana:value('kana'),type:document.getElementById('type').value,company:value('company'),business:value('business'),role:value('role'),contact:value('contact')};if(!q.name||!q.type||!q.business)return alert('必須項目を入力してください。');state.active.profile=q;state.active.status='回答途中';state.active.step++;save();render()};b.append(n);shell('基本情報',b)
}
function bigIntro(){
  const b=el('div');b.innerHTML='<p>Big Fiveは、普段の考え方や行動の傾向を5つの観点から確認するものです。良い・悪い、優れている・劣っているを判定するものではありません。</p><div class="notice"><b>精度を高める回答方法</b><ul><li>理想の自分ではなく、普段の自分で答える</li><li>直近の気分ではなく、過去2〜3年の傾向で考える</li><li>仕事だけでなく私生活も含める</li><li>考えすぎず、最初の感覚を大切にする</li><li>似た質問でも、前の回答に合わせない</li></ul></div><p>各文章が自分にどの程度当てはまるか、5段階で回答してください。</p>';const n=nav();n.querySelector('#next').onclick=()=>{state.active.step++;save();render()};b.append(n);shell('Big Five性格傾向チェックについて',b)
}
function bigPage(page){
  const start=page*10,b=el('div');b.innerHTML=`<div class="notice">理想ではなく、過去2〜3年の普段の自分を基準にお答えください。</div><div class="small">${start+1}〜${start+10} / 50問</div>`;
  questions.slice(start,start+10).forEach((q,idx)=>{const i=start+idx,d=el('div',{className:'question'},`<div class="qtext">${i+1}. ${esc(q[2])}</div><div class="scale">${labels.map((l,v)=>`<label><input type="radio" name="q${i}" value="${v+1}" ${state.active.bigfive[i]===v+1?'checked':''}>${v+1}. ${l}</label>`).join('')}</div>`);d.onchange=e=>{state.active.bigfive[i]=+e.target.value;save()};b.append(d)});
  const n=nav();n.querySelector('#next').onclick=()=>{if(state.active.bigfive.slice(start,start+10).some(v=>v===null))return alert('10問すべてに回答してください。');state.active.step++;save();render()};b.append(n);shell('Big Five性格傾向チェック',b)
}

