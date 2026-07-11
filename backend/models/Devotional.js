const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Devotional = sequelize.define('Devotional', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  dateJoined: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  introducedBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  introducedWhen: {
    type: DataTypes.STRING,
    allowNull: true
  },
  firstConnectedCenter: {
    type: DataTypes.STRING,
    allowNull: true
  },
  spiritualGuide: {
    type: DataTypes.STRING,
    allowNull: true
  },
  programDetails: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Devotional;
