import bcrypt from "bcrypt";
import { pool } from "../../db/index.js";
import jwt from "jsonwebtoken";
import config from "../../config/index.js";

interface LoginPayload {
    email: string;
    password: string;
}

const loginUserIntoDB = async (payload: LoginPayload) => {
    const { email, password } = payload;

    const userData = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );

    if (userData.rows.length === 0) {
        throw new Error("User not found");
    }

    const user = userData.rows[0];
    const matchPassword = await bcrypt.compare(password, user.password as string);

    if (!matchPassword) {
        throw new Error("Invalid credentials");
    }

    // Only include id, name, role in JWT — keep payload minimal per spec hint
    const jwtPayload = {
        id: user.id as number,
        name: user.name as string,
        role: user.role as string,
    };

    const accessToken = jwt.sign(
        jwtPayload,
        config.access_token_secret as string,
        { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
        jwtPayload,
        config.refresh_token_secret as string,
        { expiresIn: "7d" }
    );

    // Exclude password from the returned user object — never exposed in responses
    const { password: _password, ...userWithoutPassword } = user;

    return { accessToken, refreshToken, user: userWithoutPassword };
};

const generatedFreshToken = async (token: string): Promise<void> => {
    // Refresh token logic placeholder
};

export const authService = {
    loginUserIntoDB,
    generatedFreshToken,
};
