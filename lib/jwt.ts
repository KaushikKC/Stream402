import * as jwt from "jsonwebtoken";

const JWT_SECRET: string =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function signJwt<T extends Record<string, unknown>>(
  payload: T,
  expiresIn: string | number = "4m"
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
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
