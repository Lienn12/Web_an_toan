const express = require('express');
const router = express.Router();

const usersRouter = require('../routes/user.route');
const gamesRouter = require('../routes/game.route');

router.use('/users', usersRouter);
router.use('/games', gamesRouter);

module.exports = router;