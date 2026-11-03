/* ==========================================================================
   LÓGICA DEL PANEL DE ADMINISTRACIÓN (scripts/admin.js)
   ========================================================================== */

let currentUserRole = 'user';
let censoInscripcionesGlobal = [];
let noticiasGlobalesAdmin = [];
let tunasGlobalesAdmin = [];
let usuariosGlobalesAdmin = [];
let solicitudesGlobalesAdmin = [];
let medallasGlobalesAdmin = [];
let listaTunosPredictiva = [];
let quillEditor = null;
let idTunoAbiertoActual = null;
let listaCorreosSegmentoActual = [];

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
        const itemMed = document.getElementById('menu-item-medallas');
        
        const btnQuickIns = document.getElementById('btn-quick-inscripciones');
        if (btnQuickIns) btnQuickIns.style.display = 'none';

        if (itemIns) itemIns.style.display = 'none';
        if (itemTunas) itemTunas.style.display = 'none';
        if (itemDenuncias) itemDenuncias.style.display = 'none';
        if (itemNews) itemNews.style.display = 'none';
        if (itemVal) itemVal.style.display = 'none';
        if (itemMed) itemMed.style.display = 'none';
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
        case 'medallas':
            cargarModuloMedallasAdmin();
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

/* --- MÓDULO DE VALIDACIÓN DE SOLICITUDES Y AÑOS HISTÓRICOS --- */
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
                userId: item.user_id,
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
                        <button class="btn-export-ui excel" style="padding: 2px 6px; font-size:0.7rem;" onclick="event.stopPropagation(); cambiarEstadoValidacion('${reg.id}', 'validado', '${key}', '${reg.user_id}')">✅ Aprobar</button>
                        <button class="btn-eliminar-ins" style="padding: 2px 6px; font-size:0.7rem;" onclick="event.stopPropagation(); cambiarEstadoValidacion('${reg.id}', 'rechazado', '${key}', '${reg.user_id}')">❌ Rechazar</button>
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
            idTunoAbiertoActual = tunoKey;
        } else {
            fila.style.display = 'none';
            if (idTunoAbiertoActual === tunoKey) idTunoAbiertoActual = null;
        }
    }
};

window.cambiarEstadoValidacion = async function(idInscripcion, nuevoEstado, tunoKeyContexto = null, userIdContexto = null) {
    if (tunoKeyContexto) {
        idTunoAbiertoActual = tunoKeyContexto;
    }

    const confirma = (nuevoEstado === 'validado');
    const { error } = await supabaseClient.rpc('actualizar_estado_inscripcion', {
        row_id: idInscripcion,
        nuevo_estado: nuevoEstado,
        confirma: confirma
    });

    if (error) {
        alert("Error al actualizar estado: " + error.message);
    } else {
        if (userIdContexto && userIdContexto !== 'null') {
            await supabaseClient.rpc('recalcular_medallas_usuario', { p_user_id: userIdContexto });
        }
        await cargarSolicitudesPendientesAdmin();
    }
};

/* --- MÓDULO DE GESTIÓN Y EDICIÓN DE MEDALLAS (BUSCADOR PREDICTIVO Y EDICIÓN) --- */
async function cargarModuloMedallasAdmin() {
    if (!supabaseClient) return;

    // 1. Cargar Catálogo de Medallas
    const { data: medallas } = await supabaseClient
        .from('medallas')
        .select('*')
        .order('created_at', { ascending: true });
        
    medallasGlobalesAdmin = medallas || [];
    renderizarTablaMedallasAdmin(medallasGlobalesAdmin);

    // 2. Cargar lista de usuarios en memoria para el buscador predictivo
    const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('id, mote, email')
        .order('mote', { ascending: true });

    listaTunosPredictiva = profiles || [];

    // 3. Cargar catálogo de medallas para el desplegable de asignación
    const selectMed = document.getElementById('asig-medalla-select');
    if (selectMed) {
        if (medallasGlobalesAdmin.length > 0) {
            selectMed.innerHTML = '<option value="">Selecciona medalla...</option>' + medallasGlobalesAdmin.map(m => `
                <option value="${m.id}">${m.nombre} (${m.es_automatica ? 'Auto' : 'Manual'})</option>
            `).join('');
        } else {
            selectMed.innerHTML = '<option value="">No hay medallas creadas</option>';
        }
    }
}

// BUSCADOR PREDICTIVO EN TIEMPO REAL
window.filtrarTunosPredictivo = function(texto) {
    const box = document.getElementById('asig-tuno-results');
    const inputHidden = document.getElementById('asig-tuno-selected-id');
    if (!box) return;

    inputHidden.value = '';
    const q = texto.toLowerCase().trim();

    if (q.length === 0) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }

    const coincidentes = listaTunosPredictiva.filter(p => {
        const moteMatch = p.mote && p.mote.toLowerCase().includes(q);
        const emailMatch = p.email && p.email.toLowerCase().includes(q);
        return moteMatch || emailMatch;
    });

    if (coincidentes.length === 0) {
        box.innerHTML = '<div style="padding: 10px; color: #888; font-size: 0.8rem;">No se encontraron tunos</div>';
    } else {
        box.innerHTML = coincidentes.map(p => `
            <div onclick="seleccionarTunoPredictivo('${p.id}', '${(p.mote || '').replace(/'/g, "\\'")}', '${p.email}')" 
                 style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #333; font-size: 0.85rem; color: #fff;">
                <strong style="color: var(--color-acento);">${p.mote ? `"${p.mote}"` : 'Sin mote'}</strong> 
                <span style="color: #aaa; font-size: 0.75rem;">(${p.email})</span>
            </div>
        `).join('');
    }

    box.style.display = 'block';
};

