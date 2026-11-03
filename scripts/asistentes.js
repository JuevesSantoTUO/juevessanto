let todosLosTunosCenso = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarTunasAsistentes();
    cargarTunosCenso();
});

/* --- CARGA DINÁMICA DE TUNAS ASISTENTES DESDE SUPABASE --- */
async function cargarTunasAsistentes() {
    const container = document.getElementById('grid-tunas-container');
    if (!container) return;

    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        setTimeout(cargarTunasAsistentes, 200);
        return;
    }

    try {
        const { data: tunas, error } = await supabaseClient
            .from('tunas')
            .select('*')
            .eq('asistido', true)
            .order('orden', { ascending: true })
            .order('nombre', { ascending: true });

        if (error) throw error;

        if (!tunas || tunas.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #aaa; grid-column: 1 / -1;">No hay tunas registradas con asistencia actualmente.</p>';
            return;
        }

        container.innerHTML = tunas.map(t => {
            const escudo = (t.escudo_url && t.escudo_url.trim() !== '') ? t.escudo_url : 'img/escudos/pendiente.png';
            return `
                <div class="tuna-card">
                    <img src="${escudo}" alt="Escudo de ${t.nombre}" class="escudo-img" onerror="this.src='img/escudos/pendiente.png'">
                    <p>${t.nombre}</p>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Error al cargar tunas asistentes:", err);
        container.innerHTML = '<p style="text-align: center; color: #ff5555; grid-column: 1 / -1;">Error al obtener el listado de tunas.</p>';
    }
}

/* --- CARGA DINÁMICA E INTERACTIVA DE TUNOS (SISTEMA DE CRUCE ROBUSTO) --- */
async function cargarTunosCenso() {
    const tbody = document.getElementById('tabla-tunos-body');
    if (!tbody) return;

    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        setTimeout(cargarTunosCenso, 200);
        return;
    }

    try {
        // 1. Consultar perfiles registrados en Supabase
        const { data: profiles, error: errProf } = await supabaseClient
            .from('profiles')
            .select('id, mote, email, tuna_nombre, avatar_url');

        if (errProf) throw errProf;

        // 2. Obtener medallas asignadas por usuario
        const medallasPorUsuario = {};
        try {
            const { data: asignaciones } = await supabaseClient
                .from('usuarios_medallas')
                .select('user_id, medallas(nombre, imagen_url)');

            if (asignaciones) {
                asignaciones.forEach(a => {
                    if (!a.user_id) return;
                    if (!medallasPorUsuario[a.user_id]) medallasPorUsuario[a.user_id] = [];
                    if (a.medallas) medallasPorUsuario[a.user_id].push(a.medallas);
                });
            }
        } catch (eMedallas) {
            console.warn("No se pudieron obtener medallas de tunos:", eMedallas);
        }

        // 3. Mapear tunos registrados en Supabase
        const tunosRegistrados = (profiles || []).map(p => {
            const moteLimpio = p.mote ? p.mote.trim() : (p.email ? p.email.split('@')[0].trim() : 'Tuno');
            return {
                id: p.id,
                mote: moteLimpio,
                tuna: p.tuna_nombre || 'Tuna Universitaria',
                registrado: true,
                avatar: p.avatar_url,
                medallas: medallasPorUsuario[p.id] || []
            };
        });

        // 4. Censo tradicional histórico estático
        const tunosHistoricosBase = [
            { mote: "Gasol", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Baldomero", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Gordillo", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Pubis", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Rumbito", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Siseñor", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Lausín", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Brian", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Pirata", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Teclas", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Mamasita", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Severus", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Guisseppe", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Piñinos", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Baloo", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Moro", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Luisma", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Alcalino", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Vizcaino", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Chechu", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Tito", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Cueva", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Goofy", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Pincelín", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Nolopillo", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Sinpan", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Letizia", tuna: "Tuna Universitaria de Oviedo" },
            { mote: "Elvis", tuna: "Tuna Antigua de la Universidad de Oviedo" },
            { mote: "Berzas", tuna: "Tuna Antigua de la Universidad de Oviedo" },
            { mote: "Pascual", tuna: "Tuna Antigua de la Universidad de Oviedo" },
            { mote: "Gnomo", tuna: "Tuna Antigua de la Universidad de Oviedo" },
            { mote: "Huevato", tuna: "Tuna Antigua de la Universidad de Oviedo" },
            { mote: "Obelix", tuna: "Tuna Antigua de la Universidad de Oviedo" },
            { mote: "Lobo", tuna: "Tuna Antigua de la Universidad de Oviedo" },
            { mote: "Samsonite", tuna: "Tuna Antigua de la Universidad de Oviedo" },
            { mote: "Piños", tuna: "Tuna Antigua de la Universidad de Oviedo" },
            { mote: "Patxi", tuna: "Tuna Antigua de la Universidad de Oviedo" },
            { mote: "Salomón", tuna: "Tuna Antigua de la Universidad de Oviedo" },
            { mote: "Popeye", tuna: "Tuna Antigua de la Universidad de Oviedo" },
            { mote: "Seño", tuna: "Tuna Femenina de la Universidad de Oviedo" },
            { mote: "Sargento", tuna: "Tuna Femenina de la Universidad de Oviedo" },
            { mote: "Pelotari", tuna: "Tuna Femenina de la Universidad de Oviedo" },
            { mote: "Bizcochito", tuna: "Tuna Femenina de la Universidad de Oviedo" },
            { mote: "Terminator", tuna: "Tuna Femenina de la Universidad de Oviedo" },
            { mote: "Yoda", tuna: "Tuna Universitaria de Santander" },
            { mote: "Fusta", tuna: "Tuna Universitaria de Santander" },
            { mote: "Nena", tuna: "Tuna de la Universidad de León" },
            { mote: "Loco", tuna: "Tuna de la Universidad de León" },
            { mote: "Hoping", tuna: "Tuna de la Universidad de León" },
            { mote: "Jodor", tuna: "Tuna de la Universidad de León" },
            { mote: "Lázaro", tuna: "Tuna de la Universidad de León" },
            { mote: "Búho", tuna: "Cuarentuna Universitaria de Burgos" },
            { mote: "Boromir", tuna: "Tuna Universitaria de Las Palmas" },
            { mote: "Ramalazo", tuna: "Tuna Universitaria de Las Palmas" },
            { mote: "Husky", tuna: "Tuna de Veterinaria de Lugo" }
        ];

        // Función auxiliar para normalizar cadenas (quita tildes, espacios y convierte a minúsculas)
        const normalizar = text => text ? text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

        // Set con todos los identificadores de usuarios ya registrados
        const identificadoresRegistrados = new Set();
        tunosRegistrados.forEach(t => {
            if (t.mote) identificadoresRegistrados.add(normalizar(t.mote));
        });

        // Filtrar históricos excluyendo a cualquiera que coincida con un registrado
        const historicosFiltrados = tunosHistoricosBase
            .filter(h => !identificadoresRegistrados.has(normalizar(h.mote)))
            .map(h => ({ ...h, registrado: false, medallas: [] }));

        // Combinar ambas listas
        todosLosTunosCenso = [...tunosRegistrados, ...historicosFiltrados];
        todosLosTunosCenso.sort((a, b) => a.mote.localeCompare(b.mote));

        renderizarTablaTunosCenso(todosLosTunosCenso);

    } catch (err) {
        console.error("Error al cargar censo de tunos:", err);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #ff5555; padding: 25px;">Error al cargar el censo de tunos. Consulta la consola.</td></tr>';
    }
}

function renderizarTablaTunosCenso(lista) {
    const tbody = document.getElementById('tabla-tunos-body');
    if (!tbody) return;

    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #aaa; padding: 25px;">No se encontraron tunos.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(t => {
        let moteHTML = '';
        if (t.registrado) {
            moteHTML = `<button type="button" onclick="abrirModalPerfilPublico('${t.id}')" style="background:none; border:none; color:var(--color-acento); font-weight:bold; font-size:0.95rem; cursor:pointer; text-decoration:underline;">
                            ✨ ${t.mote}
                        </button>`;
        } else {
            const moteEscaped = t.mote.replace(/'/g, "\\'");
            moteHTML = `<div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                            <span style="color:#ddd; font-size:0.9rem;">${t.mote}</span>
                            <button type="button" onclick="reclamarPerfilTuno('${moteEscaped}', '${(t.tuna || '').replace(/'/g, "\\'")}')" style="background:none; border:none; color:var(--color-acento); font-size:0.72rem; cursor:pointer; text-decoration:underline; opacity:0.85;">
                                🙋‍♂️ ¿Eres tú? Reclama tu perfil
                            </button>
                        </div>`;
        }

        let medallasHTML = '-';
        if (t.medallas && t.medallas.length > 0) {
            medallasHTML = t.medallas.map(m => {
                if (m.imagen_url && m.imagen_url.trim() !== '') {
                    return `<img src="${m.imagen_url}" title="${m.nombre}" style="width:20px; height:20px; vertical-align:middle; margin:0 2px;">`;
                }
                return `<span title="${m.nombre}" style="font-size:0.9rem; margin:0 2px;">🏅</span>`;
            }).join('');
        }

        return `
            <tr>
                <td style="text-align: center;">${moteHTML}</td>
                <td class="tuna-origen-td" style="text-align: center; font-size: 0.85rem;">${t.tuna}</td>
                <td style="text-align: center;">${medallasHTML}</td>
            </tr>
        `;
    }).join('');
}

window.reclamarPerfilTuno = function(mote, tuna) {
    if (typeof window.abrirModalAuth === 'function') {
        window.abrirModalAuth('register');
        setTimeout(() => {
            const inputMote = document.getElementById('auth-mote');
            const inputTuna = document.getElementById('auth-tuna-search');
            if (inputMote) inputMote.value = mote;
            if (inputTuna && tuna) inputTuna.value = tuna;
        }, 100);
    } else {
        alert(`Para reclamar el perfil de "${mote}", por favor regístrate o inicia sesión en la plataforma.`);
    }
};

function filtrarTunosCenso() {
    const query = document.getElementById('buscar-tuno-input').value.toLowerCase().trim();
    if (!query) {
        renderizarTablaTunosCenso(todosLosTunosCenso);
        return;
    }

    const filtrados = todosLosTunosCenso.filter(t => 
        t.mote.toLowerCase().includes(query) || 
        t.tuna.toLowerCase().includes(query)
    );

    renderizarTablaTunosCenso(filtrados);
}

/* --- CONTROL DE PESTAÑAS (TUNAS VS TUNOS) --- */
function abrirPestaña(evento, pestañaNombre) {
    const paneles = document.getElementsByClassName("tab-pane");
    for (let i = 0; i < paneles.length; i++) {
        paneles[i].classList.remove("activo");
    }

    const botones = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < botones.length; i++) {
        botones[i].classList.remove("activo");
    }

    document.getElementById(pestañaNombre).classList.add("activo");
    evento.currentTarget.classList.add("activo");
}