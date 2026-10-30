/* ==========================================================================
   LÓGICA DEL PANEL DE ADMINISTRACIÓN (scripts/admin.js)
   ========================================================================== */

let currentUserRole = 'user';
let censoInscripcionesGlobal = [];
let noticiasGlobalesAdmin = [];
let tunasGlobalesAdmin = [];
let usuariosGlobalesAdmin = [];
let solicitudesGlobalesAdmin = [];
let quillEditor = null;
let idTunoAbiertoActual = null; // Variable para recordar qué acordeón estaba abierto

document.addEventListener('DOMContentLoaded', () => {
    verificarAccesoAdminPanel();
});

async function verificarAccesoAdminPanel() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        setTimeout(verificarAccesoAdminPanel, 150);
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session || !session.user) {
        alert("Acceso denegado: Debes iniciar sesión.");
        window.location.href = 'index.html';
        return;
    }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

    currentUserRole = profile ? profile.role : 'user';

    if (!['admin', 'gestor', 'editor'].includes(currentUserRole)) {
        alert("No tienes permisos suficientes para acceder al Panel de Control.");
        window.location.href = 'index.html';
        return;
    }

    const badge = document.getElementById('wp-user-badge');
    const emailDisplay = document.getElementById('wp-user-email');
    if (badge) badge.innerText = currentUserRole.toUpperCase();
    if (emailDisplay) emailDisplay.innerText = session.user.email;

    gestionarVisibilidadSegunRol(currentUserRole);
    cargarMetricasEscritorio();
    comprobarDenunciasPendientesBadge();
}

function gestionarVisibilidadSegunRol(role) {
    if (role !== 'admin') {
        const itemUsers = document.getElementById('menu-item-usuarios');
        if (itemUsers) itemUsers.style.display = 'none';
    }

    if (role === 'editor') {
        const itemIns = document.getElementById('menu-item-inscripciones');
        const itemTunas = document.getElementById('menu-item-tunas');
        const itemDenuncias = document.getElementById('menu-item-denuncias');
        const itemNews = document.getElementById('menu-item-newsletter');
        const itemVal = document.getElementById('menu-item-validaciones');
        
        const btnQuickIns = document.getElementById('btn-quick-inscripciones');
        if (btnQuickIns) btnQuickIns.style.display = 'none';

        if (itemIns) itemIns.style.display = 'none';
        if (itemTunas) itemTunas.style.display = 'none';
        if (itemDenuncias) itemDenuncias.style.display = 'none';
        if (itemNews) itemNews.style.display = 'none';
        if (itemVal) itemVal.style.display = 'none';
    }
}

window.cambiarSeccionAdmin = function(seccionId, elem) {
    if (currentUserRole === 'editor' && !['escritorio', 'blog'].includes(seccionId)) {
        alert("Acceso denegado: Tu rol de Editor solo permite gestionar el Blog.");
        return;
    }

    document.querySelectorAll('.wp-sidebar-menu li').forEach(li => li.classList.remove('active'));
    if (elem) elem.classList.add('active');

    document.querySelectorAll('.wp-admin-section').forEach(sec => sec.classList.remove('active'));
    const secTarget = document.getElementById(`sec-${seccionId}`);
    if (secTarget) secTarget.classList.add('active');

    switch (seccionId) {
        case 'escritorio':
            cargarMetricasEscritorio();
            break;
        case 'inscripciones':
            cargarTablaInscripcionesAdmin();
            break;
        case 'validaciones':
            cargarSolicitudesPendientesAdmin();
            break;
        case 'blog':
            cargarNoticiasAdmin();
            break;
        case 'tunas':
            cargarTunasAdmin();
            break;
        case 'usuarios':
            cargarUsuariosAdmin();
            break;
        case 'denuncias':
            cargarDenunciasAdmin();
            break;
        case 'newsletter':
            cargarMetricasNewsletter();
            break;
    }
};

