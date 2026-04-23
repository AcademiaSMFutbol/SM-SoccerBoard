/* ============================================================
   SM SoccerBoard Pro v73 — script.js
   © Academia SM Fútbol — Las Palmas de Gran Canaria
   FIXES v73:
   · Animaciones biblioteca: _bid→bidMap correcto; steps reemplazados
   · Zonas: createZone empuja al array y llama render() correctamente
   · Tortuga=lento(izq) Conejo=rápido(der): slider invertido = más ms = más lento
   · Líneas negras con flecha por defecto
   · Inspector: toggle flecha funcional
   · Jugadores: diseño camiseta con rayas verticales c1/c2 visibles
   ============================================================ */

// ── ESTADO GLOBAL ────────────────────────────────────────────
let steps            = [[]];
let history          = [];
let curStep          = 0;
let activeId         = null;
let dragInfo         = null;
let isPlaying        = false;
let isDrawingPoly    = false;
let activePointers   = new Map();
let initialPinchDist = null;
let tapStartX = 0, tapStartY = 0, isPossibleTap = false;
let idCounter = 1;

const FIELD_W = 1050, FIELD_H = 680;
// Solo jugadores y balón se mueven en la animación; el resto es estático
const ANIM = new Set(['A','B','C','D','ball']);

let teamColors = {
  A: { c1:'#e63946', c2:'#ffffff' },
  B: { c1:'#2e86de', c2:'#ffffff' },
  C: { c1:'#f1c40f', c2:'#000000' },
  D: { c1:'#2ecc71', c2:'#ffffff' }
};

const fMaster  = document.getElementById('field-master');
const svgEl    = document.getElementById('svg-layer');
const viewport = document.getElementById('viewport');

// ── BIBLIOTECA ───────────────────────────────────────────────
// Regla: cada elemento lleva _bid (string único dentro del drill).
// injectDrill() construye un bidMap { _bid → id_real } y lo aplica
// a TODOS los pasos, garantizando que el mismo _bid → mismo id_real
// en todos los pasos → la animación puede emparejar elementos por id.
const DRILLS = [
  {
    key:'rondo41', name:'Rondo 4×1', icon:'🔵', desc:'Posesión 4 vs 1',
    steps:[
      [
        {_bid:'z1',type:'zone',sub:'line',x:340,y:180,w:290,h:290,color:'#ffffff',locked:false},
        {_bid:'a1',type:'A',x:340,y:180,num:1},{_bid:'a2',type:'A',x:630,y:180,num:2},
        {_bid:'a3',type:'A',x:340,y:470,num:3},{_bid:'a4',type:'A',x:630,y:470,num:4},
        {_bid:'b1',type:'B',x:485,y:325,num:1},
        {_bid:'bl',type:'ball',x:340,y:180}
      ],
      [
        {_bid:'z1',type:'zone',sub:'line',x:340,y:180,w:290,h:290,color:'#ffffff',locked:false},
        {_bid:'a1',type:'A',x:340,y:180,num:1},{_bid:'a2',type:'A',x:630,y:180,num:2},
        {_bid:'a3',type:'A',x:340,y:470,num:3},{_bid:'a4',type:'A',x:630,y:470,num:4},
        {_bid:'b1',type:'B',x:415,y:245,num:1},
        {_bid:'bl',type:'ball',x:630,y:180},
        {_bid:'v1',type:'vec',sub:'line',x1:345,y1:182,x2:618,y2:182,color:'#000000',arrow:true,dashed:false}
      ],
      [
        {_bid:'z1',type:'zone',sub:'line',x:340,y:180,w:290,h:290,color:'#ffffff',locked:false},
        {_bid:'a1',type:'A',x:340,y:180,num:1},{_bid:'a2',type:'A',x:630,y:180,num:2},
        {_bid:'a3',type:'A',x:340,y:470,num:3},{_bid:'a4',type:'A',x:630,y:470,num:4},
        {_bid:'b1',type:'B',x:555,y:345,num:1},
        {_bid:'bl',type:'ball',x:340,y:470},
        {_bid:'v1',type:'vec',sub:'line',x1:628,y1:182,x2:352,y2:458,color:'#000000',arrow:true,dashed:false}
      ]
    ]
  },
  {
    key:'rondo42', name:'Rondo 4×2', icon:'🟦', desc:'Posesión 4 vs 2',
    steps:[
      [
        {_bid:'z1',type:'zone',sub:'line',x:320,y:170,w:310,h:310,color:'#ffffff',locked:false},
        {_bid:'a1',type:'A',x:320,y:170,num:1},{_bid:'a2',type:'A',x:630,y:170,num:2},
        {_bid:'a3',type:'A',x:320,y:480,num:3},{_bid:'a4',type:'A',x:630,y:480,num:4},
        {_bid:'b1',type:'B',x:450,y:295,num:1},{_bid:'b2',type:'B',x:530,y:355,num:2},
        {_bid:'bl',type:'ball',x:320,y:170}
      ],
      [
        {_bid:'z1',type:'zone',sub:'line',x:320,y:170,w:310,h:310,color:'#ffffff',locked:false},
        {_bid:'a1',type:'A',x:320,y:170,num:1},{_bid:'a2',type:'A',x:630,y:170,num:2},
        {_bid:'a3',type:'A',x:320,y:480,num:3},{_bid:'a4',type:'A',x:630,y:480,num:4},
        {_bid:'b1',type:'B',x:390,y:250,num:1},{_bid:'b2',type:'B',x:480,y:330,num:2},
        {_bid:'bl',type:'ball',x:630,y:480},
        {_bid:'v1',type:'vec',sub:'line',x1:322,y1:172,x2:618,y2:473,color:'#000000',arrow:true,dashed:false}
      ]
    ]
  },
  {
    key:'transicion', name:'Transición 3v2', icon:'⚡', desc:'Ataque rápido',
    steps:[
      [
        {_bid:'a1',type:'A',x:200,y:340,num:1},{_bid:'a2',type:'A',x:340,y:220,num:2},
        {_bid:'a3',type:'A',x:340,y:460,num:3},
        {_bid:'b1',type:'B',x:650,y:280,num:1},{_bid:'b2',type:'B',x:650,y:400,num:2},
        {_bid:'bl',type:'ball',x:200,y:340}
      ],
      [
        {_bid:'a1',type:'A',x:400,y:340,num:1},{_bid:'a2',type:'A',x:540,y:210,num:2},
        {_bid:'a3',type:'A',x:540,y:470,num:3},
        {_bid:'b1',type:'B',x:680,y:280,num:1},{_bid:'b2',type:'B',x:680,y:400,num:2},
        {_bid:'bl',type:'ball',x:400,y:340},
        {_bid:'v1',type:'vec',sub:'line',x1:202,y1:340,x2:390,y2:340,color:'#000000',arrow:true,dashed:false}
      ],
      [
        {_bid:'a1',type:'A',x:580,y:340,num:1},{_bid:'a2',type:'A',x:720,y:200,num:2},
        {_bid:'a3',type:'A',x:720,y:490,num:3},
        {_bid:'b1',type:'B',x:710,y:275,num:1},{_bid:'b2',type:'B',x:710,y:405,num:2},
        {_bid:'bl',type:'ball',x:720,y:200},
        {_bid:'v1',type:'vec',sub:'line',x1:402,y1:338,x2:708,y2:205,color:'#000000',arrow:true,dashed:false}
      ]
    ]
  },
  {
    key:'presion', name:'Presión alta', icon:'🔴', desc:'Salida presionada',
    steps:[
      [
        {_bid:'a1',type:'A',x:200,y:340,num:1},
        {_bid:'b1',type:'B',x:300,y:240,num:1},{_bid:'b2',type:'B',x:300,y:440,num:2},{_bid:'b3',type:'B',x:175,y:340,num:3},
        {_bid:'bl',type:'ball',x:200,y:340}
      ],
      [
        {_bid:'a1',type:'A',x:200,y:340,num:1},
        {_bid:'b1',type:'B',x:238,y:278,num:1},{_bid:'b2',type:'B',x:238,y:402,num:2},{_bid:'b3',type:'B',x:182,y:340,num:3},
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
        {_bid:'a1',type:'A',x:170,y:310,num:1},{_bid:'bl',type:'ball',x:170,y:310}
      ],
      [
        {_bid:'c1',type:'cone',x:250,y:310,rot:0,scale:1,color:'#e67e22'},
        {_bid:'c2',type:'cone',x:350,y:310,rot:0,scale:1,color:'#e67e22'},
        {_bid:'c3',type:'cone',x:450,y:310,rot:0,scale:1,color:'#e67e22'},
        {_bid:'c4',type:'cone',x:550,y:310,rot:0,scale:1,color:'#e67e22'},
        {_bid:'pk',type:'pica',x:650,y:310,rot:0,scale:1,color:'#f1c40f'},
        {_bid:'a1',type:'A',x:650,y:310,num:1},{_bid:'bl',type:'ball',x:650,y:310},
        {_bid:'v1',type:'vec',sub:'poly',pts:[{x:172,y:310},{x:300,y:268},{x:400,y:335},{x:500,y:268},{x:648,y:310}],color:'#000000',arrow:true,dashed:false}
      ]
    ]
  },
  {
    key:'corner', name:'Córner ensayado', icon:'🏁', desc:'Jugada a balón parado',
    steps:[
      [
        {_bid:'a1',type:'A',x:950,y:620,num:1},{_bid:'a2',type:'A',x:800,y:400,num:2},
        {_bid:'a3',type:'A',x:820,y:480,num:3},{_bid:'a4',type:'A',x:750,y:320,num:4},
        {_bid:'b1',type:'B',x:830,y:400,num:1},{_bid:'b2',type:'B',x:840,y:480,num:2},
        {_bid:'bl',type:'ball',x:1020,y:650}
      ],
      [
        {_bid:'a1',type:'A',x:950,y:620,num:1},{_bid:'a2',type:'A',x:845,y:378,num:2},
        {_bid:'a3',type:'A',x:820,y:440,num:3},{_bid:'a4',type:'A',x:762,y:298,num:4},
        {_bid:'b1',type:'B',x:862,y:390,num:1},{_bid:'b2',type:'B',x:857,y:468,num:2},
        {_bid:'bl',type:'ball',x:845,y:378},
        {_bid:'v1',type:'vec',sub:'curve',x1:1020,y1:650,cx1:980,cy1:500,cx2:900,cy2:380,x2:847,y2:380,color:'#000000',arrow:true,dashed:false}
      ]
    ]
  }
];

