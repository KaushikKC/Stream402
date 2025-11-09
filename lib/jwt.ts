import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function signJwt<T extends Record<string, unknown>>(
  payload: T,
  expiresIn: string = "4m"
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt<T extends Record<string, unknown>>(
  token: string
): T | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as T;
    return decoded;
  } catch (error) {
    return null;
  }
}
