let steps = [ [] ];
let history = [];
let curStep = 0;
let activeId = null;
let dragInfo = null;
let isPlaying = false;
let animationSpeed = 800;
let forceFS = false;

let teamColors = { 'p-red': '#ff4757', 'p-blue': '#2e86de', 'p-yellow': '#f1c40f', 'p-green': '#2ecc71' };

const viewport = document.getElementById('viewport');
const fMaster = document.getElementById('field-master');
const svg = document.getElementById('svg-layer');

const drillLibrary = {
    rondo42: [
        { id: 1, type: 'zone', sub: 'line', x: 400, y: 240, w: 250, h: 200, color: '#ffffff', locked: true },
        { id: 2, type: 'p-red', x: 400, y: 340, num: 1 }, { id: 3, type: 'p-red', x: 650, y: 340, num: 2 },
        { id: 4, type: 'p-red', x: 525, y: 240, num: 3 }, { id: 5, type: 'p-red', x: 525, y: 440, num: 4 },
        { id: 6, type: 'p-blue', x: 500, y: 340, num: 1 }, { id: 7, type: 'p-blue', x: 550, y: 340, num: 2 },
        { id: 8, type: 'ball', x: 420, y: 340 }
    ],
    slalom: [
        { id: 1, type: 'cone', x: 300, y: 340, color: '#e67e22' },
        { id: 2, type: 'cone', x: 400, y: 340, color: '#e67e22' },
        { id: 3, type: 'cone', x: 500, y: 340, color: '#e67e22' },
        { id: 4, type: 'ball', x: 250, y: 340 }
    ]
};

// BIBLIOTECA
function openLibrary() { document.getElementById('library-modal').style.display = 'flex'; }
function closeLibrary() { document.getElementById('library-modal').style.display = 'none'; }

function injectDrill(key) {
    saveState();
    const data = JSON.parse(JSON.stringify(drillLibrary[key] || []));
    const now = Date.now();
    data.forEach((el, idx) => { 
        el.id = now + idx; 
        if(!el.color && el.type.startsWith('p-')) el.color = teamColors[el.type]; 
    });
    steps[curStep] = data;
    closeLibrary(); render();
}

// AJUSTES EQUIPOS
function updateTeamColor(team, color) {
    teamColors[team] = color;
    document.getElementById(`tool-${team}`).style.background = color;
    steps.forEach(step => {
        step.forEach(el => { if(el.type === team) el.color = color; });
    });
    render();
}

function changeField(type) {
    const images = { 'entero': 'campoentero.png', 'medio': 'mediocampo.png', 'ejercicio': 'campoejercicio.png' };
    fMaster.style.backgroundImage = `url('${images[type]}')`;
    setTimeout(resizeField, 50);
}

function resizeField() {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    let final = Math.min(vw / 1050, vh / 680);
    fMaster.style.transform = `scale(${final})`;
}

function render() {
    if (isPlaying) return;
    Array.from(fMaster.children).forEach(c => { if(c.id !== 'svg-layer') fMaster.removeChild(c); });
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
    if(hitId !== null) activeId = hitId;
    if(activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        if(el.type === 'zone' && el.locked && !e.target.closest('.node')) { dragInfo = null; return; }
        const rect = fMaster.getBoundingClientRect();
        dragInfo = { el, nx: hit.dataset.nx || 'x', ny: hit.dataset.ny || 'y', isZS: hit.classList.contains('node-zs'), moved: false, lastX: e.clientX, lastY: e.clientY, zoom: rect.width / 1050 };
        saveState(); render();
    }
}

