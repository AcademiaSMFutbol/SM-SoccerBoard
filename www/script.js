let steps = [ [] ];
let history = [];
let curStep = 0;
let activeId = null;
let dragInfo = null;
let pinchDist = 0;
let isPlaying = false;
let animationSpeed = 800;
let forceFS = false;

let teamColors = { 'p-red': '#ff4757', 'p-blue': '#2e86de', 'p-yellow': '#f1c40f', 'p-green': '#2ecc71' };

const viewport = document.getElementById('viewport');
const fMaster = document.getElementById('field-master');
const svg = document.getElementById('svg-layer');

// --- BIBLIOTECA DE 50 SLOTS (Starter Pack) ---
const drillLibrary = {
    rondo42: [
        { id: 1, type: 'zone', sub: 'line', x: 400, y: 240, w: 250, h: 200, color: '#ffffff', locked: true },
        { id: 2, type: 'p-red', x: 400, y: 340, num: 1, color: '#ff4757' },
        { id: 3, type: 'p-red', x: 650, y: 340, num: 2, color: '#ff4757' },
        { id: 4, type: 'p-red', x: 525, y: 240, num: 3, color: '#ff4757' },
        { id: 5, type: 'p-red', x: 525, y: 440, num: 4, color: '#ff4757' },
        { id: 6, type: 'p-blue', x: 500, y: 340, num: 1, color: '#2e86de' },
        { id: 7, type: 'p-blue', x: 550, y: 340, num: 2, color: '#2e86de' },
        { id: 8, type: 'ball', x: 420, y: 340 }
    ],
    y_drill: [
        { id: 1, type: 'cone', x: 200, y: 340, color: '#e67e22' },
        { id: 2, type: 'cone', x: 400, y: 340, color: '#e67e22' },
        { id: 3, type: 'cone', x: 600, y: 200, color: '#e67e22' },
        { id: 4, type: 'cone', x: 600, y: 480, color: '#e67e22' },
        { id: 5, type: 'p-red', x: 180, y: 340, num: 1 }
    ],
    slalom: [
        { id: 1, type: 'cone', x: 300, y: 340, color: '#e67e22' },
        { id: 2, type: 'cone', x: 400, y: 340, color: '#e67e22' },
        { id: 3, type: 'cone', x: 500, y: 340, color: '#e67e22' },
        { id: 4, type: 'cone', x: 600, y: 340, color: '#e67e22' },
        { id: 5, type: 'ball', x: 250, y: 340 }
    ],
    tiro_box: [
        { id: 1, type: 'p-red', x: 525, y: 640, num: 1 }, // Portero
        { id: 2, type: 'zone', sub: 'fill', x: 450, y: 150, w: 150, h: 100, color: '#2ecc71', locked: true },
        { id: 3, type: 'p-blue', x: 525, y: 150, num: 9 }
    ]
    // ... aquí puedes añadir hasta los 50 ejercicios siguiendo el mismo formato JSON
};

function injectDrill(key) {
    if(!confirm("¿Cargar esta tarea? Se borrará el paso actual.")) return;
    saveState();
    const drillData = JSON.parse(JSON.stringify(drillLibrary[key] || []));
    const timestamp = Date.now();
    drillData.forEach((el, index) => { el.id = timestamp + index; });
    steps[curStep] = drillData;
    deselect();
}

// --- LÓGICA DE MOTOR (v47 Audit) ---
function setForceFS(val) { forceFS = val; if(val) requestFS(); }
function requestFS() { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{}); }
document.addEventListener('pointerdown', () => { if(forceFS) requestFS(); });

function saveState() { if (history.length > 30) history.shift(); history.push(JSON.stringify(steps)); }
function undo() { if (history.length === 0) return; steps = JSON.parse(history.pop()); render(); }

function openResetMenu() { document.getElementById('reset-modal').style.display = 'flex'; }
function closeResetMenu() { document.getElementById('reset-modal').style.display = 'none'; }
function resetAction(type) {
    saveState();
    if(type === 'step') steps[curStep] = []; else { steps = [[]]; curStep = 0; }
    closeResetMenu(); deselect();
}

