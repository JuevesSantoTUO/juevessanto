// LISTADO ESTÁTICO (Aparecen siempre)
const TUNOS_PREDETERMINADOS = [
    { Nombre: "Rumbito", Tuna: "TUO" },
    { Nombre: "Cueva", Tuna: "TUO" },
    { Nombre: "Tito", Tuna: "TUO" },
    { Nombre: "Jacobo", Tuna: "TUO" },
    { Nombre: "Javierin", Tuna: "TUO" },
    { Nombre: "Pincelín", Tuna: "TUO" },
    { Nombre: "Vizcaino", Tuna: "TUO" },
    { Nombre: "Calentín", Tuna: "TUO" },
    { Nombre: "Quimi", Tuna: "TUO" },
    { Nombre: "CTLL", Tuna: "TUO" },
    //{ Nombre: "Mudito", Tuna: "TUO" },
    { Nombre: "Angustias", Tuna: "TUO" },
    { Nombre: "Gavilan", Tuna: "TUO" },
    { Nombre: "Elvis", Tuna: "TAUO" },
    { Nombre: "Jose Carlos", Tuna: "TAUO" },
    //{ Nombre: "Sabonis", Tuna: "TAUO" },
    //{ Nombre: "Rambín", Tuna: "TAUO" },
    { Nombre: "Negro", Tuna: "TAUO" },
    { Nombre: "Gnomo", Tuna: "TAUO" },
    //{ Nombre: "Luisma", Tuna: "TAUO" },
    { Nombre: "Piñines", Tuna: "TAUO" },
    { Nombre: "Laureano", Tuna: "TAUO" },
    { Nombre: "Pascual", Tuna: "TAUO" },
    { Nombre: "Odón", Tuna: "TAUO" },
    { Nombre: "Bubu", Tuna: "TAUO" },
    { Nombre: "Lobo", Tuna: "TAUO" },
    { Nombre: "Samsonite", Tuna: "TAUO" },
    { Nombre: "TomTom", Tuna: "TFUO" },
    { Nombre: "Seño", Tuna: "TFUO" },
    { Nombre: "Pelotari", Tuna: "TFUO" },
    { Nombre: "Yoda", Tuna: "TUS" },
    { Nombre: "Tomate", Tuna: "TUS" },
    { Nombre: "Iguana", Tuna: "TUS" },
    { Nombre: "Groot", Tuna: "TUS" },
    { Nombre: "Fafifu", Tuna: "TIIG" },
    { Nombre: "Epi", Tuna: "TIIG" },
    { Nombre: "Cantelín", Tuna: "TIIG" },
    { Nombre: "Pichi", Tuna: "TIIG" },
    { Nombre: "Pipo", Tuna: "TIIG" },
    { Nombre: "Loco", Tuna: "TULE" },
    { Nombre: "Nena", Tuna: "TULE" },
    { Nombre: "Otto", Tuna: "TULE" },
    { Nombre: "Escroto", Tuna: "TULE" },
    { Nombre: "Torrezno", Tuna: "TUSAL" },
    { Nombre: "Atos", Tuna: "TUSAL" },
    { Nombre: "Dobbycioso", Tuna: "TUSAL" },
    { Nombre: "PinVIII", Tuna: "TUSAL" },
    { Nombre: "Marilyn", Tuna: "TUSAL" },
    { Nombre: "Orson", Tuna: "TVO" },
    { Nombre: "Paquirrín", Tuna: "TVO" },
    { Nombre: "Jami", Tuna: "TVO" },
    { Nombre: "Piccolo", Tuna: "TVO" },
    { Nombre: "Búho", Tuna: "CUBU" },
    { Nombre: "Dulce", Tuna: "TDOU" },
    { Nombre: "Piolín", Tuna: "TFDEUS" },
    { Nombre: "Agonías", Tuna: "TFSANT" },
    { Nombre: "Mota", Tuna: "TFUSAL" },
    { Nombre: "Teclitas", Tuna: "TMAGBU" },
    { Nombre: "Pablos", Tuna: "TMI" },
    { Nombre: "Estríper", Tuna: "TPSAL" },
    { Nombre: "Ramalazo", Tuna: "TULP" },
    { Nombre: "Husky", Tuna: "TVLU" }
];

const COLORES_TUNA = {
    "TUO": "#179558",
    "TAUO": "#000000",
    "TFUO": "#37c0f7",
    "TUS": "#8b0a0a",
    "TIIG": "#8b0707",
    "TULE": "#0f9b2e",
    "CUBU": "#d11313",
    "TULP": "#d61a1a",
    "TVLU": "#10b935",
    "TVO": "#083988",
    "TMI": "#a167e0",
    "TFUSAL": "#4c0b0b",
    "TFMG": "#ffea00",
    "TPSAL": "#f5f50a",
    "TUSAL": "#620a0a",
    "TUPON": "#052681",
    "TDOU": "#d11313",
    "TFSANT": "#860f9b",
    "TMAGBU": "#cd2929",
};

let bID = 100;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Crear filas de formación
    for(let i=0; i<5; i++) añadirFila();
    
    // 2. Cargar tunos iniciales
    renderBolitas(TUNOS_PREDETERMINADOS);
    
    // 3. Setup de la zona de retorno (cajón)
    const cajon = document.getElementById('cajon-tunos');
    cajon.addEventListener('dragover', e => e.preventDefault());
    cajon.addEventListener('drop', dropToCajon);
});

