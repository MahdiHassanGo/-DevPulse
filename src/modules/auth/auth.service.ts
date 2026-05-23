import bcrypt from "bcryptjs";
import { pool } from "../../db/index.js";
import jwt from "jsonwebtoken"
import config from "../../config/index.js";
const loginUserIntoDB =async(payload:{
    email:string;
    password:string;
})=>{
const {email,password}=payload
const userData = await pool.query(
`
SELECT * FROM users WHERE email = $1 
`,
[email]
)

if(userData.rows.length ===0){
    throw new Error("User not found")
}
const user = userData.rows[0];
const matchPassword = await bcrypt.compare(password,user.password);

if(!matchPassword){
    throw new Error("Invalid Password")
}
const jwtPayload={
    id:user.id,
    name:user.name,
    email:user.email
    role:user.role
}
const accessToken = jwt.sign(jwtPayload,config.access_token_secret as string,{
  expiresIn:"1d",  
})
const refreshToken = jwt.sign(jwtPayload,config.refresh_token_secret as string,{
  expiresIn:"7d",  
})
return {accessToken,refreshToken}
}
const generatedFreshToken = async(token:string){


}
export const authService ={
    loginUserIntoDB,
    generatedFreshToken
}