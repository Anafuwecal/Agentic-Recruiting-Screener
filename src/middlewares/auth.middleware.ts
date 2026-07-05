import { Request, Response, NextFunction } from "express";
import { JwtService } from "../services/jwt.service.ts";
import jwt from "jsonwebtoken";

const jwtService = new JwtService();

// Extend the Express Request type to hold our decoded token data
export interface AuthenticatedRequest extends Request {
  candidate?: {
    candidateId: string;
    threadId: string;
  };
}

export const requireCandidateAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Missing or malformed Authorization header." });
    return;
  }

  const token = authHeader.split(" ")[1];
  //Validate that the token is not undefined or empty
  if (!token) {
    res.status(401).json({ success: false, message: "Token missing from Authorization header." });
    return;
  }
  const decoded = jwtService.verifyCandidateToken(token);

  if (!decoded) {
    res.status(401).json({ success: false, message: "Invalid or expired tracking token." });
    return;
  }

  // Attach decoded payload to request for the controller to use
  req.candidate = decoded as { candidateId: string; threadId: string };
  next();
};