function añadirFila() {
    const grid = document.getElementById('grid-formacion');
    const fila = document.createElement('div');
    fila.className = 'fila-tunos';
    for (let i = 0; i < 5; i++) {
        const hueco = document.createElement('div');
        hueco.className = 'hueco-tuno';
        hueco.addEventListener('dragover', e => e.preventDefault());
        hueco.addEventListener('drop', dropToHueco);
        fila.appendChild(hueco);
    }
    grid.appendChild(fila);
}

function renderBolitas(lista) {
    const container = document.getElementById('cajon-tunos');
    lista.forEach(t => {
        const color = COLORES_TUNA[t.Tuna] || "#444";
        const ball = document.createElement('div');
        ball.className = 'tuno-ball';
        ball.id = `tuno-b-${bID++}`;
        ball.draggable = true;
        ball.style.backgroundColor = color;
        if(t.Tuna === "Salamanca") ball.style.border = "2px solid #d4af37";
        
        // Guardamos datos en el elemento para el guardado de proyecto
        ball.dataset.nombre = t.Nombre;
        ball.dataset.tuna = t.Tuna;

        ball.innerHTML = `<span>${t.Nombre}<br><small style="font-size:0.5rem">${t.Tuna}</small></span>`;
        ball.addEventListener('dragstart', e => e.dataTransfer.setData('text', e.target.id));
        container.appendChild(ball);
    });
}

function dropToHueco(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    const element = document.getElementById(id);
    if (e.currentTarget.children.length === 0) {
        e.currentTarget.appendChild(element);
        // Quitamos los tamaños fijos para que el CSS mande
        element.style.width = "90%"; 
        element.style.height = "90%";
    }
}

function dropToCajon(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    const element = document.getElementById(id);
    document.getElementById('cajon-tunos').appendChild(element);
    // Volvemos al tamaño de bolita suelta
    element.style.width = "55px"; 
    element.style.height = "55px";
}

function añadirTunoManual() {
    const n = document.getElementById('m-nombre').value;
    const t = document.getElementById('m-tuna').value;
    if(!n) return;
    renderBolitas([{ Nombre: n, Tuna: t }]);
    document.getElementById('m-nombre').value = '';
}

function limpiarFormacion() {
    const cajon = document.getElementById('cajon-tunos');
    document.querySelectorAll('.hueco-tuno .tuno-ball').forEach(ball => {
        cajon.appendChild(ball);
        ball.style.width = "55px"; 
        ball.style.height = "55px";
    });
}

// PROYECTOS (JSON)
function exportarProyecto() {
    const filas = document.querySelectorAll('.fila-tunos');
    let proy = [];
    filas.forEach((f, fIdx) => {
        f.querySelectorAll('.hueco-tuno').forEach((h, hIdx) => {
            if(h.children.length > 0) {
                const b = h.children[0];
                proy.push({ f: fIdx, h: hIdx, n: b.dataset.nombre, t: b.dataset.tuna });
            }
        });
    });
    const blob = new Blob([JSON.stringify(proy)], {type: "application/json"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = "proyecto-madruga.json"; a.click();
}

function cargarProyecto(e) {
    const reader = new FileReader();
    reader.onload = (evt) => {
        limpiarFormacion();
        const data = JSON.parse(evt.target.result);
        const grid = document.getElementById('grid-formacion');
        data.forEach(item => {
            // Buscamos la bolita en el cajón (renderizamos si no existe)
            let ball = Array.from(document.querySelectorAll('.tuno-ball')).find(b => b.dataset.nombre === item.n);
            if(!ball) { renderBolitas([{Nombre: item.n, Tuna: item.t}]); ball = document.getElementById(`tuno-b-${bID-1}`); }
            
            const target = grid.children[item.f].children[item.h];
            target.appendChild(ball);
            ball.style.width = "100%"; ball.style.height = "100%";
        });
    };
    reader.readAsText(e.target.files[0]);
}

// EXCEL E IMAGEN
document.getElementById('excel-input').addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
        const wb = XLSX.read(new Uint8Array(evt.target.result), {type: 'array'});
        renderBolitas(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
    };
    reader.readAsArrayBuffer(e.target.files[0]);
});

function exportarImagen() {
    html2canvas(document.getElementById('area-de-captura'), { backgroundColor: "#1a1a1a" }).then(c => {
        const a = document.createElement('a');
        a.download = "Formacion-Oficial.png"; a.href = c.toDataURL(); a.click();
    });
}

// --- LÓGICA DE RESIZER MÓVIL ---
document.addEventListener('DOMContentLoaded', () => {
    const resizer = document.getElementById('resizer-v');
    const layout = document.getElementById('layout-contenedor');

    if (resizer) {
        resizer.addEventListener('touchstart', (e) => {
            document.addEventListener('touchmove', redimensionar);
            document.addEventListener('touchend', () => {
                document.removeEventListener('touchmove', redimensionar);
            });
        });
    }

    function redimensionar(e) {
        if (window.innerWidth > 900) return; // Solo actuar en móvil

        const touchY = e.touches[0].clientY;
        const layoutRect = layout.getBoundingClientRect();
        
        // Calculamos el porcentaje de altura para la zona superior
        let relativeY = touchY - layoutRect.top;
        let percentage = (relativeY / layoutRect.height) * 100;

        // Limitamos para que no se "rompa" el diseño (entre 20% y 80%)
        if (percentage > 20 && percentage < 80) {
            layout.style.gridTemplateRows = `${percentage}% 15px 1fr`;
        }
    }
});
