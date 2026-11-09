/* ==========================================================================
   CONTROLADOR DE JUSACALLES (SVGs NATIVOS & DESGLOSE DE REACCIONES DE RED)
   ========================================================================== */

let pressTimer = null;
let pressTimerComment = null;
let archivosAdjuntosSubir = [];
let tipoAdjuntoMedia = null; 
const comentariosVisiblesEstado = {};

let lightboxGallery = [];
let lightboxCurrentIndex = 0;
let postActivoEnLightbox = null;
let miUsuarioPerfilCache = null;
let datosReaccionesModalActual = [];

let hoverTimerPost = null;
let hoverTimerComment = null;

// ESTADO GLOBAL DE HISTORIAS
let historiasActivasGlobal = [];
let historiaIndiceActual = 0;
let historiaTimerProgreso = null;

// COLECCIÓN DE ICONOS VECTORIALES SVG (REACCIONES Y UI)
const SVG_ICONS = {
    like: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>`,
    comment: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    share: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
    camera: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`
};

const SVG_REACTIONS = {
    me_gusta: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#3578E5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>`,
    me_encanta: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#F33E58"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    me_divierte: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#F7B125"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#000" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="9" r="1.5" fill="#000"/><circle cx="15" cy="9" r="1.5" fill="#000"/></svg>`,
    me_asombra: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#F7B125"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="15" r="2" fill="#000"/><circle cx="8.5" cy="9.5" r="1.5" fill="#000"/><circle cx="15.5" cy="9.5" r="1.5" fill="#000"/></svg>`,
    me_entristece: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#F7B125"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-1.5-4-1.5-4 1.5-4 1.5" stroke="#000" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="9" r="1.5" fill="#000"/><circle cx="15" cy="9" r="1.5" fill="#000"/><path d="M7.5 13.5c.5 1 1.5 1.5 1.5 1.5" stroke="#3578E5" stroke-width="1.5"/></svg>`,
    me_enfada: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#E41E3F"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5-1.5 4-1.5 4 1.5 4 1.5" stroke="#000" stroke-width="2" stroke-linecap="round"/><path d="M6 8l4 2M18 8l-4 2" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>`
};

const NOMBRES_REACCIONES = {
    me_gusta: { texto: 'Me gusta', color: '#3578E5' },
    me_encanta: { texto: 'Me encanta', color: '#F33E58' },
    me_divierte: { texto: 'Me divierte', color: '#F7B125' },
    me_asombra: { texto: 'Me asombra', color: '#F7B125' },
    me_entristece: { texto: 'Me entristece', color: '#F7B125' },
    me_enfada: { texto: 'Me enfada', color: '#E41E3F' }
};

document.addEventListener('DOMContentLoaded', () => {
    comprobarEstadoSesionJusacalles();
    cargarHistoriasActivas();
    cargarMuroPublicaciones();
    inicializarEventosGlobales();
});

function inicializarEventosGlobales() {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.jusa-reaction-container')) {
            document.querySelectorAll('.jusa-reactions-popover').forEach(p => p.style.display = 'none');
        }
    });

    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('jusa-lightbox-modal');
        if (modal && modal.style.display === 'flex') {
            if (e.key === 'Escape') {
                const subModal = document.getElementById('jusa-post-detail-modal');
                if (subModal && subModal.style.display === 'flex') {
                    cerrarSubModalVerPublicacion();
                } else {
                    cerrarLightboxModal();
                }
            }
            if (e.key === 'ArrowLeft') cambiarImagenLightbox(-1);
            if (e.key === 'ArrowRight') cambiarImagenLightbox(1);
        }

        const modalStory = document.getElementById('jusa-stories-viewer-modal');
        if (modalStory && modalStory.style.display === 'block') {
            if (e.key === 'Escape') cerrarVisorHistorias();
            if (e.key === 'ArrowLeft') historiaNavegar(-1);
            if (e.key === 'ArrowRight') historiaNavegar(1);
        }
    });
}

