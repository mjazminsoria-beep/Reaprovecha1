-- ============================================================================
-- PROYECTO: ReAprovecha (Tandil, Buenos Aires, Argentina)
-- DESCRIPCIÓN: Plataforma de rescate de excedentes y alimentos próximos a vencer.
-- MOTOR RECOMENDADO: PostgreSQL 14+ / Supabase / Neon / Cloud SQL
-- ARCHIVO: database/schema.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREACIÓN DE LA BASE DE DATOS
-- ----------------------------------------------------------------------------
-- NOTA: Si ejecutas este script en un entorno administrado (como Supabase o RDS),
-- omite el comando CREATE DATABASE ya que la base de datos se crea por consola.

CREATE DATABASE reaprovecha_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'es_AR.UTF-8'
    LC_CTYPE = 'es_AR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

\c reaprovecha_db;

-- Habilitar extensiones recomendadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Búsquedas por similitud de texto

-- ----------------------------------------------------------------------------
-- 2. TIPOS ENUMERADOS (ENUMs) Y DOMINIOS
-- ----------------------------------------------------------------------------

CREATE TYPE tipo_usuario_enum AS ENUM (
    'consumidor',
    'comercio',
    'administrador'
);

CREATE TYPE categoria_comercio_enum AS ENUM (
    'Supermercado y Almacén',
    'Panadería y Pastelería',
    'Lácteos y Quesería',
    'Verdulería y Frutería',
    'Carnicería y Granja',
    'Restaurante y Café',
    'Fábrica de Pastas',
    'Otro'
);

CREATE TYPE categoria_producto_enum AS ENUM (
    'Lácteos',
    'Panadería y Repostería',
    'Carnes y Embutidos',
    'Frutas y Verduras',
    'Almacén y Pastas',
    'Bebidas y Jugos',
    'Comidas Preparadas',
    'Otro'
);

CREATE TYPE estado_producto_enum AS ENUM (
    'activo',
    'pausado',
    'agotado',
    'eliminado'
);

CREATE TYPE prioridad_ia_enum AS ENUM (
    'alta',
    'media',
    'baja'
);

CREATE TYPE estado_reserva_enum AS ENUM (
    'pendiente',
    'confirmada',
    'lista_para_retirar',
    'retirada',
    'cancelada'
);

CREATE TYPE tipo_movimiento_stock_enum AS ENUM (
    'publicacion_inicial',
    'reserva_creada',
    'reserva_cancelada_devolucion',
    'ajuste_manual_comercio',
    'retiro_concretado',
    'vencido_descartado'
);

CREATE TYPE tipo_notificacion_enum AS ENUM (
    'reserva_nueva',
    'reserva_confirmada',
    'lista_para_retirar',
    'reserva_cancelada',
    'alerta_vencimiento',
    'oferta_cercana'
);

-- ----------------------------------------------------------------------------
-- 3. CREACIÓN DE TABLAS
-- ----------------------------------------------------------------------------

