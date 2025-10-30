const express = require('express');
const router = express.Router();
const gameController = require('../controllers/GameController');
const { checkRole } = require('../middlewares/jwt_token');
const roles = require('../constant/roles');

router.post('/', checkRole([roles.ADMIN]), gameController.createGame);
router.get('/', gameController.getAllGames);
router.get('/:id', gameController.getGameById);
router.put('/:id', checkRole([roles.ADMIN]), gameController.updateGame);
router.delete('/:id', checkRole([roles.ADMIN]), gameController.deleteGame);

module.exports = router;