async function comprobarEstadoSesionJusacalles() {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    const cajonPost = document.getElementById('cajon-crear-post');
    const avisoNoLogged = document.getElementById('aviso-jusacalles-no-logged');
    const cardHistoriaBtn = document.getElementById('btn-anadir-historia-card');

    if (session && session.user) {
        if (cajonPost) cajonPost.style.display = 'block';
        if (avisoNoLogged) avisoNoLogged.style.display = 'none';
        if (cardHistoriaBtn) cardHistoriaBtn.style.display = 'block';

        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('mote, avatar_url, tuna_nombre')
            .eq('id', session.user.id)
            .maybeSingle();

        miUsuarioPerfilCache = profile || { mote: session.user.email || 'Tuno' };
        const mote = miUsuarioPerfilCache.mote;
        const inicial = mote.charAt(0).toUpperCase();
        
        const inicialTxt = document.getElementById('card-historia-inicial');
        const imgAvatar = document.getElementById('card-historia-img');
        const postAvatarBox = document.getElementById('post-user-avatar');

        if (profile && profile.avatar_url && profile.avatar_url.trim() !== '') {
            if (imgAvatar) { imgAvatar.src = profile.avatar_url; imgAvatar.style.display = 'block'; }
            if (inicialTxt) inicialTxt.style.display = 'none';
            if (postAvatarBox) {
                postAvatarBox.innerHTML = `<img src="${profile.avatar_url}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            }
        } else {
            if (imgAvatar) imgAvatar.style.display = 'none';
            if (inicialTxt) { inicialTxt.innerText = inicial; inicialTxt.style.display = 'block'; }
            if (postAvatarBox) { postAvatarBox.innerText = inicial; }
        }
    } else {
        if (cajonPost) cajonPost.style.display = 'none';
        if (avisoNoLogged) avisoNoLogged.style.display = 'block';
        if (cardHistoriaBtn) cardHistoriaBtn.style.display = 'none';
    }
}

/* --- MANEJO DE ARCHIVOS Y COMPRESIÓN --- */
window.manejarArchivosSeleccionados = function(e, modo) {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    archivosAdjuntosSubir = files;
    document.getElementById('post-tipo-subida').value = modo;

    const previewContainer = document.getElementById('preview-multimedia-container');
    const previewImg = document.getElementById('preview-img');
    const previewVideo = document.getElementById('preview-video');

    const firstFile = files[0];
    const fileURL = URL.createObjectURL(firstFile);
    previewContainer.style.display = 'block';

    if (firstFile.type.startsWith('image/')) {
        tipoAdjuntoMedia = 'imagen';
        previewImg.src = fileURL;
        previewImg.style.display = 'block';
        previewVideo.style.display = 'none';
    } else if (firstFile.type.startsWith('video/')) {
        tipoAdjuntoMedia = 'video';
        previewVideo.src = fileURL;
        previewVideo.style.display = 'block';
        previewImg.style.display = 'none';
    }
};

window.cancelarMediaAdjunto = function() {
    archivosAdjuntosSubir = [];
    tipoAdjuntoMedia = null;
    document.getElementById('file-input-post').value = '';
    document.getElementById('file-input-reel').value = '';
    document.getElementById('preview-multimedia-container').style.display = 'none';
    document.getElementById('preview-img').src = '';
    document.getElementById('preview-video').src = '';
};

async function comprimirImagen(file, maxAncho = 1920, calidad = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let ancho = img.width;
                let alto = img.height;

                if (ancho > maxAncho) {
                    alto = Math.round((alto * maxAncho) / ancho);
                    ancho = maxAncho;
                }

                const canvas = document.createElement('canvas');
                canvas.width = ancho;
                canvas.height = alto;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, ancho, alto);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const fileComprimido = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(fileComprimido);
                    } else {
                        reject(new Error("Error Canvas"));
                    }
                }, 'image/jpeg', calidad);
            };
            img.onerror = (err) => reject(err);
            img.src = event.target.result;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

/* --- HISTORIAS 24H CON TARJETAS VERTICALES Y VISOR MODAL ESTILO FACEBOOK --- */
async function cargarHistoriasActivas() {
    const contenedor = document.getElementById('lista-historias-items');
    if (!contenedor || !supabaseClient) return;

    const { data: historias, error } = await supabaseClient
        .from('jusa_historias')
        .select('*, profiles(mote, avatar_url, tuna_nombre)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

    if (error || !historias || historias.length === 0) {
        contenedor.innerHTML = '<span style="color:#666; font-size:0.75rem; padding: 15px 0;">No hay historias activas hoy.</span>';
        historiasActivasGlobal = [];
        return;
    }

    historiasActivasGlobal = historias;

    contenedor.innerHTML = historias.map((h, idx) => {
        const mote = h.profiles?.mote || 'Tuno';
        const inicial = mote.charAt(0).toUpperCase();
        const avatarUrl = h.profiles?.avatar_url;

        const avatarInner = (avatarUrl && avatarUrl.trim() !== '')
            ? `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
            : `<span style="font-weight:bold; color:#000; font-size:0.8rem;">${inicial}</span>`;

        const esVideo = h.tipo_media === 'video' || (h.media_url && h.media_url.match(/\.(mp4|webm|mov)$/i));
        const mediaBg = esVideo 
            ? `<video src="${h.media_url}" style="width:100%; height:100%; object-fit:cover;"></video>`
            : `<img src="${h.media_url}" style="width:100%; height:100%; object-fit:cover;">`;

        return `
            <div onclick="abrirVisorHistoriasModal(${idx})" style="width: 110px; height: 170px; border-radius: 12px; overflow: hidden; background: #000; position: relative; cursor: pointer; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: 1px solid rgba(212,175,55,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                ${mediaBg}
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);"></div>
                
                <div style="position: absolute; top: 10px; left: 10px; width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--color-acento, #d4af37); background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; z-index: 2;">
                    ${avatarInner}
                </div>

                <div style="position: absolute; bottom: 10px; left: 8px; right: 8px; z-index: 2;">
                    <span style="font-size: 0.78rem; font-weight: bold; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.9); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${mote}</span>
                </div>
            </div>
        `;
    }).join('');
}

/* --- LOGICA VISOR MODAL DE HISTORIAS --- */
window.abrirVisorHistoriasModal = function(index) {
    if (!historiasActivasGlobal || historiasActivasGlobal.length === 0) return;

    historiaIndiceActual = index;
    const modal = document.getElementById('jusa-stories-viewer-modal');
    if (modal) modal.style.display = 'block';

    renderizarSidebarHistoriasVisor();
    cargarHistoriaEnVisor(historiaIndiceActual);
};

function renderizarSidebarHistoriasVisor() {
    const container = document.getElementById('story-sidebar-items');
    if (!container) return;

    container.innerHTML = historiasActivasGlobal.map((h, idx) => {
        const mote = h.profiles?.mote || 'Tuno';
        const inicial = mote.charAt(0).toUpperCase();
        const avatarUrl = h.profiles?.avatar_url;
        const esActiva = idx === historiaIndiceActual;

        const avatarInner = (avatarUrl && avatarUrl.trim() !== '')
            ? `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
            : `<span style="font-weight:bold; color:#000; font-size:0.75rem;">${inicial}</span>`;

        return `
            <div onclick="cargarHistoriaEnVisor(${idx})" style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; cursor: pointer; background: ${esActiva ? 'rgba(212,175,55,0.15)' : 'transparent'}; border: 1px solid ${esActiva ? 'rgba(212,175,55,0.4)' : 'transparent'}; transition: background 0.2s;">
                <div style="width: 42px; height: 42px; border-radius: 50%; border: 2px solid ${esActiva ? 'var(--color-acento, #d4af37)' : '#555'}; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                    ${avatarInner}
                </div>
                <div style="overflow: hidden;">
                    <span style="font-size: 0.88rem; font-weight: bold; color: ${esActiva ? 'var(--color-acento, #d4af37)' : '#fff'}; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${mote}</span>
                    <span style="font-size: 0.72rem; color: #888;">${h.profiles?.tuna_nombre || 'Tuna Universitaria'}</span>
                </div>
            </div>
        `;
    }).join('');
}

function cargarHistoriaEnVisor(index) {
    if (index < 0 || index >= historiasActivasGlobal.length) {
        cerrarVisorHistorias();
        return;
    }

    historiaIndiceActual = index;
    renderizarSidebarHistoriasVisor();

    const historia = historiasActivasGlobal[index];
    const mote = historia.profiles?.mote || 'Tuno';
    const inicial = mote.charAt(0).toUpperCase();
    const avatarUrl = historia.profiles?.avatar_url;

    // Actualizar Cabecera
    const authorAvatar = document.getElementById('story-author-avatar');
    const authorName = document.getElementById('story-author-name');
    const timeAgo = document.getElementById('story-time-ago');

    if (authorAvatar) {
        authorAvatar.innerHTML = (avatarUrl && avatarUrl.trim() !== '')
            ? `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;">`
            : `<span style="color:#000;">${inicial}</span>`;
    }
    if (authorName) authorName.innerText = mote;
    if (timeAgo) timeAgo.innerText = new Date(historia.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // Cargar Media
    const imgDisplay = document.getElementById('story-display-img');
    const videoDisplay = document.getElementById('story-display-video');

    if (historiaTimerProgreso) clearInterval(historiaTimerProgreso);
    const fillBar = document.getElementById('story-progress-fill');
    if (fillBar) fillBar.style.width = '0%';

    const esVideo = historia.tipo_media === 'video' || (historia.media_url && historia.media_url.match(/\.(mp4|webm|mov)$/i));

    if (esVideo) {
        imgDisplay.style.display = 'none';
        videoDisplay.style.display = 'block';
        videoDisplay.src = historia.media_url;
        videoDisplay.play();

        videoDisplay.onended = () => historiaNavegar(1);
    } else {
        videoDisplay.style.display = 'none';
        videoDisplay.pause();
        imgDisplay.style.display = 'block';
        imgDisplay.src = historia.media_url;

        let porcentaje = 0;
        historiaTimerProgreso = setInterval(() => {
            porcentaje += 2;
            if (fillBar) fillBar.style.width = `${porcentaje}%`;
            if (porcentaje >= 100) {
                clearInterval(historiaTimerProgreso);
                historiaNavegar(1);
            }
        }, 100);
    }
}

window.historiaNavegar = function(direccion) {
    cargarHistoriaEnVisor(historiaIndiceActual + direccion);
};

window.cerrarVisorHistorias = function() {
    if (historiaTimerProgreso) clearInterval(historiaTimerProgreso);
    const videoDisplay = document.getElementById('story-display-video');
    if (videoDisplay) videoDisplay.pause();

    const modal = document.getElementById('jusa-stories-viewer-modal');
    if (modal) modal.style.display = 'none';
};

window.enviarReaccionHistoria = function(tipo) {
    alert("¡Reacción enviada a la historia!");
};

window.abrirModalNuevaHistoria = function() {
    const input = document.getElementById('file-input-historia');
    if (input) input.click();
};

window.subirHistoriaDesdeGaleria = async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert("Debes iniciar sesión para publicar historias.");
        return;
    }

    const cardHistoriaBtn = document.getElementById('btn-anadir-historia-card');
    const originalContent = cardHistoriaBtn ? cardHistoriaBtn.innerHTML : '';
    if (cardHistoriaBtn) cardHistoriaBtn.innerText = "Subiendo...";

    try {
        let fileASubir = file;
        const esVideo = file.type.startsWith('video/');
        const tipoMedia = esVideo ? 'video' : 'imagen';

        if (!esVideo && file.type.startsWith('image/')) {
            fileASubir = await comprimirImagen(file);
        }

        const ext = esVideo ? file.name.split('.').pop() : 'jpg';
        const fileName = `story_${session.user.id}_${Date.now()}.${ext}`;
        const filePath = `historias/${fileName}`;

        const { error: upErr } = await supabaseClient.storage
            .from('jusacalles-media')
            .upload(filePath, fileASubir);

        if (upErr) throw upErr;

        const { data: pubData } = supabaseClient.storage
            .from('jusacalles-media')
            .getPublicUrl(filePath);

        const { error: insErr } = await supabaseClient
            .from('jusa_historias')
            .insert([{
                user_id: session.user.id,
                media_url: pubData.publicUrl,
                tipo_media: tipoMedia
            }]);

        if (insErr) throw insErr;

        await cargarHistoriasActivas();
    } catch (err) {
        alert("Error al subir la historia: " + err.message);
    } finally {
        if (cardHistoriaBtn) cardHistoriaBtn.innerHTML = originalContent;
        e.target.value = '';
    }
};

/* --- RENDERIZADO DEL MOSAICO --- */
function generarHTMLMosaico(imagenes, postId) {
    if (!imagenes || imagenes.length === 0) return '';

    const count = imagenes.length;
    const gridClass = `jusa-mosaic-${Math.min(count, 5)}`;
    const itemsAMostrar = imagenes.slice(0, 5);

    const itemsHTML = itemsAMostrar.map((url, idx) => {
        const esUltimoYHayMas = (idx === 4 && count > 5);
        const overlay = esUltimoYHayMas ? `<div class="jusa-mosaic-more-overlay">+${count - 5}</div>` : '';
        const escapedUrls = JSON.stringify(imagenes).replace(/"/g, '&quot;');

        return `
            <div class="jusa-mosaic-item" onclick="abrirLightboxModal('${postId}', ${idx}, ${escapedUrls})">
                <img src="${url}" loading="lazy">
                ${overlay}
            </div>
        `;
    }).join('');

    return `<div class="jusa-mosaic-grid ${gridClass}">${itemsHTML}</div>`;
}

/* --- MURO PASAFEED ESTILO FACEBOOK --- */
async function cargarMuroPublicaciones() {
    const muro = document.getElementById('muro-publicaciones-lista');
    if (!muro || !supabaseClient) return;

    const { data: posts, error } = await supabaseClient
        .from('jusa_publicaciones')
        .select(`
            *,
            profiles(mote, tuna_nombre, avatar_url),
            jusa_comentarios(
                id, comentario, imagen_url, parent_id, created_at, 
                profiles(mote, avatar_url)
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error al cargar publicaciones:", error);
        muro.innerHTML = '<p style="color:#ff5555; text-align:center;">Error al cargar publicaciones.</p>';
        return;
    }

    if (!posts || posts.length === 0) {
        muro.innerHTML = '<p style="color:#777; text-align:center; padding: 20px;">Aún no hay publicaciones en Jusacalles. ¡Sé el primero!</p>';
        return;
    }

    const postIds = posts.map(p => p.id);
    const todosComentariosIds = posts.flatMap(p => (p.jusa_comentarios || []).map(c => c.id));

    let reaccionesPostMap = {};
    if (postIds.length > 0) {
        const { data: reacPosts, error: errReac } = await supabaseClient
            .from('jusa_reacciones')
            .select('publicacion_id, tipo_reaccion, user_id')
            .in('publicacion_id', postIds);

        if (!errReac && reacPosts) {
            const userIdsReac = [...new Set(reacPosts.map(r => r.user_id))];
            let perfilesMap = {};
            if (userIdsReac.length > 0) {
                const { data: perfData } = await supabaseClient
                    .from('profiles')
                    .select('id, mote, avatar_url')
                    .in('id', userIdsReac);
                if (perfData) {
                    perfData.forEach(p => perfilesMap[p.id] = p);
                }
            }

            reacPosts.forEach(r => {
                if (!reaccionesPostMap[r.publicacion_id]) reaccionesPostMap[r.publicacion_id] = [];
                reaccionesPostMap[r.publicacion_id].push({
                    ...r,
                    profiles: perfilesMap[r.user_id] || { mote: 'Tuno', avatar_url: null }
                });
            });
        }
    }

    let reaccionesComentariosMap = {};
    if (todosComentariosIds.length > 0) {
        const { data: comReacciones, error: errComReac } = await supabaseClient
            .from('jusa_comentarios_reacciones')
            .select('comentario_id, tipo_reaccion, user_id')
            .in('comentario_id', todosComentariosIds);

        if (!errComReac && comReacciones) {
            const userIdsComReac = [...new Set(comReacciones.map(r => r.user_id))];
            let perfilesComMap = {};
            if (userIdsComReac.length > 0) {
                const { data: perfComData } = await supabaseClient
                    .from('profiles')
                    .select('id, mote, avatar_url')
                    .in('id', userIdsComReac);
                if (perfComData) {
                    perfComData.forEach(p => perfilesComMap[p.id] = p);
                }
            }

            comReacciones.forEach(r => {
                if (!reaccionesComentariosMap[r.comentario_id]) reaccionesComentariosMap[r.comentario_id] = [];
                reaccionesComentariosMap[r.comentario_id].push({
                    ...r,
                    profiles: perfilesComMap[r.user_id] || { mote: 'Tuno', avatar_url: null }
                });
            });
        }
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    const currentUserId = session?.user?.id;

    muro.innerHTML = posts.map(post => {
        const mote = post.profiles?.mote || 'Tuno';
        const tuna = post.profiles?.tuna_nombre || 'Tuna Universitaria';
        const inicial = mote.charAt(0).toUpperCase();
        const avatarUrl = post.profiles?.avatar_url;

        const avatarHTML = (avatarUrl && avatarUrl.trim() !== '')
            ? `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
            : `<span style="font-weight:bold; color:#000;">${inicial}</span>`;

        const reacciones = reaccionesPostMap[post.id] || [];
        const totalReacciones = reacciones.length;
        const miReaccionObj = reacciones.find(r => r.user_id === currentUserId);
        const miReaccion = miReaccionObj?.tipo_reaccion;

        const tiposUnicos = [...new Set(reacciones.map(r => r.tipo_reaccion))];
        const burbujasHTML = tiposUnicos.map(t => SVG_REACTIONS[t] || SVG_REACTIONS.me_gusta).join('');

        let btnInfo = NOMBRES_REACCIONES[miReaccion] || { texto: 'Me gusta', color: '#ccc' };

        let listaImagenes = [];
        if (post.imagenes_urls && post.imagenes_urls.length > 0) {
            listaImagenes = post.imagenes_urls;
        } else if (post.imagen_url) {
            listaImagenes = [post.imagen_url];
        }

        let mediaHTML = generarHTMLMosaico(listaImagenes, post.id);
        if (!mediaHTML && post.video_url) {
            mediaHTML = `<div style="margin-top: 10px; border-radius: 8px; overflow: hidden; background:#000;"><video src="${post.video_url}" controls style="width:100%; max-height: 420px;"></video></div>`;
        }

        const todosComentarios = post.jusa_comentarios || [];
        const comentariosPadre = todosComentarios.filter(c => !c.parent_id);
        const estaExpandido = comentariosVisiblesEstado[post.id] || false;
        const comentariosAMostrar = estaExpandido ? comentariosPadre : comentariosPadre.slice(0, 1);

        const renderComentarioConRespuestas = (c, esHijo = false) => {
            const cMote = c.profiles?.mote || 'Tuno';
            const cInicial = cMote.charAt(0).toUpperCase();
            const cAvatar = c.profiles?.avatar_url;
            const cAvatarHTML = (cAvatar && cAvatar.trim() !== '')
                ? `<img src="${cAvatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
                : `<span style="font-weight:bold; color:#000; font-size:0.75rem;">${cInicial}</span>`;

            const fotoComentario = c.imagen_url 
                ? `<div style="margin-top:6px; border-radius:6px; overflow:hidden; max-width:220px;" onclick="abrirLightboxModal('${post.id}', 0, ['${c.imagen_url}'])"><img src="${c.imagen_url}" style="width:100%; display:block; max-height:180px; object-fit:cover; cursor:pointer;"></div>` 
                : '';

            const cReacciones = reaccionesComentariosMap[c.id] || [];
            const miReaccionCommentObj = cReacciones.find(r => r.user_id === currentUserId);
            const miReaccionComment = miReaccionCommentObj?.tipo_reaccion;
            const countCommentReacciones = cReacciones.length;

            const cInfo = NOMBRES_REACCIONES[miReaccionComment] || { texto: 'Me gusta', color: '#aaa' };

            const escapedCReacciones = JSON.stringify(cReacciones).replace(/"/g, '&quot;');
            const cBurbujaHTML = countCommentReacciones > 0 
                ? `<div onclick="abrirModalReaccionesDetalle(${escapedCReacciones})" style="cursor:pointer; display:inline-flex; align-items:center; gap:3px; background:rgba(255,255,255,0.08); padding:2px 6px; border-radius:10px;">
                     ${SVG_REACTIONS[cReacciones[0]?.tipo_reaccion] || SVG_REACTIONS.me_gusta}
                     <span style="font-size:0.72rem; color:#fff; font-weight:600;">${countCommentReacciones}</span>
                   </div>` 
                : '';

            const respuestasHijas = todosComentarios.filter(h => h.parent_id === c.id);
            const htmlHijas = respuestasHijas.map(h => renderComentarioConRespuestas(h, true)).join('');

            return `
                <div style="display:flex; gap:8px; margin-top:8px; align-items:flex-start; ${esHijo ? 'margin-left: 36px;' : ''}">
                    <div style="width:${esHijo?'24px':'30px'}; height:${esHijo?'24px':'30px'}; border-radius:50%; background:var(--color-acento,#d4af37); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                        ${cAvatarHTML}
                    </div>
                    <div style="flex-grow: 1;">
                        <div style="background: rgba(255,255,255,0.06); padding: 8px 12px; border-radius: 14px; display: inline-block; max-width: 90%;">
                            <strong style="color: var(--color-acento, #d4af37); font-size: 0.78rem;">${cMote}</strong>
                            <p style="margin: 2px 0 0 0; color: #ddd; font-size: 0.83rem; line-height: 1.35;">${c.comentario}</p>
                            ${fotoComentario}
                        </div>
                        
                        <div style="display:flex; gap:12px; align-items:center; margin-top:3px; margin-left:6px; font-size:0.72rem; color:#aaa;">
                            <div class="jusa-reaction-container" style="position:relative;"
                                 onmouseenter="mostrarReaccionesCommentHover('${c.id}')"
                                 onmouseleave="ocultarReaccionesCommentHover('${c.id}')">
                                
                                <div id="popover-comment-${c.id}" class="jusa-reactions-popover" style="bottom: 22px;"
                                     onmouseenter="mostrarReaccionesCommentHover('${c.id}')"
                                     onmouseleave="ocultarReaccionesCommentHover('${c.id}')">
                                    <span onclick="ejecutarReaccionComentario('${post.id}', '${c.id}', 'me_gusta')">${SVG_REACTIONS.me_gusta}</span>
                                    <span onclick="ejecutarReaccionComentario('${post.id}', '${c.id}', 'me_encanta')">${SVG_REACTIONS.me_encanta}</span>
                                    <span onclick="ejecutarReaccionComentario('${post.id}', '${c.id}', 'me_divierte')">${SVG_REACTIONS.me_divierte}</span>
                                    <span onclick="ejecutarReaccionComentario('${post.id}', '${c.id}', 'me_asombra')">${SVG_REACTIONS.me_asombra}</span>
                                    <span onclick="ejecutarReaccionComentario('${post.id}', '${c.id}', 'me_entristece')">${SVG_REACTIONS.me_entristece}</span>
                                    <span onclick="ejecutarReaccionComentario('${post.id}', '${c.id}', 'me_enfada')">${SVG_REACTIONS.me_enfada}</span>
                                </div>

                                <span onclick="clickReaccionComentarioPrincipal('${post.id}', '${c.id}', '${miReaccionComment || ''}')" 
                                      ontouchstart="touchStartCommentReaccion(event, '${c.id}')"
                                      ontouchend="touchEndCommentReaccion(event, '${post.id}', '${c.id}', '${miReaccionComment || ''}')"
                                      style="cursor:pointer; font-weight:600; color:${cInfo.color};">${cInfo.texto}</span>
                            </div>

                            <span onclick="mostrarCajaRespuesta('${post.id}', '${c.id}', '${cMote}')" style="cursor:pointer; font-weight:600;">Responder</span>
                            <span onclick="compartirPostExterno('${post.id}', '${cMote}')" style="cursor:pointer; font-weight:600;">Compartir</span>
                            ${cBurbujaHTML}
                        </div>

                        <div id="box-respuesta-${c.id}" style="display:none; margin-top:6px;"></div>
                        ${htmlHijas}
                    </div>
                </div>
            `;
        };

        const listaComentariosHTML = comentariosAMostrar.map(c => renderComentarioConRespuestas(c)).join('');

        const botonVerMas = (!estaExpandido && comentariosPadre.length > 1) 
            ? `<div onclick="toggleExpandirComentarios('${post.id}')" style="color:#2ec4b6; font-size:0.8rem; font-weight:600; cursor:pointer; margin-top:8px; padding: 2px 0;">Ver más comentarios (${comentariosPadre.length - 1})</div>`
            : (estaExpandido && comentariosPadre.length > 1) 
            ? `<div onclick="toggleExpandirComentarios('${post.id}')" style="color:#aaa; font-size:0.75rem; cursor:pointer; margin-top:8px;">Ocultar comentarios</div>`
            : '';

        const escapedPostReacciones = JSON.stringify(reacciones).replace(/"/g, '&quot;');

        return `
            <article class="post-card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(212,175,55,0.2); border-radius: 12px; padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                    <div style="width: 42px; height: 42px; border-radius: 50%; background: var(--color-acento, #d4af37); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                        ${avatarHTML}
                    </div>
                    <div>
                        <h4 style="margin: 0; color: #fff; font-size: 0.95rem;">"${mote}"</h4>
                        <span style="font-size: 0.72rem; color: var(--color-acento, #d4af37);">${tuna}</span>
                    </div>
                </div>

                <p style="color: #eee; font-size: 0.9rem; line-height: 1.45; margin: 0 0 10px 0;">${post.contenido || ''}</p>
                ${mediaHTML}

                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 4px 6px 4px; font-size: 0.8rem; color: #aaa;">
                    <div onclick="abrirModalReaccionesDetalle(${escapedPostReacciones})" style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                        ${burbujasHTML}
                        <span style="margin-left: 4px; font-weight: 600;">${totalReacciones > 0 ? totalReacciones : ''}</span>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <span>💬 ${comentariosPadre.length}</span>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 4px 0; margin-top: 4px;">
                    <div class="jusa-reaction-container" style="position: relative; flex: 1; text-align: center;"
                         onmouseenter="mostrarReaccionesHover('${post.id}')"
                         onmouseleave="ocultarReaccionesHover('${post.id}')">
                        
                        <div id="popover-${post.id}" class="jusa-reactions-popover"
                             onmouseenter="mostrarReaccionesHover('${post.id}')"
                             onmouseleave="ocultarReaccionesHover('${post.id}')">
                            <span onclick="ejecutarReaccion('${post.id}', 'me_gusta')">${SVG_REACTIONS.me_gusta}</span>
                            <span onclick="ejecutarReaccion('${post.id}', 'me_encanta')">${SVG_REACTIONS.me_encanta}</span>
                            <span onclick="ejecutarReaccion('${post.id}', 'me_divierte')">${SVG_REACTIONS.me_divierte}</span>
                            <span onclick="ejecutarReaccion('${post.id}', 'me_asombra')">${SVG_REACTIONS.me_asombra}</span>
                            <span onclick="ejecutarReaccion('${post.id}', 'me_entristece')">${SVG_REACTIONS.me_entristece}</span>
                            <span onclick="ejecutarReaccion('${post.id}', 'me_enfada')">${SVG_REACTIONS.me_enfada}</span>
                        </div>

                        <button class="jusa-action-btn" style="color: ${btnInfo.color}; gap: 6px;"
                                onclick="clickReaccionPrincipal('${post.id}', '${miReaccion || ''}')"
                                ontouchstart="touchStartReaccion(event, '${post.id}')"
                                ontouchend="touchEndReaccion(event, '${post.id}', '${miReaccion || ''}')">
                            ${miReaccion ? SVG_REACTIONS[miReaccion] : SVG_ICONS.like} ${btnInfo.texto}
                        </button>
                    </div>

                    <button class="jusa-action-btn" style="flex: 1; color: #ccc; gap: 6px;" onclick="focoComentario('${post.id}')">
                        ${SVG_ICONS.comment} Comentar
                    </button>

                    <button class="jusa-action-btn" style="flex: 1; color: #ccc; gap: 6px;" onclick="compartirPostExterno('${post.id}', '${mote}')">
                        ${SVG_ICONS.share} Compartir
                    </button>
                </div>

                <div style="margin-top: 10px;">
                    ${botonVerMas}
                    <div id="comentarios-list-${post.id}">
                        ${listaComentariosHTML}
                    </div>

                    <div style="display: flex; gap: 8px; margin-top: 10px; align-items: center; position: relative; width: 100%;">
                        <div style="position: relative; flex-grow: 1; display: flex; align-items: center;">
                            <input type="text" id="input-comentario-${post.id}" placeholder="Escribe un comentario..." 
                                   onkeypress="manejarKeyPressComentario(event, '${post.id}')"
                                   style="width: 100%; padding: 8px 40px 8px 14px; font-size: 0.83rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; color: #fff; outline: none;">
                            
                            <button type="button" onclick="document.getElementById('input-file-comment-${post.id}').click()" 
                                    title="Adjuntar foto"
                                    style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px;">
                                ${SVG_ICONS.camera}
                            </button>
                            <input type="file" id="input-file-comment-${post.id}" accept="image/*" style="display:none;" onchange="previewFotoComentario(event, '${post.id}')">
                        </div>

                        <button onclick="enviarComentario('${post.id}')" class="btn-tuna-ui" style="padding: 6px 14px; font-size: 0.78rem; border-radius: 16px; flex-shrink: 0;">Enviar</button>
                    </div>

                    <div id="preview-foto-comment-${post.id}" style="display:none; margin-top:6px; font-size:0.75rem; color:#d4af37;">
                        📷 Foto adjunta lista <span onclick="limpiarFotoComentario('${post.id}')" style="cursor:pointer; color:#ff5555; margin-left:6px;">✕</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

/* --- LÓGICA DEL MODAL DE DESGLOSE DE REACCIONES --- */
window.abrirModalReaccionesDetalle = function(listaReacciones) {
    if (!listaReacciones || listaReacciones.length === 0) return;

    datosReaccionesModalActual = listaReacciones;
    const modal = document.getElementById('jusa-modal-reacciones-detalle');
    const tabsContainer = document.getElementById('tabs-filtro-reacciones');

    const tiposExistentes = [...new Set(listaReacciones.map(r => r.tipo_reaccion))];

    let tabsHTML = `<button onclick="filtrarReaccionesModal('todas')" class="tab-reaccion-btn active" style="padding:4px 10px; background:rgba(212,175,55,0.2); border:1px solid #d4af37; border-radius:12px; color:#fff; font-size:0.78rem; cursor:pointer;">Todas (${listaReacciones.length})</button>`;
    
    tiposExistentes.forEach(tipo => {
        const cant = listaReacciones.filter(r => r.tipo_reaccion === tipo).length;
        tabsHTML += `
            <button onclick="filtrarReaccionesModal('${tipo}')" class="tab-reaccion-btn" style="padding:4px 10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:#fff; font-size:0.78rem; cursor:pointer; display:flex; align-items:center; gap:4px;">
                ${SVG_REACTIONS[tipo]} ${cant}
            </button>
        `;
    });

    if (tabsContainer) tabsContainer.innerHTML = tabsHTML;
    filtrarReaccionesModal('todas');

    if (modal) modal.style.display = 'flex';
};

window.filtrarReaccionesModal = function(tipoFiltro) {
    const listaContainer = document.getElementById('lista-usuarios-reacciones-modal');
    if (!listaContainer) return;

    const filtrados = (tipoFiltro === 'todas') 
        ? datosReaccionesModalActual 
        : datosReaccionesModalActual.filter(r => r.tipo_reaccion === tipoFiltro);

    listaContainer.innerHTML = filtrados.map(r => {
        const uMote = r.profiles?.mote || 'Tuno';
        const uInicial = uMote.charAt(0).toUpperCase();
        const uAvatar = r.profiles?.avatar_url;

        const avatarHTML = (uAvatar && uAvatar.trim() !== '')
            ? `<img src="${uAvatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`
            : `<span style="font-weight:bold; color:#000;">${uInicial}</span>`;

        return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 8px 6px; border-bottom: 1px solid rgba(255,255,255,0.04); width: 100%; box-sizing: border-box;">
                <div style="display:flex; align-items:center; gap:12px; overflow:hidden;">
                    <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--color-acento, #d4af37); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                        ${avatarHTML}
                    </div>
                    <span style="color:#fff; font-weight:600; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">"${uMote}"</span>
                </div>
                <div style="flex-shrink: 0; display:flex; align-items:center; justify-content:center; margin-left: 8px;">
                    ${SVG_REACTIONS[r.tipo_reaccion] || SVG_REACTIONS.me_gusta}
                </div>
            </div>
        `;
    }).join('');
};

window.cerrarModalReaccionesDetalle = function() {
    const modal = document.getElementById('jusa-modal-reacciones-detalle');
    if (modal) modal.style.display = 'none';
};

/* --- REACCIONES EN COMENTARIOS --- */
window.mostrarReaccionesCommentHover = function(commentId) {
    if (window.innerWidth > 768) {
        if (hoverTimerComment) clearTimeout(hoverTimerComment);
        const pop = document.getElementById(`popover-comment-${commentId}`);
        if (pop) pop.style.display = 'flex';
    }
};

window.ocultarReaccionesCommentHover = function(commentId) {
    if (window.innerWidth > 768) {
        hoverTimerComment = setTimeout(() => {
            const pop = document.getElementById(`popover-comment-${commentId}`);
            if (pop) pop.style.display = 'none';
        }, 300);
    }
};

window.touchStartCommentReaccion = function(e, commentId) {
    pressTimerComment = setTimeout(() => {
        const pop = document.getElementById(`popover-comment-${commentId}`);
        if (pop) pop.style.display = 'flex';
    }, 450);
};

window.touchEndCommentReaccion = function(e, postId, commentId, reaccionActual) {
    if (pressTimerComment) clearTimeout(pressTimerComment);
    const pop = document.getElementById(`popover-comment-${commentId}`);
    if (pop && pop.style.display !== 'flex') {
        if (reaccionActual) {
            quitarReaccionComentario(postId, commentId);
        } else {
            ejecutarReaccionComentario(postId, commentId, 'me_gusta');
        }
    }
};

window.clickReaccionComentarioPrincipal = function(postId, commentId, reaccionActual) {
    if (window.innerWidth > 768) {
        if (reaccionActual) {
            quitarReaccionComentario(postId, commentId);
        } else {
            ejecutarReaccionComentario(postId, commentId, 'me_gusta');
        }
    }
};

window.ejecutarReaccionComentario = async function(postId, commentId, tipoReaccion) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { error } = await supabaseClient.from('jusa_comentarios_reacciones').upsert({
        comentario_id: commentId,
        user_id: session.user.id,
        tipo_reaccion: tipoReaccion
    }, { onConflict: 'comentario_id, user_id' });

    if (!error) cargarMuroPublicaciones();
};

async function quitarReaccionComentario(postId, commentId) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { error } = await supabaseClient.from('jusa_comentarios_reacciones')
        .delete()
        .eq('comentario_id', commentId)
        .eq('user_id', session.user.id);

    if (!error) cargarMuroPublicaciones();
}

/* --- REACCIONES EN POSTS --- */
window.mostrarReaccionesHover = function(postId) {
    if (window.innerWidth > 768) {
        if (hoverTimerPost) clearTimeout(hoverTimerPost);
        const pop = document.getElementById(`popover-${postId}`);
        if (pop) pop.style.display = 'flex';
    }
};

window.ocultarReaccionesHover = function(postId) {
    if (window.innerWidth > 768) {
        hoverTimerPost = setTimeout(() => {
            const pop = document.getElementById(`popover-${postId}`);
            if (pop) pop.style.display = 'none';
        }, 300);
    }
};

window.clickReaccionPrincipal = function(postId, reaccionActual) {
    if (window.innerWidth > 768) {
        if (reaccionActual) {
            quitarReaccion(postId);
        } else {
            ejecutarReaccion(postId, 'me_gusta');
        }
    }
};

window.touchStartReaccion = function(e, postId) {
    pressTimer = setTimeout(() => {
        const pop = document.getElementById(`popover-${postId}`);
        if (pop) pop.style.display = 'flex';
    }, 450);
};

window.touchEndReaccion = function(e, postId, reaccionActual) {
    if (pressTimer) clearTimeout(pressTimer);
    const pop = document.getElementById(`popover-${postId}`);
    if (pop && pop.style.display !== 'flex') {
        if (reaccionActual) {
            quitarReaccion(postId);
        } else {
            ejecutarReaccion(postId, 'me_gusta');
        }
    }
};

window.ejecutarReaccion = async function(postId, tipoReaccion) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        if (typeof abrirModalAuth === 'function') abrirModalAuth('login');
        return;
    }

    const { error } = await supabaseClient.from('jusa_reacciones').upsert({
        publicacion_id: postId,
        user_id: session.user.id,
        tipo_reaccion: tipoReaccion
    }, { onConflict: 'publicacion_id, user_id' });

    if (!error) cargarMuroPublicaciones();
};

async function quitarReaccion(postId) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { error } = await supabaseClient.from('jusa_reacciones')
        .delete()
        .eq('publicacion_id', postId)
        .eq('user_id', session.user.id);

    if (!error) cargarMuroPublicaciones();
}

/* --- LIGHTBOX Y PUBLICACIÓN --- */
window.abrirLightboxModal = async function(postId, indexIndex, galleryArray) {
    lightboxGallery = galleryArray || [];
    lightboxCurrentIndex = indexIndex || 0;
    
    const modal = document.getElementById('jusa-lightbox-modal');
    if (!modal) return;

    modal.style.display = 'flex';
    actualizarVistaLightbox();

    const { data: post } = await supabaseClient
        .from('jusa_publicaciones')
        .select(`
            *,
            profiles(mote, tuna_nombre, avatar_url),
            jusa_reacciones(tipo_reaccion, user_id, profiles(mote, avatar_url)),
            jusa_comentarios(
                id, comentario, imagen_url, parent_id, created_at, 
                profiles(mote, avatar_url),
                jusa_comentarios_reacciones(tipo_reaccion, user_id, profiles(mote, avatar_url))
            )
        `)
        .eq('id', postId)
        .single();

    postActivoEnLightbox = post;
    renderizarBarraLateralLightbox(post);
};

function actualizarVistaLightbox() {
    const imgDisplay = document.getElementById('lb-img-display');
    const btnPrev = document.getElementById('lb-btn-prev');
    const btnNext = document.getElementById('lb-btn-next');

    if (imgDisplay && lightboxGallery.length > 0) {
        imgDisplay.src = lightboxGallery[lightboxCurrentIndex];
    }

    if (btnPrev) btnPrev.style.display = lightboxGallery.length > 1 ? 'flex' : 'none';
    if (btnNext) btnNext.style.display = lightboxGallery.length > 1 ? 'flex' : 'none';
}

window.cambiarImagenLightbox = function(direccion) {
    if (lightboxGallery.length <= 1) return;
    lightboxCurrentIndex = (lightboxCurrentIndex + direccion + lightboxGallery.length) % lightboxGallery.length;
    actualizarVistaLightbox();
};

window.cerrarLightboxModal = function() {
    const modal = document.getElementById('jusa-lightbox-modal');
    if (modal) modal.style.display = 'none';
};

function renderizarBarraLateralLightbox(post) {
    if (!post) return;

    const lbLoggedAvatar = document.getElementById('lb-logged-user-avatar');
    if (lbLoggedAvatar && miUsuarioPerfilCache) {
        if (miUsuarioPerfilCache.avatar_url && miUsuarioPerfilCache.avatar_url.trim() !== '') {
            lbLoggedAvatar.innerHTML = `<img src="${miUsuarioPerfilCache.avatar_url}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            lbLoggedAvatar.innerText = (miUsuarioPerfilCache.mote || 'T').charAt(0).toUpperCase();
        }
    }

    const authorBox = document.getElementById('lb-author-box');
    const captionText = document.getElementById('lb-caption-text');
    const mote = post.profiles?.mote || 'Tuno';
    const avatar = post.profiles?.avatar_url;
    const avatarHTML = (avatar && avatar.trim() !== '')
        ? `<img src="${avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
        : `<span style="font-weight:bold; color:#000;">${mote.charAt(0).toUpperCase()}</span>`;

    if (authorBox) {
        authorBox.innerHTML = `
            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-acento, #d4af37); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                ${avatarHTML}
            </div>
            <div>
                <h4 style="margin: 0; color: #fff; font-size: 0.9rem;">"${mote}"</h4>
                <span style="font-size: 0.72rem; color: #aaa;">${new Date(post.created_at).toLocaleDateString('es-ES')} · 🌍</span>
            </div>
        `;
    }

    if (captionText) captionText.innerText = post.contenido || '';

    const commentsContainer = document.getElementById('lb-comments-container');
    const todosComentarios = post.jusa_comentarios || [];
    
    if (commentsContainer) {
        if (todosComentarios.length === 0) {
            commentsContainer.innerHTML = `<p style="color:#777; font-size:0.8rem; text-align:center; padding: 20px 0;">Todavía no hay comentarios.<br>Sé la primera persona en comentar.</p>`;
        } else {
            commentsContainer.innerHTML = todosComentarios.map(c => {
                const cMote = c.profiles?.mote || 'Tuno';
                const cInicial = cMote.charAt(0).toUpperCase();
                const cAvatar = c.profiles?.avatar_url;
                const cAvatarHTML = (cAvatar && cAvatar.trim() !== '')
                    ? `<img src="${cAvatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
                    : `<span style="font-weight:bold; color:#000; font-size:0.75rem;">${cInicial}</span>`;

                return `
                    <div style="display:flex; gap:8px; margin-top:8px; align-items:flex-start;">
                        <div style="width:28px; height:28px; border-radius:50%; background:var(--color-acento,#d4af37); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                            ${cAvatarHTML}
                        </div>
                        <div style="background: rgba(255,255,255,0.06); padding: 6px 10px; border-radius: 12px; max-width: 85%;">
                            <strong style="color: var(--color-acento, #d4af37); font-size: 0.75rem;">${cMote}</strong>
                            <p style="margin: 2px 0 0 0; color: #ddd; font-size: 0.8rem;">${c.comentario}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    const commentInputBox = document.getElementById('lb-comment-input-box');
    if (commentInputBox) {
        commentInputBox.innerHTML = `
            <div style="display:flex; gap:6px; align-items:center;">
                <input type="text" id="input-lb-comment-${post.id}" placeholder="Comentar como ${miUsuarioPerfilCache?.mote || 'Tuno'}..." 
                       onkeypress="if(event.key==='Enter') enviarComentarioLightbox('${post.id}')"
                       style="flex-grow:1; padding:8px 12px; font-size:0.8rem; background:rgba(0,0,0,0.5); border:1px solid rgba(212,175,55,0.3); border-radius:18px; color:#fff; outline:none;">
                <button onclick="enviarComentarioLightbox('${post.id}')" class="btn-tuna-ui" style="padding:6px 12px; font-size:0.75rem; border-radius:14px;">Enviar</button>
            </div>
        `;
    }
}

window.abrirSubModalVerPublicacion = function() {
    if (!postActivoEnLightbox) return;

    const modal = document.getElementById('jusa-post-detail-modal');
    const title = document.getElementById('submodal-post-title');
    const body = document.getElementById('submodal-post-body');

    const autorName = postActivoEnLightbox.profiles?.mote || 'Tuno';
    if (title) title.innerText = `Publicación de ${autorName}`;

    const listaImagenes = postActivoEnLightbox.imagenes_urls && postActivoEnLightbox.imagenes_urls.length > 0 
        ? postActivoEnLightbox.imagenes_urls 
        : (postActivoEnLightbox.imagen_url ? [postActivoEnLightbox.imagen_url] : []);

    const mosaicHTML = generarHTMLMosaico(listaImagenes, postActivoEnLightbox.id);

    if (body) {
        body.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-acento, #d4af37); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <span style="font-weight:bold; color:#000;">${autorName.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                    <h4 style="margin: 0; color: #fff; font-size: 0.95rem;">"${autorName}"</h4>
                    <span style="font-size: 0.72rem; color: var(--color-acento, #d4af37);">${postActivoEnLightbox.profiles?.tuna_nombre || 'Tuna Universitaria'}</span>
                </div>
            </div>
            <p style="color: #eee; font-size: 0.9rem; line-height: 1.45; margin-bottom: 12px;">${postActivoEnLightbox.contenido || ''}</p>
            ${mosaicHTML}
        `;
    }

    if (modal) modal.style.display = 'flex';
};

window.cerrarSubModalVerPublicacion = function() {
    const modal = document.getElementById('jusa-post-detail-modal');
    if (modal) modal.style.display = 'none';
};

window.enviarComentarioLightbox = async function(postId) {
    const input = document.getElementById(`input-lb-comment-${postId}`);
    const texto = input ? input.value.trim() : '';

    if (!texto) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { error } = await supabaseClient.from('jusa_comentarios').insert([{
        publicacion_id: postId,
        user_id: session.user.id,
        comentario: texto
    }]);

    if (!error) {
        if (input) input.value = '';
        abrirLightboxModal(postId, lightboxCurrentIndex, lightboxGallery);
    }
};

window.publicarEnJusacalles = async function(e) {
    e.preventDefault();
    const texto = document.getElementById('post-texto').value.trim();
    const btnSubmit = document.getElementById('btn-submit-post');
    const modoSubida = document.getElementById('post-tipo-subida').value;

    if (!texto && archivosAdjuntosSubir.length === 0) {
        alert("Introduce un texto o selecciona archivos para publicar.");
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    btnSubmit.disabled = true;
    btnSubmit.innerText = "Comprimiendo...";

    const urlsImagenesSubidas = [];
    let finalVideoUrl = null;

    try {
        if (archivosAdjuntosSubir.length > 0) {
            for (let i = 0; i < archivosAdjuntosSubir.length; i++) {
                const file = archivosAdjuntosSubir[i];
                btnSubmit.innerText = `Subiendo (${i + 1}/${archivosAdjuntosSubir.length})...`;

                if (file.type.startsWith('image/')) {
                    const fileComp = await comprimirImagen(file);
                    const fileName = `${session.user.id}_${Date.now()}_${i}.jpg`;
                    const filePath = `${modoSubida}s/${fileName}`;

                    const { error: upErr } = await supabaseClient.storage.from('jusacalles-media').upload(filePath, fileComp);
                    if (!upErr) {
                        const { data: pubData } = supabaseClient.storage.from('jusacalles-media').getPublicUrl(filePath);
                        urlsImagenesSubidas.push(pubData.publicUrl);
                    }
                } else if (file.type.startsWith('video/')) {
                    const fileName = `${session.user.id}_${Date.now()}_${i}.${file.name.split('.').pop()}`;
                    const filePath = `${modoSubida}s/${fileName}`;

                    const { error: upErr } = await supabaseClient.storage.from('jusacalles-media').upload(filePath, file);
                    if (!upErr) {
                        const { data: pubData } = supabaseClient.storage.from('jusacalles-media').getPublicUrl(filePath);
                        finalVideoUrl = pubData.publicUrl;
                    }
                }
            }
        }

        const { error: insertError } = await supabaseClient.from('jusa_publicaciones').insert([{
            user_id: session.user.id,
            contenido: texto,
            imagen_url: urlsImagenesSubidas[0] || null,
            imagenes_urls: urlsImagenesSubidas,
            video_url: finalVideoUrl,
            tipo: modoSubida
        }]);

        if (!insertError) {
            document.getElementById('form-crear-post').reset();
            cancelarMediaAdjunto();
            await cargarMuroPublicaciones();
        } else {
            alert("Error al publicar: " + insertError.message);
        }
    } catch (err) {
        alert("Error en el proceso de subida: " + err.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Publicar";
    }
};

window.toggleExpandirComentarios = function(postId) {
    comentariosVisiblesEstado[postId] = !comentariosVisiblesEstado[postId];
    cargarMuroPublicaciones();
};

window.mostrarCajaRespuesta = function(postId, parentCommentId, autorMote) {
    const box = document.getElementById(`box-respuesta-${parentCommentId}`);
    if (!box) return;

    if (box.style.display === 'block') {
        box.style.display = 'none';
        return;
    }

    box.style.display = 'block';
    box.innerHTML = `
        <div style="display:flex; gap:6px; margin-top:6px; align-items:center; position:relative;">
            <input type="text" id="input-reply-${parentCommentId}" placeholder="Responder a ${autorMote}..." 
                   style="flex-grow:1; padding:6px 30px 6px 10px; font-size:0.78rem; background:rgba(0,0,0,0.6); border:1px solid rgba(212,175,55,0.3); border-radius:14px; color:#fff; outline:none;">
            
            <button type="button" onclick="document.getElementById('file-reply-${parentCommentId}').click()" 
                    title="Adjuntar foto"
                    style="position:absolute; right:70px; background:none; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                ${SVG_ICONS.camera}
            </button>
            <input type="file" id="file-reply-${parentCommentId}" accept="image/*" style="display:none;" onchange="previewFotoRespuesta(event, '${parentCommentId}')">

            <button onclick="enviarRespuestaComentario('${postId}', '${parentCommentId}')" class="btn-tuna-ui" style="padding:4px 10px; font-size:0.72rem; border-radius:12px;">Enviar</button>
        </div>
        <div id="preview-reply-foto-${parentCommentId}" style="display:none; margin-top:4px; font-size:0.72rem; color:#d4af37;">📷 Foto lista</div>
    `;
};

const fotosComentariosCache = {};

window.previewFotoComentario = function(e, postId) {
    const file = e.target.files[0];
    if (file) {
        fotosComentariosCache[`post_${postId}`] = file;
        const prev = document.getElementById(`preview-foto-comment-${postId}`);
        if (prev) prev.style.display = 'block';
    }
};

window.limpiarFotoComentario = function(postId) {
    delete fotosComentariosCache[`post_${postId}`];
    const input = document.getElementById(`input-file-comment-${postId}`);
    if (input) input.value = '';
    const prev = document.getElementById(`preview-foto-comment-${postId}`);
    if (prev) prev.style.display = 'none';
};

window.previewFotoRespuesta = function(e, parentId) {
    const file = e.target.files[0];
    if (file) {
        fotosComentariosCache[`reply_${parentId}`] = file;
        const prev = document.getElementById(`preview-reply-foto-${parentId}`);
        if (prev) prev.style.display = 'block';
    }
};

window.enviarComentario = async function(postId) {
    const input = document.getElementById(`input-comentario-${postId}`);
    const texto = input ? input.value.trim() : '';
    const fotoFile = fotosComentariosCache[`post_${postId}`];

    if (!texto && !fotoFile) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        if (typeof abrirModalAuth === 'function') abrirModalAuth('login');
        return;
    }

    let imagenUrl = null;
    if (fotoFile) {
        const fileComp = await comprimirImagen(fotoFile);
        const fileName = `comment_${session.user.id}_${Date.now()}.jpg`;
        const filePath = `comentarios/${fileName}`;

        const { error: upErr } = await supabaseClient.storage.from('jusacalles-media').upload(filePath, fileComp);
        if (!upErr) {
            const { data: pubData } = supabaseClient.storage.from('jusacalles-media').getPublicUrl(filePath);
            imagenUrl = pubData.publicUrl;
        }
    }

    const { error } = await supabaseClient.from('jusa_comentarios').insert([{
        publicacion_id: postId,
        user_id: session.user.id,
        comentario: texto,
        imagen_url: imagenUrl
    }]);

    if (!error) {
        limpiarFotoComentario(postId);
        if (input) input.value = '';
        await cargarMuroPublicaciones();
    }
};

window.enviarRespuestaComentario = async function(postId, parentId) {
    const input = document.getElementById(`input-reply-${parentId}`);
    const texto = input ? input.value.trim() : '';
    const fotoFile = fotosComentariosCache[`reply_${parentId}`];

    if (!texto && !fotoFile) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    let imagenUrl = null;
    if (fotoFile) {
        const fileComp = await comprimirImagen(fotoFile);
        const fileName = `reply_${session.user.id}_${Date.now()}.jpg`;
        const filePath = `comentarios/${fileName}`;

        const { error: upErr } = await supabaseClient.storage.from('jusacalles-media').upload(filePath, fileComp);
        if (!upErr) {
            const { data: pubData } = supabaseClient.storage.from('jusacalles-media').getPublicUrl(filePath);
            imagenUrl = pubData.publicUrl;
        }
    }

    const { error } = await supabaseClient.from('jusa_comentarios').insert([{
        publicacion_id: postId,
        parent_id: parentId,
        user_id: session.user.id,
        comentario: texto,
        imagen_url: imagenUrl
    }]);

    if (!error) {
        delete fotosComentariosCache[`reply_${parentId}`];
        await cargarMuroPublicaciones();
    }
};

window.focoComentario = function(postId) {
    const inp = document.getElementById(`input-comentario-${postId}`);
    if (inp) inp.focus();
};

window.manejarKeyPressComentario = function(e, postId) {
    if (e.key === 'Enter') {
        e.preventDefault();
        enviarComentario(postId);
    }
};

window.compartirPostExterno = function(postId, autor) {
    const urlWeb = window.location.origin + window.location.pathname;
    const texto = `✨ Mira la publicación de "${autor}" en Jusacalles (Jueves Santo Oviedo):\n${urlWeb}`;

    if (navigator.share) {
        navigator.share({ title: 'Jusacalles', text: texto, url: urlWeb });
    } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
    }
};