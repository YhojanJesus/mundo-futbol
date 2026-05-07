// ==================== CONFIGURACIÓN API ====================
const API_URL = window.location.origin + '/api';

// ==================== MODO OSCURO/CLARO ====================
function initModoOscuro() {
    const modoGuardado = localStorage.getItem('modoOscuro');
    if (modoGuardado === 'true') {
        document.body.classList.add('modo-oscuro');
    }
    
    const botonModo = document.getElementById('btnModoOscuro');
    if (botonModo) {
        botonModo.textContent = document.body.classList.contains('modo-oscuro') ? '☀️' : '🌙';
        botonModo.addEventListener('click', () => {
            document.body.classList.toggle('modo-oscuro');
            const esOscuro = document.body.classList.contains('modo-oscuro');
            localStorage.setItem('modoOscuro', esOscuro);
            botonModo.textContent = esOscuro ? '☀️' : '🌙';
        });
    }
}

// ==================== BOTÓN VOLVER ARRIBA ====================
function initVolverArriba() {
    const btnVolver = document.getElementById('btnVolverArriba');
    if (!btnVolver) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btnVolver.classList.add('visible');
        } else {
            btnVolver.classList.remove('visible');
        }
    });
    
    btnVolver.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ==================== CONFIRMAR ENLACES EXTERNOS ====================
function initConfirmarEnlacesExternos() {
    const enlaces = document.querySelectorAll('a[href^="http"]');
    enlaces.forEach(enlace => {
        const dominioLocal = window.location.hostname;
        try {
            const enlaceHost = new URL(enlace.href).hostname;
            if (enlaceHost !== dominioLocal && enlaceHost !== '') {
                enlace.addEventListener('click', (e) => {
                    const confirmar = confirm('⚠️ ¿Estás seguro de que deseas salir de este sitio?');
                    if (!confirmar) {
                        e.preventDefault();
                    }
                });
            }
        } catch(e) {
            // Si hay error al parsear la URL, ignorar
        }
    });
}

