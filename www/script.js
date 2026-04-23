let steps = [ [] ];
let history = [];
let curStep = 0;
let activeId = null;
let dragInfo = null;
let initialPinchDist = 0;
let isPlaying = false;
let animationSpeed = 800;
let teamColors = { 'p-red': '#ff4757', 'p-blue': '#2e86de', 'p-yellow': '#f1c40f', 'p-green': '#2ecc71' };

const viewport = document.getElementById('viewport');
const fMaster = document.getElementById('field-master');
const svg = document.getElementById('svg-layer');

const drillLibrary = {
    rondo42: [
        {id:1,type:'zone',sub:'line',x:400,y:240,w:250,h:200,color:'#ffffff',locked:true},
        {id:2,type:'p-red',x:400,y:340,num:1,color:'#ff4757'},{id:3,type:'p-red',x:650,y:340,num:2,color:'#ff4757'},
        {id:4,type:'p-blue',x:525,y:340,num:1,color:'#2e86de'},{id:5,type:'ball',x:425,y:340}
    ],
    y_drill: [
        {id:1,type:'cone',x:200,y:340,color:'#ffffff'},{id:2,type:'cone',x:400,y:340,color:'#ffffff'},
        {id:3,type:'cone',x:600,y:200,color:'#ffffff'},{id:4,type:'cone',x:600,y:480,color:'#ffffff'},
        {id:5,type:'p-red',x:160,y:340,num:1,color:'#ff4757'},{id:6,type:'p-red',x:120,y:340,num:2,color:'#ff4757'},
        {id:7,type:'p-red',x:140,y:300,num:3,color:'#ff4757'},{id:8,type:'p-blue',x:525,y:640,num:1,color:'#2e86de'},
        {id:9,type:'ball',x:180,y:340}
    ],
    slalom: [{id:1,type:'cone',x:300,y:340,color:'#e67e22'},{id:2,type:'cone',x:450,y:340,color:'#e67e22'},{id:3,type:'p-red',x:200,y:340,num:1,color:'#ff4757'}],
    tiro: [{id:1,type:'p-blue',x:525,y:600,num:1,color:'#2e86de'},{id:2,type:'ball',x:525,y:300}]
};

function openLibrary() { document.getElementById('library-modal').style.display = 'flex'; }
function closeLibrary() { document.getElementById('library-modal').style.display = 'none'; }
function injectDrill(key) { 
    saveState(); 
    const data = JSON.parse(JSON.stringify(drillLibrary[key] || [])); 
    const now = Date.now(); 
    data.forEach((el, idx) => el.id = now + idx); 
    steps[curStep] = data; 
    closeLibrary(); render(); 
}

// MANEJO DE EVENTOS (Offset Drag + Pinch Scale)
function handleGlobalDown(e) {
    if(isPlaying) return;
    
    // Pinch Scale Detection (Multi-touch)
    if (e.touches && e.touches.length === 2 && activeId) {
        initialPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        return;
    }

    const hit = e.target.closest('.object, .vec-hit, .zone, .node, .player');
    let hitId = hit ? Number(hit.dataset.id) : null;
    const wasSelected = (activeId === hitId && hitId !== null);
    activeId = hitId;

    if(activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        const rect = fMaster.getBoundingClientRect();
        const zoom = rect.width / 1050;
        
        // OFFSET DRAG: Solo si ya estaba seleccionado O es un nodo
        if(wasSelected || hit.classList.contains('node')) {
            dragInfo = { el, nx: hit.dataset.nx || 'x', ny: hit.dataset.ny || 'y', isZS: hit.classList.contains('node-zs'), moved: false, lastX: e.clientX || e.touches[0].clientX, lastY: e.clientY || e.touches[0].clientY, zoom };
            saveState();
        } else { dragInfo = null; }
        render();
    } else { deselect(); }
}

