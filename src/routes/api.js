const express = require('express');
const router = express.Router();
const controller = require('../controllers/storeController');

router.post('/importar', controller.importarDados);
router.get('/produtos', controller.listarProdutos);
router.get('/produtos/:id', controller.detalharProduto);
router.post('/pedidos', controller.criarPedido);
router.get('/pedidos/:email', controller.meusPedidos);

module.exports = router;