create database pepeCostilla_operativo;
use pepeCostilla_operativo; 

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    celular VARCHAR(20) NULL,
    fecha_nacimiento DATE NULL,
    direccion VARCHAR(250) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    canton VARCHAR(100) NOT null,
    fecha_emision DATE NOT NULL,
    status ENUM('A','I','E') not null,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE insumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tipo ENUM('CON','VEG','BAS','ALQ','NPR','PER') NOT NULL,
    costo DECIMAL(10,2) NOT NULL,
    unidad ENUM('LIT','UNI','LIB','ONZ','MIL','GRA') NOT null,
    fecha_emision DATE NOT NULL,
    status ENUM('A','I','E') not null,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(150) NULL,
    status ENUM('A','I','E') NOT NULL DEFAULT 'A',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT not null,
    nombre VARCHAR(150) NOT NULL,
    tipo ENUM('MOR','MRZ','ALM','GAS','NAT','LIC','DOM','ADI') NOT NULL,
    precio DECIMAL(10,2) NULL,
    costo DECIMAL(10,2) NOT NULL,
    porcentaje_ganancia DECIMAL(5,2) NOT null,
    imagen VARCHAR(250) null,
    fecha_emision DATE NOT NULL,
    status ENUM('A','I','E') not null,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE definicion_costo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL,
    fecha_vigencia_desde DATE NULL,
    fecha_vigencia_hasta DATE NULL,
    fecha_emision DATE NOT NULL,
    status ENUM('A','I','E') not null,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (producto_id) REFERENCES productos(id)

);

CREATE TABLE definicion_costo_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    definicion_costo_id INT NOT NULL,
    insumo_id INT NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    unidad ENUM('LIT','UNI','LIB','ONZ','MIL','GRA') NOT null,
    costo_unitario DECIMAL(10,2) NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL,
    status ENUM('A','I','E') not null,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (definicion_costo_id) REFERENCES definicion_costo(id),
    FOREIGN KEY (insumo_id) REFERENCES insumos(id)
);

CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    fecha_emision DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento_porcentaje INT not NULL default 0,
    descuento_valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    iva DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    observacion VARCHAR(250) null,
    status ENUM('A','I','E') not null,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE venta_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    iva DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL,
    status ENUM('A','I','E') not null,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(150),
    celular VARCHAR(20),
    direccion VARCHAR(250) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    canton VARCHAR(100) NOT null,
    fecha_emision DATE NOT NULL,
    status ENUM('A','I','E') not null,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    fecha_emision DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    descuento_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    descuento_valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    iva DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    observacion VARCHAR(250) NULL,
    status ENUM('A','I','E') NOT NULL DEFAULT 'A',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);

CREATE TABLE compra_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    insumo_id INT NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    unidad ENUM('LIT','UNI','LIB','ONZ','MIL','GRA') NOT NULL,
    costo_unitario DECIMAL(10,4) NOT NULL,
    descuento_valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    iva DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL,
    status ENUM('A','I','E') NOT NULL DEFAULT 'A',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (compra_id) REFERENCES compras(id),
    FOREIGN KEY (insumo_id) REFERENCES insumos(id)
);

