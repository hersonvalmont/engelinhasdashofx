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

    if (!dataInicial || !dataFinal) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'dataInicial e dataFinal são obrigatórios.' 
        })
      };
    }

    const [d1, m1, a1] = dataInicial.split('/');
    const [d2, m2, a2] = dataFinal.split('/');
    const dataIni = new Date(a1, m1 - 1, d1);
    const dataFim = new Date(a2, m2 - 1, d2);
    const anoAlvo = parseInt(a1);

    console.log(`🎯 Buscando ${dataInicial} a ${dataFinal} (ano ${anoAlvo})`);

    let todasContasFiltradas = [];
    let paginaAtual = 1;
    const MAX_PAGINAS = 15;
    let passou = false;

    while (paginaAtual <= MAX_PAGINAS && !passou) {
      const omieRequest = {
        call: 'ListarContasPagar',
        app_key: process.env.OMIE_APP_KEY,
        app_secret: process.env.OMIE_APP_SECRET,
        param: [{
          pagina: paginaAtual,
          registros_por_pagina: 500,
          apenas_importado_api: 'N',
          ordenar_por: 'DATA_VENCIMENTO',
          ordem_descrescente: 'S',
          exibir_obs: 'S',
          exibir_detalhes: 'S' // ✅ ADICIONAR PARA VER MAIS CAMPOS
        }]
      };

      const response = await axios.post(
        'https://app.omie.com.br/api/v1/financas/contapagar/',
        omieRequest,
        { timeout: 20000, headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.faultstring) {
        throw new Error(response.data.faultstring);
      }

      const contas = response.data.conta_pagar_cadastro || [];
      if (contas.length === 0) break;

      // DEBUG: LOGAR TODOS OS CAMPOS DISPONÍVEIS
      if (paginaAtual === 1 && contas.length > 0) {
        console.log('🔍 TODOS OS CAMPOS DISPONÍVEIS:');
        console.log(JSON.stringify(Object.keys(contas[0]), null, 2));
        console.log('🔍 PRIMEIRA CONTA COMPLETA:');
        console.log(JSON.stringify(contas[0], null, 2));
      }

      const primeira = contas[0]?.data_vencimento;
      const ultima = contas[contas.length - 1]?.data_vencimento;
      
      if (primeira && ultima) {
        const [,,aPri] = primeira.split('/');
        const [,,aUlt] = ultima.split('/');
        const anoPri = parseInt(aPri);
        const anoUlt = parseInt(aUlt);

        console.log(`📄 P${paginaAtual}: ${primeira} → ${ultima}`);

        const filtradas = contas.filter(c => {
          if (!c.data_vencimento) return false;
          const [d, m, a] = c.data_vencimento.split('/');
          const dataVenc = new Date(a, m - 1, d);
          return dataVenc >= dataIni && dataVenc <= dataFim;
        });

        if (filtradas.length > 0) {
          todasContasFiltradas.push(...filtradas);
          console.log(`   ✅ ${filtradas.length} contas no período`);
        }

        if (anoUlt < anoAlvo) {
          passou = true;
        }
      }

      paginaAtual++;

      if (todasContasFiltradas.length > 0 && paginaAtual > 5) {
        break;
      }
    }

    console.log(`📊 FINAL: ${todasContasFiltradas.length} contas`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          registros: todasContasFiltradas.length,
          conta_pagar_cadastro: todasContasFiltradas
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
