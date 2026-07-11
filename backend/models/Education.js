const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Education = sequelize.define('Education', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  qualification: {
    type: DataTypes.STRING,
    allowNull: false
  },
  school: {
    type: DataTypes.STRING,
    allowNull: true
  },
  college: {
    type: DataTypes.STRING,
    allowNull: true
  },
  degree: {
    type: DataTypes.STRING,
    allowNull: true
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passingYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Education;
