export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Extract and validate pagination parameters from query
 */
export const getPaginationParams = (query: any): PaginationParams => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    return { page, limit };
};

/**
 * Calculate skip value for Prisma queries
 */
export const getSkip = (page: number, limit: number): number => {
    return (page - 1) * limit;
};

/**
 * Create pagination metadata for response
 */
export const createPaginationMeta = (
    total: number,
    page: number,
    limit: number
): PaginationMeta => {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
};

/**
 * Create paginated response with data and metadata
 */
export const createPaginatedResponse = <T>(
    data: T[],
    total: number,
    page: number,
    limit: number
) => {
    return {
        data,
        pagination: createPaginationMeta(total, page, limit),
    };
};
