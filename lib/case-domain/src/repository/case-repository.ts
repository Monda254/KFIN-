import crypto from "node:crypto";
import { pool } from "@workspace/db";
import type {
  CaseRecord,
  CaseParticipantRecord,
  CaseAssignmentRecord,
  CaseTransferRecord,
  CaseLinkRecord,
  CaseNoteRecord,
  CaseStatusHistoryRecord,
  CaseTimelineItem,
  CreateCaseInput,
  CaseSearchFilter,
  AddParticipantInput,
  AddNoteInput,
  AssignCaseInput,
  TransferCaseInput,
  LinkCaseInput,
} from "../types";
import { generateCaseNumber } from "../aggregate/numbering";
import { ConcurrencyConflictError } from "../types";

export class CaseRepository {
  /**
   * Creates a new case and its initial lifecycle history in the database.
   */
  public async createCase(
    input: CreateCaseInput,
    actorId: string,
    orgCode: string
  ): Promise<CaseRecord> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");

      const caseNumber = generateCaseNumber(orgCode);
      const priority = input.priority ?? "ROUTINE";
      const caseType = input.caseType ?? "CRIMINAL_INVESTIGATION";
      const classification = input.dataClassification ?? "RESTRICTED";
      const incidentDate = new Date(input.incidentDate);

      const insertCaseSql = `
        INSERT INTO cases (
          case_number, case_type, title, description, originating_org_id,
          lead_investigator_id, status, priority, incident_date, incident_county,
          incident_location_coords, data_classification, version
        ) VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', $7, $8, $9, $10, $11, 1)
        RETURNING *;
      `;
      const { rows } = await client.query(insertCaseSql, [
        caseNumber,
        caseType,
        input.title.trim(),
        input.description.trim(),
        input.originatingOrgId,
        input.leadInvestigatorId,
        priority,
        incidentDate,
        input.incidentCounty.trim(),
        input.incidentLocationCoords ?? null,
        classification,
      ]);
      const created = this.mapCaseRow(rows[0]);

      // 1. Initial Status History
      await client.query(
        `INSERT INTO case_status_history (case_id, actor_id, previous_status, new_status, reason, data_classification)
         VALUES ($1, $2, 'DRAFT', 'OPEN', 'Initial forensic case registration', $3);`,
        [created.id, actorId, classification]
      );

      // 2. Initial Lead Investigator Assignment
      await client.query(
        `INSERT INTO case_assignments (
           case_id, user_id, organization_id, case_role, access_scope, assigned_by_id, is_active, data_classification
         ) VALUES ($1, $2, $3, 'LEAD_INVESTIGATOR', 'FULL', $4, true, $5);`,
        [created.id, input.leadInvestigatorId, input.originatingOrgId, actorId, classification]
      );

