const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChantingTimeline = sequelize.define('ChantingTimeline', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  rounds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 64
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = ChantingTimeline;
