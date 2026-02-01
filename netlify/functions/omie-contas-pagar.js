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
          error: 'Variáveis de ambiente não configuradas no Netlify.' 
        })
      };
    }

    // Estrutura oficial conforme documentação Omie
    const omieRequest = {
      call: 'ListarContasPagar',
      app_key: process.env.OMIE_APP_KEY,
      app_secret: process.env.OMIE_APP_SECRET,
      param: [{
        pagina: page,
        registros_por_pagina: registrosPorPagina,
        apenas_importado_api: 'N',
        ordenar_por: 'DATA_VENCIMENTO',
        ordem_descrescente: 'N',
        exibir_obs: 'S'
      }]
    };
    
    console.log('📡 REQUEST ENVIADO:', JSON.stringify(omieRequest, null, 2));

    const response = await axios.post(
      'https://app.omie.com.br/api/v1/financas/contapagar/',
      omieRequest,
      { 
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // DEBUG CRÍTICO
    console.log('📥 RESPOSTA COMPLETA OMIE:', JSON.stringify(response.data, null, 2));
    console.log('📊 Total de registros retornados:', response.data.total_de_registros);
    console.log('📦 Contas retornadas:', response.data.conta_pagar_cadastro?.length || 0);
    
    if (response.data.faultstring) {
      throw new Error(response.data.faultstring);
    }

    // Filtrar por data de vencimento no backend
    let contas = response.data.conta_pagar_cadastro || [];
    let totalOriginal = contas.length;
    
    console.log('🔍 Total ANTES do filtro:', totalOriginal);
    
    if (dataInicial && dataFinal && contas.length > 0) {
      const [d1, m1, a1] = dataInicial.split('/');
      const [d2, m2, a2] = dataFinal.split('/');
      const dataIni = new Date(a1, m1 - 1, d1);
      const dataFim = new Date(a2, m2 - 1, d2);
      
      console.log('📅 Filtro de data:', dataIni, 'até', dataFim);
      
      contas = contas.filter(c => {
        if (!c.data_vencimento) return false;
        const [d, m, a] = c.data_vencimento.split('/');
        const dataVenc = new Date(a, m - 1, d);
        return dataVenc >= dataIni && dataVenc <= dataFim;
      });
      
      console.log(`✅ DEPOIS do filtro: ${contas.length} de ${totalOriginal} contas`);
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
          total_de_registros: contas.length,
          total_sem_filtro: totalOriginal,
          conta_pagar_cadastro: contas
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Erro na Function:', error.message);
    console.error('Stack:', error.stack);
    
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
