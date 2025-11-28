const API = 'http://localhost:3000/api';
let cart = [];

const api = {
    get: url => fetch(API + url).then(r => r.json()),
    post: (url, data) => fetch(API + url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(r => r.json()),
    
    async importar() {
        if(confirm('Importar produtos?')) {
            await this.post('/importar');
            alert('Concluído!'); ui.viewCatalogo();
        }
    }
};

const ui = {
    render(html) { document.getElementById('main').innerHTML = html; },
    
    async viewCatalogo() {
        const prods = await api.get('/produtos');
        this.render(`
            <div class="row g-3">
                ${prods.map(p => `
                    <div class="col-md-3">
                        <div class="card h-100 p-2">
                            <img src="${p.imagemUrl}" style="height:150px; object-fit:contain">
                            <h6 class="mt-2">${p.titulo}</h6>
                            <p class="fw-bold">R$ ${p.preco}</p>
                            <small>Estoque: ${p.estoque}</small>
                            <button onclick="cartLogic.add(${p.id}, '${p.titulo}', ${p.preco})" class="btn btn-sm btn-success mt-2">Comprar</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `);
    },

    viewCarrinho() {
        if(!cart.length) return this.render('<h3>Carrinho Vazio</h3>');
        let total = 0;
        this.render(`
            <h3>Checkout</h3>
            <ul class="list-group mb-3">
                ${cart.map(i => {
                    total += i.preco * i.qtd;
                    return `<li class="list-group-item">${i.titulo} (${i.qtd}x) - R$ ${(i.preco * i.qtd).toFixed(2)}</li>`;
                }).join('')}
            </ul>
            <h4>Total: R$ ${total.toFixed(2)}</h4>
            <div class="card p-3 mt-3">
                <input id="nome" class="form-control mb-2" placeholder="Nome">
                <input id="email" class="form-control mb-2" placeholder="Email">
                <button onclick="cartLogic.checkout()" class="btn btn-primary">Finalizar</button>
            </div>
        `);
    },

    async viewPedidos() {
        const email = prompt("Digite seu email para buscar:");
        if(!email) return;
        const pedidos = await api.get(`/pedidos/${email}`);
        this.render(`
            <h3>Histórico</h3>
            ${pedidos.map(p => `
                <div class="card mb-2 p-3">
                    <strong>Pedido #${p.id} - Total: R$ ${p.total}</strong>
                    <ul>${p.itens.map(i => `<li>${i.produto.titulo} (${i.quantidade}x)</li>`).join('')}</ul>
                </div>
            `).join('')}
        `);
    }
};

const cartLogic = {
    add(id, titulo, preco) {
        const item = cart.find(x => x.id === id);
        item ? item.qtd++ : cart.push({id, titulo, preco, qtd: 1});
        document.getElementById('count').innerText = cart.reduce((a,b)=>a+b.qtd,0);
    },
    async checkout() {
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const res = await api.post('/pedidos', { nome, email, itens: cart });
        
        if(res.pedidoId) {
            alert('Pedido realizado!');
            cart = [];
            ui.viewCatalogo();
        } else {
            alert('Erro: ' + res.error);
        }
    }
};

// Inicia no catálogo
ui.viewCatalogo();