async function cargarMetricasEscritorio() {
    if (!supabaseClient) return;

    let anioActivo = 2027;

    const { data: configData } = await supabaseClient.from('configuracion').select('*');
    if (configData) {
        const cfgAnio = configData.find(c => c.clave === 'anio_edicion');
        const cfgFecha = configData.find(c => c.clave === 'fecha_jueves_santo');

        if (cfgAnio && cfgAnio.valor) anioActivo = parseInt(cfgAnio.valor);

        const cardFecha = document.getElementById('card-config-fecha');
        if (cardFecha) {
            if (['admin', 'gestor'].includes(currentUserRole)) {
                cardFecha.style.display = 'block';
                document.getElementById('cfg-anio').value = anioActivo;
                if (cfgFecha && cfgFecha.valor) {
                    const d = new Date(cfgFecha.valor);
                    const formatISO = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                    document.getElementById('cfg-fecha-hora').value = formatISO;
                }
            } else {
                cardFecha.style.display = 'none';
            }
        }
    }

    const { data: inscritos, error } = await supabaseClient
        .from('inscripciones')
        .select('asiste_comida, asiste_ronda, asiste_madruga')
        .eq('anio', anioActivo);

    if (!error && inscritos) {
        document.getElementById('stat-total-inscritos').innerText = inscritos.length;
        document.getElementById('stat-total-comida').innerText = inscritos.filter(i => i.asiste_comida).length;
        document.getElementById('stat-total-ronda').innerText = inscritos.filter(i => i.asiste_ronda).length;
        document.getElementById('stat-total-madruga').innerText = inscritos.filter(i => i.asiste_madruga).length;
    }
}

window.guardarNuevaFechaJuevesSanto = async function(e) {
    e.preventDefault();
    const status = document.getElementById('cfg-fecha-status');
    status.innerText = "Guardando nueva configuración...";

    const anio = document.getElementById('cfg-anio').value;
    const fechaHora = document.getElementById('cfg-fecha-hora').value;

    const { error: err1 } = await supabaseClient.from('configuracion').upsert({ clave: 'anio_edicion', valor: String(anio) });
    const { error: err2 } = await supabaseClient.from('configuracion').upsert({ clave: 'fecha_jueves_santo', valor: new Date(fechaHora).toISOString() });

    if (err1 || err2) {
        status.innerText = "Error al actualizar la configuración.";
        status.style.color = "#ff4444";
    } else {
        status.innerText = "¡Configuración actualizada con éxito!";
        status.style.color = "#2ecc71";
        cargarMetricasEscritorio();
    }
};

async function cargarTablaInscripcionesAdmin() {
    if (!supabaseClient) return;
    const tbody = document.getElementById('tabla-admin-inscripciones-body');
    if (!tbody) return;

    let anioActivo = 2027;
    const { data: cfgAnio } = await supabaseClient.from('configuracion').select('valor').eq('clave', 'anio_edicion').maybeSingle();
    if (cfgAnio && cfgAnio.valor) anioActivo = parseInt(cfgAnio.valor);

    const labelAnio = document.getElementById('admin-anio-inscripciones');
    if (labelAnio) labelAnio.innerText = anioActivo;

    const { data, error } = await supabaseClient
        .from('inscripciones')
        .select('*')
        .eq('anio', anioActivo)
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#ff4444;">Error: ${error.message}</td></tr>`;
        return;
    }

    censoInscripcionesGlobal = data || [];
    renderizarFilasInscripciones(censoInscripcionesGlobal);
}

