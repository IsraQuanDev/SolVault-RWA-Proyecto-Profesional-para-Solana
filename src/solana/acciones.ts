import { address, createNoopSigner, type Address } from '@solana/kit';
import type { Connection } from '@solana/web3.js';
import {
  getCrearBovedaInstruction,
  getCrearLoteInstruction,
  getRegistrarActivoInstruction,
  getActualizarValorInstruction,
  getLiquidarActivoInstruction,
  getCerrarLoteInstruction,
} from '../../clients/js/src/generated';
import { cadena, pdaBoveda, pdaLote } from './pdas';
import { siguienteId } from './lecturas';
import { enviar, type WalletFirma, type OpcionesEnvio } from './tx';
import { comprobarConfiguracion } from './seguridad';
import {
  bovedaValida,
  categoriaValida,
  serialValido,
  descripcionValida,
  idValido,
  valorEstimadoValido,
} from './validaciones';

export function direccionDe(wallet: Pick<WalletFirma, 'publicKey'>): Address {
  if (!wallet.publicKey) throw new Error('Conecta tu wallet primero.');
  return address(wallet.publicKey.toBase58());
}

function firmante(wallet: WalletFirma) {
  comprobarConfiguracion();
  return createNoopSigner(direccionDe(wallet));
}

/** 1. Crear Bóveda raíz */
export async function crearBoveda(
  wallet: WalletFirma,
  connection: Connection,
  nombreBoveda: string,
  opciones?: OpcionesEnvio
): Promise<string> {
  nombreBoveda = bovedaValida(nombreBoveda);
  const owner = firmante(wallet);
  const boveda = pdaBoveda(nombreBoveda, owner.address);
  const ix = getCrearBovedaInstruction({ owner, boveda, nombreBoveda });
  return enviar(ix, wallet, connection, opciones);
}

/** 2. Crear Lote (entidad hija con id autoincremental) */
export async function crearLote(
  wallet: WalletFirma,
  connection: Connection,
  nombreBoveda: string,
  categoria: string,
  opciones?: OpcionesEnvio
): Promise<string> {
  nombreBoveda = bovedaValida(nombreBoveda);
  categoria = categoriaValida(categoria);
  const owner = firmante(wallet);
  const boveda = pdaBoveda(nombreBoveda, owner.address);
  const id = await siguienteId(nombreBoveda, owner.address);
  const lote = pdaLote(boveda, id);
  const ix = getCrearLoteInstruction({ owner, boveda, lote, categoria });
  return enviar(ix, wallet, connection, opciones);
}

/** 3. Registrar Activo (registro de activo físico RWA) */
export async function registrarActivo(
  wallet: WalletFirma,
  connection: Connection,
  nombreBoveda: string,
  idLote: number,
  serial: string,
  descripcion: string,
  valorEstimado: number,
  opciones?: OpcionesEnvio
): Promise<string> {
  nombreBoveda = bovedaValida(nombreBoveda);
  idLote = idValido(idLote);
  serial = serialValido(serial);
  descripcion = descripcionValida(descripcion);
  valorEstimado = valorEstimadoValido(valorEstimado);

  const owner = firmante(wallet);
  const { boveda, lote, activo } = cadena(nombreBoveda, owner.address, idLote, serial);
  if (!activo) throw new Error('Error al derivar la dirección del activo.');

  const ix = getRegistrarActivoInstruction({
    owner,
    boveda,
    lote,
    activo,
    idLote,
    serial,
    descripcion,
    valorEstimado,
  });
  return enviar(ix, wallet, connection, opciones);
}

/** 4. Modificar Valor del Activo */
export async function actualizarValor(
  wallet: WalletFirma,
  connection: Connection,
  nombreBoveda: string,
  idLote: number,
  serial: string,
  nuevoValor: number,
  opciones?: OpcionesEnvio
): Promise<string> {
  nombreBoveda = bovedaValida(nombreBoveda);
  idLote = idValido(idLote);
  serial = serialValido(serial);
  nuevoValor = valorEstimadoValido(nuevoValor);

  const owner = firmante(wallet);
  const { boveda, lote, activo } = cadena(nombreBoveda, owner.address, idLote, serial);
  if (!activo) throw new Error('Error al derivar la dirección del activo.');

  const ix = getActualizarValorInstruction({
    owner,
    boveda,
    lote,
    activo,
    idLote,
    serial,
    nuevoValor,
  });
  return enviar(ix, wallet, connection, opciones);
}

/** 5. Liquidar Activo (Cierre condicionado y devolución de renta) */
export async function liquidarActivo(
  wallet: WalletFirma,
  connection: Connection,
  nombreBoveda: string,
  idLote: number,
  serial: string,
  opciones?: OpcionesEnvio
): Promise<string> {
  nombreBoveda = bovedaValida(nombreBoveda);
  idLote = idValido(idLote);
  serial = serialValido(serial);

  const owner = firmante(wallet);
  const { boveda, lote, activo } = cadena(nombreBoveda, owner.address, idLote, serial);
  if (!activo) throw new Error('Error al derivar la dirección del activo.');

  const ix = getLiquidarActivoInstruction({
    owner,
    boveda,
    lote,
    activo,
    idLote,
    serial,
  });
  return enviar(ix, wallet, connection, opciones);
}

/** 6. Cerrar Lote (Baja de lote condicionada a no tener activos huérfanos) */
export async function cerrarLote(
  wallet: WalletFirma,
  connection: Connection,
  nombreBoveda: string,
  idLote: number,
  opciones?: OpcionesEnvio
): Promise<string> {
  nombreBoveda = bovedaValida(nombreBoveda);
  idLote = idValido(idLote);

  const owner = firmante(wallet);
  const boveda = pdaBoveda(nombreBoveda, owner.address);
  const lote = pdaLote(boveda, idLote);

  const ix = getCerrarLoteInstruction({
    owner,
    boveda,
    lote,
    idLote,
  });
  return enviar(ix, wallet, connection, opciones);
}
