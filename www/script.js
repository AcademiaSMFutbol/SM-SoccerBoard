/* ============================================================
   SM SoccerBoard Pro v72 — script.js
   © Academia SM Fútbol — Las Palmas de Gran Canaria
   ============================================================ */

// ── ESTADO GLOBAL ────────────────────────────────────────────
let steps    = [[]];
let history  = [];
let curStep  = 0;
let activeId = null;
let dragInfo = null;
let isPlaying      = false;
let isDrawingPoly  = false;
let activePointers = new Map();
let initialPinchDist = null;
let tapStartX = 0, tapStartY = 0;
let isPossibleTap = false;
let idCounter = 1;

const FIELD_W = 1050, FIELD_H = 680;
const ANIMATE_TYPES = new Set(['A','B','C','D','ball']);

let teamColors = {
  A: { c1:'#e63946', c2:'#ffffff' },
  B: { c1:'#2e86de', c2:'#ffffff' },
  C: { c1:'#f1c40f', c2:'#000000' },
  D: { c1:'#2ecc71', c2:'#ffffff' }
};

const fMaster  = document.getElementById('field-master');
const svgLayer = document.getElementById('svg-layer');
const viewport = document.getElementById('viewport');

// ── BIBLIOTECA ───────────────────────────────────────────────
const drillLibrary = [
  {
    key:'rondo41', name:'Rondo 4x1', icon:'🔵', desc:'Posesión 4 vs 1',
    steps:[
      [
        {_bid:'z1',type:'zone',sub:'line',x:340,y:180,w:290,h:290,color:'#ffffff',locked:false},
        {_bid:'a1',type:'A',x:340,y:180,num:1,striped:false},
        {_bid:'a2',type:'A',x:630,y:180,num:2,striped:false},
        {_bid:'a3',type:'A',x:340,y:470,num:3,striped:false},
        {_bid:'a4',type:'A',x:630,y:470,num:4,striped:false},
        {_bid:'b1',type:'B',x:485,y:325,num:1,striped:false},
        {_bid:'bl',type:'ball',x:340,y:180}
      ],
      [
        {_bid:'z1',type:'zone',sub:'line',x:340,y:180,w:290,h:290,color:'#ffffff',locked:false},
        {_bid:'a1',type:'A',x:340,y:180,num:1,striped:false},
        {_bid:'a2',type:'A',x:630,y:180,num:2,striped:false},
        {_bid:'a3',type:'A',x:340,y:470,num:3,striped:false},
        {_bid:'a4',type:'A',x:630,y:470,num:4,striped:false},
        {_bid:'b1',type:'B',x:415,y:245,num:1,striped:false},
        {_bid:'bl',type:'ball',x:630,y:180},
        {_bid:'v1',type:'vec',sub:'line',x1:345,y1:182,x2:618,y2:182,color:'#000000',arrow:true,dashed:false}
      ],
      [
        {_bid:'z1',type:'zone',sub:'line',x:340,y:180,w:290,h:290,color:'#ffffff',locked:false},
        {_bid:'a1',type:'A',x:340,y:180,num:1,striped:false},
        {_bid:'a2',type:'A',x:630,y:180,num:2,striped:false},
        {_bid:'a3',type:'A',x:340,y:470,num:3,striped:false},
        {_bid:'a4',type:'A',x:630,y:470,num:4,striped:false},
        {_bid:'b1',type:'B',x:555,y:345,num:1,striped:false},
        {_bid:'bl',type:'ball',x:340,y:470},
        {_bid:'v1',type:'vec',sub:'line',x1:628,y1:182,x2:352,y2:458,color:'#000000',arrow:true,dashed:false}
      ]
    ]
  },
  {
    key:'rondo42', name:'Rondo 4x2', icon:'🟦', desc:'Posesión 4 vs 2',
    steps:[
      [
        {_bid:'z1',type:'zone',sub:'line',x:320,y:170,w:310,h:310,color:'#ffffff',locked:false},
        {_bid:'a1',type:'A',x:320,y:170,num:1,striped:false},
        {_bid:'a2',type:'A',x:630,y:170,num:2,striped:false},
        {_bid:'a3',type:'A',x:320,y:480,num:3,striped:false},
        {_bid:'a4',type:'A',x:630,y:480,num:4,striped:false},
        {_bid:'b1',type:'B',x:450,y:295,num:1,striped:false},
        {_bid:'b2',type:'B',x:530,y:355,num:2,striped:false},
        {_bid:'bl',type:'ball',x:320,y:170}
      ],
      [
        {_bid:'z1',type:'zone',sub:'line',x:320,y:170,w:310,h:310,color:'#ffffff',locked:false},
        {_bid:'a1',type:'A',x:320,y:170,num:1,striped:false},
        {_bid:'a2',type:'A',x:630,y:170,num:2,striped:false},
        {_bid:'a3',type:'A',x:320,y:480,num:3,striped:false},
        {_bid:'a4',type:'A',x:630,y:480,num:4,striped:false},
        {_bid:'b1',type:'B',x:390,y:250,num:1,striped:false},
        {_bid:'b2',type:'B',x:480,y:330,num:2,striped:false},
        {_bid:'bl',type:'ball',x:630,y:480},
        {_bid:'v1',type:'vec',sub:'line',x1:322,y1:172,x2:618,y2:473,color:'#000000',arrow:true,dashed:false}
      ]
    ]
  },
  {
    key:'transicion', name:'Transición 3v2', icon:'⚡', desc:'Ataque rápido',
    steps:[
      [
        {_bid:'a1',type:'A',x:200,y:340,num:1,striped:false},
        {_bid:'a2',type:'A',x:340,y:220,num:2,striped:false},
        {_bid:'a3',type:'A',x:340,y:460,num:3,striped:false},
        {_bid:'b1',type:'B',x:650,y:280,num:1,striped:false},
        {_bid:'b2',type:'B',x:650,y:400,num:2,striped:false},
        {_bid:'bl',type:'ball',x:200,y:340}
      ],
      [
        {_bid:'a1',type:'A',x:400,y:340,num:1,striped:false},
        {_bid:'a2',type:'A',x:540,y:210,num:2,striped:false},
        {_bid:'a3',type:'A',x:540,y:470,num:3,striped:false},
        {_bid:'b1',type:'B',x:680,y:280,num:1,striped:false},
        {_bid:'b2',type:'B',x:680,y:400,num:2,striped:false},
        {_bid:'bl',type:'ball',x:400,y:340},
        {_bid:'v1',type:'vec',sub:'line',x1:202,y1:340,x2:390,y2:340,color:'#000000',arrow:true,dashed:false}
      ],
      [
        {_bid:'a1',type:'A',x:580,y:340,num:1,striped:false},
        {_bid:'a2',type:'A',x:720,y:200,num:2,striped:false},
        {_bid:'a3',type:'A',x:720,y:490,num:3,striped:false},
        {_bid:'b1',type:'B',x:710,y:275,num:1,striped:false},
        {_bid:'b2',type:'B',x:710,y:405,num:2,striped:false},
        {_bid:'bl',type:'ball',x:720,y:200},
        {_bid:'v1',type:'vec',sub:'line',x1:402,y1:338,x2:708,y2:205,color:'#000000',arrow:true,dashed:false}
      ]
    ]
  },
  {
    key:'presion', name:'Presión alta', icon:'🔴', desc:'Salida presionada',
    steps:[
      [
        {_bid:'a1',type:'A',x:200,y:340,num:1,striped:false},
        {_bid:'b1',type:'B',x:300,y:240,num:1,striped:false},
        {_bid:'b2',type:'B',x:300,y:440,num:2,striped:false},
        {_bid:'b3',type:'B',x:175,y:340,num:3,striped:false},
        {_bid:'bl',type:'ball',x:200,y:340}
      ],
      [
        {_bid:'a1',type:'A',x:200,y:340,num:1,striped:false},
        {_bid:'b1',type:'B',x:238,y:278,num:1,striped:false},
        {_bid:'b2',type:'B',x:238,y:402,num:2,striped:false},
        {_bid:'b3',type:'B',x:182,y:340,num:3,striped:false},
        {_bid:'bl',type:'ball',x:200,y:340},
        {_bid:'v1',type:'vec',sub:'curve',x1:300,y1:242,cx1:278,cy1:278,cx2:253,cy2:273,x2:240,y2:280,color:'#000000',arrow:true,dashed:false},
        {_bid:'v2',type:'vec',sub:'curve',x1:300,y1:438,cx1:278,cy1:420,cx2:253,cy2:407,x2:240,y2:400,color:'#000000',arrow:true,dashed:false}
      ]
    ]
  },
  {
    key:'circuito', name:'Circuito técnico', icon:'🏃', desc:'Conducción + pase',
    steps:[
      [
        {_bid:'c1',type:'cone',x:250,y:310,rot:0,scale:1,color:'#e67e22'},
        {_bid:'c2',type:'cone',x:350,y:310,rot:0,scale:1,color:'#e67e22'},
        {_bid:'c3',type:'cone',x:450,y:310,rot:0,scale:1,color:'#e67e22'},
        {_bid:'c4',type:'cone',x:550,y:310,rot:0,scale:1,color:'#e67e22'},
        {_bid:'pk',type:'pica',x:650,y:310,rot:0,scale:1,color:'#f1c40f'},
        {_bid:'a1',type:'A',x:170,y:310,num:1,striped:false},
        {_bid:'bl',type:'ball',x:170,y:310}
      ],
      [
        {_bid:'c1',type:'cone',x:250,y:310,rot:0,scale:1,color:'#e67e22'},
        {_bid:'c2',type:'cone',x:350,y:310,rot:0,scale:1,color:'#e67e22'},
        {_bid:'c3',type:'cone',x:450,y:310,rot:0,scale:1,color:'#e67e22'},
        {_bid:'c4',type:'cone',x:550,y:310,rot:0,scale:1,color:'#e67e22'},
        {_bid:'pk',type:'pica',x:650,y:310,rot:0,scale:1,color:'#f1c40f'},
        {_bid:'a1',type:'A',x:650,y:310,num:1,striped:false},
        {_bid:'bl',type:'ball',x:650,y:310},
        {_bid:'v1',type:'vec',sub:'poly',pts:[{x:172,y:310},{x:300,y:268},{x:400,y:335},{x:500,y:268},{x:648,y:310}],color:'#000000',arrow:true,dashed:false}
      ]
    ]
  },
  {
    key:'corner', name:'Córner ensayado', icon:'🏁', desc:'Jugada a balón parado',
    steps:[
      [
        {_bid:'a1',type:'A',x:950,y:620,num:1,striped:false},
        {_bid:'a2',type:'A',x:800,y:400,num:2,striped:false},
        {_bid:'a3',type:'A',x:820,y:480,num:3,striped:false},
        {_bid:'a4',type:'A',x:750,y:320,num:4,striped:false},
        {_bid:'b1',type:'B',x:830,y:400,num:1,striped:false},
        {_bid:'b2',type:'B',x:840,y:480,num:2,striped:false},
        {_bid:'bl',type:'ball',x:1020,y:650}
      ],
      [
        {_bid:'a1',type:'A',x:950,y:620,num:1,striped:false},
        {_bid:'a2',type:'A',x:845,y:378,num:2,striped:false},
        {_bid:'a3',type:'A',x:820,y:440,num:3,striped:false},
        {_bid:'a4',type:'A',x:762,y:298,num:4,striped:false},
        {_bid:'b1',type:'B',x:862,y:390,num:1,striped:false},
        {_bid:'b2',type:'B',x:857,y:468,num:2,striped:false},
        {_bid:'bl',type:'ball',x:845,y:378},
        {_bid:'v1',type:'vec',sub:'curve',x1:1020,y1:650,cx1:980,cy1:500,cx2:900,cy2:380,x2:847,y2:380,color:'#000000',arrow:true,dashed:false}
      ]
    ]
  }
];