let currentField = 'entero';

// ── INIT ─────────────────────────────────────────────────────
window.onload = () => { resizeField(); updateAllSwatches(); updateSpeedLabel(); render(); };
window.addEventListener('resize', resizeField);
document.getElementById('speed-slider').addEventListener('input', updateSpeedLabel);

function updateSpeedLabel() {
  // slider: izquierda=300ms(rápido/conejo), derecha=3000ms(lento/tortuga)
  // Para que tortuga=izq y conejo=der, el valor del slider se invierte:
  // valor visual = max + min - valor_real
  const raw = parseInt(document.getElementById('speed-slider').value);
  const display = (3000 + 300 - raw);
  document.getElementById('speed-value').textContent = `${display}ms / paso`;
}

function getAnimDuration() {
  const raw = parseInt(document.getElementById('speed-slider').value);
  // invertir: slider al máximo (der/conejo) = más rápido
  return 3000 + 300 - raw;
}

function resizeField() {
  // Usamos width/height directo para evitar desbordamiento en móvil.
  // El zoom se recalcula en cada evento de puntero desde rect.width/FIELD_W.
  const vp = viewport.getBoundingClientRect();
  const ratio = Math.min(vp.width / FIELD_W, vp.height / FIELD_H);
  const w = Math.round(FIELD_W * ratio);
  const h = Math.round(FIELD_H * ratio);
  fMaster.style.transform = 'none';
  fMaster.style.width  = w + 'px';
  fMaster.style.height = h + 'px';
  svgEl.setAttribute('viewBox', `0 0 ${FIELD_W} ${FIELD_H}`);
  svgEl.style.width  = '100%';
  svgEl.style.height = '100%';
  drawFieldSVG(currentField);
}

function uid() { return (++idCounter) + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,5); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

// ── PUNTERO ──────────────────────────────────────────────────
viewport.addEventListener('pointerdown', onDown);
window.addEventListener('pointermove',  onMove);
window.addEventListener('pointerup',    onUp);

