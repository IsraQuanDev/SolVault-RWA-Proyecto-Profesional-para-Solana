# SolVault RWA · Custodia y Tokenización de Activos en Solana

[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-14F195?logo=solana&logoColor=white)](https://explorer.solana.com/address/A719PHJSLKVG9WFGad9od28zx17PfKdaC3Rgetbcq5dW?cluster=devnet)
[![Anchor Framework](https://img.shields.io/badge/Anchor-0.30+-5000ff?logo=rust&logoColor=white)](https://www.anchor-lang.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Deploy Status](https://img.shields.io/badge/GitHub%20Pages-Active-success)](https://israquandev.github.io/SolVault-RWA-Proyecto-Profesional-para-Solana/)

**SolVault RWA** es un protocolo descentralizado desplegado en **Solana Devnet** diseñado para la custodia institucional, tokenización y gestión de inventario de Activos del Mundo Real (**RWA - Real World Assets**, tales como lingotes de metales preciosos, equipo tecnológico e inventario de alto valor).

El sistema integra un smart contract en **Rust / Anchor** con arquitectura de cuentas jerárquicas y **PDAs (Program Derived Addresses)**, un cliente generado de manera automatizada mediante **Codama**, y un **frontend web en React 19 + TypeScript** con soporte para billeteras Web3 (**Solflare, Phantom**).

---

## 🌐 Enlaces del Proyecto Desplegado

* 🚀 **Aplicación Web en Vivo (GitHub Pages):**  
  [https://israquandev.github.io/SolVault-RWA-Proyecto-Profesional-para-Solana/](https://israquandev.github.io/SolVault-RWA-Proyecto-Profesional-para-Solana/)
* 📦 **Repositorio en GitHub:**  
  [https://github.com/IsraQuanDev/SolVault-RWA-Proyecto-Profesional-para-Solana](https://github.com/IsraQuanDev/SolVault-RWA-Proyecto-Profesional-para-Solana)
* 📜 **Contrato Desplegado en Solana Explorer (Devnet):**  
  [`A719PHJSLKVG9WFGad9od28zx17PfKdaC3Rgetbcq5dW`](https://explorer.solana.com/address/A719PHJSLKVG9WFGad9od28zx17PfKdaC3Rgetbcq5dW?cluster=devnet)

---

## 📋 Datos para el Formulario de Entrega (Airtable)

| Campo en Airtable | Valor Oficial |
|---|---|
| **Nombre del proyecto** | `SolVault RWA` |
| **Categoría \*** | `tokenizacion` |
| **Repositorio Github \*** | `https://github.com/IsraQuanDev/SolVault-RWA-Proyecto-Profesional-para-Solana` |
| **Dirección en Devnet \*** | `A719PHJSLKVG9WFGad9od28zx17PfKdaC3Rgetbcq5dW` |
| **Correo del participante \*** | *(El correo con el que te registraste en el Bootcamp WayLearn)* |

---

## 📖 Manual de Usuario: Cómo Utilizar la Aplicación Desplegada

Puedes probar y operar el protocolo directamente desde la web pública:  
👉 **[https://israquandev.github.io/SolVault-RWA-Proyecto-Profesional-para-Solana/](https://israquandev.github.io/SolVault-RWA-Proyecto-Profesional-para-Solana/)**

### Requisitos Previos
1. Contar con una wallet de Solana instalada en tu navegador (**Solflare** o **Phantom**).
2. Configurar la wallet en la red **Devnet**:
   * En Solflare: *Settings ⚙️ ➔ Network ➔ Seleccionar Devnet*.
   * En Phantom: *Ajustes ⚙️ ➔ Configuración de desarrollador ➔ Activar Modo de prueba ➔ Cambiar a Devnet*.
3. Disponer de SOL de prueba para pagar comisiones de red y rent-exemption:
   * Puedes solicitarlo gratis en [Solana Faucet](https://faucet.solana.com/) o en la pestaña **Conexión y saldos** de la propia app.

---

### Flujo Operativo Paso a Paso

```
 [1. Conectar Wallet] ──> [2. Localizar/Crear Bóveda] ──> [3. Crear Lote] ──> [4. Registrar Activo]
                                                                                       │
                              [6. Cerrar Lote Vacío] <── [5. Liquidar o Actualizar] <──┘
```

#### Paso 1: Conexión de Wallet
1. Haz clic en el botón superior derecho **Conectar wallet**.
2. Selecciona **Solflare** (o tu wallet de preferencia) y aprueba la conexión.
3. El botón mostrará tu dirección pública truncada y el estado de la red cambiará a `Devnet verificada`.

#### Paso 2: Localizar o Crear la Bóveda de Custodia
1. En la barra lateral izquierda, entra a la sección **Bóveda RWA**.
2. En el panel superior **Localizar bóveda**:
   * Por defecto aparece el nombre `Boveda Central RWA 1` y tu dirección conectada como autoridad.
   * Si ya la creaste previamente, haz clic en **Consultar bóveda** (las lecturas son públicas y no requieren firma ni gas).
3. **Para crear una bóveda nueva:**
   * En el panel derecho de **Operaciones**, selecciona la pestaña **Crear bóveda**.
   * Haz clic en el botón **Crear bóveda** y confirma la transacción en tu wallet.
   * *Nota:* En Solana las PDAs son deterministas. Si intentas crear una bóveda con un nombre que ya existe para tu wallet, la red lo rechazará porque la cuenta ya fue inicializada. Para tener múltiples bóvedas, simplemente escribe un nombre distinto arriba (ejemplo: `Boveda Oro 2`).

#### Paso 3: Crear un Lote de Activos
1. Con la bóveda cargada en pantalla, ve a la pestaña **Crear lote** en el panel de Operaciones.
2. Ingresa la categoría o tipo de activos que agrupará (ej. `Oro de inversion`, `Metales preciosos`, `Arte RWA`).
3. Pulsa **Crear lote** y firma la transacción.
4. El programa asignará automáticamente el identificador incremental onchain (`#1`, `#2`, etc.) y el lote aparecerá listado en el panel izquierdo.

#### Paso 4: Registrar un Activo Físico bajo Custodia
1. Selecciona la pestaña **Registrar activo** (o pulsa el botón **+ Activo** en la tarjeta de tu lote).
2. Rellena los datos físicos del activo:
   * **ID del lote:** `1` (el lote donde se almacenará).
   * **Serial:** Código identificador único de hasta 5 caracteres (ej. `AU001`, `SLV01`).
   * **Descripción:** Ficha técnica física de hasta 50 caracteres (ej. `Lingote de oro 100g fino 999.9`).
   * **Valor estimado (USD):** Tasación entera en USD (ej. `8500`).
3. Pulsa **Registrar activo** y aprueba la transacción. El activo quedará registrado de forma inmutable en Solana y se mostrará en la tabla del lote.

#### Paso 5: Modificar la Tasación del Activo
1. Haz clic directamente sobre la fila del activo en la tabla o ve a la pestaña **Actualizar valor**.
2. Ingresa el nuevo valor tasado (ejemplo: `9200`).
3. Pulsa **Actualizar valor** y confirma. El programa comprobará que seas el `owner` de la bóveda (`has_one = owner`) y actualizará el estado onchain.

#### Paso 6: Liquidar Activo (Cierre Condicionado y Devolución de Renta)
1. Si un activo se retira o liquida, ve a la pestaña **Liquidar activo**.
2. Ingresa el ID del lote y el serial (ej. `1` y `AU001`).
3. Pulsa **Liquidar activo**.
4. **Comportamiento onchain:** El programa valida que el activo pertenezca al lote, lo remueve del vector, decrementa el contador y ejecuta `close = owner`, **cerrando la cuenta y devolviendo los lamports de renta en SOL directamente a tu wallet**.

#### Paso 7: Cerrar un Lote Vacío (Aporte Funcional del Día 5)
1. Para dar de baja un lote que ya no se utilice, selecciona la pestaña **Cerrar lote** (o haz clic en el botón rojo *Cerrar lote* que aparece en lotes sin activos).
2. **Regla crítica de negocio en Rust:** El programa valida con `require!(lote.activos.is_empty(), Errores::LoteTieneActivos)`.
   * Si el lote tiene activos activos, la transacción es **rechazada**, impidiendo crear cuentas huérfanas.
   * Si el lote está completamente vacío, la cuenta se cierra con `close = owner`, se desvincula de la bóveda y la renta en SOL se reintegra al custodio.

---

## 🏛️ Arquitectura de Cuentas y Semillas (PDAs)

El protocolo implementa un árbol jerárquico estricto de 3 niveles donde la pertenencia queda garantizada por construcción criptográfica:

```text
Bóveda (Raíz de Custodia)   <- [b"boveda", nombre_boveda, owner]
 └─ Lote (Contenedor / Tipo) <- [b"lote", boveda, id_lote]         (ID u16 incremental onchain)
     └─ Activo (Ítem Físico) <- [b"activo", lote, serial]          (Serial único de hasta 5 bytes)
```

### Especificación de Cuentas

| Cuenta | Semillas (`seeds = [...]`) | Campos Principales | Control de Acceso y Espacio |
|---|---|---|---|
| **`Boveda`** | `[b"boveda", nombre_boveda, owner]` | `owner: Pubkey`<br>`nombre_boveda: String(30)`<br>`lotes: Vec<Pubkey>(10)`<br>`id_counter: u16` | Raíz del custodio. Exige firma del owner en todas las operaciones secundarias (`has_one = owner`). |
| **`Lote`** | `[b"lote", boveda, id_lote]` | `id_lote: u16`<br>`categoria: String(30)`<br>`total_activos: u16`<br>`activos: Vec<Pubkey>(10)` | Identificador `u16` little-endian asignado onchain. Cierre condicionado a estar vacío. |
| **`Activo`** | `[b"activo", lote, serial]` | `serial: String(5)`<br>`descripcion: String(50)`<br>`valor_estimado: u32` | Certificado de activo RWA. Cierre con reembolso de renta al custodio. |

---

## 🛑 Códigos de Error Propios del Programa

```rust
#[error_code]
pub enum Errores {
    #[msg("Error, no eres el owner de la boveda")]
    NoOwner,            // Código 6000: Control de acceso / autoridad
    #[msg("Error, el activo no esta en el lote indicado")]
    NoExisteActivo,     // Código 6001: Validación de pertenencia
    #[msg("Error, se alcanzo el limite de 10 elementos")]
    LimiteAlcanzado,    // Código 6002: Prevención de desbordamiento de espacio
    #[msg("Error, no se puede cerrar un lote con activos activos")]
    LoteTieneActivos,   // Código 6003: Regla Día 5 contra cuentas huérfanas
    #[msg("Error, el lote no esta registrado en la boveda")]
    NoExisteLote,       // Código 6004: Integridad referencial
}
```

---

## 🧪 Pruebas y Evidencias

El proyecto cuenta con un sistema de verificación integral en tres niveles:

### 1. Pruebas Automatizadas en TypeScript (`npm test`)
Ejecuta la suite de pruebas unitarias sobre el runner nativo de Node.js:
```powershell
npm test
```
**Resultado verificado (8/8 pruebas exitosas):**
```text
✔ 1. Semillas u16 conservan dos bytes little-endian y sus límites (2.2ms)
✔ 2. Boveda, Lote y Activo coinciden exactamente con las semillas del Rust de SolVault RWA (7.3ms)
✔ 3. Codama serializa la instrucción de activo y conserva roles de cuenta (5.2ms)
✔ 4. Una confirmación con error nunca produce un resultado de éxito (0.8ms)
✔ 5. Se exige el génesis completo de Devnet para escribir (0.3ms)
✔ 6. Validaciones de UI comprueban bytes UTF-8 y números enteros en rango (0.4ms)
✔ 7. Los errores traducen cancelaciones, autorizaciones, reglas y RPC (0.9ms)
✔ 8. Se valida el contrato IDL para SolVault RWA (1.0ms)
ℹ tests 8 | pass 8 | fail 0
```

### 2. Script de Pruebas Onchain en Solana Playground (`programa/client/client.ts`)
Incluido en [`programa/client/client.ts`](programa/client/client.ts). Al correrse en Playground contra Devnet, ejecuta de forma secuencial:
1. Alta de Bóveda y comprobación de balances.
2. Derivación y creación de Lote.
3. Registro de Activo RWA con serial y tasación.
4. Modificación de valor en USD.
5. Lectura y decodificación sin firma.
6. **Prueba negativa de rechazo:** Intento de cerrar lote con activos activos (comprobación de error `LoteTieneActivos` 6003).
7. Liquidación del activo con `close = owner` y reembolso de renta.
8. Cierre definitivo del lote una vez vacío.

---

## 💻 Desarrollo Local y Comandos Disponibles

Para ejecutar o auditar el proyecto en tu máquina local:

```bash
# 1. Clonar el repositorio
git clone https://github.com/IsraQuanDev/SolVault-RWA-Proyecto-Profesional-para-Solana.git
cd SolVault-RWA-Proyecto-Profesional-para-Solana

# 2. Instalar dependencias
npm install

# 3. Ejecutar pruebas automatizadas
npm test

# 4. Iniciar el servidor de desarrollo local
npm run dev

# 5. Compilar para producción
npm run build

# 6. Comprobación integral (typecheck + tests + build)
npm run verificar
```

---

## 📁 Estructura del Repositorio

```text
├── .github/workflows/
│   └── deploy.yml              # Pipeline CI/CD de GitHub Actions para GitHub Pages
├── programa/
│   ├── src/lib.rs              # Smart contract completo en Anchor Rust
│   └── client/client.ts        # Script de pruebas onchain para Solana Playground
├── src/
│   ├── components/
│   │   ├── Boveda.tsx          # Panel principal de Bóveda, Lotes, Activos y Operaciones
│   │   ├── Conexion.tsx        # Consulta pública de saldos y conexiones RPC
│   │   └── Icono.tsx           # Iconografía SVG
│   ├── solana/
│   │   ├── pdas.ts             # Derivación determinista de PDAs en TypeScript
│   │   ├── lecturas.ts         # Consultas RPC con fetchMaybe y fetchAll
│   │   ├── acciones.ts         # Builders de transacciones con Codama
│   │   ├── validaciones.ts     # Validaciones UTF-8 y enteros seguros
│   │   ├── seguridad.ts        # Comprobación de Devnet génesis y ejecutable
│   │   └── tx.ts               # Envío, confirmación y traducción de errores
│   ├── config/
│   │   ├── programa.json       # Configuración del Program ID activo
│   │   └── interfaz.ts         # Títulos y constantes de la UI
│   └── App.tsx                 # Layout principal con Wallet Adapter y navegación
├── clients/js/                 # Cliente TypeScript generado automáticamente con Codama
├── idl.json                    # IDL oficial exportado de Anchor
└── package.json
```

---

## ⚖️ Licencia y Créditos

Este proyecto fue desarrollado como entrega final del **Solana Engineering Track** por **WayLearn**. Basado en los patrones de arquitectura de cuentas de Solana y ampliado para el caso de uso institucional de Tokenización e Inventario RWA.
