/* ==========================================================================
   CONFIGURACIÓN Y CLIENTE DE SUPABASE (v2-dev)
   ========================================================================== */

const SUPABASE_URL = "https://nbfkwbdnhghtljgnpmng.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZmt3YmRuaGdodGxqZ25wbW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NjEwMDAsImV4cCI6MjEwODMzNzAwMH0.m3BrpYnbq_jODwELJEUYxiLDjwOdfT5X9GO8iNi84CA";

let supabaseClient = null;
let currentAuthMode = 'login';

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn("Librería Supabase JS no detectada.");
}

document.addEventListener('DOMContentLoaded', () => {
    comprobarEstadoSesion();
    configurarBuscadorTunas();
    inyectarModalPerfilGlobal();
    inyectarModalAuthGlobal();
    comprobarTokenRecuperacionPassword();

    if (supabaseClient) {
        supabaseClient.auth.onAuthStateChange(() => {
            comprobarEstadoSesion();
        });
    }
});

/* --- DETECTAR SI EL USUARIO LLEGA DESDE EL ENLACE DE RECUPERACIÓN DE CORREO --- */
async function comprobarTokenRecuperacionPassword() {
    if (!supabaseClient) return;

    // Detectar hash de recuperación de Supabase en la URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    if (type === 'recovery') {
        setTimeout(() => {
            abrirModalNuevaPasswordRecovery();
        }, 300);
    }
}

/* --- 1. GESTIÓN DE SESIÓN Y AUTOCOMPLETADO DE PERFIL --- */
async function comprobarEstadoSesion() {
    if (!supabaseClient) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    
    const bannerNoLogged = document.getElementById('auth-no-logged');
    const bannerLogged = document.getElementById('auth-logged');
    const emailDisplay = document.getElementById('user-email-display');
    const pEmail = document.getElementById('p-email-display');
    const footerAdminContainer = document.getElementById('footer-admin-link');
    
    const formInputs = document.querySelectorAll('#form-participa input, #form-participa select, #btn-submit-participa');

    if (session && session.user) {
        supabaseClient
            .from('profiles')
            .update({ ultima_conexion: new Date() })
            .eq('id', session.user.id)
            .then(() => {});

        if (bannerNoLogged) bannerNoLogged.style.display = 'none';
        if (bannerLogged) bannerLogged.style.display = 'flex';
        if (emailDisplay) emailDisplay.innerText = session.user.email;
        if (pEmail) pEmail.value = session.user.email;

        formInputs.forEach(input => {
            if (input.id !== 'p-email-display') input.disabled = false;
        });

        try {
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            const role = profile ? profile.role : 'user';

            if (profile) {
                const inputNombre = document.getElementById('p-nombre');
                const inputApellidos = document.getElementById('p-apellidos');
                const inputMote = document.getElementById('p-mote');
                const inputTuna = document.getElementById('p-tuna-search');

                if (inputNombre && profile.nombre) { inputNombre.value = profile.nombre; }
                if (inputApellidos && profile.apellidos) { inputApellidos.value = profile.apellidos; }
                if (inputMote && profile.mote) { inputMote.value = profile.mote; }
                if (inputTuna && profile.tuna_nombre) { inputTuna.value = profile.tuna_nombre; }
            }

            if (footerAdminContainer) {
                if (role !== 'user') {
                    footerAdminContainer.innerHTML = `
                        <span class="separador">|</span>
                        <a href="admin_panel.html" class="link-sutil" style="color: var(--color-acento); font-weight: bold;">
                            ⚙️ Panel de Control (${role.toUpperCase()})
                        </a>
                    `;
                } else {
                    footerAdminContainer.innerHTML = '';
                }
            }
        } catch (e) {
            console.warn("No se pudo verificar el perfil:", e);
        }

        if (!document.querySelector('.whatsapp-float')) {
            document.body.insertAdjacentHTML('beforeend', `
                <a href="https://chat.whatsapp.com/HwcfOLeCCNn7mFNiOSoqv4" class="whatsapp-float" target="_blank" title="Únete al grupo de participantes">
                    <span class="whatsapp-text">Únete al grupo</span>
                    <svg viewBox="0 0 32 32" class="whatsapp-icon">
                        <path d="M16 0c-8.837 0-16 7.163-16 16 0 2.825 0.737 5.48 2.031 7.787l-2.031 7.213 7.412-1.944c2.247 1.181 4.806 1.856 7.519 1.856 8.837 0 16-7.163 16-16s-7.163-16-16-16zM16 29.375c-2.438 0-4.731-0.637-6.725-1.744l-0.481-0.269-4.387 1.15 1.169-4.144-0.3-0.475c-1.256-2.031-1.969-4.425-1.969-6.944 0-7.381 6.019-13.4 13.4-13.4s13.4 6.019 13.4 13.4c0 7.381-6.019 13.4-13.4 13.4zM22.481 19.331c-0.356-0.181-2.113-1.044-2.444-1.163-0.331-0.119-0.569-0.181-0.806 0.181-0.237 0.356-0.925 1.163-1.131 1.4-0.213 0.237-0.425 0.269-0.781 0.088-0.356-0.181-1.506-0.556-2.869-1.775-1.056-0.944-1.769-2.113-1.975-2.469-0.213-0.356-0.025-0.55 0.156-0.731 0.163-0.163 0.356-0.425 0.538-0.637 0.181-0.213 0.237-0.356 0.356-0.6 0.119-0.237 0.063-0.45-0.031-0.637-0.088-0.181-0.806-1.944-1.106-2.669-0.294-0.706-0.594-0.613-0.806-0.625-0.206-0.013-0.444-0.013-0.681-0.013-0.237 0-0.625 0.088-0.95 0.45-0.325 0.356-1.238 1.213-1.238 2.956s1.269 3.425 1.45 3.663c0.181 0.237 2.494 3.813 6.056 5.35 0.844 0.363 1.506 0.581 2.019 0.744 0.85 0.269 1.625 0.231 2.237 0.144 0.681-0.1 2.113-0.863 2.406-1.7s0.294-1.556 0.206-1.7c-0.088-0.15-0.325-0.237-0.681-0.419z"></path>
                    </svg>
                </a>
            `);
        }
    } else {
        if (bannerNoLogged) bannerNoLogged.style.display = 'flex';
        if (bannerLogged) bannerLogged.style.display = 'none';
        if (pEmail) pEmail.value = '';
        if (footerAdminContainer) footerAdminContainer.innerHTML = '';

        formInputs.forEach(input => input.disabled = true);

        const btnWa = document.querySelector('.whatsapp-float');
        if (btnWa) btnWa.remove();
    }

    const badge = document.getElementById('user-badge');
    if (badge) {
        badge.style.display = (session && session.user) ? 'block' : 'none';
    }
}