// ── INIT ─────────────────────────────────────────────────────
window.onload = () => { resizeField(); updateAllSwatches(); updateSpeedLabel(); render(); };
window.addEventListener('resize', resizeField);
document.getElementById('speed-slider').addEventListener('input', updateSpeedLabel);

function updateSpeedLabel() {
  document.getElementById('speed-value').textContent = `${document.getElementById('speed-slider').value}ms / paso`;
}

// FIX móvil: sin margen, campo ocupa todo el viewport
function resizeField() {
  const vp = viewport.getBoundingClientRect();
  const s  = Math.min(vp.width / FIELD_W, vp.height / FIELD_H);
  fMaster.style.transform = `scale(${Math.max(0.05, s)})`;
}

function newId() { return (++idCounter)+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,5); }
function clamp(v,mn,mx){ return Math.max(mn,Math.min(mx,v)); }

// ── PUNTERO ──────────────────────────────────────────────────
viewport.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove',  onPointerMove);
window.addEventListener('pointerup',    onPointerUp);

function onPointerDown(e) {
  if (isPlaying) return;
  tapStartX=e.clientX; tapStartY=e.clientY; isPossibleTap=true;
  const hit   = e.target.closest('.object,.vec-hit,.zone-obj,.node,.zone-scale-handle');
  const hitId = hit ? hit.dataset.id : null;
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const rect=fMaster.getBoundingClientRect(), zoom=rect.width/FIELD_W;

  if (isDrawingPoly && activeId) {
    const el=steps[curStep].find(o=>o.id===activeId);
    if (el) { el.pts.push({x:clamp((e.clientX-rect.left)/zoom,0,FIELD_W),y:clamp((e.clientY-rect.top)/zoom,0,FIELD_H)}); render(); }
    return;
  }

  if (activePointers.size===1) {
    const wasSelected=(activeId===hitId&&hitId!=null);
    activeId=hitId||null;

    if (activeId) {
      const el=steps[curStep].find(o=>o.id===activeId);
      // Zona bloqueada: ignorar clic para dejar colocar objetos encima
      if (el&&el.locked&&el.type==='zone'){activeId=null;render();return;}
      if (el&&(wasSelected||(hit&&(hit.classList.contains('node')||hit.classList.contains('zone-scale-handle'))))) {
        saveState();
        dragInfo={el,isScaleHandle:hit&&hit.classList.contains('zone-scale-handle'),
          nx:hit?hit.dataset.nx:undefined,ny:hit?hit.dataset.ny:undefined,
          lastX:e.clientX,lastY:e.clientY,zoom};
      }
      updateInspector(el);
    } else { deselect(); }
  } else if (activePointers.size===2&&activeId) {
    const pts=Array.from(activePointers.values());
    initialPinchDist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  }
  render();
}

