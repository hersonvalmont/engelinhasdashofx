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
    const { dataInicial, dataFinal } = JSON.parse(event.body || '{}');

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

    console.log('📡 TESTE: Buscando SEM filtro de data');

    const omieRequest = {
      call: 'ListarContasPagar',
      app_key: process.env.OMIE_APP_KEY,
      app_secret: process.env.OMIE_APP_SECRET,
      param: [{
        pagina: 1,
        registros_por_pagina: 50, // REDUZIDO para análise
        apenas_importado_api: 'N',
        ordenar_por: 'DATA_VENCIMENTO',
        ordem_descrescente: 'S', // MUDADO: buscar mais recentes primeiro
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

    const contas = response.data.conta_pagar_cadastro || [];

    // LOG DAS PRIMEIRAS 5 DATAS
    console.log('📅 AMOSTRA DE DATAS (primeiras 5):');
    contas.slice(0, 5).forEach((c, i) => {
      console.log(`  ${i + 1}. Vencimento: ${c.data_vencimento} | Emissão: ${c.data_emissao} | Valor: ${c.valor_documento}`);
    });

    console.log(`📊 Total retornado: ${contas.length} de ${response.data.total_de_registros}`);
    console.log(`📄 Total de páginas: ${response.data.total_de_paginas}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          registros: contas.length,
          total_de_registros: response.data.total_de_registros,
          total_de_paginas: response.data.total_de_paginas,
          amostra_datas: contas.slice(0, 5).map(c => ({
            vencimento: c.data_vencimento,
            emissao: c.data_emissao,
            valor: c.valor_documento
          })),
          conta_pagar_cadastro: contas
        }
      })
    };

  } catch (error) {
    console.error('❌ Erro:', error.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
