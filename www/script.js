/* ============================================================
   SM SoccerBoard Pro v75 — script.js
   © Academia SM Fútbol
   ============================================================ */

let steps=[[]], history=[], curStep=0;
let activeId=null, dragInfo=null;
let isPlaying=false, isDrawingPoly=false;
let activePointers=new Map(), initialPinchDist=null;
let tapStartX=0, tapStartY=0, isPossibleTap=false, wasActiveOnDown=false;
let idCounter=1, currentField='full';
let globalPlayerScale=1; 

const FW=1050, FH=680;
const ANIM=new Set(['A','B','C','D','ball']);

let TC={
  A:{c1:'#e63946',c2:'#ffffff'}, B:{c1:'#2e86de',c2:'#ffffff'},
  C:{c1:'#f1c40f',c2:'#000000'}, D:{c1:'#2ecc71',c2:'#ffffff'}
};

const vp       = document.getElementById('vp');
const fMaster  = document.getElementById('field-master');
const svgLayer = document.getElementById('svg-layer');

window.onload=()=>{
  preloadImages();
  updateSwatches(); 
  updateSpeedLabel();
  updateWatermark();
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{ resizeField(); render(); });
  });
};

function preloadImages() {
  const files = [
    'balon.png', 'cono.png', 'chincheta.png', 'pica.png', 'escalera.png', 'aro.png', 'pesa.png',
    'fitball.png', 'rebotador.png', 'check.png', 'error.png', 'logo.png'
  ];
  files.forEach(f => {
    const img = new Image();
    img.src = f;
  });
}

if(window.ResizeObserver){
  new ResizeObserver(()=>{ resizeField(); }).observe(vp);
} else {
  window.addEventListener('resize', resizeField);
}

function updateSpeedLabel(){
  const raw=+document.getElementById('speed-slider').value;
  document.getElementById('speed-val').textContent=(3300-raw)+'ms';
}
function getDur(){ return 3300-+document.getElementById('speed-slider').value; }

function setGlobalScale(val) {
  globalPlayerScale = parseFloat(val);
  steps.forEach(step => {
    step.forEach(el => {
      if (['A','B','C','D'].includes(el.type)) {
        el.scale = globalPlayerScale;
      }
    });
  });
  render();
}

function resizeField(){
  svgLayer.setAttribute('viewBox',`0 0 ${FW} ${FH}`);
  drawFieldBG(currentField);
}
function getZoom(){ return fMaster.getBoundingClientRect().width/FW; }

function getExportBg() {
  const bgColors = { full: '#2d8a47', half: '#2d8a47', futsal: '#1a3a5c', blank: '#1a5c2a' };
  return bgColors[currentField] || '#2d8a47';
}

function updateWatermark() {
  let wm = document.getElementById('watermark-container');
  if(!wm) {
    wm = document.createElement('div');
    wm.id = 'watermark-container';
    wm.style.cssText = 'position:absolute; bottom:15px; right:15px; pointer-events:none; z-index:10; display:flex; flex-direction:column; align-items:flex-end; opacity:0.7;';
    fMaster.appendChild(wm);
  }
  wm.innerHTML = '';
  
  const logoSrc = localStorage.getItem('smboard_custom_logo') || 'logo.png';
  const img = document.createElement('img');
  img.src = logoSrc;
  img.style.maxHeight = '50px'; 
  img.style.objectFit = 'contain';
  wm.appendChild(img);

  const name = localStorage.getItem('smboard_custom_name');
  if(name) {
    const txt = document.createElement('div');
    txt.textContent = name;
    txt.style.cssText = 'color:#ffffff; font-family:"Barlow Condensed", sans-serif; font-size:16px; font-weight:800; text-shadow:1px 1px 3px rgba(0,0,0,0.8); margin-top:5px;';
    wm.appendChild(txt);
  }

  const headerLogo = document.getElementById('header-logo');
  if(headerLogo) headerLogo.src = logoSrc;
}

function uploadCustomLogo() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/png, image/jpeg, image/webp';
  inp.onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      localStorage.setItem('smboard_custom_logo', ev.target.result);
      updateWatermark();
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}

function setCustomName() {
  const current = localStorage.getItem('smboard_custom_name') || '';
  const name = prompt("Introduce tu nombre o el de tu club:", current);
  if(name !== null) {
    localStorage.setItem('smboard_custom_name', name.trim());
    updateWatermark();
  }
}

function drawFieldBG(type){
  const old=document.getElementById('field-bg'); if(old)old.remove();
  const IMGS={full:'campoentero.png', half:'mediocampo.png'};
  
  if(IMGS[type]){
    fMaster.style.background = 'none';
    fMaster.style.backgroundColor = '#2d8a47';
    fMaster.style.backgroundImage = `url('${IMGS[type]}')`;
    fMaster.style.backgroundRepeat = 'no-repeat';
    fMaster.style.backgroundPosition = 'center';
    fMaster.style.backgroundSize = '100% 100%';
    return;
  }
  
  const BG={futsal:'#1a3a5c',blank:'#1a5c2a'};
  fMaster.style.background = 'none';
  fMaster.style.backgroundImage = 'none';
  fMaster.style.backgroundColor = BG[type]||'#2d8a47';
  if(type==='blank')return;

  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.id='field-bg';
  svg.setAttribute('xmlns', ns);
  svg.setAttribute('viewBox',`0 0 ${FW} ${FH}`);
  svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:visible;';

  const LC=type==='futsal'?'rgba(79,195,247,0.85)':'rgba(255,255,255,0.82)';
  const LW=2.5;

  for(let i=0;i<10;i+=2){
    const r=document.createElementNS(ns,'rect');
    r.setAttribute('x',i*(FW/10));r.setAttribute('y',0);
    r.setAttribute('width',FW/10);r.setAttribute('height',FH);
    r.setAttribute('fill','rgba(0,0,0,0.055)');r.setAttribute('stroke','none');
    svg.appendChild(r);
  }

  function L(x1,y1,x2,y2){const l=document.createElementNS(ns,'line');l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);l.setAttribute('stroke',LC);l.setAttribute('stroke-width',LW);svg.appendChild(l);}
  function R(x,y,w,h){const r=document.createElementNS(ns,'rect');r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',w);r.setAttribute('height',h);r.setAttribute('fill','none');r.setAttribute('stroke',LC);r.setAttribute('stroke-width',LW);svg.appendChild(r);}
  function C(cx,cy,r){const c=document.createElementNS(ns,'circle');c.setAttribute('cx',cx);c.setAttribute('cy',cy);c.setAttribute('r',r);c.setAttribute('fill','none');c.setAttribute('stroke',LC);c.setAttribute('stroke-width',LW);svg.appendChild(c);}
  function DOT(cx,cy,rr){const c=document.createElementNS(ns,'circle');c.setAttribute('cx',cx);c.setAttribute('cy',cy);c.setAttribute('r',rr||3.5);c.setAttribute('fill',LC);c.setAttribute('stroke','none');svg.appendChild(c);}
  function P(d){const p=document.createElementNS(ns,'path');p.setAttribute('d',d);p.setAttribute('fill','none');p.setAttribute('stroke',LC);p.setAttribute('stroke-width',LW);svg.appendChild(p);}
  function ARC(cx,cy,r,a1,a2){const ra1=a1*Math.PI/180,ra2=a2*Math.PI/180;const x1=cx+r*Math.cos(ra1),y1=cy+r*Math.sin(ra1);const x2=cx+r*Math.cos(ra2),y2=cy+r*Math.sin(ra2);P(`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`);}

  if(type==='full'){
    R(0,0,FW,FH); L(FW/2,0,FW/2,FH);
    C(FW/2,FH/2,91.5); DOT(FW/2,FH/2);
    R(0,FH/2-82.5,403,165); R(FW-403,FH/2-82.5,403,165);
    R(0,FH/2-27.5,183,55); R(FW-183,FH/2-27.5,183,55);
    R(-24,FH/2-36.5,24,73); R(FW,FH/2-36.5,24,73);
    DOT(110,FH/2); DOT(FW-110,FH/2);
    P(`M 403 ${FH/2-50} A 91.5 91.5 0 0 1 403 ${FH/2+50}`);
    P(`M ${FW-403} ${FH/2-50} A 91.5 91.5 0 0 0 ${FW-403} ${FH/2+50}`);
    ARC(0,0,10,0,90); ARC(FW,0,10,90,180);
    ARC(0,FH,10,270,360); ARC(FW,FH,10,180,270);
  } else if(type==='half'){
    const Xs=FW/52.5, Ys=FH/68;
    L(0,0,FW,0); L(0,0,0,FH); L(FW,0,FW,FH); L(0,FH,FW,FH);
    const AGW=40.32*Xs, AGH=16.5*Ys; R((FW-AGW)/2,0,AGW,AGH);
    const ACW=18.32*Xs, ACH=5.5*Ys; R((FW-ACW)/2,0,ACW,ACH);
    const GW=7.32*Xs, GH=2.44*Xs; R((FW-GW)/2,-GH,GW,GH);
    DOT(FW/2,11*Ys);
    const SR=9.15*Xs;
    P(`M ${FW/2-SR*0.58} ${AGH} A ${SR} ${SR} 0 0 0 ${FW/2+SR*0.58} ${AGH}`);
    ARC(0,0,10,0,90); ARC(FW,0,10,90,180);
    DOT(FW/2,FH);
  } else if(type==='futsal'){
    R(0,0,FW,FH); L(FW/2,0,FW/2,FH);
    C(FW/2,FH/2,79); DOT(FW/2,FH/2);
    P(`M 0 ${FH/2-157.5} A 157.5 157.5 0 0 1 0 ${FH/2+157.5}`);
    P(`M ${FW} ${FH/2-157.5} A 157.5 157.5 0 0 0 ${FW} ${FH/2+157.5}`);
    R(-26.25,FH/2-39.375,26.25,78.75); R(FW,FH/2-39.375,26.25,78.75);
    DOT(157.5,FH/2); DOT(FW-157.5,FH/2);
    DOT(262.5,FH/2,2.5); DOT(FW-262.5,FH/2,2.5);
    ARC(0,0,7,0,90); ARC(FW,0,7,90,180);
    ARC(0,FH,7,270,360); ARC(FW,FH,7,180,270);
  }
  fMaster.insertBefore(svg, svgLayer);
}

