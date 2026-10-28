/* ==========================================================================
   LÓGICA DEL PANEL DE ADMINISTRACIÓN (scripts/admin.js)
   ========================================================================== */

let currentUserRole = 'user'; // Guardará el rol de la sesión activa
let censoInscripcionesGlobal = [];
let noticiasGlobalesAdmin = [];
let tunasGlobalesAdmin = [];
let usuariosGlobalesAdmin = [];
let quillEditor = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarAccesoAdminPanel();
});

/* --- 1. VERIFICACIÓN DE SESIÓN Y ROL DE ACCESO AL PANEL --- */
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
        
        const btnQuickIns = document.getElementById('btn-quick-inscripciones');
        if (btnQuickIns) btnQuickIns.style.display = 'none';

        if (itemIns) itemIns.style.display = 'none';
        if (itemTunas) itemTunas.style.display = 'none';
        if (itemDenuncias) itemDenuncias.style.display = 'none';
    }
}

/* --- 2. NAVEGACIÓN UNIFICADA POR PESTAÑAS DEL DASHBOARD --- */
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
    }
};

/* --- 3. ESCRITORIO DE CONTROL Y CONFIGURACIÓN DE FECHA --- */
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

/* --- 4. GESTIÓN DE INSCRIPCIONES (EXCEL & CSV) --- */
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
    worksheet['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 28 },
        { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 15 }, { wch: 15 }
    ];

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

/* --- 5. GESTIÓN DEL BLOG Y EDITOR GUTENBERG (QUILL) --- */
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

async function cargarNoticiasAdmin() {
    if (!supabaseClient) return;
    const tbody = document.getElementById('tabla-admin-blog-body');
    if (!tbody) return;

    const { data, error } = await supabaseClient
        .from('blog')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ff4444;">Error: ${error.message}</td></tr>`;
        return;
    }

    noticiasGlobalesAdmin = data || [];
    renderizarTablaBlogAdmin(noticiasGlobalesAdmin);
}

