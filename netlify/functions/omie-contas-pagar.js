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
    const { dataInicial, dataFinal, page = 1, registrosPorPagina = 100 } = JSON.parse(event.body || '{}');

    // Validação de Chaves
    if (!process.env.OMIE_APP_KEY || !process.env.OMIE_APP_SECRET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Chaves OMIE não configuradas no Netlify.' })
      };
    }

    // MONTAGEM DO REQUEST (Padrão Rigoroso Omie)
    const omieRequest = {
      call: 'ListarContasPagar',
      app_key: process.env.OMIE_APP_KEY,
      app_secret: process.env.OMIE_APP_SECRET,
      param: [{
        pagina: page,
        registros_por_pagina: registrosPorPagina,
        apenas_importado_api: 'N',
        // AJUSTE DE AUDITORIA: Nomes de campos oficiais da API Omie
        d_venc_de: dataInicial, 
        d_venc_ate: dataFinal,
        ordenar_por: 'DATA_VENCIMENTO'
      }]
    };
    
    console.log(`📡 Solicitando Engelinhas: ${dataInicial} a ${dataFinal}`);

    const response = await axios.post(
      'https://app.omie.com.br/api/v1/financas/contapagar/',
      omieRequest,
      { timeout: 30000 }
    );
    
    // O Omie retorna erro dentro do 200 às vezes, precisamos checar
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
      statusCode: 200, // Retornamos 200 para o dashboard tratar a mensagem amigavelmente
      headers,
      body: JSON.stringify({
        success: false,
        error: error.response?.data?.faultstring || error.message
      })
    };
  }
};
