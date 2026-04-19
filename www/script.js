let steps = [ [] ];
let history = [];
let curStep = 0;
let activeId = null;
let dragInfo = null;
let pinchDist = 0;
let wasSelectedBefore = false;
let isPlaying = false;

let memory = {
    player: { rot: 0, scale: 1 },
    material: { rot: 0, scale: 1, color: "#ffffff" },
    vector: { color: "#ffffff", weight: 3, arrow: true },
    zone: { color: "#ffa500", w: 150, h: 100 }
};

const viewport = document.getElementById('viewport');
const fMaster = document.getElementById('field-master');
const svg = document.getElementById('svg-layer');

function saveState() {
    if (history.length > 30) history.shift();
    history.push(JSON.stringify(steps));
}

function undo() {
    if (history.length === 0) return;
    steps = JSON.parse(history.pop());
    if (curStep >= steps.length) curStep = steps.length - 1;
    render();
}

function clearField() {
    if(steps[curStep].length === 0) return;
    if(confirm("¿Seguro que quieres limpiar todo el campo?")) {
        saveState();
        steps[curStep] = [];
        deselect();
    }
}

function resizeField() {
    const vw = viewport.clientWidth - 30;
    const vh = viewport.clientHeight - 30;
    const scale = Math.min(vw / 1050, vh / 680);
    fMaster.style.transform = `scale(${scale})`;
}

function render() {
    if (isPlaying) return;
    Array.from(fMaster.children).forEach(c => { if(c.id !== 'svg-layer') c.remove(); });
    svg.querySelectorAll('.v-el').forEach(e => e.remove());
    steps[curStep].forEach(el => {
        if(el.type === 'vec') drawVector(el);
        else if(el.type === 'zone') drawZone(el);
        else drawPhysical(el);
    });
    document.getElementById('step-label').innerText = `${curStep+1}/${steps.length}`;
    updateInspector();
}

// --- INTERACCIÓN ---
function handleGlobalDown(e) {
    if(isPlaying) return;
    const hit = e.target.closest('.object, .vec-hit, .zone, .node');
    let hitId = hit ? Number(hit.dataset.id) : null;
    
    wasSelectedBefore = (activeId === hitId && hitId !== null);
    if(hitId !== null) activeId = hitId;

    if(activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        const rect = fMaster.getBoundingClientRect();
        dragInfo = { 
            el, nx: (hit && hit.dataset.nx) || 'x', ny: (hit && hit.dataset.ny) || 'y', 
            isZS: hit && hit.classList.contains('node-zs'),
            moved: false, lastX: e.clientX, lastY: e.clientY, 
            zoom: rect.width / 1050 
        };
        saveState();
        render();
    }
}

function handleGlobalMove(e) {
    if(!dragInfo || pinchDist > 0) return;
    const dx = (e.clientX - dragInfo.lastX) / dragInfo.zoom;
    const dy = (e.clientY - dragInfo.lastY) / dragInfo.zoom;

    if (Math.hypot(dx, dy) > 3) dragInfo.moved = true;
    if (!dragInfo.moved) return;

    if(dragInfo.isZS) {
        dragInfo.el.w = Math.max(30, dragInfo.el.w + dx); dragInfo.el.h = Math.max(30, dragInfo.el.h + dy);
    } else if(dragInfo.el.type === 'vec' && dragInfo.nx === 'x') {
        ['x1','x2','cx1','cx2'].forEach(k => dragInfo.el[k]+=dx);
        ['y1','y2','cy1','cy2'].forEach(k => dragInfo.el[k]+=dy);
    } else {
        dragInfo.el[dragInfo.nx] += dx; dragInfo.el[dragInfo.ny] += dy;
    }
    dragInfo.lastX = e.clientX; dragInfo.lastY = e.clientY;
    render();
}

function handleGlobalEnd() {
    if(dragInfo && !dragInfo.moved) {
        history.pop(); 
        if(wasSelectedBefore && !['zone','vec'].includes(dragInfo.el.type)) {
            dragInfo.el.rot = (dragInfo.el.rot + 45) % 360;
            if(dragInfo.el.type.startsWith('p-')) memory.player.rot = dragInfo.el.rot;
            else memory.material.rot = dragInfo.el.rot;
        }
    }
    dragInfo = null; render();
}

