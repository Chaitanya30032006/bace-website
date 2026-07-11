const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Photo = sequelize.define('Photo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  albumId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: false
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Photo;
