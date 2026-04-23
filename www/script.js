let steps = [ [] ];
let history = [];
let curStep = 0;
let activeId = null;
let dragInfo = null;
let initialDist = 0;
let isPlaying = false;
let teamColors = { 'p-red': '#ff4757', 'p-blue': '#2e86de', 'p-yellow': '#f1c40f', 'p-green': '#2ecc71' };

const viewport = document.getElementById('viewport');
const fMaster = document.getElementById('field-master');
const svg = document.getElementById('svg-layer');

const drillLibrary = {
    rondo42: [
        {id:1,type:'zone',sub:'line',x:400,y:240,w:250,h:200,color:'#ffffff'},
        {id:2,type:'p-red',x:400,y:340,num:1,color:'#ff4757'},{id:3,type:'p-red',x:650,y:340,num:2,color:'#ff4757'},
        {id:4,type:'p-red',x:525,y:240,num:3,color:'#ff4757'},{id:5,type:'p-red',x:525,y:440,num:4,color:'#ff4757'},
        {id:6,type:'p-blue',x:500,y:340,num:1,color:'#2e86de'},{id:7,type:'p-blue',x:550,y:340,num:2,color:'#2e86de'},
        {id:8,type:'ball',x:425,y:340}
    ],
    y_drill: [
        {id:1,type:'cone',x:200,y:340,color:'#ffffff'},{id:2,type:'cone',x:400,y:340,color:'#ffffff'},
        {id:3,type:'cone',x:600,y:200,color:'#ffffff'},{id:4,type:'cone',x:600,y:480,color:'#ffffff'},
        {id:5,type:'p-red',x:150,y:340,num:1,color:'#ff4757'},{id:6,type:'p-red',x:150,y:300,num:2,color:'#ff4757'},
        {id:7,type:'p-blue',x:525,y:600,num:1,color:'#2e86de'},{id:8,type:'ball',x:180,y:340}
    ]
};

// --- REDIMENSIÓN RESPONSIVA ---
function resizeField() {
    const parent = viewport.getBoundingClientRect();
    const scale = Math.min(parent.width / 1050, parent.height / 680) * 0.95;
    fMaster.style.transform = `scale(${scale})`;
}

// --- GESTIÓN DE EVENTOS (Offset + Pinch) ---
function handlePointerDown(e) {
    if(isPlaying) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (e.touches && e.touches.length === 2 && activeId) {
        initialDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        return;
    }

    const hit = e.target.closest('.object, .vec-hit, .zone, .node');
    let hitId = hit ? Number(hit.dataset.id) : null;
    const wasSelected = (activeId === hitId && hitId !== null);
    activeId = hitId;

    if (activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        const rect = fMaster.getBoundingClientRect();
        const zoom = rect.width / 1050;
        
        if (wasSelected || (hit && hit.classList.contains('node'))) {
            dragInfo = { el, nx: hit.dataset.nx || 'x', ny: hit.dataset.ny || 'y', 
                         isZS: hit.classList.contains('node-zs'), 
                         lastX: clientX, lastY: clientY, zoom };
            saveState();
        }
    } else { deselect(); }
    render();
}

function handlePointerMove(e) {
    if(isPlaying) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (e.touches && e.touches.length === 2 && activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        const curDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const delta = curDist / initialDist;
        el.scale = Math.min(3, Math.max(0.3, (el.scale || 1) * delta));
        initialDist = curDist; render(); return;
    }

    if (!dragInfo) return;
    const dx = (clientX - dragInfo.lastX) / dragInfo.zoom;
    const dy = (clientY - dragInfo.lastY) / dragInfo.zoom;
    
    if (dragInfo.isZS) { dragInfo.el.w += dx; dragInfo.el.h += dy; }
    else if (dragInfo.el.type === 'vec' && dragInfo.nx === 'x') {
        ['x1','x2','cx1','cx2'].forEach(k => dragInfo.el[k]+=dx);
        ['y1','y2','cy1','cy2'].forEach(k => dragInfo.el[k]+=dy);
    } else {
        dragInfo.el[dragInfo.nx] += dx; dragInfo.el[dragInfo.ny] += dy;
    }
    dragInfo.lastX = clientX; dragInfo.lastY = clientY; render();
}

function handlePointerEnd() { dragInfo = null; }

// --- RENDERIZADO CORE ---
function render() {
    Array.from(fMaster.children).forEach(c => { if(c.id !== 'svg-layer') fMaster.removeChild(c); });
    svg.innerHTML = `<defs><marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="context-stroke" /></marker></defs>`;
    
    steps[curStep].forEach(el => {
        if(el.type === 'vec') drawVector(el);
        else if(el.type === 'zone') drawZone(el);
        else drawPhysical(el);
    });

    if(activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        if(el && el.type === 'vec') [['x1','y1'],['x2','y2']].forEach(([nx,ny]) => createNode(el,nx,ny,el[nx],el[ny]));
        if(el && el.type === 'zone') createNode(el,'w','h',el.x + el.w, el.y + el.h, false, true);
    }
    document.getElementById('step-label').innerText = `${curStep+1}/${steps.length}`;
    document.getElementById('inspector-panel').style.display = activeId ? 'block' : 'none';
}

function drawPhysical(el) {
    const div = document.createElement('div');
    div.className = `object ${el.type} ${activeId === el.id ? 'selected' : ''}`;
    div.dataset.id = el.id;
    if(el.type.startsWith('p-')) { div.style.background = el.color; div.innerText = el.num; div.classList.add('player'); }
    else if(el.type === 'ball') div.innerText = '⚽';
    else { div.classList.add(el.type); div.style.color = el.color; if(el.type==='cone') div.style.borderBottomColor = el.color; }
    div.style.left = el.x + 'px'; div.style.top = el.y + 'px';
    div.style.transform = `translate(-50%, -50%) scale(${el.scale||1})`; fMaster.appendChild(div);
}

