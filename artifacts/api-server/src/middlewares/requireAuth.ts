import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export const OWNER_EMAIL = "thethe231hgf@outlook.com";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
