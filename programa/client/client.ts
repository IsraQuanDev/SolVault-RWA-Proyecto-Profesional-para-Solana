//////////////////// Imports ////////////////////
import { PublicKey } from "@solana/web3.js";

////////////////// Constantes ////////////////////
const nombre_boveda = "Boveda Central RWA 1"; // Nombre de la bóveda
const owner = pg.wallet.publicKey; // Wallet del custodio/owner

//////////////////// Client Test Logs ////////////////////
console.log("Custodio / Owner address:", owner.toString());
const balance = await pg.connection.getBalance(owner);
console.log(`Saldo inicial: ${balance / web3.LAMPORTS_PER_SOL} SOL`);

//////////////////// OBTENER PDAs ////////////////////
/*
Las semillas siguen la jerarquía estricta del modelo SolVault RWA:

    boveda  <- ["boveda", nombre_boveda, owner]
    lote    <- ["lote",   boveda,        id_lote]
    activo  <- ["activo", lote,          serial]

Para derivar un activo se requiere la cadena completa.
*/

//////////////////// Helper: u16 a bytes ////////////////////
function u16ToBytes(valor: number) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(valor, 0); // Little-endian, igual que to_le_bytes() en Rust
  return buffer;
}

//////////////////// 1. PDA Boveda ////////////////////
function pdaBoveda(nombre: string) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("boveda"),
      Buffer.from(nombre),
      owner.toBuffer(),
    ],
    pg.PROGRAM_ID
  );
}

//////////////////// 2. PDA Lote ////////////////////
function pdaLote(pda_boveda: PublicKey, id_lote: number) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("lote"),
      pda_boveda.toBuffer(),
      u16ToBytes(id_lote),
    ],
    pg.PROGRAM_ID
  );
}

//////////////////// 3. PDA Activo ////////////////////
function pdaActivo(pda_lote: PublicKey, serial: string) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("activo"),
      pda_lote.toBuffer(),
      Buffer.from(serial),
    ],
    pg.PROGRAM_ID
  );
}

//////////////////// Helper: Cadena completa ////////////////////
function cadena(nombre: string, id_lote: number, serial?: string) {
  const [boveda] = pdaBoveda(nombre);
  const [lote] = pdaLote(boveda, id_lote);
  const [activo] = serial ? pdaActivo(lote, serial) : [null];
  return { boveda, lote, activo };
}

//////////////////// Helper: Siguiente id de lote ////////////////////
async function siguienteId(nombre: string) {
  const [boveda] = pdaBoveda(nombre);
  const cuenta = await pg.program.account.boveda.fetch(boveda);
  return cuenta.idCounter + 1;
}

//////////////////// FLUJO DE PRUEBAS Y EVIDENCIAS ////////////////////
console.log("--------------------------------------------------");
console.log("EJECUTANDO RECORRIDO DE PRUEBAS Y EVIDENCIAS...");