function onPointerMove(e) {
  if (!activePointers.has(e.pointerId)||isPlaying) return;
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if (isPossibleTap&&Math.hypot(e.clientX-tapStartX,e.clientY-tapStartY)>6) isPossibleTap=false;

  // Pellizco: SOLO jugadores y material (no zonas, no vectores)
  if (activePointers.size===2&&activeId&&initialPinchDist) {
    const el=steps[curStep].find(o=>o.id===activeId);
    if (el&&el.type!=='zone'&&el.type!=='vec') {
      const pts=Array.from(activePointers.values());
      const dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      el.scale=clamp((el.scale||1)*(dist/initialPinchDist),0.25,4);
      initialPinchDist=dist; render();
    }
    return;
  }

  if (!dragInfo||activePointers.size!==1||isDrawingPoly) return;
  const dx=(e.clientX-dragInfo.lastX)/dragInfo.zoom;
  const dy=(e.clientY-dragInfo.lastY)/dragInfo.zoom;
  const el=dragInfo.el;

  if (dragInfo.isScaleHandle) {
    el.w=Math.max(30,el.w+dx); el.h=Math.max(30,el.h+dy);
  } else if (dragInfo.nx!==undefined&&dragInfo.nx!=='') {
    const nx=dragInfo.nx,ny=dragInfo.ny;
    if (el.sub==='poly') {
      el.pts[nx].x=clamp(el.pts[nx].x+dx,0,FIELD_W);
      el.pts[nx].y=clamp(el.pts[nx].y+dy,0,FIELD_H);
    } else { el[nx]+=dx; el[ny]+=dy; }
  } else {
    if (el.sub==='poly') { el.pts.forEach(p=>{p.x=clamp(p.x+dx,0,FIELD_W);p.y=clamp(p.y+dy,0,FIELD_H);}); }
    else if (el.type==='vec') {
      ['x1','x2','cx1','cx2'].forEach(k=>{if(el[k]!==undefined)el[k]+=dx;});
      ['y1','y2','cy1','cy2'].forEach(k=>{if(el[k]!==undefined)el[k]+=dy;});
    } else if (el.type==='zone') {
      el.x=clamp(el.x+dx,0,FIELD_W-el.w); el.y=clamp(el.y+dy,0,FIELD_H-el.h);
    } else {
      // Jugadores y material: confinados al campo
      el.x=clamp(el.x+dx,0,FIELD_W); el.y=clamp(el.y+dy,0,FIELD_H);
    }
  }
  dragInfo.lastX=e.clientX; dragInfo.lastY=e.clientY; render();
}

