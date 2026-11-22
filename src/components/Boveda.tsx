import { useEffect, useRef, useState } from 'react';
import { address } from '@solana/kit';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import programa from '../config/programa.json';
import { NEGOCIO_INICIAL, UNIDAD_MONTO } from '../config/interfaz';
import { leerBoveda, type BovedaUI } from '../solana/lecturas';
import { bovedaValida } from '../solana/validaciones';
import {
  ErrorTransaccion,
  ErrorConfirmacionPendiente,
  enlaceTransaccion,
  traducir,
  type OpcionesEnvio,
} from '../solana/tx';
import {
  crearBoveda,
  crearLote,
  registrarActivo,
  actualizarValor,
  liquidarActivo,
  cerrarLote,
} from '../solana/acciones';

type Operacion = 'boveda' | 'lote' | 'activo' | 'valor' | 'liquidar' | 'cerrarLote';

const operaciones: { id: Operacion; texto: string }[] = [
  { id: 'boveda', texto: 'Crear bóveda' },
  { id: 'lote', texto: 'Crear lote' },
  { id: 'activo', texto: 'Registrar activo' },
  { id: 'valor', texto: 'Actualizar valor' },
  { id: 'liquidar', texto: 'Liquidar activo' },
  { id: 'cerrarLote', texto: 'Cerrar lote' },
];