function renderizarTablaBlogAdmin(lista) {
    const tbody = document.getElementById('tabla-admin-blog-body');
    if (!tbody) return;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 25px; color:#888;">No hay artículos redactados aún.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    lista.forEach(item => {
        const tr = document.createElement('tr');
        const fecha = new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        const tagsHTML = (item.etiquetas && Array.isArray(item.etiquetas))
            ? item.etiquetas.map(t => `<span class="tag-pildora">#${t}</span>`).join('')
            : '<span style="color:#666; font-size:0.75rem;">Sin tags</span>';

        tr.innerHTML = `
            <td>
                <span class="noticia-badge-cat">${item.categoria || 'General'}</span>
                <div class="tuno-nombre-destacado">${item.titulo}</div>
                <span style="font-size: 0.75rem; color: #888;">/${item.slug}</span>
            </td>
            <td>${tagsHTML}</td>
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
    document.getElementById('blog-categoria-select').value = 'General';
    document.getElementById('blog-etiquetas-input').value = '';
    document.getElementById('editor-blog-titulo').innerText = "Redactar Nueva Noticia";
    document.getElementById('box-editor-blog').style.display = 'block';
    
    inicializarEditorQuill();
    if (quillEditor) quillEditor.setText('');
};

window.cerrarFormularioNoticia = function() {
    document.getElementById('box-editor-blog').style.display = 'none';
};

window.editarNoticiaAdmin = function(id) {
    const noticia = noticiasGlobalesAdmin.find(n => n.id === id);
    if (!noticia) return;

    document.getElementById('blog-id').value = noticia.id;
    document.getElementById('blog-titulo-input').value = noticia.titulo;
    document.getElementById('blog-imagen-input').value = noticia.imagen_url || '';
    document.getElementById('blog-categoria-select').value = noticia.categoria || 'General';
    document.getElementById('blog-etiquetas-input').value = noticia.etiquetas ? noticia.etiquetas.join(', ') : '';
    document.getElementById('blog-autor-input').value = noticia.autor;
    document.getElementById('blog-estado-select').value = noticia.estado;
    document.getElementById('blog-resumen-input').value = noticia.resumen;

    document.getElementById('editor-blog-titulo').innerText = "Editar Noticia";
    document.getElementById('box-editor-blog').style.display = 'block';

    inicializarEditorQuill();
    if (quillEditor) {
        quillEditor.clipboard.dangerouslyPasteHTML(noticia.contenido || '');
    }
};

window.guardarNoticiaAdmin = async function(e) {
    e.preventDefault();
    const status = document.getElementById('blog-form-status');
    status.innerText = "Guardando noticia...";

    if (quillEditor) {
        document.getElementById('blog-contenido-input').value = quillEditor.root.innerHTML;
    }

    const id = document.getElementById('blog-id').value;
    const titulo = document.getElementById('blog-titulo-input').value.trim();
    const slug = titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const etiquetasRaw = document.getElementById('blog-etiquetas-input').value;
    const etiquetas = etiquetasRaw
        ? etiquetasRaw.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(tag => tag.length > 0)
        : [];

    const payload = {
        titulo: titulo,
        slug: slug,
        categoria: document.getElementById('blog-categoria-select').value,
        etiquetas: etiquetas,
        imagen_url: document.getElementById('blog-imagen-input').value.trim() || null,
        autor: document.getElementById('blog-autor-input').value.trim() || 'Redacción Jueves Santo',
        estado: document.getElementById('blog-estado-select').value,
        resumen: document.getElementById('blog-resumen-input').value.trim(),
        contenido: document.getElementById('blog-contenido-input').value,
        updated_at: new Date()
    };

    let error;
    if (id) {
        ({ error } = await supabaseClient.from('blog').update(payload).eq('id', id));
    } else {
        ({ error } = await supabaseClient.from('blog').insert([payload]));
    }

    if (error) {
        status.innerText = "Error: " + error.message;
        status.style.color = "#ff4444";
    } else {
        status.innerText = "¡Artículo guardado correctamente!";
        status.style.color = "#2ecc71";
        cerrarFormularioNoticia();
        cargarNoticiasAdmin();
    }
};

window.eliminarNoticiaAdmin = async function(id, titulo) {
    if (!confirm(`¿Eliminar la noticia "${titulo}"?`)) return;
    const { error } = await supabaseClient.from('blog').delete().eq('id', id);
    if (!error) cargarNoticiasAdmin();
};

/* --- 6. MODERACIÓN Y GESTIÓN DE DENUNCIAS --- */
async function comprobarDenunciasPendientesBadge() {
    if (!supabaseClient) return;
    const { data: denuncias } = await supabaseClient.from('blog_denuncias').select('id').eq('estado', 'pendiente');
    const badge = document.getElementById('badge-count-denuncias');
    if (badge) {
        if (denuncias && denuncias.length > 0) {
            badge.innerText = denuncias.length;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

async function cargarDenunciasAdmin() {
    if (!supabaseClient) return;
    const tbody = document.getElementById('tabla-admin-denuncias-body');
    if (!tbody) return;

    const { data: denuncias, error } = await supabaseClient
        .from('blog_denuncias')
        .select(`
            id,
            motivo,
            created_at,
            blog_comentarios (
                id,
                comentario,
                user_id,
                nombre_usuario
            )
        `)
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ff4444;">Error cargando denuncias: ${error.message}</td></tr>`;
        return;
    }

    comprobarDenunciasPendientesBadge();

    if (!denuncias || denuncias.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 25px; color:#888;">¡Todo limpio! No hay comentarios reportados.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    denuncias.forEach(d => {
        const com = d.blog_comentarios;
        if (!com) return;

        const fecha = new Date(d.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color: var(--color-acento);">${com.nombre_usuario}</strong></td>
            <td style="max-width: 300px; font-style: italic; color: #ddd;">"${com.comentario}"</td>
            <td><span class="tuno-mote-tag" style="color:#ffaa00;">${d.motivo}</span></td>
            <td>${fecha}</td>
            <td style="text-align: center;">
                <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn-export-ui csv" style="padding: 4px 8px; font-size: 0.75rem;" onclick="desestimarDenunciaAdmin('${d.id}')" title="Desestimar denuncia">Dismiss</button>
                    <button class="btn-eliminar-ins" style="padding: 4px 8px; font-size: 0.75rem;" onclick="borrarComentarioAdmin('${d.id}', '${com.id}')" title="Borrar comentario">🗑️ Borrar</button>
                    <button class="btn-tuna-ui" style="padding: 4px 8px; font-size: 0.75rem; background:#ff4444; color:#fff;" onclick="vetarTunoAdmin('${d.id}', '${com.user_id}', '${com.nombre_usuario}')" title="Vetar participación próximo año">⛔ Vetar Tuno</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.desestimarDenunciaAdmin = async function(denunciaId) {
    await supabaseClient.from('blog_denuncias').update({ estado: 'desestimada' }).eq('id', denunciaId);
    cargarDenunciasAdmin();
};

window.borrarComentarioAdmin = async function(denunciaId, comentarioId) {
    if (!confirm("¿Deseas eliminar este comentario definitivamente?")) return;
    await supabaseClient.from('blog_comentarios').delete().eq('id', comentarioId);
    await supabaseClient.from('blog_denuncias').update({ estado: 'resuelta' }).eq('id', denunciaId);
    cargarDenunciasAdmin();
};

window.vetarTunoAdmin = async function(denunciaId, userId, nombreTuno) {
    const motivo = prompt(`Escribe el motivo de la sanción para ${nombreTuno}:`, "Conducta inapropiada e insultos en la plataforma");
    if (!motivo) return;

    if (!confirm(`¿Estás seguro de prohibir la inscripción de ${nombreTuno} para el próximo año?`)) return;

    const { error } = await supabaseClient
        .from('profiles')
        .update({ vetado_inscripcion: true, motivo_sancion: motivo })
        .eq('id', userId);

    if (error) {
        alert("Error aplicando sanción: " + error.message);
    } else {
        alert(`Se ha vetado la inscripción de ${nombreTuno} correctamente.`);
        await supabaseClient.from('blog_comentarios').delete().eq('id', denunciaId);
        await supabaseClient.from('blog_denuncias').update({ estado: 'resuelta' }).eq('id', denunciaId);
        cargarDenunciasAdmin();
    }
};

/* --- 7. DIRECTORIO Y GESTIÓN DE TUNAS --- */
async function cargarTunasAdmin() {
    if (!supabaseClient) return;
    const tbody = document.getElementById('tabla-admin-tunas-body');
    if (!tbody) return;

    const { data, error } = await supabaseClient
        .from('tunas')
        .select('*')
        .order('nombre', { ascending: true });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ff4444;">Error: ${error.message}</td></tr>`;
        return;
    }

    tunasGlobalesAdmin = data || [];
    renderizarTablaTunasAdmin(tunasGlobalesAdmin);
}

function renderizarTablaTunasAdmin(lista) {
    const tbody = document.getElementById('tabla-admin-tunas-body');
    if (!tbody) return;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 25px; color:#888;">No hay agrupaciones registradas en el catálogo.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    lista.forEach(t => {
        const escudoHTML = t.escudo_url 
            ? `<img src="${t.escudo_url}" alt="Escudo" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px;">` 
            : `<span style="font-size: 1.2rem;">🛡️</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="width: 50px; text-align: center;">${escudoHTML}</td>
            <td><span class="tuno-nombre-destacado">${t.nombre}</span></td>
            <td><span style="font-size:0.8rem; color:#aaa;">${t.ciudad || 'Sin ciudad'} ${t.universidad ? '• ' + t.universidad : ''}</span></td>
            <td style="text-align: center;">
                <button class="btn-export-ui csv" style="padding: 4px 8px;" onclick="editarTunaAdmin('${t.id}')">✏️ Editar</button>
                <button class="btn-eliminar-ins" onclick="eliminarTunaAdmin('${t.id}', '${t.nombre}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.filtrarTablaTunasAdmin = function() {
    const search = document.getElementById('filter-tunas-search').value.toLowerCase();
    const filtradas = tunasGlobalesAdmin.filter(t => 
        t.nombre.toLowerCase().includes(search) || 
        (t.ciudad && t.ciudad.toLowerCase().includes(search))
    );
    renderizarTablaTunasAdmin(filtradas);
};

window.abrirFormularioTuna = function() {
    document.getElementById('form-tuna').reset();
    document.getElementById('tuna-id').value = '';
    document.getElementById('editor-tuna-titulo').innerText = "Añadir Nueva Agrupación";
    document.getElementById('box-editor-tuna').style.display = 'block';
};

window.cerrarFormularioTuna = function() {
    document.getElementById('box-editor-tuna').style.display = 'none';
};

window.editarTunaAdmin = function(id) {
    const tuna = tunasGlobalesAdmin.find(t => t.id === id);
    if (!tuna) return;

    document.getElementById('tuna-id').value = tuna.id;
    document.getElementById('tuna-nombre-input').value = tuna.nombre;
    document.getElementById('tuna-escudo-input').value = tuna.escudo_url || '';
    document.getElementById('tuna-ciudad-input').value = tuna.ciudad || '';
    document.getElementById('tuna-universidad-input').value = tuna.universidad || '';

    document.getElementById('editor-tuna-titulo').innerText = "Editar Agrupación";
    document.getElementById('box-editor-tuna').style.display = 'block';
};

window.guardarTunaAdmin = async function(e) {
    e.preventDefault();
    const status = document.getElementById('tuna-form-status');
    status.innerText = "Guardando agrupación...";

    const id = document.getElementById('tuna-id').value;
    const nombre = document.getElementById('tuna-nombre-input').value.trim();

    const payload = {
        nombre: nombre,
        escudo_url: document.getElementById('tuna-escudo-input').value.trim() || null,
        ciudad: document.getElementById('tuna-ciudad-input').value.trim() || null,
        universidad: document.getElementById('tuna-universidad-input').value.trim() || null
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

window.eliminarTunaAdmin = async function(id, nombre) {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${nombre}" del catálogo?`)) return;

    const { error } = await supabaseClient.from('tunas').delete().eq('id', id);

    if (error) {
        alert("Error al eliminar tuna: " + error.message);
    } else {
        cargarTunasAdmin();
    }
};