function openTextModal() { document.getElementById('text-modal').style.display = 'flex'; }
function closeTextModal() { document.getElementById('text-modal').style.display = 'none'; }
function confirmCreateText() {
    const val = document.getElementById('text-input-field').value;
    if(!val) return;
    saveState();
    steps[curStep].push({ id: Date.now(), type: 'text', x: 200, y: 200, content: val, color: "#000000", scale: 1 });
    closeTextModal(); render();
}

function changeField(type) {
    const images = { 'entero': 'campoentero.png', 'medio': 'mediocampo.png' };
    fMaster.style.backgroundImage = `url('${images[type]}')`;
    setTimeout(resizeField, 50);
}

function resizeField() {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    let sX = vw / 1050, sY = vh / 680;
    let final = Math.min(sX, sY);
    fMaster.style.transform = `scale(${final})`;
}

function render() {
    if (isPlaying) return;
    Array.from(fMaster.children).forEach(c => { if(c.id !== 'svg-layer') c.remove(); });
    svg.querySelectorAll('.v-el').forEach(e => e.remove());
    
    steps[curStep].forEach(el => {
        if(el.type === 'vec') drawVector(el);
        else if(el.type === 'zone') drawZone(el);
        else if(el.type === 'text') drawText(el);
        else drawPhysical(el);
    });

    if(activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        if(el) {
            if(el.type === 'vec') {
                [['x1','y1'], ['x2','y2']].forEach(([nx, ny]) => createNode(el, nx, ny, el[nx], el[ny]));
                if(el.sub==='curve') [['cx1','cy1'], ['cx2','cy2']].forEach(([nx, ny]) => createNode(el, nx, ny, el[nx], el[ny], true));
            }
            if(el.type === 'zone' && !el.locked) createNode(el, 'w', 'h', el.x + el.w, el.y + el.h, false, true);
        }
    }
    document.getElementById('step-label').innerText = `${curStep+1}/${steps.length}`;
    updateInspector();
}

function handleGlobalDown(e) {
    if(isPlaying) return;
    const hit = e.target.closest('.object, .vec-hit, .zone, .node');
    let hitId = hit ? Number(hit.dataset.id) : null;
    let wasSelected = (activeId === hitId && hitId !== null);
    if(hitId !== null) activeId = hitId;
    if(activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        if(el.type === 'zone' && el.locked && !e.target.closest('.node')) { dragInfo = null; return; }
        const rect = fMaster.getBoundingClientRect();
        dragInfo = { el, nx: hit.dataset.nx || 'x', ny: hit.dataset.ny || 'y', 
            isZS: hit.classList.contains('node-zs'),
            moved: false, lastX: e.clientX, lastY: e.clientY, zoom: rect.width / 1050 
        };
        saveState(); render();
    }
}

function handleGlobalMove(e) {
    if(!dragInfo || isPlaying) return;
    const dx = (e.clientX - dragInfo.lastX) / dragInfo.zoom;
    const dy = (e.clientY - dragInfo.lastY) / dragInfo.zoom;
    if (Math.hypot(dx, dy) > 0.5) dragInfo.moved = true;
    if(dragInfo.isZS) { dragInfo.el.w += dx; dragInfo.el.h += dy; }
    else if(dragInfo.el.type === 'vec' && dragInfo.nx === 'x') {
        ['x1','x2','cx1','cx2'].forEach(k => dragInfo.el[k]+=dx);
        ['y1','y2','cy1','cy2'].forEach(k => dragInfo.el[k]+=dy);
    } else { dragInfo.el[dragInfo.nx] += dx; dragInfo.el[dragInfo.ny] += dy; }
    dragInfo.lastX = e.clientX; dragInfo.lastY = e.clientY; render();
}

function handleGlobalEnd() { if(dragInfo && !dragInfo.moved) history.pop(); dragInfo = null; render(); }

function createPlayer(type) {
    saveState(); steps[curStep].push({ id: Date.now(), type, x: 100, y: 100, rot: 0, scale: 1, color: teamColors[type], num: steps[curStep].filter(o=>o.type===type).length+1 });
    render();
}

function createItem(type) {
    saveState();
    let color = (type==='cone') ? "#e67e22" : (type==='valla' ? "#e74c3c" : "#f1c40f");
    steps[curStep].push({ id: Date.now(), type, x: 150, y: 150, rot: 0, scale: 1, color });
    render();
}

