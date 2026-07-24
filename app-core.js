const APP_KEY='kodama_strength_live_v1';

let state=load();
function makeId(){try{if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID()}catch(e){}return 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12)}
function blank(){return {id:makeId(),createdAt:new Date().toISOString(),status:'未入力',step:0,profile:{},bigfive:Array(50).fill(null),twenty:Array(20).fill(''),assets:{},current:{},submitted:false};}
function normalizeState(value){
  const base={active:blank(),clients:[]};
  if(!value||typeof value!=='object')return base;
  if(!value.active||typeof value.active!=='object')value.active=blank();
  const a=value.active;
  if(!Number.isInteger(a.step)||a.step<0||a.step>12)a.step=0;
  if(!Array.isArray(a.bigfive)||a.bigfive.length!==50)a.bigfive=Array(50).fill(null);
  if(!Array.isArray(a.twenty)||a.twenty.length!==20)a.twenty=Array(20).fill('');
  if(!a.profile||typeof a.profile!=='object')a.profile={};
  if(!a.assets||typeof a.assets!=='object')a.assets={};
  if(!a.current||typeof a.current!=='object')a.current={};
  if(!Array.isArray(value.clients))value.clients=[];
  return value;
}
function load(){try{return normalizeState(JSON.parse(localStorage.getItem(APP_KEY)))}catch(e){return normalizeState(null)}}
function save(){try{localStorage.setItem(APP_KEY,JSON.stringify(state))}catch(e){console.warn('端末内保存を利用できないため、この画面を閉じるまで一時保存します。',e)}}
const app=document.getElementById('app'); document.getElementById('adminBtn').onclick=()=>adminLogin();
function el(tag,attrs={},html=''){const x=document.createElement(tag);Object.assign(x,attrs);x.innerHTML=html;return x}
function render(){
  try{
    save();
    const s=state.active;
    if(location.hash==='#admin')return renderAdmin();
    if(s.submitted)return renderResult();
    const pages=[intro,profile,bigIntro,...Array.from({length:5},(_,i)=>()=>bigPage(i)),twentyIntro,twentyPage,assetsPage,currentPage,review];
    const page=pages[s.step]||intro;
    page();
  }catch(error){
    console.error(error);
    app.innerHTML=`<section class="card"><div class="eyebrow">SYSTEM RECOVERY</div><h1>画面を再読み込みしてください</h1><p>保存データの不整合が発生しました。下のボタンで診断を安全にリセットできます。</p><pre class="small" style="white-space:pre-wrap">${String(error&&error.message||error)}</pre><button id="hardReset">診断をリセットする</button></section>`;
    const btn=document.getElementById('hardReset');
    if(btn)btn.onclick=()=>{try{localStorage.removeItem(APP_KEY)}catch(e){} state={active:blank(),clients:[]}; location.hash=''; render();};
  }
}
function shell(title,body,progress=true){app.innerHTML='';const c=el('section',{className:'card'},`<div class="eyebrow">強み・商品設計診断</div><h2>${title}</h2>${progress?`<div class="progress"><div style="width:${Math.min(100,state.active.step/11*100)}%"></div></div>`:''}`);c.append(body);app.append(c)}
function nav(prev=true,next=true,nextText='次へ'){const d=el('div',{className:'actions no-print'});d.innerHTML=`<div>${prev?'<button class="secondary" id="prev">戻る</button>':''}</div><div class="right">${next?`<button id="next">${nextText}</button>`:''}</div>`;if(prev)d.querySelector('#prev').onclick=()=>{state.active.step--;render()};return d}
function intro(){app.innerHTML=`<section class="card hero"><div class="eyebrow">株式会社Kodama Corporation</div><h1>強み・商品設計診断</h1><p class="lead">性格傾向、自己認識、経験・実績を整理し、小玉英明との面談で、本人もまだ言語化できていない価値を見つけるための事前アセスメントです。</p><div class="notice"><b>このシステムだけで答えを決めるものではありません。</b><br>結果と回答内容は、商品設計面談のための資料として使用します。</div><p class="small">本サービスは医学的・心理学的な診断、治療、能力の優劣判定、成功の保証を目的とするものではありません。</p><label><input id="consent" type="checkbox" style="width:auto"> 説明を読み、回答情報の利用に同意します</label><div class="actions"><div></div><button id="start">回答を始める</button></div></section>`;document.getElementById('start').onclick=()=>{if(!document.getElementById('consent').checked)return alert('同意を確認してください。');state.active.consentAt=new Date().toISOString();state.active.step=1;render()}}
function profile(){const p=state.active.profile,b=el('div');b.innerHTML=`<div class="grid2"><div><label>個人名 *</label><input id="name" value="${p.name||''}"></div><div><label>ふりがな</label><input id="kana" value="${p.kana||''}"></div><div><label>活動区分 *</label><select id="type"><option></option>${['法人経営者','個人事業主','副業・事業準備中','会社員','その他'].map(v=>`<option ${p.type===v?'selected':''}>${v}</option>`).join('')}</select></div><div><label>会社名・屋号</label><input id="company" value="${p.company||''}"></div></div><label>事業内容 *</label><textarea id="business">${p.business||''}</textarea><div class="grid2"><div><label>役職</label><input id="role" value="${p.role||''}"></div><div><label>LINE表示名またはメール</label><input id="contact" value="${p.contact||''}"></div></div>`;const n=nav(false);n.querySelector('#next').onclick=()=>{let q={name:document.getElementById('name').value.trim(),kana:document.getElementById('kana').value.trim(),type:document.getElementById('type').value,company:document.getElementById('company').value.trim(),business:document.getElementById('business').value.trim(),role:document.getElementById('role').value.trim(),contact:document.getElementById('contact').value.trim()};if(!q.name||!q.type||!q.business)return alert('必須項目を入力してください。');state.active.profile=q;state.active.status='回答途中';state.active.step++;render()};b.append(n);shell('基本情報',b)}
function bigIntro(){const b=el('div');b.innerHTML=`<p>Big Fiveは、普段の考え方や行動の傾向を5つの観点から確認するものです。良い・悪い、優れている・劣っているを判定するものではありません。</p><div class="notice"><b>精度を高める回答方法</b><ul><li>理想の自分ではなく、普段の自分で答える</li><li>直近の気分ではなく、過去2〜3年の傾向で考える</li><li>仕事だけでなく私生活も含める</li><li>考えすぎず、最初の感覚を大切にする</li><li>似た質問でも、前の回答に合わせない</li></ul></div><p>各文章が自分にどの程度当てはまるか、5段階で回答してください。</p>`;const n=nav();n.querySelector('#next').onclick=()=>{state.active.step++;render()};b.append(n);shell('Big Five性格傾向チェックについて',b)}
function bigPage(page){const start=page*10,b=el('div');b.innerHTML=`<div class="notice">理想ではなく、過去2〜3年の普段の自分を基準にお答えください。</div><div class="small">${start+1}〜${start+10} / 50問</div>`;questions.slice(start,start+10).forEach((q,idx)=>{const i=start+idx,d=el('div',{className:'question'},`<div class="qtext">${i+1}. ${q[2]}</div><div class="scale">${labels.map((l,v)=>`<label><input type="radio" name="q${i}" value="${v+1}" ${state.active.bigfive[i]===v+1?'checked':''}>${v+1}. ${l}</label>`).join('')}</div>`);d.onchange=e=>{state.active.bigfive[i]=+e.target.value;save()};b.append(d)});const n=nav();n.querySelector('#next').onclick=()=>{if(state.active.bigfive.slice(start,start+10).some(v=>v===null))return alert('10問すべてに回答してください。');state.active.step++;render()};b.append(n);shell('Big Five性格傾向チェック',b)}