function onDown(e) {
  if (isPlaying) return;
  tapStartX = e.clientX; tapStartY = e.clientY; isPossibleTap = true;
  const hit   = e.target.closest('.object,.vec-hit,.zone-obj,.node,.zone-sh');
  const hitId = hit ? hit.dataset.id : null;
  activePointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
  const rect = fMaster.getBoundingClientRect();
  const zoom = rect.width / FIELD_W;

  if (isDrawingPoly && activeId) {
    const el = steps[curStep].find(o => o.id === activeId);
    if (el) {
      el.pts.push({ x:clamp((e.clientX-rect.left)/zoom,0,FIELD_W), y:clamp((e.clientY-rect.top)/zoom,0,FIELD_H) });
      render();
    }
    return;
  }

  if (activePointers.size === 1) {
    const wasSelected = (activeId === hitId && hitId != null);
    activeId = hitId || null;
    if (activeId) {
      const el = steps[curStep].find(o => o.id === activeId);
      if (el && el.locked && el.type === 'zone') { activeId = null; render(); return; }
      if (el && (wasSelected || (hit && (hit.classList.contains('node') || hit.classList.contains('zone-sh'))))) {
        saveState();
        dragInfo = { el, isSH: hit && hit.classList.contains('zone-sh'),
          nx: hit?hit.dataset.nx:undefined, ny: hit?hit.dataset.ny:undefined,
          lastX:e.clientX, lastY:e.clientY, zoom };
      }
      syncInspector(el);
    } else { deselect(); }
  } else if (activePointers.size === 2 && activeId) {
    const pts = Array.from(activePointers.values());
    initialPinchDist = Math.hypot(pts[0].x-pts[1].x, pts[0].y-pts[1].y);
  }
  render();
}

function onMove(e) {
  if (!activePointers.has(e.pointerId) || isPlaying) return;
  activePointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (isPossibleTap && Math.hypot(e.clientX-tapStartX, e.clientY-tapStartY) > 6) isPossibleTap = false;

  // Pellizco → escala solo en jugadores y material
  if (activePointers.size === 2 && activeId && initialPinchDist) {
    const el = steps[curStep].find(o => o.id === activeId);
    if (el && el.type !== 'zone' && el.type !== 'vec') {
      const pts = Array.from(activePointers.values());
      const d   = Math.hypot(pts[0].x-pts[1].x, pts[0].y-pts[1].y);
      el.scale  = clamp((el.scale||1) * (d/initialPinchDist), 0.25, 4);
      initialPinchDist = d; render();
    }
    return;
  }

  if (!dragInfo || activePointers.size !== 1 || isDrawingPoly) return;
  const dx = (e.clientX - dragInfo.lastX) / dragInfo.zoom;
  const dy = (e.clientY - dragInfo.lastY) / dragInfo.zoom;
  const el = dragInfo.el;

  if (dragInfo.isSH) {
    el.w = Math.max(30, el.w + dx); el.h = Math.max(30, el.h + dy);
  } else if (dragInfo.nx !== undefined && dragInfo.nx !== '') {
    if (el.sub === 'poly') {
      el.pts[dragInfo.nx].x = clamp(el.pts[dragInfo.nx].x + dx, 0, FIELD_W);
      el.pts[dragInfo.nx].y = clamp(el.pts[dragInfo.nx].y + dy, 0, FIELD_H);
    } else { el[dragInfo.nx] += dx; el[dragInfo.ny] += dy; }
  } else {
    if (el.sub === 'poly') {
      el.pts.forEach(p => { p.x = clamp(p.x+dx,0,FIELD_W); p.y = clamp(p.y+dy,0,FIELD_H); });
    } else if (el.type === 'vec') {
      ['x1','x2','cx1','cx2'].forEach(k => { if(el[k]!==undefined) el[k]+=dx; });
      ['y1','y2','cy1','cy2'].forEach(k => { if(el[k]!==undefined) el[k]+=dy; });
    } else if (el.type === 'zone') {
      el.x = clamp(el.x+dx, 0, FIELD_W-el.w); el.y = clamp(el.y+dy, 0, FIELD_H-el.h);
    } else {
      el.x = clamp(el.x+dx, 0, FIELD_W); el.y = clamp(el.y+dy, 0, FIELD_H);
    }
  }
  dragInfo.lastX = e.clientX; dragInfo.lastY = e.clientY;
  render();
}

function onUp(e) {
  const ROT = ['cone','cone_low','pica','valla','ladder','weight','ball'];
  if (isPossibleTap && activeId && activePointers.size === 1 && !isDrawingPoly) {
    const el = steps[curStep].find(o => o.id === activeId);
    if (el && ROT.includes(el.type)) { el.rot = ((el.rot||0)+15)%360; render(); }
  }
  activePointers.delete(e.pointerId);
  if (activePointers.size < 2) initialPinchDist = null;
  dragInfo = null;
}

// ── RENDER ───────────────────────────────────────────────────
function render() {
  if (isPlaying) return;
  wipe();
  const step = steps[curStep];
  step.forEach(el => { if (el.type==='zone') paintZone(el); });
  step.forEach(el => { if (el.type==='vec')  paintVec(el); });
  step.forEach(el => { if (el.type!=='zone' && el.type!=='vec') paintObj(el); });

  if (activeId) {
    const el = step.find(o => o.id === activeId);
    if (el && el.type === 'vec') {
      if (el.sub==='line')  { mkNode(el,'x1','y1',el.x1,el.y1); mkNode(el,'x2','y2',el.x2,el.y2); }
      if (el.sub==='curve') { mkNode(el,'x1','y1',el.x1,el.y1); mkNode(el,'cx1','cy1',el.cx1,el.cy1,true); mkNode(el,'cx2','cy2',el.cx2,el.cy2,true); mkNode(el,'x2','y2',el.x2,el.y2); }
      if (el.sub==='poly')  { el.pts.forEach((p,i) => mkNode(el,i,null,p.x,p.y)); }
    }
  }
  document.getElementById('step-label').innerText = `${curStep+1} / ${steps.length}`;
  document.getElementById('inspector-panel').style.display = activeId ? 'block' : 'none';
}

function wipe() {
  Array.from(fMaster.children).forEach(c => { if (c.id!=='svg-layer') fMaster.removeChild(c); });
  const defs = svgEl.querySelector('defs');
  svgEl.innerHTML = '';
  if (defs) svgEl.appendChild(defs);
}

