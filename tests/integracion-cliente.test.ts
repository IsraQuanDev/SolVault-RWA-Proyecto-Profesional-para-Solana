import '../src/polyfills';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PublicKey } from '@solana/web3.js';
import type { Connection } from '@solana/web3.js';
import { address, createNoopSigner } from '@solana/kit';
import {
  getRegistrarActivoInstruction,
  getRegistrarActivoInstructionDataDecoder,
  getActualizarValorInstruction,
  BOVEDA_PROGRAM_ADDRESS,
} from '../clients/js/src/generated';
import { pdaBoveda, pdaLote, pdaActivo } from '../src/solana/pdas';
import { s } from '../src/solana/seeds';
import { aWeb3, confirmarEnvio, ErrorTransaccion, ErrorConfirmacionPendiente, traducir } from '../src/solana/tx';
import { comprobarDevnet, DEVNET_GENESIS } from '../src/solana/seguridad';
import {
  bovedaValida,
  categoriaValida,
  serialValido,
  descripcionValida,
  idValido,
  valorEstimadoValido,
} from '../src/solana/validaciones';
import idl from '../idl.json';
import { validarIdl, prepararIdl, REFERENCIA_ID } from '../scripts/contrato-idl.mjs';

// Dirección pública fija para pruebas deterministas
const owner = address(new PublicKey(new Uint8Array(32).fill(7)).toBase58());

test('1. Semillas u16 conservan dos bytes little-endian y sus límites', () => {
  assert.deepEqual([...s.u16(256)], [0, 1]);
  assert.deepEqual([...s.u16(65_535)], [255, 255]);
  assert.throws(() => s.u16(65_536));
  assert.throws(() => s.u16(1.5));
});

test('2. Boveda, Lote y Activo coinciden exactamente con las semillas del Rust de SolVault RWA', () => {
  const programa = new PublicKey(BOVEDA_PROGRAM_ADDRESS);
  const [boveda] = PublicKey.findProgramAddressSync(
    [Buffer.from('boveda'), Buffer.from('Boveda Central RWA 1'), new PublicKey(owner).toBuffer()],
    programa
  );
  const id = Buffer.alloc(2);
  id.writeUInt16LE(1);
  const [lote] = PublicKey.findProgramAddressSync(
    [Buffer.from('lote'), boveda.toBuffer(), id],
    programa
  );
  const [activo] = PublicKey.findProgramAddressSync(
    [Buffer.from('activo'), lote.toBuffer(), Buffer.from('AU001')],
    programa
  );

  assert.equal(pdaBoveda('Boveda Central RWA 1', owner), boveda.toBase58());
  assert.equal(pdaLote(address(boveda.toBase58()), 1), lote.toBase58());
  assert.equal(pdaActivo(address(lote.toBase58()), 'AU001'), activo.toBase58());
});

test('3. Codama serializa la instrucción de activo y conserva roles de cuenta', () => {
  const boveda = pdaBoveda('Boveda Central RWA 1', owner);
  const lote = pdaLote(boveda, 1);
  const activo = pdaActivo(lote, 'AU001');

  const ix = getRegistrarActivoInstruction({
    owner: createNoopSigner(owner),
    boveda,
    lote,
    activo,
    idLote: 1,
    serial: 'AU001',
    descripcion: 'Lingote de oro 100g 999.9',
    valorEstimado: 8500,
  });

  const discriminadorEsperado = createHash('sha256')
    .update('global:registrar_activo')
    .digest()
    .subarray(0, 8);
  assert.deepEqual(Buffer.from(ix.data.subarray(0, 8)), discriminadorEsperado);
  assert.equal(getRegistrarActivoInstructionDataDecoder().decode(ix.data).valorEstimado, 8500);

  const convertida = aWeb3(ix);
  assert.equal(convertida.programId.toBase58(), BOVEDA_PROGRAM_ADDRESS);
  assert.deepEqual(convertida.data, Buffer.from(ix.data));
  assert.deepEqual(
    convertida.keys.map((c) => [c.isSigner, c.isWritable]),
    [
      [true, true],   // owner (firma y paga renta init)
      [false, false], // boveda (lectura)
      [false, true],  // lote (mut: agrega activo y suma contador)
      [false, true],  // activo (mut: init)
      [false, false], // systemProgram
    ]
  );
});

test('4. Una confirmación con error nunca produce un resultado de éxito', async () => {
  const estrategia = { signature: 'firma-de-prueba', blockhash: 'blockhash-de-prueba', lastValidBlockHeight: 123 };
  const connection = {
    confirmTransaction: async () => ({
      context: { slot: 1 },
      value: { err: { InstructionError: [0, { Custom: 6000 }] } },
    }),
  } as unknown as Pick<Connection, 'confirmTransaction'>;

  await assert.rejects(
    confirmarEnvio(connection, estrategia),
    (error: unknown) => error instanceof ErrorTransaccion && error.firma === estrategia.signature
  );
});

test('5. Se exige el génesis completo de Devnet para escribir', async () => {
  await comprobarDevnet({ getGenesisHash: async () => DEVNET_GENESIS });
  await assert.rejects(
    comprobarDevnet({ getGenesisHash: async () => '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d' }),
    /solo permite operar en Devnet/
  );
});

test('6. Validaciones de UI comprueban bytes UTF-8 y números enteros en rango', () => {
  assert.equal(serialValido('AU001'), 'AU001');
  assert.throws(() => serialValido('AU0001X')); // Más de 5 bytes
  assert.equal(categoriaValida(' Oro fino '), 'Oro fino');
  assert.equal(bovedaValida('Boveda Central'), 'Boveda Central');
  assert.equal(valorEstimadoValido(8500), 8500);
  assert.throws(() => valorEstimadoValido(0));
  assert.throws(() => valorEstimadoValido(4_294_967_296));
  assert.throws(() => idValido(65_536));
});

test('7. Los errores traducen cancelaciones, autorizaciones, reglas y RPC', () => {
  assert.match(traducir(new Error('User rejected the request')), /cancelada/);
  assert.match(traducir(new Error('custom program error: 0x1770')), /NoOwner/);
  assert.match(traducir(new Error('custom program error: 0x1771')), /NoExisteActivo/);
  assert.match(traducir(new Error('custom program error: 0x1773')), /LoteTieneActivos/);
  assert.match(traducir(new Error('custom program error: 0x7d6')), /ConstraintSeeds/);
  assert.match(traducir(new Error('429 Too Many Requests')), /RPC/);
});

test('8. Se valida el contrato IDL para SolVault RWA', () => {
  const copia = structuredClone(idl);
  if ('address' in copia) delete (copia as unknown as Record<string, unknown>).address;
  copia.metadata = { ...copia.metadata, address: REFERENCIA_ID };
  assert.equal(validarIdl(copia).esReferencia, true);
  const normalizada = prepararIdl(copia, REFERENCIA_ID);
  assert.equal(normalizada.instructions.length, 6);
});
