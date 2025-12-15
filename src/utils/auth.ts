import jwt from 'jsonwebtoken';
import { config } from '../config/config';

const access_token_secret = config.jwtAccessTokenSecret;
const refresh_token_secret = config.jwtRefreshTokenSecret;
const access_token_expiresIn = config.jwtAccessTokenExpiresIn;
const refresh_token_expiresIn = config.jwtRefreshTokenExpiresIn;

const generateAccessToken = (payload: {id: string, email: string, role: string}) => {
    return jwt.sign(
        payload,
        access_token_secret,
        {
            expiresIn: access_token_expiresIn
        }
    )
}

const generateRefreshToken = (payload: {id: string}) => {
    return jwt.sign(
        payload,
        refresh_token_secret,
        {
            expiresIn: refresh_token_expiresIn
        }
    )
}

const verifyRefreshToken = (token: string): { id: string } => {
    return jwt.verify(token, refresh_token_secret) as { id: string };
}

const verifyAccessToken = (token: string): { id: string; email: string; role: string } => {
    return jwt.verify(token, access_token_secret) as { id: string; email: string; role: string };
}

export { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken };