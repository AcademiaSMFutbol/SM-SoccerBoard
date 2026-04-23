let steps = [ [] ];
let history = [];
let curStep = 0;
let activeId = null;
let dragInfo = null;
let isPlaying = false;
let isDrawingPoly = false;
let activePointers = new Map();
let initialPinchDist = null;
let teamColors = { 'p-red': '#ff4757', 'p-blue': '#2e86de', 'p-yellow': '#f1c40f', 'p-green': '#2ecc71' };

const fMaster = document.getElementById('field-master');
const svg = document.getElementById('svg-layer');

// Variables para detectar un TAP puro (Rotación)
let tapStartX = 0, tapStartY = 0;
let isPossibleTap = false;

// --- GESTIÓN DE EVENTOS RESTRINGIDA AL VIEWPORT ---
// Esto arregla el bug de la interfaz bloqueada
const viewport = document.getElementById('viewport');

viewport.addEventListener('pointerdown', (e) => {
    if (isPlaying) return;
    
    // Preparar detección de Tap
    tapStartX = e.clientX;
    tapStartY = e.clientY;
    isPossibleTap = true;

    const hit = e.target.closest('.object, .vec-hit, .zone, .node');
    const hitId = hit ? Number(hit.dataset.id) : null;
    
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const rect = fMaster.getBoundingClientRect();
    const zoom = rect.width / 1050;

    // Dibujo polígono (cada tap añade un punto)
    if (isDrawingPoly) {
        if(activeId) {
            const el = steps[curStep].find(o => o.id === activeId);
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
            if (wasSelected || (hit && hit.classList.contains('node'))) {
                dragInfo = { el, nx: hit.dataset.nx, ny: hit.dataset.ny, lastX: e.clientX, lastY: e.clientY, zoom };
                saveState();
            }
        } else if (!hit) { deselect(); }
    } else if (activePointers.size === 2 && activeId) {
        const pts = Array.from(activePointers.values());
        initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
    render();
});

// El move y up van en window para no perder el arrastre si el dedo sale del viewport
window.addEventListener('pointermove', (e) => {
    if (!activePointers.has(e.pointerId) || isPlaying) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Cancelar Tap si hay movimiento > 5px
    if (isPossibleTap && Math.hypot(e.clientX - tapStartX, e.clientY - tapStartY) > 5) {
        isPossibleTap = false;
    }

    // PELLIZCO (Escalado)
    if (activePointers.size === 2 && activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        const pts = Array.from(activePointers.values());
        const curDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const delta = curDist / initialPinchDist;
        el.scale = Math.min(3, Math.max(0.3, (el.scale || 1) * delta));
        initialPinchDist = curDist;
        render(); return;
    }

    // OFFSET DRAG
    if (dragInfo && activePointers.size === 1 && !isDrawingPoly) {
        const dx = (e.clientX - dragInfo.lastX) / dragInfo.zoom;
        const dy = (e.clientY - dragInfo.lastY) / dragInfo.zoom;
        
        if (dragInfo.nx) { 
            if (dragInfo.el.sub === 'poly') { dragInfo.el.pts[dragInfo.nx].x += dx; dragInfo.el.pts[dragInfo.nx].y += dy; }
            else { dragInfo.el[dragInfo.nx] += dx; dragInfo.el[dragInfo.ny] += dy; }
        } else {
            if (dragInfo.el.sub === 'poly') { dragInfo.el.pts.forEach(p => { p.x += dx; p.y += dy; }); }
            else if (dragInfo.el.type === 'vec') {
                ['x1','x2','cx1','cx2'].forEach(k => { if(dragInfo.el[k]!==undefined) dragInfo.el[k]+=dx; });
                ['y1','y2','cy1','cy2'].forEach(k => { if(dragInfo.el[k]!==undefined) dragInfo.el[k]+=dy; });
            } else { dragInfo.el.x += dx; dragInfo.el.y += dy; }
        }
        dragInfo.lastX = e.clientX; dragInfo.lastY = e.clientY;
        render();
    }
});

window.addEventListener('pointerup', (e) => {
    // ROTACIÓN POR TAP 15º
    if (isPossibleTap && activeId && activePointers.size === 1 && !isDrawingPoly) {
        const el = steps[curStep].find(o => o.id === activeId);
        const rotatable = ['cone', 'pica', 'valla', 'ladder', 'ball'];
        if (el && (el.type.startsWith('p-') || rotatable.includes(el.type))) {
            el.rot = (el.rot || 0) + 15;
            if (el.rot >= 360) el.rot = 0;
            render();
        }
    }

    activePointers.delete(e.pointerId);
    if (activePointers.size < 2) initialPinchDist = null;
    dragInfo = null;
});

// --- RENDERIZADO Y DIBUJO ---
function render() {
    if (isPlaying) return;
    Array.from(fMaster.children).forEach(c => { if(c.id !== 'svg-layer') fMaster.removeChild(c); });
    svg.innerHTML = `<defs><marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="context-stroke" /></marker></defs>`;
    
    steps[curStep].forEach(el => {
        if (el.type === 'vec') drawVector(el);
        else if (el.type === 'zone') drawZone(el);
        else drawPhysical(el);
    });

    if (activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        if (el && el.type === 'vec') {
            if (el.sub === 'line') { createNode(el, 'x1', 'y1', el.x1, el.y1); createNode(el, 'x2', 'y2', el.x2, el.y2); }
            else if (el.sub === 'curve') { createNode(el, 'x1', 'y1', el.x1, el.y1); createNode(el, 'cx1', 'cy1', el.cx1, el.cy1, true); createNode(el, 'cx2', 'cy2', el.cx2, el.cy2, true); createNode(el, 'x2', 'y2', el.x2, el.y2); }
            else if (el.sub === 'poly') { el.pts.forEach((p, i) => createNode(el, i, null, p.x, p.y)); }
        }
    }
    
    document.getElementById('step-label').innerText = `${curStep+1}/${steps.length}`;
    document.getElementById('inspector-panel').style.display = activeId ? 'block' : 'none';
    if(activeId) document.getElementById('ins-color').value = steps[curStep].find(o=>o.id===activeId).color || '#ffffff';
}

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
    div.className = `zone ${el.sub==='fill'?'zone-fill':'zone-line'} ${activeId === el.id ? 'selected' : ''}`;
    div.dataset.id = el.id; div.style.left = el.x + 'px'; div.style.top = el.y + 'px';
    div.style.width = el.w + 'px'; div.style.height = el.h + 'px'; div.style.borderColor = el.color;
    if(el.sub === 'fill') div.style.backgroundColor = el.color + '44'; fMaster.appendChild(div);
}

