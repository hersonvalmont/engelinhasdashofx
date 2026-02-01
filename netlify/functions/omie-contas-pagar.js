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

    // Validar formato de datas (DD/MM/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(dataInicial) || !dateRegex.test(dataFinal)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Formato de data inválido. Recebido: ${dataInicial} e ${dataFinal}. Esperado: DD/MM/YYYY`
        })
      };
    }

    // MONTAGEM DO REQUEST (Estrutura oficial Omie - lcpListarRequest)
    const omieRequest = {
      call: 'ListarContasPagar',
      app_key: process.env.OMIE_APP_KEY,
      app_secret: process.env.OMIE_APP_SECRET,
      param: [{
        pagina: page,
        registros_por_pagina: registrosPorPagina,
        apenas_importado_api: 'N',
        // CORREÇÃO: Tags corretas aceitas pela API
        filtrar_apenas_por_data_de: 'VENCIMENTO',
        filtrar_por_data_de: dataInicial, 
        filtrar_por_data_ate: dataFinal,
        ordenar_por: 'DATA_VENCIMENTO'
      }]
    };
    
    console.log('📡 Processando Engelinhas:', dataInicial, 'a', dataFinal);
    console.log('📤 Payload enviado:', JSON.stringify(omieRequest, null, 2));

    const response = await axios.post(
      'https://app.omie.com.br/api/v1/financas/contapagar/',
      omieRequest,
      { timeout: 30000 }
    );
    
    console.log('📥 Resposta Omie:', JSON.stringify(response.data, null, 2));

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
    console.error('Stack:', error.stack);
    
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
