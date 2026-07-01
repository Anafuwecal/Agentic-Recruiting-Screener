import jwt from "jsonwebtoken";

interface TokenPayload {
  threadId: string;
  candidateId: string;
}

export class JwtService {
  private readonly secretKey: string;
  private readonly tokenExpiration: string = "7d"; // 7 Days lifespan

  constructor() {
    this.secretKey = process.env.JWT_SECRET || "secure-architect-secret-key";
  }

  public generateCandidateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.secretKey, {
      expiresIn: this.tokenExpiration as any,
      algorithm: "HS256",
    }); 
  }

  public verifyCandidateToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secretKey, { algorithms: ["HS256"] });
      return decoded as TokenPayload;
    } catch (error) {
      throw new Error("Invalid or expired candidate access token");
    }
  }
}