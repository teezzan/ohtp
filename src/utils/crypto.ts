import crypto from "crypto";
import { EncryptJWT } from "jose/jwt/encrypt";
import { jwtDecrypt } from "jose/jwt/decrypt";
import notp from "notp";

const secret = process.env.ENC_SECRET || "my_secret_key";
const secretKey = crypto.pbkdf2Sync(secret, "salt", 2000, 32, "sha512");

export const EncryptPayload = async (payload: any): Promise<string> => {
    const token = await new EncryptJWT(payload)
        .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
        .setIssuedAt()
        .setExpirationTime("2h")
        .encrypt(secretKey);
    return token;

};

export const DecryptPayload = async (token: string): Promise<any> => {
    const { payload } = await jwtDecrypt(token, secretKey);
    return payload;
};

export const GenerateOTP = (): string => {
    return notp.totp.gen(secretKey, {});
};

export const GenerateKey = (byte=8): string =>{
    return crypto.randomBytes(byte).toString('hex');
}