let steps = [ [] ];
let curStep = 0;
let activeId = null;
let dragInfo = null;
let isPlaying = false;
let isDrawingPoly = false;
let teamColors = { 'p-red': '#ff4757', 'p-blue': '#2e86de', 'p-yellow': '#f1c40f', 'p-green': '#2ecc71' };

const fMaster = document.getElementById('field-master');
const svg = document.getElementById('svg-layer');

// --- SISTEMA VECTORIAL ---
function drawVector(el) {
    let d = "";
    if (el.sub === 'line') {
        d = `M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`;
    } else if (el.sub === 'curve') {
        // Curva Bezier de 4 nodos (Cúbica)
        d = `M ${el.x1} ${el.y1} C ${el.cx1} ${el.cy1}, ${el.cx2} ${el.cy2}, ${el.x2} ${el.y2}`;
    } else if (el.sub === 'poly') {
        // Polígono de N puntos
        d = el.pts.map((p, i) => (i === 0 ? `M` : `L`) + ` ${p.x} ${p.y}`).join(" ");
    }

    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    p.setAttribute("stroke", el.color || "#ffffff");
    p.setAttribute("stroke-width", "4");
    p.setAttribute("fill", "none"); // IMPORTANTE: Sin relleno
    if (el.arrow) p.setAttribute("marker-end", "url(#arrow)");
    p.setAttribute("class", "v-el");
    svg.appendChild(p);

    // Hit-area invisible para facilitar selección
    const h = p.cloneNode();
    h.setAttribute("stroke", "transparent");
    h.setAttribute("stroke-width", "25");
    h.setAttribute("class", "vec-hit v-el");
    h.dataset.id = el.id;
    h.style.pointerEvents = "auto";
    svg.appendChild(h);
}

// --- MODO POLÍGONO (Tap to draw) ---
function startPolyMode() {
    saveState();
    isDrawingPoly = true;
    const id = Date.now();
    steps[curStep].push({ id, type: 'vec', sub: 'poly', pts: [], color: "#ffffff", arrow: true });
    activeId = id;
    document.getElementById('poly-indicator').style.display = 'block';
    render();
}

function finishPoly() {
    isDrawingPoly = false;
    document.getElementById('poly-indicator').style.display = 'none';
    render();
}

// --- GESTIÓN DE EVENTOS (Offset + Poly) ---
function handlePointerDown(e) {
    if (isPlaying) return;
    
    const rect = fMaster.getBoundingClientRect();
    const zoom = rect.width / 1050;
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // Si estamos dibujando polígono, cada tap añade un punto
    if (isDrawingPoly) {
        const el = steps[curStep].find(o => o.id === activeId);
        el.pts.push({ x, y });
        render();
        return;
    }

    const hit = e.target.closest('.object, .vec-hit, .node');
    const hitId = hit ? Number(hit.dataset.id) : null;
    const wasSelected = (activeId === hitId && hitId !== null);
    activeId = hitId;

    if (activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        if (wasSelected || hit.classList.contains('node')) {
            dragInfo = { el, nx: hit.dataset.nx, ny: hit.dataset.ny, lastX: e.clientX, lastY: e.clientY, zoom };
            saveState();
        }
    }
    render();
}

function handlePointerMove(e) {
    if (!dragInfo) return;
    const dx = (e.clientX - dragInfo.lastX) / dragInfo.zoom;
    const dy = (e.clientY - dragInfo.lastY) / dragInfo.zoom;

    if (dragInfo.nx) { 
        // Estamos moviendo un NODO específico
        if (dragInfo.el.sub === 'poly') {
            dragInfo.el.pts[dragInfo.nx].x += dx;
            dragInfo.el.pts[dragInfo.nx].y += dy;
        } else {
            dragInfo.el[dragInfo.nx] += dx;
            dragInfo.el[dragInfo.ny] += dy;
        }
    } else {
        // MOVIMIENTO OFFSET (Toda la pieza)
        if (dragInfo.el.sub === 'poly') {
            dragInfo.el.pts.forEach(p => { p.x += dx; p.y += dy; });
        } else if (dragInfo.el.type === 'vec') {
            ['x1','x2','cx1','cx2'].forEach(k => { if(dragInfo.el[k]!==undefined) dragInfo.el[k]+=dx; });
            ['y1','y2','cy1','cy2'].forEach(k => { if(dragInfo.el[k]!==undefined) dragInfo.el[k]+=dy; });
        } else {
            dragInfo.el.x += dx; dragInfo.el.y += dy;
        }
    }
    dragInfo.lastX = e.clientX; dragInfo.lastY = e.clientY;
    render();
}

// --- NODOS DE CONTROL ---
function render() {
    // ... limpieza de campo ...
    steps[curStep].forEach(el => {
        if (el.type === 'vec') drawVector(el);
        else drawObject(el); // Jugadores, conos, etc.
    });

    if (activeId) {
        const el = steps[curStep].find(o => o.id === activeId);
        if (el && el.type === 'vec') {
            if (el.sub === 'line') {
                createNode(el, 'x1', 'y1', el.x1, el.y1);
                createNode(el, 'x2', 'y2', el.x2, el.y2);
            } else if (el.sub === 'curve') {
                createNode(el, 'x1', 'y1', el.x1, el.y1);
                createNode(el, 'cx1', 'cy1', el.cx1, el.cy1, true); // Nodo control cian
                createNode(el, 'cx2', 'cy2', el.cx2, el.cy2, true);
                createNode(el, 'x2', 'y2', el.x2, el.y2);
            } else if (el.sub === 'poly') {
                el.pts.forEach((p, i) => createNode(el, i, null, p.x, p.y));
            }
        }
    }
}

function createVector(s) {
    saveState();
    const id = Date.now();
    const base = { id, type: 'vec', sub: s, color: "#ffffff", arrow: true };
    if (s === 'line') Object.assign(base, { x1: 100, y1: 100, x2: 300, y2: 100 });
    if (s === 'curve') Object.assign(base, { x1: 100, y1: 200, cx1: 150, cy1: 100, cx2: 250, cy2: 300, x2: 300, y2: 200 });
    steps[curStep].push(base);
    activeId = id;
    render();
}