// ── PAINT OBJECT ─────────────────────────────────────────────
function paintObj(el) {
  const wrap = document.createElement('div');
  wrap.className = 'object' + (activeId===el.id ? ' selected' : '');
  wrap.dataset.id = el.id;

  if (['A','B','C','D'].includes(el.type)) {
    const tc = teamColors[el.type];
    const c1 = el.color       || tc.c1;
    const c2 = el.stripeColor || tc.c2;
    wrap.appendChild(makeShirt(c1, c2, el.striped, el.num||1));
  } else if (el.type === 'ball') {
    wrap.classList.add('ball-obj'); wrap.textContent = '⚽';
  } else {
    const sh = document.createElement('div');
    sh.className = el.type + '-obj';
    const c = el.color;
    if (el.type==='cone')     sh.style.borderBottomColor = c||'#e67e22';
    if (el.type==='cone_low') sh.style.borderBottomColor = c||'#e74c3c';
    if (el.type==='pica')     sh.style.background = c||'#f1c40f';
    if (el.type==='valla')    sh.style.borderColor = c||'#e74c3c';
    if (el.type==='ladder')   {
      sh.style.borderTopColor    = c||'#f1c40f';
      sh.style.borderBottomColor = c||'#f1c40f';
      sh.style.backgroundImage   = `repeating-linear-gradient(90deg,transparent,transparent 22px,${c||'#f1c40f'} 22px,${c||'#f1c40f'} 26px)`;
    }
    wrap.appendChild(sh);
  }

  wrap.style.left      = el.x + 'px';
  wrap.style.top       = el.y + 'px';
  wrap.style.transform = `translate(-50%,-50%) rotate(${el.rot||0}deg) scale(${el.scale||1})`;
  fMaster.appendChild(wrap);
}

// Camiseta SVG con rayas verticales (siempre visible, con o sin rayas)
function makeShirt(c1, c2, striped, num) {
  const size = 38;
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width', size); svg.setAttribute('height', size);
  svg.setAttribute('viewBox','0 0 38 38');
  svg.classList.add('shirt-svg');

  // Fondo círculo
  const bg = document.createElementNS('http://www.w3.org/2000/svg','circle');
  bg.setAttribute('cx','19'); bg.setAttribute('cy','19'); bg.setAttribute('r','18');
  bg.setAttribute('fill', c1);
  bg.setAttribute('stroke','rgba(255,255,255,0.8)'); bg.setAttribute('stroke-width','2');
  svg.appendChild(bg);

  if (striped) {
    // Rayas verticales: clipPath en el círculo
    const clipId = 'clip-' + Math.random().toString(36).slice(2,6);
    const defs   = document.createElementNS('http://www.w3.org/2000/svg','defs');
    const clip   = document.createElementNS('http://www.w3.org/2000/svg','clipPath');
    clip.setAttribute('id', clipId);
    const cc = document.createElementNS('http://www.w3.org/2000/svg','circle');
    cc.setAttribute('cx','19'); cc.setAttribute('cy','19'); cc.setAttribute('r','17');
    clip.appendChild(cc); defs.appendChild(clip); svg.appendChild(defs);

    // 4 rayas de c2 sobre fondo c1
    [4,12,20,28].forEach(x => {
      const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
      r.setAttribute('x', x); r.setAttribute('y','0');
      r.setAttribute('width','5'); r.setAttribute('height','38');
      r.setAttribute('fill', c2); r.setAttribute('clip-path',`url(#${clipId})`);
      svg.appendChild(r);
    });
  }

  // Número
  const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
  txt.setAttribute('x','19'); txt.setAttribute('y','24');
  txt.setAttribute('text-anchor','middle');
  txt.setAttribute('font-family','Barlow Condensed, sans-serif');
  txt.setAttribute('font-size','14'); txt.setAttribute('font-weight','800');
  txt.setAttribute('fill', isLight(c1) && !striped ? '#000' : '#fff');
  txt.setAttribute('paint-order','stroke');
  txt.setAttribute('stroke','rgba(0,0,0,0.4)'); txt.setAttribute('stroke-width','2');
  txt.textContent = num;
  svg.appendChild(txt);

  return svg;
}

// ── PAINT ZONE ───────────────────────────────────────────────
function paintZone(el) {
  const div = document.createElement('div');
  div.className = 'zone-obj' + (activeId===el.id?' selected':'') + (el.locked?' locked':'');
  div.dataset.id = el.id;
  div.style.left   = el.x+'px'; div.style.top    = el.y+'px';
  div.style.width  = el.w+'px'; div.style.height = el.h+'px';
  div.style.borderColor  = el.color||'#ffffff';
  div.style.borderStyle  = el.sub==='fill' ? 'solid' : 'dashed';
  div.style.background   = el.sub==='fill' ? (el.color||'#ffffff')+'44' : 'transparent';
  div.style.pointerEvents= el.locked ? 'none' : 'auto';

  if (activeId===el.id && !el.locked) {
    const sh = document.createElement('div');
    sh.className = 'zone-sh'; sh.dataset.id = el.id;
    div.appendChild(sh);
  }
  if (el.locked) {
    const lk = document.createElement('div');
    lk.className='zone-lock-icon'; lk.textContent='🔒';
    div.appendChild(lk);
  }
  fMaster.appendChild(div);
}

