import app from "./app.js";
import { initDB } from "./db/index.js";

const main = () => {
  initDB();
  app.listen(5000, () => {
    console.log("Server is running at port 5000");
  });
};

main();
