const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Skills = sequelize.define('Skills', {
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
  occupation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  companyOrg: {
    type: DataTypes.STRING,
    allowNull: true
  },
  skills: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  interests: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hobbies: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Skills;
