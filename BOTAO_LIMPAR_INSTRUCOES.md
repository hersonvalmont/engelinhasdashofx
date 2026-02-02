# 🗑️ Instruções: Botão "Limpar Todos os Dados"

## ✅ CORREÇÕES IMPLEMENTADAS

O sistema agora tem **múltiplas formas** de conectar o botão HTML ao JavaScript:

---

## 📋 OPÇÃO 1: Usando onclick (MAIS SIMPLES)

```html
<button onclick="limparTodosDados()" 
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
    <i class="fas fa-trash mr-1"></i>
    Limpar Todos os Dados
</button>
```

---

## 📋 OPÇÃO 2: Usando ID do botão

```html
<button id="btnClear" 
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
    <i class="fas fa-trash mr-1"></i>
    Limpar Todos os Dados
</button>
```

O JavaScript já está configurado para encontrar automaticamente elementos com:
- `id="btnClear"`
- `data-action="clear"`
- Botões contendo "limpar" e "dados" no texto

---

## 📋 OPÇÃO 3: Usando data-action

```html
<button data-action="clear" 
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
    <i class="fas fa-trash mr-1"></i>
    Limpar Todos os Dados
</button>
```

---

## 🧪 COMO TESTAR

### 1. Abra o Console do Navegador (F12)

### 2. Digite um dos comandos:
```javascript
// Qualquer uma dessas funções funciona:
window.limparTodosDados()
window.clearAllData()
window.limparCache()
window.resetDashboard()

// Ou acesse diretamente:
window.app.limparDados()
```

### 3. Você deverá ver no console:
```
🗑️ Função limparDados() chamada
✅ Usuário confirmou limpeza
📊 Arrays limpos: {contasPagar: 0, ofxData: 0, transacoesConciliadas: 0}
💾 Cache limpo
🗑️ Todos os dados foram limpos com sucesso!
```

---

## 🔍 DEBUG: Se o botão não funcionar

### Execute no console:
```javascript
// Ver todos os botões disponíveis
console.log(Array.from(document.querySelectorAll('button')).map(b => ({
    id: b.id,
    text: b.textContent,
    onclick: b.onclick
})));

// Forçar configuração do botão
window.app.setupClearButton();

// Testar se a função existe
console.log('limparTodosDados:', typeof window.limparTodosDados);
console.log('app.limparDados:', typeof window.app.limparDados);
```

---

## 📝 O QUE A FUNÇÃO FAZ

Quando você clica no botão ou chama `limparTodosDados()`:

1. ✅ Mostra confirmação: "⚠️ ATENÇÃO: Isso vai apagar TODOS os dados..."
2. ✅ Limpa arrays: `contasPagar`, `ofxData`, `transacoesConciliadas`
3. ✅ Reseta saldo bancário para 0
4. ✅ Limpa localStorage (cache do navegador)
5. ✅ Atualiza o dashboard
6. ✅ Mostra mensagem de sucesso

---

## 🚨 IMPORTANTE

- O botão pede **confirmação** antes de apagar
- Limpa **TUDO**: arquivos OFX + CSV/XLSX importados
- Remove dados do **localStorage** (cache)
- **NÃO** é possível desfazer a ação

---

## 💡 DICA

Se o botão ainda não funcionar, me envie:
1. O arquivo HTML completo
2. O console log quando clicar no botão
3. Screenshot do erro (se houver)

Vou identificar o problema exato! 🚀