window.seleccionarTunoPredictivo = function(id, mote, email) {
    document.getElementById('asig-tuno-selected-id').value = id;
    document.getElementById('asig-tuno-search').value = mote ? `"${mote}" (${email})` : email;
    document.getElementById('asig-tuno-results').style.display = 'none';
};

document.addEventListener('click', (e) => {
    const box = document.getElementById('asig-tuno-results');
    const input = document.getElementById('asig-tuno-search');
    if (box && e.target !== input && !box.contains(e.target)) {
        box.style.display = 'none';
    }
});

// ASIGNACIÓN MANUAL
window.asignarMedallaManualAdmin = async function(e) {
    e.preventDefault();
    const status = document.getElementById('asig-medalla-status');
    const userId = document.getElementById('asig-tuno-selected-id').value;
    const medallaId = document.getElementById('asig-medalla-select').value;
    const anio = parseInt(document.getElementById('asig-anio-input').value);

    if (!userId) {
        status.innerText = "Selecciona un tuno del buscador predictivo.";
        status.style.color = "#ff4444";
        return;
    }

    status.innerText = "Asignando medalla...";
    status.style.color = "#ffaa00";

    const { error } = await supabaseClient.from('usuarios_medallas').insert([{
        user_id: userId,
        medalla_id: medallaId,
        anio_conseguido: anio
    }]);

    if (error) {
        status.innerText = (error.code === '23505') ? "Este tuno ya posee esa medalla." : "Error: " + error.message;
        status.style.color = "#ff4444";
    } else {
        status.innerText = "¡Medalla asignada correctamente!";
        status.style.color = "#2ecc71";
        document.getElementById('asig-tuno-search').value = '';
        document.getElementById('asig-tuno-selected-id').value = '';
        setTimeout(() => { status.innerText = ''; }, 3000);
    }
};

// RENDERIZADO DE TABLA DE MEDALLAS CON BOTÓN DE EDICIÓN
function renderizarTablaMedallasAdmin(lista) {
    const tbody = document.getElementById('tabla-admin-medallas-body');
    if (!tbody) return;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #888;">No hay medallas registradas.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(m => {
        const imgTag = (m.imagen_url && m.imagen_url.trim() !== '') 
            ? `<img src="${m.imagen_url}" alt="${m.nombre}" style="width: 32px; height: 32px; object-fit: contain;">` 
            : `<span style="font-size: 1.2rem;" title="Sin imagen asignada">🎖️</span>`;

        return `
            <tr>
                <td style="text-align: center;">${imgTag}</td>
                <td><strong>${m.nombre}</strong></td>
                <td><span style="font-size:0.8rem; color:#ccc;">${m.descripcion || '-'}</span></td>
                <td>${m.es_automatica ? `<span class="badge-asistencia si">Auto (${m.criterio_asistencias} asist.)</span>` : '<span class="badge-asistencia" style="background:rgba(212,175,55,0.2); color:var(--color-acento);">Manual</span>'}</td>
                <td style="text-align: center;">
                    <button class="btn-export-ui csv" style="padding: 3px 8px; font-size: 0.75rem;" onclick="editarMedallaAdmin('${m.id}')">✏️ Editar</button>
                    <button class="btn-eliminar-ins" style="padding: 3px 8px; font-size: 0.75rem;" onclick="eliminarMedallaAdmin('${m.id}', '${m.nombre}')">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

window.editarMedallaAdmin = function(id) {
    const m = medallasGlobalesAdmin.find(item => item.id === id);
    if (!m) return;

    document.getElementById('medalla-id-input').value = m.id;
    document.getElementById('medalla-nombre').value = m.nombre || '';
    document.getElementById('medalla-descripcion').value = m.descripcion || '';
    document.getElementById('medalla-url-input').value = m.imagen_url || '';
    document.getElementById('medalla-file-input').value = '';
    document.getElementById('medalla-es-auto').value = m.es_automatica ? 'true' : 'false';
    document.getElementById('medalla-criterio-num').value = m.criterio_asistencias || 0;

    toggleCriterioAutoMedalla(m.es_automatica ? 'true' : 'false');
    document.getElementById('modal-medalla-titulo').innerText = "Editar Medalla";
    document.getElementById('box-crear-medalla').style.display = 'block';
};

window.abrirModalNuevaMedalla = function() {
    document.getElementById('medalla-id-input').value = '';
    document.getElementById('medalla-nombre').value = '';
    document.getElementById('medalla-descripcion').value = '';
    document.getElementById('medalla-url-input').value = '';
    document.getElementById('medalla-file-input').value = '';
    document.getElementById('medalla-es-auto').value = 'false';
    toggleCriterioAutoMedalla('false');
    
    document.getElementById('modal-medalla-titulo').innerText = "Crear Nueva Medalla";
    document.getElementById('box-crear-medalla').style.display = 'block';
};

window.cerrarModalMedalla = function() {
    document.getElementById('box-crear-medalla').style.display = 'none';
};

window.toggleCriterioAutoMedalla = function(val) {
    const grp = document.getElementById('group-criterio-auto');
    if (grp) grp.style.display = (val === 'true') ? 'block' : 'none';
};

window.guardarMedallaAdmin = async function(e) {
    e.preventDefault();
    const status = document.getElementById('medalla-status');
    status.innerText = "Guardando medalla...";

    const medallaId = document.getElementById('medalla-id-input').value;
    const nombre = document.getElementById('medalla-nombre').value.trim();
    const descripcion = document.getElementById('medalla-descripcion').value.trim();
    const esAuto = document.getElementById('medalla-es-auto').value === 'true';
    const criterioNum = parseInt(document.getElementById('medalla-criterio-num').value) || 0;

    const fileInput = document.getElementById('medalla-file-input');
    let urlImagen = document.getElementById('medalla-url-input').value.trim();

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileName = `medalla_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { error: uploadError } = await supabaseClient.storage.from('medallas').upload(fileName, file);

        if (uploadError) {
            status.innerText = "Error al subir la imagen: " + uploadError.message;
            return;
        }

        const { data: { publicUrl } } = supabaseClient.storage.from('medallas').getPublicUrl(fileName);
        urlImagen = publicUrl;
    }

    const payload = {
        nombre: nombre,
        descripcion: descripcion,
        imagen_url: urlImagen || '',
        es_automatica: esAuto,
        criterio_asistencias: esAuto ? criterioNum : 0
    };

    let error;
    if (medallaId) {
        ({ error } = await supabaseClient.from('medallas').update(payload).eq('id', medallaId));
    } else {
        ({ error } = await supabaseClient.from('medallas').insert([payload]));
    }

    if (error) {
        status.innerText = "Error: " + error.message;
    } else {
        status.innerText = "¡Medalla guardada correctamente!";
        cerrarModalMedalla();
        cargarModuloMedallasAdmin();
    }
};