function drawVector(el) {
    let d = "";
    if (el.sub === 'line') d = `M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`;
    else if (el.sub === 'curve') d = `M ${el.x1} ${el.y1} C ${el.cx1} ${el.cy1}, ${el.cx2} ${el.cy2}, ${el.x2} ${el.y2}`;
    else if (el.sub === 'poly') d = el.pts.map((p, i) => (i === 0 ? `M` : `L`) + ` ${p.x} ${p.y}`).join(" ");

    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d); p.setAttribute("stroke", el.color || "#ffffff"); p.setAttribute("stroke-width", "4");
    p.setAttribute("fill", "none");
    if(el.arrow) p.setAttribute("marker-end", "url(#arrow)"); p.setAttribute("class", "v-el"); svg.appendChild(p);

    const h = document.createElementNS("http://www.w3.org/2000/svg", "path");
    h.setAttribute("d", d); h.setAttribute("stroke", "transparent"); h.setAttribute("stroke-width", "30");
    h.setAttribute("class", "vec-hit v-el"); h.dataset.id = el.id; h.style.pointerEvents = "auto"; svg.appendChild(h);
}

// --- SELECTOR DE CAMPO CORREGIDO ---
function changeField(t) {
    const imgs = {
        'entero': 'campoentero.png',
        'medio': 'mediocampo.png',
        'ejercicio': 'campoejercicio.png'
    };
    if (imgs[t]) {
        // Mantiene el color verde de fondo por si la imagen tarda en cargar o tiene transparencias
        fMaster.style.background = `#27ae60 url('${imgs[t]}') no-repeat center / 100% 100%`;
    }
}