/* --- 8. USUARIOS, PERMISOS Y ELIMINACIÓN LOPD --- */
async function cargarUsuariosAdmin() {
    if (!supabaseClient) return;
    const tbody = document.getElementById('tabla-admin-usuarios-body');
    if (!tbody) return;

    const { data: perfiles, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ff4444;">Error: ${error.message}</td></tr>`;
        return;
    }

    const [{ data: comentarios }, { data: likes }, { data: denuncias }] = await Promise.all([
        supabaseClient.from('blog_comentarios').select('user_id'),
        supabaseClient.from('blog_likes').select('user_id'),
        supabaseClient.from('blog_denuncias').select('denunciante_id')
    ]);

    usuariosGlobalesAdmin = (perfiles || []).map(p => {
        return {
            ...p,
            numComentarios: comentarios ? comentarios.filter(c => c.user_id === p.id).length : 0,
            numLikes: likes ? likes.filter(l => l.user_id === p.id).length : 0,
            numDenuncias: denuncias ? denuncias.filter(d => d.denunciante_id === p.id).length : 0
        };
    });

    renderizarTablaUsuariosAdmin(usuariosGlobalesAdmin);
}

function renderizarTablaUsuariosAdmin(lista) {
    const tbody = document.getElementById('tabla-admin-usuarios-body');
    if (!tbody) return;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 25px; color:#888;">No se encontraron usuarios.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    lista.forEach(u => {
        const fechaCon = u.ultima_conexion 
            ? new Date(u.ultima_conexion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Nunca registrado';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="tuno-nombre-destacado">${u.email || u.id}</span>
                <span style="font-size:0.75rem; color:#888;">ID: ${u.id.substring(0, 8)}...</span>
            </td>
            <td>
                <select onchange="cambiarRolUsuarioAdmin('${u.id}', this.value)" style="background:#161616; color:var(--color-acento); border:1px solid rgba(212,175,55,0.4); padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.75rem;">
                    <option value="user" ${u.role === 'user' ? 'selected' : ''}>👤 USER</option>
                    <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>✏️ EDITOR</option>
                    <option value="gestor" ${u.role === 'gestor' ? 'selected' : ''}>📋 GESTOR</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>⚙️ ADMIN</option>
                </select>
            </td>
            <td style="font-size:0.8rem; color:#ccc;">${fechaCon}</td>
            <td style="text-align: center;"><strong>💬 ${u.numComentarios}</strong></td>
            <td style="text-align: center;"><strong>❤️ ${u.numLikes}</strong></td>
            <td style="text-align: center;"><strong>🚩 ${u.numDenuncias}</strong></td>
            <td style="text-align: center;">
                <button class="btn-eliminar-ins" onclick="eliminarUsuarioLOPD('${u.id}', '${u.email || 'usuario'}')" title="Eliminación permanente conforme a la LOPD">
                    🗑️ Borrar LOPD
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.filtrarTablaUsuariosAdmin = function() {
    const search = document.getElementById('filter-users-search').value.toLowerCase();
    const role = document.getElementById('filter-users-role').value;

    const filtrados = usuariosGlobalesAdmin.filter(u => {
        const matchText = (u.email || u.id).toLowerCase().includes(search);
        const matchRole = (role === 'todos') || (u.role === role);
        return matchText && matchRole;
    });

    renderizarTablaUsuariosAdmin(filtrados);
};

window.cambiarRolUsuarioAdmin = async function(userId, nuevoRol) {
    const { error } = await supabaseClient
        .from('profiles')
        .update({ role: nuevoRol })
        .eq('id', userId);

    if (error) {
        alert("Error actualizando el rol: " + error.message);
        cargarUsuariosAdmin();
    } else {
        alert(`Rol actualizado a ${nuevoRol.toUpperCase()} correctamente.`);
    }
};

window.eliminarUsuarioLOPD = async function(userId, email) {
    const seguro = confirm(`⚠️ ELIMINACIÓN PERMANENTE LOPD / RGPD ⚠️\n\n¿Estás seguro de eliminar al usuario "${email}"?\n\nEsta acción borrará definitivamente su perfil, inscripciones, comentarios y actividad en la plataforma.`);
    if (!seguro) return;

    await Promise.all([
        supabaseClient.from('inscripciones').delete().eq('user_id', userId),
        supabaseClient.from('blog_comentarios').delete().eq('user_id', userId),
        supabaseClient.from('blog_likes').delete().eq('user_id', userId),
        supabaseClient.from('blog_denuncias').delete().eq('denunciante_id', userId)
    ]);

    const { error } = await supabaseClient.from('profiles').delete().eq('id', userId);

    if (error) {
        alert("Error procesando solicitud LOPD: " + error.message);
    } else {
        alert(`Los datos de ${email} han sido eliminados de la plataforma conforme a la LOPD.`);
        cargarUsuariosAdmin();
    }
};