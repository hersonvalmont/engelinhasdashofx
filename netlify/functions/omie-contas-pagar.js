const axios = require('axios');

// Cache global persistente entre invocações
const cacheGlobal = {
  fornecedores: new Map(),
  projetos: new Map(),
  ultimaLimpeza: Date.now()
};

// Limpar cache a cada 1 hora
function limparCacheSeNecessario() {
  const UMA_HORA = 60 * 60 * 1000;
  if (Date.now() - cacheGlobal.ultimaLimpeza > UMA_HORA) {
    cacheGlobal.fornecedores.clear();
    cacheGlobal.projetos.clear();
    cacheGlobal.ultimaLimpeza = Date.now();
    console.log('🧹 Cache limpo');
  }
}

async function buscarFornecedor(appKey, appSecret, codigoFornecedor) {
  // Verificar cache primeiro
  if (cacheGlobal.fornecedores.has(codigoFornecedor)) {
    return cacheGlobal.fornecedores.get(codigoFornecedor);
  }

  try {
    const response = await axios.post(
      'https://app.omie.com.br/api/v1/geral/clientes/',
      {
        call: 'ConsultarCliente',
        app_key: appKey,
        app_secret: appSecret,
        param: [{ codigo_cliente_omie: codigoFornecedor }]
      },
      { timeout: 5000 }
    );

    const nome = response.data.nome_fantasia || response.data.razao_social || null;
    
    // Salvar no cache
    if (nome) {
      cacheGlobal.fornecedores.set(codigoFornecedor, nome);
    }
    
    return nome;
  } catch (err) {
    return null;
  }
}

async function buscarProjeto(appKey, appSecret, codigoProjeto) {
  // Verificar cache primeiro
  if (cacheGlobal.projetos.has(codigoProjeto)) {
    return cacheGlobal.projetos.get(codigoProjeto);
  }

  try {
    const response = await axios.post(
      'https://app.omie.com.br/api/v1/geral/projetos/',
      {
        call: 'ConsultarProjeto',
        app_key: appKey,
        app_secret: appSecret,
        param: [{ codigo: codigoProjeto }]
      },
      { timeout: 5000 }
    );

    const nome = response.data.nome || null;
    
    // Salvar no cache
    if (nome) {
      cacheGlobal.projetos.set(codigoProjeto, nome);
    }
    
    return nome;
  } catch (err) {
    return null;
  }
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
    limparCacheSeNecessario();

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

    const fornecedoresNaoCache = fornecedoresUnicos.filter(cod => !cacheGlobal.fornecedores.has(cod));
    const projetosNaoCache = projetosUnicos.filter(cod => !cacheGlobal.projetos.has(cod));

    console.log(`🔍 Cache: ${fornecedoresUnicos.length - fornecedoresNaoCache.length}/${fornecedoresUnicos.length} fornecedores, ${projetosUnicos.length - projetosNaoCache.length}/${projetosUnicos.length} projetos`);
    console.log(`🔍 Buscando ${fornecedoresNaoCache.length} novos fornecedores e ${projetosNaoCache.length} novos projetos...`);

    // Buscar apenas fornecedores não cacheados
    for (const cod of fornecedoresNaoCache) {
      await buscarFornecedor(process.env.OMIE_APP_KEY, process.env.OMIE_APP_SECRET, cod);
      await new Promise(resolve => setTimeout(resolve, 30)); // Delay 30ms
    }

    // Buscar apenas projetos não cacheados
    for (const cod of projetosNaoCache) {
      await buscarProjeto(process.env.OMIE_APP_KEY, process.env.OMIE_APP_SECRET, cod);
      await new Promise(resolve => setTimeout(resolve, 30)); // Delay 30ms
    }

    // ENRIQUECER CONTAS (usando cache)
    const contasEnriquecidas = todasContasFiltradas.map(conta => {
      const nomeFornecedor = cacheGlobal.fornecedores.get(conta.codigo_cliente_fornecedor);
      const nomeProjeto = cacheGlobal.projetos.get(conta.codigo_projeto);

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
