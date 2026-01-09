import { query, queryOne, insert, QueryParams, SqlValue } from '../db';

/**
 * Audit action types
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'VIEW'
  | 'EXPORT';

/**
 * AuditLog entity interface (matches SQL schema)
 */
export interface AuditLog {
  id: string;
  storeId: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * Database record interface for AuditLogs table
 */
interface AuditLogRecord {
  Id: string;
  StoreId: string;
  UserId: string | null;
  Action: string;
  EntityType: string;
  EntityId: string | null;
  OldValues: string | null;
  NewValues: string | null;
  IpAddress: string | null;
  UserAgent: string | null;
  CreatedAt: Date;
}

/**
 * Input for creating an audit log entry
 */
export interface CreateAuditLogInput {
  storeId: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Filter options for querying audit logs
 */
export interface AuditLogFilterOptions {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Paginated result for audit logs
 */
export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * AuditLog repository for managing audit trail
 * Note: This repository does NOT extend BaseRepository because audit logs
 * have different requirements (no update/delete)
 */
export class AuditLogRepository {
  /**
   * Map database record to AuditLog entity
   */
  private mapToEntity(record: AuditLogRecord): AuditLog {
    return {
      id: record.Id,
      storeId: record.StoreId,
      userId: record.UserId || undefined,
      action: record.Action as AuditAction,
      entityType: record.EntityType,
      entityId: record.EntityId || undefined,
      oldValues: record.OldValues ? JSON.parse(record.OldValues) : undefined,
      newValues: record.NewValues ? JSON.parse(record.NewValues) : undefined,
      ipAddress: record.IpAddress || undefined,
      userAgent: record.UserAgent || undefined,
      createdAt:
        record.CreatedAt instanceof Date
          ? record.CreatedAt.toISOString()
          : String(record.CreatedAt),
    };
  }

  /**
   * Create a new audit log entry
   */
  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const record: Record<string, SqlValue> = {
      Id: crypto.randomUUID(),
      StoreId: input.storeId,
      UserId: input.userId || null,
      Action: input.action,
      EntityType: input.entityType,
      EntityId: input.entityId || null,
      OldValues: input.oldValues ? JSON.stringify(input.oldValues) : null,
      NewValues: input.newValues ? JSON.stringify(input.newValues) : null,
      IpAddress: input.ipAddress || null,
      UserAgent: input.userAgent || null,
      CreatedAt: new Date(),
    };

    const result = await insert<AuditLogRecord>('AuditLogs', record);
    if (!result) {
      throw new Error('Failed to create audit log entry');
    }

    return this.mapToEntity(result);
  }

  /**
   * Find audit logs for a specific store with filtering and pagination
   */
  async findByStore(
    storeId: string,
    options?: AuditLogFilterOptions
  ): Promise<PaginatedAuditLogs> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let whereClause = 'StoreId = @storeId';
    const params: QueryParams = { storeId };

    if (options?.userId) {
      whereClause += ' AND UserId = @userId';
      params.userId = options.userId;
    }

    if (options?.action) {
      whereClause += ' AND Action = @action';
      params.action = options.action;
    }

    if (options?.entityType) {
      whereClause += ' AND EntityType = @entityType';
      params.entityType = options.entityType;
    }

    if (options?.entityId) {
      whereClause += ' AND EntityId = @entityId';
      params.entityId = options.entityId;
    }

    if (options?.dateFrom) {
      whereClause += ' AND CreatedAt >= @dateFrom';
      params.dateFrom = new Date(options.dateFrom);
    }

