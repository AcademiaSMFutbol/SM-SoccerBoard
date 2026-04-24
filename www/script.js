/* ============================================================
   SM SoccerBoard Pro v75 — script.js
   © Academia SM Fútbol — Las Palmas de Gran Canaria
   FIX RAÍZ: campo dibujado en #field-bg (SVG separado).
   wipe() solo borra .object/.zone-obj/.node — NUNCA el campo.
   resizeField() usa width/height directos, sin transform:scale.
   ============================================================ */

// ── ESTADO ───────────────────────────────────────────────────
let steps=[[]], history=[], curStep=0;
let activeId=null, dragInfo=null;
let isPlaying=false, isDrawingPoly=false;
let activePointers=new Map(), initialPinchDist=null;
let tapStartX=0, tapStartY=0, isPossibleTap=false;
let idCounter=1, currentField='full';

const FW=1050, FH=680;
const ANIM=new Set(['A','B','C','D','ball']);

let TC={
  A:{c1:'#e63946',c2:'#ffffff'}, B:{c1:'#2e86de',c2:'#ffffff'},
  C:{c1:'#f1c40f',c2:'#000000'}, D:{c1:'#2ecc71',c2:'#ffffff'}
};

const vp       = document.getElementById('vp');
const fMaster  = document.getElementById('field-master');
const svgLayer = document.getElementById('svg-layer');

// ── INIT ─────────────────────────────────────────────────────
window.onload=()=>{
  updateSwatches(); updateSpeedLabel();
  // Diferir resizeField hasta que el browser haya calculado el layout
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{ resizeField(); render(); });
  });
};
// ResizeObserver para reaccionar a cambios de tamaño del viewport
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

// ── RESIZE: el campo ocupa 100% del vp (CSS lo controla)
// JS solo actualiza el SVG viewBox para que las coordenadas
// internas (0,0)-(FW,FH) mapeen correctamente al tamaño real.
function resizeField(){
  svgLayer.setAttribute('viewBox',`0 0 ${FW} ${FH}`);
  drawFieldBG(currentField);
}
function getZoom(){ return fMaster.getBoundingClientRect().width/FW; }

