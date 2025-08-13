-- Tablas mejoradas
ALTER TABLE Usuarios ADD COLUMN (
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    rol ENUM('admin', 'proveedor', 'cliente') DEFAULT 'cliente'
);

-- Hashear contraseñas existentes
UPDATE Usuarios SET contrasenha = '$2y$10$usesomesillystringforsalt$' 
WHERE contrasenha NOT LIKE '$2y$%';

-- Índices para mejorar performance
CREATE INDEX idx_productos_proveedor ON Productos(id_proveedor);
CREATE INDEX idx_carrito_usuario ON Carrito(id_usuario);
CREATE INDEX idx_carrito_detalle ON Carrito_detalle(id_carrito, id_producto);

-- Tabla de categorías
CREATE TABLE Categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

-- Relación muchos a muchos entre productos y categorías
CREATE TABLE Producto_Categorias (
    id_producto INT,
    id_categoria INT,
    PRIMARY KEY (id_producto, id_categoria),
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto),
    FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria)
);