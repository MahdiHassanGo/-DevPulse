import dotenv from "dotenv"
import path from "path"
dotenv.config({
    path:path.join(process.cwd(),".env"),
})

const config={
    connection_string:process.env.CONNECTION as string ,
    access_token_secret:process.env.ACCESS_TOKEN_SECRET as string,
    refresh_token_secret:process.env.REFRESH_TOKEN_SECRET as string

}

export default config