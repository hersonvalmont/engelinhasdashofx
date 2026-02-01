# 📊 Guia de Upload CSV/XLSX - Omie

## Como Exportar do Omie

### Opção 1: Contas a Pagar

1. Acesse o Omie: https://app.omie.com.br/
2. Menu > **Financeiro** > **Contas a Pagar**
3. Selecione o período desejado
4. Clique em **Exportar** (ícone de download)
5. Escolha o formato:
   - **CSV** (recomendado - mais leve)
   - **XLSX** (Excel)
6. Salve o arquivo

### Opção 2: Relatórios Personalizados

1. Menu > **Relatórios** > **Financeiro**
2. Escolha: "Contas a Pagar - Detalhado"
3. Configure o período
4. Clique em **Gerar Relatório**
5. **Exportar para Excel** ou **CSV**

---

## Formatos Suportados

### ✅ Arquivos Aceitos
- `.csv` - CSV (Comma Separated Values)
- `.xlsx` - Excel 2007+
- `.xls` - Excel 97-2003

### 📋 Colunas Obrigatórias

O arquivo DEVE conter pelo menos estas colunas:

| Coluna | Variações Aceitas | Exemplo |
|--------|-------------------|---------|
| **Data** | Data de Vencimento, Data, Dt. Vencimento, Vencimento | 15/01/2024 |
| **Valor** | Valor, Total, Vl. Documento, Valor Documento | 1.500,00 |

### 📋 Colunas Opcionais (Recomendadas)

| Coluna | Variações Aceitas | Exemplo |
|--------|-------------------|---------|
| Descrição | Descrição, Observação, Histórico, Título | Pagamento Fornecedor ABC |
| Projeto | Projeto, Centro de Custo, Departamento | PROJETO-001 |
| Status | Status, Situação | PENDENTE, PAGO |

---

## Formatos de Data Aceitos

O sistema reconhece automaticamente:

- ✅ `DD/MM/YYYY` - 15/01/2024
- ✅ `DD/MM/YY` - 15/01/24
- ✅ `YYYY-MM-DD` - 2024-01-15 (ISO)
- ✅ Serial do Excel - 45307

---

## Formatos de Valor Aceitos

O sistema reconhece automaticamente:

- ✅ `1500.00` - Ponto como decimal
- ✅ `1.500,00` - Formato brasileiro
- ✅ `1,500.00` - Formato americano
- ✅ `R$ 1.500,00` - Com símbolo de moeda
- ✅ `$1,500.00` - Com cifrão

---

## Exemplo de CSV do Omie

```csv
Data de Vencimento,Valor,Descrição,Projeto,Status
05/01/2024,1500.00,Pagamento Fornecedor ABC,ADMINISTRATIVO,PENDENTE
05/01/2024,25000.00,Folha Salarial Janeiro,RH,PENDENTE
08/01/2024,5000.00,Recebimento Cliente XYZ,COMERCIAL,PAGO
10/01/2024,3500.00,Aluguel Janeiro,ADMINISTRATIVO,PENDENTE
```

**Arquivo de exemplo incluído**: `exemplo-omie-contas-pagar.csv`

---

## Como Usar no Dashboard

### 1. Importar Arquivo

**Método A: Drag & Drop**
1. Localize a seção "Importar Omie (CSV/XLSX)"
2. Arraste o arquivo e solte na área verde

**Método B: Clique**
1. Clique na área "Importar Omie (CSV/XLSX)"
2. Selecione o arquivo
3. Clique em "Abrir"

### 2. Confirmação

Você verá uma mensagem:
```
✅ 10 contas a pagar importadas do Omie!
```

### 3. Visualização

- Os dados aparecem na **tabela de auditoria**
- **KPIs** são atualizados automaticamente
- **Gráfico** mostra as contas a pagar

### 4. Conciliação com OFX

Se você também importar um arquivo **OFX** (banco):
- O sistema **concilia automaticamente**
- Mostra status: 🟢 Conciliado, 🟡 Não Provisionado, 🔴 Pendente

---

## Dicas de Uso

### ✅ Melhores Práticas

1. **Use CSV** quando possível (mais rápido)
2. **Inclua todas as colunas** (data, valor, descrição, projeto)
3. **Verifique o período** antes de exportar
4. **Exporte e importe regularmente** (diário/semanal)

### 🔄 Fluxo de Trabalho Recomendado

**Opção 1: Omie + OFX (Conciliação Completa)**
```
1. Exportar CSV do Omie (Contas a Pagar)
2. Baixar OFX do banco
3. Importar CSV no dashboard
4. Importar OFX no dashboard
5. Sistema concilia automaticamente
6. Verificar status: Verde/Amarelo/Vermelho
```

