const renderBeforeAutoScroll=render;
render=function(){
  const result=renderBeforeAutoScroll();
  requestAnimationFrame(()=>{
    window.scrollTo(0,0);
    document.documentElement.scrollTop=0;
    document.body.scrollTop=0;
  });
  return result;
};

const assetKindOptions=[
  ['', '選択してください（任意）'],
  ['具体的な事例と数字を書ける', '具体的な事例と数字を書ける'],
  ['具体的な事例は書けるが、数字では表しにくい', '具体的な事例は書けるが、数字では表しにくい'],
  ['おおよその内容・概算なら書ける', 'おおよその内容・概算なら書ける'],
  ['まだ該当する経験・実績はない', 'まだ該当する経験・実績はない'],
  ['経験はあるが、詳しく思い出せない', '経験はあるが、詳しく思い出せない']
];
const legacyAssetKindMap={
  '数字で示せる実績がある':'具体的な事例と数字を書ける',
  'おおよその実績なら書ける':'おおよその内容・概算なら書ける',
  'まだ実績はない':'まだ該当する経験・実績はない',
  'よく覚えていない':'経験はあるが、詳しく思い出せない'
};
function normalizeAssetKind(value){return legacyAssetKindMap[value]||value||''}
function assetPlaceholder(kind){
  const placeholders={
    '具体的な事例と数字を書ける':'例：3か月で新規顧客20名を支援し、売上120万円。どのように行ったかも書いてください。',
    '具体的な事例は書けるが、数字では表しにくい':'数字にしにくい場合は、いつ・誰に・何をして・どう変化したかを書いてください。',
    'おおよその内容・概算なら書ける':'例：約30名を支援、2年ほど継続。分かる範囲で構いません。',
    'まだ該当する経験・実績はない':'まだない場合は、試したこと、準備していること、今後実績にしたいことを書いてください。',
    '経験はあるが、詳しく思い出せない':'覚えている範囲で、時期・相手・出来事・印象に残っている反応を書いてください。'
  };
  return placeholders[kind]||'抽象的な自己評価だけでなく、具体的な出来事や場面を書いてください。';
}

