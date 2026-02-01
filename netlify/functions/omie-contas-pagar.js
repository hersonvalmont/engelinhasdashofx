const axios = require('axios');

async function buscarFornecedorLote(appKey, appSecret, codigos) {
  const resultados = new Map();
  
  // Processar em lotes de 5 simultâneos
  for (let i = 0; i < codigos.length; i += 5) {
    const lote = codigos.slice(i, i + 5);
    
    const promessas = lote.map(async cod => {
      try {
        const response = await axios.post(
          'https://app.omie.com.br/api/v1/geral/clientes/',
          {
            call: 'ConsultarCliente',
            app_key: appKey,
            app_secret: appSecret,
            param: [{ codigo_cliente_omie: cod }]
          },
          { timeout: 5000 }
        );
        
        const nome = response.data.nome_fantasia || response.data.razao_social || null;
        if (nome) resultados.set(cod, nome);
      } catch (err) {
        // Ignorar erros
      }
    });
    
    await Promise.all(promessas);
    await new Promise(resolve => setTimeout(resolve, 100)); // Delay entre lotes
  }
  
  return resultados;
}

async function buscarProjetoLote(appKey, appSecret, codigos) {
  const resultados = new Map();
  
  // Processar em lotes de 5 simultâneos
  for (let i = 0; i < codigos.length; i += 5) {
    const lote = codigos.slice(i, i + 5);
    
    const promessas = lote.map(async cod => {
      try {
        const response = await axios.post(
          'https://app.omie.com.br/api/v1/geral/projetos/',
          {
            call: 'ConsultarProjeto',
            app_key: appKey,
            app_secret: appSecret,
            param: [{ codigo: cod }]
          },
          { timeout: 5000 }
        );
        
        const nome = response.data.nome || null;
        if (nome) resultados.set(cod, nome);
      } catch (err) {
        // Ignorar erros
      }
    });
    
    await Promise.all(promessas);
    await new Promise(resolve => setTimeout(resolve, 100)); // Delay entre lotes
  }
  
  return resultados;
}

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

    console.log(`🎯 Buscando ${dataInicial} a ${dataFinal}`);

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
          exibir_obs: 'S'
        }]
      };

      const response = await axios.post(
        'https://app.omie.com.br/api/v1/financas/contapagar/',
        omieRequest,
        { timeout: 20000 }
      );

      if (response.data.faultstring) {
        throw new Error(response.data.faultstring);
      }

      const contas = response.data.conta_pagar_cadastro || [];
      if (contas.length === 0) break;

      const primeira = contas[0]?.data_vencimento;
      const ultima = contas[contas.length - 1]?.data_vencimento;
      
      if (primeira && ultima) {
        const [,,aPri] = primeira.split('/');
        const [,,aUlt] = ultima.split('/');
        const anoUlt = parseInt(aUlt);

        const filtradas = contas.filter(c => {
          if (!c.data_vencimento) return false;
          const [d, m, a] = c.data_vencimento.split('/');
          const dataVenc = new Date(a, m - 1, d);
          return dataVenc >= dataIni && dataVenc <= dataFim;
        });

        if (filtradas.length > 0) {
          todasContasFiltradas.push(...filtradas);
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

    console.log(`📦 ${todasContasFiltradas.length} contas encontradas`);

    // Identificar fornecedores e projetos únicos
    const fornecedoresUnicos = [...new Set(todasContasFiltradas.map(c => c.codigo_cliente_fornecedor))];
    const projetosUnicos = [...new Set(todasContasFiltradas.map(c => c.codigo_projeto).filter(Boolean))];

    console.log(`🔍 Buscando ${fornecedoresUnicos.length} fornecedores e ${projetosUnicos.length} projetos em paralelo...`);

    // Buscar em paralelo
    const [fornecedoresMap, projetosMap] = await Promise.all([
      buscarFornecedorLote(process.env.OMIE_APP_KEY, process.env.OMIE_APP_SECRET, fornecedoresUnicos),
      buscarProjetoLote(process.env.OMIE_APP_KEY, process.env.OMIE_APP_SECRET, projetosUnicos)
    ]);

    console.log(`📊 Encontrados: ${fornecedoresMap.size}/${fornecedoresUnicos.length} fornecedores, ${projetosMap.size}/${projetosUnicos.length} projetos`);

    // ENRIQUECER CONTAS
    const contasEnriquecidas = todasContasFiltradas.map(conta => {
      const nomeFornecedor = fornecedoresMap.get(conta.codigo_cliente_fornecedor);
      const nomeProjeto = projetosMap.get(conta.codigo_projeto);

      return {
        ...conta,
        nome_fornecedor: nomeFornecedor || conta.observacao || 'Sem fornecedor',
        nome_projeto: nomeProjeto || 'Sem projeto'
      };
    });

    console.log(`✅ ${contasEnriquecidas.length} contas enriquecidas`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          registros: contasEnriquecidas.length,
          conta_pagar_cadastro: contasEnriquecidas
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