function onPointerUp(e) {
  const ROTATABLE=['cone','cone_low','pica','valla','ladder','weight','ball'];
  if (isPossibleTap&&activeId&&activePointers.size===1&&!isDrawingPoly) {
    const el=steps[curStep].find(o=>o.id===activeId);
    if (el&&ROTATABLE.includes(el.type)) { el.rot=((el.rot||0)+15)%360; render(); }
  }
  activePointers.delete(e.pointerId);
  if (activePointers.size<2) initialPinchDist=null;
  dragInfo=null;
}

// ── RENDER ───────────────────────────────────────────────────
function render() {
  if (isPlaying) return;
  clearField();
  const step=steps[curStep];
  step.forEach(el=>{if(el.type==='zone')drawZone(el);});
  step.forEach(el=>{if(el.type==='vec') drawVector(el);});
  step.forEach(el=>{if(el.type!=='zone'&&el.type!=='vec')drawPhysical(el);});

  if (activeId) {
    const el=step.find(o=>o.id===activeId);
    if (el&&el.type==='vec') {
      if(el.sub==='line') {mkNode(el,'x1','y1',el.x1,el.y1);mkNode(el,'x2','y2',el.x2,el.y2);}
      if(el.sub==='curve'){mkNode(el,'x1','y1',el.x1,el.y1);mkNode(el,'cx1','cy1',el.cx1,el.cy1,true);mkNode(el,'cx2','cy2',el.cx2,el.cy2,true);mkNode(el,'x2','y2',el.x2,el.y2);}
      if(el.sub==='poly') {el.pts.forEach((p,i)=>mkNode(el,i,null,p.x,p.y));}
    }
  }
  document.getElementById('step-label').innerText=`${curStep+1} / ${steps.length}`;
  document.getElementById('inspector-panel').style.display=activeId?'block':'none';
}

function clearField() {
  Array.from(fMaster.children).forEach(c=>{if(c.id!=='svg-layer')fMaster.removeChild(c);});
  const defs=svgLayer.querySelector('defs');
  svgLayer.innerHTML='';
  if (defs) svgLayer.appendChild(defs);
}

// ── DRAW PHYSICAL ────────────────────────────────────────────
function drawPhysical(el) {
  const div=document.createElement('div');
  div.className='object'+(activeId===el.id?' selected':'');
  div.dataset.id=el.id;

  if (['A','B','C','D'].includes(el.type)) {
    const tc=teamColors[el.type];
    const c1=el.color||tc.c1;
    const c2=el.stripeColor||tc.c2;
    const inn=document.createElement('div');
    inn.className='player-obj';
    inn.style.background=el.striped
      ?`repeating-linear-gradient(90deg,${c1} 0%,${c1} 50%,${c2} 50%,${c2} 100%)`
      :c1;
    inn.style.color=isLight(c1)?'#000':'#fff';
    inn.textContent=el.num||1;
    div.appendChild(inn);
  } else if (el.type==='ball') {
    div.classList.add('ball-obj'); div.textContent='⚽';
  } else {
    const shape=document.createElement('div');
    shape.className=el.type+'-obj';
    const col=el.color;
    if(el.type==='cone')     shape.style.borderBottomColor=col||'#e67e22';
    if(el.type==='cone_low') shape.style.borderBottomColor=col||'#e74c3c';
    if(el.type==='pica')     shape.style.background=col||'#f1c40f';
    if(el.type==='valla')    shape.style.borderColor=col||'#e74c3c';
    if(el.type==='ladder')   {
      shape.style.borderTopColor=col||'#f1c40f';
      shape.style.borderBottomColor=col||'#f1c40f';
      shape.style.backgroundImage=`repeating-linear-gradient(90deg,transparent,transparent 22px,${col||'#f1c40f'} 22px,${col||'#f1c40f'} 26px)`;
    }
    div.appendChild(shape);
  }

  div.style.left=el.x+'px'; div.style.top=el.y+'px';
  div.style.transform=`translate(-50%,-50%) rotate(${el.rot||0}deg) scale(${el.scale||1})`;
  fMaster.appendChild(div);
}

// ── DRAW ZONE ────────────────────────────────────────────────
function drawZone(el) {
  const div=document.createElement('div');
  div.className='zone-obj'+(activeId===el.id?' selected':'')+(el.locked?' locked':'');
  div.dataset.id=el.id;
  div.style.left=el.x+'px'; div.style.top=el.y+'px';
  div.style.width=el.w+'px'; div.style.height=el.h+'px';
  div.style.borderColor=el.color||'#ffffff';
  div.style.borderStyle=el.sub==='fill'?'solid':'dashed';
  div.style.background=el.sub==='fill'?(el.color||'#ffffff')+'44':'transparent';
  div.style.pointerEvents=el.locked?'none':'auto';

  if (activeId===el.id&&!el.locked) {
    const h=document.createElement('div');
    h.className='zone-scale-handle'; h.dataset.id=el.id;
    div.appendChild(h);
  }
  if (el.locked) {
    const lk=document.createElement('div');
    lk.className='zone-lock-icon'; lk.textContent='🔒';
    div.appendChild(lk);
  }
  fMaster.appendChild(div);
}

