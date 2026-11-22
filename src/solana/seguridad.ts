import type { Connection } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import programa from '../config/programa.json';
import { BOVEDA_PROGRAM_ADDRESS } from '../../clients/js/src/generated';

// Hash del bloque génesis de Solana Devnet.
export const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';

export function comprobarConfiguracion() {
  if (programa.esReferencia) {
    throw new Error('Importa el IDL de tu programa desplegado para habilitar las operaciones.');
  }
  if (programa.programId !== String(BOVEDA_PROGRAM_ADDRESS)) {
    throw new Error('El IDL y el cliente generado no corresponden. Ejecuta npm run cliente.');
  }
}

export async function comprobarDevnet(connection: Pick<Connection, 'getGenesisHash'>) {
  const genesis = await connection.getGenesisHash();
  if (genesis !== DEVNET_GENESIS) {
    throw new Error('Este proyecto solo permite operar en Devnet. Revisa el endpoint RPC.');
  }
}

export async function comprobarPrograma(connection: Connection) {
  comprobarConfiguracion();
  await comprobarDevnet(connection);
  const cuenta = await connection.getAccountInfo(new PublicKey(BOVEDA_PROGRAM_ADDRESS), 'confirmed');
  if (!cuenta?.executable) {
    throw new Error('El programa de la bóveda no está desplegado en este RPC de Devnet. Revisa el Program ID y tu despliegue.');
  }
}