    if (options?.dateTo) {
      whereClause += ' AND CreatedAt <= @dateTo';
      params.dateTo = new Date(options.dateTo);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM AuditLogs WHERE ${whereClause}`;
    const countResult = await queryOne<{ total: number }>(countQuery, params);
    const total = countResult?.total ?? 0;

    // Get paginated results
    const dataQuery = `
      SELECT * FROM AuditLogs 
      WHERE ${whereClause}
      ORDER BY CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;

    const results = await query<AuditLogRecord>(dataQuery, {
      ...params,
      offset,
      pageSize,
    });

    return {
      data: results.map((r) => this.mapToEntity(r)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Find audit logs for a specific entity
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    storeId?: string
  ): Promise<AuditLog[]> {
    let whereClause = 'EntityType = @entityType AND EntityId = @entityId';
    const params: QueryParams = { entityType, entityId };

    if (storeId) {
      whereClause += ' AND StoreId = @storeId';
      params.storeId = storeId;
    }

    const results = await query<AuditLogRecord>(
      `SELECT * FROM AuditLogs 
       WHERE ${whereClause}
       ORDER BY CreatedAt DESC`,
      params
    );

    return results.map((r) => this.mapToEntity(r));
  }

  /**
   * Find audit logs for a specific user
   */
  async findByUser(
    userId: string,
    options?: AuditLogFilterOptions
  ): Promise<PaginatedAuditLogs> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let whereClause = 'UserId = @userId';
    const params: QueryParams = { userId };

    if (options?.action) {
      whereClause += ' AND Action = @action';
      params.action = options.action;
    }

    if (options?.entityType) {
      whereClause += ' AND EntityType = @entityType';
      params.entityType = options.entityType;
    }

    if (options?.dateFrom) {
      whereClause += ' AND CreatedAt >= @dateFrom';
      params.dateFrom = new Date(options.dateFrom);
    }

    if (options?.dateTo) {
      whereClause += ' AND CreatedAt <= @dateTo';
      params.dateTo = new Date(options.dateTo);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM AuditLogs WHERE ${whereClause}`;
    const countResult = await queryOne<{ total: number }>(countQuery, params);
    const total = countResult?.total ?? 0;

    // Get paginated results
    const dataQuery = `
      SELECT * FROM AuditLogs 
      WHERE ${whereClause}
      ORDER BY CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;

    const results = await query<AuditLogRecord>(dataQuery, {
      ...params,
      offset,
      pageSize,
    });

    return {
      data: results.map((r) => this.mapToEntity(r)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get audit log by ID
   */
  async findById(id: string): Promise<AuditLog | null> {
    const result = await queryOne<AuditLogRecord>(
      'SELECT * FROM AuditLogs WHERE Id = @id',
      { id }
    );

    return result ? this.mapToEntity(result) : null;
  }

  /**
   * Get distinct entity types that have been audited
   */
  async getAuditedEntityTypes(storeId?: string): Promise<string[]> {
    let whereClause = '1=1';
    const params: QueryParams = {};

    if (storeId) {
      whereClause = 'StoreId = @storeId';
      params.storeId = storeId;
    }

    const results = await query<{ EntityType: string }>(
      `SELECT DISTINCT EntityType FROM AuditLogs 
       WHERE ${whereClause}
       ORDER BY EntityType`,
      params
    );

    return results.map((r) => r.EntityType);
  }

  /**
   * Get audit summary statistics for a store
   */
  async getSummary(
    storeId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    totalActions: number;
    actionCounts: Record<string, number>;
    entityTypeCounts: Record<string, number>;
  }> {
    let whereClause = 'StoreId = @storeId';
    const params: QueryParams = { storeId };

    if (dateFrom) {
      whereClause += ' AND CreatedAt >= @dateFrom';
      params.dateFrom = new Date(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND CreatedAt <= @dateTo';
      params.dateTo = new Date(dateTo);
    }

    // Get total count
    const totalResult = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM AuditLogs WHERE ${whereClause}`,
      params
    );

    // Get action counts
    const actionResults = await query<{ Action: string; Count: number }>(
      `SELECT Action, COUNT(*) as Count FROM AuditLogs 
       WHERE ${whereClause}
       GROUP BY Action`,
      params
    );

    // Get entity type counts
    const entityTypeResults = await query<{
      EntityType: string;
      Count: number;
    }>(
      `SELECT EntityType, COUNT(*) as Count FROM AuditLogs 
       WHERE ${whereClause}
       GROUP BY EntityType`,
      params
    );

    const actionCounts: Record<string, number> = {};
    actionResults.forEach((r) => {
      actionCounts[r.Action] = r.Count;
    });

    const entityTypeCounts: Record<string, number> = {};
    entityTypeResults.forEach((r) => {
      entityTypeCounts[r.EntityType] = r.Count;
    });

    return {
      totalActions: totalResult?.total ?? 0,
      actionCounts,
      entityTypeCounts,
    };
  }
}

// Export singleton instance
export const auditLogRepository = new AuditLogRepository();
