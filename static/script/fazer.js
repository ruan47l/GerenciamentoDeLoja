const botao = document.getElementById('menu');
const sidebar = document.querySelector('.sidebar');

if (botao && sidebar) {
    botao.addEventListener('click', () => {
        sidebar.classList.toggle('aberto');
    });
}



//parte do modal cadastrar produtos e editar

function AbrirModal() {
    document.getElementById("modal").style.display = "block";
  }
  

function fecharModal() {
    document.getElementById("modal").style.display = "none";
  }

function abrirModalEdit(id, nome, preco, codigo, vencimento, estoqueLoja, estoqueMinimo) {
    document.getElementById("produtoIdEdit").value = id;
    document.getElementById("ProdutoEdit").value = nome;
    document.getElementById("PrecoEdit").value = preco;
    document.getElementById("codigoEdit").value = codigo;
    document.getElementById("vencimentoEdit").value = vencimento;
    document.getElementById("estoqueLojaEdit").value = estoqueLoja;
    document.getElementById("estoqueMinimoEdit").value = estoqueMinimo;

    document.getElementById("modalEdit").style.display = "block";
}

function fecharModalEdit() {
    document.getElementById("modalEdit").style.display = "none";

}

function atualizarRestante(id) {
    const totalVenda = parseFloat(document.getElementById(`total-${id}`).textContent) || 0;
    const listaPagamentos = document.querySelectorAll(`#pagamentos-${id} li`);
    
    let pago = 0;
    listaPagamentos.forEach(li => {
        pago += parseFloat(li.dataset.valor) || 0;
    });

    const restante = totalVenda - pago;
    document.getElementById(`restante-${id}`).textContent = restante.toFixed(2);
}

// criar abas 
let contador = 0;

function novaVenda() {
    contador++;
    const id = contador;

    const aba = document.createElement("button");
    aba.textContent = `Cliente ${id}`;
    aba.id = `aba-btn-${id}`;
    aba.onclick = () => ativarAba(id);
    document.getElementById("barra-abas").appendChild(aba);

    const conteudo = document.createElement("div");
    conteudo.id = `aba-${id}`;
    conteudo.className = "conteudo-aba";
    

    conteudo.innerHTML = `
    <h3>Atendendo Cliente ${id}</h3>

    <div class="add-produto">
        <input id="produto-${id}" placeholder="Nome do Produto" onblur="buscarPreco(${id})">
        <input id="preco-${id}" type="number" placeholder="Preço R$" readonly>
        <input id="qtd-${id}" type="number" value="1" min="1">
        <button onclick="adicionarProduto(${id})" style="background: var(--harvest-orange); color:white;">+ Add</button>
    </div>

    <ul id="lista-${id}" class="lista-produtos"></ul>

    <div class="resumo-venda">
        <h4>Total: R$ <span id="total-${id}">0.00</span></h4>
        <p>Restante: R$ <span id="restante-${id}">0.00</span></p>
    </div>

    <div class="botoes-pagamento">
        <button onclick="pagar(${id}, 'Débito')">💳 Débito</button>
        <button onclick="pagar(${id}, 'Crédito')">💳 Crédito</button>
        <button onclick="pagar(${id}, 'Pix')">📱 Pix</button>
        <button onclick="pagar(${id}, 'Dinheiro')">💵 Dinheiro</button>
    </div>

    <ul id="pagamentos-${id}" class="lista-pagamentos"></ul>

    <button onclick="finalizarVenda(${id})" style="width:100%; padding:15px; background: #28a745; color:white; font-size:1.1rem; margin-top:20px;">
        FINALIZAR VENDA
    </button>
    `;

    document.getElementById("conteudo-vendas").appendChild(conteudo);
    ativarAba(id); 
    atualizarRestante(id);
}

function ativarAba(id) {
    document.querySelectorAll(".conteudo-aba").forEach(div => {
        div.style.display = "none";
    });

    document.querySelectorAll("#barra-abas button").forEach(btn => {
        btn.classList.remove("ativa");
    });

    document.getElementById(`aba-${id}`).style.display = "block";
    document.getElementById(`aba-btn-${id}`).classList.add("ativa");
}


// adionar produto na lista de produtos do cliente

