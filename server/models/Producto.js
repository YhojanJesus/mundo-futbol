const { ObjectId } = require('mongodb');

class Producto {
    constructor(nombre, categoria, precio, stock) {
        this.nombre = nombre;
        this.categoria = categoria;
        this.precio = parseFloat(precio);
        this.stock = parseInt(stock) || 0;
        this.fechaCreacion = new Date();
    }

    static validar(datos) {
        const errores = [];
        if (!datos.nombre || datos.nombre.trim() === '') {
            errores.push('El nombre es obligatorio');
        }
        if (!datos.categoria) {
            errores.push('La categoría es obligatoria');
        }
        if (!datos.precio || isNaN(datos.precio) || parseFloat(datos.precio) <= 0) {
            errores.push('El precio debe ser un número positivo');
        }
        return errores;
    }

    static formatearParaRespuesta(producto) {
        if (!producto) return null;
        return {
            _id: producto._id,
            nombre: producto.nombre,
            categoria: producto.categoria,
            precio: producto.precio,
            stock: producto.stock,
            fechaCreacion: producto.fechaCreacion
        };
    }
}

module.exports = Producto;