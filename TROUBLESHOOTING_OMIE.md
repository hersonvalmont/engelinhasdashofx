# 🔧 Guia de Troubleshooting - API Omie

## Problema: Não está puxando dados do Omie

### ✅ Checklist de Verificação

#### 1. **Variáveis de Ambiente no Netlify**

**No painel do Netlify:**
1. Acesse: `Site settings` > `Environment variables`
2. Verifique se existem:
   - `OMIE_APP_KEY` = sua chave
   - `OMIE_APP_SECRET` = seu secret

**Como obter as credenciais Omie:**
```
1. Acesse: https://app.omie.com.br/
2. Menu > Configurações > Integrações > API
3. Clique em "Gerar Chave de Integração"
4. Copie o App Key e App Secret
```

**⚠️ IMPORTANTE**: Após adicionar/modificar variáveis de ambiente, você DEVE fazer um **novo deploy** para que as variáveis sejam carregadas nas Functions.

---

#### 2. **Verificar Deploy das Functions**

**No Netlify:**
1. Vá em `Functions` no menu lateral
2. Você deve ver: `omie-contas-pagar`
3. Status deve estar: ✅ Active

Se não aparecer a function:
- Verifique se o arquivo está em: `netlify/functions/omie-contas-pagar.js`
- Verifique se `netlify.toml` está configurado corretamente

---

#### 3. **Testar a Function Diretamente**

**Via curl (substitua SEU-SITE pelo seu domínio Netlify):**
```bash
curl -X POST https://SEU-SITE.netlify.app/.netlify/functions/omie-contas-pagar \
  -H "Content-Type: application/json" \
  -d '{
    "dataInicial": "01/01/2024",
    "dataFinal": "31/01/2024",
    "page": 1,
    "registrosPorPagina": 10
  }'
```

**Respostas esperadas:**

**✅ Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "conta_pagar_lista": [...]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**❌ Erro 404:**
```
Function não encontrada - verificar deploy
```

**❌ Erro 500 (sem variáveis):**
```json
{
  "success": false,
  "error": "Variáveis de ambiente OMIE_APP_KEY e OMIE_APP_SECRET não configuradas"
}
```

**❌ Erro 401/403 (credenciais inválidas):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

#### 4. **Ver Logs das Functions**

**No Netlify:**
1. Vá em `Functions` > `omie-contas-pagar`
2. Clique na aba `Logs`
3. Procure por mensagens de erro

**Logs esperados em funcionamento normal:**
```
🔍 Iniciando busca de contas a pagar...
📅 Período: 01/01/2024 até 31/01/2024
📄 Página: 1 Registros: 500
📤 Enviando requisição para Omie...
✅ Resposta recebida da Omie
📊 Total de registros: 15
```

**Logs de erro comuns:**
```
❌ Variáveis de ambiente não configuradas!
❌ Status da resposta Omie: 401
❌ Dados da resposta Omie: { error: "Invalid credentials" }
```

---

#### 5. **Debug no Console do Navegador**

**Abra o dashboard e pressione F12:**

1. Vá na aba `Console`
2. Clique no botão "Atualizar Dados"
3. Observe as mensagens:

**✅ Sucesso:**
```
🔍 Iniciando busca de dados Omie...
📅 Período: 01/01/24 até 31/01/24
📦 Resposta da API: {success: true, data: {...}}
✅ Contas a pagar carregadas: 15
```

**❌ Erro:**
```
❌ Erro completo: Error: Request failed with status code 404
❌ Status: 404
❌ Dados: undefined
```

---

#### 6. **Verificar Network Tab**

**No navegador (F12 > Network):**

1. Filtre por: `omie-contas-pagar`
2. Clique no botão "Atualizar Dados"
3. Verifique a requisição:

**Headers:**
- URL: `https://SEU-SITE.netlify.app/.netlify/functions/omie-contas-pagar`
- Method: `POST`
- Status: `200 OK` (esperado)

**Payload (Request):**
```json
{
  "dataInicial": "01/01/2024",
  "dataFinal": "31/01/2024",
  "page": 1,
  "registrosPorPagina": 500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pagina": 1,
    "total_de_paginas": 1,
    "registros": 15,
    "total_de_registros": 15,
    "conta_pagar_lista": [...]
  }
}
```

---

## 🔧 Soluções para Problemas Comuns

### Problema 1: Erro 404 - Function não encontrada

**Causa**: Netlify Function não foi deployada corretamente.

**Solução**:
1. Verifique se o arquivo existe: `netlify/functions/omie-contas-pagar.js`
2. Verifique `netlify.toml`:
   ```toml
   [build]
     functions = "netlify/functions"
   ```
3. Faça um novo deploy: `git push origin main`
4. Aguarde o build terminar (~2min)

---

### Problema 2: Erro 500 - Variáveis não configuradas

**Causa**: `OMIE_APP_KEY` e `OMIE_APP_SECRET` não estão no Netlify.

**Solução**:
1. Netlify > Site settings > Environment variables
2. Adicione as duas variáveis
3. **IMPORTANTE**: Faça um novo deploy após adicionar
4. As variáveis só são carregadas em novo build

**Como fazer novo deploy:**
```bash
git commit --allow-empty -m "Trigger deploy"
git push origin main
```

---

### Problema 3: Erro 401/403 - Credenciais inválidas

**Causa**: App Key ou App Secret estão incorretos.

**Solução**:
1. Acesse Omie: https://app.omie.com.br/
2. Configurações > Integrações > API
3. Gere novas credenciais
4. Atualize no Netlify
5. Faça novo deploy

---

### Problema 4: Sem resposta / Timeout

**Causa**: Rede ou timeout da API Omie.

**Solução**:
1. Verifique sua conexão com internet
2. Tente novamente após alguns minutos
3. Verifique se o Omie está online: https://status.omie.com.br/

---

### Problema 5: Resposta vazia (0 registros)

**Causa**: Não há contas a pagar no período selecionado.

**Solução**:
1. Verifique se há contas a pagar no Omie para o período
2. Tente ampliar o período (exemplo: mês inteiro)
3. Verifique se as datas estão corretas no filtro

---

## 🧪 Teste Local com Netlify Dev

**Para testar localmente antes de fazer deploy:**

1. **Instalar Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Criar arquivo `.env` (não commitar!):**
```bash
cd /home/user/webapp
cat > .env << 'EOF'
OMIE_APP_KEY=sua-chave-aqui
OMIE_APP_SECRET=seu-secret-aqui
EOF
```

3. **Rodar servidor local:**
```bash
netlify dev
```

4. **Acessar:**
```
http://localhost:8888
```

5. **Testar a function:**
```bash
curl -X POST http://localhost:8888/.netlify/functions/omie-contas-pagar \
  -H "Content-Type: application/json" \
  -d '{
    "dataInicial": "01/01/2024",
    "dataFinal": "31/01/2024"
  }'
```

---

## 📞 Suporte

**Se continuar com erro:**

1. Copie os logs do console (F12)
2. Copie os logs das Functions (Netlify > Functions > Logs)
3. Anote o código de erro (404, 500, etc.)
4. Verifique se as credenciais Omie estão corretas

**Checklist final:**
- [ ] Variáveis de ambiente configuradas no Netlify
- [ ] Novo deploy feito após adicionar variáveis
- [ ] Function aparece como "Active" no Netlify
- [ ] Credenciais Omie são válidas
- [ ] Período de busca tem dados no Omie
- [ ] Console do navegador mostra logs detalhados

---

**Atualizado**: 01/02/2026 | v1.1.0
