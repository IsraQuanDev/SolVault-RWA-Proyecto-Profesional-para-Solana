import type { Address } from "@solana/kit";

import {
  fetchAllLote,
  fetchAllActivo,
  fetchMaybeBoveda,
} from "../../clients/js/src/generated";
import { rpc } from "./conexion";
import { pdaBoveda } from "./pdas";

/*
LECTURAS — Estado onchain de SolVault RWA

Leer no requiere wallet ni firma de transacción: utiliza el endpoint RPC público.
fetchMaybeBoveda devuelve { exists: boolean, data: ... }, permitiendo comprobar
si la bóveda ya fue desplegada e inicializada onchain.
*/

export type ActivoUI = {
  direccion: Address;
  serial: string;
  descripcion: string;
  valorEstimado: number;
};

export type LoteUI = {
  direccion: Address;
  idLote: number;
  categoria: string;
  totalActivos: number;
  activos: ActivoUI[];
};

export type BovedaUI = {
  direccion: Address;
  nombreBoveda: string;
  idCounter: number;
  lotes: LoteUI[];
};

export async function leerBoveda(
  nombreBoveda: string,
  owner: Address
): Promise<BovedaUI | null> {
  const direccion = pdaBoveda(nombreBoveda, owner);
  const cuenta = await fetchMaybeBoveda(rpc, direccion);

  if (!cuenta.exists) return null;

  const lotes = await fetchAllLote(rpc, cuenta.data.lotes);

  const conActivos = await Promise.all(
    lotes.map(async (l) => {
      const activos = await fetchAllActivo(rpc, l.data.activos);
      return {
        direccion: l.address,
        idLote: l.data.idLote,
        categoria: l.data.categoria,
        totalActivos: l.data.totalActivos,
        activos: activos.map((a) => ({
          direccion: a.address,
          serial: a.data.serial,
          descripcion: a.data.descripcion,
          valorEstimado: a.data.valorEstimado,
        })),
      };
    })
  );

  return {
    direccion,
    nombreBoveda: cuenta.data.nombreBoveda,
    idCounter: cuenta.data.idCounter,
    lotes: conActivos,
  };
}

/*
Calcula el siguiente id de lote disponible a partir del contador de la bóveda.
Necesario para derivar la PDA del lote ANTES de enviar la transacción.
*/
export async function siguienteId(
  nombreBoveda: string,
  owner: Address
): Promise<number> {
  const cuenta = await fetchMaybeBoveda(rpc, pdaBoveda(nombreBoveda, owner));
  if (!cuenta.exists) throw new Error("Esa bóveda no existe todavía.");
  if (cuenta.data.lotes.length >= 10) throw new Error("La bóveda alcanzó el límite de 10 lotes previstos.");
  if (cuenta.data.idCounter >= 65_535) throw new Error("Se agotaron los identificadores u16 de la bóveda.");
  return cuenta.data.idCounter + 1;
}