// --- ANIMACIÓN ---
async function runAnimation() {
    if (steps.length < 2) { alert("Añade un Paso 2 para animar"); return; }
    isPlaying = true; deselect();
    const duration = parseInt(document.getElementById('speed-slider').value);
    for (let i = 0; i < steps.length - 1; i++) { await animateTransition(steps[i], steps[i+1], duration); }
    isPlaying = false; render();
}

function animateTransition(f1, f2, dur) {
    return new Promise(res => {
        let start = null;
        function update(ts) {
            if (!start) start = ts;
            const p = Math.min((ts - start) / dur, 1);
            Array.from(fMaster.children).forEach(c => { if (c.id !== 'svg-layer') fMaster.removeChild(c); });
            f1.forEach(o1 => {
                const o2 = f2.find(x => x.id === o1.id);
                if (!o2) return;
                const temp = JSON.parse(JSON.stringify(o1));
                if (o1.type === 'vec' || o1.type === 'zone') return; // Se animan físiscos
                temp.x = o1.x + (o2.x - o1.x) * p;
                temp.y = o1.y + (o2.y - o1.y) * p;
                temp.scale = (o1.scale||1) + ((o2.scale||1) - (o1.scale||1)) * p;
                temp.rot = (o1.rot||0) + ((o2.rot||0) - (o1.rot||0)) * p;
                
                const div = document.createElement('div');
                div.className = `object ${temp.type}`;
                if(temp.type.startsWith('p-')) { div.style.background = temp.color; div.innerText = temp.num; div.classList.add('player'); }
                else if(temp.type === 'ball') div.innerText = '⚽';
                else { div.classList.add(temp.type); div.style.color = temp.color; if(temp.type==='cone') div.style.borderBottomColor = temp.color; }
                div.style.left = temp.x + 'px'; div.style.top = temp.y + 'px';
                div.style.transform = `translate(-50%, -50%) rotate(${temp.rot}deg) scale(${temp.scale})`; fMaster.appendChild(div);
            });
            if (p < 1) requestAnimationFrame(update); else res();
        }
        requestAnimationFrame(update);
    });
}

// --- EXPORTACIÓN MP4 ---
async function exportMP4() {
    if (steps.length < 2) return;
    deselect(); render();
    const stream = fMaster.captureStream ? fMaster.captureStream(30) : null;
    if (!stream) { alert("Tu navegador no soporta grabación directa."); return; }
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    rec.onstop = () => {
        const url = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
        const a = document.createElement('a'); a.href = url; a.download = `tactica_${Date.now()}.webm`; a.click(); URL.revokeObjectURL(url);
    };
    rec.start(); await runAnimation(); setTimeout(() => rec.stop(), 500);
}

// --- UTILIDADES RESTANTES ---
function createPlayer(t) { saveState(); const id=Date.now(); steps[curStep].push({id, type:t, x:150, y:150, color:teamColors[t], num:steps[curStep].filter(o=>o.type===t).length+1, scale:1, rot:0}); activeId=id; render(); }
function createItem(t) { saveState(); const id=Date.now(); let c=(t==='cone'?'#e67e22':(t==='valla'?'#e74c3c':'#f1c40f')); steps[curStep].push({id, type:t, x:200, y:200, color:c, scale:1, rot:0}); activeId=id; render(); }
function createVector(s) { saveState(); const id=Date.now(); const base = {id, type:'vec', sub:s, color:"#ffffff", arrow:true}; if(s==='line') Object.assign(base, {x1:100,y1:100,x2:250,y2:100}); if(s==='curve') Object.assign(base, {x1:100,y1:200,cx1:150,cy1:100,cx2:250,cy2:300,x2:300,y2:200}); steps[curStep].push(base); activeId=id; render(); }
function createZone(s) { saveState(); const id=Date.now(); steps[curStep].push({id, type:'zone', sub:s, x:200, y:200, w:150, h:100, color:"#ffa500"}); activeId=id; render(); }
function startPolyMode() { saveState(); isDrawingPoly = true; const id = Date.now(); steps[curStep].push({ id, type: 'vec', sub: 'poly', pts: [], color: "#ffffff", arrow: true }); activeId = id; document.getElementById('poly-indicator').style.display = 'block'; document.getElementById('btn-finish-poly').style.display = 'block'; render(); }
function finishPoly() { isDrawingPoly = false; document.getElementById('poly-indicator').style.display = 'none'; document.getElementById('btn-finish-poly').style.display = 'none'; render(); }