      await client.query("COMMIT;");
      return created;
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  }

  public async findById(id: string): Promise<CaseRecord | null> {
    const { rows } = await pool.query(
      "SELECT * FROM cases WHERE id = $1;",
      [id]
    );
    if (rows.length === 0) return null;
    return this.mapCaseRow(rows[0]);
  }

  public async findByCaseNumber(caseNumber: string): Promise<CaseRecord | null> {
    const { rows } = await pool.query(
      "SELECT * FROM cases WHERE case_number = $1;",
      [caseNumber]
    );
    if (rows.length === 0) return null;
    return this.mapCaseRow(rows[0]);
  }

  public async saveCase(caseRecord: CaseRecord): Promise<void> {
    const updateSql = `
      UPDATE cases
      SET
        title = $1,
        description = $2,
        priority = $3,
        status = $4,
        originating_org_id = $5,
        lead_investigator_id = $6,
        incident_county = $7,
        incident_location_coords = $8,
        closure_reason = $9,
        closed_at = $10,
        closed_by_id = $11,
        reopened_reason = $12,
        reopened_at = $13,
        reopened_by_id = $14,
        data_classification = $15,
        version = $16,
        updated_at = NOW()
      WHERE id = $17 AND version = $18;
    `;

    const { rowCount } = await pool.query(updateSql, [
      caseRecord.title,
      caseRecord.description,
      caseRecord.priority,
      caseRecord.status,
      caseRecord.originatingOrgId,
      caseRecord.leadInvestigatorId,
      caseRecord.incidentCounty,
      caseRecord.incidentLocationCoords ?? null,
      caseRecord.closureReason ?? null,
      caseRecord.closedAt ?? null,
      caseRecord.closedById ?? null,
      caseRecord.reopenedReason ?? null,
      caseRecord.reopenedAt ?? null,
      caseRecord.reopenedById ?? null,
      caseRecord.dataClassification,
      caseRecord.version, // new version
      caseRecord.id,
      caseRecord.version - 1, // expected prior version
    ]);

    if (rowCount === 0) {
      throw new ConcurrencyConflictError(caseRecord.version - 1, caseRecord.version);
    }
  }

  public async recordStatusHistory(
    caseId: string,
    actorId: string,
    previousStatus: string,
    newStatus: string,
    reason: string,
    classification: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO case_status_history (case_id, actor_id, previous_status, new_status, reason, data_classification)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [caseId, actorId, previousStatus, newStatus, reason, classification]
    );
  }

  public async getStatusHistory(caseId: string): Promise<CaseStatusHistoryRecord[]> {
    const { rows } = await pool.query(
      `SELECT * FROM case_status_history WHERE case_id = $1 ORDER BY created_at ASC;`,
      [caseId]
    );
    return rows.map((r) => ({
      id: r.id,
      caseId: r.case_id,
      actorId: r.actor_id,
      previousStatus: r.previous_status,
      newStatus: r.new_status,
      reason: r.reason,
      dataClassification: r.data_classification,
      createdAt: new Date(r.created_at),
    }));
  }

  public async addAssignment(
    caseId: string,
    input: AssignCaseInput,
    assignedById: string,
    classification: string
  ): Promise<CaseAssignmentRecord> {
    const sql = `
      INSERT INTO case_assignments (
        case_id, user_id, organization_id, case_role, access_scope, assigned_by_id, is_active, data_classification
      ) VALUES ($1, $2, $3, $4, $5, $6, true, $7)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [
      caseId,
      input.userId,
      input.organizationId,
      input.caseRole,
      input.accessScope ?? "FULL",
      assignedById,
      classification,
    ]);
    return this.mapAssignmentRow(rows[0]);
  }

  public async revokeAssignment(
    assignmentId: string,
    revokedById: string,
    reason: string
  ): Promise<void> {
    await pool.query(
      `UPDATE case_assignments
       SET is_active = false, revoked_at = NOW(), revoked_by_id = $2, revocation_reason = $3, updated_at = NOW()
       WHERE id = $1;`,
      [assignmentId, revokedById, reason]
    );
  }

  public async getAssignments(caseId: string): Promise<CaseAssignmentRecord[]> {
    const { rows } = await pool.query(
      `SELECT * FROM case_assignments WHERE case_id = $1 ORDER BY assigned_at DESC;`,
      [caseId]
    );
    return rows.map((r) => this.mapAssignmentRow(r));
  }

  public async addTransfer(
    caseId: string,
    fromOrgId: string,
    toOrgId: string,
    fromInvestigatorId: string,
    toInvestigatorId: string,
    input: TransferCaseInput,
    transferredById: string,
    classification: string
  ): Promise<CaseTransferRecord> {
    const sql = `
      INSERT INTO case_transfers (
        case_id, from_org_id, to_org_id, from_investigator_id, to_investigator_id,
        transfer_reason, authorization_reference, transferred_by_id, status, notes, data_classification
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'COMPLETED', $9, $10)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [
      caseId,
      fromOrgId,
      toOrgId,
      fromInvestigatorId,
      toInvestigatorId,
      input.transferReason,
      input.authorizationReference ?? null,
      transferredById,
      input.notes ?? null,
      classification,
    ]);
    return this.mapTransferRow(rows[0]);
  }

  public async getTransfers(caseId: string): Promise<CaseTransferRecord[]> {
    const { rows } = await pool.query(
      `SELECT * FROM case_transfers WHERE case_id = $1 ORDER BY transferred_at DESC;`,
      [caseId]
    );
    return rows.map((r) => this.mapTransferRow(r));
  }

  public async addParticipant(
    caseId: string,
    input: AddParticipantInput,
    classification: string
  ): Promise<CaseParticipantRecord> {
    const docHash = input.idDocumentNumber
      ? crypto.createHash("sha256").update(input.idDocumentNumber.trim()).digest("hex")
      : null;

    const sql = `
      INSERT INTO case_participants (
        case_id, participant_type, pseudonym, id_document_type, id_document_hash,
        demographics, notes, data_classification
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [
      caseId,
      input.participantType,
      input.pseudonym ?? null,
      input.idDocumentType ?? null,
      docHash,
      input.demographics ? JSON.stringify(input.demographics) : null,
      input.notes ?? null,
      classification,
    ]);
    return this.mapParticipantRow(rows[0]);
  }

  public async removeParticipant(participantId: string): Promise<void> {
    await pool.query(
      `DELETE FROM case_participants WHERE id = $1;`,
      [participantId]
    );
  }

  public async getParticipants(caseId: string): Promise<CaseParticipantRecord[]> {
    const { rows } = await pool.query(
      `SELECT * FROM case_participants WHERE case_id = $1 ORDER BY created_at ASC;`,
      [caseId]
    );
    return rows.map((r) => this.mapParticipantRow(r));
  }

  public async addNote(
    caseId: string,
    authorId: string,
    input: AddNoteInput,
    classification: string
  ): Promise<CaseNoteRecord> {
    const sql = `
      INSERT INTO case_notes (case_id, author_id, note_text, is_confidential, data_classification)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [
      caseId,
      authorId,
      input.noteText.trim(),
      Boolean(input.isConfidential),
      classification,
    ]);
    return this.mapNoteRow(rows[0]);
  }

  public async getNotes(caseId: string, includeConfidential: boolean): Promise<CaseNoteRecord[]> {
    const query = includeConfidential
      ? `SELECT * FROM case_notes WHERE case_id = $1 ORDER BY created_at ASC;`
      : `SELECT * FROM case_notes WHERE case_id = $1 AND is_confidential = false ORDER BY created_at ASC;`;
    const { rows } = await pool.query(query, [caseId]);
    return rows.map((r) => this.mapNoteRow(r));
  }

  public async addLink(
    sourceCaseId: string,
    input: LinkCaseInput,
    createdById: string,
    classification: string
  ): Promise<CaseLinkRecord> {
    const sql = `
      INSERT INTO case_links (source_case_id, target_case_id, link_type, notes, created_by_id, data_classification)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (source_case_id, target_case_id, link_type) DO NOTHING
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [
      sourceCaseId,
      input.targetCaseId,
      input.linkType,
      input.notes ?? null,
      createdById,
      classification,
    ]);
    return this.mapLinkRow(rows[0]);
  }

  public async getLinks(caseId: string): Promise<CaseLinkRecord[]> {
    const { rows } = await pool.query(
      `SELECT * FROM case_links WHERE source_case_id = $1 OR target_case_id = $1 ORDER BY created_at DESC;`,
      [caseId]
    );
    return rows.map((r) => this.mapLinkRow(r));
  }

  public async getActiveExaminationRequestsCount(caseId: string): Promise<number> {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT count(*)::text as count
       FROM examination_requests er
       JOIN lab_submissions ls ON er.submission_id = ls.id
       WHERE ls.case_id = $1 AND er.stage != 'APPROVED';`,
      [caseId]
    );
    return parseInt(rows[0]?.count ?? "0", 10);
  }

  public async getTimeline(caseId: string): Promise<CaseTimelineItem[]> {
    const items: CaseTimelineItem[] = [];

    // 1. Status history
    const { rows: statusRows } = await pool.query(
      `SELECT * FROM case_status_history WHERE case_id = $1;`,
      [caseId]
    );
    for (const r of statusRows) {
      items.push({
        id: r.id,
        eventType: "STATUS_CHANGE",
        timestamp: new Date(r.created_at),
        actorId: r.actor_id,
        summary: `Status transitioned from ${r.previous_status} to ${r.new_status}`,
        details: { reason: r.reason, from: r.previous_status, to: r.new_status },
        classification: r.data_classification,
      });
    }

    // 2. Assignments
    const { rows: assignRows } = await pool.query(
      `SELECT * FROM case_assignments WHERE case_id = $1;`,
      [caseId]
    );
    for (const r of assignRows) {
      items.push({
        id: r.id,
        eventType: r.is_active ? "ASSIGNMENT" : "ASSIGNMENT_REVOKED",
        timestamp: new Date(r.assigned_at),
        actorId: r.assigned_by_id,
        summary: `Personnel assigned as ${r.case_role}`,
        details: { userId: r.user_id, role: r.case_role, scope: r.access_scope },
        classification: r.data_classification,
      });
    }

    // 3. Transfers
    const { rows: transferRows } = await pool.query(
      `SELECT * FROM case_transfers WHERE case_id = $1;`,
      [caseId]
    );
    for (const r of transferRows) {
      items.push({
        id: r.id,
        eventType: "TRANSFER",
        timestamp: new Date(r.transferred_at),
        actorId: r.transferred_by_id,
        summary: `Case transferred: ${r.transfer_reason}`,
        details: { fromOrg: r.from_org_id, toOrg: r.to_org_id },
        classification: r.data_classification,
      });
    }

    // 4. Notes
    const { rows: noteRows } = await pool.query(
      `SELECT * FROM case_notes WHERE case_id = $1;`,
      [caseId]
    );
    for (const r of noteRows) {
      items.push({
        id: r.id,
        eventType: "NOTE_ADDED",
        timestamp: new Date(r.created_at),
        actorId: r.author_id,
        summary: `Investigative note recorded (${r.is_confidential ? "CONFIDENTIAL" : "STANDARD"})`,
        classification: r.data_classification,
      });
    }

    return items.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  public async searchCases(filter: CaseSearchFilter): Promise<{ cases: CaseRecord[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let pIdx = 1;

    if (filter.organizationId) {
      conditions.push(`originating_org_id = $${pIdx++}`);
      params.push(filter.organizationId);
    }

    if (filter.status) {
      conditions.push(`status = $${pIdx++}`);
      params.push(filter.status);
    }

    if (filter.caseType) {
      conditions.push(`case_type = $${pIdx++}`);
      params.push(filter.caseType);
    }

    if (filter.priority) {
      conditions.push(`priority = $${pIdx++}`);
      params.push(filter.priority);
    }

    if (filter.leadInvestigatorId) {
      conditions.push(`lead_investigator_id = $${pIdx++}`);
      params.push(filter.leadInvestigatorId);
    }

    if (filter.county) {
      conditions.push(`incident_county ILIKE $${pIdx++}`);
      params.push(`%${filter.county}%`);
    }

    if (filter.query) {
      conditions.push(`(title ILIKE $${pIdx} OR case_number ILIKE $${pIdx} OR description ILIKE $${pIdx})`);
      params.push(`%${filter.query}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countSql = `SELECT count(*)::text as total FROM cases ${whereClause};`;
    const { rows: countRows } = await pool.query<{ total: string }>(countSql, params);
    const total = parseInt(countRows[0]?.total ?? "0", 10);

    const limit = Math.min(filter.limit ?? 50, 100);
    const offset = filter.offset ?? 0;

    const dataSql = `
      SELECT * FROM cases
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;
    params.push(limit, offset);

    const { rows } = await pool.query(dataSql, params);
    return {
      cases: rows.map((r) => this.mapCaseRow(r)),
      total,
    };
  }

  private mapCaseRow(r: any): CaseRecord {
    return {
      id: r.id,
      caseNumber: r.case_number,
      caseType: r.case_type,
      title: r.title,
      description: r.description,
      originatingOrgId: r.originating_org_id,
      leadInvestigatorId: r.lead_investigator_id,
      status: r.status,
      priority: r.priority,
      incidentDate: new Date(r.incident_date),
      incidentCounty: r.incident_county,
      incidentLocationCoords: r.incident_location_coords,
      closureReason: r.closure_reason,
      closedAt: r.closed_at ? new Date(r.closed_at) : null,
      closedById: r.closed_by_id,
      reopenedReason: r.reopened_reason,
      reopenedAt: r.reopened_at ? new Date(r.reopened_at) : null,
      reopenedById: r.reopened_by_id,
      dataClassification: r.data_classification,
      version: r.version,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    };
  }

  private mapAssignmentRow(r: any): CaseAssignmentRecord {
    return {
      id: r.id,
      caseId: r.case_id,
      userId: r.user_id,
      organizationId: r.organization_id,
      caseRole: r.case_role,
      accessScope: r.access_scope,
      assignedAt: new Date(r.assigned_at),
      assignedById: r.assigned_by_id,
      revokedAt: r.revoked_at ? new Date(r.revoked_at) : null,
      revokedById: r.revoked_by_id,
      revocationReason: r.revocation_reason,
      isActive: r.is_active,
      dataClassification: r.data_classification,
      version: r.version,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    };
  }

  private mapTransferRow(r: any): CaseTransferRecord {
    return {
      id: r.id,
      caseId: r.case_id,
      fromOrgId: r.from_org_id,
      toOrgId: r.to_org_id,
      fromInvestigatorId: r.from_investigator_id,
      toInvestigatorId: r.to_investigator_id,
      transferReason: r.transfer_reason,
      authorizationReference: r.authorization_reference,
      transferredById: r.transferred_by_id,
      transferredAt: new Date(r.transferred_at),
      effectiveDate: new Date(r.effective_date),
      status: r.status,
      notes: r.notes,
      dataClassification: r.data_classification,
      createdAt: new Date(r.created_at),
    };
  }

  private mapParticipantRow(r: any): CaseParticipantRecord {
    return {
      id: r.id,
      caseId: r.case_id,
      participantType: r.participant_type,
      pseudonym: r.pseudonym,
      idDocumentType: r.id_document_type,
      idDocumentHash: r.id_document_hash,
      demographics: r.demographics,
      notes: r.notes,
      dataClassification: r.data_classification,
      version: r.version,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    };
  }

  private mapNoteRow(r: any): CaseNoteRecord {
    return {
      id: r.id,
      caseId: r.case_id,
      authorId: r.author_id,
      noteText: r.note_text,
      isConfidential: r.is_confidential,
      dataClassification: r.data_classification,
      version: r.version,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    };
  }

  private mapLinkRow(r: any): CaseLinkRecord {
    return {
      id: r.id,
      sourceCaseId: r.source_case_id,
      targetCaseId: r.target_case_id,
      linkType: r.link_type,
      notes: r.notes,
      createdById: r.created_by_id,
      dataClassification: r.data_classification,
      createdAt: new Date(r.created_at),
    };
  }
}