// ── DRAW VECTOR ──────────────────────────────────────────────
function drawVector(el) {
  let d='';
  if(el.sub==='line')  d=`M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`;
  else if(el.sub==='curve') d=`M ${el.x1} ${el.y1} C ${el.cx1} ${el.cy1}, ${el.cx2} ${el.cy2}, ${el.x2} ${el.y2}`;
  else if(el.sub==='poly'&&el.pts&&el.pts.length>1)
    d=el.pts.map((p,i)=>`${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
  if(!d)return;

  const col=el.color||'#000000';
  ensureArrowMarker(col);

  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d',d); path.setAttribute('stroke',col);
  path.setAttribute('stroke-width','3.5'); path.setAttribute('fill','none');
  path.setAttribute('stroke-linecap','round'); path.setAttribute('stroke-linejoin','round');
  if(el.dashed) path.setAttribute('stroke-dasharray','10 7');
  if(el.arrow)  path.setAttribute('marker-end',`url(#arrow-${col.replace('#','')})`);
  path.classList.add('v-el'); svgLayer.appendChild(path);

  const hit=document.createElementNS('http://www.w3.org/2000/svg','path');
  hit.setAttribute('d',d); hit.setAttribute('stroke','transparent');
  hit.setAttribute('stroke-width','28'); hit.setAttribute('fill','none');
  hit.classList.add('vec-hit','v-el'); hit.dataset.id=el.id;
  hit.style.pointerEvents='auto'; svgLayer.appendChild(hit);
}

function ensureArrowMarker(color) {
  const id='arrow-'+color.replace('#','');
  const defs=svgLayer.querySelector('defs');
  if(!defs||defs.querySelector('#'+id))return;
  const mk=document.createElementNS('http://www.w3.org/2000/svg','marker');
  mk.setAttribute('id',id);mk.setAttribute('markerWidth','8');mk.setAttribute('markerHeight','6');
  mk.setAttribute('refX','7');mk.setAttribute('refY','3');mk.setAttribute('orient','auto');
  const pl=document.createElementNS('http://www.w3.org/2000/svg','polygon');
  pl.setAttribute('points','0 0, 8 3, 0 6');pl.setAttribute('fill',color);
  mk.appendChild(pl);defs.appendChild(mk);
}

// ── NODOS ────────────────────────────────────────────────────
function mkNode(el,nx,ny,fx,fy,isCtrl=false) {
  const n=document.createElement('div');
  n.className='node'+(isCtrl?' node-ctrl':'');
  n.style.left=fx+'px'; n.style.top=fy+'px';
  n.dataset.id=el.id; n.dataset.nx=nx;
  if(ny!==null&&ny!==undefined)n.dataset.ny=ny;
  const i=document.createElement('div');i.className='node-in';n.appendChild(i);
  fMaster.appendChild(n);
}

// ── INSPECTOR ────────────────────────────────────────────────
function updateInspector(el) {
  if(!el)return;
  const isVec=el.type==='vec', isPlayer=['A','B','C','D'].includes(el.type), isZone=el.type==='zone';

  document.getElementById('ins-color-row').style.display='flex';
  document.getElementById('ins-color').value=el.color||(isPlayer?teamColors[el.type].c1:'#000000');

  document.getElementById('ins-arrow-row').style.display=isVec?'flex':'none';
  document.getElementById('ins-dash-row').style.display=isVec?'flex':'none';
  if(isVec){document.getElementById('ins-arrow').checked=!!el.arrow;document.getElementById('ins-dash').checked=!!el.dashed;}

  document.getElementById('ins-num-row').style.display=isPlayer?'flex':'none';
  document.getElementById('ins-stripe-toggle-row').style.display=isPlayer?'flex':'none';
  document.getElementById('ins-stripe-row').style.display=(isPlayer&&el.striped)?'flex':'none';
  if(isPlayer){
    document.getElementById('ins-num').value=el.num||1;
    document.getElementById('ins-stripe-toggle').checked=!!el.striped;
    document.getElementById('ins-stripe').value=el.stripeColor||teamColors[el.type].c2;
  }

  document.getElementById('ins-lock-row').style.display=isZone?'flex':'none';
  if(isZone)document.getElementById('ins-lock').checked=!!el.locked;

  document.getElementById('btn-finish-poly').style.display=(isVec&&el.sub==='poly'&&isDrawingPoly)?'block':'none';
}

function modifyProp(prop,val) {
  const el=steps[curStep].find(o=>o.id===activeId); if(!el)return;
  el[prop]=val; render();
}
function toggleStripe(on) {
  const el=steps[curStep].find(o=>o.id===activeId); if(!el)return;
  el.striped=on; document.getElementById('ins-stripe-row').style.display=on?'flex':'none'; render();
}
function toggleZoneLock(on) {
  const el=steps[curStep].find(o=>o.id===activeId); if(!el)return;
  el.locked=on; if(on)activeId=null; render();
}

// ── CREAR ELEMENTOS ──────────────────────────────────────────
function createPlayer(team) {
  saveState();
  const id=newId(),tc=teamColors[team];
  steps[curStep].push({id,type:team,
    x:300+Math.random()*400,y:200+Math.random()*280,
    num:steps[curStep].filter(o=>o.type===team).length+1,
    color:tc.c1,stripeColor:tc.c2,striped:false,scale:1,rot:0});
  activeId=id; render(); updateInspector(steps[curStep].find(o=>o.id===id));
}

function createItem(type) {
  saveState();
  const id=newId();
  const CM={cone:'#e67e22',cone_low:'#e74c3c',pica:'#f1c40f',valla:'#e74c3c',ladder:'#f1c40f',weight:'#95a5a6'};
  steps[curStep].push({id,type,x:300+Math.random()*400,y:200+Math.random()*280,color:CM[type]||'#e67e22',scale:1,rot:0});
  activeId=id; render();
}

function createVector(sub) {
  saveState();
  const id=newId();
  const base={id,type:'vec',sub,color:'#000000',arrow:true,dashed:false};
  if(sub==='line')  Object.assign(base,{x1:200,y1:240,x2:400,y2:240});
  if(sub==='curve') Object.assign(base,{x1:180,y1:340,cx1:280,cy1:180,cx2:420,cy2:500,x2:520,y2:340});
  steps[curStep].push(base); activeId=id; render(); updateInspector(base);
}

function startPolyMode() {
  saveState(); isDrawingPoly=true; const id=newId();
  steps[curStep].push({id,type:'vec',sub:'poly',pts:[],color:'#000000',arrow:true,dashed:false});
  activeId=id;
  document.getElementById('poly-indicator').style.display='block';
  document.getElementById('btn-finish-poly').style.display='block';
  render();
}
function finishPoly() {
  isDrawingPoly=false;
  document.getElementById('poly-indicator').style.display='none';
  document.getElementById('btn-finish-poly').style.display='none';
  render();
}

function createZone(sub) {
  saveState(); const id=newId();
  steps[curStep].push({id,type:'zone',sub,x:280,y:180,w:220,h:160,color:'#ffffff',locked:false});
  activeId=id; render(); updateInspector(steps[curStep].find(o=>o.id===id));
}

// ── CAMPO ────────────────────────────────────────────────────
function changeField(val) {
  const imgs={entero:'campoentero.png',medio:'mediocampo.png',ejercicio:'campoejercicio.png',futsal:'futsal.png'};
  if(val==='blank'){fMaster.style.backgroundImage='none';fMaster.classList.add('field-blank');}
  else{fMaster.style.backgroundImage=imgs[val]?`url('${imgs[val]}')`:'none';fMaster.style.backgroundSize='100% 100%';fMaster.style.backgroundRepeat='no-repeat';fMaster.style.backgroundPosition='center';fMaster.classList.remove('field-blank');}
}

// ── COLORES EQUIPO ───────────────────────────────────────────
function updateTeamColor(team,key,val) {
  teamColors[team][key]=val;
  steps.forEach(s=>s.forEach(el=>{if(el.type===team){if(key==='c1')el.color=val;if(key==='c2')el.stripeColor=val;}}));
  updateAllSwatches(); render();
}
function updateAllSwatches() {
  Object.keys(teamColors).forEach(t=>{
    const sw=document.getElementById(`swatch-${t}`);if(sw)sw.style.background=teamColors[t].c1;
    const d=document.getElementById(`dot-${t}`);if(d){d.style.background=teamColors[t].c1;d.style.color=isLight(teamColors[t].c1)?'#000':'#fff';}
  });
}

// ── PASOS ────────────────────────────────────────────────────
function navStep(d){const n=curStep+d;if(n<0||n>=steps.length)return;curStep=n;deselect();}
function addStep(){saveState();steps.splice(curStep+1,0,JSON.parse(JSON.stringify(steps[curStep])));curStep++;deselect();}

// ── ANIMACIÓN ────────────────────────────────────────────────
async function runAnimation() {
  if(steps.length<2){alert('Añade al menos 2 pasos para animar');return;}
  isPlaying=true; deselect();
  const dur=parseInt(document.getElementById('speed-slider').value);
  for(let i=0;i<steps.length-1;i++) await animateStep(steps[i],steps[i+1],dur);
  isPlaying=false; render();
}

function animateStep(f1,f2,dur) {
  return new Promise(res=>{
    let st=null;
    function frame(ts) {
      if(!st)st=ts;
      const t=Math.min((ts-st)/dur,1), ease=t<0.5?2*t*t:-1+(4-2*t)*t;
      clearField();
      // Estáticos
      f1.forEach(el=>{if(el.type==='zone')drawZone(el);});
      f1.forEach(el=>{if(el.type==='vec') drawVector(el);});
      f1.forEach(el=>{if(el.type!=='zone'&&el.type!=='vec'&&!ANIMATE_TYPES.has(el.type))drawPhysical(el);});
      // Solo jugadores (A,B,C,D) y balón se animan
      f1.forEach(o1=>{
        if(!ANIMATE_TYPES.has(o1.type))return;
        const o2=f2.find(x=>x.id===o1.id);
        if(!o2){drawPhysical(o1);return;}
        const tmp=JSON.parse(JSON.stringify(o1));
        tmp.x=o1.x+(o2.x-o1.x)*ease; tmp.y=o1.y+(o2.y-o1.y)*ease;
        tmp.scale=(o1.scale||1)+((o2.scale||1)-(o1.scale||1))*ease;
        tmp.rot=(o1.rot||0)+((o2.rot||0)-(o1.rot||0))*ease;
        drawPhysical(tmp);
      });
      if(t<1)requestAnimationFrame(frame);else res();
    }
    requestAnimationFrame(frame);
  });
}

// ── EXPORTAR PNG ─────────────────────────────────────────────
async function exportPNG() {
  deselect(); await new Promise(r=>setTimeout(r,80));
  html2canvas(fMaster,{scale:2,useCORS:true,backgroundColor:null}).then(c=>{
    const a=document.createElement('a');a.href=c.toDataURL('image/png');
    a.download=`tactica_paso${curStep+1}_${Date.now()}.png`;a.click();
  });
}

// ── EXPORTAR VÍDEO ───────────────────────────────────────────
function exportVideo(){if(steps.length<2){alert('Añade al menos 2 pasos');return;}document.getElementById('export-modal').classList.add('open');}
function closeExportModal(){document.getElementById('export-modal').classList.remove('open');document.getElementById('export-progress').style.display='none';document.getElementById('progress-fill').style.width='0%';document.getElementById('export-status').textContent='';}
function setExportProgress(p,m){document.getElementById('progress-fill').style.width=p+'%';document.getElementById('export-status').textContent=m;}
async function startExport(fmt){
  document.getElementById('export-progress').style.display='block';setExportProgress(2,'Preparando...');
  try{if(fmt==='mp4')await exportMP4();else await exportGIF();}
  catch(err){console.error(err);alert('Error: '+err.message);closeExportModal();}
}

function renderFrameForExport(f1,f2,ease) {
  clearField();
  f1.forEach(el=>{if(el.type==='zone')drawZone(el);});
  f1.forEach(el=>{if(el.type==='vec') drawVector(el);});
  f1.forEach(el=>{if(el.type!=='zone'&&el.type!=='vec'&&!ANIMATE_TYPES.has(el.type))drawPhysical(el);});
  f1.forEach(o1=>{
    if(!ANIMATE_TYPES.has(o1.type))return;
    const o2=f2.find(x=>x.id===o1.id);
    if(!o2){drawPhysical(o1);return;}
    const tmp=JSON.parse(JSON.stringify(o1));
    tmp.x=o1.x+(o2.x-o1.x)*ease;tmp.y=o1.y+(o2.y-o1.y)*ease;
    tmp.scale=(o1.scale||1)+((o2.scale||1)-(o1.scale||1))*ease;
    tmp.rot=(o1.rot||0)+((o2.rot||0)-(o1.rot||0))*ease;
    drawPhysical(tmp);
  });
}

async function exportMP4() {
  const FPS=25,dur=parseInt(document.getElementById('speed-slider').value);
  const fpsStep=Math.round((dur/1000)*FPS),total=fpsStep*(steps.length-1);
  setExportProgress(5,`Capturando ${total} frames...`);deselect();isPlaying=true;
  const W=fMaster.offsetWidth,H=fMaster.offsetHeight;
  const rc=document.createElement('canvas');rc.width=W;rc.height=H;
  const ctx=rc.getContext('2d');const snaps=[];
  for(let i=0;i<steps.length-1;i++){
    for(let f=0;f<fpsStep;f++){
      const t=f/fpsStep,ease=t<0.5?2*t*t:-1+(4-2*t)*t;
      renderFrameForExport(steps[i],steps[i+1],ease);
      await new Promise(r=>requestAnimationFrame(r));await new Promise(r=>setTimeout(r,0));
      snaps.push(await html2canvas(fMaster,{scale:1,useCORS:true,backgroundColor:'#1a5c2a',logging:false}));
      setExportProgress(5+Math.round(((i*fpsStep+f+1)/total)*55),`Frame ${i*fpsStep+f+1}/${total}`);
    }
  }
  renderFrameForExport(steps[steps.length-1],steps[steps.length-1],0);
  await new Promise(r=>setTimeout(r,60));
  const ls=await html2canvas(fMaster,{scale:1,useCORS:true,backgroundColor:'#1a5c2a',logging:false});
  for(let k=0;k<FPS;k++)snaps.push(ls);
  isPlaying=false;render();
  setExportProgress(62,'Ensamblando WebM...');
  const mime=['video/webm;codecs=vp8,opus','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  const stream=rc.captureStream(FPS),rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4e6}),chunks=[];
  rec.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};rec.start();
  for(let idx=0;idx<snaps.length;idx++){ctx.drawImage(snaps[idx],0,0,W,H);await new Promise(r=>setTimeout(r,1000/FPS));setExportProgress(62+Math.round((idx/snaps.length)*20),'Ensamblando...');}
  rec.stop();
  const wb=await new Promise(r=>{rec.onstop=()=>r(new Blob(chunks,{type:'video/webm'}));});
  setExportProgress(83,'Convirtiendo a MP4...');
  try{
    const mp4=await convertToMP4(wb,p=>setExportProgress(83+Math.round(p*14),`Codificando ${Math.round(p*100)}%`));
    setExportProgress(100,'¡Listo!');await new Promise(r=>setTimeout(r,400));
    const url=URL.createObjectURL(mp4);const a=document.createElement('a');a.href=url;a.download=`tactica_${Date.now()}.mp4`;a.click();URL.revokeObjectURL(url);closeExportModal();
  } catch(err){
    setExportProgress(100,'Descargando WebM (ffmpeg no disponible)');await new Promise(r=>setTimeout(r,800));
    const url=URL.createObjectURL(wb);const a=document.createElement('a');a.href=url;a.download=`tactica_${Date.now()}.webm`;a.click();URL.revokeObjectURL(url);closeExportModal();
  }
}

let _ffmpeg=null;
async function getFFmpeg(){
  if(_ffmpeg)return _ffmpeg;
  if(!window.FFmpeg)     await loadScript('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js');
  if(!window.FFmpegUtil) await loadScript('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/umd/index.js');
  const{FFmpeg}=window.FFmpeg,{fetchFile,toBlobURL}=window.FFmpegUtil;
  window._ffFetchFile=fetchFile;
  const ff=new FFmpeg();
  const base='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
  await ff.load({coreURL:await toBlobURL(`${base}/ffmpeg-core.js`,'text/javascript'),wasmURL:await toBlobURL(`${base}/ffmpeg-core.wasm`,'application/wasm')});
  _ffmpeg=ff;return ff;
}
async function convertToMP4(blob,onP){
  const ff=await getFFmpeg();await ff.writeFile('i.webm',await window._ffFetchFile(blob));
  let p=0;const t=setInterval(()=>{p=Math.min(p+0.04,0.92);onP(p);},300);
  await ff.exec(['-i','i.webm','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart','-an','o.mp4']);
  clearInterval(t);onP(1);const d=await ff.readFile('o.mp4');return new Blob([d.buffer],{type:'video/mp4'});
}
function loadScript(src){
  return new Promise((res,rej)=>{
    if(document.querySelector(`script[src="${src}"]`)){res();return;}
    const s=document.createElement('script');s.src=src;s.crossOrigin='anonymous';
    s.onload=res;s.onerror=()=>rej(new Error('No se pudo cargar: '+src));document.head.appendChild(s);
  });
}
async function exportGIF(){
  if(typeof GIF==='undefined'){alert('GIF no disponible');return;}
  const FPS=20,dur=parseInt(document.getElementById('speed-slider').value);
  const fpsStep=Math.max(8,Math.round((dur/1000)*FPS)),total=fpsStep*(steps.length-1);
  deselect();isPlaying=true;
  const gif=new GIF({workers:2,quality:6,width:fMaster.offsetWidth,height:fMaster.offsetHeight,workerScript:'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'});
  let done=0;
  for(let i=0;i<steps.length-1;i++) for(let f=0;f<fpsStep;f++){
    const t=f/fpsStep,ease=t<0.5?2*t*t:-1+(4-2*t)*t;
    renderFrameForExport(steps[i],steps[i+1],ease);
    await new Promise(r=>requestAnimationFrame(r));await new Promise(r=>setTimeout(r,0));
    gif.addFrame(await html2canvas(fMaster,{scale:1,useCORS:true,backgroundColor:'#1a5c2a',logging:false}),{delay:Math.round(1000/FPS),copy:true});
    done++;setExportProgress(5+Math.round((done/total)*80),`Frame ${done}/${total}`);
  }
  isPlaying=false;render();setExportProgress(88,'Compilando GIF...');
  gif.on('progress',p=>setExportProgress(88+Math.round(p*10),'Compilando...'));
  gif.on('finished',blob=>{setExportProgress(100,'¡Listo!');setTimeout(()=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`tactica_${Date.now()}.gif`;a.click();URL.revokeObjectURL(url);closeExportModal();},400);});
  gif.render();
}

// ── BIBLIOTECA ───────────────────────────────────────────────
function openLibrary(){
  const g=document.getElementById('library-grid');g.innerHTML='';
  drillLibrary.forEach(d=>{
    const c=document.createElement('div');c.className='lib-card';
    c.innerHTML=`<div class="lib-icon">${d.icon}</div><div class="lib-name">${d.name}</div><div class="lib-desc">${d.desc}</div>`;
    c.onclick=()=>injectDrill(d);g.appendChild(c);
  });
  document.getElementById('library-modal').classList.add('open');
}
function closeLibrary(){document.getElementById('library-modal').classList.remove('open');}

function injectDrill(drill) {
  saveState();
  const now=Date.now();
  // _bid garantiza el mismo id real en todos los pasos → animación correcta
  const bidMap={};
  drill.steps.forEach(step=>step.forEach(el=>{
    if(el._bid&&!bidMap[el._bid])
      bidMap[el._bid]=now+'_'+el._bid+'_'+Math.random().toString(36).slice(2,5);
  }));
  const newSteps=drill.steps.map(step=>step.map(el=>{
    const copy=JSON.parse(JSON.stringify(el));
    copy.id=el._bid?bidMap[el._bid]:newId();
    delete copy._bid;
    if(['A','B','C','D'].includes(copy.type)){copy.color=teamColors[copy.type].c1;copy.stripeColor=teamColors[copy.type].c2;}
    if(!copy.hasOwnProperty('scale'))copy.scale=1;
    if(!copy.hasOwnProperty('rot'))copy.rot=0;
    return copy;
  }));
  steps.splice(0,steps.length,...newSteps);
  curStep=0;deselect();closeLibrary();
}

// ── UTILIDADES ───────────────────────────────────────────────
function saveState(){if(history.length>40)history.shift();history.push(JSON.stringify(steps));}
function undo(){if(!history.length)return;steps=JSON.parse(history.pop());if(curStep>=steps.length)curStep=steps.length-1;render();}
function deselect(){activeId=null;if(isDrawingPoly)finishPoly();render();}
function duplicateActive(){
  if(!activeId)return;saveState();
  const orig=steps[curStep].find(o=>o.id===activeId);if(!orig)return;
  const copy=JSON.parse(JSON.stringify(orig));copy.id=newId();
  if(copy.type==='zone'){copy.x+=20;copy.y+=20;}
  else if(copy.type!=='vec'){copy.x=clamp(copy.x+40,0,FIELD_W);copy.y=clamp(copy.y+40,0,FIELD_H);}
  steps[curStep].push(copy);activeId=copy.id;render();
}
function deleteActive(){if(!activeId)return;saveState();steps[curStep]=steps[curStep].filter(o=>o.id!==activeId);activeId=null;render();}
function openResetMenu(){document.getElementById('reset-modal').classList.add('open');}
function closeResetMenu(){document.getElementById('reset-modal').classList.remove('open');}
function resetAction(t){saveState();if(t==='step')steps[curStep]=[];else{steps=[[]];curStep=0;}closeResetMenu();deselect();}
function isLight(hex){if(!hex||hex.length<7)return false;const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return(r*299+g*587+b*114)/1000>155;}
