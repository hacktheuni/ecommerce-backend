import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sanitizeReport } from '../utils/sanitizers';



export const reportListedProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized'));
        }

        const { productId, reason, details } = req.body;
        if (!productId || !reason) {
            return next(new ApiError(400, 'Product ID and reason are required'));
        }

        // Check for duplicate report (same user, same product, unresolved)
        const existingReport = await prisma.report.findFirst({
            where: {
                productId,
                reporterId: req.user.id,
                resolved: false
            }
        });

        if (existingReport) {
            return next(new ApiError(400, 'You have already reported this product'));
        }

        const report = await prisma.report.create({
            data: {
                productId,
                reporterId: req.user.id,
                reason,
                details
            },
        });

        return res
            .status(201)
            .json(new ApiResponse(201, { report: sanitizeReport(report) }, 'Product reported successfully'));
    } catch (error) {
        return next(new ApiError(500, 'Unable to report product', [], String(error)));
    }
};

export const getAllReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized'));
        }

        const reports = await prisma.report.findMany({
            include: {
                product: true,
                reporter: true
            }
        });

        const sanitizedReports = reports.map(sanitizeReport);

        return res
            .status(200)
            .json(new ApiResponse(200, { reports: sanitizedReports }, 'Reports retrieved successfully'));
    } catch (error) {
        return next(new ApiError(500, 'Unable to retrieve reports', [], String(error)));
    }
};

export const getReportById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized'));
        }

        const { reportId } = req.query as { reportId: string };
        if (!reportId) {
            return next(new ApiError(400, 'Report ID is required'));
        }

        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: {
                product: true,
                reporter: true
            }
        });

        if (!report) {
            return next(new ApiError(404, 'Report not found'));
        }

        return res
            .status(200)
            .json(new ApiResponse(200, { report: sanitizeReport(report) }, 'Report retrieved successfully'));
    } catch (error) {
        return next(new ApiError(500, 'Unable to retrieve report', [], String(error)));
    }
};

export const resolveReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized'));
        }

        const { reportId, resolved } = req.body;
        if (!reportId || resolved === undefined) {
            return next(new ApiError(400, 'Report ID and status are required'));
        }

        const updatedReport = await prisma.report.update({
            where: { id: reportId },
            data: { resolved },
        });

        return res
            .status(200)
            .json(new ApiResponse(200, { report: sanitizeReport(updatedReport) }, 'Report status updated successfully'));
    } catch (error) {
        return next(new ApiError(500, 'Unable to update report status', [], String(error)));
    }
};

export const deleteReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized'));
        }

        const { reportId } = req.body;
        if (!reportId) {
            return next(new ApiError(400, 'Report ID is required'));
        }

        await prisma.report.delete({
            where: { id: reportId },
        });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, 'Report deleted successfully'));
    } catch (error) {
        return next(new ApiError(500, 'Unable to delete report', [], String(error)));
    }
};