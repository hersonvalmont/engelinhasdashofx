const axios = require('axios');

exports.handler = async (event, context) => {
  // CORS headers para permitir que seu site acesse a função
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Resposta para preflight request (navegador)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { dataInicial, dataFinal, page = 1, registrosPorPagina = 100 } = JSON.parse(event.body || '{}');

    // Validação de Auditoria: Verifica se as chaves existem no Netlify
    if (!process.env.OMIE_APP_KEY || !process.env.OMIE_APP_SECRET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Variáveis de ambiente OMIE_APP_KEY ou OMIE_APP_SECRET não configuradas no painel do Netlify.' 
        })
      };
    }

    // MONTAGEM DO REQUEST (Padrão Oficial Omie v1)
    const omieRequest = {
      call: 'ListarContasPagar',
      app_key: process.env.OMIE_APP_KEY,
      app_secret: process.env.OMIE_APP_SECRET,
      param: [{
        pagina: page,
        registros_por_pagina: registrosPorPagina,
        apenas_importado_api: 'N',
        // CORREÇÃO CIRÚRGICA: Tags aceitas pela estrutura lcpListarRequest
        filtrar_por_data_venc_de: dataInicial, 
        filtrar_por_data_venc_ate: dataFinal,
        ordenar_por: 'DATA_VENCIMENTO'
      }]
    };
    
    console.log(`📡 Processando Engelinhas: ${dataInicial} a ${dataFinal}`);

    const response = await axios.post(
      'https://app.omie.com.br/api/v1/financas/contapagar/',
      omieRequest,
      { timeout: 30000 }
    );
    
    // O Omie às vezes retorna erro dentro de um status 200 (faultstring)
    if (response.data.faultstring) {
        throw new Error(response.data.faultstring);
    }

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
    console.error('❌ Erro na Function:', error.message);
    
    return {
      statusCode: 200, // Mantido 200 para que o dashboard mostre o erro amigavelmente
      headers,
      body: JSON.stringify({
        success: false,
        error: error.response?.data?.faultstring || error.message,
        details: error.response?.data || null
      })
    };
  }
};
