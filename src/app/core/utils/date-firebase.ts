/**
 * Interface para o Timestamp do Firebase
 */
export interface FirebaseTimestamp {
  toDate: () => Date;
  seconds: number;
  nanoseconds: number;
}

/**
 * Converter para um objeto Date padrão
 * @param data Timestamp do Firebase ou Date
 * @returns Objeto Date
 */
export function converterTimestampParaDate(
  data: Date | FirebaseTimestamp | any
): Date {
  if (data instanceof Date) {
    return data;
  }

  if (
    data &&
    typeof data === 'object' &&
    'toDate' in data &&
    typeof data.toDate === 'function'
  ) {
    return data.toDate();
  }

  if (data && typeof data === 'object' && 'seconds' in data) {
    return new Date(data.seconds * 1000);
  }

  return new Date(data);
}

/**
 * Formatar uma data (dd/mm/aaaa)
 * @param data Timestamp do Firebase ou Date
 * @returns String formatada no padrão brasileiro
 */
export function formatarData(data: Date | FirebaseTimestamp | any): string {
  const dataConvertida = converterTimestampParaDate(data);
  return dataConvertida.toLocaleDateString('pt-BR');
}

/**
 * Comparar duas datas para ordenação
 * @param dataA Primeira data
 * @param dataB Segunda data
 * @param ordem 'asc' para ordem crescente, 'desc' para ordem decrescente
 * @returns Número negativo se dataA < dataB, positivo se dataA > dataB, zero se iguais
 */
export function compararDatas(
  dataA: Date | FirebaseTimestamp | any,
  dataB: Date | FirebaseTimestamp | any,
  ordem: 'asc' | 'desc' = 'desc'
): number {
  const dateA = converterTimestampParaDate(dataA);
  const dateB = converterTimestampParaDate(dataB);

  return ordem === 'asc'
    ? dateA.getTime() - dateB.getTime()
    : dateB.getTime() - dateA.getTime();
}
