export function texto(valor: string, etiqueta: string, maxBytes: number): string {
  const limpio = valor.trim();
  if (!limpio) throw new Error(etiqueta + ' es obligatorio.');
  if (new TextEncoder().encode(limpio).length > maxBytes) {
    throw new Error(etiqueta + ' admite hasta ' + maxBytes + ' bytes UTF-8.');
  }
  return limpio;
}

export function entero(valor: number, etiqueta: string, maximo: number): number {
  if (!Number.isSafeInteger(valor) || valor < 1 || valor > maximo) {
    throw new Error(etiqueta + ' debe ser un entero entre 1 y ' + maximo + '.');
  }
  return valor;
}

export const bovedaValida = (valor: string) => texto(valor, 'El nombre de la bóveda', 30);
export const categoriaValida = (valor: string) => texto(valor, 'La categoría del lote', 30);
export const serialValido = (valor: string) => texto(valor, 'El serial del activo', 5);
export const descripcionValida = (valor: string) => texto(valor, 'La descripción del activo', 50);
export const idValido = (valor: number) => entero(valor, 'El identificador del lote', 65_535);
export const valorEstimadoValido = (valor: number) => entero(valor, 'El valor estimado', 4_294_967_295);
