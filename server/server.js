require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// Conexión a MongoDB
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db;

async function conectarDB() {
    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB Atlas');
        db = client.db('futbol_crud');
        
        // Crear colecciones si no existen
        const colecciones = await db.listCollections().toArray();
        const nombresColecciones = colecciones.map(c => c.name);
        
        if (!nombresColecciones.includes('productos')) {
            await db.createCollection('productos');
            const productosIniciales = [
                { nombre: "Camiseta Argentina 2022", categoria: "Indumentaria", precio: 89.99, stock: 50, fechaCreacion: new Date() },
                { nombre: "Balón Champions League", categoria: "Equipamiento", precio: 129.99, stock: 30, fechaCreacion: new Date() },
                { nombre: "Botines Mercurial", categoria: "Calzado", precio: 249.99, stock: 20, fechaCreacion: new Date() },
                { nombre: "Guantes de Portero", categoria: "Equipamiento", precio: 79.99, stock: 15, fechaCreacion: new Date() }
            ];
            await db.collection('productos').insertMany(productosIniciales);
            console.log('📦 Colección productos creada con datos iniciales');
        }
        
        if (!nombresColecciones.includes('jugadores')) {
            await db.createCollection('jugadores');
            const jugadoresIniciales = [
                { nombre: "Lionel Messi", correo: "messi@psg.com", posicion: "Delantero", experiencia: "20 años", fechaCreacion: new Date() },
                { nombre: "Cristiano Ronaldo", correo: "cristiano@alnassr.com", posicion: "Delantero", experiencia: "20 años", fechaCreacion: new Date() }
            ];
            await db.collection('jugadores').insertMany(jugadoresIniciales);
            console.log('👤 Colección jugadores creada con datos iniciales');
        }
        
        if (!nombresColecciones.includes('momentos')) {
            await db.createCollection('momentos');
            const momentosIniciales = [
                { descripcion: "Gol de Maradona a Inglaterra (1986)", fechaCreacion: new Date() },
                { descripcion: "Argentina campeón del mundo 2022", fechaCreacion: new Date() },
                { descripcion: "Messi gana su 8vo Balón de Oro", fechaCreacion: new Date() }
            ];
            await db.collection('momentos').insertMany(momentosIniciales);
            console.log('📝 Colección momentos creada con datos iniciales');
        }
        
        return db;
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error.message);
        process.exit(1);
    }
}

// ==================== RUTAS API ====================

// Middleware para verificar conexión a DB
app.use('/api', (req, res, next) => {
    if (!db) {
        return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }
    next();
});

// ==================== PRODUCTOS ====================

// GET - Obtener todos los productos
app.get('/api/productos', async (req, res) => {
    try {
        const productos = await db.collection('productos').find({}).sort({ fechaCreacion: -1 }).toArray();
        res.json({ success: true, count: productos.length, productos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener productos: ' + error.message });
    }
});

// GET - Obtener un producto por ID
app.get('/api/productos/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID no válido' });
        }
        const producto = await db.collection('productos').findOne({ _id: new ObjectId(req.params.id) });
        if (!producto) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        res.json({ success: true, producto });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener producto: ' + error.message });
    }
});

// POST - Crear producto
app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, categoria, precio, stock } = req.body;
        if (!nombre || !categoria || !precio) {
            return res.status(400).json({ success: false, message: 'Nombre, categoría y precio son obligatorios' });
        }
        const nuevoProducto = {
            nombre: nombre.trim(),
            categoria,
            precio: parseFloat(precio),
            stock: parseInt(stock) || 0,
            fechaCreacion: new Date()
        };
        const resultado = await db.collection('productos').insertOne(nuevoProducto);
        res.status(201).json({ 
            success: true, 
            message: 'Producto creado exitosamente', 
            producto: { _id: resultado.insertedId, ...nuevoProducto }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear producto: ' + error.message });
    }
});

// PUT - Actualizar producto
app.put('/api/productos/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID no válido' });
        }
        const { nombre, categoria, precio, stock } = req.body;
        const updateData = {};
        if (nombre) updateData.nombre = nombre.trim();
        if (categoria) updateData.categoria = categoria;
        if (precio !== undefined && precio !== '') updateData.precio = parseFloat(precio);
        if (stock !== undefined && stock !== '') updateData.stock = parseInt(stock);
        
        const resultado = await db.collection('productos').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );
        
        if (resultado.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        const productoActualizado = await db.collection('productos').findOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true, message: 'Producto actualizado exitosamente', producto: productoActualizado });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar producto: ' + error.message });
    }
});

// DELETE - Eliminar producto
app.delete('/api/productos/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID no válido' });
        }
        const resultado = await db.collection('productos').deleteOne({ _id: new ObjectId(req.params.id) });
        if (resultado.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        res.json({ success: true, message: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar producto: ' + error.message });
    }
});

// ==================== JUGADORES ====================

