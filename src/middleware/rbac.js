import { errorResMsg } from "../utils/lib/response.js";

/**
 * Middleware for role-based access control
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const roleBasedAccess = (roles) => {
  return function (req, res, next) {
    if (!req.user) {
      return errorResMsg(res, 401, "Authentication required");
    }
    
    if (roles.includes(req.user.role)) {
      next();
    } else {
      return errorResMsg(res, 403, "Permission denied. Required role: " + roles.join(' or '));
    }
  };
};

export default roleBasedAccess;
