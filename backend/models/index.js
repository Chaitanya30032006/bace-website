const sequelize = require('../config/database');
const User = require('./User');
const Profile = require('./Profile');
const Address = require('./Address');
const Family = require('./Family');
const Education = require('./Education');
const Skills = require('./Skills');
const Devotional = require('./Devotional');
const ChantingTimeline = require('./ChantingTimeline');
const DevotionalCourse = require('./DevotionalCourse');
const BookProgress = require('./BookProgress');
const Album = require('./Album');
const Photo = require('./Photo');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');

// Define associations
User.hasOne(Profile, { foreignKey: 'userId', as: 'profile', onDelete: 'CASCADE' });
Profile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Profile.hasMany(Address, { foreignKey: 'profileId', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });

Profile.hasOne(Family, { foreignKey: 'profileId', as: 'family', onDelete: 'CASCADE' });
Family.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });

Profile.hasMany(Education, { foreignKey: 'profileId', as: 'educationRecords', onDelete: 'CASCADE' });
Education.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });

Profile.hasOne(Skills, { foreignKey: 'profileId', as: 'skills', onDelete: 'CASCADE' });
Skills.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });

Profile.hasOne(Devotional, { foreignKey: 'profileId', as: 'devotionalInfo', onDelete: 'CASCADE' });
Devotional.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });

Profile.hasMany(ChantingTimeline, { foreignKey: 'profileId', as: 'chantingTimeline', onDelete: 'CASCADE' });
ChantingTimeline.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });

Profile.hasMany(DevotionalCourse, { foreignKey: 'profileId', as: 'devotionalCourses', onDelete: 'CASCADE' });
DevotionalCourse.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });

Profile.hasMany(BookProgress, { foreignKey: 'profileId', as: 'bookProgress', onDelete: 'CASCADE' });
BookProgress.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });

Album.hasMany(Photo, { foreignKey: 'albumId', as: 'photos', onDelete: 'CASCADE' });
Photo.belongsTo(Album, { foreignKey: 'albumId', as: 'album' });

User.hasMany(Photo, { foreignKey: 'uploadedBy', as: 'uploadedPhotos' });
Photo.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'adminId', as: 'auditLogs', onDelete: 'CASCADE' });
AuditLog.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

module.exports = {
  sequelize,
  User,
  Profile,
  Address,
  Family,
  Education,
  Skills,
  Devotional,
  ChantingTimeline,
  DevotionalCourse,
  BookProgress,
  Album,
  Photo,
  Notification,
  AuditLog
};