app.get('/api/jugadores', async (req, res) => {
    try {
        const jugadores = await db.collection('jugadores').find({}).sort({ fechaCreacion: -1 }).toArray();
        res.json({ success: true, count: jugadores.length, jugadores });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener jugadores: ' + error.message });
    }
});

app.get('/api/jugadores/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID no válido' });
        }
        const jugador = await db.collection('jugadores').findOne({ _id: new ObjectId(req.params.id) });
        if (!jugador) {
            return res.status(404).json({ success: false, message: 'Jugador no encontrado' });
        }
        res.json({ success: true, jugador });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener jugador: ' + error.message });
    }
});

app.post('/api/jugadores', async (req, res) => {
    try {
        const { nombre, correo, posicion, experiencia } = req.body;
        if (!nombre || !correo) {
            return res.status(400).json({ success: false, message: 'Nombre y correo son obligatorios' });
        }
        const nuevoJugador = {
            nombre: nombre.trim(),
            correo: correo.trim(),
            posicion: posicion || 'No especificada',
            experiencia: experiencia || 'Sin experiencia',
            fechaCreacion: new Date()
        };
        const resultado = await db.collection('jugadores').insertOne(nuevoJugador);
        res.status(201).json({ 
            success: true, 
            message: 'Jugador registrado exitosamente', 
            jugador: { _id: resultado.insertedId, ...nuevoJugador }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al registrar jugador: ' + error.message });
    }
});

app.put('/api/jugadores/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID no válido' });
        }
        const { nombre, correo, posicion, experiencia } = req.body;
        const updateData = {};
        if (nombre) updateData.nombre = nombre.trim();
        if (correo) updateData.correo = correo.trim();
        if (posicion) updateData.posicion = posicion;
        if (experiencia) updateData.experiencia = experiencia;
        
        const resultado = await db.collection('jugadores').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );
        
        if (resultado.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Jugador no encontrado' });
        }
        
        const jugadorActualizado = await db.collection('jugadores').findOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true, message: 'Jugador actualizado exitosamente', jugador: jugadorActualizado });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar jugador: ' + error.message });
    }
});

app.delete('/api/jugadores/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID no válido' });
        }
        const resultado = await db.collection('jugadores').deleteOne({ _id: new ObjectId(req.params.id) });
        if (resultado.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Jugador no encontrado' });
        }
        res.json({ success: true, message: 'Jugador eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar jugador: ' + error.message });
    }
});

// ==================== MOMENTOS (Lista de momentos favoritos del fútbol) ====================

app.get('/api/momentos', async (req, res) => {
    try {
        const momentos = await db.collection('momentos').find({}).sort({ fechaCreacion: -1 }).toArray();
        res.json({ success: true, count: momentos.length, momentos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener momentos: ' + error.message });
    }
});

app.get('/api/momentos/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID no válido' });
        }
        const momento = await db.collection('momentos').findOne({ _id: new ObjectId(req.params.id) });
        if (!momento) {
            return res.status(404).json({ success: false, message: 'Momento no encontrado' });
        }
        res.json({ success: true, momento });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener momento: ' + error.message });
    }
});

app.post('/api/momentos', async (req, res) => {
    try {
        const { descripcion } = req.body;
        if (!descripcion || descripcion.trim() === '') {
            return res.status(400).json({ success: false, message: 'La descripción es obligatoria' });
        }
        const nuevoMomento = {
            descripcion: descripcion.trim(),
            fechaCreacion: new Date()
        };
        const resultado = await db.collection('momentos').insertOne(nuevoMomento);
        res.status(201).json({ 
            success: true, 
            message: 'Momento agregado exitosamente', 
            momento: { _id: resultado.insertedId, ...nuevoMomento }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al agregar momento: ' + error.message });
    }
});

app.put('/api/momentos/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID no válido' });
        }
        const { descripcion } = req.body;
        if (!descripcion || descripcion.trim() === '') {
            return res.status(400).json({ success: false, message: 'La descripción es obligatoria' });
        }
        
        const resultado = await db.collection('momentos').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { descripcion: descripcion.trim() } }
        );
        
        if (resultado.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Momento no encontrado' });
        }
        
        const momentoActualizado = await db.collection('momentos').findOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true, message: 'Momento actualizado exitosamente', momento: momentoActualizado });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar momento: ' + error.message });
    }
});

app.delete('/api/momentos/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID no válido' });
        }
        const resultado = await db.collection('momentos').deleteOne({ _id: new ObjectId(req.params.id) });
        if (resultado.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Momento no encontrado' });
        }
        res.json({ success: true, message: 'Momento eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar momento: ' + error.message });
    }
});

// Ruta para servir el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Iniciar servidor
async function iniciarServidor() {
    await conectarDB();
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📋 API REST disponible en http://localhost:${PORT}/api`);
        console.log(`🗄️ Conectado a MongoDB Atlas - Base de datos: futbol_crud`);
    });
}

iniciarServidor();