// ── PAINT VECTOR ─────────────────────────────────────────────
function paintVec(el) {
  let d = '';
  if (el.sub==='line')  d = `M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`;
  else if (el.sub==='curve') d = `M ${el.x1} ${el.y1} C ${el.cx1} ${el.cy1},${el.cx2} ${el.cy2},${el.x2} ${el.y2}`;
  else if (el.sub==='poly' && el.pts && el.pts.length>1)
    d = el.pts.map((p,i)=>`${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
  if (!d) return;

  const col = el.color||'#000000';
  ensureMarker(col);

  const path = document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d',d); path.setAttribute('stroke',col);
  path.setAttribute('stroke-width','3.5'); path.setAttribute('fill','none');
  path.setAttribute('stroke-linecap','round'); path.setAttribute('stroke-linejoin','round');
  if (el.dashed) path.setAttribute('stroke-dasharray','10 7');
  if (el.arrow)  path.setAttribute('marker-end',`url(#mk-${col.replace('#','')})`);
  path.classList.add('v-el'); svgEl.appendChild(path);

  const hit = document.createElementNS('http://www.w3.org/2000/svg','path');
  hit.setAttribute('d',d); hit.setAttribute('stroke','transparent');
  hit.setAttribute('stroke-width','28'); hit.setAttribute('fill','none');
  hit.classList.add('vec-hit','v-el'); hit.dataset.id=el.id;
  hit.style.pointerEvents='auto'; svgEl.appendChild(hit);
}

function ensureMarker(color) {
  const id = 'mk-' + color.replace('#','');
  const defs = svgEl.querySelector('defs');
  if (!defs || defs.querySelector('#'+id)) return;
  const mk = document.createElementNS('http://www.w3.org/2000/svg','marker');
  mk.setAttribute('id',id); mk.setAttribute('markerWidth','8'); mk.setAttribute('markerHeight','6');
  mk.setAttribute('refX','7'); mk.setAttribute('refY','3'); mk.setAttribute('orient','auto');
  const pl = document.createElementNS('http://www.w3.org/2000/svg','polygon');
  pl.setAttribute('points','0 0,8 3,0 6'); pl.setAttribute('fill',color);
  mk.appendChild(pl); defs.appendChild(mk);
}

// ── NODOS ────────────────────────────────────────────────────
function mkNode(el,nx,ny,fx,fy,ctrl=false) {
  const n = document.createElement('div');
  n.className = 'node'+(ctrl?' node-ctrl':'');
  n.style.left=fx+'px'; n.style.top=fy+'px';
  n.dataset.id=el.id; n.dataset.nx=nx;
  if (ny!=null) n.dataset.ny=ny;
  const i=document.createElement('div'); i.className='node-in'; n.appendChild(i);
  fMaster.appendChild(n);
}

// ── INSPECTOR ────────────────────────────────────────────────
function syncInspector(el) {
  if (!el) return;
  const isVec    = el.type==='vec';
  const isPlayer = ['A','B','C','D'].includes(el.type);
  const isZone   = el.type==='zone';

  show('ins-color-row');
  setVal('ins-color', el.color||(isPlayer?teamColors[el.type].c1:'#000000'));

  toggle('ins-arrow-row', isVec); toggle('ins-dash-row', isVec);
  if (isVec) {
    document.getElementById('ins-arrow').checked = !!el.arrow;
    document.getElementById('ins-dash').checked  = !!el.dashed;
  }

  toggle('ins-num-row', isPlayer);
  toggle('ins-stripe-toggle-row', isPlayer);
  toggle('ins-stripe-row', isPlayer && el.striped);
  if (isPlayer) {
    setVal('ins-num', el.num||1);
    document.getElementById('ins-stripe-toggle').checked = !!el.striped;
    setVal('ins-stripe', el.stripeColor||teamColors[el.type].c2);
  }

  toggle('ins-lock-row', isZone);
  if (isZone) document.getElementById('ins-lock').checked = !!el.locked;

  const showFinish = isVec && el.sub==='poly' && isDrawingPoly;
  document.getElementById('btn-finish-poly').style.display = showFinish ? 'block' : 'none';
}
function show(id){ document.getElementById(id).style.display='flex'; }
function toggle(id,on){ document.getElementById(id).style.display=on?'flex':'none'; }
function setVal(id,v){ document.getElementById(id).value=v; }

function modifyProp(prop, val) {
  const el = steps[curStep].find(o=>o.id===activeId); if(!el)return;
  el[prop] = val; render();
  // Re-sync tras render para reflejar cambios en el inspector
  syncInspector(el);
}
function toggleStripe(on) {
  const el=steps[curStep].find(o=>o.id===activeId); if(!el)return;
  el.striped=on; toggle('ins-stripe-row', on); render();
}
function toggleZoneLock(on) {
  const el=steps[curStep].find(o=>o.id===activeId); if(!el)return;
  el.locked=on; if(on)activeId=null; render();
}

// ── CREAR ELEMENTOS ──────────────────────────────────────────
function createPlayer(team) {
  saveState();
  const id=uid(), tc=teamColors[team];
  const el = { id, type:team, x:clamp(300+Math.random()*400,30,FIELD_W-30), y:clamp(200+Math.random()*280,30,FIELD_H-30),
    num:steps[curStep].filter(o=>o.type===team).length+1,
    color:tc.c1, stripeColor:tc.c2, striped:false, scale:1, rot:0 };
  steps[curStep].push(el);
  activeId=id; render(); syncInspector(el);
}

function createItem(type) {
  saveState();
  const id=uid();
  const C={ cone:'#e67e22',cone_low:'#e74c3c',pica:'#f1c40f',valla:'#e74c3c',ladder:'#f1c40f',weight:'#95a5a6' };
  steps[curStep].push({ id, type, x:clamp(300+Math.random()*400,30,FIELD_W-30), y:clamp(200+Math.random()*280,30,FIELD_H-30), color:C[type]||'#e67e22', scale:1, rot:0 });
  activeId=id; render();
}

function createVector(sub) {
  saveState();
  const id=uid();
  // Negro con flecha por defecto
  const base={ id, type:'vec', sub, color:'#000000', arrow:true, dashed:false };
  if (sub==='line')  Object.assign(base,{x1:220,y1:250,x2:430,y2:250});
  if (sub==='curve') Object.assign(base,{x1:200,y1:350,cx1:300,cy1:180,cx2:440,cy2:520,x2:540,y2:350});
  steps[curStep].push(base); activeId=id; render(); syncInspector(base);
}

function startPolyMode() {
  saveState(); isDrawingPoly=true; const id=uid();
  // Negro con flecha por defecto
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
  saveState();
  const id=uid();
  const el = { id, type:'zone', sub, x:200, y:150, w:240, h:180, color:'#ffffff', locked:false };
  steps[curStep].push(el);   // <-- FIX: push al array del paso actual
  activeId=id;
  render();                  // render() después del push
  syncInspector(el);
}

// ── CAMPO ────────────────────────────────────────────────────
function changeField(val) {
  currentField = val;
  fMaster.style.backgroundImage = 'none';
  drawFieldSVG(val);
}

// Dibuja el campo con SVG puro (sin imágenes externas)
function drawFieldSVG(type) {
  const existing = document.getElementById('field-svg-bg');
  if (existing) existing.remove();

  // Color base del fondo
  const grassColors = {
    entero:'#2d8a47', medio:'#2d8a47', ejercicio:'#2e7d32', futsal:'#1a3a5c', blank:'#1a5c2a'
  };
  fMaster.style.background = grassColors[type] || '#2d8a47';

  if (type === 'blank') return;

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.id = 'field-svg-bg';
  svg.setAttribute('viewBox', `0 0 ${FIELD_W} ${FIELD_H}`);
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';

  const lc = (type === 'futsal') ? '#4fc3f7' : 'rgba(255,255,255,0.85)';
  const lw = 2.5;

  function line(x1,y1,x2,y2){
    const l=document.createElementNS(ns,'line');
    l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);
    l.setAttribute('stroke',lc);l.setAttribute('stroke-width',lw);
    svg.appendChild(l); return l;
  }
  function rect(x,y,w,h,fill='none'){
    const r=document.createElementNS(ns,'rect');
    r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',w);r.setAttribute('height',h);
    r.setAttribute('fill',fill);r.setAttribute('stroke',lc);r.setAttribute('stroke-width',lw);
    svg.appendChild(r); return r;
  }
  function circle(cx,cy,r,fill='none'){
    const c=document.createElementNS(ns,'circle');
    c.setAttribute('cx',cx);c.setAttribute('cy',cy);c.setAttribute('r',r);
    c.setAttribute('fill',fill);c.setAttribute('stroke',lc);c.setAttribute('stroke-width',lw);
    svg.appendChild(c); return c;
  }
  function ellipse(cx,cy,rx,ry){
    const e=document.createElementNS(ns,'ellipse');
    e.setAttribute('cx',cx);e.setAttribute('cy',cy);e.setAttribute('rx',rx);e.setAttribute('ry',ry);
    e.setAttribute('fill','none');e.setAttribute('stroke',lc);e.setAttribute('stroke-width',lw);
    svg.appendChild(e); return e;
  }

  // Franjas de hierba
  const stripeW = FIELD_W / 10;
  for (let i=0;i<10;i+=2){
    const sr=document.createElementNS(ns,'rect');
    sr.setAttribute('x',i*stripeW);sr.setAttribute('y',0);
    sr.setAttribute('width',stripeW);sr.setAttribute('height',FIELD_H);
    sr.setAttribute('fill','rgba(0,0,0,0.07)');sr.setAttribute('stroke','none');
    svg.appendChild(sr);
  }

  if (type === 'entero') {
    // Campo completo
    rect(30,30,FIELD_W-60,FIELD_H-60);                   // perímetro
    line(FIELD_W/2,30,FIELD_W/2,FIELD_H-30);              // línea central
    circle(FIELD_W/2,FIELD_H/2,70);                       // círculo central
    circle(FIELD_W/2,FIELD_H/2,3,'white');                 // punto central
    // Área grande izq
    rect(30,FIELD_H/2-110,130,220);
    // Área grande der
    rect(FIELD_W-160,FIELD_H/2-110,130,220);
    // Área pequeña izq
    rect(30,FIELD_H/2-48,52,96);
    // Área pequeña der
    rect(FIELD_W-82,FIELD_H/2-48,52,96);
    // Porterías izq
    rect(10,FIELD_H/2-30,20,60);
    // Porterías der
    rect(FIELD_W-30,FIELD_H/2-30,20,60);
    // Punto penalti izq
    circle(30+95,FIELD_H/2,3,'white');
    // Punto penalti der
    circle(FIELD_W-125,FIELD_H/2,3,'white');
    // Semicírculo área izq
    const pathL=document.createElementNS(ns,'path');
    pathL.setAttribute('d',`M 160 ${FIELD_H/2-47} A 95 95 0 0 1 160 ${FIELD_H/2+47}`);
    pathL.setAttribute('fill','none');pathL.setAttribute('stroke',lc);pathL.setAttribute('stroke-width',lw);
    svg.appendChild(pathL);
    // Semicírculo área der
    const pathR=document.createElementNS(ns,'path');
    pathR.setAttribute('d',`M ${FIELD_W-160} ${FIELD_H/2-47} A 95 95 0 0 0 ${FIELD_W-160} ${FIELD_H/2+47}`);
    pathR.setAttribute('fill','none');pathR.setAttribute('stroke',lc);pathR.setAttribute('stroke-width',lw);
    svg.appendChild(pathR);
    // Esquinas
    const corners=[
      [30,30,0,90],[FIELD_W-30,30,90,180],
      [30,FIELD_H-30,270,360],[FIELD_W-30,FIELD_H-30,180,270]
    ];
    corners.forEach(([cx,cy,sa,ea])=>{
      const p=document.createElementNS(ns,'path');
      const sr=sa*(Math.PI/180),er=ea*(Math.PI/180);
      const x1=cx+12*Math.cos(sr),y1=cy+12*Math.sin(sr);
      const x2=cx+12*Math.cos(er),y2=cy+12*Math.sin(er);
      p.setAttribute('d',`M ${x1} ${y1} A 12 12 0 0 1 ${x2} ${y2}`);
      p.setAttribute('fill','none');p.setAttribute('stroke',lc);p.setAttribute('stroke-width',lw);
      svg.appendChild(p);
    });

  } else if (type === 'medio') {
    // Medio campo
    rect(30,30,FIELD_W-60,FIELD_H-60);
    line(30,FIELD_H/2,FIELD_W-30,FIELD_H/2);
    circle(FIELD_W/2,FIELD_H/2,70);
    circle(FIELD_W/2,FIELD_H/2,3,'white');
    // Área grande arriba
    rect(FIELD_W/2-110,30,220,130);
    rect(FIELD_W/2-48,30,96,52);
    rect(FIELD_W/2-30,10,60,20);   // portería
    circle(FIELD_W/2,30+95,3,'white');
    // Semicírculo
    const pT=document.createElementNS(ns,'path');
    pT.setAttribute('d',`M ${FIELD_W/2-47} 160 A 95 95 0 0 0 ${FIELD_W/2+47} 160`);
    pT.setAttribute('fill','none');pT.setAttribute('stroke',lc);pT.setAttribute('stroke-width',lw);
    svg.appendChild(pT);

  } else if (type === 'ejercicio') {
    // Campo ejercicio: rectángulo simple con línea central
    rect(40,40,FIELD_W-80,FIELD_H-80);
    line(FIELD_W/2,40,FIELD_W/2,FIELD_H-40);
    circle(FIELD_W/2,FIELD_H/2,3,'white');

  } else if (type === 'futsal') {
    // Fútbol sala
    fMaster.style.background = '#1a3a5c';
    rect(30,30,FIELD_W-60,FIELD_H-60);
    line(FIELD_W/2,30,FIELD_W/2,FIELD_H-30);
    circle(FIELD_W/2,FIELD_H/2,70);
    circle(FIELD_W/2,FIELD_H/2,3,'#4fc3f7');
    // Semicírculos área
    const fsL=document.createElementNS(ns,'path');
    fsL.setAttribute('d',`M 30 ${FIELD_H/2-95} A 120 120 0 0 1 30 ${FIELD_H/2+95}`);
    fsL.setAttribute('fill','none');fsL.setAttribute('stroke',lc);fsL.setAttribute('stroke-width',lw);
    svg.appendChild(fsL);
    const fsR=document.createElementNS(ns,'path');
    fsR.setAttribute('d',`M ${FIELD_W-30} ${FIELD_H/2-95} A 120 120 0 0 0 ${FIELD_W-30} ${FIELD_H/2+95}`);
    fsR.setAttribute('fill','none');fsR.setAttribute('stroke',lc);fsR.setAttribute('stroke-width',lw);
    svg.appendChild(fsR);
    rect(10,FIELD_H/2-25,20,50);
    rect(FIELD_W-30,FIELD_H/2-25,20,50);
    circle(30+80,FIELD_H/2,3,lc);
    circle(FIELD_W-110,FIELD_H/2,3,lc);
  }

  fMaster.appendChild(svg);
}

// ── COLORES EQUIPO ───────────────────────────────────────────
function updateTeamColor(team,key,val) {
  teamColors[team][key]=val;
  steps.forEach(s=>s.forEach(el=>{
    if(el.type===team){ if(key==='c1')el.color=val; if(key==='c2')el.stripeColor=val; }
  }));
  updateAllSwatches(); render();
}
function updateAllSwatches() {
  Object.keys(teamColors).forEach(t=>{
    const sw=document.getElementById(`swatch-${t}`); if(sw)sw.style.background=teamColors[t].c1;
    const d=document.getElementById(`dot-${t}`);
    if(d){d.style.background=teamColors[t].c1;d.style.color=isLight(teamColors[t].c1)?'#000':'#fff';}
  });
}

// ── PASOS ────────────────────────────────────────────────────
function navStep(d){const n=curStep+d;if(n<0||n>=steps.length)return;curStep=n;deselect();}
function addStep(){saveState();steps.splice(curStep+1,0,JSON.parse(JSON.stringify(steps[curStep])));curStep++;deselect();}

// ── ANIMACIÓN ────────────────────────────────────────────────
async function runAnimation() {
  if (steps.length<2){alert('Añade al menos 2 pasos para animar');return;}
  isPlaying=true; deselect();
  const dur = getAnimDuration();
  for (let i=0; i<steps.length-1; i++) await animStep(steps[i], steps[i+1], dur);
  isPlaying=false; render();
}

function animStep(f1, f2, dur) {
  return new Promise(res=>{
    let st=null;
    function frame(ts){
      if(!st)st=ts;
      const t=Math.min((ts-st)/dur,1), e=t<0.5?2*t*t:-1+(4-2*t)*t;
      wipe();
      f1.forEach(el=>{if(el.type==='zone')paintZone(el);});
      f1.forEach(el=>{if(el.type==='vec') paintVec(el);});
      f1.forEach(el=>{if(el.type!=='zone'&&el.type!=='vec'&&!ANIM.has(el.type))paintObj(el);});
      f1.forEach(o1=>{
        if(!ANIM.has(o1.type))return;
        const o2=f2.find(x=>x.id===o1.id);
        if(!o2){paintObj(o1);return;}
        const tmp=JSON.parse(JSON.stringify(o1));
        tmp.x=o1.x+(o2.x-o1.x)*e; tmp.y=o1.y+(o2.y-o1.y)*e;
        tmp.scale=(o1.scale||1)+((o2.scale||1)-(o1.scale||1))*e;
        tmp.rot=(o1.rot||0)+((o2.rot||0)-(o1.rot||0))*e;
        paintObj(tmp);
      });
      if(t<1)requestAnimationFrame(frame); else res();
    }
    requestAnimationFrame(frame);
  });
}

// ── BIBLIOTECA ───────────────────────────────────────────────
function openLibrary() {
  const g=document.getElementById('library-grid'); g.innerHTML='';
  DRILLS.forEach(d=>{
    const c=document.createElement('div'); c.className='lib-card';
    c.innerHTML=`<div class="lib-icon">${d.icon}</div><div class="lib-name">${d.name}</div><div class="lib-desc">${d.desc}</div>`;
    c.onclick=()=>injectDrill(d); g.appendChild(c);
  });
  document.getElementById('library-modal').classList.add('open');
}
function closeLibrary(){document.getElementById('library-modal').classList.remove('open');}

function injectDrill(drill) {
  saveState();
  // 1. Construir bidMap: _bid → id_real ÚNICO compartido por todos los pasos
  const bidMap={};
  const base=Date.now();
  drill.steps.forEach(step=>step.forEach(el=>{
    if(el._bid && !bidMap[el._bid])
      bidMap[el._bid]=base+'_'+(++idCounter)+'_'+el._bid;
  }));

  // 2. Convertir cada paso aplicando ids reales y colores de equipo actuales
  const newSteps=drill.steps.map(step=>step.map(raw=>{
    const el=JSON.parse(JSON.stringify(raw));
    el.id = el._bid ? bidMap[el._bid] : uid();
    delete el._bid;
    if(['A','B','C','D'].includes(el.type)){
      el.color       = teamColors[el.type].c1;
      el.stripeColor = teamColors[el.type].c2;
      el.striped     = el.striped||false;
    }
    el.scale = el.scale??1;
    el.rot   = el.rot??0;
    return el;
  }));

  // 3. Reemplazar el array completo de pasos
  steps.length=0;
  newSteps.forEach(s=>steps.push(s));
  curStep=0;
  deselect();     // deselect llama render()
  closeLibrary();
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

function renderForExport(f1,f2,ease){
  wipe();
  f1.forEach(el=>{if(el.type==='zone')paintZone(el);});
  f1.forEach(el=>{if(el.type==='vec') paintVec(el);});
  f1.forEach(el=>{if(el.type!=='zone'&&el.type!=='vec'&&!ANIM.has(el.type))paintObj(el);});
  f1.forEach(o1=>{
    if(!ANIM.has(o1.type))return;
    const o2=f2.find(x=>x.id===o1.id);
    if(!o2){paintObj(o1);return;}
    const tmp=JSON.parse(JSON.stringify(o1));
    tmp.x=o1.x+(o2.x-o1.x)*ease;tmp.y=o1.y+(o2.y-o1.y)*ease;
    tmp.scale=(o1.scale||1)+((o2.scale||1)-(o1.scale||1))*ease;
    tmp.rot=(o1.rot||0)+((o2.rot||0)-(o1.rot||0))*ease;
    paintObj(tmp);
  });
}

async function exportMP4(){
  const FPS=25,dur=getAnimDuration();
  const fpsStep=Math.round((dur/1000)*FPS),total=fpsStep*(steps.length-1);
  setExportProgress(5,`Capturando ${total} frames...`);deselect();isPlaying=true;
  const W=fMaster.offsetWidth,H=fMaster.offsetHeight;
  const rc=document.createElement('canvas');rc.width=W;rc.height=H;
  const ctx=rc.getContext('2d');const snaps=[];
  for(let i=0;i<steps.length-1;i++){
    for(let f=0;f<fpsStep;f++){
      const t=f/fpsStep,ease=t<0.5?2*t*t:-1+(4-2*t)*t;
      renderForExport(steps[i],steps[i+1],ease);
      await new Promise(r=>requestAnimationFrame(r));await new Promise(r=>setTimeout(r,0));
      snaps.push(await html2canvas(fMaster,{scale:1,useCORS:true,backgroundColor:'#1a5c2a',logging:false}));
      setExportProgress(5+Math.round(((i*fpsStep+f+1)/total)*55),`Frame ${i*fpsStep+f+1}/${total}`);
    }
  }
  renderForExport(steps[steps.length-1],steps[steps.length-1],0);
  await new Promise(r=>setTimeout(r,60));
  const ls=await html2canvas(fMaster,{scale:1,useCORS:true,backgroundColor:'#1a5c2a',logging:false});
  for(let k=0;k<FPS;k++)snaps.push(ls);
  isPlaying=false;render();
  setExportProgress(62,'Ensamblando...');
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
  }catch(err){
    setExportProgress(100,'Descargando WebM...');await new Promise(r=>setTimeout(r,600));
    const url=URL.createObjectURL(wb);const a=document.createElement('a');a.href=url;a.download=`tactica_${Date.now()}.webm`;a.click();URL.revokeObjectURL(url);closeExportModal();
  }
}

let _ff=null;
async function getFFmpeg(){
  if(_ff)return _ff;
  if(!window.FFmpeg)     await loadScript('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js');
  if(!window.FFmpegUtil) await loadScript('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/umd/index.js');
  const{FFmpeg}=window.FFmpeg,{fetchFile,toBlobURL}=window.FFmpegUtil;
  window._ffFetch=fetchFile;
  const ff=new FFmpeg();
  const base='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
  await ff.load({coreURL:await toBlobURL(`${base}/ffmpeg-core.js`,'text/javascript'),wasmURL:await toBlobURL(`${base}/ffmpeg-core.wasm`,'application/wasm')});
  _ff=ff;return ff;
}
async function convertToMP4(blob,onP){
  const ff=await getFFmpeg();await ff.writeFile('i.webm',await window._ffFetch(blob));
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
  const FPS=20,dur=getAnimDuration();
  const fpsStep=Math.max(8,Math.round((dur/1000)*FPS)),total=fpsStep*(steps.length-1);
  deselect();isPlaying=true;
  const gif=new GIF({workers:2,quality:6,width:fMaster.offsetWidth,height:fMaster.offsetHeight,workerScript:'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'});
  let done=0;
  for(let i=0;i<steps.length-1;i++) for(let f=0;f<fpsStep;f++){
    const t=f/fpsStep,ease=t<0.5?2*t*t:-1+(4-2*t)*t;
    renderForExport(steps[i],steps[i+1],ease);
    await new Promise(r=>requestAnimationFrame(r));await new Promise(r=>setTimeout(r,0));
    gif.addFrame(await html2canvas(fMaster,{scale:1,useCORS:true,backgroundColor:'#1a5c2a',logging:false}),{delay:Math.round(1000/FPS),copy:true});
    done++;setExportProgress(5+Math.round((done/total)*80),`Frame ${done}/${total}`);
  }
  isPlaying=false;render();setExportProgress(88,'Compilando GIF...');
  gif.on('progress',p=>setExportProgress(88+Math.round(p*10),'Compilando...'));
  gif.on('finished',blob=>{setExportProgress(100,'¡Listo!');setTimeout(()=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`tactica_${Date.now()}.gif`;a.click();URL.revokeObjectURL(url);closeExportModal();},400);});
  gif.render();
}

