const PERSONA_CORE_NAME='Persona Core';
const PERSONA_CORE_SUBTITLE='あなたの設計診断';
const PERSONA_CORE_LOGO_URL='assets/kodama-corporation-logo.jpg?v=20260728-5';
const PERSONA_CORE_MARK_URL='assets/kodama-logo-mark.jpg?v=20260728-5';
let personaBrandingBusy=false;

function replaceExactText(root,from,to){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    const value=node.nodeValue;
    if(!value||!value.includes(from))return;
    const next=value.replaceAll(from,to);
    if(next!==value)node.nodeValue=next;
  });
}

function configureBrandImage(img,src){
  img.src=src;
  img.alt='Kodama Corporation ロゴ';
  img.referrerPolicy='no-referrer';
  img.decoding='async';
  img.onerror=()=>{
    img.onerror=null;
    const fallback=document.createElement('span');
    fallback.className=`${img.className} persona-logo-fallback`;
    fallback.setAttribute('role','img');
    fallback.setAttribute('aria-label','Kodama Corporation');
    fallback.textContent='KC';
    img.replaceWith(fallback);
  };
}

function applyPersonaBranding(){
  if(personaBrandingBusy)return;
  personaBrandingBusy=true;
  try{
    if(document.title.includes('強み・商品設計診断')){
      document.title=document.title.replace('強み・商品設計診断',`${PERSONA_CORE_NAME}｜${PERSONA_CORE_SUBTITLE}`);
    }
    const header=document.querySelector('.site-header');
    if(header){
      const left=header.firstElementChild;
      if(left&&!left.classList.contains('persona-site-brand')){
        left.className='persona-site-brand';
        left.innerHTML='<img class="persona-header-logo"><div><div class="brand">Persona Core</div><div class="service">あなたの設計診断</div></div>';
        configureBrandImage(left.querySelector('.persona-header-logo'),PERSONA_CORE_MARK_URL);
      }
    }
    replaceExactText(document.body,'強み・商品設計診断',PERSONA_CORE_NAME);
    document.querySelectorAll('#app .hero').forEach(hero=>{
      if(!hero.querySelector('.persona-hero-logo')){
        const img=document.createElement('img');
        img.className='persona-hero-logo';
        configureBrandImage(img,PERSONA_CORE_LOGO_URL);
        hero.insertBefore(img,hero.firstChild);
      }
      const h1=hero.querySelector('h1');
      if(h1&&h1.textContent.trim()===PERSONA_CORE_NAME&&!hero.querySelector('.persona-hero-subtitle')){
        const subtitle=document.createElement('div');
        subtitle.className='persona-hero-subtitle';
        subtitle.textContent=PERSONA_CORE_SUBTITLE;
        h1.insertAdjacentElement('afterend',subtitle);
      }
    });
    document.querySelectorAll('.eyebrow').forEach(node=>{
      if(node.textContent.trim()===PERSONA_CORE_NAME)node.textContent='PERSONA CORE';
    });
  }finally{
    personaBrandingBusy=false;
  }
}

const personaBrandObserver=new MutationObserver(()=>requestAnimationFrame(applyPersonaBranding));
personaBrandObserver.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
window.addEventListener('DOMContentLoaded',applyPersonaBranding);
applyPersonaBranding();

