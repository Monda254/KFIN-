import { pool } from "@workspace/db";

export async function runSyntheticSeed(): Promise<void> {
  console.log("=====================================================================");
  console.log("             KFIN SYNTHETIC SEED ENGINE (100% FICTIONAL)");
  console.log("=====================================================================");

  const client = await pool.connect();
  try {
    console.log("Seeding baseline clearance levels...");
    const clearanceData = [
      { code: "UNCLASSIFIED", rank: 1, name: "Unclassified Public Access", desc: "General public notices and statistics" },
      { code: "RESTRICTED", rank: 2, name: "Official Restricted", desc: "Standard internal case registries" },
      { code: "CONFIDENTIAL", rank: 3, name: "Confidential Forensic", desc: "Active investigation evidence and lab files" },
      { code: "SECRET", rank: 4, name: "State Forensic Secret", desc: "High-profile prosecution and forensic analysis" },
      { code: "TOP_SECRET", rank: 5, name: "National Intelligence Top Secret", desc: "Sensitive biometric registries and audit trails" },
    ];

    for (const c of clearanceData) {
      await client.query(`
        INSERT INTO clearance_levels (level_code, numeric_rank, name, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (level_code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
      `, [c.code, c.rank, c.name, c.desc]);
    }

    const { rows: clearances } = await client.query<{ id: string; level_code: string }>(
      "SELECT id, level_code FROM clearance_levels;"
    );
    const clearanceMap = new Map(clearances.map((c) => [c.level_code, c.id]));

    console.log("Seeding synthetic organizations...");
    const orgData = [
      { code: "DCI-HQ", name: "DCI Headquarters Forensic Services (Synthetic)", type: "LAW_ENFORCEMENT", county: "Nairobi", station: "Mazingira Complex" },
      { code: "NPHL-LAB", name: "National Public Health Reference Lab (Synthetic)", type: "FORENSIC_LAB", county: "Nairobi", station: "Kenyatta National Hospital Grounds" },
      { code: "ODPP-HQ", name: "Office of the Director of Public Prosecutions (Synthetic)", type: "PROSECUTION", county: "Nairobi", station: "ODPP House" },
      { code: "NPS-HQ", name: "National Police Service Headquarters (Synthetic)", type: "LAW_ENFORCEMENT", county: "Nairobi", station: "Vigilance House" },
    ];

    for (const o of orgData) {
      await client.query(`
        INSERT INTO organizations (code, name, type, county, station)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
      `, [o.code, o.name, o.type, o.county, o.station]);
    }

    const { rows: orgs } = await client.query<{ id: string; code: string }>(
      "SELECT id, code FROM organizations;"
    );
    const orgMap = new Map(orgs.map((o) => [o.code, o.id]));

    console.log("Seeding synthetic users & personnel...");
    const userData = [
      { serviceNo: "KFIN-SYN-001", email: "analyst.omondi@kfin.test", first: "Evans", last: "Omondi", org: "NPHL-LAB", clearance: "TOP_SECRET" },
      { serviceNo: "KFIN-SYN-002", email: "custodian.cheruiyot@kfin.test", first: "Kiprono", last: "Cheruiyot", org: "DCI-HQ", clearance: "SECRET" },
      { serviceNo: "KFIN-SYN-003", email: "inspector.wanjiku@kfin.test", first: "Grace", last: "Wanjiku", org: "DCI-HQ", clearance: "CONFIDENTIAL" },
      { serviceNo: "KFIN-SYN-004", email: "director.mutua@kfin.test", first: "Faith", last: "Mutua", org: "NPHL-LAB", clearance: "TOP_SECRET" },
    ];

    for (const u of userData) {
      await client.query(`
        INSERT INTO users (service_number, first_name, last_name, email, organization_id, clearance_level_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
        ON CONFLICT (service_number) DO UPDATE SET email = EXCLUDED.email;
      `, [u.serviceNo, u.first, u.last, u.email, orgMap.get(u.org), clearanceMap.get(u.clearance)]);
    }

    const { rows: userList } = await client.query<{ id: string; email: string }>(
      "SELECT id, email FROM users;"
    );
    const userMap = new Map(userList.map((u) => [u.email, u.id]));

    console.log("Seeding DNA Indices catalog...");
    const indicesData = [
      { code: "FORENSIC_UNKNOWN", name: "National Forensic Unknown Crime Scene DNA Index", type: "FORENSIC_UNKNOWN", ret: 50 },
      { code: "OFFENDER", name: "National Convicted Offender DNA Index", type: "OFFENDER", ret: 75 },
      { code: "ARRESTEE", name: "Qualifying Arrestee DNA Index", type: "ARRESTEE", ret: 10 },
      { code: "MISSING_PERSON", name: "Missing Persons Reference Index", type: "MISSING_PERSON", ret: 50 },
      { code: "ELIMINATION", name: "Forensic Staff Contamination Elimination Index", type: "ELIMINATION", ret: 30 },
    ];

    for (const idx of indicesData) {
      await client.query(`
        INSERT INTO dna_indices (index_code, name, index_type, retention_policy_years)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (index_code) DO UPDATE SET name = EXCLUDED.name;
      `, [idx.code, idx.name, idx.type, idx.ret]);
    }

    const { rows: indicesList } = await client.query<{ id: string; index_code: string }>(
      "SELECT id, index_code FROM dna_indices;"
    );
    const indexMap = new Map(indicesList.map((i) => [i.index_code, i.id]));

    console.log("Seeding synthetic storage locations...");
    const defaultUserId = userMap.get("inspector.wanjiku@kfin.test");
    await client.query(`
      INSERT INTO storage_locations (facility_id, room, unit, shelf_bin, temperature_controlled, target_temp_celsius, created_by, updated_by)
      VALUES ($1, 'Vault Room B', 'Ultra-Cold Freezer 01', 'Shelf 03 Bin 12', true, '-20C', $2, $2)
      ON CONFLICT DO NOTHING;
    `, [orgMap.get("DCI-HQ"), defaultUserId]);

    const { rows: locs } = await client.query<{ id: string }>(
      "SELECT id FROM storage_locations LIMIT 1;"
    );
    const defaultLocationId = locs[0]?.id;

    console.log("Seeding synthetic forensic case...");
    await client.query(`
      INSERT INTO cases (case_number, title, description, originating_org_id, lead_investigator_id, status, priority, incident_date, incident_county, incident_location, classification, created_by, updated_by)
      VALUES ('KFIN-SYN-CASE-2026-0001', 'Synthetic Forensic Demonstration Case 001', 'Synthetic homicide investigation evidence demonstration.', $1, $2, 'ACTIVE', 'CRITICAL', NOW() - INTERVAL '5 days', 'Nairobi', 'Mazingira Sector 4', 'RESTRICTED', $2, $2)
      ON CONFLICT (case_number) DO NOTHING;
    `, [orgMap.get("DCI-HQ"), userMap.get("inspector.wanjiku@kfin.test")]);

    const { rows: caseList } = await client.query<{ id: string }>(
      "SELECT id FROM cases WHERE case_number = 'KFIN-SYN-CASE-2026-0001';"
    );
    const defaultCaseId = caseList[0]?.id;

    if (defaultCaseId && defaultLocationId) {
      console.log("Seeding synthetic evidence item & custody transfer...");
      await client.query(`
        INSERT INTO evidence_items (evidence_barcode, case_id, submitting_org_id, current_location_id, category, description, packaging_type, tamper_seal_number, is_sealed, collection_date, collection_officer_id, created_by, updated_by)
        VALUES ('KFIN-SYN-EV-2026-0001', $1, $2, $3, 'BIOLOGICAL', 'Synthetic blood-stained cotton fabric specimen', 'Tamper-evident biohazard envelope', 'SEAL-KE-849201', true, NOW() - INTERVAL '4 days', $4, $4, $4)
        ON CONFLICT (evidence_barcode) DO NOTHING;
      `, [
        defaultCaseId,
        orgMap.get("DCI-HQ"),
        defaultLocationId,
        userMap.get("inspector.wanjiku@kfin.test"),
      ]);

      const { rows: evList } = await client.query<{ id: string }>(
        "SELECT id FROM evidence_items WHERE evidence_barcode = 'KFIN-SYN-EV-2026-0001';"
      );
      const evidenceId = evList[0]?.id;

      if (evidenceId) {
        await client.query(`
          INSERT INTO custody_transfers (evidence_id, action, transferred_from_user_id, transferred_to_user_id, from_location_id, to_location_id, reason_for_transfer, authorization_reference, seal_verified_intact, new_seal_number, recorded_by)
          VALUES ($1, 'INITIAL_SEIZURE', $2, $3, $4, $4, 'Initial recovery from synthetic crime scene into secure intake vault', 'AUTH-DCI-SEIZURE-2026-001', true, 'SEAL-KE-849202', $2)
          ON CONFLICT DO NOTHING;
        `, [
          evidenceId,
          userMap.get("inspector.wanjiku@kfin.test"),
          userMap.get("custodian.cheruiyot@kfin.test"),
          defaultLocationId,
        ]);

        console.log("Seeding synthetic biological sample & DNA profile...");
        await client.query(`
          INSERT INTO biological_samples (sample_barcode, evidence_id, sample_type, extraction_method, quantity_remaining_ul, is_consumed_entirely, created_by, updated_by)
          VALUES ('KFIN-SYN-SAMP-2026-0001', $1, 'BLOOD', 'Silica Column Extraction', '45.0', false, $2, $2)
          ON CONFLICT (sample_barcode) DO NOTHING;
        `, [
          evidenceId,
          userMap.get("analyst.omondi@kfin.test"),
        ]);

        const { rows: bioList } = await client.query<{ id: string }>(
          "SELECT id FROM biological_samples WHERE sample_barcode = 'KFIN-SYN-SAMP-2026-0001';"
        );
        const bioSampleId = bioList[0]?.id;

        if (bioSampleId) {
          await client.query(`
            INSERT INTO dna_profiles (profile_identifier, sample_id, dna_index_id, source_type, kit_name, loci_count, electrophoresis_run_id, analysis_software, is_complete_profile, is_mixture, contributor_count, classification, created_by, updated_by)
            VALUES ('KFIN-SYN-DNA-2026-0001', $1, $2, 'EVIDENCE_SAMPLE', 'GlobalFiler STR Kit', 20, 'RUN-AB-3500XL-20260901', 'GeneMapper ID-X v1.6', true, false, 1, 'RESTRICTED', $3, $3)
            ON CONFLICT (profile_identifier) DO NOTHING;
          `, [
            bioSampleId,
            indexMap.get("FORENSIC_UNKNOWN"),
            userMap.get("analyst.omondi@kfin.test"),
          ]);

          const { rows: profileList } = await client.query<{ id: string }>(
            "SELECT id FROM dna_profiles WHERE profile_identifier = 'KFIN-SYN-DNA-2026-0001';"
          );
          const dnaProfileId = profileList[0]?.id;

          if (dnaProfileId) {
            console.log("Seeding 20 CODIS STR allele loci for synthetic DNA profile...");
            const lociData = [
              { locus: "D3S1358", a1: "15", a2: "16" },
              { locus: "vWA", a1: "17", a2: "18" },
              { locus: "FGA", a1: "21", a2: "23" },
              { locus: "D8S1179", a1: "13", a2: "14" },
              { locus: "D21S11", a1: "28", a2: "30" },
              { locus: "D18S51", a1: "14", a2: "17" },
              { locus: "D5S818", a1: "11", a2: "12" },
              { locus: "D13S317", a1: "11", a2: "12" },
              { locus: "D7S820", a1: "9", a2: "10" },
              { locus: "TH01", a1: "7", a2: "9.3" },
              { locus: "TPOX", a1: "8", a2: "11" },
              { locus: "CSF1PO", a1: "10", a2: "12" },
              { locus: "AMEL", a1: "X", a2: "Y" },
              { locus: "D1S1656", a1: "16", a2: "17.3" },
              { locus: "D2S441", a1: "11", a2: "14" },
              { locus: "D10S1248", a1: "13", a2: "15" },
              { locus: "D12S391", a1: "19", a2: "22" },
              { locus: "D22S1045", a1: "15", a2: "16" },
              { locus: "D2S1338", a1: "19", a2: "24" },
              { locus: "D16S539", a1: "11", a2: "13" },
            ];

            for (const l of lociData) {
              await client.query(`
                INSERT INTO str_alleles (dna_profile_id, locus_name, allele_1, allele_2)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (dna_profile_id, locus_name) DO NOTHING;
              `, [dnaProfileId, l.locus, l.a1, l.a2]);
            }
          }
        }
      }
    }

    console.log("Seeding baseline immutable audit log event...");
    await client.query(`
      INSERT INTO audit_events (actor_id, actor_service_number, action, resource_type, resource_id, classification, ip_address, user_agent, correlation_id, details)
      VALUES ($1, 'KFIN-SYN-003', 'CREATE', 'cases', 'KFIN-SYN-CASE-2026-0001', 'RESTRICTED', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KFIN-Client/1.0', 'CORR-SYN-2026-0001', 'Initial synthetic case file opened for demonstration.')
      ON CONFLICT DO NOTHING;
    `, [userMap.get("inspector.wanjiku@kfin.test")]);

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
