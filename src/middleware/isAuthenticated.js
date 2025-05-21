import jwt from "jsonwebtoken";
import { errorResMsg } from "../utils/lib/response.js";
import logger from "../utils/log/logger.js";

const isAuthenticated = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return errorResMsg(res, 401, "Authentication failed");

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) return errorResMsg(res, 401, "Authentication failed");

    req.user = decoded;
    next();
  } catch (error) {
    logger.error("JWT Auth Error:", error);
    return errorResMsg(res, 401, "Authentication failed: 🔒");
  }
};

const createJwtToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "2d" });
};

const passwordJwtToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5m" });
};

const verifyJwtToken = (token, next) => {
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    return userId;
  } catch (err) {
    next(err);
  }
};

// Named exports for individual use
export {
  isAuthenticated,
  createJwtToken,
  passwordJwtToken,
  verifyJwtToken,
};

// Default export as function
export default isAuthenticated;