vp.addEventListener('pointerdown', onDown);
window.addEventListener('pointermove', onMove);
window.addEventListener('pointerup', onUp);

function onDown(e){
  if(isPlaying)return;
  tapStartX=e.clientX; tapStartY=e.clientY; isPossibleTap=true;
  const hit=e.target.closest('.object,.shirt-svg,.vec-hit,.zone-obj,.node,.zone-sh,.txt-obj,.txt-sh');
  const hitId=hit?hit.dataset.id:null;
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const rect=fMaster.getBoundingClientRect();
  const zoom=rect.width/FW;

  if(isDrawingPoly&&activeId){
    const el=steps[curStep].find(o=>o.id===activeId);
    if(el){el.pts.push({x:clamp((e.clientX-rect.left)/zoom,0,FW),y:clamp((e.clientY-rect.top)/zoom,0,FH)});render();}
    return;
  }

  if(activePointers.size===1){
    const was=activeId===hitId&&hitId!=null;
    wasActiveOnDown = was;
    const isHitEmpty = (hitId == null);

    if (!isHitEmpty) activeId = hitId;

    if(activeId){
      const el=steps[curStep].find(o=>o.id===activeId);
      if(el&&el.locked&&el.type==='zone'){
        activeId=hitId; syncInspector(el); render(); return; 
      }
      const isTxt=el&&el.type==='txt';
      const isPlayer=['A','B','C','D'].includes(el?.type);
      
      const startDrag=el&&(
        isPlayer||isTxt||was||isHitEmpty||
        hit?.classList.contains('node')||
        hit?.classList.contains('zone-sh')||
        hit?.classList.contains('txt-sh')
      );
      if(startDrag){
        saveState();
        dragInfo={el,isSH:hit?.classList.contains('zone-sh')||hit?.classList.contains('txt-sh'),
          nx:hit?.dataset.nx,ny:hit?.dataset.ny,lastX:e.clientX,lastY:e.clientY,zoom};
      }
      syncInspector(el);
    } else deselect();
  } else if(activePointers.size===2&&activeId){
    const pts=Array.from(activePointers.values());
    initialPinchDist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  }
  render();
}

function onMove(e){
  if(!activePointers.has(e.pointerId)||isPlaying)return;
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(isPossibleTap&&Math.hypot(e.clientX-tapStartX,e.clientY-tapStartY)>6)isPossibleTap=false;

  if(activePointers.size===2&&activeId&&initialPinchDist){
    const el=steps[curStep].find(o=>o.id===activeId);
    if(el&&el.type!=='zone'&&el.type!=='vec'){
      const pts=Array.from(activePointers.values());
      const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      el.scale=clamp((el.scale||1)*(d/initialPinchDist),0.25,4);
      initialPinchDist=d; render();
    }
    return;
  }

  if(!dragInfo||activePointers.size!==1||isDrawingPoly)return;
  const dx=(e.clientX-dragInfo.lastX)/dragInfo.zoom;
  const dy=(e.clientY-dragInfo.lastY)/dragInfo.zoom;
  const el=dragInfo.el;

  if(dragInfo.isSH){
    if(el.type==='txt'){
      el.w = Math.max(40, (el.w || 200) + dx);
      el.h = Math.max(20, (el.h || 60) + dy);
      el.fontSize = el.h * 0.6; 
    } else {
      el.w=Math.max(30,el.w+dx); el.h=Math.max(30,el.h+dy);
    }
  } else if(dragInfo.nx!=null&&dragInfo.nx!==''){
    if(el.sub==='poly'){el.pts[dragInfo.nx].x=clamp(el.pts[dragInfo.nx].x+dx,0,FW);el.pts[dragInfo.nx].y=clamp(el.pts[dragInfo.nx].y+dy,0,FH);}
    else{el[dragInfo.nx]+=dx;el[dragInfo.ny]+=dy;}
  } else {
    if(el.sub==='poly'){el.pts.forEach(p=>{p.x=clamp(p.x+dx,0,FW);p.y=clamp(p.y+dy,0,FH);});}
    else if(el.type==='vec'){
      ['x1','x2','cx1','cx2'].forEach(k=>{if(el[k]!=null)el[k]+=dx;});
      ['y1','y2','cy1','cy2'].forEach(k=>{if(el[k]!=null)el[k]+=dy;});
    } else if(el.type==='zone'){el.x=clamp(el.x+dx,0,FW-el.w);el.y=clamp(el.y+dy,0,FH-el.h);}
    else{el.x=clamp(el.x+dx,0,FW);el.y=clamp(el.y+dy,0,FH);}
  }
  dragInfo.lastX=e.clientX; dragInfo.lastY=e.clientY; render();
}