function createVector(sub) {
    saveState(); steps[curStep].push({ id: Date.now(), type: 'vec', sub, x1: 50, y1: 50, x2: 150, y2: 50, cx1: 75, cy1: 100, cx2: 125, cy2: 100, color: "#000000", arrow: true, lineType: "solid" });
    render();
}

function createZone(sub) {
    saveState(); steps[curStep].push({ id: Date.now(), type: 'zone', sub, x: 100, y: 100, w: 200, h: 150, color: "#ffa500", locked: false });
    render();
}

function drawPhysical(el) {
    const div = document.createElement('div');
    div.className = `object ${el.type} ${activeId === el.id ? 'selected' : ''}`;
    div.dataset.id = el.id;
    if(el.type.startsWith('p-')) { div.style.background = teamColors[el.type]; div.innerText = el.num; div.classList.add('player'); }
    else if(el.type === 'ball') { div.innerText = '⚽'; div.style.fontSize = '18px'; }
    else { div.classList.add(el.type); div.style.color = el.color; if(el.type==='cone') div.style.borderBottomColor = el.color; }
    div.style.left = el.x + 'px'; div.style.top = el.y + 'px';
    div.style.transform = `translate(-50%, -50%) rotate(${el.rot}deg) scale(${el.scale})`; fMaster.appendChild(div);
}

function drawText(el) {
    const div = document.createElement('div'); div.className = `object ${activeId === el.id ? 'selected' : ''}`;
    div.innerText = el.content; div.style.color = el.color; div.dataset.id = el.id;
    div.style.left = el.x + 'px'; div.style.top = el.y + 'px'; fMaster.appendChild(div);
}

function drawVector(el) {
    const d = el.sub==='curve' ? `M ${el.x1} ${el.y1} C ${el.cx1} ${el.cy1}, ${el.cx2} ${el.cy2}, ${el.x2} ${el.y2}` : `M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d); path.setAttribute("stroke", el.color); path.setAttribute("stroke-width", "3");
    if(el.lineType === "dashed") path.setAttribute("stroke-dasharray", "6,6");
    if(el.arrow) path.setAttribute("marker-end", "url(#arrow)");
    path.setAttribute("class", "v-el"); svg.appendChild(path);
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hit.setAttribute("d", d); hit.setAttribute("stroke", "transparent"); hit.setAttribute("stroke-width", "30");
    hit.setAttribute("class", "vec-hit v-el"); hit.dataset.id = el.id; svg.appendChild(hit);
}

function drawZone(el) {
    const div = document.createElement('div');
    div.className = `zone ${el.sub==='fill'?'zone-fill':'zone-line'} ${activeId === el.id ? 'selected' : ''} ${el.locked?'zone-locked':''}`;
    div.dataset.id = el.id; div.style.left = el.x + 'px'; div.style.top = el.y + 'px';
    div.style.width = el.w + 'px'; div.style.height = el.h + 'px'; div.style.borderColor = el.color;
    if(el.sub === 'fill') div.style.backgroundColor = el.color + '66';
    fMaster.appendChild(div);
}

function createNode(el, nx, ny, fx, fy, isC=false, isZS=false) {
    const node = document.createElement('div'); node.className = `node ${isZS?'node-zs':''}`; 
    node.style.left = fx+'px'; node.style.top = fy+'px'; node.dataset.id = el.id; node.dataset.nx = nx; node.dataset.ny = ny;
    node.innerHTML = `<div class="node-in" style="${isC?'background:cyan':''}"></div>`; fMaster.appendChild(node);
}

function updateInspector() {
    const panel = document.getElementById('inspector-panel');
    if(!activeId) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';
    const el = steps[curStep].find(o => o.id === activeId);
    document.getElementById('ins-color').value = el.color || '#000000';
    document.getElementById('lock-btn').innerText = el.locked ? "🔓 DESBLOQUEAR" : "🔒 BLOQUEAR";
}

function addStep() { saveState(); steps.push(JSON.parse(JSON.stringify(steps[curStep]))); curStep++; render(); }
function navStep(d) { curStep = Math.max(0, Math.min(steps.length-1, curStep+d)); deselect(); }
function removeActive() { if(activeId) { saveState(); steps[curStep] = steps[curStep].filter(o=>o.id!==activeId); deselect(); } }
function deselect() { activeId = null; render(); }

window.onload = () => { resizeField(); render(); };
window.addEventListener('resize', resizeField);
