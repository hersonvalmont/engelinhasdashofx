# Dashboard de Controladoria - Engelinhas

## 📊 Visão Geral

Dashboard completo de Controladoria para auditoria e fluxo de caixa da empresa Engelinhas, com integração híbrida entre API Omie e processamento manual de arquivos OFX.

## ✨ Funcionalidades Implementadas

### 1. **Integração Omie (Real-time)**
- ✅ Busca automática de Contas a Pagar via API
- ✅ Busca de Extrato bancário via API
- ✅ Autenticação segura com variáveis de ambiente
- ✅ Netlify Functions para proxy seguro das requisições

### 2. **Processamento OFX (Manual)**
- ✅ Upload de arquivos .ofx via Drag & Drop
- ✅ Parser OFX 100% client-side (privacidade total)
- ✅ Extração automática de transações bancárias
- ✅ Suporte para múltiplos formatos OFX

### 3. **Lógica de Conciliação (CFO Rules)**
- ✅ Cruzamento automático entre OFX e Contas a Pagar
- ✅ Marcação de status:
  - **CONCILIADO** (Verde): Valor e data coincidem
  - **NÃO PROVISIONADO** (Amarelo): Débito no banco sem correspondente no Omie
  - **PENDENTE** (Vermelho): Conta a pagar sem movimentação bancária
- ✅ Formatação obrigatória DD/MM/AA e R$ 0.000,00

### 4. **KPIs e Indicadores**
- ✅ Saldo Bancário Atual (soma das transações OFX)
- ✅ Total de Contas a Pagar Hoje
- ✅ Total de Contas a Pagar na Semana (7 dias)
- ✅ Projeção de Saldo (Saldo - Despesas Previstas)

### 5. **Gráfico de Fluxo de Caixa**
- ✅ Chart.js com visualização Previsto vs Realizado
- ✅ Alternância entre 7 dias e 30 dias
- ✅ Design dark mode com gradientes

### 6. **Tabela de Auditoria**
- ✅ Listagem completa de transações conciliadas
- ✅ Paginação com 20 registros por página
- ✅ Busca em tempo real
- ✅ Colunas: Data | Descrição | Projeto | Previsto | Realizado | Status | Tipo

### 7. **Filtros Dinâmicos**
- ✅ Período (Hoje, Semana, Mês, Personalizado)
- ✅ Projeto / Centro de Custo
- ✅ Status de Pagamento
- ✅ Tipo de Lançamento (Entrada/Saída)

### 8. **Exportação XLSX**
- ✅ Exportação da tabela filtrada
- ✅ Mantém formatações CFO (datas e valores)
- ✅ Colunas ajustadas automaticamente

## 🎨 Design

- **Tema**: Dark Mode, estilo "Command Center"
- **Cores**: 
  - Background: `#0a0a0a` (preto profundo)
  - Cards: Glass effect com blur
  - Accent: Blue (`#3b82f6`)
  - Verde: `#22c55e` (Conciliado)
  - Amarelo: `#eab308` (Não Provisionado)
  - Vermelho: `#ef4444` (Pendente)
- **Layout**: Sidebar fixa + Main Content responsivo

## 🚀 Deploy no Netlify

### 1. Pré-requisitos
```bash
# Instalar dependências
npm install
```

### 2. Configurar Variáveis de Ambiente

No painel do Netlify, adicione as seguintes variáveis:
- `OMIE_APP_KEY`: Sua chave de aplicação Omie
- `OMIE_APP_SECRET`: Seu secret da aplicação Omie

### 3. Deploy

**Opção A: Deploy via Git (Recomendado)**
```bash
# Inicializar repositório
git init
git add .
git commit -m "Initial commit - Dashboard Controladoria"

# Conectar com GitHub
git remote add origin https://github.com/seu-usuario/engelinhas-dashboard.git
git push -u origin main

# No Netlify:
# 1. New site from Git
# 2. Conectar ao repositório
# 3. Build command: npm run build
# 4. Publish directory: .
# 5. Add environment variables
```

**Opção B: Deploy Manual via CLI**
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### 4. Verificar Deploy
```bash
# Testar functions
curl https://seu-site.netlify.app/api/omie-contas-pagar

# Acessar dashboard
https://seu-site.netlify.app/
```

## 📁 Estrutura do Projeto

```
webapp/
├── index.html                      # Interface principal
├── app.js                          # Lógica JavaScript (34KB)
├── netlify.toml                    # Configuração Netlify
├── package.json                    # Dependências
├── .env.example                    # Template de variáveis
├── netlify/
│   └── functions/
│       ├── omie-contas-pagar.js   # API proxy para Contas a Pagar
│       └── omie-extrato.js        # API proxy para Extrato
└── README.md                       # Esta documentação
```