function onUp(e){
  const ROT=['cone','cone_low','pica','valla','ladder','weight','ball','aro','fitball','rebotador','check','error','A','B','C','D','txt'];
  if(isPossibleTap && activeId && activePointers.size===1 && !isDrawingPoly){
    const hit = e.target.closest('.object,.shirt-svg,.txt-obj');
    const hitId = hit ? hit.dataset.id : null;

    if (hitId === activeId && wasActiveOnDown) {
      const el=steps[curStep].find(o=>o.id===activeId);
      if(el&&ROT.includes(el.type)){
        el.rot=((el.rot||0)+45)%360;
        render();
      }
    } else if (!hitId && !e.target.closest('.tool, .btn, .irow, .cat, #left, #right, #topbar, #inspector')) {
      deselect();
    }
  }
  activePointers.delete(e.pointerId);
  if(activePointers.size<2)initialPinchDist=null;
  dragInfo=null;
}

function render(){
  if(isPlaying)return;
  wipe();
  const cw=fMaster.clientWidth, ch=fMaster.clientHeight;
  window._RZ={x:cw>0?cw/FW:1, y:ch>0?ch/FH:1};
  const step=steps[curStep];
  step.forEach(el=>{if(el.type==='zone')paintZone(el);});
  step.forEach(el=>{if(el.type==='vec') paintVec(el);});
  step.forEach(el=>{if(el.type==='txt') paintTxt(el);});
  step.forEach(el=>{if(el.type!=='zone'&&el.type!=='vec'&&el.type!=='txt')paintObj(el);});

  if(activeId){
    const el=step.find(o=>o.id===activeId);
    if(el?.type==='vec'){
      if(el.sub==='line') {mkN(el,'x1','y1',el.x1,el.y1);mkN(el,'x2','y2',el.x2,el.y2);}
      if(el.sub==='curve'){mkN(el,'x1','y1',el.x1,el.y1);mkN(el,'cx1','cy1',el.cx1,el.cy1,true);mkN(el,'cx2','cy2',el.cx2,el.cy2,true);mkN(el,'x2','y2',el.x2,el.y2);}
      if(el.sub==='poly') {el.pts.forEach((p,i)=>mkN(el,i,null,p.x,p.y));}
    }
  }
  document.getElementById('step-label').innerText=`${curStep+1} / ${steps.length}`;
  const insEl = activeId ? steps[curStep].find(o=>o.id===activeId) : null;
  document.getElementById('inspector').style.display = insEl ? 'block' : 'none';
}

function wipe(){
  fMaster.querySelectorAll('.object,.zone-obj,.node,.txt-obj,.shirt-svg,[data-ring]').forEach(el=>el.remove());
  const defs=svgLayer.querySelector('defs');
  svgLayer.innerHTML='';
  if(defs)svgLayer.appendChild(defs);
}

function paintObj(el){
  const isSel=activeId===el.id;
  const sc=el.scale||1;
  const rot=el.rot||0;

  const div=document.createElement('div');
  div.className='object'; 
  div.dataset.id=el.id;
  div.style.position='absolute';
  div.style.background='transparent';
  div.style.cursor='grab';
  div.style.pointerEvents='auto';
  div.style.zIndex='20';
  div.style.transformOrigin='center center';
  div.style.display='flex';
  div.style.alignItems='center';
  div.style.justifyContent='center';

  if(['A','B','C','D'].includes(el.type)){
    const c1=el.color||TC[el.type].c1;
    const c2=el.stripeColor||TC[el.type].c2;
    const sz=38; 
    const half=sz/2;
    
    div.style.left=(el.x*(window._RZ?.x||1)-half)+'px';
    div.style.top=(el.y*(window._RZ?.y||1)-half)+'px';
    div.style.width=sz+'px';
    div.style.height=sz+'px';
    div.style.transform=`rotate(${rot}deg) scale(${sc})`;

    const svg=makeShirt(c1,c2,el.striped,el.num||1,el.numColor,isSel);
    div.appendChild(svg);
    fMaster.appendChild(div);
    return;
  }

  const isImageItem = ['ball', 'cone', 'cone_low', 'pica', 'ladder', 'aro', 'weight', 'fitball', 'rebotador', 'check', 'error'].includes(el.type);
  if(isImageItem) {
    // Proporciones justas para que html2canvas no se líe sin object-fit
    const sizes = {
      'ball': [28, 28], 'cone': [28, 32], 'cone_low': [24, 24],
      'pica': [8, 52], 'ladder': [155, 33], 'aro': [32, 32], 'weight': [30, 24],
      'fitball': [32, 32], 'rebotador': [45, 15], 'check': [24, 24], 'error': [24, 24]
    };
    const files = {
      'ball': 'balon.png', 'cone': 'cono.png', 'cone_low': 'chincheta.png',
      'pica': 'pica.png', 'ladder': 'escalera.png', 'aro': 'aro.png', 'weight': 'pesa.png',
      'fitball': 'fitball.png', 'rebotador': 'rebotador.png', 'check': 'check.png', 'error': 'error.png'
    };
    const [w, h] = sizes[el.type];
    div.style.width = w + 'px'; div.style.height = h + 'px';
    div.style.left = (el.x * (window._RZ?.x || 1) - (w/2)) + 'px';
    div.style.top = (el.y * (window._RZ?.y || 1) - (h/2)) + 'px';
    
    const img = document.createElement('img');
    img.src = files[el.type];
    // Sin object-fit, obligamos a que cubra el div por completo
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.display = 'block';
    img.style.pointerEvents = 'none'; 
    div.appendChild(img);

  } else if(el.type==='valla'){
    div.style.width='48px'; div.style.height='27px';
    div.style.border=`4px solid ${el.color||'#e74c3c'}`;
    div.style.borderBottom='none';
    div.style.borderRadius='5px 5px 0 0';
    div.style.left=(el.x*(window._RZ?.x||1)-24)+'px'; div.style.top=(el.y*(window._RZ?.y||1)-13)+'px';
  }
  
  div.style.transform=`rotate(${rot}deg) scale(${sc})`;
  fMaster.appendChild(div);
  
  if (isSel) {
    const ring=document.createElement('div');
    ring.dataset.ring='1'; ring.style.position='absolute';
    ring.style.pointerEvents='none'; ring.style.border='2.5px solid #f1c40f';
    ring.style.zIndex='19'; ring.style.boxSizing='border-box';
    const rx=el.x*(window._RZ?.x||1); const ry=el.y*(window._RZ?.y||1);
    
    if(isImageItem){
      const sizes = {
        'ball': [14, 14], 'cone': [14, 16], 'cone_low': [12, 12],
        'pica': [4, 26], 'ladder': [77, 16], 'aro': [16, 16], 'weight': [15, 12],
        'fitball': [16, 16], 'rebotador': [24, 9], 'check': [12, 12], 'error': [12, 12]
      };
      const [hw, hh] = sizes[el.type];
      ring.style.width=(hw*2+8)+'px'; ring.style.height=(hh*2+8)+'px';
      ring.style.borderRadius='3px';
      if(['ball', 'aro', 'fitball', 'check', 'error'].includes(el.type)) ring.style.borderRadius='50%';
      ring.style.left=(rx-hw-4)+'px'; ring.style.top=(ry-hh-4)+'px';
    } else if(el.type==='valla'){
      ring.style.width='56px'; ring.style.height='35px';
      ring.style.borderRadius='5px';
      ring.style.left=(rx-28)+'px'; ring.style.top=(ry-17)+'px';
    }
    const rotStr=el.rot?`rotate(${el.rot}deg) `:'';
    ring.style.transform=`${rotStr}scale(${sc})`;
    ring.style.transformOrigin='center center';
    fMaster.appendChild(ring);
  }
}

