/* ============================================================
   SM SoccerBoard Pro v70 — script.js
   © Academia SM Fútbol — Las Palmas de Gran Canaria
   ============================================================ */

// ── ESTADO GLOBAL ────────────────────────────────────────────
let steps = [[]];           // pasos de la animación
let history = [];           // pila undo
let curStep = 0;
let activeId = null;
let dragInfo = null;
let isPlaying = false;
let isDrawingPoly = false;
let activePointers = new Map();
let initialPinchDist = null;
let tapStartX = 0, tapStartY = 0;
let isPossibleTap = false;
let idCounter = 1;

// Colores de equipo (c1 = principal, c2 = rayas)
let teamColors = {
  A: { c1: '#ff4757', c2: '#ffffff' },
  B: { c1: '#2e86de', c2: '#ffffff' },
  C: { c1: '#f1c40f', c2: '#000000' },
  D: { c1: '#2ecc71', c2: '#ffffff' }
};

// ── REFERENCIAS DOM ──────────────────────────────────────────
const fMaster = document.getElementById('field-master');
const svgLayer = document.getElementById('svg-layer');
const viewport = document.getElementById('viewport');

// ── BIBLIOTECA DE TAREAS (JSON) ──────────────────────────────
const drillLibrary = [
  {
    key: 'rondo41',
    name: 'Rondo 4×1',
    icon: '🔵',
    desc: 'Posesión 4 vs 1',
    steps: [
      [
        { type: 'zone', sub: 'line', x: 350, y: 190, w: 280, h: 280, color: '#ffffff' },
        { type: 'A', x: 350, y: 190, num: 1, striped: false },
        { type: 'A', x: 630, y: 190, num: 2, striped: false },
        { type: 'A', x: 350, y: 470, num: 3, striped: false },
        { type: 'A', x: 630, y: 470, num: 4, striped: false },
        { type: 'B', x: 490, y: 330, num: 1, striped: false },
        { type: 'ball', x: 350, y: 190 }
      ],
      [
        { type: 'zone', sub: 'line', x: 350, y: 190, w: 280, h: 280, color: '#ffffff' },
        { type: 'A', x: 350, y: 190, num: 1, striped: false },
        { type: 'A', x: 630, y: 190, num: 2, striped: false },
        { type: 'A', x: 350, y: 470, num: 3, striped: false },
        { type: 'A', x: 630, y: 470, num: 4, striped: false },
        { type: 'B', x: 420, y: 250, num: 1, striped: false },
        { type: 'ball', x: 630, y: 190 },
        { type: 'vec', sub: 'line', x1: 350, y1: 190, x2: 615, y2: 190, color: '#ffffff', arrow: true, dashed: false }
      ],
      [
        { type: 'zone', sub: 'line', x: 350, y: 190, w: 280, h: 280, color: '#ffffff' },
        { type: 'A', x: 350, y: 190, num: 1, striped: false },
        { type: 'A', x: 630, y: 190, num: 2, striped: false },
        { type: 'A', x: 350, y: 470, num: 3, striped: false },
        { type: 'A', x: 630, y: 470, num: 4, striped: false },
        { type: 'B', x: 560, y: 350, num: 1, striped: false },
        { type: 'ball', x: 350, y: 470 },
        { type: 'vec', sub: 'line', x1: 630, y1: 190, x2: 365, y2: 455, color: '#ffffff', arrow: true, dashed: false }
      ]
    ]
  },
  {
    key: 'rondo42',
    name: 'Rondo 4×2',
    icon: '🟦',
    desc: 'Posesión 4 vs 2',
    steps: [
      [
        { type: 'zone', sub: 'line', x: 330, y: 180, w: 300, h: 300, color: '#ffffff' },
        { type: 'A', x: 330, y: 180, num: 1, striped: false },
        { type: 'A', x: 630, y: 180, num: 2, striped: false },
        { type: 'A', x: 330, y: 480, num: 3, striped: false },
        { type: 'A', x: 630, y: 480, num: 4, striped: false },
        { type: 'B', x: 460, y: 300, num: 1, striped: false },
        { type: 'B', x: 540, y: 360, num: 2, striped: false },
        { type: 'ball', x: 330, y: 180 }
      ]
    ]
  },
  {
    key: 'transicion',
    name: 'Transición 3v2',
    icon: '⚡',
    desc: 'Ataque rápido',
    steps: [
      [
        { type: 'A', x: 200, y: 340, num: 1, striped: false },
        { type: 'A', x: 340, y: 220, num: 2, striped: false },
        { type: 'A', x: 340, y: 460, num: 3, striped: false },
        { type: 'B', x: 650, y: 280, num: 1, striped: false },
        { type: 'B', x: 650, y: 400, num: 2, striped: false },
        { type: 'ball', x: 200, y: 340 }
      ],
      [
        { type: 'A', x: 380, y: 340, num: 1, striped: false },
        { type: 'A', x: 520, y: 200, num: 2, striped: false },
        { type: 'A', x: 520, y: 480, num: 3, striped: false },
        { type: 'B', x: 680, y: 280, num: 1, striped: false },
        { type: 'B', x: 680, y: 400, num: 2, striped: false },
        { type: 'ball', x: 380, y: 340 },
        { type: 'vec', sub: 'line', x1: 200, y1: 340, x2: 365, y2: 340, color: '#f1c40f', arrow: true, dashed: false }
      ],
      [
        { type: 'A', x: 560, y: 340, num: 1, striped: false },
        { type: 'A', x: 680, y: 180, num: 2, striped: false },
        { type: 'A', x: 680, y: 500, num: 3, striped: false },
        { type: 'B', x: 710, y: 280, num: 1, striped: false },
        { type: 'B', x: 710, y: 400, num: 2, striped: false },
        { type: 'ball', x: 680, y: 180 },
        { type: 'vec', sub: 'line', x1: 380, y1: 340, x2: 665, y2: 195, color: '#f1c40f', arrow: true, dashed: false }
      ]
    ]
  },
  {
    key: 'presion',
    name: 'Presión alta',
    icon: '🔴',
    desc: 'Salida presionada',
    steps: [
      [
        { type: 'A', x: 200, y: 340, num: 1, striped: false },
        { type: 'B', x: 300, y: 240, num: 1, striped: false },
        { type: 'B', x: 300, y: 440, num: 2, striped: false },
        { type: 'B', x: 180, y: 340, num: 3, striped: false },
        { type: 'ball', x: 200, y: 340 }
      ],
      [
        { type: 'A', x: 200, y: 340, num: 1, striped: false },
        { type: 'B', x: 240, y: 280, num: 1, striped: false },
        { type: 'B', x: 240, y: 400, num: 2, striped: false },
        { type: 'B', x: 185, y: 340, num: 3, striped: false },
        { type: 'ball', x: 200, y: 340 },
        { type: 'vec', sub: 'curve', x1: 300, y1: 240, cx1: 280, cy1: 280, cx2: 255, cy2: 275, x2: 240, y2: 280, color: '#ff4757', arrow: true, dashed: false },
        { type: 'vec', sub: 'curve', x1: 300, y1: 440, cx1: 280, cy1: 420, cx2: 255, cy2: 405, x2: 240, y2: 400, color: '#ff4757', arrow: true, dashed: false }
      ]
    ]
  },
  {
    key: 'circuito',
    name: 'Circuito técnico',
    icon: '🏃',
    desc: 'Conducción + pase',
    steps: [
      [
        { type: 'cone', x: 200, y: 300, rot: 0, scale: 1 },
        { type: 'cone', x: 300, y: 300, rot: 0, scale: 1 },
        { type: 'cone', x: 400, y: 300, rot: 0, scale: 1 },
        { type: 'cone', x: 500, y: 300, rot: 0, scale: 1 },
        { type: 'pica', x: 600, y: 300, rot: 0, scale: 1 },
        { type: 'A', x: 160, y: 300, num: 1, striped: false },
        { type: 'ball', x: 160, y: 300 }
      ],
      [
        { type: 'cone', x: 200, y: 300, rot: 0, scale: 1 },
        { type: 'cone', x: 300, y: 300, rot: 0, scale: 1 },
        { type: 'cone', x: 400, y: 300, rot: 0, scale: 1 },
        { type: 'cone', x: 500, y: 300, rot: 0, scale: 1 },
        { type: 'pica', x: 600, y: 300, rot: 0, scale: 1 },
        { type: 'A', x: 600, y: 300, num: 1, striped: false },
        { type: 'ball', x: 600, y: 300 },
        { type: 'vec', sub: 'poly', pts: [{x:160,y:300},{x:250,y:260},{x:350,y:330},{x:450,y:260},{x:600,y:300}], color: '#f1c40f', arrow: true, dashed: false }
      ]
    ]
  },
  {
    key: 'corner',
    name: 'Córner ensayado',
    icon: '🏁',
    desc: 'Jugada a balón parado',
    steps: [
      [
        { type: 'A', x: 950, y: 620, num: 1, striped: false },
        { type: 'A', x: 800, y: 400, num: 2, striped: false },
        { type: 'A', x: 820, y: 480, num: 3, striped: false },
        { type: 'A', x: 750, y: 320, num: 4, striped: false },
        { type: 'B', x: 830, y: 400, num: 1, striped: false },
        { type: 'B', x: 840, y: 480, num: 2, striped: false },
        { type: 'ball', x: 1020, y: 650 }
      ],
      [
        { type: 'A', x: 950, y: 620, num: 1, striped: false },
        { type: 'A', x: 840, y: 380, num: 2, striped: false },
        { type: 'A', x: 820, y: 440, num: 3, striped: false },
        { type: 'A', x: 760, y: 300, num: 4, striped: false },
        { type: 'B', x: 860, y: 390, num: 1, striped: false },
        { type: 'B', x: 855, y: 470, num: 2, striped: false },
        { type: 'ball', x: 840, y: 380 },
        { type: 'vec', sub: 'curve', x1: 1020, y1: 650, cx1: 980, cy1: 500, cx2: 900, cy2: 380, x2: 845, y2: 382, color: '#ffffff', arrow: true, dashed: false }
      ]
    ]
  }
];

