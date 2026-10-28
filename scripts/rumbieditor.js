/* ==========================================================================
   RUMBIEDITOR - MOTOR COMPLETO DE BLOQUES (scripts/rumbieditor.js)
   ========================================================================== */

let rumbiBloques = [];
let quillInstances = {};
let rumbiCarouselTimers = {};

window.inicializarRumbiEditor = function(bloquesJsonExistentes = null) {
    const container = document.getElementById('rumbi-editor-app');
    if (!container) return;

    if (bloquesJsonExistentes && Array.isArray(bloquesJsonExistentes) && bloquesJsonExistentes.length > 0) {
        rumbiBloques = bloquesJsonExistentes;
    } else {
        rumbiBloques = [];
    }

    renderizarPanelRumbiEditor();
};

function renderizarPanelRumbiEditor() {
    const container = document.getElementById('rumbi-editor-app');
    if (!container) return;

    container.innerHTML = `
        <div class="rumbi-editor-container">
            <!-- BARRA DE HERRAMIENTAS DE BLOQUES -->
            <div class="rumbi-toolbar">
                <button type="button" class="rumbi-btn-add" onclick="agregarBloqueRumbi('texto')">📝 Texto Enriquecido</button>
                <button type="button" class="rumbi-btn-add" onclick="agregarBloqueRumbi('split')">🖼️📝 Texto + Imagen Lateral</button>
                <button type="button" class="rumbi-btn-add" onclick="agregarBloqueRumbi('carrusel_fotos')">📸 Carrusel de Fotos</button>
                <button type="button" class="rumbi-btn-add" onclick="agregarBloqueRumbi('carrusel')">🎠 Carrusel Testimonios</button>
                <button type="button" class="rumbi-btn-add" onclick="agregarBloqueRumbi('cita')">📜 Cita / Pasodoble</button>
                <button type="button" class="rumbi-btn-add" onclick="agregarBloqueRumbi('imagen')">🖼️ Imagen Ancho Completo</button>
                <button type="button" class="rumbi-btn-add" onclick="agregarBloqueRumbi('video')">🎥 Vídeo YouTube</button>
                <button type="button" class="rumbi-btn-add" onclick="agregarBloqueRumbi('hero')">🚀 Header Hero</button>
                <button type="button" class="rumbi-btn-add" onclick="agregarBloqueRumbi('asociacion')">🏛️ Ficha Agrupación</button>
            </div>

            <!-- LISTA DINÁMICA DE BLOQUES EN EDICIÓN -->
            <div id="rumbi-blocks-list" class="rumbi-blocks-list">
                ${rumbiBloques.length === 0 ? '<p style="color:#666; text-align:center; padding:20px;">Añade tu primer bloque para empezar a maquetar la noticia.</p>' : ''}
            </div>
        </div>
    `;

    renderizarItemsBloques();
}

