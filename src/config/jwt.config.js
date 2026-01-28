// JWT Configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET || "fallback_jwt_secret_key_for_development",
  expiresIn: process.env.JWT_EXPIRE || "30d", // 30 days by default
};