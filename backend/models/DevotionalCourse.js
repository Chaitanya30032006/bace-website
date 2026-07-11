const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DevotionalCourse = sequelize.define('DevotionalCourse', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  courseName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  completionYear: {
    type: DataTypes.STRING,
    allowNull: true
  },
  docUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING, // e.g. 'Completed', 'In Progress'
    defaultValue: 'Completed'
  }
}, {
  timestamps: true
});

module.exports = DevotionalCourse;
