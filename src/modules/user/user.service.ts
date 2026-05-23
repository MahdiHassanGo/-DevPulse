import { pool } from "../../db/index.js";
import { IUser } from "./user.interface.js";

const createUserIntoDB= async(payload:IUser)=>{
    const {name,email,password,role}=payload
     const result = await pool.query(
      `
  INSERT INTO users(name,email,password,role)
  VALUES ($1,$2,$3,$4)
  RETURNING name,email,role  
    `,
      [name, email, password, role],
    );
    return result
}

export const userService={
    createUserIntoDB
}