function renderizarFilasInscripciones(lista) {
    const tbody = document.getElementById('tabla-admin-inscripciones-body');
    if (!tbody) return;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 25px; color:#888;">No hay inscripciones registradas.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    lista.forEach(i => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="tuno-nombre-destacado">${i.nombre} ${i.apellidos}</span>
                ${i.mote ? `<span class="tuno-mote-tag">"${i.mote}"</span>` : ''}
            </td>
            <td><strong style="color:var(--color-acento); font-size:0.8rem;">${i.tuna_nombre || 'No especificada'}</strong></td>
            <td>
                <div style="font-size:0.75rem;">📞 ${i.telefono}</div>
                <div style="font-size:0.75rem; color:#aaa;">✉️ ${i.email}</div>
            </td>
            <td><span class="badge-asistencia ${i.asiste_comida ? 'si' : 'no'}">${i.asiste_comida ? 'SÍ' : 'NO'}</span></td>
            <td><span class="badge-asistencia ${i.asiste_ronda ? 'si' : 'no'}">${i.asiste_ronda ? 'SÍ' : 'NO'}</span></td>
            <td><span class="badge-asistencia ${i.asiste_madruga ? 'si' : 'no'}">${i.asiste_madruga ? 'SÍ' : 'NO'}</span></td>
            <td><strong>${i.instrumento}</strong></td>
            <td>${i.primer_anio ? '🌟 Novo' : 'Veterano'}</td>
            <td style="text-align: center;">
                <button class="btn-eliminar-ins" onclick="eliminarInscripcionAdmin('${i.id}', '${i.nombre}')" title="Eliminar registro">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.filtrarTablaInscripciones = function() {
    const search = document.getElementById('filter-ins-search').value.toLowerCase();
    const asistencia = document.getElementById('filter-ins-asistencia').value;
    const instrumento = document.getElementById('filter-ins-instrumento').value;

    const filtrados = censoInscripcionesGlobal.filter(i => {
        const textoMatch = (i.nombre + ' ' + i.apellidos + ' ' + (i.mote || '') + ' ' + i.tuna_nombre).toLowerCase().includes(search);
        let asistenciaMatch = true;
        if (asistencia === 'comida') asistenciaMatch = i.asiste_comida;
        if (asistencia === 'ronda') asistenciaMatch = i.asiste_ronda;
        if (asistencia === 'madruga') asistenciaMatch = i.asiste_madruga;

        let instMatch = true;
        if (instrumento !== 'todos') instMatch = (i.instrumento === instrumento);

        return textoMatch && asistenciaMatch && instMatch;
    });

    renderizarFilasInscripciones(filtrados);
};

window.eliminarInscripcionAdmin = async function(id, nombre) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la inscripción de ${nombre}?`)) return;

    const { error } = await supabaseClient.from('inscripciones').delete().eq('id', id);

    if (error) {
        alert("Error al eliminar registro: " + error.message);
    } else {
        alert("Inscripción eliminada correctamente.");
        await cargarTablaInscripcionesAdmin();
        await cargarMetricasEscritorio();
    }
};

window.exportarInscripcionesExcel = function() {
    if (!censoInscripcionesGlobal || censoInscripcionesGlobal.length === 0) {
        alert("No hay inscripciones para exportar.");
        return;
    }

    const anio = document.getElementById('admin-anio-inscripciones')?.innerText || '2027';
    const datosExcel = censoInscripcionesGlobal.map(i => ({
        "Nombre": i.nombre,
        "Apellidos": i.apellidos,
        "Mote / Apodo": i.mote || '',
        "Tuna / Agrupación": i.tuna_nombre || 'No especificada',
        "Teléfono": i.telefono,
        "Email": i.email,
        "Comida": i.asiste_comida ? 'SÍ' : 'NO',
        "Ronda": i.asiste_ronda ? 'SÍ' : 'NO',
        "Madrugá": i.asiste_madruga ? 'SÍ' : 'NO',
        "Instrumento": i.instrumento,
        "Novo / Debutante": i.primer_anio ? 'SÍ' : 'NO'
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Inscritos ${anio}`);
    XLSX.writeFile(workbook, `Censo_JuevesSanto_${anio}.xlsx`);
};

