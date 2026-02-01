# 📖 Manual do Usuário - Dashboard Engelinhas

## Bem-vindo ao Dashboard de Controladoria!

Este manual vai te ajudar a usar todas as funcionalidades do sistema de forma eficiente.

---

## 🎯 Objetivo do Sistema

O Dashboard de Controladoria foi desenvolvido para:
- ✅ **Conciliar** automaticamente transações bancárias com contas a pagar
- ✅ **Auditar** discrepâncias entre previsto (Omie) e realizado (Banco)
- ✅ **Visualizar** fluxo de caixa em tempo real
- ✅ **Analisar** KPIs financeiros importantes
- ✅ **Exportar** relatórios para Excel

---

## 🚀 Primeiros Passos

### 1. Acessar o Dashboard
Abra o navegador e acesse:
```
https://seu-site.netlify.app
```

### 2. Interface Principal

**Sidebar (Esquerda)**:
- Upload de OFX
- Filtros de período, projeto, status e tipo
- Botões de ação (Atualizar/Exportar)

**Área Principal (Direita)**:
- 4 Cards de KPIs no topo
- Gráfico de Fluxo de Caixa no centro
- Tabela de Auditoria na parte inferior

---

## 📊 Entendendo os KPIs

### Card 1: Saldo Bancário 💰
- **O que é**: Soma de todas as transações do arquivo OFX
- **Cor do indicador**:
  - 🟢 Verde (positivo): Saldo positivo
  - 🔴 Vermelho (negativo): Saldo negativo
- **Atualização**: Ao importar novo OFX

### Card 2: A Pagar Hoje 📅
- **O que é**: Total de contas com vencimento hoje
- **Fonte**: API Omie (Contas a Pagar)
- **Atualização**: Ao clicar em "Atualizar Dados"

### Card 3: A Pagar (7 dias) 📆
- **O que é**: Total de contas vencendo nos próximos 7 dias
- **Fonte**: API Omie
- **Uso**: Planejamento de caixa semanal

### Card 4: Projeção de Saldo 📈
- **O que é**: Saldo Bancário - Contas a Pagar (7 dias)
- **Fórmula**: `Saldo Atual - Total a Pagar`
- **Status**:
  - ✅ "Saudável": Projeção positiva
  - ⚠️ "Atenção": Projeção negativa

---

## 📁 Importando Arquivos OFX

### O que é um arquivo OFX?
OFX (Open Financial Exchange) é o formato padrão de extrato bancário. Todos os bancos brasileiros fornecem.

### Como obter o OFX do seu banco?

**Banco do Brasil**:
1. Internet Banking > Extratos
2. Selecione período
3. "Baixar OFX"

**Itaú**:
1. iBank > Conta Corrente > Extrato
2. Exportar > OFX

**Bradesco**:
1. Internet Banking > Contas > Extrato
2. Formato OFX

**Santander**:
1. Conta > Extrato
2. Download > OFX

**Caixa**:
1. Internet Banking > Extratos
2. Formato OFX

### Como Importar no Dashboard

**Método 1: Arrastar e Soltar**
1. Localize a área "Importar OFX" na sidebar
2. Arraste o arquivo `.ofx` do seu computador
3. Solte na área azul
4. Aguarde o processamento (instantâneo)

**Método 2: Clicar e Selecionar**
1. Clique na área "Importar OFX"
2. Janela de seleção abre
3. Escolha o arquivo `.ofx`
4. Clique em "Abrir"

### Confirmação de Importação
Você verá uma mensagem:
```
✅ 25 transações importadas
```

**Importante**: 
- ⚠️ O arquivo OFX **NÃO é enviado ao servidor**
- ✅ Processamento 100% no seu navegador
- ✅ Total privacidade dos seus dados bancários

---

## 🔄 Atualizando Dados do Omie

### Quando usar?
- Ao abrir o dashboard pela primeira vez no dia
- Após lançar novas contas a pagar no Omie
- Para atualizar status de pagamentos

### Como fazer?
1. Na sidebar, clique em **"Atualizar Dados"**
2. Aguarde carregamento (5-10 segundos)
3. Sistema busca:
   - Contas a pagar do período selecionado
   - Dados de projetos/centros de custo
4. Conciliação automática é executada

### O que acontece?
- KPIs são atualizados
- Gráfico é recalculado
- Tabela mostra status de conciliação

---

## 🎨 Entendendo os Status de Conciliação

