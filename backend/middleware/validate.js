const { z } = require('zod');

// Password policy: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Invalid email address').max(255).trim().toLowerCase(),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits').max(15).regex(/^\+?[0-9\s-]+$/, 'Invalid mobile number'),
  password: passwordSchema
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

const albumSchema = z.object({
  title: z.string().min(2).max(200).trim(),
  eventName: z.string().min(2).max(200).trim(),
  eventDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  description: z.string().max(1000).optional()
});

const profileUpdateSchema = z.object({
  basicInfo: z.object({
    name: z.string().min(2).max(100).trim().optional().or(z.literal('')),
    mobile: z.string().min(10).max(15).optional().or(z.literal('')),
    center: z.string().max(200).optional(),
    spiritualName: z.string().max(200).optional(),
    gender: z.string().max(20).optional(),
    dob: z.string().optional().nullable(),
    bloodGroup: z.string().max(10).optional(),
    harinamInitiated: z.boolean().optional(),
    initiatedName: z.string().max(200).optional(),
    spiritualMaster: z.string().max(200).optional(),
    initiatedDatePlace: z.string().max(200).optional(),
    initiationCeremony: z.string().max(200).optional(),
    brahminInitiated: z.boolean().optional(),
    panNumber: z.string().max(20).optional(),
    aadharNumber: z.string().max(20).optional(),
    firstLanguage: z.string().max(100).optional(),
    languagesKnown: z.string().max(500).optional(),
    citizenOf: z.string().max(100).optional(),
    nativeCountry: z.string().max(100).optional(),
    nativeState: z.string().max(100).optional(),
    nativeCity: z.string().max(100).optional(),
    caste: z.string().max(100).optional(),
    whatsappNumber: z.string().max(15).optional().or(z.literal('')),
    memberType: z.string().optional(),
    memberStatus: z.string().optional(),
    memberStartDate: z.string().optional().nullable(),
    memberExpiryDate: z.string().optional().nullable(),
    photographUrl: z.string().optional()
  }).optional(),
  personalInfo: z.object({
    occupation: z.string().max(200).optional(),
    companyOrg: z.string().max(200).optional(),
    skills: z.string().max(500).optional(),
    interests: z.string().max(500).optional(),
    hobbies: z.string().max(500).optional()
  }).optional(),
  communicationInfo: z.object({
    mobile: z.string().min(10).max(15).optional().or(z.literal('')),
    whatsappNumber: z.string().max(15).optional().or(z.literal(''))
  }).optional(),
  addressInfo: z.array(z.object({
    id: z.string().uuid().optional(),
    type: z.string().min(1).max(50),
    houseStreetPO: z.string().max(500),
    country: z.string().max(100).optional(),
    stateProvince: z.string().max(100).optional(),
    cityDistrict: z.string().max(100).optional(),
    pinZip: z.string().max(20).optional().nullable()
  })).optional(),
  familyInfo: z.object({
    fatherName: z.string().max(200).optional(),
    motherName: z.string().max(200).optional(),
    fatherContact: z.string().max(200).optional(),
    motherContact: z.string().max(200).optional(),
    emergencyContact: z.string().max(200).optional()
  }).optional(),
  educationInfo: z.any().optional(),
  devotionalInfo: z.object({
    dateJoined: z.string().optional().nullable(),
    introducedBy: z.string().max(200).optional(),
    introducedWhen: z.string().max(200).optional(),
    firstConnectedCenter: z.string().max(200).optional(),
    spiritualGuide: z.string().max(200).optional(),
    programDetails: z.string().max(1000).optional()
  }).optional(),
  membershipInfo: z.any().optional()
}).refine((data) => Object.keys(data).length > 0, 'At least one section must be provided');

const chantingSchema = z.object({
  rounds: z.number().int().min(1).max(192),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date')
});

const courseSchema = z.object({
  courseName: z.string().min(1).max(200).trim(),
  completionYear: z.number().int().min(1900).max(2100).optional().nullable(),
  docUrl: z.string().url().max(500).optional().nullable(),
  status: z.string().max(50).optional().nullable()
});

const educationSchema = z.object({
  qualification: z.string().max(200).optional(),
  school: z.string().max(200).optional(),
  college: z.string().max(200).optional(),
  degree: z.string().max(200).optional(),
  specialization: z.string().max(200).optional(),
  passingYear: z.number().int().min(1900).max(2100).optional().nullable(),
  status: z.string().max(50).optional()
});

const bookProgressSchema = z.object({
  completedChapters: z.number().int().min(0),
  lastReadDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  remarks: z.string().max(500).optional().nullable()
});

// Middleware factory
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      console.log('[VALIDATION] Failed fields:', JSON.stringify(errors, null, 2));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    req.validatedBody = result.data;
    next();
  };
}

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  albumSchema,
  profileUpdateSchema,
  chantingSchema,
  courseSchema,
  educationSchema,
  bookProgressSchema,
  passwordSchema
};
