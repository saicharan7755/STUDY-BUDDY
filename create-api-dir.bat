@echo off
REM Simple batch script to create Vercel API directory and functions
REM This is a fallback if the Node.js setup script doesn't work
REM Usage: Run this file from the project root directory

echo Creating api directory for Vercel functions...
mkdir api 2>nul

echo Creating auth-refresh.js...
(
echo import { verify, sign } from 'jsonwebtoken';
echo import { serialize, parse } from 'cookie';
echo.
echo const ACCESS_TOKEN_EXP = 15 * 60;
echo const REFRESH_TOKEN_EXP = 7 * 24 * 60 * 60;
echo.
echo function createCookie(name, value, maxAge) {
echo   return serialize(name, value, {
echo     httpOnly: true,
echo     secure: process.env.NODE_ENV === 'production',
echo     sameSite: 'strict',
echo     path: '/',
echo     maxAge,
echo   });
echo }
echo.
echo export default async function handler(req, res) {
echo   if (req.method !== 'POST') {
echo     return res.status(405).json({ error: 'Method not allowed' });
echo   }
echo   const cookieHeader = req.headers?.cookie ^|^| '';
echo   const cookies = parse(cookieHeader ^|^| '');
echo   const refreshToken = cookies.refreshToken;
echo   if (!refreshToken) {
echo     return res.status(401).json({ error: 'No refresh token' });
echo   }
echo   const refreshSecret = process.env.REFRESH_TOKEN_SECRET ^|^| 'dev_refresh_secret';
echo   const jwtSecret = process.env.JWT_SECRET ^|^| 'dev_secret';
echo   try {
echo     const payload = verify(refreshToken, refreshSecret);
echo     const userId = payload.sub;
echo     const newAccess = sign({ sub: userId }, jwtSecret, { expiresIn: ACCESS_TOKEN_EXP });
echo     const cookie = createCookie('accessToken', newAccess, ACCESS_TOKEN_EXP);
echo     res.setHeader('Set-Cookie', cookie);
echo     return res.status(200).json({ ok: true });
echo   } catch (err) {
echo     return res.status(401).json({ error: 'Invalid refresh token' });
echo   }
echo }
) > api\auth-refresh.js

echo Created api\auth-refresh.js

echo.
echo NOTE: Complete setup by running: node setup-vercel.js
echo This will create all remaining API functions.
echo.
