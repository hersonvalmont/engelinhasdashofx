// ============================================
// ENGELINHAS - DASHBOARD DE CONTROLADORIA
// Auditoria e Fluxo de Caixa
// ============================================

class ControladoriaApp {
    constructor() {
        this.contasPagar = [];
        this.extrato = [];
        this.ofxData = [];
        this.transacoesConciliadas = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.chart = null;
        this.saldoBancario = 0; // Saldo real do OFX (BALAMT)
        
        this.init();
    }
    
    // Inicialização
    init() {
        this.setupEventListeners();
        this.initializeFilters();
        this.showLoading(false);
        console.log('✅ Dashboard Engelinhas inicializado');
    }
    
    // Event Listeners
    setupEventListeners() {
        // Upload OFX
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('ofxFile');
        
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragging');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragging');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragging');
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.ofx')) {
                this.processOFX(file);
            }
        });
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processOFX(file);
            }
        });
        
        // Upload CSV/XLSX Omie
        const dropZoneOmie = document.getElementById('dropZoneOmie');
        const omieFileInput = document.getElementById('omieFile');
        
        dropZoneOmie.addEventListener('click', () => omieFileInput.click());
        dropZoneOmie.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZoneOmie.classList.add('dragging');
        });
        dropZoneOmie.addEventListener('dragleave', () => {
            dropZoneOmie.classList.remove('dragging');
        });
        dropZoneOmie.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZoneOmie.classList.remove('dragging');
            const file = e.dataTransfer.files[0];
            if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                this.processOmieFile(file);
            }
        });
        omieFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processOmieFile(file);
            }
        });
        
        // Filtros - Agora com atualização automática do dashboard
        document.getElementById('filterPeriod').addEventListener('change', (e) => {
            const customRange = document.getElementById('customDateRange');
            if (e.target.value === 'custom') {
                customRange.classList.remove('hidden');
            } else {
                customRange.classList.add('hidden');
            }
            this.updateDashboard(); // Atualização automática
        });
        
        document.getElementById('filterProject').addEventListener('change', () => this.updateDashboard());
        document.getElementById('filterStatus').addEventListener('change', () => this.updateDashboard());
        document.getElementById('filterType').addEventListener('change', () => this.updateDashboard());
        document.getElementById('dateStart').addEventListener('change', () => this.updateDashboard());
        document.getElementById('dateEnd').addEventListener('change', () => this.updateDashboard());
        
        // Busca
        document.getElementById('searchTable').addEventListener('input', () => this.applyFilters());
        
        // Ações
        document.getElementById('btnRefresh').addEventListener('click', () => this.refreshData());
        document.getElementById('btnExport').addEventListener('click', () => this.exportToXLSX());
        
        // Paginação
        document.getElementById('btnPrevPage').addEventListener('click', () => this.changePage(-1));
        document.getElementById('btnNextPage').addEventListener('click', () => this.changePage(1));
        
        // Chart buttons
        document.getElementById('btnChartWeek').addEventListener('click', () => this.updateChartPeriod(7));
        document.getElementById('btnChartMonth').addEventListener('click', () => this.updateChartPeriod(30));
    }
    
    // Inicializar filtros com data atual
    initializeFilters() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        document.getElementById('dateStart').value = this.formatDateInput(startOfMonth);
        document.getElementById('dateEnd').value = this.formatDateInput(endOfMonth);
    }
    
    // ==========================================
    // PROCESSAMENTO OFX (CLIENT-SIDE)
    // ==========================================
    
    async processOFX(file) {
        this.showLoading(true);
        const status = document.getElementById('ofxStatus');
        
        try {
            const text = await file.text();
            
            // Parse OFX usando biblioteca ofx-js
            const ofxData = this.parseOFXManual(text);
            
            if (!ofxData || ofxData.length === 0) {
                throw new Error('Nenhuma transação encontrada no arquivo OFX');
            }
            
            this.ofxData = ofxData;
            status.innerHTML = `<i class="fas fa-check-circle text-green-500 mr-1"></i>${ofxData.length} transações importadas`;
            
            // Realizar conciliação automaticamente
            this.realizarConciliacao();
            this.updateDashboard();
            
            console.log('✅ OFX processado:', ofxData.length, 'transações');
            
        } catch (error) {
            console.error('❌ Erro ao processar OFX:', error);
            status.innerHTML = `<i class="fas fa-exclamation-circle text-red-500 mr-1"></i>Erro: ${error.message}`;
        } finally {
            this.showLoading(false);
        }
    }
    
    // Parser OFX manual (simplificado para maior compatibilidade)
    parseOFXManual(text) {
        const transactions = [];
        
        // Extrair saldo bancário real (BALAMT)
        const balAmtMatch = text.match(/<BALAMT>([^<]+)/);
        if (balAmtMatch) {
            this.saldoBancario = parseFloat(balAmtMatch[1]);
            console.log('✅ Saldo bancário OFX:', this.saldoBancario);
        }
        
        // Extrair transações (STMTTRN)
        const stmtRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
        let match;
        
        while ((match = stmtRegex.exec(text)) !== null) {
            const transactionBlock = match[1];
            
            const tipo = this.extractOFXField(transactionBlock, 'TRNTYPE');
            const data = this.extractOFXField(transactionBlock, 'DTPOSTED');
            const valor = this.extractOFXField(transactionBlock, 'TRNAMT');
            const fitid = this.extractOFXField(transactionBlock, 'FITID');
            const memo = this.extractOFXField(transactionBlock, 'MEMO') || this.extractOFXField(transactionBlock, 'NAME');
            
            if (data && valor) {
                transactions.push({
                    data: this.parseOFXDate(data),
                    descricao: memo || 'Sem descrição',
                    valor: parseFloat(valor),
                    tipo: parseFloat(valor) > 0 ? 'entrada' : 'saida',
                    tipoOFX: tipo,
                    id: fitid,
                    origem: 'OFX'
                });
            }
        }
        
        return transactions;
    }
    
    extractOFXField(text, field) {
        const regex = new RegExp(`<${field}>([^<]+)`);
        const match = text.match(regex);
        return match ? match[1].trim() : null;
    }
    
    parseOFXDate(dateStr) {
        // Formato OFX: YYYYMMDDHHMMSS ou YYYYMMDD
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return new Date(year, month - 1, day);
    }
    
    // ==========================================
    // PROCESSAMENTO CSV/XLSX OMIE (CLIENT-SIDE)
    // ==========================================
    
    async processOmieFile(file) {
        this.showLoading(true);
        const status = document.getElementById('omieStatus');
        
        try {
            console.log('📂 Processando arquivo Omie:', file.name);
            
            let data;
            
            if (file.name.endsWith('.csv')) {
                // Processar CSV
                data = await this.parseCSV(file);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                // Processar XLSX
                data = await this.parseXLSX(file);
            } else {
                throw new Error('Formato de arquivo não suportado. Use CSV ou XLSX.');
            }
            
            if (!data || data.length === 0) {
                throw new Error('Nenhuma conta a pagar encontrada no arquivo');
            }
            
            this.contasPagar = data;
            status.innerHTML = `<i class="fas fa-check-circle text-green-500 mr-1"></i>${data.length} contas a pagar importadas`;
            
            console.log('✅ Contas a pagar Omie importadas:', this.contasPagar.length);
            
            // Realizar conciliação se houver dados OFX
            if (this.ofxData.length > 0) {
                this.realizarConciliacao();
            } else {
                // Se não houver OFX, mostrar apenas as contas a pagar na tabela
                this.transacoesConciliadas = this.contasPagar.map(conta => ({
                    data: conta.data,
                    descricao: conta.descricao,
                    valor: -conta.valor,
                    tipo: conta.tipo,
                    statusConciliacao: conta.status, // MUDANÇA: Usa o status real do arquivo
                    contaOmie: conta,
                    valorPrevisto: conta.valor,
                    valorRealizado: 0,
                    projeto: conta.projeto,
                    categoria: conta.categoria || 'Sem categoria',
                    origem: 'OMIE'
                }));
            }
            
            this.updateDashboard();
            alert(`✅ ${data.length} contas a pagar importadas do Omie!`);
            
        } catch (error) {
            console.error('❌ Erro ao processar arquivo Omie:', error);
            status.innerHTML = `<i class="fas fa-exclamation-circle text-red-500 mr-1"></i>Erro: ${error.message}`;
        } finally {
            this.showLoading(false);
        }
    }
    
    async parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n');
                    
                    if (lines.length < 2) {
                        reject(new Error('Arquivo CSV vazio ou inválido'));
                        return;
                    }
                    
                    // Detectar separador (vírgula ou ponto-e-vírgula)
                    const separator = lines[0].includes(';') ? ';' : ',';
                    
                    // Função para split respeitando aspas
                    const splitCSVLine = (line, sep) => {
                        const result = [];
                        let current = '';
                        let inQuotes = false;
                        
                        for (let i = 0; i < line.length; i++) {
                            const char = line[i];
                            
                            if (char === '"') {
                                inQuotes = !inQuotes;
                            } else if (char === sep && !inQuotes) {
                                result.push(current.trim());
                                current = '';
                            } else {
                                current += char;
                            }
                        }
                        result.push(current.trim());
                        return result.map(v => v.replace(/^"|"$/g, ''));
                    };
                    
                    // Parsear header
                    const headers = splitCSVLine(lines[0], separator);
                    
                    console.log('📋 Headers CSV:', headers);
                    
                    // Mapear colunas (detectar automaticamente)
                    const columnMap = this.detectOmieColumns(headers);
                    
                    if (!columnMap.data || !columnMap.valor) {
                        reject(new Error('Arquivo CSV não contém colunas obrigatórias (Data e Valor)'));
                        return;
                    }
                    
                    const contas = [];
                    
                    // Parsear linhas de dados
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        const values = splitCSVLine(line, separator);
                        
                        // FILTRO: ignorar linhas de SALDO e linhas sem data válida
                        const descricao = columnMap.descricao ? values[columnMap.descricao] : '';
                        if (descricao.toUpperCase().includes('SALDO') || descricao.trim() === '') {
                            continue; // Pular linha
                        }
                        
                        const data = this.parseOmieDate(values[columnMap.data]);
                        const valor = this.parseOmieValor(values[columnMap.valor]);
                        const projeto = columnMap.projeto ? values[columnMap.projeto] : 'Sem projeto';
                        const categoria = columnMap.categoria ? values[columnMap.categoria] : 'Sem categoria';
                        const status = columnMap.status !== undefined ? values[columnMap.status] : 'PENDENTE';
                        
                        // FILTRO: só incluir se tiver data E valor > 0
                        if (data && valor && valor > 0) {
                            contas.push({
                                id: i,
                                data: data,
                                descricao: descricao || 'Sem descrição',
                                valor: valor,
                                projeto: projeto || 'Sem projeto',
                                categoria: this.formatCategoria(categoria),
                                status: status || 'PENDENTE',
                                tipo: 'saida',
                                origem: 'OMIE_CSV'
                            });
                        }
                    }
                    
                    console.log('✅ CSV parseado:', contas.length, 'registros');
                    resolve(contas);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Erro ao ler arquivo CSV'));
            reader.readAsText(file, 'UTF-8');
        });
    }
    
    async parseXLSX(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Pegar primeira planilha
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    // Converter para JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    if (jsonData.length < 2) {
                        reject(new Error('Planilha vazia ou inválida'));
                        return;
                    }
                    
                    // Headers
                    const headers = jsonData[0].map(h => String(h).trim());
                    
                    console.log('📋 Headers XLSX:', headers);
                    
                    // Mapear colunas
                    const columnMap = this.detectOmieColumns(headers);
                    
                    if (!columnMap.data || !columnMap.valor) {
                        reject(new Error('Planilha não contém colunas obrigatórias (Data e Valor)'));
                        return;
                    }
                    
                    const contas = [];
                    
                    // Parsear linhas
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (!row || row.length === 0) continue;
                        
                        const descricao = columnMap.descricao ? row[columnMap.descricao] : '';
                        // FILTRO: ignorar linhas de SALDO e linhas sem descrição válida
                        if (descricao && descricao.toUpperCase().includes('SALDO')) {
                            continue;
                        }
                        
                        const data = this.parseOmieDate(row[columnMap.data]);
                        const valor = this.parseOmieValor(row[columnMap.valor]);
                        const projeto = columnMap.projeto ? row[columnMap.projeto] : 'Sem projeto';
                        const categoria = columnMap.categoria ? row[columnMap.categoria] : 'Sem categoria';
                        const status = columnMap.status !== undefined ? row[columnMap.status] : 'PENDENTE';
                        
                        // FILTRO: só incluir se tiver data E valor > 0
                        if (data && valor && valor > 0) {
                            contas.push({
                                id: i,
                                data: data,
                                descricao: descricao || 'Sem descrição',
                                valor: valor,
                                projeto: projeto || 'Sem projeto',
                                categoria: this.formatCategoria(categoria),
                                status: status || 'PENDENTE',
                                tipo: 'saida',
                                origem: 'OMIE_XLSX'
                            });
                        }
                    }
                    
                    console.log('✅ XLSX parseado:', contas.length, 'registros');
                    resolve(contas);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Erro ao ler arquivo XLSX'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    detectOmieColumns(headers) {
        const map = {};
        
        headers.forEach((header, index) => {
            const h = header.toLowerCase();
            
            // Data de vencimento
            if (h.includes('vencimento') || h.includes('data') || h.includes('dt')) {
                map.data = index;
            }
            
            // Valor
            if (h.includes('valor') || h.includes('total') || h.includes('vl')) {
                map.valor = index;
            }
            
            // Descrição (Priorizando Fornecedor/Nome Fantasia para Auditoria)
            if (h.includes('fornecedor') || h.includes('fantasia') || h.includes('cliente') || h.includes('descri') || h.includes('observ') || h.includes('historico')) {
                if (!map.descricao || h.includes('fornecedor') || h.includes('fantasia')) {
                    map.descricao = index;
                }
            }
            
            // Categoria
            if (h.includes('categoria')) {
                map.categoria = index;
            }
            
            // Projeto
            if (h.includes('projeto') || h.includes('centro') || h.includes('custo') || h.includes('departamento')) {
                map.projeto = index;
            }
            
            // MUDANÇA: Status (Prioriza a coluna "Situação" do arquivo CSV)
            if (h.includes('situa') || h.includes('status') || h.includes('situacao')) {
                map.status = index;
            }
        });
        
        console.log('🗺️ Mapeamento de colunas atualizado:', map);
        return map;
    }
    
    parseOmieDate(value) {
        if (!value) return null;
        
        const str = String(value).trim();
        
        // Formato DD/MM/YYYY ou DD/MM/YY
        if (str.includes('/')) {
            const parts = str.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                let year = parseInt(parts[2]);
                
                // Se ano tem 2 dígitos, converter para 4
                if (year < 100) {
                    year += 2000;
                }
                
                return new Date(year, month - 1, day);
            }
        }
        
        // Formato YYYY-MM-DD (CORRIGIDO para evitar timezone)
        if (str.includes('-')) {
            const parts = str.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                const day = parseInt(parts[2]);
                return new Date(year, month - 1, day);
            }
        }
        
        // Formato Excel serial date
        if (!isNaN(value)) {
            const excelEpoch = new Date(1899, 11, 30);
            return new Date(excelEpoch.getTime() + value * 86400000);
        }
        
        return null;
    }
    
    parseOmieValor(value) {
        if (!value) return 0;
        
        // Remover símbolo de moeda e espaços
        let str = String(value).trim()
            .replace('R$', '')
            .replace('$', '')
            .trim();
        
        // Substituir vírgula por ponto (formato brasileiro)
        // Mas só se tiver um único separador
        if (str.includes(',') && !str.includes('.')) {
            str = str.replace(',', '.');
        } else if (str.includes('.') && str.includes(',')) {
            // Formato: 1.234,56 -> 1234.56
            str = str.replace(/\./g, '').replace(',', '.');
        }
        
        const valor = parseFloat(str);
        return isNaN(valor) ? 0 : Math.abs(valor);
    }
    
    // Arredondar porcentagens em categorias rateadas
    formatCategoria(categoria) {
        if (!categoria) return 'Sem categoria';
        
        // Regex para encontrar porcentagens como (13,636364%)
        return categoria.replace(/\((\d+),(\d+)%\)/g, (match, inteiro, decimal) => {
            const percentual = parseFloat(`${inteiro}.${decimal}`);
            return `(${Math.round(percentual)}%)`;
        });
    }
    
    // ==========================================
    // API OMIE INTEGRATION
    // ==========================================
    
    async refreshData() {
        this.showLoading(true);
        
        try {
            // DEBUG DE AUDITORIA: Captura direta dos elementos do DOM
            const dStartInput = document.getElementById('dateStart').value; // Formato YYYY-MM-DD
            const dEndInput = document.getElementById('dateEnd').value;

            if (!dStartInput || dEndInput === "") {
                throw new Error("Datas de início ou fim não preenchidas.");
            }

            // Conversão manual e segura para DD/MM/YYYY (O que o Omie exige)
            const [y1, m1, d1] = dStartInput.split('-');
            const [y2, m2, d2] = dEndInput.split('-');
            
            const dataInicialOmie = `${d1}/${m1}/${y1}`;
            const dataFinalOmie = `${d2}/${m2}/${y2}`;

            console.log('🚀 Enviando para Omie:', { dataInicialOmie, dataFinalOmie });

            // Chamada direta para a Function do Netlify
            const response = await axios.post('/.netlify/functions/omie-contas-pagar', {
                dataInicial: dataInicialOmie,
                dataFinal: dataFinalOmie,
                page: 1,
                registrosPorPagina: 500
            });
            
            console.log('📦 Resposta bruta do Omie:', response.data);
            
            if (response.data.success) {
                // Aqui usamos a sua normalizeContasPagar que já mapeia o Nome Fantasia
                this.contasPagar = this.normalizeContasPagar(response.data.data);
                
                if (this.contasPagar.length === 0) {
                    alert('⚠️ Conexão OK, mas o Omie não retornou nenhum lançamento para estas datas.');
                } else {
                    alert(`✅ Sucesso! ${this.contasPagar.length} lançamentos importados.`);
                }
            } else {
                throw new Error(response.data.error || 'Erro na resposta da API');
            }
            
            // Re-executa conciliação se já houver OFX carregado
            if (this.ofxData.length > 0) {
                this.realizarConciliacao();
            } else {
                // Se não houver OFX, preenche a tabela apenas com os dados do Omie
                this.transacoesConciliadas = this.contasPagar.map(c => ({
                    data: c.data,
                    descricao: c.descricao,
                    valor: -c.valor,
                    tipo: 'saida',
                    statusConciliacao: c.status,
                    valorPrevisto: c.valor,
                    valorRealizado: 0,
                    projeto: c.projeto,
                    origem: 'OMIE'
                }));
            }
            
            this.updateDashboard();
            this.updateLastUpdateTime();
            
        } catch (error) {
            console.error('❌ Falha no Debug:', error);
            const msg = error.response?.data?.error || error.message;
            alert('ERRO DE INTEGRAÇÃO: ' + msg);
        } finally {
            this.showLoading(false);
        }
    }

    normalizeContasPagar(data) {
    const contas = data.conta_pagar_cadastro || [];
    
    return contas.map(conta => ({
        id: conta.codigo_lancamento_omie,
        data: this.parseAPIDate(conta.data_vencimento),
        descricao: conta.nome_fornecedor || 'Sem fornecedor',
        valor: parseFloat(conta.valor_documento) || 0,
        projeto: conta.nome_projeto || 'Sem projeto',
        status: conta.status_titulo || 'PENDENTE',
        tipo: 'saida',
        origem: 'OMIE'
    }));
}

    parseAPIDate(dateStr) {
    if (!dateStr) return new Date();
    const [d, m, y] = dateStr.split('/');
    return new Date(y, m - 1, d);
}
    
    // ==========================================
    // LÓGICA DE CONCILIAÇÃO (CFO RULES)
    // ==========================================
    
    realizarConciliacao() {
        this.transacoesConciliadas = [];
        
        // Criar mapa de contas a pagar para busca rápida
        const contasMap = new Map();
        this.contasPagar.forEach(conta => {
            const key = this.getConciliacaoKey(conta.data, conta.valor);
            if (!contasMap.has(key)) {
                contasMap.set(key, []);
            }
            contasMap.get(key).push(conta);
        });
        
        // Processar transações OFX
        this.ofxData.forEach(transacao => {
            const key = this.getConciliacaoKey(transacao.data, Math.abs(transacao.valor));
            const contasMatch = contasMap.get(key);
            
            let statusConciliacao = 'NAO_PROVISIONADO';
            let contaConciliada = null;
            
            if (contasMatch && contasMatch.length > 0) {
                statusConciliacao = 'CONCILIADO';
                contaConciliada = contasMatch[0];
                // Remover conta conciliada do mapa
                contasMatch.shift();
            }
            
            this.transacoesConciliadas.push({
                ...transacao,
                statusConciliacao: contaConciliada ? contaConciliada.status : statusConciliacao,
                contaOmie: contaConciliada,
                valorPrevisto: contaConciliada ? contaConciliada.valor : 0,
                valorRealizado: Math.abs(transacao.valor),
                projeto: contaConciliada ? contaConciliada.projeto : 'N/A',
                categoria: contaConciliada ? contaConciliada.categoria : 'Sem categoria'
            });
        });
        
        // Adicionar contas não conciliadas
        this.contasPagar.forEach(conta => {
            const key = this.getConciliacaoKey(conta.data, conta.valor);
            const contasRestantes = contasMap.get(key) || [];
            
            if (contasRestantes.includes(conta)) {
                this.transacoesConciliadas.push({
                    data: conta.data,
                    descricao: conta.descricao,
                    valor: -conta.valor,
                    tipo: conta.tipo,
                    statusConciliacao: conta.status,
                    contaOmie: conta,
                    valorPrevisto: conta.valor,
                    valorRealizado: 0,
                    projeto: conta.projeto,
                    categoria: conta.categoria || 'Sem categoria',
                    origem: 'OMIE'
                });
            }
        });
        
        console.log('✅ Conciliação realizada:', this.transacoesConciliadas.length, 'transações');
    }
    
    getConciliacaoKey(data, valor) {
        const dateStr = this.formatDateBR(data);
        const valorStr = Math.abs(valor).toFixed(2);
        return `${dateStr}_${valorStr}`;
    }
    
    // ==========================================
    // CÁLCULO DE KPIs
    // ==========================================
    
    calculateKPIs() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        
        // DEBUG: Log das contas carregadas
        console.log('🔍 DEBUG calculateKPIs:');
        console.log('Total de contas em this.contasPagar:', this.contasPagar.length);
        console.log('Data de hoje:', today);
        
        // Saldo bancário (tag BALAMT do OFX)
        const saldoBancario = this.saldoBancario;
        
        // Contas a pagar hoje
        const contasHoje = this.contasPagar.filter(c => {
            const dataVenc = new Date(c.data);
            dataVenc.setHours(0, 0, 0, 0);
            return dataVenc.getTime() === today.getTime();
        });
        
        // DEBUG: Log das contas filtradas
        console.log('Contas que vencem hoje:', contasHoje.length);
        console.log('Detalhes das contas hoje:', contasHoje);
        
        const totalPagarHoje = contasHoje.reduce((sum, c) => sum + c.valor, 0);
        console.log('Total a pagar hoje:', totalPagarHoje);
        
        // Contas a pagar na semana
        const contasSemana = this.contasPagar.filter(c => {
            const dataVenc = new Date(c.data);
            dataVenc.setHours(0, 0, 0, 0);
            return dataVenc >= today && dataVenc <= weekFromNow;
        });
        const totalPagarSemana = contasSemana.reduce((sum, c) => sum + c.valor, 0);
        
        // Projeção de saldo (saldo atual - contas a pagar da semana)
        const projecaoSaldo = saldoBancario - totalPagarSemana;
        
        return {
            saldoBancario,
            contasHoje: contasHoje.length,
            totalPagarHoje,
            contasSemana: contasSemana.length,
            totalPagarSemana,
            projecaoSaldo
        };
    }
    
    updateKPIs() {
        const kpis = this.calculateKPIs();
        
        // Atualizar saldo com cor dinâmica
        const saldoElement = document.getElementById('kpiSaldo');
        saldoElement.textContent = this.formatCurrency(kpis.saldoBancario);
        
        // Aplicar classe CSS de cor baseada no saldo
        saldoElement.classList.remove('text-red-500', 'text-green-500', 'text-white');
        if (kpis.saldoBancario < 0) {
            saldoElement.classList.add('text-red-500');
        } else if (kpis.saldoBancario > 0) {
            saldoElement.classList.add('text-green-500');
        } else {
            saldoElement.classList.add('text-white');
        }
        
        document.getElementById('kpiSaldoVariacao').innerHTML = 
            kpis.saldoBancario >= 0 
                ? '<i class="fas fa-arrow-up text-green-500 mr-1"></i>Positivo'
                : '<i class="fas fa-arrow-down text-red-500 mr-1"></i>Negativo';
        
        document.getElementById('kpiPagarHoje').textContent = this.formatCurrency(kpis.totalPagarHoje);
        document.getElementById('kpiPagarHojeQtd').textContent = `${kpis.contasHoje} contas`;
        
        document.getElementById('kpiPagarSemana').textContent = this.formatCurrency(kpis.totalPagarSemana);
        document.getElementById('kpiPagarSemanaQtd').textContent = `${kpis.contasSemana} contas`;
        
        document.getElementById('kpiProjecao').textContent = this.formatCurrency(kpis.projecaoSaldo);
        document.getElementById('kpiProjecaoStatus').innerHTML = 
            kpis.projecaoSaldo >= 0 
                ? '<i class="fas fa-check-circle text-green-500 mr-1"></i>Saudável'
                : '<i class="fas fa-exclamation-triangle text-red-500 mr-1"></i>Atenção';
    }
    
    // ==========================================
    // GRÁFICO DE FLUXO DE CAIXA
    // ==========================================
    
    updateChart(days = 30) {
        const ctx = document.getElementById('cashFlowChart');
        
        // Preparar dados
        const { labels, previsto, realizado } = this.getChartData(days);
        
        // Destruir gráfico existente
        if (this.chart) {
            this.chart.destroy();
        }
        
        // Criar novo gráfico
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Previsto (Omie)',
                        data: previsto,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Realizado (OFX)',
                        data: realizado,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e5e5e5',
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af' }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { 
                            color: '#9ca3af',
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }
    
    getChartData(days) {
        const labels = [];
        const previsto = [];
        const realizado = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            labels.push(this.formatDateBR(date));
            
            // Somar valores previstos (Omie)
            const previstoDay = this.contasPagar
                .filter(c => {
                    const d = new Date(c.data);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime() === date.getTime();
                })
                .reduce((sum, c) => sum + c.valor, 0);
            
            previsto.push(previstoDay);
            
            // Somar valores realizados (OFX)
            const realizadoDay = this.ofxData
                .filter(t => {
                    const d = new Date(t.data);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime() === date.getTime();
                })
                .reduce((sum, t) => sum + Math.abs(t.valor), 0);
            
            realizado.push(realizadoDay);
        }
        
        return { labels, previsto, realizado };
    }
    
    updateChartPeriod(days) {
        // Atualizar botões ativos
        document.getElementById('btnChartWeek').classList.remove('bg-blue-600');
        document.getElementById('btnChartMonth').classList.remove('bg-blue-600');
        document.getElementById('btnChartWeek').classList.add('bg-gray-800');
        document.getElementById('btnChartMonth').classList.add('bg-gray-800');
        
        if (days === 7) {
            document.getElementById('btnChartWeek').classList.add('bg-blue-600');
            document.getElementById('btnChartWeek').classList.remove('bg-gray-800');
        } else {
            document.getElementById('btnChartMonth').classList.add('bg-blue-600');
            document.getElementById('btnChartMonth').classList.remove('bg-gray-800');
        }
        
        this.updateChart(days);
    }
    
    // ==========================================
    // TABELA DE AUDITORIA
    // ==========================================
    
    updateTable() {
        const tbody = document.getElementById('tableBody');
        const filtered = this.getFilteredData();
        
        // Paginação
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const page = filtered.slice(start, end);
        
        if (page.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-gray-500">
                        <i class="fas fa-search text-4xl mb-2"></i>
                        <p>Nenhum registro encontrado com os filtros aplicados.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = page.map(item => `
            <tr class="table-row border-b border-gray-800">
                <td class="py-3 px-4 text-gray-300">${this.formatDateBR(item.data)}</td>
                <td class="py-3 px-4 text-gray-300">${this.escapeHtml(item.descricao)}</td>
                <td class="py-3 px-4 text-gray-400 text-sm">${this.escapeHtml(item.projeto)}</td>
                <td class="py-3 px-4 text-gray-400 text-sm">${this.escapeHtml(item.categoria || 'Sem categoria')}</td>
                <td class="py-3 px-4 text-right text-gray-300 font-mono">${this.formatCurrency(item.valorPrevisto)}</td>
                <td class="py-3 px-4 text-right text-gray-300 font-mono">${this.formatCurrency(item.valorRealizado)}</td>
                <td class="py-3 px-4 text-center">
                    ${this.getStatusBadge(item.statusConciliacao)}
                </td>
                <td class="py-3 px-4 text-center">
                    ${this.getTipoBadge(item.tipo)}
                </td>
            </tr>
        `).join('');
        
        // Atualizar informações de paginação
        document.getElementById('tableTotal').textContent = filtered.length;
        document.getElementById('showingStart').textContent = start + 1;
        document.getElementById('showingEnd').textContent = Math.min(end, filtered.length);
        document.getElementById('showingTotal').textContent = filtered.length;
        document.getElementById('currentPage').textContent = this.currentPage;
        
        // Atualizar botões de paginação
        document.getElementById('btnPrevPage').disabled = this.currentPage === 1;
        document.getElementById('btnNextPage').disabled = end >= filtered.length;
    }
    
    getStatusBadge(status) {
        // MUDANÇA: Retorna o texto exato do status (Conciliado, Atrasado, etc) formatado
        const s = (status || 'PENDENTE').toUpperCase();
        if (s.includes('CONCILIADO')) return '<span class="status-badge status-conciliado"><i class="fas fa-check mr-1"></i>Conciliado</span>';
        if (s.includes('ATRASADO')) return '<span class="status-badge status-nao-provisionado"><i class="fas fa-exclamation mr-1"></i>Atrasado</span>';
        return `<span class="status-badge status-pendente"><i class="fas fa-clock mr-1"></i>${status}</span>`;
    }
    
    getTipoBadge(tipo) {
        if (tipo === 'entrada') {
            return '<span class="status-badge status-conciliado"><i class="fas fa-arrow-down mr-1"></i>Entrada</span>';
        } else {
            return '<span class="status-badge status-pendente"><i class="fas fa-arrow-up mr-1"></i>Saída</span>';
        }
    }
    
    // ==========================================
    // FILTROS
    // ==========================================
    
    applyFilters() {
        this.currentPage = 1;
        this.updateTable();
    }
    
    // Atualizar dashboard completo (KPIs + Gráfico + Tabela)
    updateDashboard() {
        this.updateKPIs();
        this.updateChart(30);
        this.updateProjectFilter();
        this.updateTable();
    }
    
    getFilteredData() {
        let data = [...this.transacoesConciliadas];
        
        // Filtro de período
        const { dataInicial, dataFinal } = this.getDateRange();
        data = data.filter(item => {
            const itemDate = new Date(item.data);
            return itemDate >= dataInicial && itemDate <= dataFinal;
        });
        
        // Filtro de projeto
        const projeto = document.getElementById('filterProject').value;
        if (projeto) {
            data = data.filter(item => item.projeto === projeto);
        }
        
        // Filtro de status
        const status = document.getElementById('filterStatus').value;
        if (status) {
            const statusMap = {
                'conciliado': 'CONCILIADO',
                'nao_provisionado': 'ATRASADO', // Mapeado para o termo do seu CSV
                'pendente': 'PENDENTE'
            };
            data = data.filter(item => (item.statusConciliacao || '').toUpperCase().includes(statusMap[status]));
        }
        
        // Filtro de tipo
        const tipo = document.getElementById('filterType').value;
        if (tipo) {
            data = data.filter(item => item.tipo === tipo);
        }
        
        // Filtro de busca
        const search = document.getElementById('searchTable').value.toLowerCase();
        if (search) {
            data = data.filter(item => 
                item.descricao.toLowerCase().includes(search) ||
                item.projeto.toLowerCase().includes(search) ||
                this.formatDateBR(item.data).includes(search)
            );
        }
        
        // Ordenar por data (mais antiga primeiro)
        data.sort((a, b) => new Date(a.data) - new Date(b.data));
        
        return data;
    }
    
    getDateRange() {
        const period = document.getElementById('filterPeriod').value;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let dataInicial, dataFinal;
        
        switch (period) {
            case 'today':
                dataInicial = new Date(today);
                dataFinal = new Date(today);
                break;
            case 'week':
                dataInicial = new Date(today);
                dataFinal = new Date(today);
                dataFinal.setDate(dataFinal.getDate() + 7);
                break;
            case 'month':
                dataInicial = new Date(today.getFullYear(), today.getMonth(), 1);
                dataFinal = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'custom':
                dataInicial = new Date(document.getElementById('dateStart').value);
                dataFinal = new Date(document.getElementById('dateEnd').value);
                break;
            default:
                dataInicial = new Date(today.getFullYear(), today.getMonth(), 1);
                dataFinal = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        }
        
        return { dataInicial, dataFinal };
    }
    
    // Atualizar lista de projetos no filtro
    updateProjectFilter() {
        const projetos = new Set();
        this.transacoesConciliadas.forEach(item => {
            if (item.projeto && item.projeto !== 'N/A') {
                projetos.add(item.projeto);
            }
        });
        
        const select = document.getElementById('filterProject');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">Todos</option>' +
            Array.from(projetos).sort().map(p => 
                `<option value="${p}">${this.escapeHtml(p)}</option>`
            ).join('');
        
        select.value = currentValue;
    }
    
    // ==========================================
    // EXPORTAÇÃO XLSX
    // ==========================================
    
    exportToXLSX() {
        const data = this.getFilteredData();
        
        if (data.length === 0) {
            alert('Nenhum dado para exportar!');
            return;
        }
        
        // Preparar dados para exportação
        const exportData = data.map(item => ({
            'Data': this.formatDateBR(item.data),
            'Descrição': item.descricao,
            'Projeto': item.projeto,
            'Categoria': item.categoria || 'Sem categoria',
            'Previsto': this.formatCurrency(item.valorPrevisto),
            'Realizado': this.formatCurrency(item.valorRealizado),
            'Status': item.statusConciliacao,
            'Tipo': item.tipo === 'entrada' ? 'Entrada' : 'Saída'
        }));
        
        // Criar workbook e worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Ajustar largura das colunas
        ws['!cols'] = [
            { wch: 12 }, // Data
            { wch: 40 }, // Descrição
            { wch: 20 }, // Projeto
            { wch: 30 }, // Categoria
            { wch: 15 }, // Previsto
            { wch: 15 }, // Realizado
            { wch: 20 }, // Status
            { wch: 10 }  // Tipo
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');
        
        // Gerar arquivo
        const filename = `Engelinhas_Auditoria_${this.formatDateFile(new Date())}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        console.log('✅ Exportação XLSX concluída:', filename);
    }
    
    // ==========================================
    // FUNÇÕES DE FORMATAÇÃO (CFO RULES)
    // ==========================================
    
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }
    
    formatDateBR(date) {
        if (!date) return '-';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).substring(2);
        return `${day}/${month}/${year}`;
    }
    
    formatDateAPI(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
    
    formatDateInput(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    formatDateFile(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ==========================================
    // UI HELPERS
    // ==========================================
    
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
    
    showError(message) {
        alert(message); // Em produção, usar um toast/notification mais elegante
    }
    
    updateLastUpdateTime() {
        const now = new Date();
        document.getElementById('lastUpdate').textContent = 
            now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    changePage(delta) {
        this.currentPage += delta;
        this.updateTable();
    }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ControladoriaApp();
});