function makeShirt(c1,c2,striped,num,numColor,isSelected){
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('xmlns', ns);
  svg.setAttribute('width',38);svg.setAttribute('height',38);svg.setAttribute('viewBox','0 0 38 38');
  svg.style.overflow='visible'; 
  
  const bg=document.createElementNS(ns,'circle');
  bg.setAttribute('cx','19');bg.setAttribute('cy','19');bg.setAttribute('r','18');
  bg.setAttribute('fill',c1);bg.setAttribute('stroke','rgba(255,255,255,0.8)');bg.setAttribute('stroke-width','2');
  svg.appendChild(bg);
  
  if(striped){
    const cid='sc-'+Math.random().toString(36).slice(2,6);
    const defs=document.createElementNS(ns,'defs');
    const clip=document.createElementNS(ns,'clipPath');clip.setAttribute('id',cid);
    const cc=document.createElementNS(ns,'circle');cc.setAttribute('cx','19');cc.setAttribute('cy','19');cc.setAttribute('r','17');
    clip.appendChild(cc);defs.appendChild(clip);svg.appendChild(defs);
    [4,12,20,28].forEach(x=>{
      const r=document.createElementNS(ns,'rect');
      r.setAttribute('x',x);r.setAttribute('y','0');r.setAttribute('width','5');r.setAttribute('height','38');
      r.setAttribute('fill',c2);r.setAttribute('clip-path',`url(#${cid})`);svg.appendChild(r);
    });
  }
  
  const txt=document.createElementNS(ns,'text');
  txt.setAttribute('x','19');txt.setAttribute('y','24');txt.setAttribute('text-anchor','middle');
  txt.setAttribute('font-family','Barlow Condensed,sans-serif');txt.setAttribute('font-size','14');txt.setAttribute('font-weight','800');
  const nc=numColor||'#ffffff'; txt.setAttribute('fill',nc);txt.setAttribute('paint-order','stroke');txt.setAttribute('stroke',nc==='#ffffff'?'rgba(0,0,0,0.5)':'rgba(255,255,255,0.3)');txt.setAttribute('stroke-width','2');
  txt.textContent=num;svg.appendChild(txt);
  
  if(isSelected){
    const ring=document.createElementNS(ns,'circle');
    ring.setAttribute('cx','19');ring.setAttribute('cy','19');ring.setAttribute('r','20');
    ring.setAttribute('fill','none');ring.setAttribute('stroke','#f1c40f');ring.setAttribute('stroke-width','2.5');
    svg.setAttribute('width',44);svg.setAttribute('height',44);
    svg.setAttribute('viewBox','-3 -3 44 44');
    svg.appendChild(ring);
  }
  return svg;
}

function paintZone(el){
  const div=document.createElement('div');
  div.className='zone-obj'+(el.locked?' locked':'');
  div.dataset.id=el.id;
  div.style.left=(el.x*(window._RZ?.x||1))+'px';div.style.top=(el.y*(window._RZ?.y||1))+'px';
  div.style.width=(el.w*(window._RZ?.x||1))+'px';div.style.height=(el.h*(window._RZ?.y||1))+'px';
  div.style.borderColor=el.color||'#ffffff';
  div.style.borderStyle=el.sub==='fill'?'solid':'dashed';
  div.style.background=el.sub==='fill'?(el.color||'#fff')+'33':'transparent';
  div.style.pointerEvents='auto'; 
  
  if(activeId===el.id){
    div.style.outline = '2px solid #f1c40f';
    div.style.outlineOffset = '2px';
    if(!el.locked){
      const sh=document.createElement('div');sh.className='zone-sh';sh.dataset.id=el.id;sh.textContent='⤡';
      sh.style.cssText='position:absolute;bottom:-10px;right:-10px;width:20px;height:20px;background:#f1c40f;color:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:se-resize;font-size:12px;z-index:10;box-shadow:0 2px 4px rgba(0,0,0,0.5);';
      div.appendChild(sh);
    }
  }
  if(el.locked){const lk=document.createElement('div');lk.className='zone-lock';lk.textContent='🔒';div.appendChild(lk);}
  fMaster.appendChild(div);
}

function paintTxt(el){
  const div=document.createElement('div');
  div.className='txt-obj';
  div.dataset.id=el.id;
  const rot=el.rot||0;
  const isSel=activeId===el.id;
  
  const fs = el.fontSize || 36;
  const w = el.w || 200;
  const h = el.h || 60;

  div.style.cssText=
    `position:absolute;left:${el.x*getZoom()}px;top:${el.y*getZoom()}px;`+
    `width:${w*getZoom()}px;height:${h*getZoom()}px;`+
    `display:flex;align-items:center;justify-content:center;`+
    `color:${el.color||'#ffffff'};font-size:${fs*getZoom()}px;`+ 
    `font-family:'Barlow Condensed',sans-serif;font-weight:800;`+
    `white-space:pre-wrap;text-align:center;line-height:1.1;cursor:grab;pointer-events:auto;`+
    `background:transparent;z-index:20;`+
    (rot?`transform:rotate(${rot}deg);`:'');

  if(isSel){
    div.style.outline = '2px dashed #f1c40f';
    div.style.outlineOffset = '2px';
    div.style.textShadow = '0 0 8px #f1c40f, 1px 1px 4px rgba(0,0,0,0.8)';
  } else {
    div.style.textShadow = '1px 1px 4px rgba(0,0,0,0.8)';
  }

  div.textContent=el.text;

  if(isSel){
    const sh=document.createElement('div');
    sh.className='zone-sh txt-sh';sh.dataset.id=el.id;sh.textContent='⤡';
    sh.style.cssText='position:absolute;bottom:-12px;right:-12px;z-index:30;width:24px;height:24px;font-size:14px;background:#f1c40f;color:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:se-resize;box-shadow:0 2px 4px rgba(0,0,0,0.5);';
    div.appendChild(sh);
  }
  fMaster.appendChild(div);
}

function paintVec(el){
  let d='', endX, endY, angle;

  if(el.sub==='line') {
      d=`M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`;
      endX = el.x2; endY = el.y2; angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
  } else if(el.sub==='curve') {
      d=`M ${el.x1} ${el.y1} C ${el.cx1} ${el.cy1},${el.cx2} ${el.cy2},${el.x2} ${el.y2}`;
      endX = el.x2; endY = el.y2; angle = Math.atan2(el.y2 - el.cy2, el.x2 - el.cx2);
  } else if(el.sub==='poly'&&el.pts?.length>1) {
      d=el.pts.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');
      const last = el.pts[el.pts.length-1]; const prev = el.pts[el.pts.length-2] || el.pts[0];
      endX = last.x; endY = last.y; angle = Math.atan2(last.y - prev.y, last.x - prev.x);
  }
  if(!d)return;

  const col=el.color||'#000000';

  const p=document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('d',d); p.setAttribute('stroke',col); p.setAttribute('stroke-width','3.5'); p.setAttribute('fill','none');
  p.setAttribute('stroke-linecap','round'); p.setAttribute('stroke-linejoin','round');
  if(el.dashed) p.setAttribute('stroke-dasharray','10 6');
  p.classList.add('v-el'); svgLayer.appendChild(p);

  // Mantenemos la punta de flecha infalible 
  if(el.arrow && endX !== undefined) {
     const size = 18; 
     const a1 = angle - Math.PI / 6; const a2 = angle + Math.PI / 6;
     const p1x = endX - size * Math.cos(a1); const p1y = endY - size * Math.sin(a1);
     const p2x = endX - size * Math.cos(a2); const p2y = endY - size * Math.sin(a2);
     const cx = endX - (size * 0.7) * Math.cos(angle); const cy = endY - (size * 0.7) * Math.sin(angle);

     const poly = document.createElementNS('http://www.w3.org/2000/svg','polygon');
     poly.setAttribute('points', `${endX},${endY} ${p1x},${p1y} ${cx},${cy} ${p2x},${p2y}`);
     poly.setAttribute('fill', col); poly.classList.add('v-el');
     svgLayer.appendChild(poly);
  }

  const hit=document.createElementNS('http://www.w3.org/2000/svg','path');
  hit.setAttribute('d',d); hit.setAttribute('stroke','transparent'); hit.setAttribute('stroke-width','26');
  hit.setAttribute('fill','none'); hit.classList.add('vec-hit','v-el'); hit.dataset.id=el.id; hit.style.pointerEvents='auto';
  svgLayer.appendChild(hit);
}

