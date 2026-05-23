import { Request, Response } from "express";
import { issueService } from "./issue.service.js";


const     createIssue = async (req: Request, res: Response) => {
  const { title, description, type, reporter_id } = req.body;

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
    
    const result = await issueService.createIssueIntoDB(req.body)

    res.status(200).json({
      success: true,

      message: "Issue created successfully",

      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,

      message: error.message,

      errors: error,
    });
  }
}

const getIssues = async (req: Request, res: Response) => {
  const { sort = "newest", type, status } = req.query;

  try {
    const data = await issueService.getIssuesFromDB(
      sort as string,
      type as string,
      status as string
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

const getIssueById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const data = await issueService.getIssueByIdFromDB(id as string);

    if (!data) {
      res.status(404).json({
        success: false,
        message: "Issue not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

const updateIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, type, status } = req.body;

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

  if (status && !["open", "in_progress", "resolved"].includes(status)) {
    res.status(400).json({
      success: false,
      message: "status must be open, in_progress, or resolved",
    });
    return;
  }

  try {
    const existing = await issueService.getIssueByIdFromDB(id as string);

    if (!existing) {
      res.status(404).json({
        success: false,
        message: "Issue not found",
      });
      return;
    }

    const result = await issueService.updateIssueInDB(id as string, req.body);

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

const deleteIssue = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await issueService.deleteIssueFromDB(id as string);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Issue not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

export const issueController={
    createIssue,
    getIssues,
    getIssueById,
    updateIssue,
    deleteIssue
}