// ── INICIALIZACIÓN ───────────────────────────────────────────
window.onload = () => {
  resizeField();
  updateAllSwatches();
  updateSpeedLabel();
  render();
};
window.addEventListener('resize', resizeField);

document.getElementById('speed-slider').addEventListener('input', updateSpeedLabel);

function updateSpeedLabel() {
  const v = document.getElementById('speed-slider').value;
  document.getElementById('speed-value').textContent = `${v}ms / paso`;
}

// ── REDIMENSIONAR CAMPO ──────────────────────────────────────
function resizeField() {
  const vp = document.getElementById('viewport').getBoundingClientRect();
  const s = Math.min(vp.width / 1050, vp.height / 680) * 0.97;
  fMaster.style.transform = `scale(${s})`;
}

// ── GESTIÓN DE IDs ───────────────────────────────────────────
function newId() { return ++idCounter + Date.now(); }

// ── EVENTOS DE PUNTERO ───────────────────────────────────────
viewport.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

function onPointerDown(e) {
  if (isPlaying) return;
  tapStartX = e.clientX; tapStartY = e.clientY;
  isPossibleTap = true;

  const hit = e.target.closest('.object, .vec-hit, .zone-obj, .node');
  const hitId = hit ? Number(hit.dataset.id) : null;

  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  const rect = fMaster.getBoundingClientRect();
  const zoom = rect.width / 1050;

  // Modo polígono: cada tap añade punto
  if (isDrawingPoly && activeId) {
    const el = steps[curStep].find(o => o.id === activeId);
    if (el) {
      el.pts.push({ x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom });
      render();
    }
    return;
  }

  if (activePointers.size === 1) {
    const wasSelected = (activeId === hitId && hitId !== null);
    activeId = hitId;

    if (activeId) {
      const el = steps[curStep].find(o => o.id === activeId);
      if (el && (wasSelected || (hit && hit.classList.contains('node')))) {
        saveState();
        dragInfo = {
          el,
          nx: hit.dataset.nx,
          ny: hit.dataset.ny,
          lastX: e.clientX,
          lastY: e.clientY,
          zoom
        };
      }
      updateInspector(el);
    } else {
      deselect();
    }
  } else if (activePointers.size === 2 && activeId) {
    const pts = Array.from(activePointers.values());
    initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }
  render();
}