window.eliminarMedallaAdmin = async function(medallaId, nombre) {
    if (!confirm(`¿Eliminar la medalla "${nombre}" del catálogo?`)) return;
    await supabaseClient.from('medallas').delete().eq('id', medallaId);
    cargarModuloMedallasAdmin();
};

/* --- GESTIÓN DE BLOG Y NOTICIAS --- */
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
            <td>${Array.isArray(item.etiquetas) ? item.etiquetas.join(', ') : ''}</td>
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

    document.getElementById('blog-id').value = noticia.id;
    document.getElementById('blog-titulo-input').value = noticia.titulo || '';
    document.getElementById('blog-imagen-input').value = noticia.imagen_url || '';
    document.getElementById('blog-categoria-select').value = noticia.categoria || 'General';
    
    const etiquetasInput = document.getElementById('blog-etiquetas-input');
    if (etiquetasInput) {
        etiquetasInput.value = Array.isArray(noticia.etiquetas) ? noticia.etiquetas.join(', ') : '';
    }

    document.getElementById('blog-autor-input').value = noticia.autor || 'Redacción Jueves Santo';
    document.getElementById('blog-estado-select').value = noticia.estado || 'borrador';
    
    const chkPrivado = document.getElementById('blog-check-privado');
    const chkRestringido = document.getElementById('blog-check-restringido');
    if (chkPrivado) chkPrivado.checked = noticia.es_privado || false;
    if (chkRestringido) chkRestringido.checked = noticia.es_restringido || false;

    document.getElementById('blog-resumen-input').value = noticia.resumen || '';
    
    document.getElementById('box-editor-blog').style.display = 'block';

    const tipoEditorSelect = document.getElementById('blog-modo-editor');
    
    if (noticia.tipo_editor === 'rumbi' && typeof window.cargarDatosRumbiEditor === 'function') {
        if (tipoEditorSelect) tipoEditorSelect.value = 'rumbi';
        alternarModoEditorBlog('rumbi');
        window.cargarDatosRumbiEditor(noticia.bloques_json);
    } else {
        if (tipoEditorSelect) tipoEditorSelect.value = 'quill';
        alternarModoEditorBlog('quill');
        
        let contenidoHtml = noticia.contenido || '';
        if (contenidoHtml === 'EMPTY') {
            contenidoHtml = '';
        }

        setTimeout(() => {
            if (quillEditor) {
                quillEditor.root.innerHTML = contenidoHtml;
            } else {
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

/* --- MÓDULO DE GESTIÓN DE TUNAS Y CENSO (ACTUALIZADO) --- */
async function cargarTunasAdmin() {
    if (!supabaseClient) return;
    
    const { data, error } = await supabaseClient
        .from('tunas')
        .select('*')
        .order('orden', { ascending: true })
        .order('nombre', { ascending: true });

    if (error) {
        console.error("Error al cargar tunas:", error);
        return;
    }

    tunasGlobalesAdmin = data || [];
    renderizarTablaTunasAdmin(tunasGlobalesAdmin);
}

function renderizarTablaTunasAdmin(lista) {
    const tbody = document.getElementById('tabla-admin-tunas-body');
    if (!tbody) return;

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 25px; color:#888;">No hay tunas registradas.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(t => {
        const urlEscudo = (t.escudo_url && t.escudo_url.trim() !== '') ? t.escudo_url : 'img/escudos/pendiente.png';
        const badgeAsistido = t.asistido 
            ? '<span class="badge-asistencia si">SÍ (Visible)</span>' 
            : '<span class="badge-asistencia no">NO</span>';

        return `
            <tr>
                <td style="text-align: center;">
                    <input type="number" value="${t.orden || 0}" style="width: 50px !important; padding: 4px !important; text-align: center;" onchange="actualizarOrdenTunaRapido('${t.id}', this.value)">
                </td>
                <td style="text-align: center;">
                    <img src="${urlEscudo}" alt="Escudo" style="width: 32px; height: 32px; object-fit: contain;" onerror="this.src='img/escudos/pendiente.png'">
                </td>
                <td><strong>${t.nombre}</strong></td>
                <td><span style="font-size: 0.8rem; color: #ccc;">${t.ciudad || '-'} ${t.universidad ? `(${t.universidad})` : ''}</span></td>
                <td style="text-align: center;">${badgeAsistido}</td>
                <td style="text-align: center;">
                    <button class="btn-export-ui csv" style="padding: 3px 8px; font-size: 0.75rem;" onclick="editarTunaAdmin('${t.id}')">✏️ Editar</button>
                    <button class="btn-eliminar-ins" style="padding: 3px 8px; font-size: 0.75rem;" onclick="eliminarTunaAdmin('${t.id}', '${t.nombre}')">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

window.filtrarTablaTunasAdmin = function() {
    const texto = document.getElementById('filter-tunas-search').value.toLowerCase();
    const filtroAsist = document.getElementById('filter-tunas-asistencia').value;

    const filtradas = tunasGlobalesAdmin.filter(t => {
        const matchTexto = (t.nombre + ' ' + (t.ciudad || '') + ' ' + (t.universidad || '')).toLowerCase().includes(texto);
        let matchAsist = true;
        if (filtroAsist === 'asistido') matchAsist = t.asistido === true;
        if (filtroAsist === 'no_asistido') matchAsist = !t.asistido;

        return matchTexto && matchAsist;
    });

    renderizarTablaTunasAdmin(filtradas);
};

window.abrirFormularioTuna = function() {
    document.getElementById('form-tuna').reset();
    document.getElementById('tuna-id').value = '';
    document.getElementById('tuna-check-asistido').checked = false;
    document.getElementById('tuna-orden-input').value = 0;
    document.getElementById('editor-tuna-titulo').innerText = "Añadir Nueva Agrupación";
    document.getElementById('box-editor-tuna').style.display = 'block';
};

window.cerrarFormularioTuna = function() {
    document.getElementById('box-editor-tuna').style.display = 'none';
};

window.editarTunaAdmin = function(id) {
    const t = tunasGlobalesAdmin.find(item => item.id === id);
    if (!t) return;

    document.getElementById('tuna-id').value = t.id;
    document.getElementById('tuna-nombre-input').value = t.nombre || '';
    document.getElementById('tuna-escudo-input').value = t.escudo_url || '';
    document.getElementById('tuna-ciudad-input').value = t.ciudad || '';
    document.getElementById('tuna-universidad-input').value = t.universidad || '';
    document.getElementById('tuna-orden-input').value = t.orden || 0;
    document.getElementById('tuna-check-asistido').checked = t.asistido || false;

    document.getElementById('editor-tuna-titulo').innerText = "Editar Agrupación";
    document.getElementById('box-editor-tuna').style.display = 'block';
};

window.guardarTunaAdmin = async function(e) {
    e.preventDefault();
    const status = document.getElementById('tuna-form-status');
    status.innerText = "Guardando tuna...";

    const id = document.getElementById('tuna-id').value;
    const nombre = document.getElementById('tuna-nombre-input').value.trim();
    const escudo = document.getElementById('tuna-escudo-input').value.trim();
    const ciudad = document.getElementById('tuna-ciudad-input').value.trim();
    const universidad = document.getElementById('tuna-universidad-input').value.trim();
    const orden = parseInt(document.getElementById('tuna-orden-input').value) || 0;
    const asistido = document.getElementById('tuna-check-asistido').checked;

    const payload = {
        nombre,
        escudo_url: escudo || null,
        ciudad: ciudad || null,
        universidad: universidad || null,
        orden: orden,
        asistido: asistido
    };

    let error;
    if (id) {
        ({ error } = await supabaseClient.from('tunas').update(payload).eq('id', id));
    } else {
        ({ error } = await supabaseClient.from('tunas').insert([payload]));
    }

    if (error) {
        status.innerText = "Error: " + error.message;
        status.style.color = "#ff4444";
    } else {
        status.innerText = "¡Agrupación guardada correctamente!";
        status.style.color = "#2ecc71";
        cerrarFormularioTuna();
        cargarTunasAdmin();
    }
};

window.actualizarOrdenTunaRapido = async function(id, nuevoOrden) {
    await supabaseClient.from('tunas').update({ orden: parseInt(nuevoOrden) || 0 }).eq('id', id);
};

window.eliminarTunaAdmin = async function(id, nombre) {
    if (!confirm(`¿Eliminar la tuna "${nombre}" del catálogo?`)) return;
    await supabaseClient.from('tunas').delete().eq('id', id);
    cargarTunasAdmin();
};

/* --- GESTIÓN DE USUARIOS Y PERMISOS LOPD --- */
async function cargarUsuariosAdmin() {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });
    usuariosGlobalesAdmin = data || [];
    const tbody = document.getElementById('tabla-admin-usuarios-body');
    if (!tbody) return;

    if (usuariosGlobalesAdmin.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #888;">No hay usuarios registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = usuariosGlobalesAdmin.map(u => `
        <tr>
            <td>
                <strong>${u.mote ? `"${u.mote}"` : 'Sin mote'}</strong>
                <div style="font-size: 0.75rem; color: #aaa;">${u.email}</div>
            </td>
            <td><strong style="color: var(--color-acento); font-size: 0.8rem;">${(u.role || 'user').toUpperCase()}</strong></td>
            <td>${u.tuna_nombre || 'No especificada'}</td>
            <td><span style="font-size:0.75rem; color:#aaa;">${u.ultima_conexion ? new Date(u.ultima_conexion).toLocaleDateString('es-ES') : 'Sin registro'}</span></td>
            <td style="text-align:center; white-space: nowrap;">
                <button class="btn-export-ui csv" style="padding: 4px 8px; font-size: 0.75rem;" onclick="abrirModalEditarTunoAdmin('${u.id}')">✏️ Editar Tuno</button>
                <button class="btn-eliminar-ins" style="padding: 4px 8px; font-size: 0.75rem;" onclick="eliminarUsuarioLOPD('${u.id}', '${u.email}')">🗑️ Borrar LOPD</button>
            </td>
        </tr>
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
    let badge = document.getElementById('badge-count-denuncias');
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

/* ==========================================================================
   MÓDULO DE NEWSLETTER Y ENVÍOS MASIVOS DE COMUNICACIONES
   ========================================================================== */
async function cargarMetricasNewsletter() {
    if (!supabaseClient) return;

    const elActivos = document.getElementById('stat-newsletter-activos');
    const elBajas = document.getElementById('stat-newsletter-bajas');
    const elInscritos = document.getElementById('stat-newsletter-inscritos');

    let anioActivo = 2027;
    const { data: cfgAnio } = await supabaseClient
        .from('configuracion')
        .select('valor')
        .eq('clave', 'anio_edicion')
        .maybeSingle();

    if (cfgAnio && cfgAnio.valor) {
        anioActivo = parseInt(cfgAnio.valor);
    }

    // 1. Suscritos activos en profiles (acepta_newsletter = true)
    const { count: countSuscritos } = await supabaseClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('acepta_newsletter', true);

    // 2. Bajas registradas en la tabla auxiliar newsletter
    const { count: countBajas } = await supabaseClient
        .from('newsletter')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'cancelado');

    // 3. Inscritos confirmados en la edición activa
    const { count: countInscritos } = await supabaseClient
        .from('inscripciones')
        .select('id', { count: 'exact', head: true })
        .eq('anio', anioActivo);

    if (elActivos) elActivos.innerText = countSuscritos || 0;
    if (elBajas) elBajas.innerText = countBajas || 0;
    if (elInscritos) elInscritos.innerText = countInscritos || 0;

    // Cargar automáticamente la lista de correos según el segmento seleccionado
    await actualizarConteoDestinatarios();
}

window.actualizarConteoDestinatarios = async function() {
    if (!supabaseClient) return;

    const selectSegmento = document.getElementById('news-destinatarios-select');
    const labelConteo = document.getElementById('news-conteo-dest');
    if (!selectSegmento || !labelConteo) return;

    const segmento = selectSegmento.value;
    listaCorreosSegmentoActual = [];

    let anioActivo = 2027;
    const { data: cfgAnio } = await supabaseClient
        .from('configuracion')
        .select('valor')
        .eq('clave', 'anio_edicion')
        .maybeSingle();

    if (cfgAnio && cfgAnio.valor) {
        anioActivo = parseInt(cfgAnio.valor);
    }

    if (segmento === 'newsletter') {
        const { data } = await supabaseClient
            .from('profiles')
            .select('email')
            .eq('acepta_newsletter', true);

        if (data) {
            listaCorreosSegmentoActual = [...new Set(data.map(p => p.email).filter(Boolean))];
        }

    } else if (segmento === 'inscritos') {
        const { data } = await supabaseClient
            .from('inscripciones')
            .select('email')
            .eq('anio', anioActivo);

        if (data) {
            listaCorreosSegmentoActual = [...new Set(data.map(i => i.email).filter(Boolean))];
        }

    } else if (segmento === 'todos') {
        const { data } = await supabaseClient
            .from('profiles')
            .select('email');

        if (data) {
            listaCorreosSegmentoActual = [...new Set(data.map(p => p.email).filter(Boolean))];
        }
    }

    labelConteo.innerText = listaCorreosSegmentoActual.length;
};

window.copiarListaCorreosCSV = function() {
    if (!listaCorreosSegmentoActual || listaCorreosSegmentoActual.length === 0) {
        alert("No hay correos destinatarios disponibles para copiar.");
        return;
    }

    const textoBCC = listaCorreosSegmentoActual.join("; ");
    navigator.clipboard.writeText(textoBCC).then(() => {
        alert(`¡Copiados ${listaCorreosSegmentoActual.length} correos al portapapeles (formato separado por punto y coma para BCC)!`);
    }).catch(err => {
        console.error("Error al copiar correos:", err);
        alert("No se pudo copiar automáticamente. Copia este texto manualmente:\n\n" + textoBCC);
    });
};

window.prepararEnvioNewsletter = async function(e) {
    e.preventDefault();
    const status = document.getElementById('news-form-status');

    if (!listaCorreosSegmentoActual || listaCorreosSegmentoActual.length === 0) {
        if (status) {
            status.innerText = "Error: El segmento seleccionado no contiene ningún correo.";
            status.style.color = "#ff4444";
        }
        return;
    }

    if (status) {
        status.innerText = `Preparado el envío para ${listaCorreosSegmentoActual.length} destinatarios. Utiliza el botón de copiar correos para pegarlos en CCO/BCC.`;
        status.style.color = "#2ecc71";
    }
};

/* ==========================================================================
   MÓDULO AUDITORÍA Y EDICIÓN DE AÑOS DE MEDALLAS
   ========================================================================== */
window.filtrarTunosAuditPredictivo = function(texto) {
    const box = document.getElementById('audit-tuno-results');
    const inputHidden = document.getElementById('audit-tuno-selected-id');
    if (!box) return;

    inputHidden.value = '';
    const q = texto.toLowerCase().trim();

    if (q.length === 0) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }

    const coincidentes = listaTunosPredictiva.filter(p => {
        const moteMatch = p.mote && p.mote.toLowerCase().includes(q);
        const emailMatch = p.email && p.email.toLowerCase().includes(q);
        return moteMatch || emailMatch;
    });

    if (coincidentes.length === 0) {
        box.innerHTML = '<div style="padding: 10px; color: #888; font-size: 0.8rem;">No se encontraron tunos</div>';
    } else {
        box.innerHTML = coincidentes.map(p => `
            <div onclick="seleccionarTunoAuditPredictivo('${p.id}', '${(p.mote || '').replace(/'/g, "\\'")}', '${p.email}')" 
                 style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #333; font-size: 0.85rem; color: #fff;">
                <strong style="color: var(--color-acento);">${p.mote ? `"${p.mote}"` : 'Sin mote'}</strong> 
                <span style="color: #aaa; font-size: 0.75rem;">(${p.email})</span>
            </div>
        `).join('');
    }

    box.style.display = 'block';
};

window.seleccionarTunoAuditPredictivo = function(id, mote, email) {
    document.getElementById('audit-tuno-selected-id').value = id;
    document.getElementById('audit-tuno-search').value = mote ? `"${mote}" (${email})` : email;
    document.getElementById('audit-tuno-results').style.display = 'none';
};

window.cargarMedallasUsuarioAudit = async function() {
    const userId = document.getElementById('audit-tuno-selected-id').value;
    const status = document.getElementById('audit-medalla-status');
    const contenedor = document.getElementById('contenedor-audit-medallas');
    const tbody = document.getElementById('tabla-audit-medallas-body');

    if (!userId) {
        status.innerText = "Selecciona primero un tuno de la lista.";
        status.style.color = "#ff4444";
        return;
    }

    status.innerText = "Cargando medallas del tuno...";
    status.style.color = "var(--color-acento)";

    const { data: asignaciones, error } = await supabaseClient
        .from('usuarios_medallas')
        .select('id, anio_conseguido, medallas(nombre, imagen_url)')
        .eq('user_id', userId);

    if (error || !asignaciones || asignaciones.length === 0) {
        status.innerText = "Este tuno no posee medallas asignadas actualmente.";
        status.style.color = "#ffaa00";
        contenedor.style.display = 'none';
        return;
    }

    status.innerText = "";
    contenedor.style.display = 'block';

    tbody.innerHTML = asignaciones.map(a => `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="${a.medallas.imagen_url}" style="width:24px; height:24px; object-fit:contain;" onerror="this.src='img/favicon.png'">
                    <strong>${a.medallas.nombre}</strong>
                </div>
            </td>
            <td><strong>${a.anio_conseguido}</strong></td>
            <td>
                <input type="number" id="input-anio-medalla-${a.id}" value="${a.anio_conseguido}" min="1950" max="2035" style="width:90px; padding:4px 8px; background:#000; border:1px solid var(--color-acento); color:#fff; border-radius:4px;">
            </td>
            <td style="text-align: center;">
                <button type="button" class="btn-export-ui excel" style="padding:3px 8px; font-size:0.75rem;" onclick="actualizarAnoMedallaUsuario('${a.id}')">💾 Guardar Año</button>
                <button type="button" class="btn-eliminar-ins" style="padding:3px 8px; font-size:0.75rem;" onclick="revocarMedallaUsuario('${a.id}')">🗑️ Quitar</button>
            </td>
        </tr>
    `).join('');
};

window.actualizarAnoMedallaUsuario = async function(asignacionId) {
    const nuevoAnio = parseInt(document.getElementById(`input-anio-medalla-${asignacionId}`).value);
    const status = document.getElementById('audit-medalla-status');

    if (!nuevoAnio) return;

    const { error } = await supabaseClient
        .from('usuarios_medallas')
        .update({ anio_conseguido: nuevoAnio })
        .eq('id', asignacionId);

    if (error) {
        status.innerText = "Error al actualizar año: " + error.message;
        status.style.color = "#ff4444";
    } else {
        status.innerText = "¡Año de medalla corregido con éxito!";
        status.style.color = "#2ecc71";
        setTimeout(() => { status.innerText = ""; }, 3000);
    }
};

window.revocarMedallaUsuario = async function(asignacionId) {
    if (!confirm("¿Deseas revocar esta medalla al tuno?")) return;
    await supabaseClient.from('usuarios_medallas').delete().eq('id', asignacionId);
    window.cargarMedallasUsuarioAudit();
};

/* ==========================================================================
   MÓDULO "OBRAR EL MILAGRO": VINCULACIÓN MANUAL
   ========================================================================== */
window.cargarUsuariosParaMilagro = async function() {
    const select = document.getElementById('milagro-user-select');
    if (!select) return;

    const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('id, mote, email, tuna_nombre')
        .order('email', { ascending: true });

    if (profiles) {
        select.innerHTML = '<option value="">Selecciona usuario registrado...</option>' + profiles.map(p => `
            <option value="${p.id}">${p.mote ? `"${p.mote}"` : 'Sin mote'} (${p.email})</option>
        `).join('');
    }
};

window.ejecutarMilagroVinculacion = async function(e) {
    e.preventDefault();
    const userId = document.getElementById('milagro-user-select').value;
    const moteOficial = document.getElementById('milagro-mote-oficial').value.trim();
    const status = document.getElementById('milagro-status');

    if (!userId || !moteOficial) return;

    status.innerText = "Obrando el milagro...";
    status.style.color = "var(--color-acento)";

    // Actualizamos el mote en la tabla profiles para que encaje al 100% con la lista histórica
    const { error } = await supabaseClient
        .from('profiles')
        .update({ mote: moteOficial })
        .eq('id', userId);

    if (error) {
        status.innerText = "Error en la vinculación: " + error.message;
        status.style.color = "#ff4444";
    } else {
        status.innerText = `✨ ¡Milagro realizado! El usuario ahora está oficialmente vinculado como "${moteOficial}".`;
        status.style.color = "#2ecc71";
        document.getElementById('form-milagro-vinculo').reset();
        setTimeout(() => { status.innerText = ""; }, 4000);
    }
};

// Cargar select de usuarios al abrir sección tunas
const origCargarTunasAdmin = window.cargarTunasAdmin;
window.cargarTunasAdmin = async function() {
    if (typeof origCargarTunasAdmin === 'function') await origCargarTunasAdmin();
    window.cargarUsuariosParaMilagro();
};

/* ==========================================================================
   EDICIÓN DIRECTA DE DATOS DE TUNOS Y PERFILES POR EL ADMIN/GESTOR
   ========================================================================== */

// Abrir modal con datos actuales cargados y buscador predictivo de tunas
window.abrirModalEditarTunoAdmin = async function(userId) {
    if (!supabaseClient) return;

    const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error || !profile) {
        alert("Error al cargar el perfil del usuario.");
        return;
    }

    let modalEdit = document.getElementById('modal-editar-tuno-admin');
    if (!modalEdit) {
        modalEdit = document.createElement('div');
        modalEdit.id = 'modal-editar-tuno-admin';
        modalEdit.className = 'modal-interno';
        modalEdit.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1100; padding:20px; overflow-y:auto;';
        modalEdit.innerHTML = `
            <div class="modal-content" style="max-width: 500px; margin: 40px auto; background: #181818; border: 1px solid var(--color-acento); padding: 25px; border-radius: 8px;">
                <button class="cerrar-modal" onclick="document.getElementById('modal-editar-tuno-admin').style.display='none'">&times;</button>
                <h3 style="color: var(--color-acento); margin-top: 0;">✏️ Editar Datos del Tuno (Admin)</h3>
                <form id="form-admin-edit-tuno" onsubmit="guardarEdicionTunoAdmin(event)">
                    <input type="hidden" id="admin-edit-userid">
                    
                    <div class="input-group" style="margin-bottom: 12px;">
                        <label>Email (No modificable)</label>
                        <input type="email" id="admin-edit-email" disabled style="opacity: 0.6;">
                    </div>

                    <div class="input-group" style="margin-bottom: 12px;">
                        <label>Mote / Apodo *</label>
                        <input type="text" id="admin-edit-mote" placeholder="Ej: Rumbito" required>
                    </div>

                    <div class="input-group" style="margin-bottom: 12px; position: relative;">
                        <label>Tuna Principal *</label>
                        <input type="text" id="admin-edit-tuna" placeholder="Empieza a escribir tu tuna..." autocomplete="off" required>
                        <ul id="admin-tuna-results-list" class="autocomplete-results" style="display:none; position:absolute; width:100%; z-index:999; max-height:150px; overflow-y:auto; background:#222; border:1px solid var(--color-acento); list-style:none; padding:0; margin:0;"></ul>
                    </div>

                    <div class="input-group" style="margin-bottom: 15px;">
                        <label>Rol de Usuario</label>
                        <select id="admin-edit-role">
                            <option value="user">Usuario (USER)</option>
                            <option value="editor">Editor (EDITOR)</option>
                            <option value="gestor">Gestor (GESTOR)</option>
                            <option value="admin">Administrador (ADMIN)</option>
                        </select>
                    </div>

                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" class="btn-sutil-logout" onclick="document.getElementById('modal-editar-tuno-admin').style.display='none'">Cancelar</button>
                        <button type="submit" class="btn-tuna-ui">💾 Guardar Cambios</button>
                    </div>
                    <div id="admin-edit-status" class="mensaje-estado" style="margin-top: 10px;"></div>
                </form>
            </div>
        `;
        document.body.appendChild(modalEdit);
        configurarBuscadorTunasModalAdmin();
    }

    document.getElementById('admin-edit-userid').value = profile.id;
    document.getElementById('admin-edit-email').value = profile.email || '';
    document.getElementById('admin-edit-mote').value = profile.mote || '';
    document.getElementById('admin-edit-tuna').value = profile.tuna_nombre || '';
    document.getElementById('admin-edit-role').value = profile.role || 'user';

    document.getElementById('modal-editar-tuno-admin').style.display = 'block';
};

// Buscador predictivo para el campo de Tuna en el Modal Admin
function configurarBuscadorTunasModalAdmin() {
    const searchInput = document.getElementById('admin-edit-tuna');
    const resultsList = document.getElementById('admin-tuna-results-list');
    if (!searchInput || !resultsList) return;

    let timeout = null;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        const query = e.target.value.trim();
        if (query.length < 2) { resultsList.style.display = 'none'; return; }

        timeout = setTimeout(async () => {
            if (!supabaseClient) return;
            const { data, error } = await supabaseClient
                .from('tunas')
                .select('nombre')
                .ilike('nombre', `%${query}%`)
                .limit(8);

            if (!error && data && data.length > 0) {
                resultsList.innerHTML = '';
                data.forEach(tuna => {
                    const li = document.createElement('li');
                    li.innerText = tuna.nombre;
                    li.style.padding = '8px 12px';
                    li.style.cursor = 'pointer';
                    li.addEventListener('click', () => {
                        searchInput.value = tuna.nombre;
                        resultsList.style.display = 'none';
                    });
                    resultsList.appendChild(li);
                });
                resultsList.style.display = 'block';
            } else { resultsList.style.display = 'none'; }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsList.contains(e.target)) {
            resultsList.style.display = 'none';
        }
    });
}

// Guardar cambios en la tabla profiles y actualizar también las inscripciones activas
window.guardarEdicionTunoAdmin = async function(e) {
    e.preventDefault();
    const status = document.getElementById('admin-edit-status');
    status.innerText = "Guardando cambios...";

    const userId = document.getElementById('admin-edit-userid').value;
    const mote = document.getElementById('admin-edit-mote').value.trim();
    const tunaNombre = document.getElementById('admin-edit-tuna').value.trim();
    const role = document.getElementById('admin-edit-role').value;

    // 1. Actualizar la tabla profiles
    const { error: errorProfile } = await supabaseClient
        .from('profiles')
        .update({
            mote: mote,
            tuna_nombre: tunaNombre,
            role: role
        })
        .eq('id', userId);

    if (errorProfile) {
        status.innerText = "Error actualizando perfil: " + errorProfile.message;
        status.style.color = "#ff4444";
        return;
    }

    // 2. Propagar el cambio de mote/tuna a las inscripciones del usuario
    await supabaseClient
        .from('inscripciones')
        .update({
            mote: mote,
            tuna_nombre: tunaNombre
        })
        .eq('user_id', userId);

    status.innerText = "¡Datos del tuno actualizados con éxito en todo el sistema!";
    status.style.color = "#2ecc71";

    setTimeout(() => {
        document.getElementById('modal-editar-tuno-admin').style.display = 'none';
        if (typeof cargarUsuariosAdmin === 'function') cargarUsuariosAdmin();
        if (typeof cargarTablaInscripcionesAdmin === 'function') cargarTablaInscripcionesAdmin();
    }, 1200);
};