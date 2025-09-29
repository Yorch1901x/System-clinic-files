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
let currentMode = 'ingreso'; // 'ingreso' or 'salida'

/**
 * Cambia el modo de inventario.
 */
const setMode = (mode) => {
    currentMode = mode;
    const ingresoSection = document.getElementById('ingreso-section');
    const salidaSection = document.getElementById('salida-section');
    const ingresoBtn = document.getElementById('ingreso-btn');
    const salidaBtn = document.getElementById('salida-btn');

    if (mode === 'ingreso') {
        ingresoSection.classList.remove('hidden');
        salidaSection.classList.add('hidden');
        ingresoBtn.classList.add('bg-gradient-to-r', 'from-sky-500', 'to-emerald-500');
        ingresoBtn.classList.remove('bg-gray-500');
        salidaBtn.classList.remove('bg-gradient-to-r', 'from-red-500', 'to-orange-500');
        salidaBtn.classList.add('bg-gray-500');

        // Remover columna de checkbox en modo ingreso
        const headerRow = tableHead.querySelector('tr');
        const checkboxTh = headerRow.querySelector('th.checkbox');
        if (checkboxTh) {
            checkboxTh.remove();
        }
        // Remover listeners si existen
        const selectAll = document.getElementById('select-all');
        if (selectAll) {
            selectAll.removeEventListener('change', selectAllHandler);
        }
    } else {
        ingresoSection.classList.add('hidden');
        salidaSection.classList.remove('hidden');
        salidaBtn.classList.add('bg-gradient-to-r', 'from-red-500', 'to-orange-500');
        salidaBtn.classList.remove('bg-gray-500');
        ingresoBtn.classList.remove('bg-gradient-to-r', 'from-sky-500', 'to-emerald-500');
        ingresoBtn.classList.add('bg-gray-500');

        // Agregar columna de checkbox en modo salida si no existe
        const headerRow = tableHead.querySelector('tr');
        if (!headerRow.querySelector('th.checkbox')) {
            const checkboxTh = document.createElement('th');
            checkboxTh.className = 'p-4 font-semibold text-gray-300 text-center checkbox';
            checkboxTh.innerHTML = '<input type="checkbox" id="select-all" class="rounded border-gray-600 text-blue-600 focus:ring-blue-500">';
            headerRow.insertBefore(checkboxTh, headerRow.firstChild);
        }
        // Agregar listener para select-all (solo una vez)
        const selectAll = document.getElementById('select-all');
        if (selectAll && !selectAll.hasAttribute('data-listener-added')) {
            selectAll.addEventListener('change', selectAllHandler);
            selectAll.setAttribute('data-listener-added', 'true');
        }
    }
    renderTable();
};

// Handler global para select-all para evitar múltiples listeners
const selectAllHandler = (e) => {
    document.querySelectorAll('.product-checkbox').forEach(cb => cb.checked = e.target.checked);
};

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
        let checkboxHtml = '';
        if (currentMode === 'salida') {
            checkboxHtml = '<td class="p-4 text-center"><input type="checkbox" class="product-checkbox rounded border-gray-600 text-blue-600 focus:ring-blue-500" data-id="' + product.id + '"></td>';
        }
        let actionsHtml = `
            <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors duration-200 mr-2">
                Eliminar
            </button>
        `;
        if (currentMode === 'salida') {
            actionsHtml += `
                <button class="salida-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors duration-200">
                    Salida Individual
                </button>
            `;
        }
        row.innerHTML = `
            ${checkboxHtml}
            <td class="p-4">${product.name}</td>
            <td class="p-4">${product.code}</td>
            <td class="p-4 text-right quantity-cell" data-quantity="${product.quantity}">${product.quantity}</td>
            <td class="p-4 text-center">
                ${actionsHtml}
            </td>
        `;
        row.setAttribute('data-name', product.name);
        row.setAttribute('data-code', product.code);
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

/**
 * Actualiza la cantidad de un producto en Firestore.
 */
const updateProductQuantity = async (docId, newQuantity) => {
    if (newQuantity < 0) {
        showError('La cantidad no puede ser negativa.');
        return;
    }
    try {
        await firebase.firestore().collection('inventario').doc(docId).update({
            quantity: newQuantity
        });
        await loadProducts(); // Recarga la lista
    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        showError('Error al actualizar cantidad: ' + error.message);
    }
};

/**
 * Registra una salida en la colección 'salidas de inventario'.
 */
