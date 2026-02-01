# 🚀 Guia Completo de Deploy - Netlify

## Passo 1: Preparar Repositório GitHub

### 1.1 Criar Repositório no GitHub
1. Acesse https://github.com/new
2. Nome: `engelinhas-controladoria`
3. Descrição: `Dashboard de Controladoria - Auditoria e Fluxo de Caixa`
4. Visibilidade: **Private** (recomendado por conter lógica de negócio)
5. Clique em "Create repository"

### 1.2 Fazer Push do Código
```bash
cd /home/user/webapp

# Adicionar remote
git remote add origin https://github.com/SEU-USUARIO/engelinhas-controladoria.git

# Push
git push -u origin main
```

## Passo 2: Configurar Netlify

### 2.1 Criar Conta no Netlify
1. Acesse https://app.netlify.com/signup
2. Faça login com sua conta GitHub
3. Autorize o Netlify a acessar seus repositórios

### 2.2 Importar Projeto
1. No dashboard do Netlify, clique em **"Add new site"** > **"Import an existing project"**
2. Escolha **"Deploy with GitHub"**
3. Selecione o repositório `engelinhas-controladoria`
4. Configure as opções de build:

```
Build command: npm run build
Publish directory: .
Functions directory: netlify/functions
```

5. **NÃO clique em Deploy ainda!** Primeiro vamos configurar as variáveis de ambiente.

### 2.3 Configurar Variáveis de Ambiente

**IMPORTANTE: Faça isso ANTES do primeiro deploy!**

1. Clique em **"Site settings"** > **"Environment variables"**
2. Clique em **"Add a variable"**
3. Adicione as seguintes variáveis:

| Key | Value | Observação |
|-----|-------|------------|
| `OMIE_APP_KEY` | `sua-chave-aqui` | Obter em Omie > Configurações > Integrações |
| `OMIE_APP_SECRET` | `seu-secret-aqui` | Obter em Omie > Configurações > Integrações |

**Como obter credenciais do Omie:**
1. Acesse https://app.omie.com.br/
2. Menu > Configurações > Integrações > API
3. Clique em "Gerar Chave de Integração"
4. Copie o `App Key` e `App Secret`

### 2.4 Deploy Inicial
1. Volte para **"Deploys"**
2. Clique em **"Trigger deploy"** > **"Deploy site"**
3. Aguarde o build (leva ~2-3 minutos)

## Passo 3: Testar o Deploy

### 3.1 Acessar o Site
Após o deploy, você receberá uma URL como:
```
https://random-name-12345.netlify.app
```

### 3.2 Testar Funcionalidades

**Teste 1: Interface**
- ✅ Sidebar com filtros carrega corretamente
- ✅ Cards de KPIs aparecem com valores zerados
- ✅ Gráfico inicializa (vazio, mas sem erros)
- ✅ Tabela mostra mensagem "Nenhum dado disponível"

**Teste 2: Upload OFX**
1. Use o arquivo `exemplo-extrato.ofx` fornecido
2. Arraste para a área de upload ou clique para selecionar
3. Verifique se aparece: "10 transações importadas"
4. Tabela deve popular com as 10 transações
5. KPIs devem atualizar

**Teste 3: API Omie**
1. Clique em "Atualizar Dados"
2. Se as credenciais estiverem corretas, deve carregar contas a pagar
3. Se houver erro, verifique as variáveis de ambiente

**Teste 4: Exportação XLSX**
1. Com dados na tabela (do OFX ou Omie)
2. Clique em "Exportar XLSX"
3. Arquivo deve baixar com nome `Engelinhas_Auditoria_YYYYMMDD.xlsx`

## Passo 4: Configuração Avançada (Opcional)

### 4.1 Domínio Customizado
1. No Netlify, vá em **"Domain settings"**
2. Clique em **"Add custom domain"**
3. Digite seu domínio: `controladoria.engelinhas.com.br`
4. Siga as instruções para configurar DNS

### 4.2 HTTPS/SSL
- ✅ O Netlify já habilita HTTPS automaticamente
- ✅ Certificado SSL gratuito via Let's Encrypt
- ✅ Nenhuma configuração adicional necessária

### 4.3 Deploy Hooks (Webhooks)
Se quiser atualizar o site automaticamente:
1. **"Site settings"** > **"Build & deploy"** > **"Build hooks"**
2. Clique em **"Add build hook"**
3. Nome: "Deploy Automático"
4. Copie a URL gerada
5. Use em integrações (GitHub Actions, Zapier, etc.)

### 4.4 Notificações de Deploy
1. **"Site settings"** > **"Build & deploy"** > **"Deploy notifications"**
2. Configure notificações por:
   - Email
   - Slack
   - Webhook customizado

## Passo 5: Manutenção e Atualizações

