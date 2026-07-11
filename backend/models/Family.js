const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Family = sequelize.define('Family', {
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
  fatherName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  motherName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fatherContact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  motherContact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  spouseName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  childrenDetails: {
    type: DataTypes.TEXT, // Can be stored as JSON string or text
    allowNull: true
  },
  emergencyContact: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Family;
