import { Router } from "express";
import { issueController } from "./issue.controller.js";
import auth from "../../middleware/auth.js";
import { USER_ROLE } from "../../types/index.js";

const router = Router();

// Create: authenticated users only (both roles)
router.post("/", auth(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.createIssue);

// Read: public endpoints — no auth required
router.get("/", issueController.getIssues);
router.get("/:id", issueController.getIssueById);

// Update: authenticated users — controller enforces per-role ownership rules
router.patch("/:id", auth(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.updateIssue);

// Delete: maintainer only
router.delete("/:id", auth(USER_ROLE.maintainer), issueController.deleteIssue);

export const issueRoute = router;