// ── CAMPO — imágenes PNG para full/half, SVG para futsal/blank ─
function drawFieldBG(type){
  const old=document.getElementById('field-bg'); if(old)old.remove();
  // Usar imágenes PNG del repositorio cuando estén disponibles
  const IMGS={full:'campoentero.png', half:'mediocampo.png'};
  if(IMGS[type]){
    fMaster.style.background=`#2d8a47 url('${IMGS[type]}') no-repeat center/100% 100%`;
    return;
  }
  const BG={futsal:'#1a3a5c',blank:'#1a5c2a'};
  fMaster.style.background=BG[type]||'#2d8a47';
  if(type==='blank')return;

  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.id='field-bg';
  svg.setAttribute('viewBox',`0 0 ${FW} ${FH}`);
  svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:visible;';

  const LC=type==='futsal'?'rgba(79,195,247,0.85)':'rgba(255,255,255,0.82)';
  const LW=2.5;

  // Franjas decorativas de cesped
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
    // Campo 105x68m — escala 10px/m — líneas blancas sobre verde
    // Franjas de césped ya dibujadas arriba
    R(0,0,FW,FH);                               // perímetro
    L(FW/2,0,FW/2,FH);                          // línea central
    C(FW/2,FH/2,91.5); DOT(FW/2,FH/2);         // círculo central r=9.15m
    // Áreas grandes: 40.32m×16.5m = 403×165px
    R(0,FH/2-82.5,403,165); R(FW-403,FH/2-82.5,403,165);
    // Áreas chicas: 18.32m×5.5m = 183×55px
    R(0,FH/2-27.5,183,55); R(FW-183,FH/2-27.5,183,55);
    // Porterías: 7.32m×2.44m = 73×24px (fuera del perímetro)
    R(-24,FH/2-36.5,24,73); R(FW,FH/2-36.5,24,73);
    // Puntos de penalti: 11m=110px
    DOT(110,FH/2); DOT(FW-110,FH/2);
    // Semicírculos: r=91.5px desde punto de penalti, solo parte exterior al área
    P(`M 403 ${FH/2-50} A 91.5 91.5 0 0 1 403 ${FH/2+50}`);
    P(`M ${FW-403} ${FH/2-50} A 91.5 91.5 0 0 0 ${FW-403} ${FH/2+50}`);
    // Córners: r=1m=10px
    ARC(0,0,10,0,90); ARC(FW,0,10,90,180);
    ARC(0,FH,10,270,360); ARC(FW,FH,10,180,270);

  } else if(type==='half'){
    // Medio campo: mitad del campo (52.5m×68m).
    // Portería ARRIBA (y=0), línea central ABAJO (y=FH).
    // Escala: FW=1050 → 52.5m ancho (20px/m en X), FH=680 → 68m alto (10px/m en Y)
    // → mismo viewBox que campo completo, solo mostramos una mitad
    const Xs=FW/52.5, Ys=FH/68;
    // Líneas de contorno
    L(0,0,FW,0); L(0,0,0,FH); L(FW,0,FW,FH); L(0,FH,FW,FH);
    // Área grande: 40.32m×16.5m
    const AGW=40.32*Xs, AGH=16.5*Ys;
    R((FW-AGW)/2,0,AGW,AGH);
    // Área chica: 18.32m×5.5m
    const ACW=18.32*Xs, ACH=5.5*Ys;
    R((FW-ACW)/2,0,ACW,ACH);
    // Portería: 7.32m×2.44m (encima de y=0, hacia afuera)
    const GW=7.32*Xs, GH=2.44*Xs;
    R((FW-GW)/2,-GH,GW,GH);
    // Punto de penalti: 11m desde línea de fondo
    DOT(FW/2,11*Ys);
    // Semicírculo área: r=9.15m, sale por debajo del área grande
    const SR=9.15*Xs;
    P(`M ${FW/2-SR*0.58} ${AGH} A ${SR} ${SR} 0 0 0 ${FW/2+SR*0.58} ${AGH}`);
    // Córners arriba
    ARC(0,0,10,0,90); ARC(FW,0,10,90,180);
    // Punto central en línea central
    DOT(FW/2,FH);

  } else if(type==='futsal'){
    // Futbol sala 40m x 20m. 1050/40=26.25px/m, 680/20=34px/m
    R(0,0,FW,FH);
    L(FW/2,0,FW/2,FH);
    C(FW/2,FH/2,79); DOT(FW/2,FH/2); // circulo r=3m=79px
    // Semicirculos de area r=6m: 6*26.25=157.5px
    P(`M 0 ${FH/2-157.5} A 157.5 157.5 0 0 1 0 ${FH/2+157.5}`);
    P(`M ${FW} ${FH/2-157.5} A 157.5 157.5 0 0 0 ${FW} ${FH/2+157.5}`);
    // Porterias: 3m x 1m = 78.75 x 26.25px
    R(-26.25,FH/2-39.375,26.25,78.75); R(FW,FH/2-39.375,26.25,78.75);
    // Puntos de penalti: 6m=157.5px y 10m=262.5px
    DOT(157.5,FH/2); DOT(FW-157.5,FH/2);
    DOT(262.5,FH/2,2.5); DOT(FW-262.5,FH/2,2.5);
    ARC(0,0,7,0,90); ARC(FW,0,7,90,180);
    ARC(0,FH,7,270,360); ARC(FW,FH,7,180,270);
  }

  fMaster.insertBefore(svg, svgLayer);
}


