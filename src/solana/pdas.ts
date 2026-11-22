import { address, type Address } from "@solana/kit";
import { PublicKey } from "@solana/web3.js";

import { BOVEDA_PROGRAM_ADDRESS } from "../../clients/js/src/generated";
import { s } from "./seeds";

/*
DERIVACION DE PDAs

El Program ID se obtiene del cliente generado a partir de idl.json.
No hay direcciones hardcodeadas en el código.

findProgramAddressSync devuelve un PublicKey de @solana/web3.js y el cliente de Codama
utiliza Address de @solana/kit. derivar() estandariza esa conversión de tipos.
*/
const PROGRAM_ID = new PublicKey(BOVEDA_PROGRAM_ADDRESS);

function derivar(semillas: Buffer[]): Address {
  const [pda] = PublicKey.findProgramAddressSync(semillas, PROGRAM_ID);
  return address(pda.toBase58());
}

// Rust: seeds = [b"boveda", nombre_boveda.as_bytes(), owner.key().as_ref()]
export function pdaBoveda(nombreBoveda: string, owner: Address) {
  return derivar([s.texto("boveda"), s.texto(nombreBoveda), s.cuenta(owner)]);
}

// Rust: seeds = [b"lote", boveda.key().as_ref(), id_lote.to_le_bytes()]
export function pdaLote(boveda: Address, idLote: number) {
  return derivar([s.texto("lote"), s.cuenta(boveda), s.u16(idLote)]);
}

// Rust: seeds = [b"activo", lote.key().as_ref(), serial.as_bytes()]
export function pdaActivo(lote: Address, serial: string) {
  return derivar([s.texto("activo"), s.cuenta(lote), s.texto(serial)]);
}

/*
Las instrucciones de activo necesitan la cadena completa (bóveda -> lote -> activo),
porque el programa valida la jerarquía en los contextos de Anchor.
*/
export function cadena(
  nombreBoveda: string,
  owner: Address,
  idLote: number,
  serial?: string
) {
  const boveda = pdaBoveda(nombreBoveda, owner);
  const lote = pdaLote(boveda, idLote);
  const activo = serial ? pdaActivo(lote, serial) : undefined;
  return { boveda, lote, activo };
}