function twentyIntro(){const b=el('div');b.innerHTML='<p>「私は、＿＿＿＿」に続く文章を20個完成させてください。性格だけでなく、仕事、役割、能力、価値観、人間関係、悩み、目標などを書いて構いません。</p><div class="notice"><b>入力のポイント</b><ul><li>思いついた順に書く</li><li>良い面だけでなく、迷い・苦手・矛盾も書く</li><li>似た内容が重なっても問題ない</li><li>短い言葉でもよい</li><li>できるだけ20個書く</li></ul></div><div class="notice warning">文章生成AIや他の人に作ってもらわず、ご自身の言葉で入力してください。文章の上手さは評価しません。</div><details><summary>入力例を見る</summary><p>私は、人の相談に乗ることが多い。<br>私は、新しいことを考えるのが好きだ。<br>私は、人に頼ることが苦手だ。</p></details>';const n=nav();n.querySelector('#next').onclick=()=>{state.active.step++;save();render()};b.append(n);shell('「私は＿＿」自己認識ワーク',b)}
function twentyPage(){const b=el('div');b.innerHTML='<p>できるだけ20個入力してください。すぐに思いつかない場合は、少し時間を置いても構いません。</p>';state.active.twenty.forEach((v,i)=>{const r=el('div',{className:'twenty-row'},`<span>${i+1}.</span><textarea data-i="${i}" placeholder="私は、">${esc(v)}</textarea>`);r.querySelector('textarea').oninput=e=>{state.active.twenty[i]=e.target.value;save()};b.append(r)});const n=nav();n.querySelector('#next').onclick=()=>{const count=state.active.twenty.filter(v=>v.trim()).length;if(count<10&&!confirm(`現在${count}個です。このまま進みますか？`))return;state.active.step++;save();render()};b.append(n);shell('20答法',b)}
function assetsPage(){
  const a=state.active.assets,b=el('div');
  b.innerHTML='<div class="notice"><b>書き方について</b><br>数字で表せる場合は、売上・人数・件数・期間なども書いてください。数字では表しにくい経験は、具体的な場面や相手の反応を書いてください。正確に覚えていない場合は「約」「およそ」で構いません。</div><p class="small">各プルダウンは回答を評価するものではなく、現在どの程度具体的に書けるかを整理するための補助項目です。</p>';
  assetQs.forEach(([k,q])=>{
    const savedKind=normalizeAssetKind(a[k]?.kind);
    const d=el('div');
    d.innerHTML=`<label>${esc(q)}</label><label class="small" style="font-weight:600">この質問について、現在の状況に近いもの</label><select data-kind="${k}">${assetKindOptions.map(([value,label])=>`<option value="${esc(value)}" ${savedKind===value?'selected':''}>${esc(label)}</option>`).join('')}</select><textarea data-key="${k}" placeholder="${esc(assetPlaceholder(savedKind))}">${esc(a[k]?.text)}</textarea>`;
    const select=d.querySelector('select');
    const textarea=d.querySelector('textarea');
    if(savedKind){a[k]=a[k]||{};a[k].kind=savedKind}
    select.onchange=e=>{a[k]=a[k]||{};a[k].kind=e.target.value;textarea.placeholder=assetPlaceholder(e.target.value);save()};
    textarea.oninput=e=>{a[k]=a[k]||{};a[k].text=e.target.value;save()};
    b.append(d)
  });
  const n=nav();n.querySelector('#next').onclick=()=>{state.active.step++;save();render()};b.append(n);shell('経験・実績・強みの棚卸し',b)
}
function currentPage(){const c=state.active.current,b=el('div');currentQs.forEach(([k,q])=>{const d=el('div');d.innerHTML=`<label>${esc(q)}</label><textarea data-key="${k}">${esc(c[k])}</textarea>`;d.querySelector('textarea').oninput=e=>{c[k]=e.target.value;save()};b.append(d)});const extra=el('div');extra.innerHTML=`<h3>任意の数値情報</h3><div class="grid2"><div><label>現在の月商・年商</label><input id="sales" value="${esc(c.sales)}" placeholder="分からない・回答しないでも可"></div><div><label>目標月商</label><input id="target" value="${esc(c.target)}"></div><div><label>現在の商品単価</label><input id="price" value="${esc(c.price)}"></div><div><label>月に使える時間</label><input id="time" value="${esc(c.time)}"></div></div>`;b.append(extra);const n=nav();n.querySelector('#next').onclick=()=>{['sales','target','price','time'].forEach(k=>c[k]=document.getElementById(k).value);state.active.step++;save();render()};b.append(n);shell('現在の仕事・悩み・希望',b)}
function review(){const s=state.active,b=el('div');b.innerHTML=`<p>回答内容を送信すると、Big Five結果が表示されます。送信後は原則として編集できません。</p><div class="notice"><b>${esc(s.profile.name)}</b><br>${esc(s.profile.company)}<br>${esc(s.profile.business)}</div><ul><li>Big Five：50 / 50問</li><li>20答法：${s.twenty.filter(v=>v.trim()).length}件</li><li>経験・実績：入力済み</li><li>現在の仕事・希望：入力済み</li></ul><p id="submitNotice" class="small"></p>`;const n=nav(true,true,'回答を送信する');let confirmed=false;n.querySelector('#next').onclick=async()=>{const button=n.querySelector('#next');if(!confirmed){confirmed=true;button.textContent='もう一度押して送信を確定';document.getElementById('submitNotice').textContent='送信後は回答を変更できません。内容を確認し、もう一度ボタンを押してください。';return}button.disabled=true;button.textContent='送信中…';try{const completed={...s,submitted:true,status:'回答完了',completedAt:new Date().toISOString()};const result=score(completed);const ok=await cloudRpc('complete_assessment',{p_access_token:customerToken,p_payload:completed,p_scores:result});if(!ok)throw new Error('送信を完了できませんでした。');state.active=completed;saveLocal();render()}catch(e){confirmed=false;button.disabled=false;button.textContent='回答を送信する';document.getElementById('submitNotice').textContent='';alert(`送信できませんでした。通信環境を確認してください。\n${e.message}`)}};b.append(n);shell('回答内容の確認',b)}