window.exportarInscripcionesCSV = function() {
    if (!censoInscripcionesGlobal || censoInscripcionesGlobal.length === 0) {
        alert("No hay inscripciones para exportar.");
        return;
    }

    const anio = document.getElementById('admin-anio-inscripciones')?.innerText || '2027';
    let csvContent = "\uFEFFNombre;Apellidos;Mote;Tuna;Telefono;Email;Comida;Ronda;Madruga;Instrumento;PrimerAnio\n";

    censoInscripcionesGlobal.forEach(i => {
        const row = [
            `"${i.nombre}"`, `"${i.apellidos}"`, `"${i.mote || ''}"`, `"${i.tuna_nombre || ''}"`,
            `"${i.telefono}"`, `"${i.email}"`, i.asiste_comida ? 'SI' : 'NO', i.asiste_ronda ? 'SI' : 'NO',
            i.asiste_madruga ? 'SI' : 'NO', `"${i.instrumento}"`, i.primer_anio ? 'SI' : 'NO'
        ].join(";");
        csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Censo_JuevesSanto_${anio}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/* --- MÓDULO DE VALIDACIÓN DE SOLICITUDES Y AÑOS HISTÓRICOS (ACORDEÓN PERSISTENTE) --- */
async function cargarSolicitudesPendientesAdmin() {
    if (!supabaseClient) return;
    const tbody = document.getElementById('tabla-admin-validaciones-body');
    if (!tbody) return;

    const { data, error } = await supabaseClient
        .from('inscripciones')
        .select('*')
        .order('anio', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ff4444;">Error: ${error.message}</td></tr>`;
        return;
    }

    solicitudesGlobalesAdmin = data || [];
    poblarSelectsFiltrosValidacion(solicitudesGlobalesAdmin);
    renderizarTablaValidacionesAgrupada(solicitudesGlobalesAdmin);
}

function poblarSelectsFiltrosValidacion(lista) {
    const selectAnio = document.getElementById('filter-val-anio');
    const selectTuna = document.getElementById('filter-val-tuna');
    if (!selectAnio || !selectTuna) return;

    const aniosUnicos = [...new Set(lista.map(i => i.anio))].sort((a,b) => b - a);
    const tunasUnicas = [...new Set(lista.map(i => i.tuna_nombre).filter(Boolean))].sort();

    const anioActualSel = selectAnio.value;
    const tunaActualSel = selectTuna.value;

    selectAnio.innerHTML = '<option value="todos">Todos los años</option>' + aniosUnicos.map(a => `<option value="${a}">${a}</option>`).join('');
    selectTuna.innerHTML = '<option value="todos">Todas las tunas</option>' + tunasUnicas.map(t => `<option value="${t}">${t}</option>`).join('');

    selectAnio.value = aniosUnicos.includes(parseInt(anioActualSel)) ? anioActualSel : 'todos';
    selectTuna.value = tunasUnicas.includes(tunaActualSel) ? tunaActualSel : 'todos';
}

window.filtrarValidacionesAdmin = function() {
    const texto = document.getElementById('filter-val-search').value.toLowerCase();
    const anioFiltro = document.getElementById('filter-val-anio').value;
    const tunaFiltro = document.getElementById('filter-val-tuna').value;
    const estadoFiltro = document.getElementById('filter-val-estado').value;

    const filtrados = solicitudesGlobalesAdmin.filter(i => {
        const matchTexto = (i.nombre + ' ' + i.apellidos + ' ' + (i.mote || '')).toLowerCase().includes(texto);
        const matchAnio = (anioFiltro === 'todos' || i.anio.toString() === anioFiltro);
        const matchTuna = (tunaFiltro === 'todos' || i.tuna_nombre === tunaFiltro);
        const matchEstado = (estadoFiltro === 'todos' || i.estado_validacion === estadoFiltro);

        return matchTexto && matchAnio && matchTuna && matchEstado;
    });

    renderizarTablaValidacionesAgrupada(filtrados);
};

function renderizarTablaValidacionesAgrupada(lista) {
    const tbody = document.getElementById('tabla-admin-validaciones-body');
    if (!tbody) return;

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px; color:#888;">No hay solicitudes que coincidan con los filtros.</td></tr>`;
        return;
    }

    const agrupadosPorTuno = {};
    lista.forEach(item => {
        const key = item.user_id || item.email;
        if (!agrupadosPorTuno[key]) {
            agrupadosPorTuno[key] = {
                nombre: item.nombre,
                apellidos: item.apellidos,
                mote: item.mote,
                tuna: item.tuna_nombre,
                registros: []
            };
        }
        agrupadosPorTuno[key].registros.push(item);
    });

    tbody.innerHTML = '';

    Object.keys(agrupadosPorTuno).forEach((key, index) => {
        const grupo = agrupadosPorTuno[key];
        grupo.registros.sort((a, b) => b.anio - a.anio);

        const masReciente = grupo.registros[0];
        const tienePendientes = grupo.registros.some(r => r.estado_validacion === 'pendiente');
        
        const badgePendienteAlerta = tienePendientes 
            ? `<span title="Tiene años pendientes de revisar" style="background:#ff4444; width:10px; height:10px; border-radius:50%; display:inline-block; margin-left:8px; vertical-align:middle;"></span>` 
            : '';

        const estadoBadge = masReciente.estado_validacion === 'validado' 
            ? '<span class="badge-asistencia si">VALIDADO</span>' 
            : (masReciente.estado_validacion === 'rechazado' ? '<span class="badge-asistencia no">RECHAZADO</span>' : '<span class="badge-asistencia" style="background:rgba(255,170,0,0.15); color:#ffaa00; border:1px solid #ffaa00;">PENDIENTE</span>');

        const idFilaDetalle = `tuno-detalles-${index}`;
        const trPrincipal = document.createElement('tr');
        trPrincipal.style.cursor = 'pointer';
        trPrincipal.setAttribute('onclick', `toggleDesplegableTuno('${idFilaDetalle}', '${key}')`);
        trPrincipal.innerHTML = `
            <td>
                <span class="tuno-nombre-destacado">${grupo.nombre} ${grupo.apellidos}</span>
                ${grupo.mote ? `<span class="tuno-mote-tag">"${grupo.mote}"</span>` : ''}
                ${badgePendienteAlerta}
            </td>
            <td><strong>${masReciente.anio}</strong> <span style="font-size:0.75rem; color:#aaa;">(${grupo.registros.length} años reg.)</span></td>
            <td>${grupo.tuna || 'No especificada'}</td>
            <td>${masReciente.instrumento}</td>
            <td>${estadoBadge}</td>
            <td style="text-align: center;">
                <button class="btn-export-ui excel" style="padding: 4px 10px; font-size:0.75rem;">📂 Ver Historial (${grupo.registros.length})</button>
            </td>
        `;
        tbody.appendChild(trPrincipal);

        const trDetalle = document.createElement('tr');
        trDetalle.id = idFilaDetalle;
        // Si este tuno era el que estaba abierto antes de actualizar, lo mantenemos abierto
        if (idTunoAbiertoActual === key) {
            trDetalle.style.display = 'table-row';
        } else {
            trDetalle.style.display = 'none';
        }
        trDetalle.style.background = 'rgba(212,175,55,0.03)';
        
        let detalleHTML = `
            <td colspan="6" style="padding: 15px 25px;">
                <div style="font-size: 0.85rem; font-weight: bold; color: var(--color-acento); margin-bottom: 10px;">📜 Historial completo de solicitudes para ${grupo.nombre} "${grupo.mote || ''}":</div>
                <table style="width: 100%; border-collapse: collapse; background: rgba(0,0,0,0.4); border-radius: 6px; overflow: hidden;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(212,175,55,0.2); font-size: 0.75rem; color: #aaa;">
                            <th style="padding: 8px 12px; text-align:left;">Año</th>
                            <th style="padding: 8px 12px; text-align:left;">Tuna</th>
                            <th style="padding: 8px 12px; text-align:left;">Instrumento</th>
                            <th style="padding: 8px 12px; text-align:left;">Estado</th>
                            <th style="padding: 8px 12px; text-align:center;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        grupo.registros.forEach(reg => {
            const badgeAnioEstado = reg.estado_validacion === 'validado' 
                ? '<span style="color:#2ecc71; font-weight:bold; font-size:0.75rem;">VALIDADO</span>' 
                : (reg.estado_validacion === 'rechazado' ? '<span style="color:#ff4444; font-weight:bold; font-size:0.75rem;">RECHAZADO</span>' : '<span style="color:#ffaa00; font-weight:bold; font-size:0.75rem;">PENDIENTE</span>');

            detalleHTML += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 12px;"><strong>${reg.anio}</strong></td>
                    <td style="padding: 8px 12px; font-size:0.8rem;">${reg.tuna_nombre}</td>
                    <td style="padding: 8px 12px; font-size:0.8rem;">${reg.instrumento}</td>
                    <td style="padding: 8px 12px;">${badgeAnioEstado}</td>
                    <td style="padding: 8px 12px; text-align: center;">
                        <button class="btn-export-ui excel" style="padding: 2px 6px; font-size:0.7rem;" onclick="event.stopPropagation(); cambiarEstadoValidacion('${reg.id}', 'validado', '${key}')">✅ Aprobar</button>
                        <button class="btn-eliminar-ins" style="padding: 2px 6px; font-size:0.7rem;" onclick="event.stopPropagation(); cambiarEstadoValidacion('${reg.id}', 'rechazado', '${key}')">❌ Rechazar</button>
                    </td>
                </tr>
            `;
        });

        detalleHTML += `
                    </tbody>
                </table>
            </td>
        `;
        trDetalle.innerHTML = detalleHTML;
        tbody.appendChild(trDetalle);
    });
}

