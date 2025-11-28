const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

module.exports = {
  // Importar da API externa
  async importarDados(req, res) {
    try {
      const { data } = await axios.get('https://fakestoreapi.com/products');
      await prisma.$transaction(
        data.map(p => prisma.produto.create({
          data: {
            titulo: p.title,
            preco: p.price,
            categoria: p.category,
            imagemUrl: p.image,
            descricao: p.description,
            estoque: Math.floor(Math.random() * 50) + 10
          }
        }))
      );
      res.json({ msg: 'Importação concluída!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Listar Produtos
  async listarProdutos(req, res) {
    const { busca } = req.query;
    const where = busca ? { titulo: { contains: busca, mode: 'insensitive' } } : {};
    const produtos = await prisma.produto.findMany({ where });
    res.json(produtos);
  },

  // Detalhes
  async detalharProduto(req, res) {
    const produto = await prisma.produto.findUnique({
      where: { id: Number(req.params.id) }
    });
    res.json(produto);
  },

  // Criar Pedido (Transação)
  async criarPedido(req, res) {
    const { nome, email, itens } = req.body;
    try {
      const resultado = await prisma.$transaction(async (tx) => {
        let total = 0;
        for (const item of itens) {
          const prod = await tx.produto.findUnique({ where: { id: item.id } });
          if (!prod || prod.estoque < item.qtd) throw new Error(`Sem estoque: ${item.titulo}`);
          
          total += Number(prod.preco) * item.qtd;
          
          await tx.produto.update({
            where: { id: item.id },
            data: { estoque: { decrement: item.qtd } }
          });
        }

        return await tx.pedido.create({
          data: {
            clienteNome: nome,
            clienteEmail: email,
            total: total,
            itens: {
              create: itens.map(i => ({
                produtoId: i.id,
                quantidade: i.qtd,
                precoUnitario: i.preco
              }))
            }
          }
        });
      });
      res.json({ msg: 'Sucesso', pedidoId: resultado.id });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Meus Pedidos
  async meusPedidos(req, res) {
    const pedidos = await prisma.pedido.findMany({
      where: { clienteEmail: req.params.email },
      include: { itens: { include: { produto: true } } }
    });
    res.json(pedidos);
  }
};