function drawZone(el) {
    const div = document.createElement('div');
    div.className = `zone ${el.sub==='fill'?'zone-fill':'zone-line'} ${activeId === el.id ? 'selected' : ''}`;
    div.dataset.id = el.id; div.style.left = el.x + 'px'; div.style.top = el.y + 'px';
    div.style.width = el.w + 'px'; div.style.height = el.h + 'px'; div.style.borderColor = el.color;
    if(el.sub === 'fill') div.style.backgroundColor = el.color + '66'; fMaster.appendChild(div);
}

function drawVector(el) {
    const d = el.sub==='curve' ? `M ${el.x1} ${el.y1} C ${el.cx1} ${el.cy1}, ${el.cx2} ${el.cy2}, ${el.x2} ${el.y2}` : `M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`;
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d); p.setAttribute("stroke", el.color); p.setAttribute("stroke-width", "3");
    if(el.arrow) p.setAttribute("marker-end", "url(#arrow)"); p.setAttribute("class", "v-el"); svg.appendChild(p);
    const h = document.createElementNS("http://www.w3.org/2000/svg", "path");
    h.setAttribute("d", d); h.setAttribute("stroke", "transparent"); h.setAttribute("stroke-width", "30"); h.setAttribute("class", "vec-hit v-el"); h.dataset.id = el.id; svg.appendChild(h);
}

// --- ACCIONES ---
function createPlayer(t) { saveState(); const id=Date.now(); steps[curStep].push({id, type:t, x:150, y:150, color:teamColors[t], num:steps[curStep].filter(o=>o.type===t).length+1}); activeId=id; render(); }
function createItem(t) { saveState(); const id=Date.now(); let c=t==='cone'?'#e67e22':(t==='valla'?'#e74c3c':'#f1c40f'); steps[curStep].push({id, type:t, x:200, y:200, color:c}); activeId=id; render(); }
function createVector(s) { saveState(); const id=Date.now(); steps[curStep].push({id, type:'vec', sub:s, x1:100, y1:100, x2:200, y2:100, cx1:150, cy1:150, cx2:150, cy2:150, color:"#ffffff", arrow:true}); activeId=id; render(); }
function createZone(s) { saveState(); const id=Date.now(); steps[curStep].push({id, type:'zone', sub:s, x:200, y:200, w:150, h:100, color:"#ffa500"}); activeId=id; render(); }

function undo() { if(history.length>0){steps=JSON.parse(history.pop()); render();} }
function saveState() { if(history.length>30) history.shift(); history.push(JSON.stringify(steps)); }
function deselect() { activeId=null; render(); }
function modifyProp(p,v) { saveState(); const el=steps[curStep].find(o=>o.id===activeId); if(el){el[p]=v; render();} }
function updateTeamColor(t,c) { teamColors[t]=c; steps.forEach(s => s.forEach(el => { if(el.type===t) el.color=c; })); render(); }
function addStep() { saveState(); steps.push(JSON.parse(JSON.stringify(steps[curStep]))); curStep++; render(); }
function navStep(d) { curStep=Math.max(0, Math.min(steps.length-1, curStep+d)); deselect(); }
function openLibrary() { document.getElementById('library-modal').style.display='flex'; }
function closeLibrary() { document.getElementById('library-modal').style.display='none'; }
function injectDrill(k) { saveState(); const d=JSON.parse(JSON.stringify(drillLibrary[k]||[])); const n=Date.now(); d.forEach((e,i)=>e.id=n+i); steps[curStep]=d; closeLibrary(); render(); }
function openResetMenu() { document.getElementById('reset-modal').style.display='flex'; }
function closeResetMenu() { document.getElementById('reset-modal').style.display='none'; }
function resetAction(t) { saveState(); if(t==='step') steps[curStep]=[]; else {steps=[[]]; curStep=0;} closeResetMenu(); render(); }
function createNode(el,nx,ny,fx,fy,isC=false,isZS=false) { const node=document.createElement('div'); node.className=`node ${isZS?'node-zs':''}`; node.style.left=fx+'px'; node.style.top=fy+'px'; node.dataset.id=el.id; node.dataset.nx=nx; node.dataset.ny=ny; node.innerHTML=`<div class="node-in"></div>`; fMaster.appendChild(node); }
function changeField(t) { const imgs={'entero':'campoentero.png','medio':'mediocampo.png'}; fMaster.style.backgroundImage=`url('${imgs[t]}')`; }
function duplicateActive() { if(!activeId) return; saveState(); const t=steps[curStep].find(o=>o.id===activeId); const c=JSON.parse(JSON.stringify(t)); c.id=Date.now(); c.x+=40; c.y+=40; steps[curStep].push(c); activeId=c.id; render(); }
async function exportMP4() { if(steps.length<2) return; deselect(); const stream=fMaster.captureStream(30); const rec=new MediaRecorder(stream, {mimeType:'video/webm;codecs=vp8'}); const chunks=[]; rec.ondataavailable=e=>chunks.push(e.data); rec.onstop=()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(chunks,{type:'video/webm'})); a.download='tactica.webm'; a.click(); }; rec.start(); await runAnimation(); setTimeout(()=>rec.stop(), 500); }
async function runAnimation() { isPlaying=true; deselect(); /* Animación básica de pasos */ isPlaying=false; render(); }
window.onload=()=>{resizeField(); render();}; window.addEventListener('resize', resizeField);
