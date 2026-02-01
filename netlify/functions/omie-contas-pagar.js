const axios = require('axios');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔍 Iniciando busca de contas a pagar...');
    
    // Verificar variáveis de ambiente
    if (!process.env.OMIE_APP_KEY || !process.env.OMIE_APP_SECRET) {
      console.error('❌ Variáveis de ambiente não configuradas!');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Variáveis de ambiente OMIE_APP_KEY e OMIE_APP_SECRET não configuradas no Netlify'
        })
      };
    }
    
    const { dataInicial, dataFinal, page = 1, registrosPorPagina = 100 } = JSON.parse(event.body || '{}');
    
    console.log('📅 Período:', dataInicial, 'até', dataFinal);
    console.log('📄 Página:', page, 'Registros:', registrosPorPagina);

    const omieRequest = {
      call: 'ListarContasPagar',
      app_key: process.env.OMIE_APP_KEY,
      app_secret: process.env.OMIE_APP_SECRET,
      param: [{
        pagina: page,
        registros_por_pagina: registrosPorPagina,
        apenas_importado_api: 'N',
        filtrar_por_data_de: dataInicial,
        filtrar_por_data_ate: dataFinal,
        ordenar_por: 'DATA_VENCIMENTO'
      }]
    };
    
    console.log('📤 Enviando requisição para Omie...');

    const response = await axios.post(
      'https://app.omie.com.br/api/v1/financas/contapagar/',
      omieRequest,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Resposta recebida da Omie');
    console.log('📊 Total de registros:', response.data.conta_pagar_lista?.length || 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Erro ao buscar contas a pagar:', error.message);
    console.error('❌ Stack:', error.stack);
    
    if (error.response) {
      console.error('❌ Status da resposta Omie:', error.response.status);
      console.error('❌ Dados da resposta Omie:', error.response.data);
    }
    
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: error.response?.data || null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