### 🟢 CONCILIADO
**Significado**: Transação bancária tem correspondente no Omie

**Quando aparece**:
- Data e valor coincidem entre OFX e Omie
- Conta foi provisionada E executada

**Exemplo**:
- Omie: Pagar R$ 1.500,00 em 15/01
- OFX: Débito de R$ 1.500,00 em 15/01
- ✅ Status: CONCILIADO

### 🟡 NÃO PROVISIONADO
**Significado**: Débito no banco SEM previsão no Omie

**Quando aparece**:
- Há movimentação no banco
- MAS não há conta a pagar correspondente no Omie

**Exemplo**:
- OFX: Débito de R$ 850,00 em 12/01 (Energia Elétrica)
- Omie: Não tem previsão deste pagamento
- ⚠️ Status: NÃO PROVISIONADO

**Ação Recomendada**:
1. Verificar se foi esquecido de lançar no Omie
2. Lançar retroativamente
3. Atualizar dados

### 🔴 PENDENTE
**Significado**: Conta provisionada no Omie MAS não executada ainda

**Quando aparece**:
- Há conta a pagar no Omie
- MAS não há débito correspondente no banco

**Exemplo**:
- Omie: Pagar R$ 3.500,00 em 10/01 (Aluguel)
- OFX: Não tem este débito
- ⏳ Status: PENDENTE

**Ação Recomendada**:
- Verificar se pagamento está programado
- Confirmar se há saldo para pagamento

---

## 🔍 Usando os Filtros

### Filtro 1: Período 📅

**Este Mês (Janeiro)**:
- Padrão ao abrir
- Mostra todo o mês atual

**Esta Semana**:
- Próximos 7 dias a partir de hoje

**Hoje**:
- Apenas transações de hoje

**Personalizado**:
- Selecione data inicial e final manualmente

### Filtro 2: Projeto / Centro de Custo 🏢

**Uso**:
- Analisar gastos por departamento
- Comparar projetos específicos

**Exemplo**:
- Filtrar apenas "PROJETO-001"
- Ver todos os gastos deste projeto

### Filtro 3: Status de Pagamento ✅

**Todos**: Sem filtro

**Conciliado**: Apenas transações em dia

**Não Provisionado**: Apenas discrepâncias

**Pendente**: Apenas contas não pagas

### Filtro 4: Tipo de Lançamento 💸

**Todos**: Entradas e saídas

**Entrada** (🟢): Apenas recebimentos

**Saída** (🔴): Apenas pagamentos

---

## 📈 Interpretando o Gráfico

### Visualização
- **Linha Azul**: Previsto (dados do Omie)
- **Linha Verde**: Realizado (dados do OFX)

### Alternância de Período
- **7 dias**: Visão semanal, mais detalhada
- **30 dias**: Visão mensal, panorâmica

### Análise

**Caso 1: Linhas Coincidentes**
- ✅ Ótimo! Previsão e realização estão alinhadas
- Gestão de caixa eficiente

**Caso 2: Verde Acima do Azul**
- ⚠️ Gastando mais que o previsto
- Revisar orçamento

**Caso 3: Verde Abaixo do Azul**
- ✅ Gastando menos que o previsto
- Sobra de caixa

**Caso 4: Muito Espaço Entre Linhas**
- ⚠️ Planejamento desalinhado da realidade
- Revisar projeções

---

## 📋 Usando a Tabela de Auditoria

### Colunas

**Data**: Data da transação (DD/MM/AA)

**Descrição**: Detalhes do lançamento

**Projeto**: Centro de custo associado

**Previsto**: Valor no Omie (R$ 0.000,00)

**Realizado**: Valor no banco (R$ 0.000,00)

**Status**: Badge colorido (Conciliado/Não Provisionado/Pendente)

**Tipo**: Entrada 🟢 ou Saída 🔴

### Busca Rápida 🔎
- Digite no campo "Buscar..."
- Busca em tempo real
- Procura em: Descrição, Projeto e Data

### Paginação
- 20 registros por página
- Navegue com ◀ Anterior | Próxima ▶
- Veja totais no rodapé

---

## 📥 Exportando Relatórios

### Quando Exportar?
- Final do mês (fechamento)
- Antes de reuniões com diretoria
- Para auditoria externa
- Backup de dados

### Como Exportar?

1. **Aplique os filtros desejados**
   - Período, projeto, status, tipo
   - A exportação respeita os filtros!

2. **Clique em "Exportar XLSX"**
   - Botão verde na sidebar

