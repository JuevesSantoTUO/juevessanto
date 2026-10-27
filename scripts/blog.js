/* ==========================================================================
   RENDERIZADO PÚBLICO DEL BLOG (scripts/blog.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    cargarNoticiasPublicas();
});

async function cargarNoticiasPublicas() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        setTimeout(cargarNoticiasPublicas, 150);
        return;
    }

    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    const { data, error } = await supabaseClient
        .from('blog')
        .select('*')
        .eq('estado', 'publicado')
        .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        grid.innerHTML = `<p style="text-align: center; color: #888; grid-column: 1/-1;">No hay publicaciones disponibles en este momento.</p>`;
        return;
    }

    grid.innerHTML = '';

    data.forEach(n => {
        const fecha = new Date(n.created_at).toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
        const imgHeader = n.imagen_url ? `<img src="${n.imagen_url}" class="blog-card-img" alt="${n.titulo}">` : '';

        const card = document.createElement('article');
        card.className = 'blog-card';
        card.innerHTML = `
            ${imgHeader}
            <div class="blog-card-body">
                <div class="blog-card-meta">${fecha} • Por ${n.autor}</div>
                <h3 class="blog-card-title">${n.titulo}</h3>
                <p class="blog-card-excerpt">${n.resumen}</p>
                <a href="noticia.html?id=${n.id}" class="btn-tuna-ui full-width" style="text-align: center; text-decoration: none;">LEER NOTICIA</a>
            </div>
        `;
        grid.appendChild(card);
    });
}