// Paso 1: Crear Bóveda
try {
  const [boveda] = pdaBoveda(nombre_boveda);
  console.log("Creando bóveda en PDA:", boveda.toBase58());
  const tx1 = await pg.program.methods
    .crearBoveda(nombre_boveda)
    .accounts({
      owner,
      boveda,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
  console.log("-> Bóveda creada exitosamente. Tx:", tx1);
} catch (e: any) {
  console.log("Aviso en Bóveda (posiblemente ya existe):", e.message);
}

// Paso 2: Crear Lote
let id_lote = 1;
try {
  const [boveda] = pdaBoveda(nombre_boveda);
  id_lote = await siguienteId(nombre_boveda);
  const [lote] = pdaLote(boveda, id_lote);
  console.log(`Creando Lote #${id_lote} en PDA:`, lote.toBase58());
  const tx2 = await pg.program.methods
    .crearLote("Oro de inversion")
    .accounts({
      owner,
      boveda,
      lote,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
  console.log(`-> Lote #${id_lote} creado exitosamente. Tx:`, tx2);
} catch (e: any) {
  console.log("Error al crear lote:", e.message);
}

// Paso 3: Registrar Activo RWA
const serial_activo = "AU001";
try {
  const { boveda, lote, activo } = cadena(nombre_boveda, id_lote, serial_activo);
  console.log(`Registrando activo ${serial_activo} en PDA:`, activo!.toBase58());
  const tx3 = await pg.program.methods
    .registrarActivo(id_lote, serial_activo, "Lingote de oro 100g 999.9", 8500)
    .accounts({
      owner,
      boveda,
      lote,
      activo: activo!,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
  console.log(`-> Activo ${serial_activo} registrado con valor $8,500 USD. Tx:`, tx3);
} catch (e: any) {
  console.log("Error al registrar activo:", e.message);
}

// Paso 4: Modificar Valor Tasado
try {
  const { boveda, lote, activo } = cadena(nombre_boveda, id_lote, serial_activo);
  console.log(`Actualizando valor de ${serial_activo} a $9,200 USD...`);
  const tx4 = await pg.program.methods
    .actualizarValor(id_lote, serial_activo, 9200)
    .accounts({
      owner,
      boveda,
      lote,
      activo: activo!,
    })
    .rpc();
  console.log(`-> Valor actualizado a $9,200 USD. Tx:`, tx4);
} catch (e: any) {
  console.log("Error al actualizar valor:", e.message);
}

// Paso 5: Lectura onchain
try {
  const { boveda, lote, activo } = cadena(nombre_boveda, id_lote, serial_activo);
  const dataBoveda = await pg.program.account.boveda.fetch(boveda);
  const dataLote = await pg.program.account.lote.fetch(lote);
  const dataActivo = await pg.program.account.activo.fetch(activo!);
  console.log("--- ESTADO ONCHAIN VERIFICADO ---");
  console.log("Bóveda:", dataBoveda.nombreBoveda, "| Total lotes:", dataBoveda.lotes.length);
  console.log("Lote #", dataLote.idLote, "| Categoria:", dataLote.categoria, "| Total activos:", dataLote.totalActivos);
  console.log("Activo:", dataActivo.serial, "| Desc:", dataActivo.descripcion, "| Valor:", dataActivo.valorEstimado);
} catch (e: any) {
  console.log("Error en lectura:", e.message);
}

// Paso 6: Prueba negativa de cierre de lote con activos (Día 5)
try {
  const { boveda, lote } = cadena(nombre_boveda, id_lote);
  console.log("Probando rechazo: Intentar cerrar lote que AUN tiene activos custodiados...");
  await pg.program.methods
    .cerrarLote(id_lote)
    .accounts({
      owner,
      boveda,
      lote,
    })
    .rpc();
  console.log("FALLO: La instrucción debió ser rechazada por LoteTieneActivos");
} catch (e: any) {
  console.log("-> RECHAZO ESPERADO EXITOSO (LoteTieneActivos):", e.message);
}

// Paso 7: Liquidar Activo (Cierre condicionado `close = owner`)
try {
  const { boveda, lote, activo } = cadena(nombre_boveda, id_lote, serial_activo);
  console.log(`Liquidando activo ${serial_activo} y cerrando cuenta...`);
  const tx7 = await pg.program.methods
    .liquidarActivo(id_lote, serial_activo)
    .accounts({
      owner,
      boveda,
      lote,
      activo: activo!,
    })
    .rpc();
  console.log(`-> Activo ${serial_activo} liquidado. Renta reembolsada. Tx:`, tx7);
} catch (e: any) {
  console.log("Error al liquidar activo:", e.message);
}

// Paso 8: Cerrar Lote ahora que está vacío (Día 5 cumplido)
try {
  const { boveda, lote } = cadena(nombre_boveda, id_lote);
  console.log(`Cerrando lote #${id_lote} ahora que está vacío...`);
  const tx8 = await pg.program.methods
    .cerrarLote(id_lote)
    .accounts({
      owner,
      boveda,
      lote,
    })
    .rpc();
  console.log(`-> Lote #${id_lote} cerrado exitosamente. Renta reembolsada. Tx:`, tx8);
} catch (e: any) {
  console.log("Error al cerrar lote:", e.message);
}

console.log("--------------------------------------------------");
console.log("TODAS LAS PRUEBAS Y EVIDENCIAS COMPLETADAS.");