function handleGlobalMove(e) {
    if(isPlaying) return;

    // PINCH SCALING
    if (e.touches && e.touches.length === 2 && activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const delta = currentDist / initialPinchDist;
        if (!el.scale) el.scale = 1;
        el.scale = Math.min(3, Math.max(0.3, el.scale * delta));
        initialPinchDist = currentDist;
        render();
        return;
    }

    if(!dragInfo) return;
    const curX = e.clientX || e.touches[0].clientX;
    const curY = e.clientY || e.touches[0].clientY;
    const dx = (curX - dragInfo.lastX) / dragInfo.zoom;
    const dy = (curY - dragInfo.lastY) / dragInfo.zoom;
    
    if (Math.hypot(dx, dy) > 0.5) dragInfo.moved = true;
    
    if(dragInfo.isZS) { dragInfo.el.w += dx; dragInfo.el.h += dy; }
    else if(dragInfo.el.type === 'vec' && dragInfo.nx === 'x') { 
        ['x1','x2','cx1','cx2'].forEach(k => dragInfo.el[k]+=dx); 
        ['y1','y2','cy1','cy2'].forEach(k => dragInfo.el[k]+=dy); 
    }
    else { dragInfo.el[dragInfo.nx] += dx; dragInfo.el[dragInfo.ny] += dy; }
    
    dragInfo.lastX = curX; dragInfo.lastY = curY; render();
}

function handleGlobalEnd() { dragInfo = null; render(); }

// RENDER Y DIBUJO
function render() {
    if (isPlaying) return;
    Array.from(fMaster.children).forEach(c => { if(c.id !== 'svg-layer') fMaster.removeChild(c); });
    svg.querySelectorAll('.v-el').forEach(e => e.remove());
    steps[curStep].forEach(el => {
        if(el.type === 'vec') drawVector(el);
        else if(el.type === 'zone') drawZone(el);
        else drawPhysical(el);
    });
    if(activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        if(el && el.type === 'vec') { [['x1','y1'], ['x2','y2']].forEach(([nx, ny]) => createNode(el, nx, ny, el[nx], el[ny])); }
        if(el && el.type === 'zone' && !el.locked) createNode(el, 'w', 'h', el.x + el.w, el.y + el.h, false, true);
    }
    document.getElementById('step-label').innerText = `${curStep+1}/${steps.length}`;
    updateInspector();
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
    div.className = `zone ${el.sub==='fill'?'zone-fill':'zone-line'} ${activeId === el.id ? 'selected' : ''} ${el.locked?'zone-locked':''}`;
    div.dataset.id = el.id; div.style.left = el.x + 'px'; div.style.top = el.y + 'px';
    div.style.width = el.w + 'px'; div.style.height = el.h + 'px'; div.style.borderColor = el.color;
    if(el.sub === 'fill') div.style.backgroundColor = el.color + '66';
    fMaster.appendChild(div);
}

function drawVector(el) {
    const d = el.sub==='curve' ? `M ${el.x1} ${el.y1} C ${el.cx1} ${el.cy1}, ${el.cx2} ${el.cy2}, ${el.x2} ${el.y2}` : `M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`;
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d); p.setAttribute("stroke", el.color); p.setAttribute("stroke-width", "3");
    if(el.arrow) p.setAttribute("marker-end", "url(#arrow)"); p.setAttribute("class", "v-el"); svg.appendChild(p);
    const h = document.createElementNS("http://www.w3.org/2000/svg", "path");
    h.setAttribute("d", d); h.setAttribute("stroke", "transparent"); h.setAttribute("stroke-width", "30"); h.setAttribute("class", "vec-hit v-el"); h.dataset.id = el.id; svg.appendChild(h);
}

// EXPORTACIÓN MP4 (CÓDEC ANDROID FIX)
async function exportMP4() {
    if(steps.length < 2) return;
    deselect();
    const stream = fMaster.captureStream(30);
    // Usar el códec más compatible posible
    const options = { mimeType: 'video/webm;codecs=vp8' };
    const rec = new MediaRecorder(stream, options);
    const chunks = [];
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = () => {
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(chunks, {type:'video/webm'}));
        a.download = 'animacion_tactica.webm'; a.click();
    };
    rec.start(); await runAnimation(); setTimeout(() => rec.stop(), 500);
}

