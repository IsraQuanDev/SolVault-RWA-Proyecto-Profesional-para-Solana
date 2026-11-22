# SolVault RWA · Custodia y Tokenización de Activos en Solana

**SolVault RWA** es una aplicación descentralizada desarrollada en **Solana Devnet** para la custodia, tokenización y gestión de inventario de Activos del Mundo Real (**RWA - Real World Assets**, tales como lingotes de metales preciosos, equipo tecnológico y arte de colección).

El proyecto integra un programa de Solana escrito en **Rust / Anchor** con arquitectura de cuentas jerárquicas y **PDAs (Program Derived Addresses)**, un cliente tipado generado automáticamente con **Codama**, y un **frontend web en React + TypeScript** con integración de billeteras (**Phantom, Solflare**).

---

## 📋 Datos para el Formulario de Entrega (Airtable)

| Campo | Valor |
|---|---|
| **Nombre del proyecto** | `SolVault RWA` |
| **Categoría** | `tokenizacion` |
| **Repositorio GitHub** | *(Tu URL pública de GitHub, e.g. `https://github.com/TU_USUARIO/solvault-rwa`)* |
| **Dirección en Devnet** | *Obtenida tras desplegar en Solana Playground (ver sección de despliegue)* |
| **Correo del participante** | *(Tu correo registrado en el Bootcamp WayLearn)* |

---

## 🏛️ Template de Partida y Decisiones de Diseño