// ── PUNTERO ──────────────────────────────────────────────────
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
    const isHitEmpty = (hitId == null);

    // Si tocamos el vacío pero hay un objeto activo, NO deseleccionamos.
    // Conservamos activeId para permitir el arrastre remoto.
    if (!isHitEmpty) {
      activeId = hitId;
    }

    if(activeId){
      const el=steps[curStep].find(o=>o.id===activeId);
      if(el&&el.locked&&el.type==='zone'){
        // Zona bloqueada: seleccionar para mostrar inspector (desbloquear)
        // NO iniciar drag ni saveState
        activeId=hitId;
        syncInspector(el);
        render();
        return; // salir sin crear dragInfo
      }
      const isTxt=el&&el.type==='txt';
      const isPlayer=['A','B','C','D'].includes(el?.type);
      
      // Añadimos isHitEmpty para que inicie el drag aunque toquemos el césped
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

  // Pellizco → escala jugadores/material
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
      const delta=(dx+dy)*0.5;
      el.fontSize=Math.max(8,Math.min(300,(el.fontSize||32)+delta));
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
  const ROT=['cone','cone_low','pica','valla','ladder','weight','ball','A','B','C','D'];
  if(isPossibleTap && activeId && activePointers.size===1 && !isDrawingPoly){
    const hit = e.target.closest('.object,.shirt-svg,.txt-obj');
    const hitId = hit ? hit.dataset.id : null;

    if (hitId === activeId) {
      // Tap explícito SOBRE el objeto activo -> Rota
      const el=steps[curStep].find(o=>o.id===activeId);
      if(el&&ROT.includes(el.type)){el.rot=((el.rot||0)+15)%360; render();}
    } else if (!hitId && !e.target.closest('.tool, .btn, .irow, .cat, #left, #right, #topbar, #inspector')) {
      // Tap limpio en el césped sin mover -> Deselecciona
      deselect();
    }
  }
  activePointers.delete(e.pointerId);
  if(activePointers.size<2)initialPinchDist=null;
  dragInfo=null;
}

// ── RENDER ───────────────────────────────────────────────────
function render(){
  if(isPlaying)return;
  wipe();
  // _RZ: mismo ratio que el SVG viewBox usa internamente
  // clientWidth/Height son enteros post-layout, sin decimales de transform
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
  // Mostrar inspector si hay elemento activo
  const insEl = activeId ? steps[curStep].find(o=>o.id===activeId) : null;
  document.getElementById('inspector').style.display = insEl ? 'block' : 'none';
}

// FIX CRÍTICO: wipe() nunca borra #field-bg ni defs del svg-layer
function wipe(){
  fMaster.querySelectorAll('.object,.zone-obj,.node,.txt-obj,.shirt-svg,[data-ring]').forEach(el=>el.remove());
  const defs=svgLayer.querySelector('defs');
  svgLayer.innerHTML='';
  if(defs)svgLayer.appendChild(defs);
}