function resizeField() { const p = document.getElementById('viewport').getBoundingClientRect(); const s = Math.min(p.width/1050, p.height/680) * 0.95; fMaster.style.transform = `scale(${s})`; }
function saveState() { if(history.length>30) history.shift(); history.push(JSON.stringify(steps)); }
function undo() { if(history.length>0){steps=JSON.parse(history.pop()); render();} }
function addStep() { saveState(); steps.push(JSON.parse(JSON.stringify(steps[curStep]))); curStep++; render(); }
function navStep(d) { curStep=Math.max(0, Math.min(steps.length-1, curStep+d)); deselect(); }
function deselect() { activeId = null; if(isDrawingPoly) finishPoly(); render(); }
function modifyProp(p,v) { const el=steps[curStep].find(o=>o.id===activeId); if(el){el[p]=v; render();} }
function updateTeamColor(t,c) { teamColors[t]=c; steps.forEach(s=>s.forEach(o=>{if(o.type===t)o.color=c;})); render(); }
function openLibrary() { document.getElementById('library-modal').style.display='flex'; }
function closeLibrary() { document.getElementById('library-modal').style.display='none'; }
function openResetMenu() { document.getElementById('reset-modal').style.display='flex'; }
function closeResetMenu() { document.getElementById('reset-modal').style.display='none'; }
function resetAction(t) { saveState(); if(t==='step') steps[curStep]=[]; else {steps=[[]]; curStep=0;} closeResetMenu(); render(); }
function duplicateActive() { if(!activeId) return; saveState(); const t=steps[curStep].find(o=>o.id===activeId); const c=JSON.parse(JSON.stringify(t)); c.id=Date.now(); if(c.type!=='vec' && c.type!=='zone') { c.x+=40; c.y+=40; } steps[curStep].push(c); activeId=c.id; render(); }
function createNode(el,nx,ny,fx,fy,isC=false,isZS=false) { const node = document.createElement('div'); node.className = `node ${isZS?'node-zs':''}`; node.style.left = fx+'px'; node.style.top = fy+'px'; node.dataset.id = el.id; node.dataset.nx = nx; node.dataset.ny = ny; node.innerHTML = `<div class="node-in" style="${isC?'background:cyan':''}"></div>`; fMaster.appendChild(node); }

const drillLibrary = { rondo42: [{id:1,type:'zone',sub:'line',x:400,y:240,w:250,h:200,color:'#ffffff'},{id:2,type:'p-red',x:400,y:340,num:1,color:'#ff4757'},{id:3,type:'p-red',x:650,y:340,num:2,color:'#ff4757'},{id:4,type:'p-blue',x:525,y:340,num:1,color:'#2e86de'}], y_drill: [{id:1,type:'cone',x:200,y:340,color:'#ffffff'},{id:2,type:'cone',x:400,y:340,color:'#ffffff'},{id:3,type:'p-red',x:150,y:340,num:1,color:'#ff4757'}] };
function injectDrill(k) { saveState(); const d=JSON.parse(JSON.stringify(drillLibrary[k]||[])); const n=Date.now(); d.forEach((e,i)=>e.id=n+i); steps[curStep]=d; closeLibrary(); render(); }

window.onload=()=>{resizeField(); render();}; window.addEventListener('resize', resizeField);