// ── PANTALLA COMPLETA ────────────────────────────────────────
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(()=>{});
  } else {
    document.exitFullscreen().catch(()=>{});
  }
}
document.addEventListener('fullscreenchange', () => {
  const btn = document.getElementById('btn-fs');
  if (btn) btn.textContent = document.fullscreenElement ? '⛶' : '⛶';
});

// ── UTILIDADES ───────────────────────────────────────────────────
function saveState(){if(history.length>40)history.shift();history.push(JSON.stringify(steps));}
function undo(){if(!history.length)return;steps=JSON.parse(history.pop());if(curStep>=steps.length)curStep=steps.length-1;render();}
function deselect(){activeId=null;if(isDrawingPoly)finishPoly();render();}
function duplicateActive(){
  if(!activeId)return;saveState();
  const orig=steps[curStep].find(o=>o.id===activeId);if(!orig)return;
  const copy=JSON.parse(JSON.stringify(orig));copy.id=uid();
  if(copy.type==='zone'){copy.x=clamp(copy.x+20,0,FIELD_W-copy.w);copy.y=clamp(copy.y+20,0,FIELD_H-copy.h);}
  else if(copy.type!=='vec'){copy.x=clamp(copy.x+40,0,FIELD_W);copy.y=clamp(copy.y+40,0,FIELD_H);}
  steps[curStep].push(copy);activeId=copy.id;render();
}
function deleteActive(){if(!activeId)return;saveState();steps[curStep]=steps[curStep].filter(o=>o.id!==activeId);activeId=null;render();}
function openResetMenu(){document.getElementById('reset-modal').classList.add('open');}
function closeResetMenu(){document.getElementById('reset-modal').classList.remove('open');}
function resetAction(t){saveState();if(t==='step')steps[curStep]=[];else{steps=[[]];curStep=0;}closeResetMenu();deselect();}
function isLight(hex){if(!hex||hex.length<7)return false;const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return(r*299+g*587+b*114)/1000>155;}