function renderizarItemsBloques() {
    const listEl = document.getElementById('rumbi-blocks-list');
    if (!listEl) return;

    quillInstances = {};

    if (rumbiBloques.length === 0) {
        listEl.innerHTML = '<p style="color:#666; text-align:center; padding:20px;">Añade tu primer bloque para empezar a maquetar la noticia.</p>';
        return;
    }

    listEl.innerHTML = '';
    rumbiBloques.forEach((b, index) => {
        const item = document.createElement('div');
        item.className = 'rumbi-block-item';
        
        let camposHTML = '';

        switch (b.tipo) {
            case 'texto':
                camposHTML = `
                    <div class="input-group">
                        <label>Contenido con Formato</label>
                        <div id="rumbi-quill-${index}" style="height: 150px; background: #181818; color: #fff; border-radius: 6px;"></div>
                    </div>`;
                break;

            case 'split':
                camposHTML = `
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:15px;">
                        <div class="input-group">
                            <label>Posición de la Imagen</label>
                            <select onchange="actualizarCampoRumbi(${index}, 'posicion', this.value)" style="background:#181818; color:#fff; border:1px solid #333; padding:8px; border-radius:6px; width:100%;">
                                <option value="derecha" ${b.posicion === 'derecha' ? 'selected' : ''}>➡️ Imagen a la Derecha / Texto a la Izquierda</option>
                                <option value="izquierda" ${b.posicion === 'izquierda' ? 'selected' : ''}>⬅️ Imagen a la Izquierda / Texto a la Derecha</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>URL de la Imagen</label>
                            <input type="url" value="${b.url || ''}" onchange="actualizarCampoRumbi(${index}, 'url', this.value)" placeholder="https://...">
                        </div>
                    </div>
                    <div class="input-group" style="margin-top:10px;">
                        <label>Texto con Formato</label>
                        <div id="rumbi-quill-${index}" style="height: 150px; background: #181818; color: #fff; border-radius: 6px;"></div>
                    </div>
                    <div class="input-group" style="margin-top:10px;">
                        <label>Pie de Foto (Opcional)</label>
                        <input type="text" value="${b.caption || ''}" onchange="actualizarCampoRumbi(${index}, 'caption', this.value)" placeholder="Pie de foto...">
                    </div>`;
                break;

            case 'carrusel_fotos':
                let fotosHTML = '';
                (b.items || []).forEach((f, fIdx) => {
                    fotosHTML += `
                        <div style="background:#181818; border:1px solid #333; padding:12px; border-radius:6px; margin-bottom:10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <strong style="color:var(--color-acento); font-size:0.8rem;">Foto #${fIdx + 1}</strong>
                                <button type="button" class="rumbi-ctrl-btn delete" onclick="eliminarItemCarruselFotos(${index}, ${fIdx})">🗑️ Eliminar</button>
                            </div>
                            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:10px;">
                                <input type="url" value="${f.url || ''}" onchange="actualizarItemCarruselFotos(${index}, ${fIdx}, 'url', this.value)" placeholder="URL de la imagen (https://...)">
                                <input type="text" value="${f.caption || ''}" onchange="actualizarItemCarruselFotos(${index}, ${fIdx}, 'caption', this.value)" placeholder="Pie de foto (opcional)">
                            </div>
                        </div>`;
                });

                camposHTML = `
                    <div style="margin-bottom:10px;">
                        <label>Imágenes de la Galería</label>
                        <button type="button" class="rumbi-btn-add" style="margin-top:5px; font-size:0.75rem;" onclick="agregarItemCarruselFotos(${index})">➕ Añadir Imagen</button>
                    </div>
                    ${fotosHTML || '<p style="color:#666; font-size:0.8rem;">No hay fotos en el carrusel.</p>'}`;
                break;

            case 'carrusel':
                let tarjetasHTML = '';
                (b.items || []).forEach((c, cIdx) => {
                    tarjetasHTML += `
                        <div style="background:#181818; border:1px solid #333; padding:12px; border-radius:6px; margin-bottom:10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <strong style="color:var(--color-acento); font-size:0.8rem;">Tarjeta #${cIdx + 1}</strong>
                                <button type="button" class="rumbi-ctrl-btn delete" onclick="eliminarItemCarrusel(${index}, ${cIdx})">🗑️ Eliminar</button>
                            </div>
                            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
                                <input type="text" value="${c.autor || ''}" onchange="actualizarItemCarrusel(${index}, ${cIdx}, 'autor', this.value)" placeholder="Nombre / Mote del Tuno">
                                <input type="text" value="${c.tag || ''}" onchange="actualizarItemCarrusel(${index}, ${cIdx}, 'tag', this.value)" placeholder="Ej: Tuna Antigua / Cuarentuna">
                                <input type="url" value="${c.avatar || ''}" onchange="actualizarItemCarrusel(${index}, ${cIdx}, 'avatar', this.value)" placeholder="URL Foto Avatar (Opcional)">
                            </div>
                            <textarea onchange="actualizarItemCarrusel(${index}, ${cIdx}, 'texto', this.value)" placeholder="Testimonio o reseña..." style="background:#111; color:#fff; border:1px solid #333; padding:8px; width:100%; height:50px; border-radius:4px; margin-top:8px;">${c.texto || ''}</textarea>
                        </div>`;
                });

                camposHTML = `
                    <div style="margin-bottom:10px;">
                        <label>Tarjetas del Carrusel</label>
                        <button type="button" class="rumbi-btn-add" style="margin-top:5px; font-size:0.75rem;" onclick="agregarItemCarrusel(${index})">➕ Añadir Tarjeta</button>
                    </div>
                    ${tarjetasHTML || '<p style="color:#666; font-size:0.8rem;">No hay tarjetas en el carrusel.</p>'}`;
                break;

            case 'cita':
                camposHTML = `
                    <div class="input-group">
                        <label>Verso / Cita / Declaración</label>
                        <input type="text" value="${b.texto || ''}" onchange="actualizarCampoRumbi(${index}, 'texto', this.value)" placeholder="Ej: 'A la luz de los faroles...'">
                    </div>
                    <div class="input-group">
                        <label>Autor / Fuente (Ej: — Tuno Veterano)</label>
                        <input type="text" value="${b.autor || ''}" onchange="actualizarCampoRumbi(${index}, 'autor', this.value)" placeholder="— Nombre o Agrupación">
                    </div>`;
                break;

            case 'imagen':
                camposHTML = `
                    <div class="input-group">
                        <label>URL de la Imagen</label>
                        <input type="url" value="${b.url || ''}" onchange="actualizarCampoRumbi(${index}, 'url', this.value)" placeholder="https://...">
                    </div>
                    <div class="input-group">
                        <label>Pie de Foto (Caption)</label>
                        <input type="text" value="${b.caption || ''}" onchange="actualizarCampoRumbi(${index}, 'caption', this.value)" placeholder="Ej: Ronda ante el Balcón Municipal">
                    </div>`;
                break;

            case 'video':
                camposHTML = `
                    <div class="input-group">
                        <label>URL de YouTube / Vimeo</label>
                        <input type="url" value="${b.url || ''}" onchange="actualizarCampoRumbi(${index}, 'url', this.value)" placeholder="https://www.youtube.com/watch?v=...">
                    </div>`;
                break;

            case 'hero':
                camposHTML = `
                    <div class="input-group">
                        <label>Título Principal del Hero</label>
                        <input type="text" value="${b.titulo || ''}" onchange="actualizarCampoRumbi(${index}, 'titulo', this.value)" placeholder="Ej: Gran Ronda 2027">
                    </div>
                    <div class="input-group">
                        <label>Subtítulo Explicativo</label>
                        <input type="text" value="${b.subtitulo || ''}" onchange="actualizarCampoRumbi(${index}, 'subtitulo', this.value)" placeholder="Ej: Crónica completa de una noche mágica">
                    </div>`;
                break;

            case 'asociacion':
                camposHTML = `
                    <div class="input-group">
                        <label>Nombre de la Agrupación</label>
                        <input type="text" value="${b.nombre || ''}" onchange="actualizarCampoRumbi(${index}, 'nombre', this.value)" placeholder="Ej: Tuna Antigua de Oviedo">
                    </div>
                    <div class="input-group">
                        <label>URL Escudo / Logo</label>
                        <input type="url" value="${b.escudo || ''}" onchange="actualizarCampoRumbi(${index}, 'escudo', this.value)" placeholder="https://...">
                    </div>
                    <div class="input-group">
                        <label>Descripción Corta</label>
                        <input type="text" value="${b.desc || ''}" onchange="actualizarCampoRumbi(${index}, 'desc', this.value)" placeholder="Ej: Fundada en 1985...">
                    </div>`;
                break;
        }

        item.innerHTML = `
            <div class="rumbi-block-header">
                <span class="rumbi-block-title">📦 Bloque: ${b.tipo.toUpperCase()}</span>
                <div class="rumbi-block-controls">
                    <button type="button" class="rumbi-ctrl-btn" onclick="moverBloqueRumbi(${index}, -1)">▲</button>
                    <button type="button" class="rumbi-ctrl-btn" onclick="moverBloqueRumbi(${index}, 1)">▼</button>
                    <button type="button" class="rumbi-ctrl-btn delete" onclick="eliminarBloqueRumbi(${index})">🗑️</button>
                </div>
            </div>
            <div class="rumbi-block-body">
                ${camposHTML}
            </div>
        `;
        listEl.appendChild(item);

        if (b.tipo === 'texto' || b.tipo === 'split') {
            setTimeout(() => {
                const el = document.getElementById(`rumbi-quill-${index}`);
                if (el && typeof Quill !== 'undefined') {
                    const q = new Quill(`#rumbi-quill-${index}`, {
                    theme: 'snow',
                    placeholder: 'Escribe el texto aquí...',
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

                    if (b.contenido) {
                        q.clipboard.dangerouslyPasteHTML(b.contenido);
                    }

                    q.on('text-change', () => {
                        rumbiBloques[index].contenido = q.root.innerHTML;
                    });

                    quillInstances[index] = q;
                }
            }, 50);
        }
    });
}

window.agregarBloqueRumbi = function(tipo) {
    const nuevoBloque = { tipo: tipo };
    if (tipo === 'split') nuevoBloque.posicion = 'derecha';
    if (tipo === 'carrusel') nuevoBloque.items = [{ autor: '', tag: '', avatar: '', texto: '' }];
    if (tipo === 'carrusel_fotos') nuevoBloque.items = [{ url: '', caption: '' }];
    
    rumbiBloques.push(nuevoBloque);
    renderizarItemsBloques();
};

window.agregarItemCarruselFotos = function(blockIndex) {
    if (rumbiBloques[blockIndex]) {
        if (!rumbiBloques[blockIndex].items) rumbiBloques[blockIndex].items = [];
        rumbiBloques[blockIndex].items.push({ url: '', caption: '' });
        renderizarItemsBloques();
    }
};

window.actualizarItemCarruselFotos = function(blockIndex, itemIndex, campo, valor) {
    if (rumbiBloques[blockIndex] && rumbiBloques[blockIndex].items[itemIndex]) {
        rumbiBloques[blockIndex].items[itemIndex][campo] = valor;
    }
};

window.eliminarItemCarruselFotos = function(blockIndex, itemIndex) {
    if (rumbiBloques[blockIndex] && rumbiBloques[blockIndex].items) {
        rumbiBloques[blockIndex].items.splice(itemIndex, 1);
        renderizarItemsBloques();
    }
};

window.agregarItemCarrusel = function(blockIndex) {
    if (rumbiBloques[blockIndex]) {
        if (!rumbiBloques[blockIndex].items) rumbiBloques[blockIndex].items = [];
        rumbiBloques[blockIndex].items.push({ autor: '', tag: '', avatar: '', texto: '' });
        renderizarItemsBloques();
    }
};

window.actualizarItemCarrusel = function(blockIndex, itemIndex, campo, valor) {
    if (rumbiBloques[blockIndex] && rumbiBloques[blockIndex].items[itemIndex]) {
        rumbiBloques[blockIndex].items[itemIndex][campo] = valor;
    }
};

window.eliminarItemCarrusel = function(blockIndex, itemIndex) {
    if (rumbiBloques[blockIndex] && rumbiBloques[blockIndex].items) {
        rumbiBloques[blockIndex].items.splice(itemIndex, 1);
        renderizarItemsBloques();
    }
};

window.actualizarCampoRumbi = function(index, campo, valor) {
    if (rumbiBloques[index]) {
        rumbiBloques[index][campo] = valor;
    }
};

window.moverBloqueRumbi = function(index, direccion) {
    const nuevoIndex = index + direccion;
    if (nuevoIndex < 0 || nuevoIndex >= rumbiBloques.length) return;

    const temp = rumbiBloques[index];
    rumbiBloques[index] = rumbiBloques[nuevoIndex];
    rumbiBloques[nuevoIndex] = temp;

    renderizarItemsBloques();
};

window.eliminarBloqueRumbi = function(index) {
    rumbiBloques.splice(index, 1);
    renderizarItemsBloques();
};

/* --- CONTROL INTERACTIVO Y AUTOMÁTICO DE CARRUSELES (AUTOPLAY) --- */
window.scrollRumbiCarousel = function(carouselId, dir) {
    const track = document.getElementById(carouselId);
    if (!track) return;

    const scrollAmount = track.clientWidth * 0.85;
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (dir === 1 && (track.scrollLeft + scrollAmount >= maxScroll - 10)) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (dir === -1 && track.scrollLeft <= 10) {
        track.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
        track.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
    }
};

window.iniciarAutoplayCarrusel = function(carouselId) {
    if (rumbiCarouselTimers[carouselId]) return;

    const track = document.getElementById(carouselId);
    if (!track) return;

    rumbiCarouselTimers[carouselId] = setInterval(() => {
        window.scrollRumbiCarousel(carouselId, 1);
    }, 4500);

    track.addEventListener('mouseenter', () => clearInterval(rumbiCarouselTimers[carouselId]));
    track.addEventListener('mouseleave', () => {
        clearInterval(rumbiCarouselTimers[carouselId]);
        rumbiCarouselTimers[carouselId] = setInterval(() => window.scrollRumbiCarousel(carouselId, 1), 4500);
    });
};

/* --- COMPILADOR DE BLOQUES A HTML FINAL Y JSON --- */
window.obtenerDatosRumbiEditor = function() {
    let htmlCompilado = '';

    rumbiBloques.forEach((b, index) => {
        if ((b.tipo === 'texto' || b.tipo === 'split') && quillInstances[index]) {
            b.contenido = quillInstances[index].root.innerHTML;
        }

        switch (b.tipo) {
            case 'texto':
                if (b.contenido) {
                    htmlCompilado += `<div class="rumbi-text-block" style="margin-bottom:20px; line-height:1.7;">${b.contenido}</div>`;
                }
                break;

            case 'split':
                if (b.contenido || b.url) {
                    const posClass = b.posicion === 'izquierda' ? 'img-izquierda' : 'img-derecha';
                    htmlCompilado += `
                        <div class="rumbi-split-container ${posClass}">
                            <div class="split-col-text">
                                <div style="line-height:1.7;">${b.contenido || ''}</div>
                            </div>
                            ${b.url ? `
                            <div class="split-col-media">
                                <figure style="margin:0; text-align:center;">
                                    <img src="${b.url}" alt="Imagen noticia">
                                    ${b.caption ? `<figcaption style="font-size:0.75rem; color:#aaa; margin-top:6px;">${b.caption}</figcaption>` : ''}
                                </figure>
                            </div>` : ''}
                        </div>`;
                }
                break;

            case 'carrusel_fotos':
                if (b.items && b.items.length > 0) {
                    const carouselId = `rumbi-img-car-${Math.random().toString(36).substring(2, 8)}`;
                    let fotosHTML = '';

                    b.items.forEach(f => {
                        if (f.url) {
                            fotosHTML += `
                                <figure class="rumbi-img-card">
                                    <img src="${f.url}" alt="Foto carrusel">
                                    ${f.caption ? `<figcaption>${f.caption}</figcaption>` : ''}
                                </figure>`;
                        }
                    });

                    if (fotosHTML) {
                        htmlCompilado += `
                            <div class="rumbi-carousel-container">
                                <div class="rumbi-carousel-nav">
                                    <button type="button" class="rumbi-carousel-arrow" onclick="scrollRumbiCarousel('${carouselId}', -1)">❮</button>
                                    <button type="button" class="rumbi-carousel-arrow" onclick="scrollRumbiCarousel('${carouselId}', 1)">❯</button>
                                </div>
                                <div id="${carouselId}" class="rumbi-img-carousel-track">
                                    ${fotosHTML}
                                </div>
                            </div>
                            <script>setTimeout(() => { if(typeof iniciarAutoplayCarrusel === 'function') iniciarAutoplayCarrusel('${carouselId}'); }, 300);</script>`;
                    }
                }
                break;

            case 'carrusel':
                if (b.items && b.items.length > 0) {
                    const carouselId = `rumbi-car-${Math.random().toString(36).substring(2, 8)}`;
                    let tarjetasHTML = '';

                    b.items.forEach(c => {
                        tarjetasHTML += `
                            <div class="rumbi-carousel-card">
                                <div class="quote-text">"${c.texto || ''}"</div>
                                <div class="author-info">
                                    <img src="${c.avatar || 'img/favicon.png'}" class="author-avatar" alt="Avatar">
                                    <div>
                                        <div class="author-name">${c.autor || 'Tuno Anónimo'}</div>
                                        <div class="author-tag">${c.tag || 'Agrupación'}</div>
                                    </div>
                                </div>
                            </div>`;
                    });

                    htmlCompilado += `
                        <div class="rumbi-carousel-container">
                            <div class="rumbi-carousel-nav">
                                <button type="button" class="rumbi-carousel-arrow" onclick="scrollRumbiCarousel('${carouselId}', -1)">❮</button>
                                <button type="button" class="rumbi-carousel-arrow" onclick="scrollRumbiCarousel('${carouselId}', 1)">❯</button>
                            </div>
                            <div id="${carouselId}" class="rumbi-carousel-track">
                                ${tarjetasHTML}
                            </div>
                        </div>
                        <script>setTimeout(() => { if(typeof iniciarAutoplayCarrusel === 'function') iniciarAutoplayCarrusel('${carouselId}'); }, 300);</script>`;
                }
                break;

            case 'cita':
                if (b.texto) {
                    htmlCompilado += `
                        <blockquote class="rumbi-render-cita">
                            "${b.texto}"
                            ${b.autor ? `<span class="cita-autor">${b.autor}</span>` : ''}
                        </blockquote>`;
                }
                break;

            case 'imagen':
                if (b.url) {
                    htmlCompilado += `
                        <figure style="margin:25px 0; text-align:center;">
                            <img src="${b.url}" alt="Imagen noticia" style="max-width:100%; border-radius:8px; border:1px solid #333;">
                            ${b.caption ? `<figcaption style="font-size:0.8rem; color:#aaa; margin-top:8px;">${b.caption}</figcaption>` : ''}
                        </figure>`;
                }
                break;

            case 'video':
                if (b.url) {
                    let embedUrl = b.url;
                    if (b.url.includes('watch?v=')) {
                        embedUrl = b.url.replace('watch?v=', 'embed/');
                    }
                    htmlCompilado += `
                        <div class="video-responsive" style="margin:25px 0;">
                            <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
                        </div>`;
                }
                break;

            case 'hero':
                htmlCompilado += `
                    <div class="rumbi-render-hero">
                        <h1>${b.titulo || ''}</h1>
                        <p>${b.subtitulo || ''}</p>
                    </div>`;
                break;

            case 'asociacion':
                htmlCompilado += `
                    <div class="rumbi-render-asociacion">
                        ${b.escudo ? `<img src="${b.escudo}" alt="${b.nombre}">` : ''}
                        <div>
                            <h4>${b.nombre || ''}</h4>
                            <p>${b.desc || ''}</p>
                        </div>
                    </div>`;
                break;
        }
    });

    return {
        contenidoHTML: htmlCompilado,
        bloquesJSON: rumbiBloques
    };
};