// js/auth.js - Lógica de autenticación compartida

// Variables globales para auth
let firebaseAuthInstance = null;

// --- INICIALIZACIÓN DE FIREBASE ---
if (typeof firebase !== 'undefined') {
    firebaseAuthInstance = window.firebaseAuth || firebase.auth();
    
    // Observador de estado de autenticación (común a todas las páginas)
    if (firebaseAuthInstance) {
        firebaseAuthInstance.onAuthStateChanged((user) => {
            const currentPath = window.location.pathname.toLowerCase();
            if (user) {
                // Usuario autenticado: redirigir de login a index
                if (currentPath.includes('login.html')) {
                    window.location.href = 'index.html';
                }
            } else {
                // No autenticado: redirigir a login desde otras páginas
                if (currentPath.includes('index.html') || 
                    currentPath.includes('inventario.html') || 
                    currentPath.includes('llamada.html') || 
                    currentPath.includes('mensaje.html')) {
                    window.location.href = 'login.html';
                }
            }
        });
    }
} else {
    console.error('Firebase SDK no cargado. Verifica los scripts CDN.');
}

// Función para logout (común a todas las páginas)
const logout = () => {
    if (firebaseAuthInstance) {
        firebaseAuthInstance.signOut().then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Error en logout:', error);
            window.location.href = 'login.html';
        });
    } else {
        window.location.href = 'login.html';
    }
};

// Exponer logout globalmente
window.logout = logout;

// --- CÓDIGO ESPECÍFICO PARA PÁGINA DE LOGIN ---
if (window.location.pathname.toLowerCase().includes('login.html')) {
    // Funciones específicas para login
    let messageDiv, loginForm, registerForm, loginTab, registerTab;
    let loginEmail, loginPassword, registerName, registerEmail, registerPassword;

    /**
     * Muestra un mensaje temporal (error o éxito).
     */
    const showMessage = (text, isError = false) => {
        if (messageDiv) {
            messageDiv.textContent = text;
            messageDiv.className = `mb-4 p-3 rounded-lg text-center ${isError ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-green-500/20 border-green-500/30 text-green-300'}`;
            messageDiv.classList.remove('hidden');
            setTimeout(() => {
                messageDiv.classList.add('hidden');
            }, 5000);
        }
    };

    /**
     * Cambia a tab de login.
     */
    const switchToLogin = () => {
        if (loginForm && registerForm && loginTab && registerTab) {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            loginTab.classList.add('bg-white/10');
            registerTab.classList.remove('bg-white/10');
            loginTab.classList.remove('text-gray-300');
            registerTab.classList.add('text-gray-300');
        }
    };

    /**
     * Cambia a tab de registro.
     */
    const switchToRegister = () => {
        if (loginForm && registerForm && loginTab && registerTab) {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            registerTab.classList.add('bg-white/10');
            loginTab.classList.remove('bg-white/10');
            registerTab.classList.remove('text-gray-300');
            loginTab.classList.add('text-gray-300');
        }
    };

    /**
     * Registra un nuevo usuario.
     */
    const registerUser = async () => {
        if (!registerName || !registerEmail || !registerPassword) {
            showMessage('Campos no encontrados.', true);
            return;
        }
        const name = registerName.value.trim();
        const email = registerEmail.value.trim();
        const password = registerPassword.value.trim();

        if (!name || !email || !password) {
            showMessage('Todos los campos son obligatorios.', true);
            return;
        }
        if (password.length < 6) {
            showMessage('La contraseña debe tener al menos 6 caracteres.', true);
            return;
        }

        if (!firebaseAuthInstance) {
            showMessage('Firebase no inicializado. Verifica la configuración.', true);
            return;
        }

        try {
            const userCredential = await firebaseAuthInstance.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: name });
            showMessage('Registro exitoso. Redirigiendo...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            let errorMessage = 'Error en el registro.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'El correo ya está en uso.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Correo inválido.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Contraseña débil.';
                    break;
                default:
                    errorMessage = error.message || 'Error desconocido.';
            }
            showMessage(errorMessage, true);
        }
    };

    /**
     * Inicia sesión con un usuario existente.
     */
    const loginUser = async () => {
        if (!loginEmail || !loginPassword) {
            showMessage('Campos no encontrados.', true);
            return;
        }
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            showMessage('Correo y contraseña son obligatorios.', true);
            return;
        }

        if (!firebaseAuthInstance) {
            showMessage('Firebase no inicializado. Verifica la configuración.', true);
            return;
        }

        try {
            await firebaseAuthInstance.signInWithEmailAndPassword(email, password);
            showMessage('Login exitoso. Redirigiendo...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            let errorMessage = 'Error en el login.';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Usuario no encontrado.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Contraseña incorrecta.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Correo inválido.';
                    break;
                default:
                    errorMessage = error.message || 'Error desconocido.';
            }
            showMessage(errorMessage, true);
        }
    };

    // Esperar a DOM ready para agregar elementos y event listeners
    document.addEventListener('DOMContentLoaded', () => {
        messageDiv = document.getElementById('message');
        loginForm = document.getElementById('login-form');
        registerForm = document.getElementById('register-form');
        loginTab = document.getElementById('login-tab');
        registerTab = document.getElementById('register-tab');

        loginEmail = document.getElementById('login-email');
        loginPassword = document.getElementById('login-password');
        registerName = document.getElementById('register-name');
        registerEmail = document.getElementById('register-email');
        registerPassword = document.getElementById('register-password');

        if (loginTab && registerTab) {
            loginTab.addEventListener('click', switchToLogin);
            registerTab.addEventListener('click', switchToRegister);
        }

        // Inicializar en login
        switchToLogin();

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                registerUser();
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                loginUser();
            });
        }
    });
}