window.toggleDesplegableTuno = function(idFila, tunoKey) {
    const fila = document.getElementById(idFila);
    if (fila) {
        if (fila.style.display === 'none' || fila.style.display === '') {
            fila.style.display = 'table-row';
            idTunoAbiertoActual = tunoKey; // Guardamos que este tuno está abierto
        } else {
            fila.style.display = 'none';
            if (idTunoAbiertoActual === tunoKey) idTunoAbiertoActual = null; // Si se cierra, limpiamos
        }
    }
};

window.cambiarEstadoValidacion = async function(idInscripcion, nuevoEstado, tunoKeyContexto = null) {
    if (tunoKeyContexto) {
        idTunoAbiertoActual = tunoKeyContexto; // Memorizamos qué acordeón debe seguir abierto al refrescar
    }

    const confirma = (nuevoEstado === 'validado');
    const { error } = await supabaseClient.rpc('actualizar_estado_inscripcion', {
        row_id: idInscripcion,
        nuevo_estado: nuevoEstado,
        confirma: confirma
    });

    if (error) {
        alert("Error al actualizar estado: " + error.message);
        console.error("RPC Error:", error);
    } else {
        await cargarSolicitudesPendientesAdmin();
    }
};

/* --- GESTIÓN DE BLOG, TUNAS Y USUARIOS (INALTERADO) --- */
function inicializarEditorQuill() {
    if (quillEditor || !document.getElementById('editor-quill-container')) return;
    quillEditor = new Quill('#editor-quill-container', {
        theme: 'snow',
        placeholder: 'Redacta aquí el artículo maquetado...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'align': [] }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['blockquote', 'code-block'],
                ['link', 'clean']
            ]
        }
    });
}

