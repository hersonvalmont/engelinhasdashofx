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
    const { dataInicial, dataFinal, registrosPorPagina = 500 } = JSON.parse(event.body || '{}');

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

    console.log('📡 Buscando contas do Omie (todas as páginas)...');
    console.log('📅 Filtro solicitado:', dataInicial, 'até', dataFinal);

    // BUSCAR TODAS AS PÁGINAS
    let todasContas = [];
    let paginaAtual = 1;
    let totalPaginas = 1;
    const MAX_PAGINAS = 50; // Proteção contra loop infinito

    do {
      const omieRequest = {
        call: 'ListarContasPagar',
        app_key: process.env.OMIE_APP_KEY,
        app_secret: process.env.OMIE_APP_SECRET,
        param: [{
          pagina: paginaAtual,
          registros_por_pagina: registrosPorPagina,
          apenas_importado_api: 'N',
          ordenar_por: 'DATA_VENCIMENTO',
          ordem_descrescente: 'N',
          exibir_obs: 'S'
        }]
      };

      console.log(`📄 Buscando página ${paginaAtual}...`);

      const response = await axios.post(
        'https://app.omie.com.br/api/v1/financas/contapagar/',
        omieRequest,
        { 
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.faultstring) {
        throw new Error(response.data.faultstring);
      }

      const contas = response.data.conta_pagar_cadastro || [];
      todasContas.push(...contas);
      
      totalPaginas = response.data.total_de_paginas || 1;
      
      console.log(`✅ Página ${paginaAtual}/${totalPaginas}: ${contas.length} registros (total acumulado: ${todasContas.length})`);

      paginaAtual++;

    } while (paginaAtual <= totalPaginas && paginaAtual <= MAX_PAGINAS);

    console.log(`📦 TOTAL BRUTO: ${todasContas.length} contas`);

    // FILTRAR POR DATA
    let contasFiltradas = todasContas;

    if (dataInicial && dataFinal && todasContas.length > 0) {
      const [d1, m1, a1] = dataInicial.split('/');
      const [d2, m2, a2] = dataFinal.split('/');
      const dataIni = new Date(a1, m1 - 1, d1);
      const dataFim = new Date(a2, m2 - 1, d2);

      contasFiltradas = todasContas.filter(c => {
        if (!c.data_vencimento) return false;
        const [d, m, a] = c.data_vencimento.split('/');
        const dataVenc = new Date(a, m - 1, d);
        return dataVenc >= dataIni && dataVenc <= dataFim;
      });

      console.log(`🔍 DEPOIS do filtro: ${contasFiltradas.length} de ${todasContas.length} contas`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          pagina: 1,
          total_de_paginas: 1,
          registros: contasFiltradas.length,
          total_de_registros: contasFiltradas.length,
          total_sem_filtro: todasContas.length,
          conta_pagar_cadastro: contasFiltradas
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