/* --- 2. MODAL GLOBAL DE AUTENTICACIÓN (CON BOTÓN DE OLVIDÉ MI CONTRASEÑA) --- */
function inyectarModalAuthGlobal() {
    if (document.getElementById('modal-auth')) return;

    const modalHTML = `
    <div id="modal-auth" class="modal-interno" style="display: none;">
        <div class="modal-contenido auth-modal-box">
            <button class="cerrar-modal" onclick="cerrarModalAuth()">&times;</button>
            
            <div class="auth-tabs">
                <button type="button" id="tab-btn-login" class="auth-tab-btn activo" onclick="cambiarPestanaAuth('login')">Iniciar Sesión</button>
                <button type="button" id="tab-btn-register" class="auth-tab-btn" onclick="cambiarPestanaAuth('register')">Registrarse</button>
            </div>

            <h3 id="auth-modal-title" class="protocolo-titulo" style="text-align: center; margin-bottom: 20px;">Acceso de Tunos</h3>
            
            <form id="form-auth" onsubmit="procesarAuth(event)">
                <div class="input-group">
                    <label>Correo Electrónico *</label>
                    <input type="email" id="auth-email" placeholder="tu@email.com" required>
                </div>
                <div class="input-group" style="position: relative;">
                    <label>Contraseña *</label>
                    <input type="password" id="auth-password" placeholder="••••••••" required minlength="6">
                    
                    <!-- ENLACE DIRECTO RECUPERAR CONTRASEÑA -->
                    <div id="auth-forgot-link-box" style="text-align: right; margin-top: 5px;">
                        <button type="button" onclick="abrirModalRecuperarPasswordModal()" style="background:none; border:none; color:var(--color-acento); font-size:0.75rem; cursor:pointer; text-decoration:underline;">¿Olvidaste tu contraseña?</button>
                    </div>
                </div>

                <div id="auth-extra-fields" style="display: none;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div class="input-group">
                            <label>Nombre *</label>
                            <input type="text" id="auth-nombre" placeholder="Ej: Francisco">
                        </div>
                        <div class="input-group">
                            <label>Apellidos *</label>
                            <input type="text" id="auth-apellidos" placeholder="Ej: Maestre">
                        </div>
                    </div>

                    <div class="input-group">
                        <label>Mote / Apodo *</label>
                        <input type="text" id="auth-mote" placeholder="Ej: Rumbito (o 'Ninguno')">
                    </div>

                    <div class="input-group" style="position: relative;">
                        <label>Tuna / Agrupación *</label>
                        <input type="text" id="auth-tuna-search" placeholder="Empieza a escribir tu tuna..." autocomplete="off">
                        <ul id="auth-tuna-results-list" class="autocomplete-results" style="display:none; position:absolute; width:100%; z-index:99; max-height:150px; overflow-y:auto; background:#222; border:1px solid var(--color-acento); list-style:none; padding:0; margin:0;"></ul>
                    </div>

                    <!-- CASILLAS LEGALES (LOPD & NEWSLETTER) -->
                    <div style="margin-top: 15px; border-top: 1px solid rgba(212,175,55,0.15); padding-top: 12px;">
                        <div class="input-group-checkbox" style="margin-bottom: 10px;">
                            <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.78rem; color: #ccc; cursor: pointer;">
                                <input type="checkbox" id="auth-check-lopd" style="accent-color: var(--color-acento); margin-top: 2px;">
                                <span>He leído y acepto la Términos Legales y Protección de Datos (LOPD/RGPD). *</span>
                            </label>
                        </div>
                        <div class="input-group-checkbox">
                            <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.78rem; color: #ccc; cursor: pointer;">
                                <input type="checkbox" id="auth-check-newsletter" style="accent-color: var(--color-acento); margin-top: 2px;">
                                <span>Deseo recibir boletines e información sobre la Madrugá y eventos de la Tuna por correo.</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div style="display:none !important;" aria-hidden="true">
                    <input type="text" id="auth-website-field" name="website_url" tabindex="-1" autocomplete="off">
                </div>
                
                <button type="submit" id="btn-auth-action" class="btn-tuna-ui full-width" style="margin-top: 15px;">Entrar</button>
                <div id="auth-estado" class="mensaje-estado" style="text-align: center; margin-top: 15px;"></div>
            </form>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    configurarBuscadorTunasModalAuth();
}

window.cambiarPestanaAuth = function(modo) {
    currentAuthMode = modo;
    const btnLogin = document.getElementById('tab-btn-login');
    const btnRegister = document.getElementById('tab-btn-register');
    const title = document.getElementById('auth-modal-title');
    const btnAction = document.getElementById('btn-auth-action');
    const status = document.getElementById('auth-estado');
    const extraFields = document.getElementById('auth-extra-fields');
    const forgotBox = document.getElementById('auth-forgot-link-box');

    const inputNombre = document.getElementById('auth-nombre');
    const inputApellidos = document.getElementById('auth-apellidos');
    const inputMote = document.getElementById('auth-mote');
    const inputTuna = document.getElementById('auth-tuna-search');
    const checkLopd = document.getElementById('auth-check-lopd');

    if (status) status.innerText = '';

    if (modo === 'login') {
        btnLogin?.classList.add('activo');
        btnRegister?.classList.remove('activo');
        if (title) title.innerText = "Iniciar Sesión";
        if (btnAction) btnAction.innerText = "Entrar";
        if (extraFields) extraFields.style.display = 'none';
        if (forgotBox) forgotBox.style.display = 'block';

        if (inputNombre) inputNombre.required = false;
        if (inputApellidos) inputApellidos.required = false;
        if (inputMote) inputMote.required = false;
        if (inputTuna) inputTuna.required = false;
        if (checkLopd) checkLopd.required = false;
    } else {
        btnRegister?.classList.add('activo');
        btnLogin?.classList.remove('activo');
        if (title) title.innerText = "Crear Cuenta de Tuno";
        if (btnAction) btnAction.innerText = "Registrarme";
        if (extraFields) extraFields.style.display = 'block';
        if (forgotBox) forgotBox.style.display = 'none';

        if (inputNombre) inputNombre.required = true;
        if (inputApellidos) inputApellidos.required = true;
        if (inputMote) inputMote.required = true;
        if (inputTuna) inputTuna.required = true;
        if (checkLopd) checkLopd.required = true;
    }
};

window.abrirModalAuth = function(modo = 'login') {
    inyectarModalAuthGlobal();
    const modal = document.getElementById('modal-auth');
    if (modal) {
        modal.style.display = 'flex';
        cambiarPestanaAuth(modo);
    }
};

window.cerrarModalAuth = function() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.style.display = 'none';
};

/* MODAL DEDICADO PARA PEDIR CORREO DE RECUPERACIÓN */
window.abrirModalRecuperarPasswordModal = function() {
    const currentEmail = document.getElementById('auth-email')?.value || '';
    cerrarModalAuth();

    const modalBox = document.querySelector('#modal-auth .auth-modal-box');
    if (modalBox) {
        modalBox.innerHTML = `
            <button class="cerrar-modal" onclick="cerrarModalAuth()">&times;</button>
            <div style="text-align: center; padding: 10px 0;">
                <span style="font-size: 3rem; display: block; margin-bottom: 15px;">🔑</span>
                <h3 class="protocolo-titulo" style="margin-bottom: 10px;">Recuperar Contraseña</h3>
                <p style="color: #ccc; font-size: 0.85rem; line-height: 1.5; margin-bottom: 20px;">
                    Introduce tu correo electrónico y te enviaremos un enlace seguro para restablecer tu acceso.
                </p>
                <div class="input-group" style="text-align: left;">
                    <label>Correo Electrónico Registrado *</label>
                    <input type="email" id="recuperar-email-input" value="${currentEmail}" placeholder="tu@email.com" required>
                </div>
                <button type="button" class="btn-tuna-ui full-width" style="margin-top: 15px;" onclick="enviarSolicitudResetPassword()">Enviar Enlace de Recuperación</button>
                <button type="button" class="btn-sutil-logout full-width" style="margin-top: 10px; padding: 10px;" onclick="abrirModalAuth('login')">Volver al Inicio de Sesión</button>
                <div id="recuperar-status" class="mensaje-estado" style="margin-top: 15px;"></div>
            </div>
        `;
        const modal = document.getElementById('modal-auth');
        if (modal) modal.style.display = 'flex';
    }
};

window.enviarSolicitudResetPassword = async function() {
    const emailInput = document.getElementById('recuperar-email-input');
    const status = document.getElementById('recuperar-status');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
        if (status) status.innerText = "Por favor, introduce tu correo electrónico.";
        return;
    }

    if (status) status.innerText = "Enviando correo de restablecimiento...";

    // Redirige al dominio/página actual
    const redirectUrl = window.location.origin + window.location.pathname;

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
    });

    if (error) {
        if (status) status.innerText = "Error: " + error.message;
        if (status) status.style.color = "#ff4444";
    } else {
        if (status) {
            status.innerText = "¡Enviado! Revisa tu bandeja de entrada o carpeta de SPAM.";
            status.style.color = "#2ecc71";
        }
    }
};

/* MODAL PARA CAMBIAR LA CONTRASEÑA TRAS HACER CLIC EN EL CORREO */
function abrirModalNuevaPasswordRecovery() {
    inyectarModalAuthGlobal();
    const modalBox = document.querySelector('#modal-auth .auth-modal-box');
    if (modalBox) {
        modalBox.innerHTML = `
            <div style="text-align: center; padding: 10px 0;">
                <span style="font-size: 3rem; display: block; margin-bottom: 15px;">🔐</span>
                <h3 class="protocolo-titulo" style="margin-bottom: 10px;">Crea tu Nueva Contraseña</h3>
                <p style="color: #ccc; font-size: 0.85rem; line-height: 1.5; margin-bottom: 20px;">
                    Has accedido mediante el enlace de verificación. Escribe tu nueva clave de acceso a continuación.
                </p>
                <div class="input-group" style="text-align: left;">
                    <label>Nueva Contraseña *</label>
                    <input type="password" id="recovery-new-pass" placeholder="••••••••" required minlength="6">
                </div>
                <button type="button" class="btn-tuna-ui full-width" style="margin-top: 15px;" onclick="guardarNuevaPasswordDesdeRecovery()">Guardar Nueva Contraseña</button>
                <div id="recovery-status" class="mensaje-estado" style="margin-top: 15px;"></div>
            </div>
        `;
        const modal = document.getElementById('modal-auth');
        if (modal) modal.style.display = 'flex';
    }
}

window.guardarNuevaPasswordDesdeRecovery = async function() {
    const inputPass = document.getElementById('recovery-new-pass');
    const status = document.getElementById('recovery-status');
    const newPassword = inputPass ? inputPass.value : '';

    if (!newPassword || newPassword.length < 6) {
        if (status) status.innerText = "La contraseña debe tener al menos 6 caracteres.";
        return;
    }

    if (status) status.innerText = "Actualizando contraseña...";

    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });

    if (error) {
        if (status) status.innerText = "Error actualizando clave: " + error.message;
        if (status) status.style.color = "#ff4444";
    } else {
        if (status) {
            status.innerText = "¡Contraseña cambiada con éxito! Redirigiendo...";
            status.style.color = "#2ecc71";
        }
        setTimeout(() => {
            window.location.hash = ''; // Limpiar el token de la URL
            cerrarModalAuth();
            comprobarEstadoSesion();
        }, 1500);
    }
};

window.procesarAuth = async function(event) {
    event.preventDefault();

    const honeypot = document.getElementById('auth-website-field')?.value;
    if (honeypot) return;

    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const status = document.getElementById('auth-estado');

    if (!supabaseClient) return;
    if (status) status.innerText = "Procesando...";

    if (currentAuthMode === 'login') {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            if (status) status.innerText = "Error: Credenciales incorrectas o email pendiente de verificación.";
        } else {
            if (status) status.innerText = "¡Bienvenido!";
            window.cerrarModalAuth();
            comprobarEstadoSesion();
        }
    } else {
        const nombre = document.getElementById('auth-nombre').value.trim();
        const apellidos = document.getElementById('auth-apellidos').value.trim();
        const mote = document.getElementById('auth-mote').value.trim();
        const tunaNombre = document.getElementById('auth-tuna-search').value.trim();

        const aceptaLopd = document.getElementById('auth-check-lopd').checked;
        const aceptaNewsletter = document.getElementById('auth-check-newsletter').checked;
        const fechaAhora = new Date().toISOString();

        if (!aceptaLopd) {
            if (status) status.innerText = "Debes aceptar los Términos Legales para registrarte.";
            return;
        }

        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        
        if (error) {
            const msg = error.message.toLowerCase();
            if (msg.includes("already registered") || msg.includes("already exists") || error.status === 400) {
                const modalContent = document.querySelector('#modal-auth .auth-modal-box');
                if (modalContent) {
                    modalContent.innerHTML = `
                        <button class="cerrar-modal" onclick="cerrarModalAuth()">&times;</button>
                        <div style="text-align: center; padding: 10px 0;">
                            <span style="font-size: 3rem; display: block; margin-bottom: 15px;">🔑</span>
                            <h3 class="protocolo-titulo" style="margin-bottom: 15px;">¡Cuenta ya registrada!</h3>
                            <p style="color: #ddd; font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px;">
                                El correo <strong style="color: var(--color-acento);">${email}</strong> ya tiene una cuenta activa.
                            </p>
                            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                                <button type="button" class="btn-tuna-ui full-width" onclick="abrirModalAuthConEmail('login', '${email}')">Iniciar Sesión</button>
                                <button type="button" class="btn-sutil-logout" style="padding: 12px; font-size: 0.85rem;" onclick="abrirModalRecuperarPasswordModal()">¿Has olvidado tu contraseña?</button>
                            </div>
                            <div id="forgot-status" class="mensaje-estado" style="margin-top: 15px;"></div>
                        </div>
                    `;
                }
            } else {
                if (status) status.innerText = "Error al registrar: " + error.message;
            }
        } else {
            if (data && data.user) {
                await supabaseClient.from('profiles').upsert({
                    id: data.user.id,
                    email: email,
                    nombre: nombre,
                    apellidos: apellidos,
                    mote: mote,
                    tuna_nombre: tunaNombre,
                    role: 'user',
                    acepta_lopd: aceptaLopd,
                    acepta_newsletter: aceptaNewsletter,
                    fecha_consentimiento: fechaAhora
                });

                if (aceptaNewsletter) {
                    await supabaseClient.from('newsletter').upsert({
                        email: email,
                        user_id: data.user.id,
                        estado: 'activo'
                    }, { onConflict: 'email' });
                }
            }

            const modalContent = document.querySelector('#modal-auth .auth-modal-box');
            if (modalContent) {
                modalContent.innerHTML = `
                    <button class="cerrar-modal" onclick="cerrarModalAuth()">&times;</button>
                    <div style="text-align: center; padding: 10px 0;">
                        <span style="font-size: 3rem; display: block; margin-bottom: 15px;">📩</span>
                        <h3 class="protocolo-titulo" style="margin-bottom: 15px;">¡Registro completado!</h3>
                        <p style="color: #ddd; font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px;">
                            Hemos enviado un correo de confirmación a:<br><strong style="color: var(--color-acento);">${email}</strong>
                        </p>
                        <p style="color: #aaa; font-size: 0.85rem; line-height: 1.5; margin-bottom: 25px;">
                            Por motivos de seguridad y para evitar registros automáticos, 
                            <strong>haz clic en el enlace de ese correo</strong> para activar tu cuenta e inscribirte.
                        </p>
                        <button type="button" class="btn-tuna-ui full-width" onclick="cerrarModalAuth()">Entendido</button>
                    </div>
                `;
            }
        }
    }
};

window.abrirModalAuthConEmail = function(modo, email) {
    window.abrirModalAuth(modo);
    setTimeout(() => {
        const inputEmail = document.getElementById('auth-email');
        if (inputEmail) inputEmail.value = email;
    }, 50);
};

window.cerrarSesionUsuario = async function() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
        window.cerrarModalPerfil();
        comprobarEstadoSesion();
    }
};

/* --- 3. BUSCADOR PREDICTIVO DE TUNAS --- */
function configurarBuscadorTunas() {
    const searchInput = document.getElementById('p-tuna-search');
    const resultsList = document.getElementById('tuna-results-list');
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

function configurarBuscadorTunasModalAuth() {
    const searchInput = document.getElementById('auth-tuna-search');
    const resultsList = document.getElementById('auth-tuna-results-list');
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

/* --- 4. ENVÍO DE INSCRIPCIÓN Y REGISTRO/SINCRONIZACIÓN AUTOMÁTICA EN PROFILES --- */
window.registrarParticipante = async function(event) {
    event.preventDefault();
    const statusBox = document.getElementById('participa-estado');
    if (statusBox) statusBox.innerText = "Enviando inscripción...";

    if (!supabaseClient) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.user) {
        if (statusBox) statusBox.innerText = "Error: Debes iniciar sesión para inscribirte.";
        return;
    }

    try {
        const { data: userProfile } = await supabaseClient
            .from('profiles')
            .select('baneado, vetado_inscripcion, motivo_sancion')
            .eq('id', session.user.id)
            .maybeSingle();

        if (userProfile && (userProfile.baneado || userProfile.vetado_inscripcion)) {
            const motivo = userProfile.motivo_sancion ? ` Motivo: ${userProfile.motivo_sancion}` : '';
            if (statusBox) {
                statusBox.innerText = `⛔ Tu cuenta tiene restringida la inscripción para este año.${motivo}`;
                statusBox.style.color = "#ff4444";
            }
            return;
        }

        let anioActivo = 2027;
        const { data: cfgAnio } = await supabaseClient
            .from('configuracion')
            .select('valor')
            .eq('clave', 'anio_edicion')
            .maybeSingle();

        if (cfgAnio && cfgAnio.valor) {
            anioActivo = parseInt(cfgAnio.valor);
        }

        const nombreVal = document.getElementById('p-nombre')?.value.trim() || '';
        const apellidosVal = document.getElementById('p-apellidos')?.value.trim() || '';
        const moteVal = document.getElementById('p-mote')?.value.trim() || '';
        const tunaVal = document.getElementById('p-tuna-search')?.value.trim() || '';
        const deseaNewsletter = document.getElementById('p-check-newsletter')?.checked || false;

        const payload = {
            user_id: session.user.id,
            anio: anioActivo,
            nombre: nombreVal,
            apellidos: apellidosVal,
            mote: moteVal,
            tuna_nombre: tunaVal,
            telefono: document.getElementById('p-telefono').value.trim(),
            email: session.user.email,
            primer_anio: document.getElementById('p-primer-anio').value === 'Sí',
            asiste_comida: document.getElementById('p-comida').value === 'Sí',
            asiste_ronda: document.getElementById('p-ronda').value === 'Sí',
            asiste_madruga: document.getElementById('p-madruga').value === 'Sí',
            instrumento: document.getElementById('p-instrumento').value
        };

        const { error } = await supabaseClient.from('inscripciones').insert([payload]);

        if (error) {
            if (error.code === '23505') {
                if (statusBox) statusBox.innerText = `Ya has enviado tu inscripción para la edición de ${anioActivo}.`;
            } else {
                if (statusBox) statusBox.innerText = "Error al guardar la inscripción: " + error.message;
            }
        } else {
            await supabaseClient.from('profiles').upsert({
                id: session.user.id,
                email: session.user.email,
                nombre: nombreVal,
                apellidos: apellidosVal,
                mote: moteVal,
                tuna_nombre: tunaVal,
                acepta_newsletter: deseaNewsletter,
                fecha_consentimiento: new Date().toISOString()
            });

            if (deseaNewsletter) {
                await supabaseClient.from('newsletter').upsert({
                    email: session.user.email,
                    user_id: session.user.id,
                    estado: 'activo'
                }, { onConflict: 'email' });
            }

            if (statusBox) statusBox.innerText = "¡Inscripción enviada con éxito! Nos vemos en la Madrugá.";
            document.getElementById('form-participa').reset();
            comprobarEstadoSesion();
        }
    } catch (e) {
        if (statusBox) statusBox.innerText = "Error procesando inscripción: " + e.message;
    }
};

/* --- 5. MODAL GLOBAL DE PERFIL Y GESTIÓN DE SUSCRIPCIÓN --- */
function inyectarModalPerfilGlobal() {
    if (document.getElementById('modal-perfil')) return;

    const modalHTML = `
    <div id="modal-perfil" class="modal-interno" style="display: none;">
        <div class="modal-contenido perfil-modal-box">
            <button class="cerrar-modal" onclick="cerrarModalPerfil()">&times;</button>

            <div class="perfil-card-header">
                <div class="perfil-avatar"><span id="perfil-mote-inicial">T</span></div>
                <div class="perfil-datos-principal">
                    <h3 id="perfil-nombre-completo">Cargando...</h3>
                    <p id="perfil-tuna-tag" class="perfil-tuna-badge">Tuna no especificada</p>
                    <div class="perfil-stats">
                        <div class="stat-item"><span id="perfil-total-asistencias" class="stat-num">0</span><span class="stat-label">Madrugás</span></div>
                        <div class="stat-item"><span id="perfil-fajin-anio" class="stat-num">-</span><span class="stat-label">Año Debut</span></div>
                    </div>
                </div>
            </div>

            <div class="perfil-seccion">
                <h4 class="perfil-subtitulo">📜 Histórico de Asistencias</h4>
                <div class="tabla-contenedor-perfil">
                    <table class="tabla-tunos">
                        <thead>
                            <tr><th>Año</th><th>Tuna</th><th>Comida</th><th>Ronda</th><th>Madrugá</th><th>Instrumento</th></tr>
                        </thead>
                        <tbody id="perfil-historico-body">
                            <tr><td colspan="6" style="text-align:center; color:#888;">Cargando histórico...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="perfil-seccion">
                <h4 class="perfil-subtitulo">📩 Preferencias de Comunicaciones (Boletín)</h4>
                <div style="background: rgba(212,175,55,0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(212,175,55,0.2);">
                    <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; color: #fff; font-size: 0.85rem;">
                        <span>Recibir boletines informativos y novedades por email</span>
                        <input type="checkbox" id="perfil-check-newsletter" onchange="toggleSuscripcionNewsletterPerfil(this.checked)" style="accent-color: var(--color-acento); transform: scale(1.3); cursor: pointer;">
                    </label>
                    <p id="perfil-newsletter-status" style="font-size: 0.75rem; color: #aaa; margin-top: 8px; margin-bottom: 0;"></p>
                </div>
            </div>

            <div class="perfil-seccion">
                <h4 class="perfil-subtitulo">⚙️ Gestión de Datos Personales</h4>
                <form id="form-actualizar-perfil" onsubmit="actualizarDatosPerfil(event)">
                    <div class="form-grid-perfil">
                        <div class="input-group"><label>Teléfono Móvil</label><input type="tel" id="perfil-edit-telefono" required></div>
                        <div class="input-group">
                            <label>Instrumento Principal</label>
                            <select id="perfil-edit-instrumento" required>
                                <option value="Guitarra">Guitarra</option>
                                <option value="Bandurria">Bandurria</option>
                                <option value="Laúd">Laúd</option>
                                <option value="Contrabajo">Contrabajo / Bajo</option>
                                <option value="Pandereta">Pandereta</option>
                                <option value="Acordeón">Acordeón</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="btn-tuna-ui full-width" style="margin-top:10px;">Guardar Cambios de Contacto</button>
                </form>

                <form id="form-cambiar-pass" onsubmit="actualizarPasswordPerfil(event)" style="margin-top: 15px;">
                    <div class="input-group"><label>Nueva Contraseña</label><input type="password" id="perfil-nueva-pass" placeholder="••••••••" required minlength="6"></div>
                    <button type="submit" class="btn-sutil-logout full-width" style="padding: 10px;">Cambiar Contraseña</button>
                </form>
                <div id="perfil-estado-msg" class="mensaje-estado"></div>
            </div>

            <button type="button" class="btn-sutil-logout full-width" onclick="cerrarSesionUsuario()" style="margin-top: 20px; color: #ff5555; border-color: #ff5555;">Cerrar Sesión Activa</button>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.abrirModalPerfil = async function() {
    if (!supabaseClient) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.user) return;

    inyectarModalPerfilGlobal();

    const modal = document.getElementById('modal-perfil');
    if (modal) modal.style.display = 'flex';

    const [{ data: profile }, { data: inscripciones }] = await Promise.all([
        supabaseClient.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
        supabaseClient.from('inscripciones').select('*').eq('user_id', session.user.id).order('anio', { ascending: false })
    ]);

    const ultInscripcion = (inscripciones && inscripciones.length > 0) ? inscripciones[0] : null;

    const nombreCompleto = profile?.nombre 
        ? `${profile.nombre} ${profile.apellidos || ''}` 
        : (ultInscripcion ? `${ultInscripcion.nombre} ${ultInscripcion.apellidos}` : session.user.email);

    const mote = profile?.mote || ultInscripcion?.mote || '';
    const tunaNombre = profile?.tuna_nombre || ultInscripcion?.tuna_nombre || 'Tuna no especificada';

    document.getElementById('perfil-nombre-completo').innerText = mote ? `${nombreCompleto} ("${mote}")` : nombreCompleto;
    document.getElementById('perfil-tuna-tag').innerText = tunaNombre;
    
    const inicial = (mote || nombreCompleto || 'T').charAt(0).toUpperCase();
    document.getElementById('perfil-mote-inicial').innerText = inicial;

    const checkNews = document.getElementById('perfil-check-newsletter');
    const statusNews = document.getElementById('perfil-newsletter-status');
    const estaSuscrito = profile?.acepta_newsletter || false;

    if (checkNews) checkNews.checked = estaSuscrito;
    if (statusNews) {
        statusNews.innerText = estaSuscrito 
            ? "Estado: Suscrito activamente al boletín." 
            : "Estado: No suscrito o has cancelado las comunicaciones.";
        statusNews.style.color = estaSuscrito ? "#2ecc71" : "#ffaa00";
    }

    if (inscripciones && inscripciones.length > 0) {
        document.getElementById('perfil-total-asistencias').innerText = inscripciones.length;

        const primerReg = inscripciones.find(i => i.primer_anio) || inscripciones[inscripciones.length - 1];
        document.getElementById('perfil-fajin-anio').innerText = primerReg ? primerReg.anio : '-';

        document.getElementById('perfil-edit-telefono').value = ultInscripcion.telefono || '';
        document.getElementById('perfil-edit-instrumento').value = ultInscripcion.instrumento || 'Guitarra';

        const tbody = document.getElementById('perfil-historico-body');
        tbody.innerHTML = '';
        
        inscripciones.forEach(i => {
            const tr = document.createElement('tr');
            const botonCancelar = (i.anio >= 2026) 
                ? `<button onclick="cancelarInscripcionActiva('${i.id}')" class="btn-cancelar-asistencia" title="Cancelar asistencia">Cancelar</button>`
                : '';
                
            tr.innerHTML = `
                <td><strong>${i.anio}</strong> ${botonCancelar}</td>
                <td style="font-size:0.8rem">${i.tuna_nombre}</td>
                <td>${i.asiste_comida ? '✅' : '❌'}</td>
                <td>${i.asiste_ronda ? '✅' : '❌'}</td>
                <td>${i.asiste_madruga ? '✅' : '❌'}</td>
                <td>${i.instrumento}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        document.getElementById('perfil-total-asistencias').innerText = '0';
        document.getElementById('perfil-fajin-anio').innerText = '-';
        document.getElementById('perfil-historico-body').innerHTML = `
            <tr><td colspan="6" style="text-align:center; color:#aaa;">Aún no tienes inscripciones registradas.</td></tr>
        `;
    }
};

window.toggleSuscripcionNewsletterPerfil = async function(nuevoEstado) {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const statusNews = document.getElementById('perfil-newsletter-status');
    if (statusNews) statusNews.innerText = "Guardando preferencia...";

    await supabaseClient.from('profiles').update({
        acepta_newsletter: nuevoEstado,
        fecha_consentimiento: new Date().toISOString()
    }).eq('id', session.user.id);

    if (nuevoEstado) {
        await supabaseClient.from('newsletter').upsert({
            email: session.user.email,
            user_id: session.user.id,
            estado: 'activo',
            updated_at: new Date().toISOString()
        }, { onConflict: 'email' });
        if (statusNews) {
            statusNews.innerText = "Estado: Suscrito activamente al boletín.";
            statusNews.style.color = "#2ecc71";
        }
    } else {
        await supabaseClient.from('newsletter').update({
            estado: 'cancelado',
            updated_at: new Date().toISOString()
        }).eq('email', session.user.email);

        if (statusNews) {
            statusNews.innerText = "Estado: No suscrito o has cancelado las comunicaciones.";
            statusNews.style.color = "#ffaa00";
        }
    }
};

window.cerrarModalPerfil = function() {
    const modal = document.getElementById('modal-perfil');
    if (modal) modal.style.display = 'none';
};

window.gestionarBotonPerfil = async function() {
    if (!supabaseClient) return;

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session && session.user) {
        window.abrirModalPerfil();
    } else {
        window.abrirModalAuth('login');
    }
};

window.cancelarInscripcionActiva = async function(idInscripcion) {
    if (!confirm("¿Estás seguro de que deseas cancelar tu asistencia? Liberará tu plaza.")) return;
    if (!supabaseClient) return;

    const { error } = await supabaseClient.from('inscripciones').delete().eq('id', idInscripcion);

    if (error) {
        alert("Error al cancelar la inscripción: " + error.message);
    } else {
        alert("Tu asistencia ha sido cancelada correctamente.");
        if (document.getElementById('modal-perfil')?.style.display === 'flex') window.abrirModalPerfil();
        comprobarEstadoSesion();
    }
};

window.actualizarDatosPerfil = async function(event) {
    event.preventDefault();
    const status = document.getElementById('perfil-estado-msg');
    status.innerText = "Guardando cambios...";

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const tel = document.getElementById('perfil-edit-telefono').value;
    const inst = document.getElementById('perfil-edit-instrumento').value;

    const { error } = await supabaseClient
        .from('inscripciones')
        .update({ telefono: tel, instrumento: inst })
        .eq('user_id', session.user.id);

    if (error) {
        status.innerText = "Error al actualizar los datos.";
    } else {
        status.innerText = "¡Datos actualizados con éxito!";
        window.abrirModalPerfil();
    }
};

window.actualizarPasswordPerfil = async function(event) {
    event.preventDefault();
    const status = document.getElementById('perfil-estado-msg');
    const newPass = document.getElementById('perfil-nueva-pass').value;

    status.innerText = "Cambiando contraseña...";

    const { error } = await supabaseClient.auth.updateUser({ password: newPass });

    if (error) {
        status.innerText = "Error al cambiar la contraseña: " + error.message;
    } else {
        status.innerText = "¡Contraseña cambiada correctamente!";
        document.getElementById('perfil-nueva-pass').value = '';
    }
};