function mkN(el,nx,ny,fx,fy,ctrl=false){
  const n=document.createElement('div');n.className='node'+(ctrl?' ctrl':'');
  n.style.left=(fx*(window._RZ?.x||1))+'px';n.style.top=(fy*(window._RZ?.y||1))+'px';
  n.dataset.id=el.id;n.dataset.nx=nx;
  if(ny!=null)n.dataset.ny=ny;
  const i=document.createElement('div');i.className='node-in';n.appendChild(i);fMaster.appendChild(n);
}

function syncInspector(el){
  if(!el)return;
  const isVec=el.type==='vec', isPly=['A','B','C','D'].includes(el.type), isZone=el.type==='zone', isTxt=el.type==='txt';
  show('r-color'); setv('ins-color',el.color||(isPly?TC[el.type].c1:isTxt?'#ffffff':'#000000'));
  tog('r-arrow',isVec);tog('r-dash',isVec);
  if(isVec){setck('ins-arrow',!!el.arrow);setck('ins-dash',!!el.dashed);}
  tog('r-num',isPly);tog('r-strtog',isPly);tog('r-stripe',isPly&&el.striped);
  tog('r-numcolor',isPly);
  if(isPly){setv('ins-num',el.num||1);setck('ins-strtog',!!el.striped);setv('ins-stripe',el.stripeColor||TC[el.type].c2);setv('ins-numcolor',el.numColor||'#ffffff');}
  document.getElementById('r-lock').style.display = isZone ? 'flex' : 'none';
  if(isZone) setck('ins-lock',!!el.locked);
  document.getElementById('btn-fpoly').style.display=(isVec&&el.sub==='poly'&&isDrawingPoly)?'block':'none';
}
function show(id){document.getElementById(id).style.display='flex';}
function tog(id,on){document.getElementById(id).style.display=on?'flex':'none';}
function setv(id,v){document.getElementById(id).value=v;}
function setck(id,v){document.getElementById(id).checked=v;}

function setProp(prop,val){const el=steps[curStep].find(o=>o.id===activeId);if(!el)return;el[prop]=val;render();syncInspector(el);}
function toggleStripe(on){const el=steps[curStep].find(o=>o.id===activeId);if(!el)return;el.striped=on;tog('r-stripe',on);render();}
function toggleLock(on){const el=steps[curStep].find(o=>o.id===activeId);if(!el)return;el.locked=on;render();syncInspector(el);}

function createPlayer(team){
  saveState();const id=uid();
  const teamPlayers = steps[curStep].filter(o=>o.type===team);
  let maxNum = 0;
  let ref = null;
  teamPlayers.forEach(p => {
    if(p.num > maxNum) maxNum = p.num;
    ref = p; 
  });

  steps[curStep].push({
    id, 
    type:team,
    x:clamp(300+Math.random()*400,20,FW-20),
    y:clamp(180+Math.random()*300,20,FH-20),
    num: maxNum + 1,
    color: ref ? ref.color : TC[team].c1,
    stripeColor: ref ? ref.stripeColor : TC[team].c2,
    striped: ref ? ref.striped : false,
    numColor: ref ? ref.numColor : '#ffffff',
    scale: ref ? ref.scale : globalPlayerScale,
    rot: 0
  });
  activeId=id;render();syncInspector(steps[curStep].find(o=>o.id===id));
}

function createItem(type){
  saveState();const id=uid();
  const CM={cone:'#e67e22',cone_low:'#e74c3c',pica:'#f1c40f',valla:'#e74c3c',ladder:'#f1c40f',weight:'#95a5a6',aro:'#3498db',fitball:'#34495e',rebotador:'#2c3e50',check:'#2ecc71',error:'#e74c3c'};
  steps[curStep].push({id,type,x:clamp(300+Math.random()*400,20,FW-20),y:clamp(180+Math.random()*300,20,FH-20),color:CM[type]||'#e67e22',scale:1,rot:0});
  activeId=id;render();
}
function createVector(sub){
  saveState();const id=uid();
  const base={id,type:'vec',sub,color:'#000000',arrow:true,dashed:false};
  if(sub==='line')  Object.assign(base,{x1:220,y1:260,x2:430,y2:260});
  if(sub==='curve') Object.assign(base,{x1:200,y1:360,cx1:300,cy1:190,cx2:440,cy2:530,x2:540,y2:360});
  steps[curStep].push(base);activeId=id;render();syncInspector(base);
}
function startPolyMode(){
  saveState();isDrawingPoly=true;const id=uid();
  steps[curStep].push({id,type:'vec',sub:'poly',pts:[],color:'#000000',arrow:true,dashed:false});
  activeId=id;document.getElementById('poly-ind').style.display='block';document.getElementById('btn-fpoly').style.display='block';render();
}
function finishPoly(){
  isDrawingPoly=false;document.getElementById('poly-ind').style.display='none';document.getElementById('btn-fpoly').style.display='none';render();
}
function createTextEl(){
  const txt=prompt('Escribe el texto:','');
  if(!txt||!txt.trim())return;
  saveState();const id=uid();
  steps[curStep].push({id,type:'txt',text:txt.trim(),
    x:Math.round(FW*0.35),y:Math.round(FH*0.45), w:200, h:60, fontSize:36, color:'#ffffff', rot:0});
  activeId=id;render();syncInspector(steps[curStep].find(o=>o.id===id));
}

function createZone(sub){
  saveState();const id=uid();
  steps[curStep].push({id,type:'zone',sub,x:200,y:150,w:250,h:180,color:'#ffffff',locked:false});
  activeId=id;render();syncInspector(steps[curStep].find(o=>o.id===id));
}

function setField(val){
  currentField=val;
  drawFieldBG(val);
}

function setTeamColor(team,key,val){
  TC[team][key]=val;
  steps.forEach(s=>s.forEach(el=>{if(el.type===team){if(key==='c1')el.color=val;if(key==='c2')el.stripeColor=val;}}));
  updateSwatches();render();
}
function updateSwatches(){
  'ABCD'.split('').forEach(t=>{
    const sw=document.getElementById(`sw-${t}`);if(sw)sw.style.background=TC[t].c1;
    const d=document.getElementById(`dot-${t}`);if(d){d.style.background=TC[t].c1;d.style.color=isLight(TC[t].c1)?'#000':'#fff';}
  });
}

function navStep(d){const n=curStep+d;if(n<0||n>=steps.length)return;curStep=n;deselect();}
function addStep(){saveState();steps.splice(curStep+1,0,JSON.parse(JSON.stringify(steps[curStep])));curStep++;deselect();}