// --- CREACIÓN ---
function createPlayer(type) {
    saveState();
    const id = Date.now();
    steps[curStep].push({ id, type, x: 100, y: 100, rot: memory.player.rot, scale: memory.player.scale, num: steps[curStep].filter(o=>o.type===type).length+1 });
    activeId = id; render();
}
function createItem(type) {
    saveState();
    const id = Date.now();
    steps[curStep].push({ id, type, x: 150, y: 150, rot: memory.material.rot, scale: memory.material.scale, color: (type==='cone'?'#e67e22':memory.material.color) });
    activeId = id; render();
}
function createVector(sub) {
    saveState();
    const id = Date.now();
    steps[curStep].push({ id, type: 'vec', sub, x1: 50, y1: 50, x2: 150, y2: 50, cx1: 75, cy1: 100, cx2: 125, cy2: 100, color: memory.vector.color, weight: 3, arrow: true });
    activeId = id; render();
}
function createZone(sub) {
    saveState();
    const id = Date.now();
    steps[curStep].push({ id, type: 'zone', sub, x: 100, y: 100, w: memory.zone.w, h: memory.zone.h, color: memory.zone.color });
    activeId = id; render();
}
function duplicateActive() {
    if(!activeId) return;
    saveState();
    const target = steps[curStep].find(o => o.id === activeId);
    const clone = JSON.parse(JSON.stringify(target));
    clone.id = Date.now(); clone.x += 40; clone.y += 40;
    if(clone.num) clone.num = steps[curStep].filter(o=>o.type===clone.type).length + 1;
    steps[curStep].push(clone); activeId = clone.id; render();
}

function drawPhysical(el) {
    const div = document.createElement('div');
    div.className = `object ${el.type} ${activeId === el.id ? 'selected' : ''}`;
    div.dataset.id = el.id;
    if(el.type.startsWith('p-')) {
        const colors = {'p-red':'#ff4757', 'p-blue':'#2e86de', 'p-yellow':'#f1c40f', 'p-green':'#2ecc71'};
        div.style.background = colors[el.type]; div.innerText = el.num; div.classList.add('player');
    } else if(el.type === 'ball') {
        div.innerText = '⚽'; div.style.fontSize = '18px';
    } else {
        div.classList.add(el.type);
        if(el.type === 'cone') div.style.borderBottomColor = el.color;
        else div.style.borderColor = el.color; div.style.color = el.color;
    }
    div.style.left = el.x + 'px'; div.style.top = el.y + 'px';
    div.style.transform = `translate(-50%, -50%) rotate(${el.rot}deg) scale(${el.scale})`;
    fMaster.appendChild(div);
}

function drawVector(el) {
    const d = el.sub==='curve' ? `M ${el.x1} ${el.y1} C ${el.cx1} ${el.cy1}, ${el.cx2} ${el.cy2}, ${el.x2} ${el.y2}` : `M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`;
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hit.setAttribute("d", d); hit.setAttribute("class", "vec-hit v-el"); hit.dataset.id = el.id;
    svg.appendChild(hit);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d); path.setAttribute("class", "v-el");
    path.setAttribute("stroke", el.color); path.setAttribute("stroke-width", "3"); path.setAttribute("fill", "none");
    if(el.arrow) path.setAttribute("marker-end", "url(#arrow)");
    svg.appendChild(path);
    if(activeId === el.id) {
        [['x1','y1'], ['x2','y2']].forEach(([nx, ny]) => createNode(el, nx, ny, el[nx], el[ny]));
        if(el.sub==='curve') [['cx1','cy1'], ['cx2','cy2']].forEach(([nx, ny]) => createNode(el, nx, ny, el[nx], el[ny], true));
    }
}

function drawZone(el) {
    const div = document.createElement('div');
    div.className = `zone ${el.sub==='fill'?'zone-fill':'zone-line'} ${activeId === el.id ? 'selected' : ''}`;
    div.dataset.id = el.id;
    div.style.cssText = `left:${el.x}px; top:${el.y}px; width:${el.w}px; height:${el.h}px; border-color:${el.color};`;
    if(el.sub === 'fill') div.style.backgroundColor = el.color + '66';
    fMaster.appendChild(div);
    if(activeId === el.id) createNode(el, 'w', 'h', el.x + el.w, el.y + el.h, false, true);
}

function createNode(el, nx, ny, fx, fy, isC=false, isZS=false) {
    const node = document.createElement('div'); node.className = `node ${isZS?'node-zs':''}`; 
    node.style.left = fx+'px'; node.style.top = fy+'px'; node.dataset.id = el.id; node.dataset.nx = nx; node.dataset.ny = ny;
    node.innerHTML = `<div class="node-in" style="${isC?'background:cyan':''}"></div>`;
    fMaster.appendChild(node);
}