// OTROS
function createPlayer(t) { saveState(); const id=Date.now(); steps[curStep].push({id, type:t, x:100, y:100, color:teamColors[t], num:steps[curStep].filter(o=>o.type===t).length+1}); activeId=id; render(); }
function createItem(t) { saveState(); const id=Date.now(); let c=t==='cone'?'#e67e22':(t==='valla'?'#e74c3c':'#f1c40f'); steps[curStep].push({id, type:t, x:150, y:150, color:c}); activeId=id; render(); }
function createZone(s) { saveState(); const id=Date.now(); steps[curStep].push({id, type:'zone', sub:s, x:100, y:100, w:200, h:150, color:"#ffa500", locked:false}); activeId=id; render(); }
function createVector(s) { saveState(); const id=Date.now(); steps[curStep].push({id, type:'vec', sub:s, x1:50, y1:50, x2:150, y2:50, cx1:75, cy1:100, cx2:125, cy2:100, color:"#000000", arrow:true}); activeId=id; render(); }
function modifyProp(p, v) { saveState(); const el = steps[curStep].find(o=>o.id===activeId); if(el) { el[p]=v; render(); } }
function updateTeamColor(t, c) { teamColors[t]=c; steps.forEach(s => s.forEach(el => { if(el.type===t) el.color=c; })); render(); }
function changeField(t) { const imgs={'entero':'campoentero.png','medio':'mediocampo.png','ejercicio':'campoejercicio.png'}; fMaster.style.backgroundImage=`url('${imgs[t]}')`; setTimeout(resizeField, 50); }
function resizeField() { const vw=viewport.clientWidth, vh=viewport.clientHeight; let final=Math.min(vw/1050, vh/680); fMaster.style.transform=`scale(${final})`; }
function saveState() { if(history.length > 30) history.shift(); history.push(JSON.stringify(steps)); }
function undo() { if(history.length > 0) { steps=JSON.parse(history.pop()); render(); } }
function deselect() { activeId=null; render(); }
function updateInspector() { const p=document.getElementById('inspector-panel'); if(!activeId){p.style.display='none'; return;} p.style.display='block'; const el=steps[curStep].find(o=>o.id===activeId); document.getElementById('ins-color').value=el.color||'#000000'; document.getElementById('lock-btn').innerText=el.locked?"🔓 DESBLOQUEAR":"🔒 BLOQUEAR"; }
function toggleZoneLock() { const el=steps[curStep].find(o=>o.id===activeId); if(el && el.type==='zone'){el.locked=!el.locked; render();} }
function addStep() { saveState(); steps.push(JSON.parse(JSON.stringify(steps[curStep]))); curStep++; render(); }
function navStep(d) { curStep=Math.max(0, Math.min(steps.length-1, curStep+d)); deselect(); }
function removeActive() { if(activeId){saveState(); steps[curStep]=steps[curStep].filter(o=>o.id!==activeId); deselect();} }
function openResetMenu() { if(confirm("¿Borrar todo?")) { steps=[[]]; curStep=0; render(); } }
async function runAnimation() { if(steps.length<2) return; isPlaying=true; deselect(); for(let i=0; i<steps.length-1; i++){ await new Promise(res => { let start=null; const f1=steps[i], f2=steps[i+1]; function animate(ts){ if(!start) start=ts; const p=Math.min((ts-start)/animationSpeed, 1); Array.from(fMaster.children).forEach(c=>{ if(c.id!=='svg-layer') fMaster.removeChild(c); }); f1.forEach(o=>{ const t=f2.find(x=>x.id===o.id); if(!t || !(o.type.startsWith('p-') || o.type==='ball')){ if(t) drawPhysical(o); return; } const div=document.createElement('div'); div.className=`object ${o.type} player`; const x=o.x+(t.x-o.x)*p; const y=o.y+(t.y-o.y)*p; if(o.type.startsWith('p-')){ div.style.background=o.color; div.innerText=o.num; } else if(o.type==='ball'){ div.innerText='⚽'; div.classList.remove('player'); } div.style.left=x+'px'; div.style.top=y+'px'; div.style.transform=`translate(-50%, -50%)`; fMaster.appendChild(div); }); if(p<1) requestAnimationFrame(animate); else res(); } requestAnimationFrame(animate); }); } isPlaying=false; render(); }
function createNode(el, nx, ny, fx, fy, isC=false, isZS=false) { const node=document.createElement('div'); node.className=`node ${isZS?'node-zs':''}`; node.style.left=fx+'px'; node.style.top=fy+'px'; node.dataset.id=el.id; node.dataset.nx=nx; node.dataset.ny=ny; node.innerHTML=`<div class="node-in" style="${isC?'background:cyan':''}"></div>`; fMaster.appendChild(node); }
window.onload=()=>{resizeField(); render();};
window.addEventListener('resize', resizeField);
function duplicateActive() { if(!activeId) return; saveState(); const target=steps[curStep].find(o=>o.id===activeId); const clone=JSON.parse(JSON.stringify(target)); clone.id=Date.now(); clone.x+=40; clone.y+=40; steps[curStep].push(clone); activeId=clone.id; render(); }