**Opção 2: Apenas Omie (Planejamento)**
```
1. Exportar CSV do Omie
2. Importar no dashboard
3. Visualizar contas a pagar
4. Analisar projeções
```

**Opção 3: API + OFX (Automatizado)**
```
1. Configurar credenciais Omie no Netlify
2. Clicar em "Atualizar via API Omie"
3. Importar OFX do banco
4. Conciliação automática
```

---

## Troubleshooting

### Erro: "Arquivo CSV vazio ou inválido"

**Causa**: Arquivo não tem dados ou formato incorreto.

**Solução**:
- Abra o CSV em editor de texto
- Verifique se tem pelo menos 2 linhas (header + 1 dado)
- Verifique se o separador é vírgula ou ponto-e-vírgula

---

### Erro: "Planilha vazia ou inválida"

**Causa**: Arquivo XLSX não tem dados.

**Solução**:
- Abra o Excel/LibreOffice
- Verifique se a primeira aba tem dados
- Salve novamente

---

### Erro: "Não contém colunas obrigatórias"

**Causa**: Faltam colunas de Data ou Valor.

**Solução**:
- Verifique se o CSV/XLSX tem colunas:
  - "Data de Vencimento" ou "Data" ou "Vencimento"
  - "Valor" ou "Total" ou "Vl. Documento"
- Renomeie as colunas se necessário

---

### Aviso: "Nenhuma conta a pagar encontrada"

**Causa**: Todas as linhas foram ignoradas (datas ou valores inválidos).

**Solução**:
- Abra o Console (F12)
- Veja os logs de processamento
- Verifique formato de data (DD/MM/YYYY)
- Verifique formato de valor (números válidos)

---

### Problema: Valores Incorretos

**Causa**: Formato de número não reconhecido.

**Solução**:
- Use ponto ou vírgula como decimal
- Remova símbolos extras (exceto R$)
- Exemplos válidos:
  - ✅ 1500.00
  - ✅ 1.500,00
  - ✅ R$ 1.500,00
  - ❌ 1 500,00 (espaço)
  - ❌ R$1.500.00 (múltiplos pontos)

---

### Problema: Datas Incorretas

**Causa**: Formato de data não reconhecido.

**Solução**:
- Use DD/MM/YYYY ou DD/MM/YY
- Exemplos válidos:
  - ✅ 15/01/2024
  - ✅ 15/01/24
  - ✅ 2024-01-15
  - ❌ 2024/01/15
  - ❌ 15-01-2024

---

## Comparação: API vs CSV/XLSX

| Característica | API Omie | CSV/XLSX |
|----------------|----------|----------|
| **Velocidade** | Rápido | Muito Rápido |
| **Configuração** | Requer credenciais | Nenhuma |
| **Atualização** | Automática | Manual |
| **Limite de dados** | 500 registros/vez | Ilimitado |
| **Offline** | ❌ Não | ✅ Sim |
| **Segurança** | Credenciais no servidor | Arquivo local |
| **Recomendado para** | Uso diário | Análises pontuais |

---

## Perguntas Frequentes

### 1. Posso usar os dois (API e CSV)?
**Sim!** Você pode usar ambos. O sistema detecta a origem e processa corretamente.

### 2. Qual formato é melhor: CSV ou XLSX?
**CSV** é mais rápido e leve. **XLSX** preserva formatação do Excel.

### 3. Preciso renomear as colunas?
**Não!** O sistema detecta automaticamente variações comuns de nomes.

### 4. Quantos registros posso importar?
**Ilimitado** via CSV/XLSX. Via API: 500 por vez.

### 5. Os dados ficam salvos?
**Não.** Dados são processados **100% no navegador**. Ao fechar a página, precisa reimportar.

### 6. Posso importar múltiplos arquivos?
**Sim**, mas o último sobrescreve o anterior. Para múltiplos períodos, combine os CSVs antes.

### 7. Como exportar múltiplos meses do Omie?
No Omie, selecione o período maior (ex: 01/01/2024 a 31/12/2024) antes de exportar.

---

## Arquivo de Teste Incluído

**Nome**: `exemplo-omie-contas-pagar.csv`

**Conteúdo**: 10 contas a pagar fictícias de janeiro/2024

**Como usar**:
1. Faça upload deste arquivo para testar
2. Sistema importa 10 registros
3. Veja a tabela, KPIs e gráfico

---

**Atualizado**: 01/02/2026 | Dashboard Engelinhas v1.2.0