const recordSalida = async (productId, name, code, quantityExited, observation) => {
    try {
        await firebase.firestore().collection('salidas de inventario').add({
            productId,
            name,
            code,
            quantityExited,
            observation: observation || 'Sin observación',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userId: firebase.auth().currentUser ? firebase.auth().currentUser.uid : null
        });
    } catch (error) {
        console.error('Error al registrar salida:', error);
        showError('Error al registrar salida: ' + error.message);
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

// Manejador para eliminar un producto y salida individual (usando delegación de eventos)
tableBody.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-btn')) {
        const row = e.target.closest('tr');
        const docId = row.getAttribute('data-id');
        
        // Aplica animación de salida
        row.classList.add('animate-fade-out-up');

        // Elimina el producto después de la animación
        setTimeout(async () => {
            await deleteProduct(docId);
        }, 500);
    } else if (e.target.closest('.salida-btn')) {
        const row = e.target.closest('tr');
        const docId = row.getAttribute('data-id');
        const name = row.getAttribute('data-name');
        const code = row.getAttribute('data-code');
        const quantityCell = row.querySelector('.quantity-cell');
        const currentQuantity = parseInt(quantityCell.dataset.quantity);
        
        const exitedQuantityStr = prompt(`Cantidad a salir para ${name} (actual: ${currentQuantity}):`);
        const exitedQuantity = parseInt(exitedQuantityStr);
        if (!exitedQuantityStr || isNaN(exitedQuantity) || exitedQuantity <= 0 || exitedQuantity > currentQuantity) {
            showError('Cantidad inválida. Debe ser un número positivo menor o igual a la cantidad actual.');
            return;
        }
        
        const observation = prompt('Observación (opcional, presiona Enter para "Sin observación"):') || 'Sin observación';
        
        const newQuantity = currentQuantity - exitedQuantity;
        await updateProductQuantity(docId, newQuantity);
        await recordSalida(docId, name, code, exitedQuantity, observation);
        showError(`Salida individual registrada: ${exitedQuantity} unidades de ${name}. Nueva cantidad: ${newQuantity}`);
    }
});

// Manejadores para botones de modo
document.getElementById('ingreso-btn').addEventListener('click', () => setMode('ingreso'));
document.getElementById('salida-btn').addEventListener('click', () => setMode('salida'));

// Manejador para Procesar Salida Múltiple
document.getElementById('process-salida-btn').addEventListener('click', async () => {
    const selectedCheckboxes = document.querySelectorAll('.product-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        showError('Selecciona al menos un producto para procesar la salida.');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const checkbox of selectedCheckboxes) {
        const row = checkbox.closest('tr');
        const docId = row.getAttribute('data-id');
        const name = row.getAttribute('data-name');
        const code = row.getAttribute('data-code');
        const quantityCell = row.querySelector('.quantity-cell');
        const currentQuantity = parseInt(quantityCell.dataset.quantity);

        const exitedQuantityStr = prompt(`Cantidad a salir para ${name} (actual: ${currentQuantity}):`);
        const exitedQuantity = parseInt(exitedQuantityStr);
        if (!exitedQuantityStr || isNaN(exitedQuantity) || exitedQuantity <= 0 || exitedQuantity > currentQuantity) {
            showError(`Cantidad inválida para ${name}. Omitiendo este producto.`);
            errorCount++;
            continue;
        }
        
        const observation = prompt(`Observación para ${name} (opcional):`) || 'Sin observación';
        
        const newQuantity = currentQuantity - exitedQuantity;
        try {
            await updateProductQuantity(docId, newQuantity);
            await recordSalida(docId, name, code, exitedQuantity, observation);
            successCount++;
        } catch (err) {
            console.error('Error procesando salida múltiple:', err);
            errorCount++;
        }
    }

    showError(`Salida múltiple procesada: ${successCount} exitosos, ${errorCount} errores.`);
});

// Manejador para Ver Historial de Salidas
document.getElementById('view-salidas-btn').addEventListener('click', async () => {
    try {
        const snapshot = await firebase.firestore().collection('salidas de inventario').orderBy('timestamp', 'desc').limit(50).get();
        let salidas = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (salidas.length === 0) {
            showError('No hay registros de salidas.');
            return;
        }

        let historyHtml = '<div class="bg-white/5 backdrop-blur-md rounded-xl p-4 mb-4"><h3 class="text-lg font-bold mb-2">Historial de Salidas (últimos 50)</h3><table class="w-full text-left"><thead><tr><th class="p-2">Producto</th><th class="p-2">Código</th><th class="p-2">Cantidad</th><th class="p-2">Observación</th><th class="p-2">Fecha</th></tr></thead><tbody>';
        salidas.forEach(salida => {
            const date = salida.timestamp ? salida.timestamp.toDate().toLocaleString('es-ES') : 'N/A';
            historyHtml += `<tr class="border-b border-white/10"><td class="p-2">${salida.name}</td><td class="p-2">${salida.code}</td><td class="p-2">${salida.quantityExited}</td><td class="p-2">${salida.observation}</td><td class="p-2">${date}</td></tr>`;
        });
        historyHtml += '</tbody></table></div>';

        // Mostrar en un modal simple o alert, pero para mejor UX, insertar en el DOM
        const modal = document.createElement('div');
        modal.innerHTML = historyHtml;
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error al cargar historial de salidas:', error);
        showError('Error al cargar historial: ' + error.message);
    }
});

// --- RENDERIZADO INICIAL ---
loadProducts();
setMode('ingreso'); // Modo inicial

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
