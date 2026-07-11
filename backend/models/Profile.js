const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  devoteeId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  spiritualName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  bloodGroup: {
    type: DataTypes.STRING,
    allowNull: true
  },
  center: {
    type: DataTypes.STRING,
    allowNull: true
  },
  maritalStatus: {
    type: DataTypes.STRING,
    allowNull: true
  },
  harinamInitiated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  initiatedName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  spiritualMaster: {
    type: DataTypes.STRING,
    allowNull: true
  },
  initiatedDatePlace: {
    type: DataTypes.STRING,
    allowNull: true
  },
  initiationCeremony: {
    type: DataTypes.STRING,
    allowNull: true
  },
  brahminInitiated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  whatsappNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  anniversaryInfo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  panNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  aadharNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  memberId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  memberType: {
    type: DataTypes.ENUM('General', 'Life Member', 'Youth Member', 'Volunteer'),
    defaultValue: 'General'
  },
  memberStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Active'
  },
  memberStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  memberExpiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  photographUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  previousReligion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  firstLanguage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  languagesKnown: {
    type: DataTypes.STRING, // Comma separated list of languages
    allowNull: true
  },
  citizenOf: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nativeCountry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nativeState: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nativeCity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  caste: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Profile;
