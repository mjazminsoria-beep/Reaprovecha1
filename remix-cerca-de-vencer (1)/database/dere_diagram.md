# Diagrama Entidad-Relación Extendido (DERE) - Plataforma ReAprovecha Tandil

Este documento describe el modelo conceptual, lógico y físico de datos para la plataforma **ReAprovecha Tandil**, diseñada para el rescate y comercialización con descuento de excedentes alimentarios y productos próximos a vencer.

---

## 1. Modelo Conceptual y Semántica del DERE

### 1.1 Entidades Principales

1. **`USUARIOS` (Superentidad)**:
   - Contiene los atributos comunes a todas las personas u organizaciones que acceden al sistema: identidad, credenciales seguras, datos de contacto y rol.
   - **Especialización Total y Disjunta**:
     - `Consumidor`: Usuario final que busca ofertas, reserva alimentos y retira en tienda.
     - `Comercio`: Proveedor o elaborador que publica sus lotes de excedente.
     - `Administrador`: Rol de gestión, soporte y validación de calidad.

2. **`COMERCIOS` (Entidad Especializada / Fuerte)**:
   - Representa el establecimiento físico radicado en Tandil.
   - Relación 1:1 obligatoria con `USUARIOS` (un comercio siempre está respaldado por una cuenta de usuario).
   - Posee coordenadas geográficas (`latitud`, `longitud`) para permitir el cálculo de cercanía por fórmula de Haversine hacia el consumidor.

3. **`CATEGORIAS_PRODUCTO` (Entidad de Clasificación)**:
   - Catálogo estandarizado de rubros: Lácteos, Panadería, Carnes y Embutidos, Frutas y Verduras, Almacén y Pastas, Bebidas, etc.

4. **`PRODUCTOS` (Entidad Fuerte)**:
   - Representa el lote o producto publicado para rescate.
   - Cada producto pertenece obligatoriamente a un comercio (`comercio_id`) y a una categoría (`categoria_id`).
   - Almacena precios (`precio_original`, `precio_reaprovecha`), fecha de vencimiento, motivo de la oferta (vencimiento, exceso de stock, defecto estético inocuo) e indicadores de urgencia calculados por IA.

5. **`RESERVAS` (Entidad Transaccional)**:
   - Instancia de compra y reserva presencial formalizada por un consumidor ante un comercio.
   - Dispone de un `codigo_retiro` amigable (ej. `REP-5921`) para verificación rápida en mostrador.
   - Ciclo de estados: `pendiente` → `confirmada` → `lista_para_retirar` → `retirada` (o `cancelada`).

6. **`DETALLE_RESERVA` (Entidad Débil por Existencia e Identificación)**:
   - Líneas de pedido que asocian `RESERVAS` con `PRODUCTOS`.
   - Congela el precio unitario pactado al momento de la reserva (*snapshot* de precio y peso) para preservar el historial contable aun si el producto cambia de precio posteriormente.

7. **`IMPACTO_AMBIENTAL` (Entidad Histórica y Analítica)**:
   - Registra el ahorro social y ecológico generado por cada reserva concretada.
   - Métricas: `peso_kg` rescatado, `co2_evitado_kg` (basado en estándar FAO: 2.5 kg CO₂e / kg de alimento), `agua_ahorrada_litros` y `ahorro_usuario` en pesos argentinos.

8. **`VALORACIONES_RESENAS` (Entidad de Reputación)**:
   - Calificación de 1 a 5 estrellas, evaluación del estado físico del producto y puntualidad de entrega en el comercio.

9. **`HISTORIAL_STOCK` (Entidad de Auditoría)**:
   - Bitácora inmutable de movimientos de stock: creación de oferta, reserva, cancelación y reposición, ajuste manual o baja por vencimiento.

10. **`NOTIFICACIONES` (Entidad de Comunicación)**:
    - Alertas de confirmación de reserva, recordatorio de horario límite de retiro y notificaciones de productos próximos a expirar.

---

## 2. Diagrama de Relaciones y Cardinalidades

