import { NextFunction, Request, Response } from "express";
import { issueService } from "./issue.service.js";
import sendResponse from "../../utility/sendResponse.js";
import { USER_ROLE } from "../../types/index.js";

const createIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { title, description, type } = req.body as {
        title: string;
        description: string;
        type: string;
    };

    if (!title || !description || !type) {
        res.status(400).json({
            success: false,
            message: "title, description, and type are required",
        });
        return;
    }

    if (title.length > 150) {
        res.status(400).json({
            success: false,
            message: "title must not exceed 150 characters",
        });
        return;
    }

    if (description.length < 20) {
        res.status(400).json({
            success: false,
            message: "description must be at least 20 characters",
        });
        return;
    }

    if (!["bug", "feature_request"].includes(type)) {
        res.status(400).json({
            success: false,
            message: "type must be bug or feature_request",
        });
        return;
    }

    try {
        const reporter_id = req.user!.id as number;
        const result = await issueService.createIssueIntoDB({ ...req.body, reporter_id });

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "Issue created successfully",
            data: result.rows[0],
        });
    } catch (error: unknown) {
        next(error);
    }
};

const getIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sort = "newest", type, status } = req.query;

    try {
        const data = await issueService.getIssuesFromDB(
            sort as string,
            type as string,
            status as string
        );

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issues retrived successfully",
            data,
        });
    } catch (error: unknown) {
        next(error);
    }
};

const getIssueById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = req.params.id as string;

    try {
        const data = await issueService.getIssueByIdFromDB(id);

        if (!data) {
            res.status(404).json({
                success: false,
                message: "Issue not found",
            });
            return;
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue retrived successfully",
            data,
        });
    } catch (error: unknown) {
        next(error);
    }
};

const updateIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = req.params.id as string;
    const { title, description, type, status } = req.body as {
        title?: string;
        description?: string;
        type?: string;
        status?: string;
    };
    const requestingUser = req.user!;

    if (title && title.length > 150) {
        res.status(400).json({
            success: false,
            message: "title must not exceed 150 characters",
        });
        return;
    }

    if (description && description.length < 20) {
        res.status(400).json({
            success: false,
            message: "description must be at least 20 characters",
        });
        return;
    }

    if (type && !["bug", "feature_request"].includes(type)) {
        res.status(400).json({
            success: false,
            message: "type must be bug or feature_request",
        });
        return;
    }

    try {
        const existing = await issueService.getIssueByIdFromDB(id);

        if (!existing) {
            res.status(404).json({
                success: false,
                message: "Issue not found",
            });
            return;
        }

      
        if (requestingUser.role === USER_ROLE.contributor) {
            if (existing.reporter.id !== requestingUser.id) {
                res.status(403).json({
                    success: false,
                    message: "Forbidden Access",
                });
                return;
            }

            if (existing.status !== "open") {
                res.status(409).json({
                    success: false,
                    message: "Contributors can only update issues with open status",
                });
                return;
            }

            if (status) {
                res.status(403).json({
                    success: false,
                    message: "Contributors cannot change issue status",
                });
                return;
            }
        }

        const result = await issueService.updateIssueInDB(id, req.body);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue updated successfully",
            data: result,
        });
    } catch (error: unknown) {
        next(error);
    }
};

const deleteIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = req.params.id as string;

    try {
        const result = await issueService.deleteIssueFromDB(id);

        if (!result) {
            res.status(404).json({
                success: false,
                message: "Issue not found",
            });
            return;
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue deleted successfully",
        });
    } catch (error: unknown) {
        next(error);
    }
};

export const issueController = {
    createIssue,
    getIssues,
    getIssueById,
    updateIssue,
    deleteIssue,
};
