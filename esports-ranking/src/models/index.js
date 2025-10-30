const sequelize = require('../config/config');
const { DataTypes } = require('sequelize');

const User = require('./User')(sequelize, DataTypes);
const user_otp = require('./Otp')(sequelize, DataTypes);

const Game = require('./Game')(sequelize);

module.exports = { sequelize, User, user_otp, Game };