// ── PAINT OBJECT ─────────────────────────────────────────────
// Posicionamos sin translate(-50%,-50%) para evitar el salto:
// left = x - halfW, top = y - halfH  con dimensiones conocidas por tipo
function paintObj(el){
  const isSel=activeId===el.id;
  const sc=el.scale||1;
  const rot=el.rot||0;

  const z=getZoom(); // escala canvas→px reales
  if(['A','B','C','D'].includes(el.type)){
    const c1=el.color||TC[el.type].c1;
    const c2=el.stripeColor||TC[el.type].c2;
    const sz=38; // tamaño fijo en px de pantalla (no canvas)
    const half=sz/2;
    const svg=makeShirt(c1,c2,el.striped,el.num||1,el.numColor,isSel);
    svg.dataset.id=el.id;
    svg.style.cssText=`position:absolute;left:${el.x*(window._RZ?.x||1)-half}px;top:${el.y*(window._RZ?.y||1)-half}px;`+
      `width:${sz}px;height:${sz}px;cursor:grab;pointer-events:auto;z-index:20;`+
      `transform:rotate(${rot}deg) scale(${sc});transform-origin:${half}px ${half}px;`;
    fMaster.appendChild(svg);
    return;
  }

  // Material y balón — usamos un div posicionado con left/top exacto
  const div=document.createElement('div');
  div.className='object'+(isSel?' sel':'');
  div.dataset.id=el.id;
  div.style.position='absolute';
  div.style.background='transparent';
  div.style.cursor='grab';
  div.style.pointerEvents='auto';
  div.style.zIndex='20';
  div.style.transformOrigin='center center';

  if(el.type==='ball'){
    div.style.width='28px'; div.style.height='28px';
    div.style.left=(el.x*(window._RZ?.x||1)-14)+'px';
    div.style.top =(el.y*(window._RZ?.y||1)-14)+'px';
    div.style.transform=`rotate(${rot}deg) scale(${sc})`;
    // Carga el archivo externo como fondo ajustado al div
    div.style.backgroundImage="url('balon.svg')";
    div.style.backgroundSize="100% 100%";
    div.style.backgroundRepeat="no-repeat";
  } else if(el.type==='cone'||el.type==='cone_low'){
    const bw=el.type==='cone'?14:12;
    const bh=el.type==='cone'?28:14;
    div.style.width='0'; div.style.height='0';
    div.style.borderLeft=`${bw}px solid transparent`;
    div.style.borderRight=`${bw}px solid transparent`;
    div.style.borderBottom=`${bh}px solid ${el.color||(el.type==='cone'?'#e67e22':'#e74c3c')}`;
    div.style.filter='drop-shadow(0 2px 3px rgba(0,0,0,.4))';
    div.style.left=(el.x*(window._RZ?.x||1)-bw)+'px'; div.style.top=(el.y*(window._RZ?.y||1)-bh/2)+'px';
    div.style.transform=`rotate(${rot}deg) scale(${sc})`;
  } else if(el.type==='pica'){
    div.style.width='6px'; div.style.height='52px';
    div.style.background=`linear-gradient(${el.color||'#f1c40f'},#e67e22 60%,#c0392b)`;
    div.style.borderRadius='3px 3px 1px 1px';
    div.style.left=(el.x*(window._RZ?.x||1)-3)+'px'; div.style.top=(el.y*(window._RZ?.y||1)-26)+'px';
    div.style.transform=`rotate(${rot}deg) scale(${sc})`;
  } else if(el.type==='valla'){
    div.style.width='48px'; div.style.height='27px';
    div.style.border=`4px solid ${el.color||'#e74c3c'}`;
    div.style.borderBottom='none';
    div.style.borderRadius='5px 5px 0 0';
    div.style.left=(el.x*(window._RZ?.x||1)-24)+'px'; div.style.top=(el.y*(window._RZ?.y||1)-13)+'px';
    div.style.transform=`rotate(${rot}deg) scale(${sc})`;
  } else if(el.type==='ladder'){
    div.style.width='155px'; div.style.height='33px';
    div.style.borderTop=`4px solid ${el.color||'#f1c40f'}`;
    div.style.borderBottom=`4px solid ${el.color||'#f1c40f'}`;
    div.style.backgroundImage=`repeating-linear-gradient(90deg,transparent,transparent 22px,${el.color||'#f1c40f'} 22px,${el.color||'#f1c40f'} 26px)`;
    div.style.left=(el.x*(window._RZ?.x||1)-77)+'px'; div.style.top=(el.y*(window._RZ?.y||1)-16)+'px';
    div.style.transform=`rotate(${rot}deg) scale(${sc})`;
  } else if(el.type==='weight'){
    div.style.width='30px'; div.style.height='19px';
    div.style.background='linear-gradient(180deg,#bdc3c7,#7f8c8d)';
    div.style.borderRadius='4px';
    div.style.left=(el.x*(window._RZ?.x||1)-15)+'px'; div.style.top=(el.y*(window._RZ?.y||1)-9)+'px';
    div.style.transform=`rotate(${rot}deg) scale(${sc})`;
  }

  fMaster.appendChild(div);
}