export function Boveda({
  onCambio,
  onOcupado,
}: {
  onCambio: () => void;
  onOcupado: (valor: boolean) => void;
}) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const walletDireccion = wallet.publicKey?.toBase58() ?? '';

  const [nombreBoveda, setNombreBoveda] = useState(NEGOCIO_INICIAL);
  const [autoridad, setAutoridad] = useState(walletDireccion);
  const [boveda, setBoveda] = useState<BovedaUI | null>(null);
  const [consultado, setConsultado] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [errorLectura, setErrorLectura] = useState('');

  const [op, setOp] = useState<Operacion>('boveda');
  const [categoria, setCategoria] = useState('Oro de inversion');
  const [idLote, setIdLote] = useState('1');
  const [serial, setSerial] = useState('AU001');
  const [descripcion, setDescripcion] = useState('Lingote de oro 100g 999.9');
  const [valorEstimado, setValorEstimado] = useState('8500');

  const [ocupado, setOcupado] = useState(false);
  const [fase, setFase] = useState('');
  const [firma, setFirma] = useState('');
  const [firmaFallida, setFirmaFallida] = useState('');
  const [errorOperacion, setErrorOperacion] = useState('');
  const [aviso, setAviso] = useState('');

  const contexto = useRef('');
  const secuencia = useRef(0);
  contexto.current = nombreBoveda + '|' + autoridad;

  useEffect(() => {
    setAutoridad(walletDireccion);
  }, [walletDireccion]);

  useEffect(() => {
    secuencia.current += 1;
    setBoveda(null);
    setConsultado(false);
    setErrorLectura('');
    setLeyendo(false);
    setFirma('');
    setFirmaFallida('');
    setErrorOperacion('');
    setAviso('');
  }, [nombreBoveda, autoridad]);

  useEffect(() => {
    onOcupado(ocupado);
    return () => onOcupado(false);
  }, [ocupado, onOcupado]);

  async function cargar(nombre = nombreBoveda, owner = autoridad) {
    const clave = nombre + '|' + owner;
    const turno = ++secuencia.current;
    setLeyendo(true);
    setErrorLectura('');
    try {
      const datos = await leerBoveda(bovedaValida(nombre), address(owner.trim()));
      if (turno === secuencia.current && contexto.current === clave) {
        setBoveda(datos);
        setConsultado(true);
      }
    } catch (error) {
      if (turno === secuencia.current) setErrorLectura(traducir(error));
      throw error;
    } finally {
      if (turno === secuencia.current) setLeyendo(false);
    }
  }

  async function ejecutar(evento: React.FormEvent) {
    evento.preventDefault();
    setOcupado(true);
    setFase('Preparando operación…');
    setFirma('');
    setFirmaFallida('');
    setErrorOperacion('');
    setAviso('');

    const nombre = nombreBoveda.trim();
    const direccionWallet = walletDireccion;
    const opciones: OpcionesEnvio = {
      onEstado: (estado) =>
        setFase(
          estado === 'firma'
            ? 'Revisa la solicitud en tu wallet…'
            : 'Esperando confirmación de Solana Devnet…'
        ),
    };

    try {
      const id = Number(idLote);
      const valor = Number(valorEstimado);
      let resultado: string;

      switch (op) {
        case 'boveda':
          resultado = await crearBoveda(wallet, connection, nombre, opciones);
          break;
        case 'lote':
          resultado = await crearLote(wallet, connection, nombre, categoria, opciones);
          break;
        case 'activo':
          resultado = await registrarActivo(
            wallet,
            connection,
            nombre,
            id,
            serial,
            descripcion,
            valor,
            opciones
          );
          break;
        case 'valor':
          resultado = await actualizarValor(
            wallet,
            connection,
            nombre,
            id,
            serial,
            valor,
            opciones
          );
          break;
        case 'liquidar':
          resultado = await liquidarActivo(
            wallet,
            connection,
            nombre,
            id,
            serial,
            opciones
          );
          break;
        case 'cerrarLote':
          resultado = await cerrarLote(
            wallet,
            connection,
            nombre,
            id,
            opciones
          );
          break;
      }

      setFirma(resultado);
      setFase('Operación confirmada correctamente.');
      onCambio();

      try {
        await cargar(nombre, direccionWallet);
      } catch {
        setAviso(
          'La operación se confirmó, pero no pudimos actualizar los datos de inmediato. Pulsa Consultar bóveda.'
        );
      }
    } catch (error) {
      setFase('');
      setErrorOperacion(traducir(error));
      if (
        error instanceof ErrorTransaccion ||
        error instanceof ErrorConfirmacionPendiente
      ) {
        setFirmaFallida(error.firma);
      }
    } finally {
      setOcupado(false);
    }
  }

  const esOtraAutoridad = !!autoridad.trim() && autoridad.trim() !== walletDireccion;
  const permiteEscribir = !programa.esReferencia && !!wallet.publicKey && !esOtraAutoridad;

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">BÓVEDA · LOTES · ACTIVOS RWA</p>
          <h2>Custodia y Tokenización RWA</h2>
        </div>
        <span className="tag">Solana PDAs</span>
      </div>

      {programa.esReferencia && (
        <aside className="notice information">
          <strong>Configura tu programa para comenzar.</strong>
          <p>
            La aplicación incluye un IDL de referencia. Para operar, despliega tu programa en
            Solana Playground (Devnet) e importa su IDL con <code>npm run configurar:idl</code>.
          </p>
        </aside>
      )}

      <section className="panel lookup-panel">
        <div className="panel-heading">
          <h3>Localizar bóveda</h3>
          <span className="small-note">Lectura pública sin firma</span>
        </div>
        <div className="lookup-fields">
          <label>
            Nombre exacto de la bóveda
            <input
              value={nombreBoveda}
              disabled={ocupado}
              onChange={(e) => setNombreBoveda(e.target.value)}
              placeholder="Boveda Central RWA 1"
            />
          </label>
          <label>
            Dirección de la autoridad (owner)
            <input
              value={autoridad}
              disabled={ocupado}
              onChange={(e) => setAutoridad(e.target.value)}
              placeholder="Conecta tu wallet o pega una dirección pública"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <button
            className="button secondary"
            disabled={
              leyendo ||
              ocupado ||
              programa.esReferencia ||
              !nombreBoveda.trim() ||
              !autoridad.trim()
            }
            onClick={() => void cargar().catch(() => {})}
          >
            {leyendo ? 'Consultando…' : 'Consultar bóveda'}
          </button>
        </div>
        <p className="help">
          El nombre y la autoridad determinan la PDA de la bóveda. Puedes consultar cualquier
          dirección en modo lectura.
        </p>
        {errorLectura && (
          <p className="notice error" role="alert">
            {errorLectura}
          </p>
        )}
      </section>

      <div className="workspace-grid">
        <section className="panel customers-panel">
          <div className="panel-heading">
            <h3>Lotes y activos custodiados</h3>
            {boveda && <span className="count">{boveda.lotes.length} lotes</span>}
          </div>

          {!boveda ? (
            <div className="empty-state">
              <span className="empty-symbol">◎</span>
              <h4>{consultado ? 'La bóveda todavía no existe' : 'La bóveda aparecerá aquí'}</h4>
              <p>
                {consultado
                  ? 'Comprueba el nombre y la autoridad, o crea la bóveda con tu wallet conectada.'
                  : 'Consulta la bóveda para ver sus lotes y los activos físicos custodiados.'}
              </p>
            </div>
          ) : (
            <>
              <div className="registry-summary">
                <div>
                  <span className="label">Bóveda</span>
                  <strong>{boveda.nombreBoveda}</strong>
                </div>
                <div>
                  <span className="label">Último Lote ID</span>
                  <strong>#{boveda.idCounter}</strong>
                </div>
              </div>
              <details className="technical-details">
                <summary>Dirección PDA de la bóveda</summary>
                <code className="address">{boveda.direccion}</code>
              </details>

              {boveda.lotes.length === 0 ? (
                <p className="empty-line">
                  Todavía no hay lotes de custodia. Crea el primero desde Operaciones.
                </p>
              ) : (
                boveda.lotes.map((lote) => (
                  <article className="customer" key={lote.direccion}>
                    <header>
                      <div>
                        <strong>{lote.categoria}</strong>
                        <span className="small-note">
                          Lote #{lote.idLote} · {lote.totalActivos} activos custodiados
                        </span>
                      </div>
                      <div>
                        <button
                          className="text-button"
                          disabled={ocupado}
                          onClick={() => {
                            setIdLote(String(lote.idLote));
                            setOp('activo');
                          }}
                        >
                          + Activo
                        </button>
                        {lote.activos.length === 0 && (
                          <button
                            className="text-button"
                            style={{ marginLeft: '8px', color: '#e57373' }}
                            disabled={ocupado}
                            onClick={() => {
                              setIdLote(String(lote.idLote));
                              setOp('cerrarLote');
                            }}
                          >
                            Cerrar lote
                          </button>
                        )}
                      </div>
                    </header>
                    {lote.activos.length === 0 ? (
                      <p className="empty-line">
                        Sin activos en este lote (listo para cerrar si se desea).
                      </p>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Serial</th>
                              <th>Descripción</th>
                              <th className="numeric">Valor Tasado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lote.activos.map((act) => (
                              <tr
                                key={act.direccion}
                                onClick={() => {
                                  if (!ocupado) {
                                    setIdLote(String(lote.idLote));
                                    setSerial(act.serial);
                                    setValorEstimado(String(act.valorEstimado));
                                    setOp('valor');
                                  }
                                }}
                              >
                                <td>
                                  <code>{act.serial}</code>
                                </td>
                                <td>{act.descripcion}</td>
                                <td className="numeric">
                                  ${act.valorEstimado.toLocaleString('es-MX')}{' '}
                                  <small>{UNIDAD_MONTO}</small>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                ))
              )}
            </>
          )}
        </section>

        <section className="panel operations-panel">
          <div className="panel-heading">
            <h3>Operaciones</h3>
            <span className="small-note">Con firma de wallet</span>
          </div>

          <div className="operation-tabs">
            {operaciones.map((item) => (
              <button
                key={item.id}
                className={op === item.id ? 'active' : ''}
                disabled={ocupado}
                onClick={() => {
                  setOp(item.id);
                  setFirma('');
                  setErrorOperacion('');
                  setFirmaFallida('');
                  setFase('');
                }}
              >
                {item.texto}
              </button>
            ))}
          </div>

          <form onSubmit={ejecutar}>
            <fieldset disabled={ocupado || !permiteEscribir}>
              {op === 'boveda' && (
                <p className="help">
                  Crearás la bóveda de custodia <strong>{nombreBoveda || 'tu bóveda'}</strong>{' '}
                  con la wallet conectada como autoridad única.
                </p>
              )}

              {op === 'lote' && (
                <label>
                  Categoría o tipo de activo del lote
                  <input
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ej. Oro de inversión, Arte RWA"
                    required
                  />
                </label>
              )}

              {(op === 'activo' || op === 'valor' || op === 'liquidar' || op === 'cerrarLote') && (
                <label>
                  ID del lote
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    step="1"
                    value={idLote}
                    onChange={(e) => setIdLote(e.target.value)}
                    required
                  />
                </label>
              )}

              {(op === 'activo' || op === 'valor' || op === 'liquidar') && (
                <label>
                  Serial del activo (máx 5 caracteres)
                  <input
                    value={serial}
                    maxLength={5}
                    onChange={(e) => setSerial(e.target.value.toUpperCase())}
                    placeholder="Ej. AU001"
                    required
                  />
                </label>
              )}

              {op === 'activo' && (
                <label>
                  Descripción física / Especificaciones
                  <input
                    value={descripcion}
                    maxLength={50}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej. Lingote de oro 100g 999.9"
                    required
                  />
                </label>
              )}

              {(op === 'activo' || op === 'valor') && (
                <label>
                  {op === 'valor' ? 'Nuevo valor estimado (USD)' : 'Valor estimado (USD)'}
                  <input
                    type="number"
                    min="1"
                    max="4294967295"
                    step="1"
                    value={valorEstimado}
                    onChange={(e) => setValorEstimado(e.target.value)}
                    required
                  />
                  <span className="help">
                    Valor numérico tasado en USD. Queda registrado inmutablemente en Solana.
                  </span>
                </label>
              )}

              {op === 'liquidar' && (
                <p className="notice subtle">
                  Esta operación da de baja el activo, lo retira del lote y cierra la cuenta{' '}
                  (<code>close = owner</code>), reembolsando la renta en SOL a tu wallet.
                </p>
              )}

              {op === 'cerrarLote' && (
                <p className="notice subtle">
                  <strong>Baja del día 5:</strong> Solo se puede cerrar un lote si{' '}
                  <strong>no tiene activos custodiados activos</strong>. La renta de la cuenta del
                  lote se reembolsará al owner.
                </p>
              )}

              <button
                className="button primary"
                type="submit"
                disabled={!nombreBoveda.trim()}
              >
                {ocupado
                  ? 'Operación en curso…'
                  : operaciones.find((item) => item.id === op)!.texto}
              </button>
            </fieldset>
          </form>

          {!wallet.publicKey && (
            <p className="help">Conecta tu wallet de Phantom / Solflare para operar.</p>
          )}

          {esOtraAutoridad && wallet.publicKey && (
            <p className="notice subtle">
              Estás consultando otra autoridad. Para escribir transacciones, debes ser el owner.
            </p>
          )}

          {ocupado && (
            <p className="notice information" role="status">
              {fase}
            </p>
          )}

          {firma && (
            <p className="notice success" role="status">
              <strong>Operación confirmada en Solana Devnet.</strong>
              <br />
              <a href={enlaceTransaccion(firma)} target="_blank" rel="noreferrer">
                Ver transacción en Solana Explorer
              </a>
            </p>
          )}

          {errorOperacion && (
            <p className="notice error" role="alert">
              {errorOperacion}
              {firmaFallida && (
                <>
                  <br />
                  <a href={enlaceTransaccion(firmaFallida)} target="_blank" rel="noreferrer">
                    Revisar transacción fallida en Explorer
                  </a>
                </>
              )}
            </p>
          )}

          {aviso && <p className="notice subtle">{aviso}</p>}
        </section>
      </div>
    </>
  );
}
