'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Tournament = sequelize.define('Tournament', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'ACTIVE', 'COMPLETED'),
      defaultValue: 'PENDING',
      allowNull: false
    },
    total_rounds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Tổng số vòng (do Admin quyết định)'
    },
    current_round: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Đang ở vòng số mấy'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true, // Có thể là null nếu không cần theo dõi Admin
      references: {
        model: 'Users', // Tên bảng 'User' của bạn
        key: 'id'
      }
    },
    deleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'tournaments',
    timestamps: true,
  });

  Tournament.associate = (models) => {
    // Một giải đấu có nhiều Đội tham gia
    Tournament.hasMany(models.Participant, { 
      foreignKey: 'tournament_id', 
      as: 'participants' 
    });
    // Một giải đấu có nhiều Trận đấu
    Tournament.hasMany(models.Match, { 
      foreignKey: 'tournament_id', 
      as: 'matches' 
    });
    // Một giải đấu được tạo bởi 1 Admin (User)
    Tournament.belongsTo(models.User, { 
      foreignKey: 'created_by', 
      as: 'admin' 
    });
  };

  return Tournament;
};