function handleGlobalMove(e) {
    if(!dragInfo) return;
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

function drawPhysical(el) {
    const div = document.createElement('div');
    div.className = `object ${el.type} ${activeId === el.id ? 'selected' : ''}`;
    div.dataset.id = el.id;
    if(el.type.startsWith('p-')) { div.style.background = el.color; div.innerText = el.num; div.classList.add('player'); }
    else if(el.type === 'ball') div.innerText = '⚽';
    else { div.classList.add(el.type); div.style.color = el.color; if(el.type==='cone') div.style.borderBottomColor = el.color; }
    div.style.left = el.x + 'px'; div.style.top = el.y + 'px';
    div.style.transform = `translate(-50%, -50%) rotate(${el.rot||0}deg) scale(${el.scale||1})`; fMaster.appendChild(div);
}

function drawZone(el) {
    const div = document.createElement('div');
    div.className = `zone ${el.sub==='fill'?'zone-fill':'zone-line'} ${activeId === el.id ? 'selected' : ''} ${el.locked?'zone-locked':''}`;
    div.dataset.id = el.id; div.style.left = el.x + 'px'; div.style.top = el.y + 'px';
    div.style.width = el.w + 'px'; div.style.height = el.h + 'px';
    div.style.borderColor = el.color; // Color aplicado al trazo
    if(el.sub === 'fill') div.style.backgroundColor = el.color + '66';
    fMaster.appendChild(div);
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

function drawText(el) {
    const div = document.createElement('div'); div.className = `object ${activeId === el.id ? 'selected' : ''}`;
    div.innerText = el.content; div.style.color = el.color; div.dataset.id = el.id; div.style.left = el.x + 'px'; div.style.top = el.y + 'px'; fMaster.appendChild(div);
}

function createNode(el, nx, ny, fx, fy, isC=false, isZS=false) {
    const node = document.createElement('div'); node.className = `node ${isZS?'node-zs':''}`; 
    node.style.left = fx+'px'; node.style.top = fy+'px'; node.dataset.id = el.id; node.dataset.nx = nx; node.dataset.ny = ny;
    node.innerHTML = `<div class="node-in" style="${isC?'background:cyan':''}"></div>`; fMaster.appendChild(node);
}

function modifyProp(p, v) { 
    saveState(); 
    const el = steps[curStep].find(o=>o.id===activeId); 
    if(el) { 
        el[p]=v; 
        // Si es un jugador, también actualizamos el color global de su equipo si es necesario
        if(el.type.startsWith('p-') && p === 'color') teamColors[el.type] = v;
        render(); 
    } 
}

function updateInspector() {
    const panel = document.getElementById('inspector-panel');
    if(!activeId) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';
    const el = steps[curStep].find(o => o.id === activeId);
    document.getElementById('ins-color').value = el.color || '#000000';
    document.getElementById('lock-btn').innerText = el.locked ? "🔓 DESBLOQUEAR" : "🔒 BLOQUEAR";
}

// RESTO DE FUNCIONES (undo, addStep, runAnimation...) se mantienen igual que en v48.
window.onload = () => { resizeField(); render(); };
window.addEventListener('resize', resizeField);
function createPlayer(type) { saveState(); steps[curStep].push({ id: Date.now(), type, x: 100, y: 100, color: teamColors[type], num: steps[curStep].filter(o=>o.type===type).length+1 }); render(); }
function createItem(type) { saveState(); steps[curStep].push({ id: Date.now(), type, x: 150, y: 150, color: "#ffffff" }); render(); }
function createVector(sub) { saveState(); steps[curStep].push({ id: Date.now(), type: 'vec', sub, x1: 50, y1: 50, x2: 150, y2: 50, cx1: 75, cy1: 100, cx2: 125, cy2: 100, color: "#000000", arrow: true }); render(); }
function createZone(sub) { saveState(); steps[curStep].push({ id: Date.now(), type: 'zone', sub, x: 100, y: 100, w: 200, h: 150, color: "#ffa500", locked: false }); render(); }
function deselect() { activeId = null; render(); }
function openResetMenu() { document.getElementById('reset-modal').style.display = 'flex'; }
function closeResetMenu() { document.getElementById('reset-modal').style.display = 'none'; }
function resetAction(t) { saveState(); if(t==='step') steps[curStep]=[]; else {steps=[[]]; curStep=0;} closeResetMenu(); render(); }
function addStep() { saveState(); steps.push(JSON.parse(JSON.stringify(steps[curStep]))); curStep++; render(); }
function navStep(d) { curStep = Math.max(0, Math.min(steps.length-1, curStep+d)); deselect(); }
function removeActive() { if(activeId) { saveState(); steps[curStep]=steps[curStep].filter(o=>o.id!==activeId); deselect(); } }
function toggleZoneLock() { const el = steps[curStep].find(o=>o.id===activeId); if(el && el.type==='zone') { el.locked = !el.locked; render(); } }
