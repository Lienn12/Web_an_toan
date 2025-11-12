import sequelize from '../config/config.js';
import { DataTypes, Sequelize } from 'sequelize';

import defineUser from './User.js';
import defineOtp from './Otp.js';
import defineTeam from './Team.js';
import defineGame from './Game.js';
import defineSeason from './Season.js';

// Khởi tạo models
const User = defineUser(sequelize, DataTypes);
const user_otp = defineOtp(sequelize, DataTypes);
const Team = defineTeam(sequelize, DataTypes);
const Game = defineGame(sequelize, DataTypes);
const Season = defineSeason(sequelize, DataTypes);


export { sequelize, Sequelize, User, user_otp, Game, Team, Season };

export default {
  sequelize,
  Sequelize,
  User,
  user_otp,
  Team,
  Game,
  Season
};