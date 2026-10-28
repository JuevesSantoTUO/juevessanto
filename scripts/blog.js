/* ==========================================================================
   CARGA Y FILTRADO DEL BLOG PÚBLICO (scripts/blog.js)
   ========================================================================== */

let publicacionesGlobales = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarBlogPublico();
});

async function cargarBlogPublico() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        setTimeout(cargarBlogPublico, 150);
        return;
    }

    const { data: publicaciones, error } = await supabaseClient
        .from('blog')
        .select('*')
        .eq('estado', 'publicado')
        .order('created_at', { ascending: false });

    if (error) {
        document.getElementById('blog-grid').innerHTML = `<p style="color:#ff4444; grid-column:1/-1; text-align:center;">Error al cargar las publicaciones.</p>`;
        return;
    }

    publicacionesGlobales = publicaciones || [];
    renderizarGridBlog(publicacionesGlobales);
}

function renderizarGridBlog(lista) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    if (lista.length === 0) {
        grid.innerHTML = `<p style="color:#888; grid-column:1/-1; text-align:center; padding: 40px 0;">No hay publicaciones en esta categoría.</p>`;
        return;
    }

    grid.innerHTML = '';
    lista.forEach(item => {
        const fecha = new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
        
        // Píldoras de etiquetas
        const tagsHTML = (item.etiquetas && Array.isArray(item.etiquetas) && item.etiquetas.length > 0)
            ? item.etiquetas.map(t => `<span class="tag-pildora">#${t}</span>`).join('')
            : '';

        const card = document.createElement('div');
        card.className = 'blog-card';
        card.style.cursor = 'pointer';
        card.onclick = () => { window.location.href = `noticia.html?id=${item.id}`; };

        card.innerHTML = `
            ${item.imagen_url ? `<img src="${item.imagen_url}" class="blog-card-img" alt="${item.titulo}">` : ''}
            <div class="blog-card-body">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                    <span class="noticia-badge-cat">${item.categoria || 'General'}</span>
                    <span class="blog-card-meta">${fecha}</span>
                </div>
                <h3 class="blog-card-title">${item.titulo}</h3>
                <p class="blog-card-excerpt">${item.resumen || ''}</p>
                ${tagsHTML ? `<div class="noticia-tags-container" style="margin-top:auto;">${tagsHTML}</div>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

/* FILTRADO POR CATEGORÍA EN LA VISTA PÚBLICA */
window.filtrarBlogPorCategoria = function(categoria, btn) {
    document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('activo'));
    if (btn) btn.classList.add('activo');

    if (categoria === 'todas') {
        renderizarGridBlog(publicacionesGlobales);
    } else {
        const filtradas = publicacionesGlobales.filter(p => p.categoria === categoria);
        renderizarGridBlog(filtradas);
    }
};