function makeShirt(c1,c2,striped,num,numColor,isSelected){
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('width',38);svg.setAttribute('height',38);svg.setAttribute('viewBox','0 0 38 38');
  svg.classList.add('shirt-svg');
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
  // Ring de selección dentro del SVG (círculo, no rectángulo)
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

// ── PAINT ZONE ───────────────────────────────────────────────
function paintZone(el){
  const div=document.createElement('div');
  div.className='zone-obj'+(activeId===el.id?' sel':'')+(el.locked?' locked':'');
  div.dataset.id=el.id;
  div.style.left=(el.x*(window._RZ?.x||1))+'px';div.style.top=(el.y*(window._RZ?.y||1))+'px';
  div.style.width=(el.w*(window._RZ?.x||1))+'px';div.style.height=(el.h*(window._RZ?.y||1))+'px';
  div.style.borderColor=el.color||'#ffffff';
  div.style.borderStyle=el.sub==='fill'?'solid':'dashed';
  div.style.background=el.sub==='fill'?(el.color||'#fff')+'33':'transparent';
  div.style.pointerEvents='auto'; // siempre clickeable (drag bloqueado en onMove)
  if(activeId===el.id&&!el.locked){
    const sh=document.createElement('div');sh.className='zone-sh';sh.dataset.id=el.id;sh.textContent='⤡';div.appendChild(sh);
  }
  if(el.locked){const lk=document.createElement('div');lk.className='zone-lock';lk.textContent='🔒';div.appendChild(lk);}
  fMaster.appendChild(div);
}

// ── PAINT VECTOR ─────────────────────────────────────────────
// ── PAINT TEXT ───────────────────────────────────────────────
function paintTxt(el){
  const div=document.createElement('div');
  div.className='txt-obj'+(activeId===el.id?' sel':'');
  div.dataset.id=el.id;
  const fs=el.fontSize||32;
  const rot=el.rot||0;
  const isSel=activeId===el.id;
  // Anclar en top-left (el.x, el.y) SIN transform de desplazamiento.
  // Así el drag (+=dx/dy) es 1:1 con el movimiento del dedo/ratón.
  div.style.cssText=
    `position:absolute;left:${el.x*getZoom()}px;top:${el.y*getZoom()}px;`+
    `display:inline-block;`+   /* ajusta el div al ancho exacto del texto */
    `color:${el.color||'#ffffff'};font-size:${fs}px;`+  /* font-size explícito, no hereda :0 del vp */
    `font-family:'Barlow Condensed',sans-serif;font-weight:800;`+
    `white-space:nowrap;line-height:${fs}px;cursor:grab;pointer-events:auto;`+
    `background:transparent;z-index:20;overflow:visible;`+
    (rot?`transform:rotate(${rot}deg);`:'') +
    (isSel?`text-shadow:0 0 8px #f1c40f,1px 1px 4px rgba(0,0,0,0.8);outline:1.5px dashed #f1c40f;outline-offset:4px;`:
            `text-shadow:1px 1px 4px rgba(0,0,0,0.8);`);
  div.textContent=el.text;
  if(isSel){
    const sh=document.createElement('div');
    sh.className='zone-sh txt-sh';sh.dataset.id=el.id;sh.textContent='⤡';
    sh.style.cssText='position:absolute;bottom:-14px;right:-14px;z-index:30;width:16px;height:16px;font-size:10px;';
    div.appendChild(sh);
  }
  fMaster.appendChild(div);
}

function paintVec(el){
  let d='';
  if(el.sub==='line')d=`M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`;
  else if(el.sub==='curve')d=`M ${el.x1} ${el.y1} C ${el.cx1} ${el.cy1},${el.cx2} ${el.cy2},${el.x2} ${el.y2}`;
  else if(el.sub==='poly'&&el.pts?.length>1)d=el.pts.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');
  if(!d)return;
  const col=el.color||'#000000'; ensureMarker(col);
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('d',d);p.setAttribute('stroke',col);p.setAttribute('stroke-width','3.5');p.setAttribute('fill','none');
  p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');
  if(el.dashed)p.setAttribute('stroke-dasharray','10 6');
  if(el.arrow) p.setAttribute('marker-end',`url(#mk-${col.replace('#','')})`);
  p.classList.add('v-el');svgLayer.appendChild(p);
  const hit=document.createElementNS('http://www.w3.org/2000/svg','path');
  hit.setAttribute('d',d);hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width','26');hit.setAttribute('fill','none');
  hit.classList.add('vec-hit','v-el');hit.dataset.id=el.id;hit.style.pointerEvents='auto';svgLayer.appendChild(hit);
}

function ensureMarker(color){
  const id='mk-'+color.replace('#','');
  const defs=svgLayer.querySelector('defs');
  if(!defs||defs.querySelector('#'+id))return;
  const mk=document.createElementNS('http://www.w3.org/2000/svg','marker');
  mk.setAttribute('id',id);mk.setAttribute('markerWidth','8');mk.setAttribute('markerHeight','6');
  mk.setAttribute('refX','7');mk.setAttribute('refY','3');mk.setAttribute('orient','auto');
  const pl=document.createElementNS('http://www.w3.org/2000/svg','polygon');
  pl.setAttribute('points','0 0,8 3,0 6');pl.setAttribute('fill',color);
  mk.appendChild(pl);defs.appendChild(mk);
}

function mkN(el,nx,ny,fx,fy,ctrl=false){
  // Escalar coordenadas del canvas (0..FW, 0..FH) al tamaño real del campo
  const n=document.createElement('div');n.className='node'+(ctrl?' ctrl':'');
  n.style.left=(fx*(window._RZ?.x||1))+'px';n.style.top=(fy*(window._RZ?.y||1))+'px';
  n.dataset.id=el.id;n.dataset.nx=nx;
  if(ny!=null)n.dataset.ny=ny;
  const i=document.createElement('div');i.className='node-in';n.appendChild(i);fMaster.appendChild(n);
}

// ── INSPECTOR ────────────────────────────────────────────────
function syncInspector(el){
  if(!el)return;
  const isVec=el.type==='vec', isPly=['A','B','C','D'].includes(el.type), isZone=el.type==='zone', isTxt=el.type==='txt';
  show('r-color'); setv('ins-color',el.color||(isPly?TC[el.type].c1:isTxt?'#ffffff':'#000000'));
  tog('r-arrow',isVec);tog('r-dash',isVec);
  if(isVec){setck('ins-arrow',!!el.arrow);setck('ins-dash',!!el.dashed);}
  tog('r-num',isPly);tog('r-strtog',isPly);tog('r-stripe',isPly&&el.striped);
  tog('r-numcolor',isPly);
  if(isPly){setv('ins-num',el.num||1);setck('ins-strtog',!!el.striped);setv('ins-stripe',el.stripeColor||TC[el.type].c2);setv('ins-numcolor',el.numColor||'#ffffff');}
  // Bloqueo: visible solo para zonas
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

// ── CREAR ELEMENTOS ──────────────────────────────────────────
function createPlayer(team){
  saveState();const id=uid();
  steps[curStep].push({id,type:team,x:clamp(300+Math.random()*400,20,FW-20),y:clamp(180+Math.random()*300,20,FH-20),
    num:steps[curStep].filter(o=>o.type===team).length+1,color:TC[team].c1,stripeColor:TC[team].c2,striped:false,scale:1,rot:0});
  activeId=id;render();syncInspector(steps[curStep].find(o=>o.id===id));
}
function createItem(type){
  saveState();const id=uid();
  const CM={cone:'#e67e22',cone_low:'#e74c3c',pica:'#f1c40f',valla:'#e74c3c',ladder:'#f1c40f',weight:'#95a5a6'};
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
  // Tipo 'txt' propio para simplificar lógica (no depende de 'vec')
  // x,y = top-left del texto (sin translate para evitar saltos)
  steps[curStep].push({id,type:'txt',text:txt.trim(),
    x:Math.round(FW*0.35),y:Math.round(FH*0.45),fontSize:32,color:'#ffffff',rot:0});
  activeId=id;render();syncInspector(steps[curStep].find(o=>o.id===id));
}

function createZone(sub){
  saveState();const id=uid();
  steps[curStep].push({id,type:'zone',sub,x:200,y:150,w:250,h:180,color:'#ffffff',locked:false});
  activeId=id;render();syncInspector(steps[curStep].find(o=>o.id===id));
}

// ── CAMPO ────────────────────────────────────────────────────
function setField(val){
  currentField=val;
  drawFieldBG(val);
}

// ── EQUIPOS ──────────────────────────────────────────────────
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

// ── PASOS ────────────────────────────────────────────────────
function navStep(d){const n=curStep+d;if(n<0||n>=steps.length)return;curStep=n;deselect();}
function addStep(){saveState();steps.splice(curStep+1,0,JSON.parse(JSON.stringify(steps[curStep])));curStep++;deselect();}

// ── ANIMACIÓN ────────────────────────────────────────────────
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

// ── BIBLIOTECA ───────────────────────────────────────────────
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

function openLibrary(){
  const g=document.getElementById('lib-grid');g.innerHTML='';
  DRILLS.forEach(d=>{
    const c=document.createElement('div');c.className='lcard';
    c.innerHTML=`<div class="licon">${d.icon}</div><div class="lname">${d.name}</div><div class="ldesc">${d.desc}</div>`;
    c.onclick=()=>injectDrill(d);g.appendChild(c);
  });
  openModal('m-lib');
}
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

// ── MODALES ──────────────────────────────────────────────────
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function openResetMenu(){openModal('m-reset');}

// ── EXPORTAR PNG ─────────────────────────────────────────────
async function exportPNG(){
  deselect();await tick(80);
  html2canvas(fMaster,{scale:2,useCORS:true,backgroundColor:null}).then(c=>{
    dl(c.toDataURL('image/png'),`tactica_paso${curStep+1}_${Date.now()}.png`);
  });
}

// ── EXPORTAR VÍDEO ───────────────────────────────────────────
function exportVideo(){if(steps.length<2){alert('Añade al menos 2 pasos');return;}openModal('m-export');}
function setProg(p,m){document.getElementById('pbar-fill').style.width=p+'%';document.getElementById('exp-status').textContent=m;}
async function startExport(fmt){
  document.getElementById('exp-prog').style.display='block';setProg(2,'Preparando...');
  try{if(fmt==='mp4')await doMP4();else await doGIF();}
  catch(err){console.error(err);alert('Error: '+err.message);closeModal('m-export');}
}
function renderForExport(f1,f2,ease){
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
async function doMP4(){
  // Ocultar box-shadow durante la captura para evitar sombra negra en el video
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
      snaps.push(await html2canvas(fMaster,{scale:1,useCORS:true,backgroundColor:fMaster.style.background||'#2d8a47',logging:false}));
      setProg(5+Math.round(((i*fp+f+1)/total)*55),`Frame ${i*fp+f+1}/${total}`);
    }
  }
  renderForExport(steps[steps.length-1],steps[steps.length-1],0);await tick(60);
  const ls=await html2canvas(fMaster,{scale:1,useCORS:true,backgroundColor:fMaster.style.background||'#2d8a47',logging:false});
  for(let k=0;k<FPS;k++)snaps.push(ls);
  isPlaying=false;fMaster.style.boxShadow=origShadow;render();setProg(62,'Ensamblando WebM...');
  const mime=['video/webm;codecs=vp8,opus','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  const stream=rc.captureStream(FPS),rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4e6}),chunks=[];
  rec.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};rec.start();
  for(let i=0;i<snaps.length;i++){ctx.drawImage(snaps[i],0,0,W,H);await tick(1000/FPS);setProg(62+Math.round((i/snaps.length)*20),'Ensamblando...');}
  rec.stop();
  const wb=await new Promise(r=>{rec.onstop=()=>r(new Blob(chunks,{type:'video/webm'}));});
  setProg(83,'Convirtiendo a MP4...');
  try{
    const mp4=await toMP4(wb,p=>setProg(83+Math.round(p*14),`MP4 ${Math.round(p*100)}%`));
    setProg(100,'¡Listo!');await tick(400);dl(URL.createObjectURL(mp4),`tactica_${Date.now()}.mp4`);closeModal('m-export');
  }catch(err){
    setProg(100,'Descargando WebM...');await tick(600);dl(URL.createObjectURL(wb),`tactica_${Date.now()}.webm`);closeModal('m-export');
  }
}
let _ff=null;
async function getFF(){
  if(_ff)return _ff;
  if(!window.FFmpeg)     await loadSrc('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js');
  if(!window.FFmpegUtil) await loadSrc('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/umd/index.js');
  const{FFmpeg}=window.FFmpeg,{fetchFile,toBlobURL}=window.FFmpegUtil;
  window._ffFetch=fetchFile;
  const ff=new FFmpeg();
  const b='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
  await ff.load({coreURL:await toBlobURL(`${b}/ffmpeg-core.js`,'text/javascript'),wasmURL:await toBlobURL(`${b}/ffmpeg-core.wasm`,'application/wasm')});
  _ff=ff;return ff;
}
async function toMP4(blob,onP){
  const ff=await getFF();await ff.writeFile('i.webm',await window._ffFetch(blob));
  let p=0;const t=setInterval(()=>{p=Math.min(p+.04,.92);onP(p);},300);
  await ff.exec(['-i','i.webm','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart','-an','o.mp4']);
  clearInterval(t);onP(1);const d=await ff.readFile('o.mp4');return new Blob([d.buffer],{type:'video/mp4'});
}
function loadSrc(src){
  return new Promise((res,rej)=>{
    if(document.querySelector(`script[src="${src}"]`)){res();return;}
    const s=document.createElement('script');s.src=src;s.crossOrigin='anonymous';
    s.onload=res;s.onerror=()=>rej(new Error('No cargó: '+src));document.head.appendChild(s);
  });
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
    gif.addFrame(await html2canvas(fMaster,{scale:1,useCORS:true,backgroundColor:fMaster.style.background||'#2d8a47',logging:false}),{delay:Math.round(1000/FPS),copy:true});
    done++;setProg(5+Math.round((done/total)*80),`Frame ${done}/${total}`);
  }
  isPlaying=false;render();setProg(88,'Compilando GIF...');
  gif.on('progress',p=>setProg(88+Math.round(p*10),'Compilando...'));
  gif.on('finished',blob=>{setProg(100,'¡Listo!');setTimeout(()=>{dl(URL.createObjectURL(blob),`tactica_${Date.now()}.gif`);closeModal('m-export');},400);});
  gif.render();
}

