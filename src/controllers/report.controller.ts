import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.ts';
import { ApiError } from '../utils/ApiError.ts';
import { ApiResponse } from '../utils/ApiResponse.ts';
import { generateAccessToken, generateRefreshToken } from '../utils/auth.ts';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.ts';
import type { Decimal } from '@prisma/client/runtime/client';

const sanitizeReport = (report: { id: string; productId: string; reporterId: string; reason: string; resolved: boolean; createdAt: Date; }) => ({
    id: report.id,
    productId: report.productId,
    reporterId: report.reporterId,
    reason: report.reason,
    resolved: report.resolved,
    createdAt: report.createdAt
});

export const reportListedProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized'));
        }

        const { productId, reason } = req.body;
        if (!productId || !reason) {
            return next(new ApiError(400, 'Product ID and reason are required'));
        }

        const report = await prisma.report.create({
            data: {
                productId,
                reporterId: req.user.id,
                reason
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

        const reports = await prisma.report.findMany();

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