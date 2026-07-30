import ApiError from '../utils/ApiError.js';
import { PERMISSIONS } from '../constants/permissions.js';

/**
 * Enforce specific allowed roles
 * @param  {...string} allowedRoles 
 */
export const requireRole = (...allowedRoles) => {
  const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Access denied: Insufficient role permissions'));
    }
    next();
  };
};

/**
 * Enforce RBAC permissions based on the central permissions matrix
 * @param {string} permission 
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) {
      return next(ApiError.internal(`Unknown permission scope: ${permission}`));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Access denied: Required permission context is missing`));
    }

    next();
  };
};

export default {
  requireRole,
  requirePermission,
};