async function runAnimation(){
  if(steps.length<2){alert('Añade al menos 2 pasos');return;}
  isPlaying=true;deselect();
  const dur=getDur();
  for(let i=0;i<steps.length-1;i++)await animStep(steps[i],steps[i+1],dur);
  isPlaying=false;render();
}
function animStep(f1,f2,dur){
  return new Promise(res=>{
    let t0=null;
    function frame(ts){
      if(!t0)t0=ts;
      const t=Math.min((ts-t0)/dur,1),e=t<.5?2*t*t:-1+(4-2*t)*t;
      wipe();
      f1.forEach(el=>{if(el.type==='zone')paintZone(el);});
      f1.forEach(el=>{if(el.type==='vec') paintVec(el);});
      f1.forEach(el=>{if(el.type!=='zone'&&el.type!=='vec'&&!ANIM.has(el.type))paintObj(el);});
      f1.forEach(o1=>{
        if(!ANIM.has(o1.type))return;
        const o2=f2.find(x=>x.id===o1.id);
        if(!o2){paintObj(o1);return;}
        const tmp=JSON.parse(JSON.stringify(o1));
        tmp.x=o1.x+(o2.x-o1.x)*e;tmp.y=o1.y+(o2.y-o1.y)*e;
        tmp.scale=(o1.scale||1)+((o2.scale||1)-(o1.scale||1))*e;
        tmp.rot=(o1.rot||0)+((o2.rot||0)-(o1.rot||0))*e;
        paintObj(tmp);
      });
      if(t<1)requestAnimationFrame(frame);else res();
    }
    requestAnimationFrame(frame);
  });
}

function saveToLocal() {
  if (steps[0].length === 0) return alert("La pizarra está vacía.");
  const nombre = prompt("Nombre de la jugada:");
  if (!nombre) return;

  const locales = JSON.parse(localStorage.getItem('smboard_locales') || '[]');
  const nuevaJugada = {
    id: 'local_' + Date.now(),
    name: nombre,
    date: new Date().toLocaleDateString(),
    data: steps
  };

  locales.push(nuevaJugada);
  localStorage.setItem('smboard_locales', JSON.stringify(locales));
  alert("¡Jugada guardada en tu biblioteca!");
}

function openLibrary() {
  const g = document.getElementById('lib-grid');
  g.innerHTML = '';
  
  const warning = document.createElement('div');
  warning.className = 'lib-warning';
  warning.innerHTML = `⚠️ <b>AVISO:</b> Esta biblioteca solo está disponible en este dispositivo. 
  Si borras los datos del navegador o el historial, estas jugadas se perderán.`;
  g.appendChild(warning);

  const locales = JSON.parse(localStorage.getItem('smboard_locales') || '[]');
  
  if (locales.length > 0) {
    const titulo = document.createElement('div');
    titulo.className = 'cat';
    titulo.innerText = "MIS JUGADAS";
    titulo.style.gridColumn = "1 / -1";
    g.appendChild(titulo);

    locales.forEach(j => {
      const card = document.createElement('div');
      card.className = 'lcard';
      card.innerHTML = `
        <div class="licon">📋</div>
        <div class="lname">${j.name}</div>
        <div class="ldesc">${j.date}</div>
        <button class="btn btn-del" style="margin-top:8px">BORRAR</button>
      `;
      card.onclick = (e) => {
        if(e.target.classList.contains('btn-del')) {
          deleteLocal(j.id);
        } else {
          loadLocal(j.data);
        }
      };
      g.appendChild(card);
    });
  }

  const tituloAc = document.createElement('div');
  tituloAc.className = 'cat';
  tituloAc.innerText = "BIBLIOTECA ACADEMIA";
  tituloAc.style.gridColumn = "1 / -1";
  g.appendChild(tituloAc);

  DRILLS.forEach(d => {
    const c = document.createElement('div');
    c.className = 'lcard';
    c.innerHTML = `<div class="licon">${d.icon}</div><div class="lname">${d.name}</div><div class="ldesc">${d.desc}</div>`;
    c.onclick = () => injectDrill(d);
    g.appendChild(c);
  });

  openModal('m-lib');
}

function loadLocal(data) {
  saveState();
  steps = JSON.parse(JSON.stringify(data));
  curStep = 0;
  deselect();
  closeLibrary();
  render();
}

function deleteLocal(id) {
  if (!confirm("¿Seguro que quieres borrar esta jugada?")) return;
  let locales = JSON.parse(localStorage.getItem('smboard_locales') || '[]');
  locales = locales.filter(j => j.id !== id);
  localStorage.setItem('smboard_locales', JSON.stringify(locales));
  openLibrary(); 
}