function adicionarProduto(id) {
    const produtoInput = document.getElementById(`produto-${id}`);
    const precoInput = document.getElementById(`preco-${id}`);
    const qtdInput = document.getElementById(`qtd-${id}`);

    const produtoNome = produtoInput.value.trim();
    const preco = parseFloat(precoInput.value);
    const qtd = parseInt(qtdInput.value);
    const produtoId = produtoInput.dataset.produtoId;

    if (!produtoNome || !produtoId || isNaN(preco) || isNaN(qtd) || qtd <= 0) {
        alert("Produto inválido ou não selecionado corretamente");
        return;
    }

    const subtotal = preco * qtd;

    const li = document.createElement("li");
    li.textContent = `${produtoNome} | ${qtd} x R$ ${preco.toFixed(2)} = R$ ${subtotal.toFixed(2)}`;


    li.dataset.produtoId = produtoId;
    li.dataset.quantidade = qtd;
    li.dataset.preco = preco;

    document.getElementById(`lista-${id}`).appendChild(li);

    const totalEl = document.getElementById(`total-${id}`);
    totalEl.textContent = (
        parseFloat(totalEl.textContent) + subtotal
    ).toFixed(2);

    produtoInput.value = "";
    precoInput.value = "";
    qtdInput.value = 1;
    delete produtoInput.dataset.produtoId;

    atualizarRestante(id);
}


// buscra preço 

function buscarPreco(id) {
    const produtoInput = document.getElementById(`produto-${id}`);
    const precoInput = document.getElementById(`preco-${id}`);

    fetch(`/api/preco-produto?produto=${encodeURIComponent(produtoInput.value)}`)
        .then(res => res.json())
        .then(dados => {
            precoInput.value = dados.preco || "";
            produtoInput.dataset.produtoId = dados.id || "";
        });
}


// finalizar venda
function finalizarVenda(id) {
    const listaProdutos = document.querySelectorAll(`#lista-${id} li`);

    if (listaProdutos.length === 0) {
        alert("Adicione pelo menos um produto antes de finalizar a venda.");
        return;
    }

    atualizarRestante(id);

    const restante = parseFloat(
        document.getElementById(`restante-${id}`).textContent
    );

    if (restante > 0) {
        alert(`Falta pagar R$ ${restante.toFixed(2)}`);
        return;
    }

    const itens = [];
    listaProdutos.forEach(li => {
        itens.push({
            produto_id: Number(li.dataset.produtoId),
            quantidade: Number(li.dataset.quantidade),
            preco: Number(li.dataset.preco)
        });
    });

    const total = Number(
        document.getElementById(`total-${id}`).textContent
    );

    fetch('/finalizar-venda', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            total: total,
            itens: itens
        })
    })
    .then(res => {
        if (!res.ok) {
            throw new Error("Erro ao salvar venda");
        }
        return res.json();
    })
    .then(() => {
        alert("Venda finalizada com sucesso!");

        document.getElementById(`lista-${id}`).innerHTML = "";
        document.getElementById(`pagamentos-${id}`).innerHTML = "";
        document.getElementById(`total-${id}`).textContent = "0.00";
        document.getElementById(`restante-${id}`).textContent = "0.00";
    })
    .catch(err => {
        console.error(err);
        alert("Erro ao finalizar venda. Veja o console (F12).");
    });
}


// oagar clicando no botao
function pagar(id, forma) {
    
    const restanteTexto = document.getElementById(`restante-${id}`).textContent;
    let restanteValor = parseFloat(restanteTexto);

    if (restanteValor <= 0) {
        alert("A conta já foi totalmente paga!");
        return;
    }


    const valorDigitado = prompt(`Valor a pagar no ${forma}:`, restanteValor.toFixed(2));
    

    const valorPagar = parseFloat(valorDigitado.replace(',', '.'));

    if (isNaN(valorPagar) || valorPagar <= 0) {
        alert("Valor inválido.");
        return;
    }

    if (valorPagar > restanteValor + 0.01) { 
        alert("O valor informado é maior do que o restante da conta!");
        return;
    }


    const listaPagamentos = document.getElementById(`pagamentos-${id}`);
    const li = document.createElement("li");
    
    
    li.dataset.valor = valorPagar;
    li.innerHTML = `<strong>${forma}:</strong> R$ ${valorPagar.toFixed(2)} 
                    <button onclick="removerPagamento(this, ${id})" style="color:red; border:none; background:none; cursor:pointer;">[x]</button>`;

    listaPagamentos.appendChild(li);

    
    atualizarRestante(id);
}

function removerPagamento(botao, id) {
    
    botao.parentElement.remove();

    atualizarRestante(id);
}


function AbrirModalRVV() {
    document.getElementById("modalRVV").style.display = "block";
}

function fecharModalRVV() {
    document.getElementById("modalRVV").style.display = "none";
}