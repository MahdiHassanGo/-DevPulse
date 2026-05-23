import { Router } from "express";
import { issueController } from "./issue.controller.js";
import auth from "../../middleware/auth.js";
import { USER_ROLE } from "../../types/index.js";

const router = Router();



router.post("/", issueController.createIssue);
router.get("/", issueController.getIssues);
router.get("/:id", issueController.getIssueById);
router.patch("/:id", issueController.updateIssue);
router.delete("/:id",auth(USER_ROLE.maintainer), issueController.deleteIssue);

export const issueRoute = router;