function onPointerMove(e) {
  if (!activePointers.has(e.pointerId) || isPlaying) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (isPossibleTap && Math.hypot(e.clientX - tapStartX, e.clientY - tapStartY) > 6) {
    isPossibleTap = false;
  }

  // Pellizco → escalar
  if (activePointers.size === 2 && activeId && initialPinchDist) {
    const el = steps[curStep].find(o => o.id === activeId);
    if (el) {
      const pts = Array.from(activePointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const delta = dist / initialPinchDist;
      el.scale = Math.min(4, Math.max(0.25, (el.scale || 1) * delta));
      initialPinchDist = dist;
      render();
    }
    return;
  }

  if (dragInfo && activePointers.size === 1 && !isDrawingPoly) {
    const dx = (e.clientX - dragInfo.lastX) / dragInfo.zoom;
    const dy = (e.clientY - dragInfo.lastY) / dragInfo.zoom;
    const el = dragInfo.el;

    if (dragInfo.nx !== undefined && dragInfo.nx !== '') {
      const nx = dragInfo.nx; const ny = dragInfo.ny;
      if (el.sub === 'poly') {
        el.pts[nx].x += dx; el.pts[nx].y += dy;
      } else {
        el[nx] += dx; el[ny] += dy;
      }
    } else {
      // Mover objeto completo
      if (el.sub === 'poly') {
        el.pts.forEach(p => { p.x += dx; p.y += dy; });
      } else if (el.type === 'vec') {
        ['x1','x2','cx1','cx2'].forEach(k => { if (el[k] !== undefined) el[k] += dx; });
        ['y1','y2','cy1','cy2'].forEach(k => { if (el[k] !== undefined) el[k] += dy; });
      } else {
        el.x += dx; el.y += dy;
      }
    }
    dragInfo.lastX = e.clientX; dragInfo.lastY = e.clientY;
    render();
  }
}

function onPointerUp(e) {
  // Tap → rotar 15°
  if (isPossibleTap && activeId && activePointers.size === 1 && !isDrawingPoly) {
    const el = steps[curStep].find(o => o.id === activeId);
    if (el && el.type !== 'vec' && el.type !== 'zone') {
      el.rot = ((el.rot || 0) + 15) % 360;
      render();
    }
  }

  activePointers.delete(e.pointerId);
  if (activePointers.size < 2) initialPinchDist = null;
  dragInfo = null;
}

// ── RENDERIZADO PRINCIPAL ────────────────────────────────────
function render() {
  if (isPlaying) return;

  // Limpiar objetos físicos (no SVG)
  Array.from(fMaster.children).forEach(c => {
    if (c.id !== 'svg-layer') fMaster.removeChild(c);
  });

  // Limpiar SVG (preservar defs)
  const defs = svgLayer.querySelector('defs');
  svgLayer.innerHTML = '';
  if (defs) svgLayer.appendChild(defs);

  const step = steps[curStep];
  step.forEach(el => {
    if (el.type === 'vec') drawVector(el);
    else if (el.type === 'zone') drawZone(el);
    else drawPhysical(el);
  });

  // Nodos de control del elemento activo
  if (activeId) {
    const el = step.find(o => o.id === activeId);
    if (el && el.type === 'vec') {
      if (el.sub === 'line') {
        createNode(el, 'x1', 'y1', el.x1, el.y1);
        createNode(el, 'x2', 'y2', el.x2, el.y2);
      } else if (el.sub === 'curve') {
        createNode(el, 'x1', 'y1', el.x1, el.y1);
        createNode(el, 'cx1', 'cy1', el.cx1, el.cy1, true);
        createNode(el, 'cx2', 'cy2', el.cx2, el.cy2, true);
        createNode(el, 'x2', 'y2', el.x2, el.y2);
      } else if (el.sub === 'poly') {
        el.pts.forEach((p, i) => createNode(el, i, null, p.x, p.y));
      }
    }
  }

  document.getElementById('step-label').innerText = `${curStep + 1} / ${steps.length}`;
  document.getElementById('inspector-panel').style.display = activeId ? 'block' : 'none';
}

// ── DIBUJAR OBJETOS FÍSICOS ──────────────────────────────────
function drawPhysical(el) {
  const div = document.createElement('div');
  div.className = `object ${activeId === el.id ? 'selected' : ''}`;
  div.dataset.id = el.id;

  if (['A','B','C','D'].includes(el.type)) {
    // Jugador
    const inner = document.createElement('div');
    inner.className = 'player-obj' + (el.striped ? ' striped' : '');
    const tc = teamColors[el.type];
    if (el.striped) {
      inner.style.setProperty('--c1', tc.c1);
      inner.style.setProperty('--c2', el.stripeColor || tc.c2);
    } else {
      inner.style.background = el.color || tc.c1;
    }
    inner.style.color = isLight(el.color || tc.c1) ? '#000' : '#fff';
    inner.textContent = el.num || 1;
    div.appendChild(inner);
  } else if (el.type === 'ball') {
    div.className += ' ball-obj';
    div.textContent = '⚽';
  } else {
    const shape = document.createElement('div');
    shape.className = `${el.type}-obj`;
    if (el.color) shape.style.borderBottomColor = el.color;
    div.appendChild(shape);
  }

  div.style.left = el.x + 'px';
  div.style.top = el.y + 'px';
  div.style.transform = `translate(-50%, -50%) rotate(${el.rot || 0}deg) scale(${el.scale || 1})`;
  fMaster.appendChild(div);
}

// ── DIBUJAR ZONA ─────────────────────────────────────────────
function drawZone(el) {
  const div = document.createElement('div');
  div.className = `zone-obj ${activeId === el.id ? 'selected' : ''}`;
  div.dataset.id = el.id;
  div.style.left = el.x + 'px';
  div.style.top = el.y + 'px';
  div.style.width = el.w + 'px';
  div.style.height = el.h + 'px';
  div.style.borderColor = el.color || '#fff';
  if (el.sub === 'fill') div.style.background = (el.color || '#fff') + '33';
  fMaster.appendChild(div);
}

// ── DIBUJAR VECTOR ───────────────────────────────────────────
function drawVector(el) {
  let d = '';
  if (el.sub === 'line') {
    d = `M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`;
  } else if (el.sub === 'curve') {
    d = `M ${el.x1} ${el.y1} C ${el.cx1} ${el.cy1}, ${el.cx2} ${el.cy2}, ${el.x2} ${el.y2}`;
  } else if (el.sub === 'poly' && el.pts && el.pts.length > 1) {
    d = el.pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }
  if (!d) return;

  const col = el.color || '#ffffff';
  const markerId = getArrowMarkerId(col);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('stroke', col);
  path.setAttribute('stroke-width', '3.5');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  if (el.dashed) path.setAttribute('stroke-dasharray', '10 7');
  if (el.arrow) path.setAttribute('marker-end', `url(#${markerId})`);
  path.classList.add('v-el');
  svgLayer.appendChild(path);

  // Hit area invisible para selección
  const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  hit.setAttribute('d', d);
  hit.setAttribute('stroke', 'transparent');
  hit.setAttribute('stroke-width', '28');
  hit.setAttribute('fill', 'none');
  hit.setAttribute('class', 'vec-hit v-el');
  hit.dataset.id = el.id;
  hit.style.pointerEvents = 'auto';
  svgLayer.appendChild(hit);
}

function getArrowMarkerId(color) {
  const map = {
    '#ffffff': 'arrow-white',
    '#f1c40f': 'arrow-yellow',
    '#ff4757': 'arrow-red',
    '#2e86de': 'arrow-blue',
    '#2ecc71': 'arrow-green',
    '#e67e22': 'arrow-orange'
  };
  return map[color.toLowerCase()] || 'arrow-white';
}

// ── NODOS DE CONTROL ─────────────────────────────────────────
function createNode(el, nx, ny, fx, fy, isCtrl = false) {
  const node = document.createElement('div');
  node.className = `node ${isCtrl ? 'node-ctrl' : ''}`;
  node.style.left = fx + 'px';
  node.style.top = fy + 'px';
  node.dataset.id = el.id;
  node.dataset.nx = nx;
  if (ny !== null) node.dataset.ny = ny;
  const inner = document.createElement('div');
  inner.className = 'node-in';
  node.appendChild(inner);
  fMaster.appendChild(node);
}

// ── INSPECTOR ────────────────────────────────────────────────
function updateInspector(el) {
  if (!el) return;
  const isVec = el.type === 'vec';
  const isPlayer = ['A','B','C','D'].includes(el.type);

  document.getElementById('ins-color-row').style.display = 'flex';
  document.getElementById('ins-color').value = el.color || (isPlayer ? teamColors[el.type].c1 : '#ffffff');

  document.getElementById('ins-arrow-row').style.display = isVec ? 'flex' : 'none';
  document.getElementById('ins-dash-row').style.display = isVec ? 'flex' : 'none';
  if (isVec) {
    document.getElementById('ins-arrow').checked = !!el.arrow;
    document.getElementById('ins-dash').checked = !!el.dashed;
  }

  document.getElementById('ins-num-row').style.display = isPlayer ? 'flex' : 'none';
  if (isPlayer) document.getElementById('ins-num').value = el.num || 1;

  document.getElementById('ins-stripe-toggle-row').style.display = isPlayer ? 'flex' : 'none';
  document.getElementById('ins-stripe-row').style.display = (isPlayer && el.striped) ? 'flex' : 'none';
  if (isPlayer) {
    document.getElementById('ins-stripe-toggle').checked = !!el.striped;
    document.getElementById('ins-stripe').value = el.stripeColor || teamColors[el.type].c2;
  }

  document.getElementById('btn-finish-poly').style.display = (isVec && el.sub === 'poly' && isDrawingPoly) ? 'block' : 'none';
}

function modifyProp(prop, val) {
  const el = steps[curStep].find(o => o.id === activeId);
  if (!el) return;
  el[prop] = val;
  if (prop === 'color') document.getElementById('ins-color').value = val;
  render();
}

function toggleStripe(on) {
  const el = steps[curStep].find(o => o.id === activeId);
  if (!el) return;
  el.striped = on;
  document.getElementById('ins-stripe-row').style.display = on ? 'flex' : 'none';
  render();
}

// ── CREACIÓN DE ELEMENTOS ────────────────────────────────────
function createPlayer(team) {
  saveState();
  const id = newId();
  const tc = teamColors[team];
  steps[curStep].push({
    id, type: team,
    x: 200 + Math.random() * 100,
    y: 200 + Math.random() * 100,
    num: steps[curStep].filter(o => o.type === team).length + 1,
    color: tc.c1,
    stripeColor: tc.c2,
    striped: false,
    scale: 1, rot: 0
  });
  activeId = id;
  render();
  updateInspector(steps[curStep].find(o => o.id === id));
}

function createItem(type) {
  saveState();
  const id = newId();
  const colorMap = { cone: '#e67e22', cone_low: '#e74c3c', pica: '#f1c40f', valla: '#e74c3c', ladder: '#f1c40f', weight: '#95a5a6', ball: '#fff' };
  steps[curStep].push({
    id, type,
    x: 220 + Math.random() * 80,
    y: 220 + Math.random() * 80,
    color: colorMap[type] || '#ffffff',
    scale: 1, rot: 0
  });
  activeId = id;
  render();
}

function createVector(sub) {
  saveState();
  const id = newId();
  const base = { id, type: 'vec', sub, color: '#ffffff', arrow: true, dashed: false };
  if (sub === 'line') Object.assign(base, { x1: 180, y1: 200, x2: 380, y2: 200 });
  if (sub === 'curve') Object.assign(base, { x1: 150, y1: 300, cx1: 250, cy1: 160, cx2: 400, cy2: 440, x2: 500, y2: 300 });
  steps[curStep].push(base);
  activeId = id;
  render();
  updateInspector(base);
}

function startPolyMode() {
  saveState();
  isDrawingPoly = true;
  const id = newId();
  steps[curStep].push({ id, type: 'vec', sub: 'poly', pts: [], color: '#ffffff', arrow: true, dashed: false });
  activeId = id;
  document.getElementById('poly-indicator').style.display = 'block';
  document.getElementById('btn-finish-poly').style.display = 'block';
  render();
}

function finishPoly() {
  isDrawingPoly = false;
  document.getElementById('poly-indicator').style.display = 'none';
  document.getElementById('btn-finish-poly').style.display = 'none';
  render();
}

// ── CAMPO / FONDO ────────────────────────────────────────────
function changeField(val) {
  const imgs = {
    entero: 'campoentero.png',
    medio: 'mediocampo.png',
    ejercicio: 'campoejercicio.png',
    futsal: 'futsal.png',
    blank: null
  };
  if (val === 'blank') {
    fMaster.style.backgroundImage = 'none';
    fMaster.classList.add('field-blank');
  } else {
    fMaster.style.backgroundImage = imgs[val] ? `url('${imgs[val]}')` : 'none';
    fMaster.style.backgroundSize = '100% 100%';
    fMaster.style.backgroundRepeat = 'no-repeat';
    fMaster.style.backgroundPosition = 'center';
    fMaster.classList.remove('field-blank');
  }
}

// ── COLORES EQUIPOS ──────────────────────────────────────────
function updateTeamColor(team, key, val) {
  teamColors[team][key] = val;
  // Actualizar todos los jugadores del equipo
  steps.forEach(step => {
    step.forEach(el => {
      if (el.type === team) {
        if (key === 'c1') el.color = val;
        if (key === 'c2') el.stripeColor = val;
      }
    });
  });
  updateAllSwatches();
  render();
}

function updateAllSwatches() {
  Object.keys(teamColors).forEach(t => {
    const sw = document.getElementById(`swatch-${t}`);
    if (sw) sw.style.background = teamColors[t].c1;
    const dotEl = document.getElementById(`dot-${t}`);
    if (dotEl) {
      dotEl.style.background = teamColors[t].c1;
      dotEl.style.color = isLight(teamColors[t].c1) ? '#000' : '#fff';
    }
  });
}

// ── NAVEGACIÓN PASOS ─────────────────────────────────────────
function navStep(d) {
  const next = curStep + d;
  if (next < 0 || next >= steps.length) return;
  curStep = next;
  deselect();
}

function addStep() {
  saveState();
  steps.splice(curStep + 1, 0, JSON.parse(JSON.stringify(steps[curStep])));
  curStep++;
  deselect();
}

// ── ANIMACIÓN FLUIDA ─────────────────────────────────────────
async function runAnimation() {
  if (steps.length < 2) { alert('Añade al menos 2 pasos para animar'); return; }
  isPlaying = true;
  deselect();
  const duration = parseInt(document.getElementById('speed-slider').value);

  for (let i = 0; i < steps.length - 1; i++) {
    await animateStep(steps[i], steps[i + 1], duration);
  }

  isPlaying = false;
  render();
}

function animateStep(f1, f2, dur) {
  return new Promise(res => {
    let startTs = null;

    function frame(ts) {
      if (!startTs) startTs = ts;
      const t = Math.min((ts - startTs) / dur, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out

      // Limpiar objetos físicos
      Array.from(fMaster.children).forEach(c => { if (c.id !== 'svg-layer') fMaster.removeChild(c); });

      // Limpiar SVG
      const defs = svgLayer.querySelector('defs');
      svgLayer.innerHTML = '';
      if (defs) svgLayer.appendChild(defs);

      f1.forEach(o1 => {
        const o2 = f2.find(x => x.id === o1.id);
        if (!o2) return;

        if (o1.type === 'vec' || o1.type === 'zone') {
          // Interpolar vectores (posición)
          if (o1.type === 'vec') {
            const interp = JSON.parse(JSON.stringify(o1));
            if (o1.sub === 'line' || o1.sub === 'curve') {
              ['x1','y1','x2','y2','cx1','cy1','cx2','cy2'].forEach(k => {
                if (o1[k] !== undefined && o2[k] !== undefined)
                  interp[k] = o1[k] + (o2[k] - o1[k]) * ease;
              });
            }
            drawVector(interp);
          }
          return;
        }

        const tmp = JSON.parse(JSON.stringify(o1));
        tmp.x = o1.x + (o2.x - o1.x) * ease;
        tmp.y = o1.y + (o2.y - o1.y) * ease;
        tmp.scale = (o1.scale || 1) + ((o2.scale || 1) - (o1.scale || 1)) * ease;
        tmp.rot = (o1.rot || 0) + ((o2.rot || 0) - (o1.rot || 0)) * ease;
        drawPhysical(tmp);
      });

      if (t < 1) requestAnimationFrame(frame);
      else res();
    }

    requestAnimationFrame(frame);
  });
}

// ── EXPORTACIÓN PNG ──────────────────────────────────────────
async function exportPNG() {
  deselect();
  await new Promise(r => setTimeout(r, 80));
  html2canvas(fMaster, { scale: 2, useCORS: true, backgroundColor: null }).then(canvas => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `tactica_paso${curStep + 1}_${Date.now()}.png`;
    a.click();
  });
}

// ── EXPORTACIÓN VÍDEO ────────────────────────────────────────
function exportVideo() {
  if (steps.length < 2) { alert('Añade al menos 2 pasos para exportar'); return; }
  document.getElementById('export-modal').classList.add('open');
}

function closeExportModal() {
  document.getElementById('export-modal').classList.remove('open');
  document.getElementById('export-progress').style.display = 'none';
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('export-status').textContent = '';
}

function setExportProgress(pct, msg) {
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('export-status').textContent = msg;
}

async function startExport(format) {
  document.getElementById('export-progress').style.display = 'block';
  setExportProgress(2, 'Preparando...');

  try {
    if (format === 'mp4') {
      await exportMP4();
    } else {
      await exportGIF();
    }
  } catch (err) {
    console.error('Export error:', err);
    alert('Error durante la exportación: ' + err.message);
    closeExportModal();
  }
}

// ─────────────────────────────────────────────────────────────
// MP4 — flujo:
//   1. Capturar frames del campo como canvas (25fps)
//   2. Ensamblar esos frames en un <canvas> de grabación
//   3. Grabar ese canvas con MediaRecorder → WebM
//   4. Convertir WebM → MP4 H.264 con ffmpeg.wasm
//   5. Descargar el .mp4
// ─────────────────────────────────────────────────────────────
async function exportMP4() {
  const FPS        = 25;
  const duration   = parseInt(document.getElementById('speed-slider').value);
  const framesPerStep = Math.round((duration / 1000) * FPS);
  const totalFrames   = framesPerStep * (steps.length - 1);

  // ① Capturar todos los frames como ImageData / dataURL
  setExportProgress(5, `Capturando ${totalFrames} frames...`);
  deselect();
  isPlaying = true;

  const fieldW = fMaster.offsetWidth;
  const fieldH = fMaster.offsetHeight;

  // Canvas auxiliar de grabación (mismo tamaño que el campo)
  const recCanvas = document.createElement('canvas');
  recCanvas.width  = fieldW;
  recCanvas.height = fieldH;
  const recCtx = recCanvas.getContext('2d');

  // Recopilar frames interpolados
  const frameBlobs = [];

  for (let i = 0; i < steps.length - 1; i++) {
    for (let f = 0; f < framesPerStep; f++) {
      const t    = f / framesPerStep;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      // Renderizar frame al DOM
      renderFrameInterpolated(steps[i], steps[i + 1], ease);
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => setTimeout(r, 0));

      // Capturar campo con html2canvas
      const snap = await html2canvas(fMaster, {
        scale: 1, useCORS: true,
        backgroundColor: '#1a5c2a',
        logging: false
      });

      frameBlobs.push(snap);

      const done = i * framesPerStep + f + 1;
      setExportProgress(5 + Math.round((done / totalFrames) * 55), `Frame ${done} / ${totalFrames}`);
    }
  }

  // Añadir último frame estático (pose final)
  renderFrameInterpolated(steps[steps.length - 1], steps[steps.length - 1], 0);
  await new Promise(r => setTimeout(r, 80));
  const lastSnap = await html2canvas(fMaster, { scale: 1, useCORS: true, backgroundColor: '#1a5c2a', logging: false });
  for (let k = 0; k < FPS; k++) frameBlobs.push(lastSnap); // 1s de pausa al final

  isPlaying = false;
  render();

  // ② Grabar el canvas a WebM usando MediaRecorder
  setExportProgress(62, 'Ensamblando vídeo WebM...');

  const stream = recCanvas.captureStream(FPS);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
    ? 'video/webm;codecs=vp8,opus'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';

  const rec    = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
  const chunks = [];
  rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  rec.start();

  // Pintar cada frame al recCanvas a 25fps
  const msPerFrame = 1000 / FPS;
  for (let idx = 0; idx < frameBlobs.length; idx++) {
    recCtx.drawImage(frameBlobs[idx], 0, 0, fieldW, fieldH);
    await new Promise(r => setTimeout(r, msPerFrame));
    setExportProgress(62 + Math.round((idx / frameBlobs.length) * 20), 'Ensamblando...');
  }

  rec.stop();
  const webmBlob = await new Promise(res => {
    rec.onstop = () => res(new Blob(chunks, { type: 'video/webm' }));
  });

  setExportProgress(83, 'Convirtiendo a MP4 (ffmpeg)...');

  // ③ Convertir a MP4 con ffmpeg.wasm
  try {
    const mp4Blob = await convertToMP4(webmBlob, (p) => {
      setExportProgress(83 + Math.round(p * 14), `Codificando MP4... ${Math.round(p * 100)}%`);
    });

    setExportProgress(100, '¡Listo!');
    await new Promise(r => setTimeout(r, 400));

    const url = URL.createObjectURL(mp4Blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `tactica_${Date.now()}.mp4`;
    a.click();
    URL.revokeObjectURL(url);
    closeExportModal();

  } catch (ffErr) {
    // ffmpeg falló (p.ej. en Safari sin SharedArrayBuffer) → fallback descarga WebM
    console.warn('ffmpeg.wasm falló, descargando WebM:', ffErr);
    setExportProgress(100, 'MP4 no disponible — descargando WebM');
    await new Promise(r => setTimeout(r, 800));
    const url = URL.createObjectURL(webmBlob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `tactica_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    closeExportModal();
  }
}

// ── ffmpeg.wasm: WebM → MP4 H.264 ───────────────────────────
let _ffmpeg = null;

async function getFFmpeg() {
  if (_ffmpeg) return _ffmpeg;

  // Carga dinámica de ffmpeg.wasm (versión ligera ~31MB)
  if (!window.FFmpeg) {
    await loadScript('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js');
  }
  if (!window.FFmpegUtil) {
    await loadScript('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/umd/index.js');
  }

  const { FFmpeg } = window.FFmpeg;
  const { fetchFile, toBlobURL } = window.FFmpegUtil;
  window._ffFetchFile = fetchFile;

  const ffmpeg = new FFmpeg();
  ffmpeg.on('log', ({ message }) => console.log('[ffmpeg]', message));

  // Cargar núcleo WASM (multi-thread si hay SharedArrayBuffer, mono en caso contrario)
  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL:   await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL:   await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
  });

  _ffmpeg = ffmpeg;
  return ffmpeg;
}

async function convertToMP4(webmBlob, onProgress) {
  const ffmpeg    = await getFFmpeg();
  const fetchFile = window._ffFetchFile;

  // Escribir WebM en el sistema de ficheros virtual de ffmpeg
  await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));

  // Progreso aproximado por tiempo
  let prog = 0;
  const progTimer = setInterval(() => {
    prog = Math.min(prog + 0.04, 0.92);
    onProgress(prog);
  }, 300);

  // Transcodificar: WebM VP8 → MP4 H.264 + AAC, compatible con iOS/Android/PC
  await ffmpeg.exec([
    '-i',       'input.webm',
    '-c:v',     'libx264',
    '-preset',  'ultrafast',
    '-crf',     '23',
    '-pix_fmt', 'yuv420p',   // compatible iOS
    '-movflags', '+faststart', // streaming-ready
    '-an',                   // sin audio (no hay)
    'output.mp4'
  ]);

  clearInterval(progTimer);
  onProgress(1);

  // Leer el resultado
  const data = await ffmpeg.readFile('output.mp4');
  return new Blob([data.buffer], { type: 'video/mp4' });
}

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s  = document.createElement('script');
    s.src    = src;
    s.crossOrigin = 'anonymous';
    s.onload  = res;
    s.onerror = () => rej(new Error('No se pudo cargar: ' + src));
    document.head.appendChild(s);
  });
}

// ── GIF animado (fallback iOS sin SharedArrayBuffer) ─────────
async function exportGIF() {
  if (typeof GIF === 'undefined') {
    alert('Librería GIF no disponible. Comprueba la conexión.');
    return;
  }

  const FPS           = 20;
  const duration      = parseInt(document.getElementById('speed-slider').value);
  const framesPerStep = Math.max(8, Math.round((duration / 1000) * FPS));
  const totalFrames   = framesPerStep * (steps.length - 1);

  deselect();
  isPlaying = true;

  const gif = new GIF({
    workers: 2, quality: 6,
    width:  fMaster.offsetWidth,
    height: fMaster.offsetHeight,
    workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
  });

  let done = 0;
  for (let i = 0; i < steps.length - 1; i++) {
    for (let f = 0; f < framesPerStep; f++) {
      const t    = f / framesPerStep;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      renderFrameInterpolated(steps[i], steps[i + 1], ease);
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => setTimeout(r, 0));
      const snap = await html2canvas(fMaster, { scale: 1, useCORS: true, backgroundColor: '#1a5c2a', logging: false });
      gif.addFrame(snap, { delay: Math.round(1000 / FPS), copy: true });
      done++;
      setExportProgress(5 + Math.round((done / totalFrames) * 80), `Frame ${done} / ${totalFrames}`);
    }
  }

  isPlaying = false;
  render();

  setExportProgress(88, 'Compilando GIF...');

  gif.on('progress', p => setExportProgress(88 + Math.round(p * 10), 'Compilando GIF...'));
  gif.on('finished', blob => {
    setExportProgress(100, '¡Listo!');
    setTimeout(() => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `tactica_${Date.now()}.gif`;
      a.click();
      URL.revokeObjectURL(url);
      closeExportModal();
    }, 400);
  });

  gif.render();
}

// ── Renderizar frame interpolado (sin await, solo DOM) ───────
function renderFrameInterpolated(f1, f2, ease) {
  Array.from(fMaster.children).forEach(c => { if (c.id !== 'svg-layer') fMaster.removeChild(c); });
  const defs = svgLayer.querySelector('defs');
  svgLayer.innerHTML = '';
  if (defs) svgLayer.appendChild(defs);

  f1.forEach(o1 => {
    const o2 = f2.find(x => x.id === o1.id);
    if (!o2) return;
    if (o1.type === 'vec') {
      const interp = JSON.parse(JSON.stringify(o1));
      ['x1','y1','x2','y2','cx1','cy1','cx2','cy2'].forEach(k => {
        if (o1[k] !== undefined && o2[k] !== undefined)
          interp[k] = o1[k] + (o2[k] - o1[k]) * ease;
      });
      drawVector(interp);
      return;
    }
    if (o1.type === 'zone') { drawZone(o1); return; }
    const tmp = JSON.parse(JSON.stringify(o1));
    tmp.x     = o1.x + (o2.x - o1.x) * ease;
    tmp.y     = o1.y + (o2.y - o1.y) * ease;
    tmp.scale = (o1.scale || 1) + ((o2.scale || 1) - (o1.scale || 1)) * ease;
    tmp.rot   = (o1.rot   || 0) + ((o2.rot   || 0) - (o1.rot   || 0)) * ease;
    drawPhysical(tmp);
  });
}

// ── BIBLIOTECA ───────────────────────────────────────────────
function openLibrary() {
  const grid = document.getElementById('library-grid');
  grid.innerHTML = '';
  drillLibrary.forEach(drill => {
    const card = document.createElement('div');
    card.className = 'lib-card';
    card.innerHTML = `
      <div class="lib-icon">${drill.icon}</div>
      <div class="lib-name">${drill.name}</div>
      <div class="lib-desc">${drill.desc}</div>
    `;
    card.onclick = () => injectDrill(drill);
    grid.appendChild(card);
  });
  document.getElementById('library-modal').classList.add('open');
}

function closeLibrary() {
  document.getElementById('library-modal').classList.remove('open');
}

function injectDrill(drill) {
  saveState();
  const now = Date.now();
  const newSteps = drill.steps.map(step =>
    step.map((el, i) => {
      const copy = JSON.parse(JSON.stringify(el));
      copy.id = now + Math.random() * 10000 + i;
      // Aplicar colores de equipo actuales
      if (['A','B','C','D'].includes(copy.type)) {
        copy.color = teamColors[copy.type].c1;
        copy.stripeColor = teamColors[copy.type].c2;
      }
      return copy;
    })
  );

  // Reemplazar pasos desde el actual
  steps.splice(curStep, steps.length - curStep, ...newSteps);
  deselect();
  closeLibrary();
}

// ── UTILIDADES ───────────────────────────────────────────────
function saveState() {
  if (history.length > 40) history.shift();
  history.push(JSON.stringify(steps));
}

function undo() {
  if (!history.length) return;
  steps = JSON.parse(history.pop());
  if (curStep >= steps.length) curStep = steps.length - 1;
  render();
}

function deselect() {
  activeId = null;
  if (isDrawingPoly) finishPoly();
  render();
}

function duplicateActive() {
  if (!activeId) return;
  saveState();
  const orig = steps[curStep].find(o => o.id === activeId);
  if (!orig) return;
  const copy = JSON.parse(JSON.stringify(orig));
  copy.id = newId();
  if (copy.type !== 'vec' && copy.type !== 'zone') { copy.x += 40; copy.y += 40; }
  steps[curStep].push(copy);
  activeId = copy.id;
  render();
}

function deleteActive() {
  if (!activeId) return;
  saveState();
  steps[curStep] = steps[curStep].filter(o => o.id !== activeId);
  activeId = null;
  render();
}

function openResetMenu() { document.getElementById('reset-modal').classList.add('open'); }
function closeResetMenu() { document.getElementById('reset-modal').classList.remove('open'); }

function resetAction(type) {
  saveState();
  if (type === 'step') {
    steps[curStep] = [];
  } else {
    steps = [[]]; curStep = 0;
  }
  closeResetMenu();
  deselect();
}

// ── HELPERS ──────────────────────────────────────────────────
function isLight(hex) {
  if (!hex) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
