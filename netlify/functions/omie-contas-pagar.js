const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { dataInicial, dataFinal, page = 1, registrosPorPagina = 500 } = JSON.parse(event.body || '{}');

    if (!process.env.OMIE_APP_KEY || !process.env.OMIE_APP_SECRET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Variáveis de ambiente não configuradas.' 
        })
      };
    }

    console.log('📡 Buscando página', page, '(ordem decrescente)');

    const omieRequest = {
      call: 'ListarContasPagar',
      app_key: process.env.OMIE_APP_KEY,
      app_secret: process.env.OMIE_APP_SECRET,
      param: [{
        pagina: page,
        registros_por_pagina: registrosPorPagina,
        apenas_importado_api: 'N',
        ordenar_por: 'DATA_VENCIMENTO',
        ordem_descrescente: 'S', // ← MUDANÇA CRÍTICA
        exibir_obs: 'S'
      }]
    };

    const response = await axios.post(
      'https://app.omie.com.br/api/v1/financas/contapagar/',
      omieRequest,
      { timeout: 25000, headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data.faultstring) {
      throw new Error(response.data.faultstring);
    }

    let contas = response.data.conta_pagar_cadastro || [];
    const totalOriginal = contas.length;

    // LOG DAS 3 PRIMEIRAS DATAS PARA VALIDAÇÃO
    if (contas.length > 0) {
      console.log('📅 AMOSTRA (primeiras 3 datas):');
      contas.slice(0, 3).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.data_vencimento} - R$ ${c.valor_documento}`);
      });
    }

    // FILTRAR POR DATA NO BACKEND
    if (dataInicial && dataFinal && contas.length > 0) {
      const [d1, m1, a1] = dataInicial.split('/');
      const [d2, m2, a2] = dataFinal.split('/');
      const dataIni = new Date(a1, m1 - 1, d1);
      const dataFim = new Date(a2, m2 - 1, d2);

      contas = contas.filter(c => {
        if (!c.data_vencimento) return false;
        const [d, m, a] = c.data_vencimento.split('/');
        const dataVenc = new Date(a, m - 1, d);
        return dataVenc >= dataIni && dataVenc <= dataFim;
      });

      console.log(`✅ Filtrado: ${contas.length} de ${totalOriginal} contas (${dataInicial} a ${dataFinal})`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          pagina: response.data.pagina,
          total_de_paginas: response.data.total_de_paginas,
          registros: contas.length,
          total_de_registros: response.data.total_de_registros,
          total_sem_filtro: totalOriginal,
          conta_pagar_cadastro: contas
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Erro:', error.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.response?.data?.faultstring || error.message,
        details: error.response?.data || null
      })
    };
  }
};