// ==================== LISTA DINÁMICA (CONECTADA A MONGODB) ====================
async function initListaDinamica() {
    const input = document.getElementById('nuevoItem');
    const btnAgregar = document.getElementById('agregarItem');
    const lista = document.getElementById('listaDinamica');
    
    if (!input || !btnAgregar || !lista) return;
    
    // Cargar momentos desde MongoDB
    async function cargarMomentos() {
        try {
            const res = await fetch(`${API_URL}/momentos`);
            const data = await res.json();
            if (data.success && data.momentos) {
                lista.innerHTML = '';
                if (data.momentos.length === 0) {
                    lista.innerHTML = '<li style="opacity:0.7;">No hay momentos guardados aún. ¡Agrega el primero!</li>';
                    return;
                }
                data.momentos.forEach(m => {
                    const li = document.createElement('li');
                    const span = document.createElement('span');
                    span.textContent = m.descripcion;
                    
                    const btnEliminar = document.createElement('button');
                    btnEliminar.textContent = '🗑️';
                    btnEliminar.title = 'Eliminar momento';
                    btnEliminar.style.cssText = 'background: rgba(0,0,0,0.4); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 14px; flex-shrink: 0; transition: all 0.2s ease;';
                    btnEliminar.onmouseover = () => btnEliminar.style.background = '#9b59b6';
                    btnEliminar.onmouseout = () => btnEliminar.style.background = 'rgba(0,0,0,0.4)';
                    btnEliminar.onclick = async () => {
                        if (confirm('¿Eliminar este momento?')) {
                            try {
                                const res = await fetch(`${API_URL}/momentos/${m._id}`, { method: 'DELETE' });
                                const data = await res.json();
                                if (data.success) {
                                    cargarMomentos();
                                } else {
                                    alert('Error al eliminar: ' + data.message);
                                }
                            } catch(e) {
                                alert('Error de conexión al eliminar');
                            }
                        }
                    };
                    
                    li.appendChild(span);
                    li.appendChild(btnEliminar);
                    lista.appendChild(li);
                });
            } else {
                lista.innerHTML = '<li style="opacity:0.7;">No hay momentos guardados aún</li>';
            }
        } catch(e) {
            lista.innerHTML = '<li style="color:#ffcccc;">Error al cargar momentos. ¿Está el servidor corriendo?</li>';
        }
    }
    
    btnAgregar.addEventListener('click', async () => {
        const texto = input.value.trim();
        if (texto === '') {
            alert('Por favor, escribe un momento para agregar.');
            return;
        }
        
        try {
            const res = await fetch(`${API_URL}/momentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descripcion: texto })
            });
            const data = await res.json();
            if (data.success) {
                input.value = '';
                cargarMomentos();
            } else {
                alert('Error: ' + data.message);
            }
        } catch(e) {
            alert('Error de conexión. Verifica que el servidor esté corriendo.');
        }
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnAgregar.click();
        }
    });
    
    // Cargar momentos al iniciar
    cargarMomentos();
}

// ==================== GALERÍA INTERACTIVA ====================
function initGaleriaInteractiva() {
    const imagenesMiniatura = document.querySelectorAll('.miniatura');
    const imagenPrincipal = document.getElementById('imagenPrincipal');
    
    if (!imagenPrincipal || imagenesMiniatura.length === 0) return;
    
    imagenesMiniatura.forEach(img => {
        img.addEventListener('click', () => {
            imagenPrincipal.src = img.src;
            imagenPrincipal.alt = img.alt;
        });
    });
}

// ==================== CONTADOR DE RESPUESTAS (QUIZ) ====================
function initContadorQuiz() {
    const preguntas = document.querySelectorAll('.pregunta-quiz');
    const contador = document.getElementById('contadorRespuestas');
    
    if (!contador || preguntas.length === 0) return;
    
    function actualizarContador() {
        let seleccionadas = 0;
        preguntas.forEach(pregunta => {
            const radios = pregunta.querySelectorAll('input[type="radio"]');
            const algunaSeleccionada = Array.from(radios).some(radio => radio.checked);
            if (algunaSeleccionada) seleccionadas++;
        });
        contador.textContent = `${seleccionadas} / ${preguntas.length}`;
    }
    
    const todosRadios = document.querySelectorAll('.pregunta-quiz input[type="radio"]');
    todosRadios.forEach(radio => {
        radio.addEventListener('change', actualizarContador);
    });
    
    actualizarContador();
}

// ==================== CARRUSEL DE IMÁGENES ====================
function initCarrusel() {
    const imagenes = [
        'images/messi.jpg',
        'images/maradona.jpg',
        'images/cristiano.jpg',
        'images/imagen1.jpg',
        'images/imagen2.jpg'
    ];
    
    let indiceActual = 0;
    const imgCarrusel = document.getElementById('imgCarrusel');
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const indicador = document.getElementById('indicadorCarrusel');
    
    if (!imgCarrusel) return;
    
    function actualizarCarrusel() {
        imgCarrusel.src = imagenes[indiceActual];
        if (indicador) indicador.textContent = `${indiceActual + 1} / ${imagenes.length}`;
    }
    
    if (btnAnterior) {
        btnAnterior.addEventListener('click', () => {
            indiceActual = (indiceActual - 1 + imagenes.length) % imagenes.length;
            actualizarCarrusel();
        });
    }
    
    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', () => {
            indiceActual = (indiceActual + 1) % imagenes.length;
            actualizarCarrusel();
        });
    }
    
    // Auto-reproducción cada 4 segundos
    setInterval(() => {
        if (btnSiguiente && document.body.contains(imgCarrusel)) {
            indiceActual = (indiceActual + 1) % imagenes.length;
            actualizarCarrusel();
        }
    }, 4000);
    
    actualizarCarrusel();
}

// ==================== BOTÓN ME GUSTA con localStorage ====================
function initMeGusta() {
    const btnLike = document.getElementById('btnMeGusta');
    const contadorLike = document.getElementById('contadorLike');
    
    if (!btnLike || !contadorLike) return;
    
    let likes = localStorage.getItem('meGusta');
    if (likes === null) {
        likes = 0;
    } else {
        likes = parseInt(likes);
    }
    contadorLike.textContent = likes;
    
    btnLike.addEventListener('click', () => {
        likes++;
        contadorLike.textContent = likes;
        localStorage.setItem('meGusta', likes);
        
        btnLike.style.transform = 'scale(1.2)';
        setTimeout(() => {
            btnLike.style.transform = 'scale(1)';
        }, 200);
    });
}

// ==================== VALIDACIÓN DE FORMULARIO (GUARDA EN MONGODB) ====================
function initValidacionFormulario() {
    const formulario = document.getElementById('formularioRegistro');
    if (!formulario) return;
    
    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let errores = [];
        const nombre = document.getElementById('nombre');
        const correo = document.getElementById('correo');
        const telefono = document.getElementById('tel');
        const mensaje = document.getElementById('mensaje');
        const posicionSeleccionada = document.querySelector('input[name="posicion"]:checked');
        
        // Validaciones
        if (!nombre.value.trim()) {
            errores.push('El nombre es obligatorio.');
            nombre.style.borderColor = 'red';
        } else {
            nombre.style.borderColor = '#ddd';
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!correo.value.trim() || !emailRegex.test(correo.value)) {
            errores.push('Ingresa un email válido (ejemplo@correo.com).');
            correo.style.borderColor = 'red';
        } else {
            correo.style.borderColor = '#ddd';
        }
        
        if (!mensaje.value.trim()) {
            errores.push('El mensaje/experiencia no puede estar vacío.');
            mensaje.style.borderColor = 'red';
        } else {
            mensaje.style.borderColor = '#ddd';
        }
        
        const divErrores = document.getElementById('erroresFormulario');
        
        if (errores.length > 0) {
            divErrores.style.background = '#f8d7da';
            divErrores.style.color = '#721c24';
            divErrores.innerHTML = errores.map(e => `<p>❌ ${e}</p>`).join('');
            divErrores.style.display = 'block';
            return;
        }
        
        // Si pasa las validaciones, guardar en MongoDB
        try {
            const datosJugador = {
                nombre: nombre.value.trim(),
                correo: correo.value.trim(),
                telefono: telefono.value.trim() || 'No especificado',
                posicion: posicionSeleccionada ? posicionSeleccionada.value : 'No especificada',
                experiencia: mensaje.value.trim()
            };
            
            const res = await fetch(`${API_URL}/jugadores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosJugador)
            });
            
            const data = await res.json();
            
            if (data.success) {
                divErrores.style.background = '#d4edda';
                divErrores.style.color = '#155724';
                divErrores.innerHTML = '<p>✅ ¡Registro exitoso! Tus datos se guardaron en la base de datos.</p>';
                divErrores.style.display = 'block';
                
                formulario.reset();
                
                nombre.style.borderColor = '#ddd';
                correo.style.borderColor = '#ddd';
                mensaje.style.borderColor = '#ddd';
                
                setTimeout(() => {
                    divErrores.style.display = 'none';
                }, 5000);
                
            } else {
                divErrores.style.background = '#f8d7da';
                divErrores.style.color = '#721c24';
                divErrores.innerHTML = `<p>❌ Error: ${data.message || 'No se pudo guardar'}</p>`;
                divErrores.style.display = 'block';
            }
            
        } catch(error) {
            divErrores.style.background = '#f8d7da';
            divErrores.style.color = '#721c24';
            divErrores.innerHTML = '<p>❌ Error de conexión con el servidor. Verifica que el servidor esté corriendo.</p>';
            divErrores.style.display = 'block';
            console.error('Error:', error);
        }
    });
}

