import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from "../config/index.js";
import { pool } from "../db/index.js";


 const auth = ({...roles:ROLES.maintainer}) => {
  return async (req: Request, res: Response, next: NextFunction) => {



  try{
  const token = req.headers.authorization

    if(!token){
         res.status(401).json({
      success: false,
      message: "Unauthorized Access",
      
    });
    }

    const decoded = jwt.verify(token as string ,config.access_token_secret as string) as JwtPayload
    const userData = await pool.query(
`SELECT * FROM users WHERE email=$1
   
`,[decoded.email]

    )
   const user = userData.rows[0];
  if(userData.rows.length===0){
     res.status(404).json({
      success: false,
      message: "User not found ",
      
    });
  }
  
  if(roles.length && !roles.includes('maintainer')){
res.status(403).json({
      success: false,
      message: "Forbidden Access ",
  })
  }

  
 
req.user=decoded
    next();
  }catch(error){
next(error)
  }
  };
};


export default auth;