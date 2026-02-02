// ============================================
// ENGELINHAS - DASHBOARD DE CONTROLADORIA
// Auditoria e Fluxo de Caixa (Versão CFO Auditor)
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
        this.saldoBancario = 0; 
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeFilters();
        this.loadFromCache(); 
        this.showLoading(false);
        console.log('✅ Dashboard Engelinhas inicializado');
    }
    
    setupEventListeners() {
        // Upload OFX
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('ofxFile');
        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragging'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragging');
                const file = e.dataTransfer.files[0];
                if (file && file.name.endsWith('.ofx')) this.processOFX(file);
            });
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.processOFX(file);
            });
        }

        // Upload CSV/XLSX Omie
        const dropZoneOmie = document.getElementById('dropZoneOmie');
        const omieFileInput = document.getElementById('omieFile');
        if (dropZoneOmie && omieFileInput) {
            dropZoneOmie.addEventListener('click', () => omieFileInput.click());
            dropZoneOmie.addEventListener('dragover', (e) => { e.preventDefault(); dropZoneOmie.classList.add('dragging'); });
            dropZoneOmie.addEventListener('dragleave', () => dropZoneOmie.classList.remove('dragging'));
            dropZoneOmie.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZoneOmie.classList.remove('dragging');
                const file = e.dataTransfer.files[0];
                if (file) this.processOmieFile(file);
            });
            omieFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.processOmieFile(file);
            });
        }
        
        // Filtros e Ações
        document.getElementById('filterPeriod').addEventListener('change', (e) => {
            const customRange = document.getElementById('customDateRange');
            e.target.value === 'custom' ? customRange.classList.remove('hidden') : customRange.classList.add('hidden');
            this.updateDashboard();
        });
        
        const filterIds = ['filterProject', 'filterCategoria', 'filterStatus', 'filterType', 'dateStart', 'dateEnd'];
        filterIds.forEach(id => document.getElementById(id).addEventListener('change', () => this.updateDashboard()));
        
        document.getElementById('searchTable').addEventListener('input', () => this.applyFilters());
        document.getElementById('btnRefresh').addEventListener('click', () => this.refreshData());
        document.getElementById('btnExport').addEventListener('click', () => this.exportToXLSX());
        document.getElementById('btnEditSaldo').addEventListener('click', () => this.editarSaldo());
        document.getElementById('btnClear').addEventListener('click', () => this.limparDados());
        
        // Paginação
        document.getElementById('btnPrevPage').addEventListener('click', () => this.changePage(-1));
        document.getElementById('btnNextPage').addEventListener('click', () => this.changePage(1));
        document.getElementById('btnShowAll').addEventListener('click', () => this.showAll());
    }
    
    initializeFilters() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        document.getElementById('dateStart').value = this.formatDateInput(startOfMonth);
        document.getElementById('dateEnd').value = this.formatDateInput(endOfMonth);
    }
    
    // ==========================================
    // PROCESSAMENTO SEM TRAVAS (DUPLICIDADE OK)
    // ==========================================
    
    async processOFX(file) {
        this.showLoading(true);
        const status = document.getElementById('ofxStatus');
        try {
            const text = await file.text();
            const ofxData = this.parseOFXManual(text);
            if (!ofxData || ofxData.length === 0) throw new Error('Arquivo vazio');
            
            // Aceita tudo sem filtrar duplicatas
            this.ofxData = [...this.ofxData, ...ofxData];
            status.innerHTML = `<i class="fas fa-check-circle text-green-500"></i> ${ofxData.length} transações importadas`;
            
            this.realizarConciliacao();
            this.updateDashboard();
            this.saveToCache();
        } catch (error) {
            status.innerHTML = `<i class="fas fa-exclamation-circle text-red-500"></i> Erro: ${error.message}`;
        } finally { this.showLoading(false); }
    }
    
    async processOmieFile(file) {
        this.showLoading(true);
        const status = document.getElementById('omieStatus');
        try {
            let data = file.name.endsWith('.csv') ? await this.parseCSV(file) : await this.parseXLSX(file);
            if (!data || data.length === 0) throw new Error('Nenhum dado encontrado');
            
            // Aceita tudo sem filtrar duplicatas
            this.contasPagar = [...this.contasPagar, ...data];
            status.innerHTML = `<i class="fas fa-check-circle text-green-500"></i> ${data.length} itens importados`;
            
            this.realizarConciliacao();
            this.updateDashboard();
            this.saveToCache();
        } catch (error) {
            status.innerHTML = `<i class="fas fa-exclamation-circle text-red-500"></i> Erro: ${error.message}`;
        } finally { this.showLoading(false); }
    }

    // ==========================================
    // CONCILIAÇÃO E DASHBOARD
    // ==========================================

    realizarConciliacao() {
        this.transacoesConciliadas = [];
        const contasMap = new Map();
        this.contasPagar.forEach(conta => {
            const key = this.getConciliacaoKey(conta.data, conta.valor);
            if (!contasMap.has(key)) contasMap.set(key, []);
            contasMap.get(key).push(conta);
        });

        this.ofxData.forEach(transacao => {
            const key = this.getConciliacaoKey(transacao.data, Math.abs(transacao.valor));
            const contasMatch = contasMap.get(key);
            let contaConciliada = (contasMatch && contasMatch.length > 0) ? contasMatch.shift() : null;
            
            this.transacoesConciliadas.push({
                ...transacao,
                statusConciliacao: contaConciliada ? contaConciliada.status : 'NAO_PROVISIONADO',
                contaOmie: contaConciliada,
                valorPrevisto: contaConciliada ? contaConciliada.valor : 0,
                valorRealizado: Math.abs(transacao.valor),
                projeto: contaConciliada ? contaConciliada.projeto : 'N/A',
                categoria: contaConciliada ? contaConciliada.categoria : 'Sem categoria'
            });
        });

        contasMap.forEach(contasRestantes => {
            contasRestantes.forEach(conta => {
                this.transacoesConciliadas.push({
                    data: conta.data,
                    descricao: conta.descricao,
                    valor: -conta.valor,
                    tipo: 'saida',
                    statusConciliacao: conta.status,
                    contaOmie: conta,
                    valorPrevisto: conta.valor,
                    valorRealizado: 0,
                    projeto: conta.projeto,
                    categoria: conta.categoria || 'Sem categoria',
                    origem: 'OMIE'
                });
            });
        });
    }

    getConciliacaoKey(data, valor) {
        return `${this.formatDateBR(data)}_${Math.abs(valor).toFixed(2)}`;
    }

    updateDashboard() {
        this.updateKPIs();
        this.updateChart(30);
        this.updateProjectFilter();
        this.updateCategoriaFilter();
        this.updateTop5Categorias();
        this.updateTable();
    }

    // ==========================================
    // HELPERS E FORMATADORES (R$ 0.000,00)
    // ==========================================

    limparDados() {
        if (confirm('Deseja apagar todos os dados importados?')) {
            this.contasPagar = [];
            this.ofxData = [];
            this.transacoesConciliadas = [];
            this.saldoBancario = 0;
            localStorage.removeItem('engelinhas_cache');
            this.updateDashboard();
            alert('✅ Sistema limpo.');
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    formatDateBR(date) {
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).substring(2)}`;
    }

    // Métodos auxiliares de UI, KPIs e Gráficos continuam conforme sua versão original...
    // (Abaixo seguem apenas os stubs necessários para o funcionamento básico)
    
    showLoading(show) { document.getElementById('loadingOverlay').classList.toggle('hidden', !show); }
    applyFilters() { this.currentPage = 1; this.updateTable(); }
    saveToCache() { /* Implementação original */ }
    loadFromCache() { /* Implementação original */ }
    updateKPIs() { /* Implementação original */ }
    updateTable() { /* Implementação original */ }
    updateChart(days) { /* Implementação original */ }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new ControladoriaApp(); });
