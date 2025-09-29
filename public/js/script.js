// --- CONFIGURACIÓN DE FIREBASE (ya inicializada en firebase-config.js) ---

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
const form = document.getElementById('product-form');
const nameInput = document.getElementById('name');
const codeInput = document.getElementById('code');
const quantityInput = document.getElementById('quantity');
const tableBody = document.getElementById('product-table-body');
const errorMessage = document.getElementById('error-message');
const noProductsMessage = document.getElementById('no-products-message');
const tableHead = document.getElementById('table-head');

// --- ESTADO INICIAL DE LA APLICACIÓN ---
let products = [];

/**
 * Muestra un mensaje de error temporal.
 */
const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
    }, 3000);
};

/**
 * Renderiza la tabla de productos.
 */
const renderTable = () => {
    tableBody.innerHTML = '';

    if (products.length === 0) {
        noProductsMessage.classList.remove('hidden');
        return;
    }

    noProductsMessage.classList.add('hidden');

    products.forEach(product => {
        const row = document.createElement('tr');
        row.className = 'border-b border-white/10 hover:bg-white/5 transition-colors duration-200';
        row.setAttribute('data-id', product.id);
        row.innerHTML = `
            <td class="p-4">${product.name}</td>
            <td class="p-4">${product.code}</td>
            <td class="p-4 text-right">${product.quantity}</td>
            <td class="p-4 text-center">
                <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors duration-200">
                    Eliminar
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
};

/**
 * Carga los productos desde Firestore.
 */
const loadProducts = async () => {
    try {
        const snapshot = await firebase.firestore().collection('inventario').get();
        products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderTable();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showError('Error al cargar productos: ' + error.message);
    }
};

/**
 * Agrega un nuevo producto a Firestore.
 */
const addProduct = async (productData) => {
    try {
        await firebase.firestore().collection('inventario').add(productData);
        await loadProducts(); // Recarga la lista
        form.reset();
        // Animación para la nueva fila (se aplicará en renderTable si se modifica)
    } catch (error) {
        console.error('Error al agregar producto:', error);
        showError('Error al agregar producto: ' + error.message);
    }
};

/**
 * Elimina un producto de Firestore.
 */
const deleteProduct = async (docId) => {
    try {
        await firebase.firestore().collection('inventario').doc(docId).delete();
        await loadProducts(); // Recarga la lista
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        showError('Error al eliminar producto: ' + error.message);
    }
};

// --- MANEJADORES DE EVENTOS ---

// Manejador para agregar un producto
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const code = codeInput.value.trim();
    const quantity = quantityInput.value;

    if (!name || !code || !quantity) {
        showError('Todos los campos son obligatorios.');
        return;
    }
    if (parseInt(quantity, 10) <= 0) {
        showError('La cantidad debe ser un número positivo.');
        return;
    }

    const newProduct = {
        name,
        code,
        quantity: parseInt(quantity, 10),
    };

    await addProduct(newProduct);
});

// Manejador para eliminar un producto (usando delegación de eventos)
tableBody.addEventListener('click', async (e) => {
    const deleteButton = e.target.closest('.delete-btn');
    if (deleteButton) {
        const row = deleteButton.closest('tr');
        const docId = row.getAttribute('data-id');
        
        // Aplica animación de salida
        row.classList.add('animate-fade-out-up');

        // Elimina el producto después de la animación
        setTimeout(async () => {
            await deleteProduct(docId);
        }, 500);
    }
});

// --- RENDERIZADO INICIAL ---
loadProducts();

// --- MANEJADOR PARA SUBIR EXCEL ---
const excelFileInput = document.getElementById('excel-file');

if (excelFileInput) {
    excelFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.match(/\.(xlsx|xls)$/)) {
            showError('Solo archivos Excel (.xlsx, .xls) son permitidos.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length <= 1) {
                    showError('El archivo Excel está vacío o no tiene datos.');
                    return;
                }

                // Asumir primera fila son headers, empezar desde fila 2
                const rows = jsonData.slice(1);
                let successCount = 0;
                let errorCount = 0;

                for (const row of rows) {
                    const name = (row[0] || '').toString().trim();
                    const code = (row[1] || '').toString().trim();
                    const quantityStr = (row[2] || '').toString().trim();
                    const quantity = parseInt(quantityStr, 10);

                    if (!name || !code || isNaN(quantity) || quantity <= 0) {
                        errorCount++;
                        continue;
                    }

                    try {
                        await addProduct({ name, code, quantity });
                        successCount++;
                    } catch (err) {
                        errorCount++;
                        console.error('Error agregando fila de Excel:', err);
                    }
                }

                const message = `Importación completada: ${successCount} agregados, ${errorCount} errores.`;
                showError(message, false); // No es error, pero usa showError para mostrar (modificar si se quiere showSuccess separado)

                // Reset input
                e.target.value = '';
            } catch (error) {
                console.error('Error procesando Excel:', error);
                showError('Error al procesar el archivo Excel: ' + error.message);
            }
        };

        reader.readAsArrayBuffer(file);
    });
}
