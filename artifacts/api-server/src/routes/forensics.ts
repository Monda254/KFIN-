import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// -----------------------------------------------------------------------------
// 1. Live Database Telemetry & Health
// -----------------------------------------------------------------------------
router.get("/database/status", async (_req, res) => {
  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      const { rows: extRows } = await client.query<{ extname: string; extversion: string }>(
        "SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'postgis');"
      );

      const { rows: tableCountRows } = await client.query<{ count: string }>(
        "SELECT COUNT(*)::text as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
      );

      // Fetch row counts for core domain tables
      const { rows: caseCount } = await client.query<{ count: string }>("SELECT COUNT(*)::text as count FROM cases;");
      const { rows: evidenceCount } = await client.query<{ count: string }>("SELECT COUNT(*)::text as count FROM evidence_items;");
      const { rows: custodyCount } = await client.query<{ count: string }>("SELECT COUNT(*)::text as count FROM custody_transfers;");
      const { rows: profileCount } = await client.query<{ count: string }>("SELECT COUNT(*)::text as count FROM dna_profiles;");
      const { rows: lociCount } = await client.query<{ count: string }>("SELECT COUNT(*)::text as count FROM str_alleles;");
      const { rows: auditCount } = await client.query<{ count: string }>("SELECT COUNT(*)::text as count FROM audit_events;");

      const latencyMs = Date.now() - start;

      res.json({
        status: "OPERATIONAL",
        engine: "PostgreSQL 17.6 + PostGIS 3.3.7",
        cloudProvider: "Supabase (eu-central-1)",
        latencyMs,
        totalTables: parseInt(tableCountRows[0].count, 10),
        extensions: extRows,
        recordCounts: {
          cases: parseInt(caseCount[0].count, 10),
          evidenceItems: parseInt(evidenceCount[0].count, 10),
          custodyTransfers: parseInt(custodyCount[0].count, 10),
          dnaProfiles: parseInt(profileCount[0].count, 10),
          strAlleles: parseInt(lociCount[0].count, 10),
          auditEvents: parseInt(auditCount[0].count, 10),
        },
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(503).json({
      status: "DEGRADED",
      error: err.message,
      latencyMs: Date.now() - start,
    });
  }
});

// -----------------------------------------------------------------------------
// 2. Cases Management
// -----------------------------------------------------------------------------
router.get("/cases", async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT 
          c.id,
          c.case_number,
          c.title,
          c.description,
          c.status,
          c.priority,
          c.incident_date,
          c.incident_county,
          c.incident_location_coords,
          c.created_at,
          o.name as originating_org_name,
          o.code as originating_org_code,
          u.full_name as lead_investigator_name,
          u.badge_number as lead_investigator_badge,
          COUNT(DISTINCT e.id)::int as evidence_count,
          COUNT(DISTINCT p.id)::int as participant_count
        FROM cases c
        LEFT JOIN organizations o ON c.originating_org_id = o.id
        LEFT JOIN users u ON c.lead_investigator_id = u.id
        LEFT JOIN evidence_items e ON e.case_id = c.id
        LEFT JOIN case_participants p ON p.case_id = c.id
        GROUP BY c.id, o.id, u.id
        ORDER BY c.created_at DESC;
      `);
      res.json({ cases: rows });
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/cases/:id", async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const { rows: caseRows } = await client.query(`
        SELECT 
          c.*,
          o.name as originating_org_name,
          u.full_name as lead_investigator_name
        FROM cases c
        LEFT JOIN organizations o ON c.originating_org_id = o.id
        LEFT JOIN users u ON c.lead_investigator_id = u.id
        WHERE c.id = $1 OR c.case_number = $1
        LIMIT 1;
      `, [req.params.id]);

      if (caseRows.length === 0) {
        res.status(404).json({ error: "Case not found" });
        return;
      }

      const caseItem = caseRows[0];

      const { rows: participants } = await client.query(`
        SELECT * FROM case_participants WHERE case_id = $1;
      `, [caseItem.id]);

      const { rows: notes } = await client.query(`
        SELECT n.*, u.full_name as author_name 
        FROM case_notes n
        LEFT JOIN users u ON n.author_id = u.id
        WHERE n.case_id = $1
        ORDER BY n.created_at DESC;
      `, [caseItem.id]);

      const { rows: evidence } = await client.query(`
        SELECT * FROM evidence_items WHERE case_id = $1 ORDER BY item_number ASC;
      `, [caseItem.id]);

      res.json({
        case: caseItem,
        participants,
        notes,
        evidence,
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. Evidence & Chain of Custody
// -----------------------------------------------------------------------------
router.get("/evidence", async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT 
          e.id,
          e.item_number,
          e.description,
          e.evidence_type,
          e.status,
          e.tamper_seal_number,
          e.packaging_type,
          e.collection_timestamp,
          e.collection_location_desc,
          c.case_number,
          c.title as case_title,
          sl.facility_name as storage_facility,
          sl.vault_number,
          sl.shelf_identifier,
          u.full_name as custodian_name
        FROM evidence_items e
        JOIN cases c ON e.case_id = c.id
        LEFT JOIN storage_locations sl ON e.current_location_id = sl.id
        LEFT JOIN users u ON e.current_custodian_id = u.id
        ORDER BY e.created_at DESC;
      `);
      res.json({ evidence: rows });
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/evidence/:id/custody", async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT 
          ct.id,
          ct.transfer_timestamp,
          ct.transfer_reason,
          ct.authorization_reference,
          ct.seal_intact,
          ct.new_seal_number,
          ct.notes,
          rel.full_name as releasing_officer_name,
          rel.badge_number as releasing_officer_badge,
          rec.full_name as receiving_officer_name,
          rec.badge_number as receiving_officer_badge,
          src.facility_name as source_facility,
          dst.facility_name as destination_facility
        FROM custody_transfers ct
        JOIN evidence_items e ON ct.evidence_id = e.id
        LEFT JOIN users rel ON ct.releasing_officer_id = rel.id
        LEFT JOIN users rec ON ct.receiving_officer_id = rec.id
        LEFT JOIN storage_locations src ON ct.source_location_id = src.id
        LEFT JOIN storage_locations dst ON ct.destination_location_id = dst.id
        WHERE e.id = $1 OR e.item_number = $1
        ORDER BY ct.transfer_timestamp DESC;
      `, [req.params.id]);

      res.json({ custodyHistory: rows });
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 4. DNA Profiles & Alleles
// -----------------------------------------------------------------------------
router.get("/dna/profiles", async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT 
          p.id,
          p.profile_identifier,
          p.profile_quality,
          p.loci_count,
          p.profile_status,
          p.extraction_method,
          p.quantification_kit,
          p.amplification_kit,
          p.electrophoresis_instrument,
          p.created_at,
          idx.code as index_code,
          idx.name as index_name,
          s.sample_number,
          s.sample_type,
          s.donor_type,
          u.full_name as analyst_name
        FROM dna_profiles p
        JOIN dna_indices idx ON p.index_id = idx.id
        JOIN biological_samples s ON p.sample_id = s.id
        LEFT JOIN users u ON p.analyst_id = u.id
        ORDER BY p.created_at DESC;
      `);
      res.json({ profiles: rows });
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dna/profiles/:id/loci", async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT 
          a.locus_name,
          a.allele_1,
          a.allele_2,
          a.allele_3,
          a.allele_4,
          a.peak_height_1,
          a.peak_height_2
        FROM str_alleles a
        JOIN dna_profiles p ON a.dna_profile_id = p.id
        WHERE p.id = $1 OR p.profile_identifier = $1
        ORDER BY a.locus_name ASC;
      `, [req.params.id]);

      res.json({ loci: rows });
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dna/indices", async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT 
          idx.id,
          idx.code,
          idx.name,
          idx.description,
          idx.legal_basis_regulation,
          idx.retention_years_default,
          idx.is_restricted,
          COUNT(p.id)::int as profile_count
        FROM dna_indices idx
        LEFT JOIN dna_profiles p ON p.index_id = idx.id
        GROUP BY idx.id
        ORDER BY idx.code ASC;
      `);
      res.json({ indices: rows });
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 5. Laboratory Submissions & Reports
// -----------------------------------------------------------------------------
router.get("/laboratory/submissions", async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT 
          sub.id,
          sub.submission_number,
          sub.urgency,
          sub.status,
          sub.submission_date,
          sub.case_summary_notes,
          c.case_number,
          sub_org.name as submitting_org,
          lab_org.name as receiving_lab,
          auth.full_name as authorized_by_name,
          COUNT(er.id)::int as examination_count
        FROM lab_submissions sub
        JOIN cases c ON sub.case_id = c.id
        JOIN organizations sub_org ON sub.submitting_org_id = sub_org.id
        JOIN organizations lab_org ON sub.receiving_lab_id = lab_org.id
        LEFT JOIN users auth ON sub.authorized_by_id = auth.id
        LEFT JOIN examination_requests er ON er.submission_id = sub.id
        GROUP BY sub.id, c.id, sub_org.id, lab_org.id, auth.id
        ORDER BY sub.submission_date DESC;
      `);

      const { rows: reports } = await client.query(`
        SELECT 
          rep.id,
          rep.report_number,
          rep.conclusion_summary,
          rep.formal_report_hash,
          rep.is_approved,
          rep.issued_at,
          an.full_name as reporting_analyst,
          dir.full_name as approving_director
        FROM lab_reports rep
        JOIN users an ON rep.reporting_analyst_id = an.id
        LEFT JOIN users dir ON rep.approving_director_id = dir.id
        ORDER BY rep.issued_at DESC;
      `);

      res.json({
        submissions: rows,
        reports,
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 6. Audit Trail Ledger
// -----------------------------------------------------------------------------
router.get("/audit/events", async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT 
          ae.id,
          ae.created_at,
          ae.data_classification,
          ae.action,
          ae.entity_type,
          ae.entity_id,
          ae.outcome,
          ae.reason,
          ae.actor_ip_address,
          ae.metadata,
          u.full_name as actor_name,
          u.badge_number as actor_badge
        FROM audit_events ae
        LEFT JOIN users u ON ae.actor_id = u.id
        ORDER BY ae.created_at DESC
        LIMIT 50;
      `);
      res.json({ events: rows });
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 7. Organizations Catalog
// -----------------------------------------------------------------------------
router.get("/organizations", async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT id, code, name, type, jurisdiction_region, contact_email, is_active
        FROM organizations
        ORDER BY name ASC;
      `);
      res.json({ organizations: rows });
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