// PELLIZCO
fMaster.addEventListener('touchstart', (e) => {
    if(e.touches.length === 2 && activeId) {
        saveState();
        pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
}, {passive: false});
fMaster.addEventListener('touchmove', (e) => {
    if(pinchDist > 0 && e.touches.length === 2) {
        const el = steps[curStep].find(o=>o.id === activeId);
        if(el) {
            const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            el.scale *= (dist / pinchDist); pinchDist = dist;
            if(el.type.startsWith('p-')) memory.player.scale = el.scale; else memory.material.scale = el.scale;
            render();
        }
    }
}, {passive: false});
fMaster.addEventListener('touchend', () => pinchDist = 0);

function toggleFullScreen() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } 
    else { document.exitFullscreen(); }
}

function modifyProp(p, v) { 
    saveState();
    const el = steps[curStep].find(o=>o.id===activeId); if(el) { el[p]=v; if(el.type.startsWith('p-')) memory.player[p]=v; else if(el.type==='vec') memory.vector[p]=v; else if(el.type==='zone') memory.zone[p]=v; else memory.material[p]=v; render(); }
}

function updateInspector() { const ins = document.getElementById('top-inspector'); if(!activeId) { ins.style.display = 'none'; return; } ins.style.display = 'flex'; document.getElementById('ins-vec-extras').style.display = (steps[curStep].find(o=>o.id===activeId).type==='vec')?'flex':'none'; }

function exportStepPNG() {
    deselect();
    setTimeout(() => {
        html2canvas(fMaster, { backgroundColor: null, scale: 3, useCORS: true }).then(c => {
            const a = document.createElement('a'); a.download = `tactica_${curStep+1}.png`;
            a.href = c.toDataURL("image/png"); a.click();
        });
    }, 150);
}

async function runAnimation() {
    if (steps.length < 2) return;
    isPlaying = true; deselect();
    const speed = 800;

    for (let i = 0; i < steps.length - 1; i++) {
        await new Promise(res => {
            let start = null; const f1 = steps[i], f2 = steps[i + 1];
            function animate(ts) {
                if (!start) start = ts; const p = Math.min((ts - start) / speed, 1);
                Array.from(fMaster.children).forEach(c => { if (c.id !== 'svg-layer') fMaster.removeChild(c); });
                f1.forEach(o => {
                    const target = f2.find(x => x.id === o.id);
                    if (!target || o.type === 'vec' || o.type === 'zone') return;
                    const div = document.createElement('div');
                    div.className = `object ${o.type}`;
                    if (o.type.startsWith('p-')) div.classList.add('player');
                    
                    const x = o.x + (target.x - o.x) * p;
                    const y = o.y + (target.y - o.y) * p;
                    const r = o.rot + (target.rot - o.rot) * p;
                    const s = o.scale + (target.scale - o.scale) * p;

                    if (o.type.startsWith('p-')) {
                        const colors = {'p-red':'#ff4757', 'p-blue':'#2e86de', 'p-yellow':'#f1c40f', 'p-green':'#2ecc71'};
                        div.style.background = colors[o.type]; div.innerText = o.num;
                    } else if (o.type === 'ball') {
                        div.innerText = '⚽'; div.style.fontSize = '18px';
                    } else {
                        if (o.type === 'cone') div.style.borderBottomColor = o.color;
                        else if (o.type === 'pica') div.style.backgroundColor = o.color;
                        else div.style.borderColor = o.color;
                        div.style.color = o.color;
                    }
                    div.style.left = x + 'px'; div.style.top = y + 'px';
                    div.style.transform = `translate(-50%, -50%) rotate(${r}deg) scale(${s})`;
                    fMaster.appendChild(div);
                });
                if (p < 1) requestAnimationFrame(animate); else res();
            }
            requestAnimationFrame(animate);
        });
    }
    isPlaying = false; render();
}

function addStep() { saveState(); steps.push(JSON.parse(JSON.stringify(steps[curStep]))); curStep++; render(); resizeField(); }
function navStep(d) { curStep = Math.max(0, Math.min(steps.length-1, curStep+d)); deselect(); resizeField(); }
function removeActive() { if(activeId) { saveState(); steps[curStep] = steps[curStep].filter(o=>o.id!==activeId); deselect(); } }
function deselect() { activeId = null; render(); }

window.onload = () => { resizeField(); render(); };
window.addEventListener('resize', resizeField);
