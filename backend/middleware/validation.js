const { body, validationResult, param } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validateRequest
];

const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  validateRequest
];

const osConfigValidation = [
  body('os_platform')
    .isIn(['Linux', 'Windows'])
    .withMessage('OS Platform must be Linux or Windows'),
  body('config_content')
    .trim()
    .notEmpty()
    .withMessage('Configuration content is required'),
  validateRequest
];

const ansibleRoleValidation = [
  body('role_name')
    .trim()
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ max: 100 })
    .withMessage('Role name must not exceed 100 characters'),
  body('os_platform')
    .isIn(['Linux', 'Windows'])
    .withMessage('OS Platform must be Linux or Windows'),
  body('requires_ldap')
    .optional()
    .isBoolean()
    .withMessage('requires_ldap must be a boolean'),
  validateRequest
];

const roleVariableValidation = [
  body('role_id')
    .isInt({ min: 1 })
    .withMessage('Valid role ID is required'),
  body('os_platform')
    .isIn(['Linux', 'Windows'])
    .withMessage('OS Platform must be Linux or Windows'),
  body('variable_content')
    .trim()
    .notEmpty()
    .withMessage('Variable content is required'),
  validateRequest
];

const tmplFileValidation = [
  body('environment')
    .isIn(['dev', 'it', 'uat', 'prod', 'all'])
    .withMessage('Environment must be dev, it, uat, prod, or all'),
  body('file_content')
    .trim()
    .notEmpty()
    .withMessage('File content is required'),
  validateRequest
];

const gitlabCIValidation = [
  body('config_type')
    .isIn(['common', 'environment', 'role'])
    .withMessage('Config type must be common, environment, or role'),
  body('config_content')
    .trim()
    .notEmpty()
    .withMessage('Configuration content is required'),
  validateRequest
];

const templateGenerationValidation = [
  body('environment')
    .isIn(['dev', 'it', 'uat', 'prod'])
    .withMessage('Environment must be dev, it, uat, or prod'),
  body('os_platform')
    .isIn(['Linux', 'Windows'])
    .withMessage('OS Platform must be Linux or Windows'),
  body('vmGroups')
    .isArray({ min: 1 })
    .withMessage('At least one VM group is required'),
  body('vmGroups.*.hostnames')
    .isArray({ min: 1 })
    .withMessage('At least one hostname is required per VM group'),
  body('vmGroups.*.roles')
    .isArray({ min: 1 })
    .withMessage('At least one role is required per VM group'),
  body('mettaApplication')
    .trim()
    .notEmpty()
    .withMessage('METTA_APPLICATION is required'),
  body('mettaComponent')
    .trim()
    .notEmpty()
    .withMessage('METTA_COMPONENT is required'),
  body('shieldTeam')
    .trim()
    .notEmpty()
    .withMessage('SHIELD_TEAM is required'),
  body('appContextSubscriptionName')
    .trim()
    .notEmpty()
    .withMessage('APP_CONTEXT_SUBSCRIPTION_NAME is required'),
  body('appContextName')
    .trim()
    .notEmpty()
    .withMessage('APP_CONTEXT_NAME is required'),
  body('armSubscriptionId')
    .trim()
    .notEmpty()
    .withMessage('ARM_SUBSCRIPTION_ID is required'),
  validateRequest
];

module.exports = {
  loginValidation,
  changePasswordValidation,
  osConfigValidation,
  ansibleRoleValidation,
  roleVariableValidation,
  tmplFileValidation,
  gitlabCIValidation,
  templateGenerationValidation
};
