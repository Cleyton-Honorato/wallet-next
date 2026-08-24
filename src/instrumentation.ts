/**
 * Roda uma única vez quando o servidor sobe, antes de atender qualquer request.
 *
 * A Vercel reserva a variável de ambiente TZ e executa as funções em UTC, mas
 * a lógica de vencimento (isPastDue/isMonthPast, em server/services/dashboard)
 * compara datas montadas com o relógio local do processo. Sem isto, a partir
 * das 21h de Brasília o servidor já estaria no dia seguinte e as contas
 * apareceriam vencidas cedo demais.
 *
 * Fixar o fuso aqui mantém o comportamento do Brasil em qualquer host — o Node
 * limpa o cache de timezone quando `process.env.TZ` é atribuído.
 */
export function register() {
  // O Next chama `register` em todos os runtimes; só o Node tem tzdata.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  process.env.TZ = process.env.APP_TZ ?? 'America/Sao_Paulo';
}
