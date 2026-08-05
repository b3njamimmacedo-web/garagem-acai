/* =============================================================================
   CONFIGURAÇÃO — o único arquivo que você precisa editar para colocar no ar.

   Enquanto API_URL estiver vazia, o site roda em MODO DEMONSTRAÇÃO:
   o checkout simula a compra e a área de membros abre com o código
   MEAD-DEMO-2026-REIS. Serve para testar tudo antes de publicar de verdade.
============================================================================= */

export const CONFIG = {
  /* ---------------------------------------------------------------- BACKEND */
  // URL do Cloudflare Worker publicado. Ex.: 'https://api.hidromeldereis.com.br'
  // Vazio = modo demonstração.
  API_URL: '',

  /* ------------------------------------------------------------- CHECKOUT */
  // 'proprio'  = Pix/cartão direto pelo Mercado Pago, via seu Worker (menor taxa)
  // 'externo'  = manda para link de Kirvano/Cakto/Hotmart (mais simples, taxa maior)
  MODO_CHECKOUT: 'proprio',

  // Só usados quando MODO_CHECKOUT === 'externo'.
  LINKS_EXTERNOS: {
    iniciado: '',
    mestre: '',
    real: '',
  },

  /* ---------------------------------------------------------------- MARCA */
  MARCA: 'Hidromel de Reis',
  SITE: 'https://hidromeldereis.com.br',
  EMAIL_SUPORTE: 'contato@hidromeldereis.com.br',
  WHATSAPP_SUPORTE: '', // só dígitos, com DDI. Ex.: '5511999999999'

  /* ------------------------------------------------------------- PRODUTOS */
  ORDER_BUMP: {
    id: 'rotulos',
    nome: 'Pack de 30 Rótulos Editáveis',
    preco: 27,
    precoDe: 197,
  },

  /* --------------------------------------------------------------- OFERTA */
  // Fim da oferta de lançamento. Formato ISO com fuso.
  // Quando a data passa, o contador some sozinho — ele NÃO reinicia.
  // Contador falso que reseta a cada visita destrói confiança e é
  // publicidade enganosa. Ver docs/JURIDICO.md §4.
  OFERTA_FIM: '2026-09-15T23:59:59-03:00',

  // Vagas da turma. Mantenha honesto: atualize conforme vende de verdade.
  VAGAS_TOTAL: 300,
  VAGAS_RESTANTES: 217,

  /* ------------------------------------------------------ RASTREAMENTO */
  // Deixe vazio para não carregar nada (e não precisar de banner de cookies).
  META_PIXEL: '',
  GA4_ID: '',

  /* ---------------------------------------------------------------- VÍDEO */
  // Provedor padrão das aulas: 'yt' | 'vimeo' | 'panda' | 'bunny'
  // Para conteúdo pago, 'panda' ou 'vimeo' (com domínio travado) protegem de verdade.
  VIDEO_PROVEDOR_PADRAO: 'yt',
  // ID do vídeo de vendas (VSL) exibido no topo. Vazio = mostra o pôster.
  VSL_ID: '',
  // Biblioteca Bunny/Panda, quando aplicável.
  VIDEO_BIBLIOTECA: '',
};

/** true quando não há backend configurado — o site inteiro cai no modo demo. */
export const MODO_DEMO = !CONFIG.API_URL;
export const CODIGO_DEMO = 'MEAD-DEMO-2026-REIS';