const DRILLS=[
  {key:'r41',name:'Rondo 4×1',icon:'🔵',desc:'Posesión 4 vs 1',steps:[
    [{_bid:'z1',type:'zone',sub:'line',x:340,y:180,w:290,h:290,color:'#fff',locked:false},{_bid:'a1',type:'A',x:340,y:180,num:1},{_bid:'a2',type:'A',x:630,y:180,num:2},{_bid:'a3',type:'A',x:340,y:470,num:3},{_bid:'a4',type:'A',x:630,y:470,num:4},{_bid:'b1',type:'B',x:485,y:325,num:1},{_bid:'bl',type:'ball',x:340,y:180}],
    [{_bid:'z1',type:'zone',sub:'line',x:340,y:180,w:290,h:290,color:'#fff',locked:false},{_bid:'a1',type:'A',x:340,y:180,num:1},{_bid:'a2',type:'A',x:630,y:180,num:2},{_bid:'a3',type:'A',x:340,y:470,num:3},{_bid:'a4',type:'A',x:630,y:470,num:4},{_bid:'b1',type:'B',x:415,y:245,num:1},{_bid:'bl',type:'ball',x:630,y:180},{_bid:'v1',type:'vec',sub:'line',x1:345,y1:182,x2:618,y2:182,color:'#000000',arrow:true,dashed:false}],
    [{_bid:'z1',type:'zone',sub:'line',x:340,y:180,w:290,h:290,color:'#fff',locked:false},{_bid:'a1',type:'A',x:340,y:180,num:1},{_bid:'a2',type:'A',x:630,y:180,num:2},{_bid:'a3',type:'A',x:340,y:470,num:3},{_bid:'a4',type:'A',x:630,y:470,num:4},{_bid:'b1',type:'B',x:555,y:345,num:1},{_bid:'bl',type:'ball',x:340,y:470},{_bid:'v1',type:'vec',sub:'line',x1:628,y1:182,x2:352,y2:458,color:'#000000',arrow:true,dashed:false}]
  ]},
  {key:'r42',name:'Rondo 4×2',icon:'🟦',desc:'Posesión 4 vs 2',steps:[
    [{_bid:'z1',type:'zone',sub:'line',x:320,y:170,w:310,h:310,color:'#fff',locked:false},{_bid:'a1',type:'A',x:320,y:170,num:1},{_bid:'a2',type:'A',x:630,y:170,num:2},{_bid:'a3',type:'A',x:320,y:480,num:3},{_bid:'a4',type:'A',x:630,y:480,num:4},{_bid:'b1',type:'B',x:450,y:295,num:1},{_bid:'b2',type:'B',x:530,y:355,num:2},{_bid:'bl',type:'ball',x:320,y:170}],
    [{_bid:'z1',type:'zone',sub:'line',x:320,y:170,w:310,h:310,color:'#fff',locked:false},{_bid:'a1',type:'A',x:320,y:170,num:1},{_bid:'a2',type:'A',x:630,y:170,num:2},{_bid:'a3',type:'A',x:320,y:480,num:3},{_bid:'a4',type:'A',x:630,y:480,num:4},{_bid:'b1',type:'B',x:390,y:250,num:1},{_bid:'b2',type:'B',x:480,y:330,num:2},{_bid:'bl',type:'ball',x:630,y:480},{_bid:'v1',type:'vec',sub:'line',x1:322,y1:172,x2:618,y2:473,color:'#000000',arrow:true,dashed:false}]
  ]},
  {key:'tr',name:'Transición 3v2',icon:'⚡',desc:'Ataque rápido',steps:[
    [{_bid:'a1',type:'A',x:200,y:340,num:1},{_bid:'a2',type:'A',x:340,y:220,num:2},{_bid:'a3',type:'A',x:340,y:460,num:3},{_bid:'b1',type:'B',x:650,y:280,num:1},{_bid:'b2',type:'B',x:650,y:400,num:2},{_bid:'bl',type:'ball',x:200,y:340}],
    [{_bid:'a1',type:'A',x:400,y:340,num:1},{_bid:'a2',type:'A',x:540,y:210,num:2},{_bid:'a3',type:'A',x:540,y:470,num:3},{_bid:'b1',type:'B',x:680,y:280,num:1},{_bid:'b2',type:'B',x:680,y:400,num:2},{_bid:'bl',type:'ball',x:400,y:340},{_bid:'v1',type:'vec',sub:'line',x1:202,y1:340,x2:390,y2:340,color:'#000000',arrow:true,dashed:false}],
    [{_bid:'a1',type:'A',x:580,y:340,num:1},{_bid:'a2',type:'A',x:720,y:200,num:2},{_bid:'a3',type:'A',x:720,y:490,num:3},{_bid:'b1',type:'B',x:710,y:275,num:1},{_bid:'b2',type:'B',x:710,y:405,num:2},{_bid:'bl',type:'ball',x:720,y:200},{_bid:'v1',type:'vec',sub:'line',x1:402,y1:338,x2:708,y2:205,color:'#000000',arrow:true,dashed:false}]
  ]},
  {key:'pr',name:'Presión alta',icon:'🔴',desc:'Salida presionada',steps:[
    [{_bid:'a1',type:'A',x:200,y:340,num:1},{_bid:'b1',type:'B',x:300,y:240,num:1},{_bid:'b2',type:'B',x:300,y:440,num:2},{_bid:'b3',type:'B',x:175,y:340,num:3},{_bid:'bl',type:'ball',x:200,y:340}],
    [{_bid:'a1',type:'A',x:200,y:340,num:1},{_bid:'b1',type:'B',x:238,y:278,num:1},{_bid:'b2',type:'B',x:238,y:402,num:2},{_bid:'b3',type:'B',x:182,y:340,num:3},{_bid:'bl',type:'ball',x:200,y:340},{_bid:'v1',type:'vec',sub:'curve',x1:300,y1:242,cx1:278,cy1:278,cx2:253,cy2:273,x2:240,y2:280,color:'#000000',arrow:true,dashed:false},{_bid:'v2',type:'vec',sub:'curve',x1:300,y1:438,cx1:278,cy1:420,cx2:253,cy2:407,x2:240,y2:400,color:'#000000',arrow:true,dashed:false}]
  ]},
  {key:'ci',name:'Circuito técnico',icon:'🏃',desc:'Conducción + pase',steps:[
    [{_bid:'c1',type:'cone',x:250,y:310,rot:0,scale:1,color:'#e67e22'},{_bid:'c2',type:'cone',x:350,y:310,rot:0,scale:1,color:'#e67e22'},{_bid:'c3',type:'cone',x:450,y:310,rot:0,scale:1,color:'#e67e22'},{_bid:'c4',type:'cone',x:550,y:310,rot:0,scale:1,color:'#e67e22'},{_bid:'pk',type:'pica',x:650,y:310,rot:0,scale:1,color:'#f1c40f'},{_bid:'a1',type:'A',x:170,y:310,num:1},{_bid:'bl',type:'ball',x:170,y:310}],
    [{_bid:'c1',type:'cone',x:250,y:310,rot:0,scale:1,color:'#e67e22'},{_bid:'c2',type:'cone',x:350,y:310,rot:0,scale:1,color:'#e67e22'},{_bid:'c3',type:'cone',x:450,y:310,rot:0,scale:1,color:'#e67e22'},{_bid:'c4',type:'cone',x:550,y:310,rot:0,scale:1,color:'#e67e22'},{_bid:'pk',type:'pica',x:650,y:310,rot:0,scale:1,color:'#f1c40f'},{_bid:'a1',type:'A',x:650,y:310,num:1},{_bid:'bl',type:'ball',x:650,y:310},{_bid:'v1',type:'vec',sub:'poly',pts:[{x:172,y:310},{x:300,y:268},{x:400,y:335},{x:500,y:268},{x:648,y:310}],color:'#000000',arrow:true,dashed:false}]
  ]},
  {key:'co',name:'Córner ensayado',icon:'🏁',desc:'Jugada a balón parado',steps:[
    [{_bid:'a1',type:'A',x:950,y:620,num:1},{_bid:'a2',type:'A',x:800,y:400,num:2},{_bid:'a3',type:'A',x:820,y:480,num:3},{_bid:'a4',type:'A',x:750,y:320,num:4},{_bid:'b1',type:'B',x:830,y:400,num:1},{_bid:'b2',type:'B',x:840,y:480,num:2},{_bid:'bl',type:'ball',x:1020,y:650}],
    [{_bid:'a1',type:'A',x:950,y:620,num:1},{_bid:'a2',type:'A',x:845,y:378,num:2},{_bid:'a3',type:'A',x:820,y:440,num:3},{_bid:'a4',type:'A',x:762,y:298,num:4},{_bid:'b1',type:'B',x:862,y:390,num:1},{_bid:'b2',type:'B',x:857,y:468,num:2},{_bid:'bl',type:'ball',x:845,y:378},{_bid:'v1',type:'vec',sub:'curve',x1:1020,y1:650,cx1:980,cy1:500,cx2:900,cy2:380,x2:847,y2:380,color:'#000000',arrow:true,dashed:false}]
  ]}
];

function closeLibrary(){closeModal('m-lib');}
function injectDrill(d){
  saveState();
  const base=Date.now();const bm={};
  d.steps.forEach(s=>s.forEach(el=>{if(el._bid&&!bm[el._bid])bm[el._bid]=base+'_'+(++idCounter)+'_'+el._bid;}));
  const ns=d.steps.map(s=>s.map(raw=>{
    const el=JSON.parse(JSON.stringify(raw));
    el.id=el._bid?bm[el._bid]:uid();delete el._bid;
    if(['A','B','C','D'].includes(el.type)){el.color=TC[el.type].c1;el.stripeColor=TC[el.type].c2;el.striped=false;}
    el.scale=el.scale??1;el.rot=el.rot??0;return el;
  }));
  steps.length=0;ns.forEach(s=>steps.push(s));
  curStep=0;deselect();closeLibrary();
}

function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function openResetMenu(){openModal('m-reset');}
function openHelp(){openModal('m-help');}
function closeHelp(){closeModal('m-help');}

async function exportPNG(){
  deselect();
  const _r=fMaster.getBoundingClientRect();
  window._RZ={x:_r.width>0?_r.width/FW:1,y:_r.height>0?_r.height/FH:1};
  render();
  await tick(500); 
  
  html2canvas(fMaster,{
    scale:2,
    useCORS:true,
    backgroundColor: getExportBg(),
    logging:false,
    onclone:(doc)=>{
      doc.querySelectorAll('.shirt-svg').forEach(s=>{
        s.style.overflow='visible';
      });
    }
  }).then(c=>{
    dl(c.toDataURL('image/png'),`tactica_paso${curStep+1}_${Date.now()}.png`);
  }).catch(err=>{alert('Error PNG: '+err.message);});
}