// ==================== FUNCIONES CRUD (SOLO PARA crud-completo.html) ====================
function mostrarMensajeCRUD(texto, tipo) {
    const exito = document.getElementById('mensajeExito');
    const error = document.getElementById('mensajeError');
    if (!exito || !error) return;
    exito.style.display = 'none';
    error.style.display = 'none';
    if (tipo === 'exito') {
        exito.textContent = texto;
        exito.style.display = 'block';
    } else {
        error.textContent = texto;
        error.style.display = 'block';
    }
    setTimeout(() => {
        exito.style.display = 'none';
        error.style.display = 'none';
    }, 3000);
}

function initCRUD() {
    if (!document.querySelector('.tab-btn')) return;
    
    // Pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('activo'));
            document.getElementById(`tab-${tab}`).classList.add('activo');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
            if (tab === 'productos') cargarProductos();
            if (tab === 'jugadores') cargarJugadores();
            if (tab === 'momentos') cargarMomentosCRUD();
        });
    });

    // ==================== PRODUCTOS ====================
    let prodEditando = null;

    async function cargarProductos() {
        try {
            const res = await fetch(`${API_URL}/productos`);
            const data = await res.json();
            const container = document.getElementById('productosContainer');
            if (!container) return;
            if (data.success && data.productos && data.productos.length > 0) {
                let html = '<table class="tabla-crud"><thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead><tbody>';
                data.productos.forEach(p => {
                    let badge = p.categoria === 'Indumentaria' ? 'badge-indumentaria' : (p.categoria === 'Equipamiento' ? 'badge-equipamiento' : 'badge-calzado');
                    html += `<tr>
                        <td><strong>${p.nombre}</strong></td>
                        <td><span class="badge ${badge}">${p.categoria}</span></td>
                        <td>$${p.precio}</td>
                        <td>${p.stock}</td>
                        <td>
                            <button class="btn-editar" onclick="editarProducto('${p._id}')">✏️ Editar</button>
                            <button class="btn-eliminar" onclick="eliminarProducto('${p._id}')">🗑️ Eliminar</button>
                        </td>
                    </tr>`;
                });
                html += '</tbody></table>';
                container.innerHTML = html;
            } else {
                container.innerHTML = '<div class="cargando">No hay productos. ¡Crea el primero!</div>';
            }
        } catch(e) {
            const container = document.getElementById('productosContainer');
            if (container) container.innerHTML = '<div class="cargando">Error al cargar productos. Verifica la conexión.</div>';
        }
    }

    window.crearProducto = async function() {
        const nombre = document.getElementById('prodNombre')?.value.trim();
        const categoria = document.getElementById('prodCategoria')?.value;
        const precio = document.getElementById('prodPrecio')?.value;
        const stock = document.getElementById('prodStock')?.value;
        if (!nombre || !precio) { mostrarMensajeCRUD('Nombre y precio requeridos', 'error'); return; }
        try {
            const res = await fetch(`${API_URL}/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, categoria, precio: parseFloat(precio), stock: parseInt(stock) || 0 })
            });
            const data = await res.json();
            if (data.success) {
                mostrarMensajeCRUD('Producto creado exitosamente', 'exito');
                document.getElementById('prodNombre').value = '';
                document.getElementById('prodPrecio').value = '';
                document.getElementById('prodStock').value = '';
                cargarProductos();
            } else { mostrarMensajeCRUD(data.message || 'Error al crear', 'error'); }
        } catch(e) { mostrarMensajeCRUD('Error de conexión', 'error'); }
    };

    window.editarProducto = async function(id) {
        try {
            const res = await fetch(`${API_URL}/productos/${id}`);
            const data = await res.json();
            if (data.success && data.producto) {
                prodEditando = id;
                document.getElementById('prodNombre').value = data.producto.nombre;
                document.getElementById('prodCategoria').value = data.producto.categoria;
                document.getElementById('prodPrecio').value = data.producto.precio;
                document.getElementById('prodStock').value = data.producto.stock;
                document.getElementById('prodBtnCrear').style.display = 'none';
                document.getElementById('prodBtnActualizar').style.display = 'inline-block';
                document.getElementById('prodBtnCancelar').style.display = 'inline-block';
                mostrarMensajeCRUD(`Editando: ${data.producto.nombre}`, 'exito');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else { mostrarMensajeCRUD('Producto no encontrado', 'error'); }
        } catch(e) { mostrarMensajeCRUD('Error al cargar producto', 'error'); }
    };

    window.actualizarProducto = async function() {
        if (!prodEditando) { mostrarMensajeCRUD('No hay producto seleccionado', 'error'); return; }
        const nombre = document.getElementById('prodNombre').value.trim();
        const categoria = document.getElementById('prodCategoria').value;
        const precio = document.getElementById('prodPrecio').value;
        const stock = document.getElementById('prodStock').value;
        try {
            const res = await fetch(`${API_URL}/productos/${prodEditando}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, categoria, precio: parseFloat(precio), stock: parseInt(stock) || 0 })
            });
            const data = await res.json();
            if (data.success) {
                mostrarMensajeCRUD('Producto actualizado', 'exito');
                document.getElementById('prodNombre').value = '';
                document.getElementById('prodPrecio').value = '';
                document.getElementById('prodStock').value = '';
                document.getElementById('prodBtnCrear').style.display = 'inline-block';
                document.getElementById('prodBtnActualizar').style.display = 'none';
                document.getElementById('prodBtnCancelar').style.display = 'none';
                prodEditando = null;
                cargarProductos();
            } else { mostrarMensajeCRUD(data.message || 'Error al actualizar', 'error'); }
        } catch(e) { mostrarMensajeCRUD('Error de conexión', 'error'); }
    };

    window.eliminarProducto = async function(id) {
        if (confirm('¿Eliminar este producto?')) {
            try {
                const res = await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    mostrarMensajeCRUD('Producto eliminado', 'exito');
                    cargarProductos();
                } else { mostrarMensajeCRUD(data.message || 'Error al eliminar', 'error'); }
            } catch(e) { mostrarMensajeCRUD('Error de conexión', 'error'); }
        }
    };

    window.cancelarProducto = function() {
        document.getElementById('prodNombre').value = '';
        document.getElementById('prodPrecio').value = '';
        document.getElementById('prodStock').value = '';
        document.getElementById('prodBtnCrear').style.display = 'inline-block';
        document.getElementById('prodBtnActualizar').style.display = 'none';
        document.getElementById('prodBtnCancelar').style.display = 'none';
        prodEditando = null;
    };

    // ==================== JUGADORES ====================
    let jugEditando = null;

    async function cargarJugadores() {
        try {
            const res = await fetch(`${API_URL}/jugadores`);
            const data = await res.json();
            const container = document.getElementById('jugadoresContainer');
            if (!container) return;
            if (data.success && data.jugadores && data.jugadores.length > 0) {
                let html = '<table class="tabla-crud"><thead><tr><th>Nombre</th><th>Correo</th><th>Posición</th><th>Experiencia</th><th>Acciones</th></tr></thead><tbody>';
                data.jugadores.forEach(j => {
                    html += `<tr>
                        <td><strong>${j.nombre}</strong></td>
                        <td>${j.correo}</td>
                        <td>${j.posicion || '-'}</td>
                        <td>${j.experiencia || '-'}</td>
                        <td><button class="btn-editar" onclick="editarJugador('${j._id}')">✏️ Editar</button><button class="btn-eliminar" onclick="eliminarJugador('${j._id}')">🗑️ Eliminar</button></td>
                    </tr>`;
                });
                html += '</tbody></table>';
                container.innerHTML = html;
            } else { container.innerHTML = '<div class="cargando">No hay jugadores registrados</div>'; }
        } catch(e) { 
            const container = document.getElementById('jugadoresContainer');
            if (container) container.innerHTML = '<div class="cargando">Error al cargar jugadores</div>'; 
        }
    }

    window.crearJugador = async function() {
        const nombre = document.getElementById('jugNombre')?.value.trim();
        const correo = document.getElementById('jugCorreo')?.value.trim();
        if (!nombre || !correo) { mostrarMensajeCRUD('Nombre y correo requeridos', 'error'); return; }
        try {
            const res = await fetch(`${API_URL}/jugadores`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, correo, posicion: document.getElementById('jugPosicion')?.value, experiencia: document.getElementById('jugExperiencia')?.value })
            });
            const data = await res.json();
            if (data.success) {
                mostrarMensajeCRUD('Jugador registrado', 'exito');
                document.getElementById('jugNombre').value = ''; 
                document.getElementById('jugCorreo').value = ''; 
                document.getElementById('jugPosicion').value = ''; 
                document.getElementById('jugExperiencia').value = '';
                cargarJugadores();
            } else { mostrarMensajeCRUD(data.message || 'Error', 'error'); }
        } catch(e) { mostrarMensajeCRUD('Error de conexión', 'error'); }
    };

    window.editarJugador = async function(id) {
        try {
            const res = await fetch(`${API_URL}/jugadores/${id}`);
            const data = await res.json();
            if (data.success && data.jugador) {
                jugEditando = id;
                document.getElementById('jugNombre').value = data.jugador.nombre;
                document.getElementById('jugCorreo').value = data.jugador.correo;
                document.getElementById('jugPosicion').value = data.jugador.posicion || '';
                document.getElementById('jugExperiencia').value = data.jugador.experiencia || '';
                document.getElementById('jugBtnCrear').style.display = 'none';
                document.getElementById('jugBtnActualizar').style.display = 'inline-block';
                document.getElementById('jugBtnCancelar').style.display = 'inline-block';
                mostrarMensajeCRUD(`Editando: ${data.jugador.nombre}`, 'exito');
            }
        } catch(e) { mostrarMensajeCRUD('Error al cargar', 'error'); }
    };

    window.actualizarJugador = async function() {
        if (!jugEditando) return;
        try {
            const res = await fetch(`${API_URL}/jugadores/${jugEditando}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nombre: document.getElementById('jugNombre').value, 
                    correo: document.getElementById('jugCorreo').value, 
                    posicion: document.getElementById('jugPosicion').value, 
                    experiencia: document.getElementById('jugExperiencia').value 
                })
            });
            const data = await res.json();
            if (data.success) {
                mostrarMensajeCRUD('Jugador actualizado', 'exito');
                document.getElementById('jugNombre').value = ''; 
                document.getElementById('jugCorreo').value = ''; 
                document.getElementById('jugPosicion').value = ''; 
                document.getElementById('jugExperiencia').value = '';
                document.getElementById('jugBtnCrear').style.display = 'inline-block';
                document.getElementById('jugBtnActualizar').style.display = 'none';
                document.getElementById('jugBtnCancelar').style.display = 'none';
                jugEditando = null;
                cargarJugadores();
            } else { mostrarMensajeCRUD(data.message || 'Error', 'error'); }
        } catch(e) { mostrarMensajeCRUD('Error de conexión', 'error'); }
    };

    window.eliminarJugador = async function(id) {
        if (confirm('¿Eliminar este jugador?')) {
            try {
                const res = await fetch(`${API_URL}/jugadores/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) { mostrarMensajeCRUD('Jugador eliminado', 'exito'); cargarJugadores(); }
                else { mostrarMensajeCRUD(data.message || 'Error', 'error'); }
            } catch(e) { mostrarMensajeCRUD('Error de conexión', 'error'); }
        }
    };

    window.cancelarJugador = function() {
        document.getElementById('jugNombre').value = ''; 
        document.getElementById('jugCorreo').value = ''; 
        document.getElementById('jugPosicion').value = ''; 
        document.getElementById('jugExperiencia').value = '';
        document.getElementById('jugBtnCrear').style.display = 'inline-block';
        document.getElementById('jugBtnActualizar').style.display = 'none';
        document.getElementById('jugBtnCancelar').style.display = 'none';
        jugEditando = null;
    };

    // ==================== MOMENTOS CRUD ====================
    let momEditando = null;

    async function cargarMomentosCRUD() {
        try {
            const res = await fetch(`${API_URL}/momentos`);
            const data = await res.json();
            const container = document.getElementById('momentosContainer');
            if (!container) return;
            if (data.success && data.momentos && data.momentos.length > 0) {
                let html = '<table class="tabla-crud"><thead><tr><th>Descripción</th><th>Acciones</th></tr></thead><tbody>';
                data.momentos.forEach(m => {
                    html += `<tr><td>${m.descripcion}</td><td><button class="btn-editar" onclick="editarMomento('${m._id}')">✏️ Editar</button><button class="btn-eliminar" onclick="eliminarMomento('${m._id}')">🗑️ Eliminar</button></td></tr>`;
                });
                html += '</tbody></table>';
                container.innerHTML = html;
            } else { container.innerHTML = '<div class="cargando">No hay momentos guardados</div>'; }
        } catch(e) { 
            const container = document.getElementById('momentosContainer');
            if (container) container.innerHTML = '<div class="cargando">Error al cargar momentos</div>'; 
        }
    }

    window.crearMomento = async function() {
        const descripcion = document.getElementById('momDescripcion')?.value.trim();
        if (!descripcion) { mostrarMensajeCRUD('Descripción requerida', 'error'); return; }
        try {
            const res = await fetch(`${API_URL}/momentos`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descripcion })
            });
            const data = await res.json();
            if (data.success) {
                mostrarMensajeCRUD('Momento agregado', 'exito');
                document.getElementById('momDescripcion').value = '';
                cargarMomentosCRUD();
            } else { mostrarMensajeCRUD(data.message || 'Error', 'error'); }
        } catch(e) { mostrarMensajeCRUD('Error de conexión', 'error'); }
    };

    window.editarMomento = async function(id) {
        try {
            const res = await fetch(`${API_URL}/momentos/${id}`);
            const data = await res.json();
            if (data.success && data.momento) {
                momEditando = id;
                document.getElementById('momDescripcion').value = data.momento.descripcion;
                document.getElementById('momBtnCrear').style.display = 'none';
                document.getElementById('momBtnActualizar').style.display = 'inline-block';
                document.getElementById('momBtnCancelar').style.display = 'inline-block';
                mostrarMensajeCRUD('Editando momento', 'exito');
            }
        } catch(e) { mostrarMensajeCRUD('Error al cargar', 'error'); }
    };

    window.actualizarMomento = async function() {
        if (!momEditando) return;
        const descripcion = document.getElementById('momDescripcion').value.trim();
        try {
            const res = await fetch(`${API_URL}/momentos/${momEditando}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descripcion })
            });
            const data = await res.json();
            if (data.success) {
                mostrarMensajeCRUD('Momento actualizado', 'exito');
                document.getElementById('momDescripcion').value = '';
                document.getElementById('momBtnCrear').style.display = 'inline-block';
                document.getElementById('momBtnActualizar').style.display = 'none';
                document.getElementById('momBtnCancelar').style.display = 'none';
                momEditando = null;
                cargarMomentosCRUD();
            } else { mostrarMensajeCRUD(data.message || 'Error', 'error'); }
        } catch(e) { mostrarMensajeCRUD('Error de conexión', 'error'); }
    };

    window.eliminarMomento = async function(id) {
        if (confirm('¿Eliminar este momento?')) {
            try {
                const res = await fetch(`${API_URL}/momentos/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) { mostrarMensajeCRUD('Momento eliminado', 'exito'); cargarMomentosCRUD(); }
                else { mostrarMensajeCRUD(data.message || 'Error', 'error'); }
            } catch(e) { mostrarMensajeCRUD('Error de conexión', 'error'); }
        }
    };

    window.cancelarMomento = function() {
        document.getElementById('momDescripcion').value = '';
        document.getElementById('momBtnCrear').style.display = 'inline-block';
        document.getElementById('momBtnActualizar').style.display = 'none';
        document.getElementById('momBtnCancelar').style.display = 'none';
        momEditando = null;
    };

    // Event listeners
    document.getElementById('prodBtnCrear')?.addEventListener('click', window.crearProducto);
    document.getElementById('prodBtnActualizar')?.addEventListener('click', window.actualizarProducto);
    document.getElementById('prodBtnCancelar')?.addEventListener('click', window.cancelarProducto);
    document.getElementById('prodBtnRefrescar')?.addEventListener('click', cargarProductos);
    
    document.getElementById('jugBtnCrear')?.addEventListener('click', window.crearJugador);
    document.getElementById('jugBtnActualizar')?.addEventListener('click', window.actualizarJugador);
    document.getElementById('jugBtnCancelar')?.addEventListener('click', window.cancelarJugador);
    document.getElementById('jugBtnRefrescar')?.addEventListener('click', cargarJugadores);
    
    document.getElementById('momBtnCrear')?.addEventListener('click', window.crearMomento);
    document.getElementById('momBtnActualizar')?.addEventListener('click', window.actualizarMomento);
    document.getElementById('momBtnCancelar')?.addEventListener('click', window.cancelarMomento);
    document.getElementById('momBtnRefrescar')?.addEventListener('click', cargarMomentosCRUD);

    // Cargar datos iniciales
    cargarProductos();
    cargarJugadores();
    cargarMomentosCRUD();
}

// ==================== INICIALIZAR TODO ====================
document.addEventListener('DOMContentLoaded', () => {
    initModoOscuro();
    initVolverArriba();
    initConfirmarEnlacesExternos();
    initListaDinamica();
    initGaleriaInteractiva();
    initContadorQuiz();
    initCarrusel();
    initMeGusta();
    initValidacionFormulario();
    initCRUD();
});