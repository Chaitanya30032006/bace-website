const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Album = sequelize.define('Album', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  eventName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  eventDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Album;