window.alternarModoEditorBlog = function(modo) {
    const wrapQuill = document.getElementById('wrapper-editor-quill');
    const wrapRumbi = document.getElementById('wrapper-editor-rumbi');

    if (modo === 'rumbi') {
        if (wrapQuill) wrapQuill.style.display = 'none';
        if (wrapRumbi) wrapRumbi.style.display = 'block';
        if (typeof window.inicializarRumbiEditor === 'function') window.inicializarRumbiEditor();
    } else {
        if (wrapQuill) wrapQuill.style.display = 'block';
        if (wrapRumbi) wrapRumbi.style.display = 'none';
        inicializarEditorQuill();
    }
};

async function cargarNoticiasAdmin() {
    if (!supabaseClient) return;
    const tbody = document.getElementById('tabla-admin-blog-body');
    if (!tbody) return;

    const { data, error } = await supabaseClient.from('blog').select('*').order('created_at', { ascending: false });
    if (error) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ff4444;">Error: ${error.message}</td></tr>`; return; }

    noticiasGlobalesAdmin = data || [];
    renderizarTablaBlogAdmin(noticiasGlobalesAdmin);
}

function renderizarTablaBlogAdmin(lista) {
    const tbody = document.getElementById('tabla-admin-blog-body');
    if (!tbody) return;

    if (lista.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 25px; color:#888;">No hay artículos.</td></tr>`; return; }

    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        const fecha = new Date(item.created_at).toLocaleDateString('es-ES');
        tr.innerHTML = `
            <td><span class="noticia-badge-cat">${item.categoria || 'General'}</span><div class="tuno-nombre-destacado">${item.titulo}</div></td>
            <td>${item.es_privado ? 'Privada' : 'Pública'}</td>
            <td>${item.autor}</td>
            <td><span class="badge-asistencia ${item.estado === 'publicado' ? 'si' : 'no'}">${item.estado.toUpperCase()}</span></td>
            <td>${fecha}</td>
            <td style="text-align: center;">
                <button class="btn-export-ui csv" style="padding: 4px 8px;" onclick="editarNoticiaAdmin('${item.id}')">✏️ Editar</button>
                <button class="btn-eliminar-ins" onclick="eliminarNoticiaAdmin('${item.id}', '${item.titulo}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.abrirFormularioNoticia = function() {
    document.getElementById('form-blog').reset();
    document.getElementById('blog-id').value = '';
    document.getElementById('editor-blog-titulo').innerText = "Redactar Nueva Noticia";
    document.getElementById('box-editor-blog').style.display = 'block';
    window.alternarModoEditorBlog('quill');
    if (quillEditor) quillEditor.setText('');
};

window.cerrarFormularioNoticia = function() { document.getElementById('box-editor-blog').style.display = 'none'; };

window.editarNoticiaAdmin = function(id) {
    const noticia = noticiasGlobalesAdmin.find(n => n.id === id);
    if (!noticia) return;

    // Rellenar campos del formulario
    document.getElementById('blog-id').value = noticia.id;
    document.getElementById('blog-titulo-input').value = noticia.titulo || '';
    document.getElementById('blog-imagen-input').value = noticia.imagen_url || '';
    document.getElementById('blog-categoria-select').value = noticia.categoria || 'General';
    
    // Cargar etiquetas separadas por comas
    const etiquetasInput = document.getElementById('blog-etiquetas-input');
    if (etiquetasInput) {
        etiquetasInput.value = Array.isArray(noticia.etiquetas) ? noticia.etiquetas.join(', ') : '';
    }

    document.getElementById('blog-autor-input').value = noticia.autor || 'Redacción Jueves Santo';
    document.getElementById('blog-estado-select').value = noticia.estado || 'borrador';
    
    // Estados de privacidad y restricción
    const chkPrivado = document.getElementById('blog-check-privado');
    const chkRestringido = document.getElementById('blog-check-restringido');
    if (chkPrivado) chkPrivado.checked = noticia.es_privado || false;
    if (chkRestringido) chkRestringido.checked = noticia.es_restringido || false;

    document.getElementById('blog-resumen-input').value = noticia.resumen || '';
    
    // Mostrar el panel de edición
    document.getElementById('box-editor-blog').style.display = 'block';

    // Manejo del contenido según el tipo de editor
    const tipoEditorSelect = document.getElementById('blog-modo-editor');
    
    if (noticia.tipo_editor === 'rumbi' && typeof window.cargarDatosRumbiEditor === 'function') {
        if (tipoEditorSelect) tipoEditorSelect.value = 'rumbi';
        alternarModoEditorBlog('rumbi');
        window.cargarDatosRumbiEditor(noticia.bloques_json);
    } else {
        if (tipoEditorSelect) tipoEditorSelect.value = 'quill';
        alternarModoEditorBlog('quill');
        
        // CORRECCIÓN CLAVE: Asegurar que Quill inyecte el contenido de forma segura
        let contenidoHtml = noticia.contenido || '';
        if (contenidoHtml === 'EMPTY') {
            contenidoHtml = ''; // Si venía como texto "EMPTY", lo dejamos limpio para redactar
        }

        // Damos un pequeño respiro para que el DOM pinte el editor Quill
        setTimeout(() => {
            if (quillEditor) {
                quillEditor.root.innerHTML = contenidoHtml;
            } else {
                // Fallback por si la instancia tardó más en crearse
                const inputOculto = document.getElementById('blog-contenido-input');
                if (inputOculto) inputOculto.value = contenidoHtml;
            }
        }, 150);
    }
};

window.guardarNoticiaAdmin = async function(e) {
    e.preventDefault();
    const status = document.getElementById('blog-form-status');
    status.innerText = "Guardando noticia...";
    const id = document.getElementById('blog-id').value;
    const titulo = document.getElementById('blog-titulo-input').value.trim();
    const slug = titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const payload = {
        titulo, slug,
        categoria: document.getElementById('blog-categoria-select').value,
        imagen_url: document.getElementById('blog-imagen-input').value.trim() || null,
        autor: document.getElementById('blog-autor-input').value.trim() || 'Redacción',
        estado: document.getElementById('blog-estado-select').value,
        es_privado: document.getElementById('blog-check-privado').checked,
        es_restringido: document.getElementById('blog-check-restringido').checked,
        resumen: document.getElementById('blog-resumen-input').value.trim(),
        contenido: quillEditor ? quillEditor.root.innerHTML : '',
        updated_at: new Date()
    };

    let error = id ? (await supabaseClient.from('blog').update(payload).eq('id', id)).error : (await supabaseClient.from('blog').insert([payload])).error;
    if (error) { status.innerText = "Error: " + error.message; }
    else { cerrarFormularioNoticia(); cargarNoticiasAdmin(); }
};

window.eliminarNoticiaAdmin = async function(id) {
    if (!confirm("¿Eliminar artículo?")) return;
    await supabaseClient.from('blog').delete().eq('id', id);
    cargarNoticiasAdmin();
};

async function cargarTunasAdmin() {
    if (!supabaseClient) return;
    const { data } = await supabaseClient.from('tunas').select('*').order('nombre');
    tunasGlobalesAdmin = data || [];
    const tbody = document.getElementById('tabla-admin-tunas-body');
    if (!tbody) return;
    tbody.innerHTML = tunasGlobalesAdmin.map(t => `
        <tr><td>${t.nombre}</td><td>${t.ciudad || ''}</td><td style="text-align:center;"><button class="btn-eliminar-ins" onclick="eliminarTunaAdmin('${t.id}')">🗑️</button></td></tr>
    `).join('');
}

window.eliminarTunaAdmin = async function(id) {
    if (!confirm("¿Eliminar tuna?")) return;
    await supabaseClient.from('tunas').delete().eq('id', id);
    cargarTunasAdmin();
};

async function cargarUsuariosAdmin() {
    if (!supabaseClient) return;
    const { data } = await supabaseClient.from('profiles').select('*');
    usuariosGlobalesAdmin = data || [];
    const tbody = document.getElementById('tabla-admin-usuarios-body');
    if (!tbody) return;
    tbody.innerHTML = usuariosGlobalesAdmin.map(u => `
        <tr><td>${u.email}</td><td>${u.role}</td><td style="text-align:center;"><button class="btn-eliminar-ins" onclick="eliminarUsuarioLOPD('${u.id}', '${u.email}')">Borrar LOPD</button></td></tr>
    `).join('');
}

window.eliminarUsuarioLOPD = async function(userId, email) {
    if (!confirm(`¿Borrar definitivamente a ${email}?`)) return;
    await supabaseClient.rpc('delete_user_cascade', { target_user_id: userId });
    cargarUsuariosAdmin();
};

async function comprobarDenunciasPendientesBadge() {
    if (!supabaseClient) return;
    const { data } = await supabaseClient.from('blog_denuncias').select('id').eq('estado', 'pendiente');
    badge = document.getElementById('badge-count-denuncias');
    if (badge && data && data.length > 0) { badge.innerText = data.length; badge.style.display = 'inline-block'; }
    else if (badge) { badge.style.display = 'none'; }
}

async function cargarDenunciasAdmin() {
    const tbody = document.getElementById('tabla-admin-denuncias-body');
    if (!tbody) return;
    const { data } = await supabaseClient.from('blog_denuncias').select('*, blog_comentarios(comentario, nombre_usuario)').eq('estado', 'pendiente');
    tbody.innerHTML = (!data || data.length === 0) ? '<tr><td colspan="5" style="text-align:center;">No hay denuncias.</td></tr>' : data.map(d => `
        <tr><td>${d.blog_comentarios?.nombre_usuario}</td><td>"${d.blog_comentarios?.comentario}"</td><td>${d.motivo}</td><td><button onclick="desestimarDenunciaAdmin('${d.id}')">Dismiss</button></td></tr>
    `).join('');
}

window.desestimarDenunciaAdmin = async function(id) {
    await supabaseClient.from('blog_denuncias').update({ estado: 'desestimada' }).eq('id', id);
    cargarDenunciasAdmin();
};

async function cargarMetricasNewsletter() {
    const elActivos = document.getElementById('stat-newsletter-activos');
    if (elActivos) elActivos.innerText = "0";
}