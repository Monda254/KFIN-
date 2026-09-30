import { pool } from "@workspace/db";

export async function runSyntheticSeed(): Promise<void> {
  console.log("=====================================================================");
  console.log("             KFIN SYNTHETIC SEED ENGINE (100% FICTIONAL)");
  console.log("=====================================================================");

  const client = await pool.connect();
  try {
    console.log("Seeding baseline clearance levels...");
    const clearanceData = [
      { level: 1, code: "PUBLIC", desc: "Publicly accessible forensic statistics and notices" },
      { level: 2, code: "INTERNAL", desc: "General internal law enforcement administrative records" },
      { level: 3, code: "RESTRICTED", desc: "Active investigative cases and laboratory submissions" },
      { level: 4, code: "CONFIDENTIAL", desc: "Chain of custody records, participant identities, and lab reports" },
      { level: 5, code: "HIGHLY_RESTRICTED", desc: "DNA profile allele data, offender indices, and immutable audit logs" },
    ];

    for (const c of clearanceData) {
      await client.query(`
        INSERT INTO clearance_levels (level, code, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (level) DO UPDATE SET description = EXCLUDED.description;
      `, [c.level, c.code, c.desc]);
    }

    const { rows: clearances } = await client.query<{ id: string; code: string }>(
      "SELECT id, code FROM clearance_levels;"
    );
    const clearanceMap = new Map(clearances.map((c) => [c.code, c.id]));

    console.log("Seeding synthetic organizations...");
    const orgData = [
      { code: "DCI-HQ", name: "DCI Headquarters Forensic Services (Synthetic)", type: "LAW_ENFORCEMENT", region: "Nairobi Central", email: "dci.synthetic@kfin.test" },
      { code: "NPHL-LAB", name: "National Public Health Reference Lab (Synthetic)", type: "FORENSIC_LAB", region: "Nairobi Upper Hill", email: "lab.synthetic@kfin.test" },
      { code: "ODPP-HQ", name: "Office of the Director of Public Prosecutions (Synthetic)", type: "JUDICIARY", region: "Nairobi Judicial", email: "odpp.synthetic@kfin.test" },
      { code: "NPS-HQ", name: "National Police Service Headquarters (Synthetic)", type: "LAW_ENFORCEMENT", region: "Nairobi Central", email: "nps.synthetic@kfin.test" },
    ];

    for (const o of orgData) {
      await client.query(`
        INSERT INTO organizations (code, name, type, jurisdiction_region, contact_email)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
      `, [o.code, o.name, o.type, o.region, o.email]);
    }

    const { rows: orgs } = await client.query<{ id: string; code: string }>(
      "SELECT id, code FROM organizations;"
    );
    const orgMap = new Map(orgs.map((o) => [o.code, o.id]));

    console.log("Seeding synthetic users & personnel...");
    const dummyPasswordHash = "$argon2id$v=19$m=65536,t=3,p=4$syntheticHashPlaceholder";
    const dummyIdHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    const userData = [
      { email: "dr.omondi.synthetic@kfin.test", badge: "KFIN-OFF-001", name: "Dr. Evans Omondi (Synthetic Analyst)", org: "NPHL-LAB", clearance: "HIGHLY_RESTRICTED" },
      { email: "sgt.cheruiyot.synthetic@kfin.test", badge: "KFIN-OFF-002", name: "Sgt. Kiprono Cheruiyot (Synthetic Custodian)", org: "DCI-HQ", clearance: "CONFIDENTIAL" },
      { email: "insp.wanjiku.synthetic@kfin.test", badge: "KFIN-OFF-003", name: "Insp. Grace Wanjiku (Synthetic Investigator)", org: "DCI-HQ", clearance: "RESTRICTED" },
      { email: "director.mutua.synthetic@kfin.test", badge: "KFIN-OFF-004", name: "Dr. Faith Mutua (Synthetic Lab Director)", org: "NPHL-LAB", clearance: "HIGHLY_RESTRICTED" },
    ];

    for (const u of userData) {
      await client.query(`
        INSERT INTO users (organization_id, clearance_level_id, email, badge_number, full_name, national_id_hash, password_hash, account_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
        ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name;
      `, [orgMap.get(u.org), clearanceMap.get(u.clearance), u.email, u.badge, u.name, dummyIdHash, dummyPasswordHash]);
    }

    const { rows: userList } = await client.query<{ id: string; email: string }>(
      "SELECT id, email FROM users;"
    );
    const userMap = new Map(userList.map((u) => [u.email, u.id]));
    const leadUserId = userMap.get("insp.wanjiku.synthetic@kfin.test")!;
    const analystUserId = userMap.get("dr.omondi.synthetic@kfin.test")!;
    const custodianUserId = userMap.get("sgt.cheruiyot.synthetic@kfin.test")!;
    const directorUserId = userMap.get("director.mutua@kfin.test")!;

    console.log("Seeding DNA Indices catalog...");
    const indicesData = [
      { code: "FORENSIC_UNKNOWN", name: "National Forensic Unknown Crime Scene DNA Index", desc: "Index containing STR DNA profiles from biological evidence recovered at unsolved crime scenes.", reg: "Criminal Procedure Code Cap. 75" },
      { code: "OFFENDER", name: "National Convicted Offender DNA Index", desc: "Index containing STR DNA profiles of individuals convicted of specified serious offenses.", reg: "National Police Service Act" },
      { code: "ARRESTEE", name: "Qualifying Arrestee DNA Index", desc: "Index of DNA profiles taken from qualifying arrestees pending adjudication.", reg: "Evidence Act" },
      { code: "MISSING_PERSON", name: "Missing Persons Reference Index", desc: "Index of reference DNA profiles from missing individuals or biological relatives.", reg: "National Missing Persons Protocol" },
      { code: "ELIMINATION", name: "Forensic Staff Contamination Elimination Index", desc: "Reference index used solely to detect accidental laboratory or collection contamination.", reg: "ISO/IEC 17025 Standards" },
    ];

    for (const idx of indicesData) {
      await client.query(`
        INSERT INTO dna_indices (code, name, description, legal_basis_regulation, retention_years_default)
        VALUES ($1, $2, $3, $4, 50)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
      `, [idx.code, idx.name, idx.desc, idx.reg]);
    }

    const { rows: indicesList } = await client.query<{ id: string; code: string }>(
      "SELECT id, code FROM dna_indices;"
    );
    const indexMap = new Map(indicesList.map((i) => [i.code, i.id]));

    console.log("Seeding synthetic storage locations...");
    const storageData = [
      { code: "VAULT-01", name: "DCI Central Evidence Vault (Synthetic)", num: "VAULT-A", shelf: "SHELF-04-BIN-12", temp: true, target: "-20C" },
      { code: "LOCKER-02", name: "Forensic Biology Intake Locker (Synthetic)", num: "LOCKER-B", shelf: "COMPARTMENT-07", temp: false, target: "Ambient" },
      { code: "CABINET-03", name: "Drying Cabinet Facility (Synthetic)", num: "CABINET-C", shelf: "TRAY-02", temp: true, target: "22C" },
    ];

    for (const s of storageData) {
      await client.query(`
        INSERT INTO storage_locations (organization_id, facility_code, facility_name, vault_number, shelf_identifier, is_temperature_controlled, temperature_range_celsius)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (organization_id, facility_code, vault_number, shelf_identifier) DO NOTHING;
      `, [orgMap.get("DCI-HQ"), s.code, s.name, s.num, s.shelf, s.temp, s.target]);
    }

    const { rows: locs } = await client.query<{ id: string; facility_code: string }>(
      "SELECT id, facility_code FROM storage_locations;"
    );
    const vaultLocationId = locs[0]?.id;
    const lockerLocationId = locs[1]?.id || vaultLocationId;

    console.log("Seeding synthetic forensic cases...");
    const casesData = [
      {
        num: "KFIN-SYN-CASE-2026-0001",
        title: "Synthetic Forensic Demonstration Case 001",
        desc: "Synthetic homicide investigation evidence demonstration.",
        status: "ACTIVE",
        priority: "CRITICAL",
        county: "Nairobi",
        coords: "-1.286389,36.817223",
      },
      {
        num: "KFIN-SYN-CASE-2026-0002",
        title: "Mombasa Maritime Seizure & Trace Investigation",
        desc: "Synthetic maritime seizure with touch DNA recovery on contraband cargo seals.",
        status: "OPEN",
        priority: "EXPEDITED",
        county: "Mombasa",
        coords: "-4.043477,39.668206",
      },
      {
        num: "KFIN-SYN-CASE-2026-0003",
        title: "Nakuru Disaster Victim Reference & DVI Inquiry",
        desc: "Synthetic disaster victim identification matching inquiry with familial reference collection.",
        status: "ACTIVE",
        priority: "PRIORITY",
        county: "Nakuru",
        coords: "-0.303099,36.080025",
      },
    ];

    for (const c of casesData) {
      await client.query(`
        INSERT INTO cases (case_number, title, description, originating_org_id, lead_investigator_id, status, priority, incident_date, incident_county, incident_location_coords)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '5 days', $8, $9)
        ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status;
      `, [c.num, c.title, c.desc, orgMap.get("DCI-HQ"), leadUserId, c.status, c.priority, c.county, c.coords]);
    }

    const { rows: caseList } = await client.query<{ id: string; case_number: string }>(
      "SELECT id, case_number FROM cases;"
    );
    const caseMap = new Map(caseList.map((c) => [c.case_number, c.id]));
    const case1Id = caseMap.get("KFIN-SYN-CASE-2026-0001")!;
    const case2Id = caseMap.get("KFIN-SYN-CASE-2026-0002")!;
    const case3Id = caseMap.get("KFIN-SYN-CASE-2026-0003")!;

    console.log("Seeding case participants & notes...");
    await client.query(`
      INSERT INTO case_participants (case_id, participant_type, pseudonym, notes)
      VALUES 
        ($1, 'SUSPECT', 'Synthetic Subject Alpha', 'Suspect apprehended in vicinity with biological stains on clothing.'),
        ($1, 'VICTIM', 'Synthetic Victim Reference', 'Biological reference profile standard recorded.'),
        ($1, 'ELIMINATION_SUBJECT', 'Officer First-On-Scene', 'Responding officer elimination swab taken to verify non-contamination.')
      ON CONFLICT DO NOTHING;
    `, [case1Id]);

    await client.query(`
      INSERT INTO case_notes (case_id, author_id, note_text, is_confidential)
      VALUES 
        ($1, $2, 'Crime scene cordoned and photographed. Biological swab taken from primary exhibit.', false),
        ($1, $2, 'Exhibit submitted to National Forensic Laboratory under intact tamper seal SEAL-KE-849201.', true)
      ON CONFLICT DO NOTHING;
    `, [case1Id, leadUserId]);

    console.log("Seeding synthetic evidence items...");
    const evidenceData = [
      {
        caseId: case1Id,
        itemNum: "EVD-001",
        desc: "Synthetic blood-stained cotton fabric specimen",
        type: "BIOLOGICAL_SPECIMEN",
        locDesc: "Crime scene master bedroom floor (Synthetic)",
        seal: "SEAL-KE-849201",
        pack: "Tamper-Evident Biohazard Envelope",
      },
      {
        caseId: case1Id,
        itemNum: "EVD-002",
        desc: "Synthetic 9mm Luger fired cartridge casing",
        type: "WEAPON",
        locDesc: "External perimeter walkway near entrance (Synthetic)",
        seal: "SEAL-KE-849205",
        pack: "Rigid Specimen Box",
      },
      {
        caseId: case2Id,
        itemNum: "EVD-003",
        desc: "Synthetic touch DNA swab from container latch",
        type: "TOUCH_DNA_SWAB",
        locDesc: "Berth 5 Cargo Container Seal 44-A (Synthetic)",
        seal: "SEAL-KE-910234",
        pack: "Sterile Swab Transport Tube",
      },
      {
        caseId: case3Id,
        itemNum: "EVD-004",
        desc: "Synthetic buccal swab reference sample from consenting relative",
        type: "BIOLOGICAL_SPECIMEN",
        locDesc: "Nakuru Central Sub-County Police Post (Synthetic)",
        seal: "SEAL-KE-554109",
        pack: "Paper Buccal Collection Kit",
      },
    ];

    for (const e of evidenceData) {
      await client.query(`
        INSERT INTO evidence_items (case_id, item_number, description, evidence_type, collection_timestamp, collected_by_id, collection_location_desc, current_location_id, current_custodian_id, tamper_seal_number, integrity_hash, status, packaging_type)
        VALUES ($1, $2, $3, $4, NOW() - INTERVAL '4 days', $5, $6, $7, $8, $9, $10, 'IN_VAULT', $11)
        ON CONFLICT (case_id, item_number) DO NOTHING;
      `, [e.caseId, e.itemNum, e.desc, e.type, leadUserId, e.locDesc, vaultLocationId, custodianUserId, e.seal, dummyIdHash, e.pack]);
    }

    const { rows: evList } = await client.query<{ id: string; item_number: string }>(
      "SELECT id, item_number FROM evidence_items;"
    );
    const evMap = new Map(evList.map((e) => [e.item_number, e.id]));
    const ev1Id = evMap.get("EVD-001")!;
    const ev2Id = evMap.get("EVD-002")!;

    console.log("Seeding immutable chain-of-custody transfer ledger...");
    const custodyEvents = [
      {
        evId: ev1Id,
        action: "VAULT_STORAGE",
        fromUser: leadUserId,
        toUser: custodianUserId,
        fromLoc: vaultLocationId,
        toLoc: vaultLocationId,
        reason: "Initial recovery from synthetic crime scene into secure intake vault",
        auth: "AUTH-DCI-SEIZURE-2026-001",
        sealIntact: true,
        newSeal: "SEAL-KE-849202",
        notes: "Intake verified intact by evidence custodian.",
      },
      {
        evId: ev1Id,
        action: "LAB_ANALYSIS",
        fromUser: custodianUserId,
        toUser: analystUserId,
        fromLoc: vaultLocationId,
        toLoc: lockerLocationId,
        reason: "Transfer to forensic biology division for DNA extraction and profile generation",
        auth: "AUTH-DCI-LAB-TRANS-2026-008",
        sealIntact: true,
        newSeal: "SEAL-KE-849203",
        notes: "Released to forensic analyst for processing.",
      },
      {
        evId: ev2Id,
        action: "VAULT_STORAGE",
        fromUser: leadUserId,
        toUser: custodianUserId,
        fromLoc: vaultLocationId,
        toLoc: vaultLocationId,
        reason: "Ballistics evidence recovery from scene perimeter",
        auth: "AUTH-DCI-BALL-2026-003",
        sealIntact: true,
        newSeal: "SEAL-KE-849206",
        notes: "Ballistics evidence checked into secure armory vault.",
      },
    ];

    for (const c of custodyEvents) {
      await client.query(`
        INSERT INTO custody_transfers (evidence_id, releasing_officer_id, receiving_officer_id, transfer_reason, authorization_reference, transfer_timestamp, source_location_id, destination_location_id, seal_intact, new_seal_number, notes)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '3 days', $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING;
      `, [c.evId, c.fromUser, c.toUser, c.action, c.auth, c.fromLoc, c.toLoc, c.sealIntact, c.newSeal, c.notes]);
    }

    console.log("Seeding synthetic biological samples & DNA profiles...");
    await client.query(`
      INSERT INTO biological_samples (sample_number, evidence_id, case_id, sample_type, donor_type, donor_pseudonym, collection_date, collected_by_id, storage_freezer_location, concentration_ng_ul, notes)
      VALUES 
        ('BIO-SYN-001', $1, $2, 'WHOLE_BLOOD', 'SUSPECT', 'SYNTHETIC-SUBJECT-ALPHA', NOW() - INTERVAL '2 days', $3, 'FREEZER-03-RACK-B', '45.2', 'Bloodstain excision from exhibit fabric.'),
        ('BIO-SYN-002', $1, $2, 'SALIVA_TRACE', 'VICTIM', 'SYNTHETIC-VICTIM-REF', NOW() - INTERVAL '2 days', $3, 'FREEZER-03-RACK-B', '22.8', 'Saliva trace buccal reference standard.')
      ON CONFLICT (sample_number) DO NOTHING;
    `, [ev1Id, case1Id, analystUserId]);

    const { rows: bioList } = await client.query<{ id: string; sample_number: string }>(
      "SELECT id, sample_number FROM biological_samples;"
    );
    const bioMap = new Map(bioList.map((b) => [b.sample_number, b.id]));
    const bio1Id = bioMap.get("BIO-SYN-001")!;
    const bio2Id = bioMap.get("BIO-SYN-002")!;

    await client.query(`
      INSERT INTO dna_profiles (sample_id, index_id, profile_identifier, profile_quality, loci_count, profile_status, extraction_method, quantification_kit, amplification_kit, electrophoresis_instrument, analyst_id)
      VALUES 
        ($1, $2, 'KFIN-SYN-DNA-2026-0001', 'COMPLETE', 20, 'ACTIVE', 'Silica Column Extraction', 'Quantifiler Trio Kit', 'GlobalFiler STR Amplification', 'Applied Biosystems 3500xL Genetic Analyzer', $3),
        ($4, $5, 'KFIN-SYN-DNA-2026-0002', 'COMPLETE', 20, 'ACTIVE', 'Silica Column Extraction', 'Quantifiler Trio Kit', 'GlobalFiler STR Amplification', 'Applied Biosystems 3500xL Genetic Analyzer', $3)
      ON CONFLICT (profile_identifier) DO NOTHING;
    `, [
      bio1Id,
      indexMap.get("FORENSIC_UNKNOWN"),
      analystUserId,
      bio2Id,
      indexMap.get("OFFENDER"),
    ]);

    const { rows: profileList } = await client.query<{ id: string; profile_identifier: string }>(
      "SELECT id, profile_identifier FROM dna_profiles;"
    );
    const profileMap = new Map(profileList.map((p) => [p.profile_identifier, p.id]));
    const dna1Id = profileMap.get("KFIN-SYN-DNA-2026-0001")!;
    const dna2Id = profileMap.get("KFIN-SYN-DNA-2026-0002")!;

    console.log("Seeding 20 CODIS STR allele loci for synthetic profiles...");
    await client.query("DELETE FROM str_alleles WHERE dna_profile_id IN ($1, $2);", [dna1Id, dna2Id]);
    const lociData = [
      { locus: "D3S1358", a1: "15", a2: "16", r1: 1250, r2: 1190 },
      { locus: "vWA", a1: "17", a2: "18", r1: 980, r2: 1040 },
      { locus: "FGA", a1: "21", a2: "23", r1: 1420, r2: 1380 },
      { locus: "D8S1179", a1: "13", a2: "14", r1: 1100, r2: 1150 },
      { locus: "D21S11", a1: "28", a2: "30", r1: 890, r2: 910 },
      { locus: "D18S51", a1: "14", a2: "17", r1: 760, r2: 820 },
      { locus: "D5S818", a1: "11", a2: "12", r1: 1340, r2: 1290 },
      { locus: "D13S317", a1: "11", a2: "12", r1: 1120, r2: 1090 },
      { locus: "D7S820", a1: "9", a2: "10", r1: 1450, r2: 1400 },
      { locus: "TH01", a1: "7", a2: "9.3", r1: 1680, r2: 1590 },
      { locus: "TPOX", a1: "8", a2: "11", r1: 1020, r2: 990 },
      { locus: "CSF1PO", a1: "10", a2: "12", r1: 880, r2: 920 },
      { locus: "AMEL", a1: "X", a2: "Y", r1: 2100, r2: 2050 },
      { locus: "D1S1656", a1: "16", a2: "17.3", r1: 940, r2: 960 },
      { locus: "D2S441", a1: "11", a2: "14", r1: 1180, r2: 1220 },
      { locus: "D10S1248", a1: "13", a2: "15", r1: 1310, r2: 1290 },
      { locus: "D12S391", a1: "19", a2: "22", r1: 850, r2: 890 },
      { locus: "D22S1045", a1: "15", a2: "16", r1: 1090, r2: 1140 },
      { locus: "D2S1338", a1: "19", a2: "24", r1: 970, r2: 930 },
      { locus: "D16S539", a1: "11", a2: "13", r1: 1230, r2: 1260 },
    ];

    for (const l of lociData) {
      await client.query(`
        INSERT INTO str_alleles (dna_profile_id, locus_name, allele_1, allele_2, peak_height_1, peak_height_2)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (dna_profile_id, locus_name) DO NOTHING;
      `, [dna1Id, l.locus, l.a1, l.a2, l.r1, l.r2]);

      if (dna2Id) {
        await client.query(`
          INSERT INTO str_alleles (dna_profile_id, locus_name, allele_1, allele_2, peak_height_1, peak_height_2)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (dna_profile_id, locus_name) DO NOTHING;
        `, [dna2Id, l.locus, l.a1, l.a2, l.r1, l.r2]);
      }
    }

    console.log("Seeding forensic laboratory submissions & examination reports...");
    await client.query(`
      INSERT INTO lab_submissions (case_id, submitting_org_id, receiving_lab_id, submission_number, urgency, status, submission_date, authorized_by_id, case_summary_notes)
      VALUES ($1, $2, $3, 'KFIN-SYN-SUB-2026-0001', 'CRITICAL', 'IN_PROGRESS', NOW() - INTERVAL '3 days', $4, 'Rush forensic examination requested for biological exhibits recovered from primary scene.')
      ON CONFLICT (submission_number) DO NOTHING;
    `, [case1Id, orgMap.get("DCI-HQ"), orgMap.get("NPHL-LAB"), leadUserId]);

    const { rows: subList } = await client.query<{ id: string }>(
      "SELECT id FROM lab_submissions WHERE submission_number = 'KFIN-SYN-SUB-2026-0001';"
    );
    const subId = subList[0]?.id;

    if (subId) {
      await client.query(`
        INSERT INTO examination_requests (submission_id, evidence_id, analysis_type, assigned_analyst_id, stage, notes)
        VALUES 
          ($1, $2, 'DNA_STR_PROFILING', $3, 'APPROVED', 'Complete GlobalFiler 20 loci STR profile obtained and verified.'),
          ($1, $4, 'FIREARMS_BALLISTIC_ID', $5, 'PENDING_ASSIGNMENT', 'Comparison with national IBIS database queued.')
        ON CONFLICT DO NOTHING;
      `, [subId, ev1Id, analystUserId, ev2Id, custodianUserId]);

      const { rows: examList } = await client.query<{ id: string }>(
        "SELECT id FROM examination_requests WHERE submission_id = $1 LIMIT 1;", [subId]
      );
      const examId = examList[0]?.id;

      if (examId) {
        await client.query(`
          INSERT INTO lab_reports (examination_request_id, report_number, reporting_analyst_id, technical_reviewer_id, approving_director_id, conclusion_summary, formal_report_hash, is_approved, issued_at)
          VALUES ($1, 'KFIN-SYN-REP-2026-0001', $2, $2, $3, 'A single source male STR DNA profile was successfully obtained from Exhibit EVD-001. Profile matches criteria for national index upload.', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', true, NOW())
          ON CONFLICT (report_number) DO NOTHING;
        `, [examId, analystUserId, directorUserId]);
      }
    }

    console.log("Seeding baseline immutable audit log events...");
    const auditEntries = [
      { action: "CASE_CREATE", entityType: "cases", entityId: "KFIN-SYN-CASE-2026-0001", reason: "Initial synthetic case file opened for demonstration." },
      { action: "EVIDENCE_TRANSFER", entityType: "evidence_items", entityId: "EVD-001", reason: "Chain of custody transfer executed: Submitting to Forensic Biology Laboratory." },
      { action: "DNA_INDEX_SEARCH", entityType: "dna_profiles", entityId: "KFIN-SYN-DNA-2026-0001", reason: "20 CODIS STR allele loci profile registered to FORENSIC_UNKNOWN index." },
      { action: "REPORT_APPROVE", entityType: "lab_reports", entityId: "KFIN-SYN-REP-2026-0001", reason: "Formal laboratory report approved by Director." },
    ];

    for (const a of auditEntries) {
      await client.query(`
        INSERT INTO audit_events (actor_id, actor_ip_address, action, entity_type, entity_id, outcome, reason, metadata)
        VALUES ($1, '127.0.0.1', $2, $3, $4, 'SUCCESS', $5, '{"environment": "synthetic", "phase": "1.1"}')
        ON CONFLICT DO NOTHING;
      `, [leadUserId, a.action, a.entityType, a.entityId, a.reason]);
    }

    console.log("\n=====================================================================");
    console.log("       SYNTHETIC DATABASE SEED COMPLETED SUCCESSFULLY! 🎉");
    console.log("=====================================================================");
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  await runSyntheticSeed();
}

main().catch((err: unknown) => {
  console.error("Seed execution failed:", err);
  process.exit(1);
});