3. **Arquivo é baixado automaticamente**
   - Nome: `Engelinhas_Auditoria_AAAAMMDD.xlsx`
   - Formato: Excel (.xlsx)

### O que vem no Excel?

**Colunas**:
- Data (DD/MM/AA)
- Descrição
- Projeto
- Previsto (R$ formatado)
- Realizado (R$ formatado)
- Status (texto)
- Tipo (Entrada/Saída)

**Formatação**:
- ✅ Datas brasileiras
- ✅ Valores monetários formatados
- ✅ Colunas auto-ajustadas
- ✅ Pronto para usar em relatórios

---

## 💡 Dicas de Uso Profissional

### Rotina Diária 📅
```
1. Abrir o dashboard
2. Atualizar dados do Omie
3. Verificar KPI "A Pagar Hoje"
4. Conferir se há "Não Provisionados"
5. Resolver discrepâncias
```

### Rotina Semanal 📆
```
1. Baixar OFX do banco (semanal)
2. Importar no dashboard
3. Analisar gráfico de 7 dias
4. Verificar projeção de saldo
5. Planejar pagamentos da semana
```

### Fechamento Mensal 📊
```
1. Baixar OFX do mês completo
2. Importar no dashboard
3. Filtrar por "Não Provisionado"
4. Lançar no Omie as contas faltantes
5. Atualizar dados
6. Verificar que todos estão "Conciliados"
7. Exportar XLSX para arquivo
8. Gerar gráfico de 30 dias
9. Screenshot para apresentação
```

### Auditoria 🔍
```
1. Filtrar por "Não Provisionado"
2. Investigar cada transação amarela
3. Procurar documentação (notas, recibos)
4. Lançar no Omie com justificativa
5. Atualizar e verificar conciliação
```

---

## ❓ Perguntas Frequentes (FAQ)

### 1. Preciso importar OFX todo dia?
**R**: Não necessariamente. Importe:
- Semanalmente para acompanhamento
- Mensalmente para fechamento
- Ou quando precisar analisar novos dados

### 2. O arquivo OFX vai para o servidor?
**R**: NÃO! O processamento é 100% no seu navegador. Seus dados bancários nunca saem do seu computador.

### 3. Posso usar OFX de vários bancos?
**R**: Sim! Importe quantos OFXs quiser. O sistema processa tudo junto.

### 4. E se eu importar o mesmo OFX duas vezes?
**R**: As transações serão duplicadas. Atualize a página (F5) para resetar.

### 5. Quanto tempo os dados ficam salvos?
**R**: Dados do OFX ficam apenas enquanto a página está aberta. Ao fechar, precisa reimportar. Dados do Omie são buscados sempre que você atualiza.

### 6. Funciona offline?
**R**: O processamento OFX funciona offline. Mas buscar dados do Omie requer internet.

### 7. Posso usar no celular?
**R**: Sim! O design é responsivo. Mas é mais confortável no desktop.

### 8. Como corrigir uma transação "Não Provisionada"?
**R**: 
1. Vá no Omie
2. Crie a conta a pagar com a data e valor corretos
3. Volte ao dashboard
4. Clique em "Atualizar Dados"
5. Status deve mudar para "Conciliado"

### 9. O gráfico está vazio, por quê?
**R**: Precisa ter dados tanto do OFX quanto do Omie. Importe o OFX e clique em "Atualizar Dados".

### 10. Posso compartilhar o link do dashboard?
**R**: Sim, mas todos com acesso verão os mesmos dados. Não há autenticação por usuário ainda.

---

## 🆘 Suporte

### Em caso de problemas:

1. **Atualize a página** (F5)
2. **Limpe o cache** (Ctrl + Shift + R)
3. **Verifique o console** (F12 > Console)
4. **Tente outro navegador** (Chrome, Firefox)

### Navegadores Recomendados:
- ✅ Google Chrome (versão 90+)
- ✅ Mozilla Firefox (versão 88+)
- ✅ Microsoft Edge (versão 90+)
- ⚠️ Safari (pode ter limitações)

---

## 📞 Contato

Para sugestões, bugs ou dúvidas:
- 📧 Email: suporte@engelinhas.com.br
- 📱 WhatsApp: (XX) XXXXX-XXXX
- 🌐 Site: https://engelinhas.com.br

---

**Manual do Usuário v1.0** | Dashboard Engelinhas | Janeiro 2024

✨ Use com inteligência, gerencie com eficiência!