## 🔐 Segurança

### Dados Locais (OFX)
- ✅ Processamento 100% client-side
- ✅ Nenhum arquivo OFX é enviado ao servidor
- ✅ Privacidade total dos dados bancários

### API Omie
- ✅ Credenciais armazenadas em variáveis de ambiente
- ✅ Netlify Functions como proxy seguro
- ✅ CORS configurado corretamente
- ✅ Timeout de 30 segundos para requisições

## 📊 Uso do Dashboard

### 1. Importar OFX
1. Clique na área "Importar OFX" na sidebar
2. Selecione ou arraste seu arquivo .ofx
3. Aguarde o processamento (instantâneo)

### 2. Buscar Dados do Omie
1. Clique em "Atualizar Dados" na sidebar
2. O sistema busca automaticamente contas a pagar do período selecionado
3. A conciliação é realizada automaticamente

### 3. Analisar Conciliação
- **Verde (Conciliado)**: Transação bancária corresponde a conta a pagar
- **Amarelo (Não Provisionado)**: Débito no banco sem previsão no Omie
- **Vermelho (Pendente)**: Conta a pagar ainda não executada

### 4. Filtrar e Exportar
1. Use os filtros da sidebar para refinar os dados
2. Busque por descrição, projeto ou data
3. Clique em "Exportar XLSX" para baixar planilha

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica
- **Tailwind CSS**: Estilização via CDN
- **Vanilla JavaScript**: Lógica sem frameworks
- **Chart.js**: Gráficos interativos
- **SheetJS (XLSX)**: Exportação de planilhas
- **Font Awesome**: Ícones
- **Axios**: Cliente HTTP

### Backend
- **Netlify Functions**: Serverless Node.js
- **Node.js**: Runtime das functions
- **Axios**: Requisições para API Omie

### APIs
- **Omie API v1**:
  - `/api/v1/financas/contapagar/` - Contas a Pagar
  - `/api/v1/geral/extrato/` - Extrato Bancário

## 📈 Métricas e Performance

- **Tamanho do Bundle**: ~150KB (HTML + JS + CSS inline)
- **Tempo de Carregamento**: <2s (CDN + cache)
- **Processamento OFX**: Instantâneo (client-side)
- **API Omie**: ~2-5s (depende da quantidade de dados)
- **Exportação XLSX**: <1s (até 1000 registros)

## 🔄 Próximas Funcionalidades (Roadmap)

- [ ] Autenticação de usuários (Netlify Identity)
- [ ] Histórico de conciliações
- [ ] Alertas automáticos por email
- [ ] Dashboard mobile (PWA)
- [ ] Integração com mais bancos (OFB, CSV)
- [ ] Relatórios personalizados
- [ ] API de webhooks para notificações
- [ ] Multi-empresa (suporte a várias contas Omie)

## 📝 Notas Técnicas

### Formato OFX Suportado
```xml
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20240115</DTPOSTED>
            <TRNAMT>-150.00</TRNAMT>
            <FITID>12345</FITID>
            <MEMO>Descrição da transação</MEMO>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
```

### Formato API Omie - Contas a Pagar
```json
{
  "conta_pagar_lista": [
    {
      "codigo_lancamento_omie": 12345,
      "data_vencimento": "15/01/2024",
      "valor_documento": 150.00,
      "observacao": "Descrição",
      "codigo_projeto": "PROJETO-001",
      "status_titulo": "PENDENTE"
    }
  ]
}
```

## 🐛 Troubleshooting

### Problema: API Omie retorna erro 401
**Solução**: Verifique se as variáveis `OMIE_APP_KEY` e `OMIE_APP_SECRET` estão configuradas corretamente no Netlify.

### Problema: Arquivo OFX não é reconhecido
**Solução**: Certifique-se de que o arquivo tem extensão `.ofx` e segue o formato OFX padrão (XML).

### Problema: Gráfico não aparece
**Solução**: Verifique se há dados suficientes para o período selecionado. O gráfico precisa de pelo menos 1 transação.

### Problema: Exportação XLSX falha
**Solução**: Verifique se há dados na tabela após aplicar os filtros.

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Consulte os logs do navegador (F12 > Console)
3. Verifique os logs das Netlify Functions no painel do Netlify

## 📄 Licença

MIT License - Uso livre para Engelinhas e subsidiárias.

---

**Desenvolvido com ❤️ para Engelinhas**

Dashboard de Controladoria v1.0.0 | Janeiro 2024