### 5.1 Atualizar Código
```bash
# Fazer alterações no código
# ...

# Commit
git add .
git commit -m "feat: adicionar nova funcionalidade X"

# Push (dispara deploy automático)
git push origin main
```

### 5.2 Rollback (Voltar Versão Anterior)
1. No Netlify, vá em **"Deploys"**
2. Encontre o deploy anterior desejado
3. Clique em **"⋮"** > **"Publish deploy"**

### 5.3 Visualizar Logs
1. **"Deploys"** > Selecione um deploy
2. **"Deploy log"**: Ver erros de build
3. **"Function log"**: Ver logs das Netlify Functions
4. **"Analytics"**: Ver métricas de uso

## Passo 6: Troubleshooting

### Problema 1: Build Falha
**Erro**: `npm install failed`

**Solução**:
```bash
# Local: testar build
cd /home/user/webapp
npm install
npm run build

# Se funcionar localmente, verificar Node version
# No netlify.toml, adicionar:
[build.environment]
  NODE_VERSION = "18"
```

### Problema 2: Functions Retornam 500
**Erro**: API Omie retorna erro 500

**Checklist**:
- ✅ Variáveis `OMIE_APP_KEY` e `OMIE_APP_SECRET` estão configuradas?
- ✅ Valores estão corretos (sem espaços extras)?
- ✅ Credenciais Omie são válidas?
- ✅ Conta Omie tem permissão para API?

**Debug**:
```bash
# No Netlify, vá em:
# Functions > omie-contas-pagar > Recent log entries

# Procure por mensagens de erro
```

### Problema 3: CORS Error
**Erro**: `Access to fetch blocked by CORS`

**Solução**: Já implementado! As functions têm headers CORS configurados:
```javascript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}
```

### Problema 4: OFX Não Processa
**Erro**: "Nenhuma transação encontrada"

**Checklist**:
- ✅ Arquivo tem extensão `.ofx`?
- ✅ Arquivo está no formato XML válido?
- ✅ Contém tags `<STMTTRN>`?

**Teste com arquivo de exemplo**:
Use `exemplo-extrato.ofx` fornecido no projeto.

## Passo 7: Segurança e Performance

### 7.1 Segurança
✅ **Implementado**:
- Credenciais Omie em variáveis de ambiente
- Processamento OFX 100% client-side
- HTTPS obrigatório
- Headers de segurança

✅ **Recomendações adicionais**:
```toml
# Adicionar ao netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "no-referrer"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

### 7.2 Performance
✅ **Otimizações atuais**:
- CDN global do Netlify
- Compressão Gzip automática
- Cache de assets estáticos
- Functions otimizadas

✅ **Melhorias futuras**:
- Minificar JavaScript (Terser)
- Lazy loading de Chart.js
- Service Worker para offline
- Compressão Brotli

## Passo 8: Monitoramento

### 8.1 Analytics do Netlify
1. **"Analytics"** no menu
2. Visualize:
   - Page views
   - Bandwidth usage
   - Top pages
   - Function invocations

### 8.2 Logs em Tempo Real
```bash
# Instalar CLI
npm install -g netlify-cli

# Login
netlify login

# Ver logs em tempo real
netlify functions:log
```

### 8.3 Alertas de Performance
1. Configure limites de uso
2. Receba alertas quando próximo do limite
3. Upgrade de plano se necessário

## Recursos Adicionais

### Documentação Oficial
- Netlify Docs: https://docs.netlify.com/
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Omie API: https://developer.omie.com.br/

### Suporte
- Netlify Community: https://answers.netlify.com/
- Netlify Support: https://www.netlify.com/support/

### Custos (Plano Gratuito)
- ✅ 100GB bandwidth/mês
- ✅ 300 minutes build/mês
- ✅ Unlimited sites
- ✅ 125K function requests/mês
- ✅ SSL gratuito

**Para Engelinhas**: O plano gratuito é suficiente para até ~1000 usuários/mês.

---

## Checklist Final de Deploy ✅

- [ ] Repositório GitHub criado
- [ ] Código commitado e pusheado
- [ ] Conta Netlify criada
- [ ] Projeto importado no Netlify
- [ ] Variáveis de ambiente configuradas
- [ ] Primeiro deploy realizado com sucesso
- [ ] Interface carrega sem erros
- [ ] Upload OFX funciona com arquivo de exemplo
- [ ] API Omie conecta e retorna dados
- [ ] Exportação XLSX funciona
- [ ] Filtros aplicam corretamente
- [ ] Gráficos renderizam
- [ ] KPIs calculam corretamente
- [ ] Conciliação funciona (verde/amarelo/vermelho)
- [ ] README.md está atualizado
- [ ] Documentação está completa

**Status**: ✅ Pronto para produção!

---

**Desenvolvido para Engelinhas** | Deploy Guide v1.0