function exportVideo(){if(steps.length<2){alert('Añade al menos 2 pasos');return;}openModal('m-export');}
function setProg(p,m){document.getElementById('pbar-fill').style.width=p+'%';document.getElementById('exp-status').textContent=m;}

async function startExport(fmt){
  document.getElementById('exp-prog').style.display='block';setProg(2,'Preparando...');
  try{
    if(fmt==='mp4' || fmt==='webm' || fmt==='video') await doVideo();
    else await doGIF();
  }
  catch(err){console.error(err);alert('Error: '+err.message);closeModal('m-export');}
}

function renderForExport(f1,f2,ease){
  const _r=fMaster.getBoundingClientRect();
  window._RZ={x:_r.width>0?_r.width/FW:1,y:_r.height>0?_r.height/FH:1};
  wipe();
  f1.forEach(el=>{if(el.type==='zone')paintZone(el);});
  f1.forEach(el=>{if(el.type==='vec') paintVec(el);});
  f1.forEach(el=>{if(el.type!=='zone'&&el.type!=='vec'&&!ANIM.has(el.type))paintObj(el);});
  f1.forEach(o1=>{
    if(!ANIM.has(o1.type))return;
    const o2=f2.find(x=>x.id===o1.id);if(!o2){paintObj(o1);return;}
    const tmp=JSON.parse(JSON.stringify(o1));
    tmp.x=o1.x+(o2.x-o1.x)*ease;tmp.y=o1.y+(o2.y-o1.y)*ease;
    tmp.scale=(o1.scale||1)+((o2.scale||1)-(o1.scale||1))*ease;
    tmp.rot=(o1.rot||0)+((o2.rot||0)-(o1.rot||0))*ease;
    paintObj(tmp);
  });
}

async function doVideo(){
  const origShadow=fMaster.style.boxShadow;
  fMaster.style.boxShadow='none';
  const FPS=25,dur=getDur();
  const fp=Math.round((dur/1000)*FPS),total=fp*(steps.length-1);
  setProg(5,`Capturando ${total} frames...`);deselect();isPlaying=true;
  
  const W=fMaster.offsetWidth,H=fMaster.offsetHeight;
  const rc=document.createElement('canvas');rc.width=W;rc.height=H;
  const ctx=rc.getContext('2d');const snaps=[];
  
  for(let i=0;i<steps.length-1;i++){
    for(let f=0;f<fp;f++){
      const t=f/fp,ease=t<.5?2*t*t:-1+(4-2*t)*t;
      renderForExport(steps[i],steps[i+1],ease);
      await new Promise(r=>requestAnimationFrame(r));await tick(0);
      snaps.push(await html2canvas(fMaster,{scale:1,useCORS:true,backgroundColor:getExportBg(),logging:false}));
      setProg(5+Math.round(((i*fp+f+1)/total)*55),`Frame ${i*fp+f+1}/${total}`);
    }
  }
  
  renderForExport(steps[steps.length-1],steps[steps.length-1],0);await tick(60);
  const ls=await html2canvas(fMaster,{scale:1,useCORS:true,backgroundColor:getExportBg(),logging:false});
  for(let k=0;k<FPS;k++)snaps.push(ls);
  
  isPlaying=false;fMaster.style.boxShadow=origShadow;render();setProg(62,'Ensamblando WebM...');
  
  const mime=['video/webm;codecs=vp8,opus','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  const stream=rc.captureStream(FPS),rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4e6}),chunks=[];
  rec.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};rec.start();
  
  for(let i=0;i<snaps.length;i++){
    ctx.drawImage(snaps[i],0,0,W,H);
    await tick(1000/FPS);
    setProg(62+Math.round((i/snaps.length)*30),'Ensamblando...');
  }
  rec.stop();
  
  const wb=await new Promise(r=>{rec.onstop=()=>r(new Blob(chunks,{type:'video/webm'}));});
  
  setProg(100,'¡Listo!');
  await tick(500);
  dl(URL.createObjectURL(wb),`tactica_${Date.now()}.webm`);
  closeModal('m-export');
}

async function doGIF(){
  if(typeof GIF==='undefined'){alert('GIF no disponible');return;}
  const FPS=20,dur=getDur();
  const fp=Math.max(8,Math.round((dur/1000)*FPS)),total=fp*(steps.length-1);
  deselect();isPlaying=true;
  const gif=new GIF({workers:2,quality:6,width:fMaster.offsetWidth,height:fMaster.offsetHeight,workerScript:'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'});
  let done=0;
  for(let i=0;i<steps.length-1;i++) for(let f=0;f<fp;f++){
    const t=f/fp,ease=t<.5?2*t*t:-1+(4-2*t)*t;
    renderForExport(steps[i],steps[i+1],ease);
    await new Promise(r=>requestAnimationFrame(r));await tick(0);
    gif.addFrame(await html2canvas(fMaster,{scale:1,useCORS:true,backgroundColor:getExportBg(),logging:false}),{delay:Math.round(1000/FPS),copy:true});
    done++;setProg(5+Math.round((done/total)*80),`Frame ${done}/${total}`);
  }
  isPlaying=false;render();setProg(88,'Compilando GIF...');
  gif.on('progress',p=>setProg(88+Math.round(p*10),'Compilando...'));
  gif.on('finished',blob=>{setProg(100,'¡Listo!');setTimeout(()=>{dl(URL.createObjectURL(blob),`tactica_${Date.now()}.gif`);closeModal('m-export');},400);});
  gif.render();
}

function toggleFullscreen(){
  if(!document.fullscreenElement){document.documentElement.requestFullscreen().catch(e=>console.warn(e));}
  else{document.exitFullscreen().catch(e=>console.warn(e));}
}

function saveState(){if(history.length>40)history.shift();history.push(JSON.stringify(steps));}
function undo(){if(!history.length)return;steps=JSON.parse(history.pop());if(curStep>=steps.length)curStep=steps.length-1;render();}
function deselect(){activeId=null;if(isDrawingPoly)finishPoly();render();}

function dupActive(){
  if(!activeId)return;saveState();
  const o=steps[curStep].find(x=>x.id===activeId);if(!o)return;
  const c=JSON.parse(JSON.stringify(o));c.id=uid();
  if(c.type==='zone'){c.x=clamp(c.x+20,0,FW-c.w);c.y=clamp(c.y+20,0,FH-c.h);}
  else if(c.type!=='vec'){c.x=clamp(c.x+40,0,FW);c.y=clamp(c.y+40,0,FH);}
  
  if(['A','B','C','D'].includes(c.type)){
    let maxNum = 0;
    steps[curStep].forEach(p => {
      if(p.type === c.type && p.num > maxNum) maxNum = p.num;
    });
    c.num = maxNum + 1;
  }
  
  steps[curStep].push(c);activeId=c.id;render();
}

function delActive(){if(!activeId)return;saveState();steps[curStep]=steps[curStep].filter(o=>o.id!==activeId);activeId=null;render();}
function doReset(t){saveState();if(t==='step')steps[curStep]=[];else{steps=[[]];curStep=0;}closeModal('m-reset');deselect();}
function uid(){return(++idCounter)+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function tick(ms){return new Promise(r=>setTimeout(r,ms));}
function dl(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.click();}
function isLight(hex){if(!hex||hex.length<7)return false;const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return(r*299+g*587+b*114)/1000>155;}