- **Repositorios base de referencia:**
  - Programa: [`WayLearnLatam/Registro-Ventas-Solana-PDA`](https://github.com/WayLearnLatam/Registro-Ventas-Solana-PDA)
  - Frontend: [`WayLearnLatam/Registro-Ventas-Solana-App`](https://github.com/WayLearnLatam/Registro-Ventas-Solana-App)
- **Ruta elegida:** **Proyecto Propio** con categoría **`tokenizacion`**.
- **Dominio modelado:** En lugar del genérico Registro -> Cliente -> Venta, se implementa una infraestructura de custodia física:
  ```
  Bóveda (Raíz de Custodia)
   └─ Lote (Contenedor / Categoría de Activos con ID incremental)
       └─ Activo (Ítem físico RWA individual identificado por serial único)
  ```

---

## 🔑 Arquitectura de Cuentas y Semillas (PDAs)

Todas las cuentas del programa son deterministas (PDAs) y garantizan pertenencia por construcción:

| Cuenta | Semillas en Rust (`seeds = [...]`) | Propósito |
|---|---|---|
| **Boveda** | `[b"boveda", nombre_boveda.as_bytes(), owner.key().as_ref()]` | Raíz del custodio. Almacena contador y lista de lotes. |
| **Lote** | `[b"lote", boveda.key().as_ref(), id_lote.to_le_bytes().as_ref()]` | Agrupa activos por categoría. Su ID se asigna onchain incrementalmente (`u16` little-endian). |
| **Activo** | `[b"activo", lote.key().as_ref(), serial.as_bytes()]` | Registro individual de activo físico RWA (máx. 5 bytes UTF-8 para el serial). |

---

## ⚙️ Instrucciones del Programa Anchor

1. **`crear_boveda(nombre_boveda: String)`**: Inicializa la bóveda con la wallet firmante como autoridad única (`owner`).
2. **`crear_lote(categoria: String)`**: Crea un nuevo lote con ID autoincremental (`boveda.id_counter + 1`) y lo vincula al vector de lotes.
3. **`registrar_activo(id_lote: u16, serial: String, descripcion: String, valor_estimado: u32)`**: Registra un activo dentro del lote, almacena su tasación en USD y suma 1 al contador de activos.
4. **`actualizar_valor(id_lote: u16, serial: String, nuevo_valor: u32)`**: Modifica el valor tasado del activo. Requiere validación de autoridad (`has_one = owner`).
5. **`liquidar_activo(id_lote: u16, serial: String)`**: **Baja condicionada**: Verifica que el activo pertenezca al lote, lo elimina del historial, decrementa el contador y ejecuta `close = owner`, **liberando los lamports de renta devuelta al custodio**.
6. **`cerrar_lote(id_lote: u16)`**: **Aporte funcional / Baja del Día 5**: Cierra la cuenta del lote (`close = owner`), pero **únicamente si el lote no tiene activos activos** (`require!(lote.activos.is_empty(), Errores::LoteTieneActivos)`). Esto previene la existencia de activos huérfanos onchain.

---

## 🧪 Pruebas y Evidencias

El proyecto cuenta con verificación en tres capas:

### 1. Pruebas Automatizadas en TypeScript (`npm test`)
Ejecuta la suite de pruebas con el runner nativo de Node.js:
- Semillas `u16` little-endian y validación de rangos numéricos.
- Coincidencia byte a byte de las PDAs del frontend con las derivadas por Rust.
- Serialización de Codama y mapeo exacto de cuentas escribibles y firmantes.
- Verificación de preflight y tratamiento de errores (`NoOwner`, `NoExisteActivo`, `LoteTieneActivos`, `ConstraintSeeds`).

### 2. Recorrido de Pruebas Onchain en Solana Playground (`programa/client/client.ts`)
Al ejecutar el script de pruebas en Playground, se generan y validan:
- **Evidencia 1 (Creación):** Alta exitosa de Bóveda y Lote.
- **Evidencia 2 (Lectura):** Decodificación pública del estado onchain sin firmar.
- **Evidencia 3 (Modificación):** Modificación de tasación de USD 8,500 a USD 9,200.
- **Evidencia 4 (Permisos y Rechazo):** Intento de cerrar un lote con activos activos, provocando el rechazo controlado con error `LoteTieneActivos` (código `6003`).
- **Evidencia 5 (Cierre Condicionado):** Cierre del activo con devolución de renta (`close = owner`) y posterior cierre del lote vacío.

---

## 🚀 Despliegue en Solana Playground (Devnet)

1. Abre [beta.solpg.io](https://beta.solpg.io/).
2. Crea un nuevo proyecto tipo **Anchor (Rust)** con el nombre `boveda`.
3. Pega el contenido de [`programa/src/lib.rs`](programa/src/lib.rs) en `src/lib.rs`.
4. Pulsa **Build**. (Anchor completará automáticamente el `declare_id!`).
5. Conéctate a **Devnet** y pulsa **Deploy**.
6. Copia el **Program ID** desplegado (ejemplo: `6xY...`).
7. En la pestaña *Build & Deploy*, exporta el `idl.json`.
8. En tu terminal local, configura el frontend con tu despliegue:
   ```bash
   npm run configurar:idl -- ./idl.json --program-id TU_PROGRAM_ID
   ```
9. Inicia la aplicación:
   ```bash
   npm run dev
   ```

---

## 📦 Estructura del Repositorio

```
├── programa/
│   ├── src/lib.rs              # Smart Contract completo en Anchor Rust
│   └── client/client.ts        # Script de pruebas y evidencias para Solana Playground
├── src/
│   ├── components/
│   │   ├── Boveda.tsx          # Panel principal de búsqueda, listado y operaciones
│   │   ├── Conexion.tsx        # Consulta de saldos y conexiones RPC
│   │   └── Icono.tsx           # Iconografía SVG
│   ├── solana/
│   │   ├── pdas.ts             # Derivación determinista de PDAs (bóveda, lote, activo)
│   │   ├── lecturas.ts         # Consultas RPC con fetchMaybe y fetchAll
│   │   ├── acciones.ts         # Builders de transacciones con Codama
│   │   ├── validaciones.ts     # Validaciones UTF-8 y rangos numéricos
│   │   ├── seguridad.ts        # Comprobación de Devnet y ejecutable
│   │   └── tx.ts               # Envío, confirmación y traducción de errores
│   └── App.tsx                 # Layout principal con Wallet Adapter
├── tests/
│   └── integracion-cliente.test.ts  # Pruebas automatizadas de integración
├── idl.json                    # IDL del contrato en formato Anchor
└── package.json
```
