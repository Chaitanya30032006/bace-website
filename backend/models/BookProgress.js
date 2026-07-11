const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookProgress = sequelize.define('BookProgress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  bookName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalChapters: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completedChapters: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  readingPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  lastReadDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING, // 'Unread', 'Reading', 'Read'
    defaultValue: 'Unread'
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: (progress) => {
      if (progress.totalChapters > 0) {
        progress.readingPercentage = parseFloat(((progress.completedChapters / progress.totalChapters) * 100).toFixed(2));
        if (progress.completedChapters >= progress.totalChapters) {
          progress.status = 'Read';
        } else if (progress.completedChapters > 0) {
          progress.status = 'Reading';
        } else {
          progress.status = 'Unread';
        }
      }
    }
  }
});

module.exports = BookProgress;