```
+----------------+          1 : 1          +----------------+
|    USUARIOS    |------------------------->|   COMERCIOS    |
+----------------+                          +----------------+
        |                                           |
        | 1                                         | 1
        |                                           |
        | N                                         | N
        v                                           v
+----------------+          1 : N           +----------------+
|    RESERVAS    |<-------------------------|   PRODUCTOS    |
+----------------+                          +----------------+
        |                                           ^
        | 1                                         |
        |                                           | 1
        | N                                         |
        v                                           | N
+----------------+          N : 1                   |
| DETALLE_RESERVA|----------------------------------+
+----------------+
        |
        | 1 : 1
        v
+--------------------+      +--------------------+      +--------------------+
| IMPACTO_AMBIENTAL  |      |VALORACIONES_RESENAS|      |  HISTORIAL_STOCK   |
+--------------------+      +--------------------+      +--------------------+
```

### Tabla de Cardinalidades y Reglas de Negocio

| Entidad Origen | Relación | Entidad Destino | Cardinalidad | Participación | Regla de Negocio / Integridad |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **USUARIOS** | Posee | **COMERCIOS** | 1 : 1 | Parcial en Usuario / Total en Comercio | Un usuario puede ser comercio o consumidor. Todo comercio requiere un usuario creador. Si se borra el usuario, se elimina el comercio (`CASCADE`). |
| **COMERCIOS** | Publica | **PRODUCTOS** | 1 : N | Total en Producto | Un comercio puede publicar múltiples productos. Todo producto debe pertenecer a un comercio. Si se borra el comercio, se eliminan sus productos (`CASCADE`). |
| **CATEGORIAS** | Clasifica | **PRODUCTOS** | 1 : N | Total en Producto | Cada producto pertenece a una categoría. No se puede borrar una categoría en uso (`RESTRICT`). |
| **USUARIOS** | Emite | **RESERVAS** | 1 : N | Parcial en Usuario | Un consumidor puede emitir 0 a N reservas. Una reserva pertenece a exactamente 1 usuario. No se puede borrar un usuario con reservas (`RESTRICT`). |
| **COMERCIOS** | Recibe | **RESERVAS** | 1 : N | Total en Comercio | Un comercio recibe 0 a N reservas de clientes. |
| **RESERVAS** | Desglosa | **DETALLE_RESERVA** | 1 : N | Total en Detalle | Toda reserva debe tener al menos 1 ítem de detalle. Si se elimina la reserva, se eliminan sus detalles (`CASCADE`). |
| **PRODUCTOS** | Figura en | **DETALLE_RESERVA** | 1 : N | Parcial en Producto | Un producto puede estar en múltiples detalles. No se puede borrar físicamente un producto con ventas activas (`RESTRICT`). |
| **RESERVAS** | Genera | **IMPACTO_AMBIENTAL** | 1 : 1 | Parcial en Reserva | Cada reserva confirmada o retirada genera exactamente 1 registro auditable de impacto ambiental. |
| **RESERVAS** | Recibe | **VALORACIONES** | 1 : 0..1 | Parcial en Reserva | Una reserva completada puede recibir como máximo 1 reseña por parte del cliente que retiró. |
| **PRODUCTOS** | Registra | **HISTORIAL_STOCK** | 1 : N | Total en Historial | Cada movimiento de unidades en un producto queda registrado para auditoría y trazabilidad. |
| **USUARIOS** | Recibe | **NOTIFICACIONES** | 1 : N | Total en Notificación | Mensajes dirigidos a consumidores y comercios. Si se borra el usuario se borran sus notificaciones (`CASCADE`). |

---

## 3. Diagrama Mermaid (DERE)

