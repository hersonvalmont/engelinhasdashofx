// ============================================
// ENGELINHAS - DASHBOARD DE CONTROLADORIA
// Auditoria e Fluxo de Caixa
// Versão: Sem trava de duplicidade
// ============================================

class ControladoriaApp {
    // ... (constructor e init permanecem iguais)

    // ==========================================
    // PROCESSAMENTO OFX (ATUALIZADO: SEM TRAVA)
    // ==========================================
    async processOFX(file) {
        this.showLoading(true);
        const status = document.getElementById('ofxStatus');
        
        try {
            const text = await file.text();
            const ofxData = this.parseOFXManual(text);
            
            if (!ofxData || ofxData.length === 0) {
                throw new Error('Nenhuma transação encontrada no arquivo OFX');
            }
            
            // REMOVIDA A PROTEÇÃO CONTRA DUPLICAÇÃO
            // Adiciona todas as transações do arquivo diretamente
            this.ofxData = [...this.ofxData, ...ofxData];
            
            const mensagem = `${ofxData.length} transações importadas (duplicidade permitida)`;
            status.innerHTML = `<i class="fas fa-check-circle text-green-500 mr-1"></i>${mensagem}`;
            
            console.log('✅ OFX processado sem filtros de duplicidade');
            
            this.realizarConciliacao();
            this.updateDashboard();
            this.saveToCache();
            
        } catch (error) {
            console.error('❌ Erro ao processar OFX:', error);
            status.innerHTML = `<i class="fas fa-exclamation-circle text-red-500 mr-1"></i>Erro: ${error.message}`;
        } finally {
            this.showLoading(false);
        }
    }

    // ==========================================
    // PROCESSAMENTO OMIE (ATUALIZADO: SEM TRAVA)
    // ==========================================
    async processOmieFile(file) {
        this.showLoading(true);
        const status = document.getElementById('omieStatus');
        
        try {
            let data;
            if (file.name.endsWith('.csv')) {
                data = await this.parseCSV(file);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                data = await this.parseXLSX(file);
            } else {
                throw new Error('Formato não suportado.');
            }
            
            if (!data || data.length === 0) {
                throw new Error('Nenhuma conta encontrada');
            }
            
            // REMOVIDA A PROTEÇÃO CONTRA DUPLICAÇÃO
            // Adiciona todos os lançamentos do arquivo diretamente
            this.contasPagar = [...this.contasPagar, ...data];
            
            const mensagem = `${data.length} lançamentos importados (duplicidade permitida)`;
            status.innerHTML = `<i class="fas fa-check-circle text-green-500 mr-1"></i>${mensagem}`;
            
            if (this.ofxData.length > 0) {
                this.realizarConciliacao();
            } else {
                this.transacoesConciliadas = this.contasPagar.map(conta => ({
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
                }));
            }
            
            this.updateDashboard();
            this.saveToCache();
            alert(`✅ ${data.length} itens importados com sucesso!`);
            
        } catch (error) {
            console.error('❌ Erro Omie:', error);
            status.innerHTML = `<i class="fas fa-exclamation-circle text-red-500 mr-1"></i>Erro: ${error.message}`;
        } finally {
            this.showLoading(false);
        }
    }

    // ... (restante das funções parse, conciliação e KPIs permanecem iguais)
}