-- TABLA: usuarios
-- Representa a las personas registradas (consumidores, comercios y administradores).
CREATE TABLE usuarios (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(30),
    tipo_usuario tipo_usuario_enum NOT NULL DEFAULT 'consumidor',
    ciudad VARCHAR(100) NOT NULL DEFAULT 'Tandil, Buenos Aires',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE usuarios IS 'Cuentas de usuario de la plataforma (consumidores finales, dueños de comercio y admins).';
COMMENT ON COLUMN usuarios.password_hash IS 'Hash criptográfico (ej. Argon2id, PBKDF2 o bcrypt) de la clave de acceso.';

-- TABLA: comercios
-- Perfil comercial y geográfico de los locales adheridos en Tandil.
-- Relación 1:1 con la tabla usuarios (donde tipo_usuario = comercio).
CREATE TABLE comercios (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    usuario_id VARCHAR(36) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    direccion VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL DEFAULT 'Tandil, Buenos Aires',
    latitud NUMERIC(10, 7) NOT NULL,
    longitud NUMERIC(10, 7) NOT NULL,
    categoria categoria_comercio_enum NOT NULL DEFAULT 'Supermercado y Almacén',
    horario_apertura TIME NOT NULL DEFAULT '08:30:00',
    horario_cierre TIME NOT NULL DEFAULT '20:30:00',
    telefono VARCHAR(30) NOT NULL,
    logo_url TEXT,
    verificado BOOLEAN NOT NULL DEFAULT TRUE,
    calificacion_promedio NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (calificacion_promedio BETWEEN 1.00 AND 5.00),
    total_resenas INT NOT NULL DEFAULT 0 CHECK (total_resenas >= 0),
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comercios_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_latitud_valida CHECK (latitud BETWEEN -90.0 AND 90.0),
    CONSTRAINT chk_longitud_valida CHECK (longitud BETWEEN -180.0 AND 180.0),
    CONSTRAINT chk_horario_coherente CHECK (horario_cierre > horario_apertura)
);

COMMENT ON TABLE comercios IS 'Comercios de Tandil que publican sus excedentes para evitar desperdicio.';
COMMENT ON COLUMN comercios.latitud IS 'Coordenada de latitud GPS del local para cálculo de distancia Haversine.';
COMMENT ON COLUMN comercios.longitud IS 'Coordenada de longitud GPS del local.';

-- TABLA: categorias_producto
-- Taxonomía organizada de categorías de alimentos con metadatos.
CREATE TABLE categorias_producto (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(50) DEFAULT 'package',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE categorias_producto IS 'Categorías de productos disponibles en el catálogo.';

-- TABLA: productos
-- Excedentes y alimentos en oferta publicados por los comercios.
CREATE TABLE productos (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    comercio_id VARCHAR(36) NOT NULL,
    categoria_id VARCHAR(36) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    imagen_url TEXT NOT NULL,
    precio_original NUMERIC(12, 2) NOT NULL,
    precio_reaprovecha NUMERIC(12, 2) NOT NULL,
    porcentaje_descuento INT NOT NULL,
    cantidad_inicial INT NOT NULL,
    cantidad_disponible INT NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    hora_limite_retiro VARCHAR(80) NOT NULL DEFAULT 'Hoy hasta las 20:00 hs',
    peso_estimado_kg NUMERIC(6, 3) NOT NULL DEFAULT 0.500,
    motivo_oferta VARCHAR(100) NOT NULL DEFAULT 'Próximo a vencer',
    motivo_detalle TEXT,
    estado estado_producto_enum NOT NULL DEFAULT 'activo',
    ai_priority prioridad_ia_enum DEFAULT 'media',
    ai_priority_label VARCHAR(60),
    ai_explanation TEXT,
    ai_suggested_price NUMERIC(12, 2),
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_productos_comercio FOREIGN KEY (comercio_id) 
        REFERENCES comercios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) 
        REFERENCES categorias_producto(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_precios_positivos CHECK (precio_original > 0 AND precio_reaprovecha > 0),
    CONSTRAINT chk_precio_con_descuento CHECK (precio_reaprovecha < precio_original),
    CONSTRAINT chk_descuento_porcentaje CHECK (porcentaje_descuento BETWEEN 1 AND 99),
    CONSTRAINT chk_stock_valido CHECK (cantidad_disponible >= 0 AND cantidad_disponible <= cantidad_inicial),
    CONSTRAINT chk_peso_positivo CHECK (peso_estimado_kg > 0)
);

COMMENT ON TABLE productos IS 'Catálogo de alimentos y excedentes en venta con descuentos de rescate.';
COMMENT ON COLUMN productos.precio_reaprovecha IS 'Precio de liquidación con descuento para el consumidor.';
COMMENT ON COLUMN productos.motivo_oferta IS 'Motivo de la rebaja: Vencimiento próximo, baja rotación, excedente, o envase secundario dañado.';
COMMENT ON COLUMN productos.ai_priority IS 'Clasificación automática de urgencia generada por el motor de IA.';

-- TABLA: reservas
-- Pedidos de reserva creados por consumidores para retirar en el local.
CREATE TABLE reservas (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    codigo_retiro VARCHAR(20) NOT NULL UNIQUE,
    usuario_id VARCHAR(36) NOT NULL,
    comercio_id VARCHAR(36) NOT NULL,
    estado estado_reserva_enum NOT NULL DEFAULT 'pendiente',
    total NUMERIC(12, 2) NOT NULL,
    ahorro_total NUMERIC(12, 2) NOT NULL,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(30) NOT NULL,
    cliente_email VARCHAR(150) NOT NULL,
    hora_limite_retiro VARCHAR(80),
    notas_cliente TEXT,
    fecha_reserva TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion TIMESTAMP WITH TIME ZONE,
    fecha_retiro TIMESTAMP WITH TIME ZONE,
    fecha_cancelacion TIMESTAMP WITH TIME ZONE,
    motivo_cancelacion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservas_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_reservas_comercio FOREIGN KEY (comercio_id) 
        REFERENCES comercios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_reserva_totales_positivos CHECK (total >= 0 AND ahorro_total >= 0)
);

COMMENT ON TABLE reservas IS 'Reservas formalizadas por consumidores para retiro presencial en Tandil.';
COMMENT ON COLUMN reservas.codigo_retiro IS 'Código alfanumérico amigable de retiro mostrado en el local (ej. REP-5921).';

-- TABLA: detalle_reserva
-- Ítems individuales dentro de cada reserva (Líneas de detalle).
CREATE TABLE detalle_reserva (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    reserva_id VARCHAR(36) NOT NULL,
    producto_id VARCHAR(36) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    precio_original_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    peso_unitario_kg NUMERIC(6, 3) NOT NULL DEFAULT 0.500,
    nombre_snapshot VARCHAR(150) NOT NULL,
    imagen_snapshot TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_detalle_reserva FOREIGN KEY (reserva_id) 
        REFERENCES reservas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) 
        REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_precios CHECK (precio_unitario > 0 AND subtotal >= 0)
);

COMMENT ON TABLE detalle_reserva IS 'Líneas de productos reservados con snapshot de precios y peso.';

-- TABLA: impacto_ambiental
-- Métricas de sustentabilidad: CO2 evitado, kilogramos rescatados y dinero ahorrado.
CREATE TABLE impacto_ambiental (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    reserva_id VARCHAR(36) NOT NULL UNIQUE,
    usuario_id VARCHAR(36) NOT NULL,
    comercio_id VARCHAR(36) NOT NULL,
    cantidad_alimentos INT NOT NULL,
    peso_kg NUMERIC(8, 3) NOT NULL,
    ahorro_usuario NUMERIC(12, 2) NOT NULL,
    co2_evitado_kg NUMERIC(8, 3) NOT NULL,
    agua_ahorrada_litros NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_impacto_reserva FOREIGN KEY (reserva_id) 
        REFERENCES reservas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_impacto_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_impacto_comercio FOREIGN KEY (comercio_id) 
        REFERENCES comercios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_impacto_positivo CHECK (cantidad_alimentos > 0 AND peso_kg > 0 AND ahorro_usuario >= 0 AND co2_evitado_kg >= 0)
);

COMMENT ON TABLE impacto_ambiental IS 'Registro auditable del impacto ecológico y social de cada rescate de comida.';
COMMENT ON COLUMN impacto_ambiental.co2_evitado_kg IS 'Equivalencia de CO2 no emitido a la atmósfera (Factor FAO estándar: ~2.5 kg CO2e / kg alimento).';

-- TABLA: valoraciones_resenas
-- Opiniones y calificaciones que los consumidores dejan a los comercios tras retirar.
CREATE TABLE valoraciones_resenas (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    reserva_id VARCHAR(36) NOT NULL UNIQUE,
    usuario_id VARCHAR(36) NOT NULL,
    comercio_id VARCHAR(36) NOT NULL,
    puntuacion INT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
    comentario TEXT,
    estado_alimento VARCHAR(30) CHECK (estado_alimento IN ('excelente', 'muy_bueno', 'bueno', 'regular')),
    puntualidad_entrega BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resenas_reserva FOREIGN KEY (reserva_id) 
        REFERENCES reservas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_resenas_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_resenas_comercio FOREIGN KEY (comercio_id) 
        REFERENCES comercios(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

COMMENT ON TABLE valoraciones_resenas IS 'Sistema de reputación de comercios basado en calidad y puntualidad.';

-- TABLA: historial_stock
-- Trazabilidad y auditoría de cada modificación del inventario físico.
CREATE TABLE historial_stock (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    producto_id VARCHAR(36) NOT NULL,
    tipo_movimiento tipo_movimiento_stock_enum NOT NULL,
    cantidad_anterior INT NOT NULL,
    cantidad_cambio INT NOT NULL,
    cantidad_resultante INT NOT NULL,
    reserva_id VARCHAR(36),
    motivo VARCHAR(255),
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_producto FOREIGN KEY (producto_id) 
        REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_historial_reserva FOREIGN KEY (reserva_id) 
        REFERENCES reservas(id) ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE historial_stock IS 'Auditoría cronológica de aumentos y descuentos en el stock de productos.';

-- TABLA: notificaciones
-- Avisos en tiempo real para consumidores y comercios.
CREATE TABLE notificaciones (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    usuario_id VARCHAR(36) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo tipo_notificacion_enum NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    referencia_tipo VARCHAR(50),
    referencia_id VARCHAR(36),
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE notificaciones IS 'Notificaciones transaccionales y de vencimiento para los usuarios.';

-- ----------------------------------------------------------------------------
-- 4. ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN
-- ----------------------------------------------------------------------------

-- Índices en claves foráneas y búsquedas frecuentes
CREATE INDEX idx_comercios_usuario ON comercios(usuario_id);
CREATE INDEX idx_comercios_categoria ON comercios(categoria);
CREATE INDEX idx_comercios_coordenadas ON comercios(latitud, longitud);

CREATE INDEX idx_productos_comercio ON productos(comercio_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_estado ON productos(estado);
CREATE INDEX idx_productos_fecha_vencimiento ON productos(fecha_vencimiento);
CREATE INDEX idx_productos_descuento ON productos(porcentaje_descuento DESC);
CREATE INDEX idx_productos_busqueda_trgm ON productos USING gin (nombre gin_trgm_ops);

CREATE INDEX idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX idx_reservas_comercio ON reservas(comercio_id);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_reservas_codigo ON reservas(codigo_retiro);
CREATE INDEX idx_reservas_fecha ON reservas(fecha_reserva DESC);

CREATE INDEX idx_detalle_reserva_reserva ON detalle_reserva(reserva_id);
CREATE INDEX idx_detalle_reserva_producto ON detalle_reserva(producto_id);

CREATE INDEX idx_impacto_usuario ON impacto_ambiental(usuario_id);
CREATE INDEX idx_impacto_comercio ON impacto_ambiental(comercio_id);
CREATE INDEX idx_impacto_fecha ON impacto_ambiental(fecha DESC);

CREATE INDEX idx_notificaciones_usuario_no_leidas ON notificaciones(usuario_id, leida) WHERE leida = FALSE;

-- ----------------------------------------------------------------------------
-- 5. FUNCIONES Y DISPARADORES (TRIGGERS)
-- ----------------------------------------------------------------------------

-- Trigger 1: Actualización automática de timestamp 'fecha_actualizacion'
CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_actualizacion
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE TRIGGER trg_comercios_actualizacion
BEFORE UPDATE ON comercios
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE TRIGGER trg_productos_actualizacion
BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE TRIGGER trg_reservas_actualizacion
BEFORE UPDATE ON reservas
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

-- Trigger 2: Descuento automático de stock al confirmar reserva y control de agotado
CREATE OR REPLACE FUNCTION fn_descontar_stock_al_reservar()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_stock_actual INT;
BEGIN
    -- Recorrer los items del detalle de la reserva
    FOR item IN SELECT producto_id, cantidad FROM detalle_reserva WHERE reserva_id = NEW.id LOOP
        SELECT cantidad_disponible INTO v_stock_actual FROM productos WHERE id = item.producto_id FOR UPDATE;
        
        IF v_stock_actual < item.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto %: disponible %, solicitado %', 
                item.producto_id, v_stock_actual, item.cantidad;
        END IF;

        -- Descontar stock
        UPDATE productos 
        SET cantidad_disponible = cantidad_disponible - item.cantidad,
            estado = CASE WHEN cantidad_disponible - item.cantidad = 0 THEN 'agotado'::estado_producto_enum ELSE estado END
        WHERE id = item.producto_id;

        -- Registrar en historial de auditoría
        INSERT INTO historial_stock (
            producto_id, tipo_movimiento, cantidad_anterior, cantidad_cambio, cantidad_resultante, reserva_id, motivo
        ) VALUES (
            item.producto_id,
            'reserva_creada',
            v_stock_actual,
            -item.cantidad,
            v_stock_actual - item.cantidad,
            NEW.id,
            CONCAT('Reserva confirmada con código ', NEW.codigo_retiro)
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 3: Reposición de stock si se cancela la reserva
CREATE OR REPLACE FUNCTION fn_reponer_stock_al_cancelar()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_stock_actual INT;
BEGIN
    IF OLD.estado != 'cancelada' AND NEW.estado = 'cancelada' THEN
        FOR item IN SELECT producto_id, cantidad FROM detalle_reserva WHERE reserva_id = NEW.id LOOP
            SELECT cantidad_disponible INTO v_stock_actual FROM productos WHERE id = item.producto_id FOR UPDATE;

            UPDATE productos 
            SET cantidad_disponible = cantidad_disponible + item.cantidad,
                estado = 'activo'
            WHERE id = item.producto_id;

            INSERT INTO historial_stock (
                producto_id, tipo_movimiento, cantidad_anterior, cantidad_cambio, cantidad_resultante, reserva_id, motivo
            ) VALUES (
                item.producto_id,
                'reserva_cancelada_devolucion',
                v_stock_actual,
                item.cantidad,
                v_stock_actual + item.cantidad,
                NEW.id,
                'Cancelación de reserva y retorno a góndola'
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reservas_cancelacion
AFTER UPDATE OF estado ON reservas
FOR EACH ROW
WHEN (NEW.estado = 'cancelada')
EXECUTE FUNCTION fn_reponer_stock_al_cancelar();

-- ----------------------------------------------------------------------------
-- 6. VISTAS ANALÍTICAS Y DE NEGOCIO
-- ----------------------------------------------------------------------------

-- Vista 1: Catálogo de productos activo con datos de comercio y días restantes
CREATE OR REPLACE VIEW vista_catalogo_activo AS
SELECT 
    p.id AS producto_id,
    p.nombre AS producto_nombre,
    p.descripcion AS producto_descripcion,
    p.imagen_url,
    p.precio_original,
    p.precio_reaprovecha,
    p.porcentaje_descuento,
    (p.precio_original - p.precio_reaprovecha) AS ahorro_pesos,
    p.cantidad_disponible,
    p.fecha_vencimiento,
    GREATEST(0, (p.fecha_vencimiento - CURRENT_DATE)) AS dias_restantes,
    p.hora_limite_retiro,
    p.peso_estimado_kg,
    p.motivo_oferta,
    p.ai_priority,
    cp.nombre AS categoria_nombre,
    c.id AS comercio_id,
    c.nombre AS comercio_nombre,
    c.direccion AS comercio_direccion,
    c.ciudad AS comercio_ciudad,
    c.telefono AS comercio_telefono,
    c.latitud,
    c.longitud,
    c.horario_apertura,
    c.horario_cierre,
    c.calificacion_promedio
FROM productos p
JOIN comercios c ON p.comercio_id = c.id
JOIN categorias_producto cp ON p.categoria_id = cp.id
WHERE p.estado = 'activo' AND p.cantidad_disponible > 0;

-- Vista 2: Métricas globales de la plataforma
CREATE OR REPLACE VIEW vista_metricas_globales AS
SELECT 
    COALESCE(SUM(peso_kg), 0)::NUMERIC(10,1) AS kilos_recuperados,
    COALESCE(SUM(cantidad_alimentos), 0) AS productos_recuperados,
    COALESCE(SUM(ahorro_usuario), 0)::NUMERIC(12,2) AS dinero_ahorrado,
    COALESCE(SUM(co2_evitado_kg), 0)::NUMERIC(10,1) AS co2_evitado_kg,
    COALESCE(SUM(agua_ahorrada_litros), 0)::NUMERIC(12,1) AS agua_ahorrada_litros,
    (SELECT COUNT(*) FROM comercios WHERE verificado = TRUE) AS comercios_participantes,
    (SELECT COUNT(*) FROM reservas WHERE estado IN ('confirmada', 'lista_para_retirar', 'retirada')) AS reservas_realizadas
FROM impacto_ambiental;

-- ----------------------------------------------------------------------------
-- 7. DATOS INICIALES (SEED DATA REALISTA - TANDIL)
-- ----------------------------------------------------------------------------

-- Insertar categorías
INSERT INTO categorias_producto (id, codigo, nombre, descripcion, icono, orden) VALUES
('cat-1', 'lacteos', 'Lácteos', 'Quesos tandileros, leches, mantecas y yogures', 'milk', 1),
('cat-2', 'panaderia', 'Panadería y Repostería', 'Panes de masa madre, facturas y budines', 'croissant', 2),
('cat-3', 'carnes', 'Carnes y Embutidos', 'Chorizos tandileros, jamones y cortes de novillo', 'beef', 3),
('cat-4', 'frutas_verduras', 'Frutas y Verduras', 'Producción hortícola fresca de huertas tandileras', 'apple', 4),
('cat-5', 'almacen_pastas', 'Almacén y Pastas', 'Pastas frescas, fideos, arroces y salsas', 'package', 5),
('cat-6', 'bebidas', 'Bebidas y Jugos', 'Aguas saborizadas, gaseosas y jugos naturales', 'coffee', 6),
('cat-7', 'comidas_preparadas', 'Comidas Preparadas', 'Ensaladas frescas y viandas listas para consumo', 'utensils', 7),
('cat-8', 'otro', 'Otro', 'Otros alimentos aptos para consumo responsable', 'tag', 8)
ON CONFLICT (id) DO NOTHING;

-- Insertar Usuarios de prueba
INSERT INTO usuarios (id, nombre, email, password_hash, telefono, tipo_usuario, ciudad) VALUES
('usr-consumidor-1', 'Lucía Fernández', 'lucia@example.com', 'pbkdf2_sha256_mock_hash_1', '+54 9 249 455-1234', 'consumidor', 'Tandil, Buenos Aires'),
('usr-consumidor-2', 'Martín Gómez', 'martin@example.com', 'pbkdf2_sha256_mock_hash_2', '+54 9 249 411-9876', 'consumidor', 'Tandil, Buenos Aires'),
('usr-comercio-1', 'Panadería Tandilera San Martín', 'contacto@sanmartinpan.com', 'pbkdf2_sha256_mock_hash_3', '+54 9 249 422-3344', 'comercio', 'Tandil, Buenos Aires'),
('usr-comercio-2', 'Quesería Serrana Tandil', 'ventas@queseriatandil.com', 'pbkdf2_sha256_mock_hash_4', '+54 9 249 477-8899', 'comercio', 'Tandil, Buenos Aires'),
('usr-comercio-3', 'Verdulería Don Raúl', 'donraul@tandilhuertas.com', 'pbkdf2_sha256_mock_hash_5', '+54 9 249 433-5566', 'comercio', 'Tandil, Buenos Aires')
ON CONFLICT (id) DO NOTHING;

-- Insertar Comercios de Tandil
INSERT INTO comercios (id, usuario_id, nombre, descripcion, direccion, ciudad, latitud, longitud, categoria, horario_apertura, horario_cierre, telefono) VALUES
('com-1', 'usr-comercio-1', 'Panadería Tandilera San Martín', 'Panadería tradicional con masa madre y facturas horneadas en el día.', 'San Martín 650, Tandil, Buenos Aires', 'Tandil, Buenos Aires', -37.3275000, -59.1382000, 'Panadería y Pastelería', '07:30:00', '20:30:00', '+54 9 249 422-3344'),
('com-2', 'usr-comercio-2', 'Quesería Serrana Tandil', 'Especialistas en quesos regionales, embutidos y chacinados de Tandil.', 'Av. España 420, Tandil, Buenos Aires', 'Tandil, Buenos Aires', -37.3234000, -59.1315000, 'Lácteos y Quesería', '09:00:00', '20:00:00', '+54 9 249 477-8899'),
('com-3', 'usr-comercio-3', 'Verdulería Don Raúl', 'Frutas y verduras frescas cosechadas diariamente en quintas de Tandil.', 'Pinto 780, Tandil, Buenos Aires', 'Tandil, Buenos Aires', -37.3301000, -59.1350000, 'Verdulería y Frutería', '08:00:00', '19:30:00', '+54 9 249 433-5566')
ON CONFLICT (id) DO NOTHING;

-- Fin del script de inicialización
-- ============================================================================