```mermaid
erDiagram
    USUARIOS ||--o| COMERCIOS : "perfil comercial (1:1)"
    USUARIOS ||--o{ RESERVAS : "genera (1:N)"
    USUARIOS ||--o{ NOTIFICACIONES : "recibe (1:N)"
    USUARIOS ||--o{ VALORACIONES_RESENAS : "escribe (1:N)"
    
    COMERCIOS ||--o{ PRODUCTOS : "publica (1:N)"
    COMERCIOS ||--o{ RESERVAS : "despacha (1:N)"
    COMERCIOS ||--o{ VALORACIONES_RESENAS : "recibe (1:N)"
    COMERCIOS ||--o{ IMPACTO_AMBIENTAL : "acredita (1:N)"
    
    CATEGORIAS_PRODUCTO ||--o{ PRODUCTOS : "agrupa (1:N)"
    
    PRODUCTOS ||--o{ DETALLE_RESERVA : "incluido_en (1:N)"
    PRODUCTOS ||--o{ HISTORIAL_STOCK : "audita (1:N)"
    
    RESERVAS ||--|{ DETALLE_RESERVA : "contiene (1:N)"
    RESERVAS ||--o| IMPACTO_AMBIENTAL : "calcula (1:1)"
    RESERVAS ||--o| VALORACIONES_RESENAS : "origina (1:1)"

    USUARIOS {
        varchar(36) id PK
        varchar(100) nombre
        varchar(150) email UK
        varchar(255) password_hash
        varchar(30) telefono
        tipo_usuario_enum tipo_usuario
        varchar(100) ciudad
        boolean activo
        timestamp fecha_creacion
    }

    COMERCIOS {
        varchar(36) id PK
        varchar(36) usuario_id FK,UK
        varchar(150) nombre
        text descripcion
        varchar(255) direccion
        numeric latitud
        numeric longitud
        categoria_comercio_enum categoria
        time horario_apertura
        time horario_cierre
        varchar(30) telefono
        numeric calificacion_promedio
    }

    CATEGORIAS_PRODUCTO {
        varchar(36) id PK
        varchar(50) codigo UK
        varchar(100) nombre
        text descripcion
        varchar(50) icono
        boolean activo
    }

    PRODUCTOS {
        varchar(36) id PK
        varchar(36) comercio_id FK
        varchar(36) categoria_id FK
        varchar(150) nombre
        text descripcion
        text imagen_url
        numeric precio_original
        numeric precio_reaprovecha
        int porcentaje_descuento
        int cantidad_disponible
        int cantidad_inicial
        date fecha_vencimiento
        varchar(80) hora_limite_retiro
        numeric peso_estimado_kg
        varchar(100) motivo_oferta
        estado_producto_enum estado
        prioridad_ia_enum ai_priority
    }

    RESERVAS {
        varchar(36) id PK
        varchar(20) codigo_retiro UK
        varchar(36) usuario_id FK
        varchar(36) comercio_id FK
        estado_reserva_enum estado
        numeric total
        numeric ahorro_total
        varchar(100) cliente_nombre
        varchar(30) cliente_telefono
        varchar(150) cliente_email
        timestamp fecha_reserva
        timestamp fecha_retiro
    }

    DETALLE_RESERVA {
        varchar(36) id PK
        varchar(36) reserva_id FK
        varchar(36) producto_id FK
        int cantidad
        numeric precio_unitario
        numeric subtotal
        numeric peso_unitario_kg
        varchar(150) nombre_snapshot
    }

    IMPACTO_AMBIENTAL {
        varchar(36) id PK
        varchar(36) reserva_id FK,UK
        varchar(36) usuario_id FK
        varchar(36) comercio_id FK
        int cantidad_alimentos
        numeric peso_kg
        numeric ahorro_usuario
        numeric co2_evitado_kg
        numeric agua_ahorrada_litros
    }

    VALORACIONES_RESENAS {
        varchar(36) id PK
        varchar(36) reserva_id FK,UK
        varchar(36) usuario_id FK
        varchar(36) comercio_id FK
        int puntuacion
        text comentario
        varchar(30) estado_alimento
        boolean puntualidad_entrega
    }

    HISTORIAL_STOCK {
        varchar(36) id PK
        varchar(36) producto_id FK
        tipo_movimiento_stock_enum tipo_movimiento
        int cantidad_anterior
        int cantidad_cambio
        int cantidad_resultante
        varchar(36) reserva_id FK
        timestamp fecha
    }

    NOTIFICACIONES {
        varchar(36) id PK
        varchar(36) usuario_id FK
        varchar(150) titulo
        text mensaje
        tipo_notificacion_enum tipo
        boolean leida
        timestamp fecha_creacion
    }
```

---

## 4. Diccionario de Datos y Normalización (3FN)

El diseño cumple estrictamente con la **Tercera Forma Normal (3FN)**:
1. **1FN**: Todos los atributos son atómicos (sin listas repetitivas dentro de celdas; los ítems de reserva se desacoplan en `detalle_reserva`).
2. **2FN**: Toda columna no clave depende por completo de la clave primaria completa.
3. **3FN**: No existen dependencias transitivas (ej. los datos del comercio no se duplican en la tabla `productos`, solo se almacena `comercio_id`; los datos del cliente no se duplican en `impacto_ambiental`, solo se vinculan mediante claves foráneas).
