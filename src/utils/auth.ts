import jwt from 'jsonwebtoken';
import { config } from '../config/config.ts';

const access_token_secret = config.jwtAccessTokenSecret;
const refresh_token_secret = config.jwtRefreshTokenSecret;
const access_tonken_expiresIn = config.jwtAccessTokenExpiresIn;
const refresh_token_expiresIn = config.jwtRefreshTokenExpiresIn;

const generateAccessToken = (payload: {id: string, email: string, role: string}) => {
    return jwt.sign(
        payload,
        access_token_secret,
        {
            expiresIn: access_tonken_expiresIn
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

export { generateAccessToken, generateRefreshToken };