// ── PANTALLA COMPLETA ─────────────────────────────────────────
function toggleFullscreen(){
  if(!document.fullscreenElement){document.documentElement.requestFullscreen().catch(e=>console.warn(e));}
  else{document.exitFullscreen().catch(e=>console.warn(e));}
}

// ── UTILIDADES ───────────────────────────────────────────────
function saveState(){if(history.length>40)history.shift();history.push(JSON.stringify(steps));}
function undo(){if(!history.length)return;steps=JSON.parse(history.pop());if(curStep>=steps.length)curStep=steps.length-1;render();}
function deselect(){activeId=null;if(isDrawingPoly)finishPoly();render();}
function dupActive(){
  if(!activeId)return;saveState();
  const o=steps[curStep].find(x=>x.id===activeId);if(!o)return;
  const c=JSON.parse(JSON.stringify(o));c.id=uid();
  if(c.type==='zone'){c.x=clamp(c.x+20,0,FW-c.w);c.y=clamp(c.y+20,0,FH-c.h);}
  else if(c.type!=='vec'){c.x=clamp(c.x+40,0,FW);c.y=clamp(c.y+40,0,FH);}
  steps[curStep].push(c);activeId=c.id;render();
}
function delActive(){if(!activeId)return;saveState();steps[curStep]=steps[curStep].filter(o=>o.id!==activeId);activeId=null;render();}
function doReset(t){saveState();if(t==='step')steps[curStep]=[];else{steps=[[]];curStep=0;}closeModal('m-reset');deselect();}
function uid(){return(++idCounter)+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function tick(ms){return new Promise(r=>setTimeout(r,ms));}
function dl(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.click();}
function isLight(hex){if(!hex||hex.length<7)return false;const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return(r*299+g*587+b*114)/1000>155;}
