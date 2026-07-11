const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING, // 'Present', 'Permanent', 'Office', etc.
    allowNull: false
  },
  houseStreetPO: {
    type: DataTypes.STRING,
    allowNull: false
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stateProvince: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cityDistrict: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pinZip: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Address;
