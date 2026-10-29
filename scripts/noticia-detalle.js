/* ==========================================================================
   CARGA, INTERACCIÓN Y COMENTARIOS DE NOTICIAS (scripts/noticia-detalle.js)
   ========================================================================== */

let noticiaActualId = null;
let usuarioSesion = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarDetalleNoticia();
});

async function cargarDetalleNoticia() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        setTimeout(cargarDetalleNoticia, 150);
        return;
    }

    const params = new URLSearchParams(window.location.search);
    noticiaActualId = params.get('id');

    if (!noticiaActualId) {
        document.getElementById('noticia-loading').innerText = "Noticia no encontrada.";
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    usuarioSesion = session?.user || null;

    const { data: noticia, error } = await supabaseClient
        .from('blog')
        .select('*')
        .eq('id', noticiaActualId)
        .maybeSingle();

    if (error || !noticia) {
        document.getElementById('noticia-loading').innerText = "No se pudo cargar la noticia solicitada.";
        return;
    }

    // Meta Tags dinámicos Open Graph
    actualizarMetaTags(noticia);

    // Pintar categoría y etiquetas
    const catEl = document.getElementById('noticia-categoria');
    if (catEl) catEl.innerText = noticia.categoria || 'General';

    // Pintar etiquetas clicables en el detalle de la noticia
    const tagsContainer = document.getElementById('noticia-tags');
    if (tagsContainer && noticia.etiquetas && Array.isArray(noticia.etiquetas)) {
        tagsContainer.innerHTML = noticia.etiquetas.map(t => 
            `<span class="tag-pildora" onclick="window.location.href='blog.html?tag=${encodeURIComponent(t)}'" style="cursor:pointer;">#${t}</span>`
        ).join('');
    }

    document.getElementById('noticia-fecha').innerText = new Date(noticia.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    document.getElementById('noticia-titulo').innerText = noticia.titulo;

    // FIRMA DE AUTOR CON AVATAR, MOTE Y MENÚ DESPLEGABLE ESTILO PERIÓDICO
    await renderizarFirmaAutorNoticia(noticia);

    if (noticia.imagen_url) {
        document.getElementById('noticia-imagen').src = noticia.imagen_url;
        document.getElementById('noticia-img-box').style.display = 'block';
    }

    // --- COMPROBACIÓN DE CONTROL DE ACCESO (RESTRINGIDO) ---
    const cuerpoEl = document.getElementById('noticia-cuerpo');

    if (noticia.es_restringido && !usuarioSesion) {
        // Muestra resumen con tarjeta de bloqueo
        cuerpoEl.innerHTML = `
            <div style="background: rgba(212,175,55,0.05); border: 2px dashed var(--color-acento); border-radius: 12px; padding: 30px 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 3rem; display: block; margin-bottom: 15px;">🔒</span>
                <h3 style="color: var(--color-acento); margin-bottom: 10px;">Contenido Exclusivo para Tunos Registrados</h3>
                <p style="color: #ccc; max-width: 500px; margin: 0 auto 20px auto; font-size: 0.9rem; line-height: 1.6;">
                    ${noticia.resumen || 'Esta publicación contiene información privada o reservada para la comunidad del Jueves Santo.'}
                </p>
                <button class="btn-tuna-ui" onclick="window.abrirModalAuth('login')" style="padding: 12px 24px; font-size: 0.9rem;">
                    🔑 Iniciar Sesión para Leer
                </button>
            </div>
        `;
    } else {
        // Mostrar cuerpo completo si es pública o si el usuario ya inició sesión
        cuerpoEl.innerHTML = noticia.contenido;
    }

    document.getElementById('noticia-loading').style.display = 'none';
    document.getElementById('noticia-article').style.display = 'block';

    actualizarLikesNoticia();
    cargarComentarios();
}

/* RENDERIZADO DE FIRMA DE AUTOR CON OPCIÓN DE FILTRADO */
async function renderizarFirmaAutorNoticia(noticia) {
    const autorEl = document.getElementById('noticia-autor');
    if (!autorEl) return;

    let profileAutor = null;
    if (noticia.user_id) {
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', noticia.user_id)
            .maybeSingle();
        profileAutor = profile;
    }

    const mote = profileAutor?.mote || noticia.autor || 'Redacción';
    const tuna = profileAutor?.tuna_nombre || 'Tuna Universitaria';
    const avatarUrl = profileAutor?.avatar_url;
    const inicial = mote.charAt(0).toUpperCase();

    autorEl.innerHTML = `
        <div class="blog-autor-card" style="display: flex; align-items: center; gap: 14px; margin: 15px 0; padding: 12px 16px; background: rgba(255,255,255,0.03); border-radius: 8px; border-left: 3px solid var(--color-acento);">
            
            <!-- AVATAR CIRCULAR CLICABLE -->
            <div onclick="toggleDropdownAutorDetalle(event)" style="cursor: pointer; width: 52px; height: 52px; border-radius: 50%; overflow: hidden; background: var(--color-acento); display: flex; align-items: center; justify-content: center; font-weight: bold; color: #000; flex-shrink: 0; border: 1.5px solid var(--color-acento);">
                ${avatarUrl 
                    ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;">` 
                    : `<span style="font-size: 1.4rem;">${inicial}</span>`}
            </div>

            <!-- DATOS EN BLOQUE VERTICAL -->
            <div style="display: flex; flex-direction: column; gap: 3px; flex-grow: 1; position: relative;">
                
                <!-- MOTE -->
                <span onclick="toggleDropdownAutorDetalle(event)" style="font-weight: bold; color: #fff; font-size: 1.05rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">
                    ${mote}
                </span>

                <!-- TUNA -->
                <div>
                    <span style="font-size: 0.75rem; color: var(--color-acento); display: inline-block;">
                        ${tuna}
                    </span>
                </div>

                <!-- DROPDOWN CON AMBAS OPCIONES -->
                <div id="dropdown-autor-detalle" style="display: none; position: absolute; top: 100%; left: 0; background: #1a1a1a; border: 1px solid var(--color-acento); border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.6); z-index: 100; min-width: 230px; overflow: hidden; margin-top: 6px;">
                    <button type="button" onclick="irAFiltrarNoticiasAutor('${noticia.user_id}', '${mote}')" style="width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; color: #fff; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #333;">
                        📰 Ver todas las noticias de ${mote}
                    </button>
                    <button type="button" onclick="abrirPerfilPublicoDetalle('${noticia.user_id}')" style="width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; color: var(--color-acento); font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        👤 Ver Perfil de Tuno
                    </button>
                </div>
            </div>
        </div>
    `;

    // Cierre automático del desplegable al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.blog-autor-card')) {
            const drop = document.getElementById('dropdown-autor-detalle');
            if (drop) drop.style.display = 'none';
        }
    });
}

// Función auxiliar para redirigir al blog aplicando el filtro del autor
window.irAFiltrarNoticiasAutor = function(userId, mote) {
    const dropdown = document.getElementById('dropdown-autor-detalle');
    if (dropdown) dropdown.style.display = 'none';
    
    // Redirige a blog.html pasando los parámetros del autor en la URL
    window.location.href = `blog.html?autorId=${encodeURIComponent(userId)}&mote=${encodeURIComponent(mote)}`;
};

window.toggleDropdownAutorDetalle = function(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('dropdown-autor-detalle');
    if (dropdown) {
        dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
    }
};

window.abrirPerfilPublicoDetalle = function(userId) {
    const dropdown = document.getElementById('dropdown-autor-detalle');
    if (dropdown) dropdown.style.display = 'none';
    if (typeof window.abrirModalPerfilPublico === 'function') {
        window.abrirModalPerfilPublico(userId);
    }
};

/* FUNCIÓN DE INYECCIÓN DINÁMICA DE META TAGS OPEN GRAPH */
function actualizarMetaTags(noticia) {
    document.title = `${noticia.titulo} - Jueves Santo Oviedo`;

    const setMeta = (property, content) => {
        let el = document.querySelector(`meta[property="${property}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute('property', property);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    };

    const resumenTexto = noticia.resumen || noticia.contenido.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
    const imagenNoticia = noticia.imagen_url || 'https://juevessantotuo.github.io/juevessanto/img/logo.png';

    setMeta('og:title', noticia.titulo);
    setMeta('og:description', resumenTexto);
    setMeta('og:image', imagenNoticia);
    setMeta('og:url', window.location.href);
}

/* GESTIÓN DE ME GUSTA EN NOTICIA */
async function actualizarLikesNoticia() {
    const { data: likes } = await supabaseClient.from('blog_likes').select('user_id').eq('blog_id', noticiaActualId);
    
    const count = likes ? likes.length : 0;
    document.getElementById('like-count').innerText = count;

    const btnLike = document.getElementById('btn-like-noticia');
    if (usuarioSesion && likes?.some(l => l.user_id === usuarioSesion.id)) {
        btnLike.classList.add('liked');
    } else {
        btnLike.classList.remove('liked');
    }
}

window.toggleLikeNoticia = async function() {
    if (!usuarioSesion) {
        alert("Debes iniciar sesión para dar me gusta.");
        return;
    }

    const { data: existente } = await supabaseClient
        .from('blog_likes')
        .select('id')
        .eq('blog_id', noticiaActualId)
        .eq('user_id', usuarioSesion.id)
        .maybeSingle();

    if (existente) {
        await supabaseClient.from('blog_likes').delete().eq('id', existente.id);
    } else {
        await supabaseClient.from('blog_likes').insert([{ blog_id: noticiaActualId, user_id: usuarioSesion.id }]);
    }

    actualizarLikesNoticia();
};

/* COMPARTIR EN REDES SOCIALES */
window.compartirSocial = function(red) {
    const url = encodeURIComponent(window.location.href);
    const titulo = encodeURIComponent(document.getElementById('noticia-titulo').innerText);

    if (red === 'wa') window.open(`https://api.whatsapp.com/send?text=${titulo}%20${url}`, '_blank');
    if (red === 'fb') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
};

window.copiarEnlaceNoticia = function() {
    navigator.clipboard.writeText(window.location.href);
    alert("¡Enlace copiado al portapapeles!");
};

/* COMENTARIOS COMPACTOS CON MINI-AVATAR */
async function cargarComentarios() {
    const box = document.getElementById('lista-comentarios');
    
    const { data: comentarios, error } = await supabaseClient
        .from('blog_comentarios')
        .select('*')
        .eq('blog_id', noticiaActualId)
        .order('created_at', { ascending: false });

    if (error || !comentarios || comentarios.length === 0) {
        box.innerHTML = `<p style="color:#666; font-size:0.85rem;">No hay comentarios todavía. ¡Sé el primero en opinar!</p>`;
        document.getElementById('num-comentarios').innerText = 0;
        return;
    }

    document.getElementById('num-comentarios').innerText = comentarios.length;
    box.innerHTML = '';

    // Mapear perfiles de comentaristas para avatar y mote real
    const userIds = [...new Set(comentarios.map(c => c.user_id).filter(Boolean))];
    let profilesMap = {};

    if (userIds.length > 0) {
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, mote, avatar_url')
            .in('id', userIds);

        if (profiles) {
            profiles.forEach(p => { profilesMap[p.id] = p; });
        }
    }

    for (const c of comentarios) {
        const fecha = new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        
        const { data: likesCom } = await supabaseClient.from('blog_comentario_likes').select('user_id').eq('comentario_id', c.id);
        const numLikes = likesCom ? likesCom.length : 0;
        const dioLike = usuarioSesion && likesCom?.some(l => l.user_id === usuarioSesion.id);

        const profileComentario = profilesMap[c.user_id];
        
        // Limpiar prefijo "Tuno" si estuviera almacenado en registros antiguos
        let moteLimpio = profileComentario?.mote || c.nombre_usuario || 'Tuno';
        moteLimpio = moteLimpio.replace(/^Tuno\s+/i, '');

        const avatarUrl = profileComentario?.avatar_url;
        const inicial = moteLimpio.charAt(0).toUpperCase();

        const item = document.createElement('div');
        item.className = 'comentario-item';
        item.style.padding = '12px';
        item.style.marginBottom = '12px';
        item.style.background = 'rgba(255,255,255,0.02)';
        item.style.borderRadius = '8px';

        item.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: flex-start;">
                
                <!-- MINI-AVATAR (32px) CLICABLE -->
                <div onclick="abrirPerfilPublicoDetalle('${c.user_id}')" style="cursor: pointer; width: 32px; height: 32px; border-radius: 50%; overflow: hidden; background: var(--color-acento); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: bold; color: #000; flex-shrink: 0; border: 1px solid var(--color-acento);">
                    ${avatarUrl 
                        ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;">` 
                        : `<span>${inicial}</span>`}
                </div>

                <!-- CONTENIDO DEL COMENTARIO -->
                <div style="flex-grow: 1;">
                    <div class="comentario-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span onclick="abrirPerfilPublicoDetalle('${c.user_id}')" class="comentario-autor" style="cursor: pointer; color: #fff; font-weight: bold; font-size: 0.88rem;">
                            ${moteLimpio}
                        </span>
                        <span class="comentario-fecha" style="font-size: 0.72rem; color: #777;">${fecha}</span>
                    </div>

                    <div class="comentario-texto" style="font-size: 0.85rem; color: #ddd; line-height: 1.4; margin-bottom: 8px;">
                        ${c.comentario}
                    </div>

                    <div class="comentario-footer" style="display: flex; justify-content: space-between; align-items: center;">
                        <button class="btn-like-comentario ${dioLike ? 'liked' : ''}" onclick="toggleLikeComentario('${c.id}')">
                            ❤️ ${numLikes} Me gusta
                        </button>
                        <button class="btn-like-comentario" style="color: #ffaa00; font-size: 0.75rem;" onclick="abrirModalReporte('${c.id}')" title="Denunciar comentario no pertinente">
                            🚩 Reportar
                        </button>
                    </div>
                </div>
            </div>
        `;
        box.appendChild(item);
    }
}

window.publicarComentario = async function(e) {
    e.preventDefault();
    if (!usuarioSesion) {
        alert("Debes iniciar sesión para dejar un comentario.");
        return;
    }

    const texto = document.getElementById('txt-nuevo-comentario').value.trim();
    if (!texto) return;

    const { data: profile } = await supabaseClient.from('profiles').select('mote').eq('id', usuarioSesion.id).maybeSingle();

    const nombrePublico = profile?.mote || usuarioSesion.email.split('@')[0];

    const { error } = await supabaseClient.from('blog_comentarios').insert([{
        blog_id: noticiaActualId,
        user_id: usuarioSesion.id,
        nombre_usuario: nombrePublico,
        comentario: texto
    }]);

    if (!error) {
        document.getElementById('txt-nuevo-comentario').value = '';
        cargarComentarios();
    }
};

window.toggleLikeComentario = async function(comentarioId) {
    if (!usuarioSesion) {
        alert("Debes iniciar sesión para reaccionar a los comentarios.");
        return;
    }

    const { data: existente } = await supabaseClient
        .from('blog_comentario_likes')
        .select('id')
        .eq('comentario_id', comentarioId)
        .eq('user_id', usuarioSesion.id)
        .maybeSingle();

    if (existente) {
        await supabaseClient.from('blog_comentario_likes').delete().eq('id', existente.id);
    } else {
        await supabaseClient.from('blog_comentario_likes').insert([{ comentario_id: comentarioId, user_id: usuarioSesion.id }]);
    }

    cargarComentarios();
};

/* GESTIÓN DE REPORTES Y DENUNCIAS */
let comentarioIdAReportar = null;

window.abrirModalReporte = function(comentarioId) {
    if (!usuarioSesion) {
        alert("Debes iniciar sesión para reportar un comentario.");
        return;
    }
    comentarioIdAReportar = comentarioId;

    let modalReport = document.getElementById('modal-reporte-comentario');
    if (!modalReport) {
        const modalHTML = `
        <div id="modal-reporte-comentario" class="modal-interno" style="display: none;">
            <div class="modal-contenido perfil-modal-box" style="max-width: 450px;">
                <button class="cerrar-modal" onclick="cerrarModalReporte()">&times;</button>
                <h3 class="protocolo-titulo" style="margin-bottom: 15px; color: #ffaa00;">🚩 Denunciar Comentario</h3>
                <p style="font-size: 0.85rem; color: #aaa; margin-bottom: 15px;">Indica el motivo por el cual este comentario debe ser revisado por la organización:</p>
                
                <form onsubmit="enviarDenunciaComentario(event)">
                    <div class="input-group">
                        <label>Motivo del Reporte</label>
                        <select id="reporte-motivo-select" required style="width: 100%; background: #161616; color: #fff; padding: 10px; border-radius: 6px; border: 1px solid rgba(212,175,55,0.3);">
                            <option value="Lenguaje ofensivo o insultos">Lenguaje ofensivo o insultos</option>
                            <option value="Acoso o desacreditación personal">Acoso o desacreditación personal</option>
                            <option value="Contenido no pertinente o spam">Contenido no pertinente o spam</option>
                            <option value="Provocación / Falta de respeto institucional">Provocación / Falta de respeto</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-tuna-ui full-width" style="margin-top: 15px;">Enviar Reporte</button>
                </form>
                <div id="reporte-status-msg" class="mensaje-estado" style="margin-top: 10px;"></div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modalReport = document.getElementById('modal-reporte-comentario');
    }
    modalReport.style.display = 'flex';
};

window.cerrarModalReporte = function() {
    const modal = document.getElementById('modal-reporte-comentario');
    if (modal) modal.style.display = 'none';
};

window.enviarDenunciaComentario = async function(e) {
    e.preventDefault();
    const status = document.getElementById('reporte-status-msg');
    status.innerText = "Enviando reporte...";

    const motivo = document.getElementById('reporte-motivo-select').value;

    const { error } = await supabaseClient.from('blog_denuncias').insert([{
        comentario_id: comentarioIdAReportar,
        blog_id: noticiaActualId,
        denunciante_id: usuarioSesion.id,
        motivo: motivo
    }]);

    if (error) {
        if (error.code === '23505') {
            status.innerText = "Ya has reportado este comentario previamente.";
        } else {
            status.innerText = "Error enviando el reporte: " + error.message;
        }
    } else {
        status.innerText = "¡Reporte enviado! La organización revisará el contenido.";
        status.style.color = "#2ecc71";
        setTimeout(cerrarModalReporte, 1500);
    }
};