export interface DatabaseStatus {
  status: string;
  engine: string;
  cloudProvider: string;
  latencyMs: number;
  totalTables: number;
  extensions: Array<{ extname: string; extversion: string }>;
  recordCounts: {
    cases: number;
    evidenceItems: number;
    custodyTransfers: number;
    dnaProfiles: number;
    strAlleles: number;
    auditEvents: number;
  };
}

export interface CaseAssignmentInfo {
  id: string;
  userName: string;
  userBadge: string;
  role: string;
  orgName: string;
  assignedAt: string;
  isActive: boolean;
}

export interface CaseTransferInfo {
  id: string;
  fromOrg: string;
  toOrg: string;
  fromOfficer: string;
  toOfficer: string;
  reason: string;
  timestamp: string;
  authRef?: string;
}

export interface CaseTimelineItem {
  id: string;
  timestamp: string;
  eventType: string;
  summary: string;
  actor: string;
}

export interface CaseParticipantInfo {
  id: string;
  participantType: string;
  pseudonym?: string;
  classification: string;
  demographics?: Record<string, any>;
}

export interface CaseNoteInfo {
  id: string;
  authorName: string;
  authorBadge: string;
  noteText: string;
  isConfidential: boolean;
  createdAt: string;
}

export interface CaseLinkInfo {
  id: string;
  targetCaseNumber: string;
  targetTitle: string;
  linkType: string;
  notes?: string;
}

export interface CaseItem {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  case_type?: string;
  data_classification?: string;
  version?: number;
  incident_date: string;
  incident_county: string;
  incident_location_coords?: string;
  created_at: string;
  closed_at?: string;
  closure_reason?: string;
  reopened_at?: string;
  reopened_reason?: string;
  originating_org_name: string;
  originating_org_code: string;
  lead_investigator_name: string;
  lead_investigator_badge: string;
  evidence_count: number;
  participant_count: number;
  assignments?: CaseAssignmentInfo[];
  transfers?: CaseTransferInfo[];
  timeline?: CaseTimelineItem[];
  participants?: CaseParticipantInfo[];
  notes?: CaseNoteInfo[];
  links?: CaseLinkInfo[];
}

export interface EvidenceItem {
  id: string;
  item_number: string;
  description: string;
  evidence_type: string;
  status: string;
  tamper_seal_number: string;
  packaging_type: string;
  collection_timestamp: string;
  collection_location_desc: string;
  case_number: string;
  case_title: string;
  storage_facility: string;
  vault_number: string;
  shelf_identifier: string;
  custodian_name: string;
}

export interface CustodyTransferEvent {
  id: string;
  transfer_timestamp: string;
  transfer_reason: string;
  authorization_reference: string;
  seal_intact: boolean;
  new_seal_number: string;
  notes: string;
  releasing_officer_name: string;
  releasing_officer_badge: string;
  receiving_officer_name: string;
  receiving_officer_badge: string;
  source_facility: string;
  destination_facility: string;
}

export interface DnaProfileItem {
  id: string;
  profile_identifier: string;
  profile_quality: string;
  loci_count: number;
  profile_status: string;
  extraction_method: string;
  quantification_kit: string;
  amplification_kit: string;
  electrophoresis_instrument: string;
  created_at: string;
  index_code: string;
  index_name: string;
  sample_number: string;
  sample_type: string;
  donor_type: string;
  analyst_name: string;
}

export interface StrLocus {
  locus_name: string;
  allele_1: string;
  allele_2?: string;
  peak_height_1?: number;
  peak_height_2?: number;
}

export interface DnaIndexItem {
  id: string;
  code: string;
  name: string;
  description: string;
  legal_basis_regulation: string;
  retention_years_default: number;
  is_restricted: boolean;
  profile_count: number;
}

export interface LabSubmissionItem {
  id: string;
  submission_number: string;
  urgency: string;
  status: string;
  submission_date: string;
  case_summary_notes: string;
  case_number: string;
  submitting_org: string;
  receiving_lab: string;
  authorized_by_name: string;
  examination_count: number;
}

export interface LabReportItem {
  id: string;
  report_number: string;
  conclusion_summary: string;
  formal_report_hash: string;
  is_approved: boolean;
  issued_at: string;
  reporting_analyst: string;
  approving_director: string;
}

export interface AuditEventItem {
  id: string;
  created_at: string;
  data_classification: string;
  action: string;
  entity_type: string;
  entity_id: string;
  outcome: string;
  reason: string;
  actor_ip_address: string;
  metadata?: any;
  actor_name: string;
  actor_badge: string;
}

// -----------------------------------------------------------------------------
// Baseline Synthetic Dataset (Mirrors Live Supabase Database)
// -----------------------------------------------------------------------------
export const initialDatabaseStatus: DatabaseStatus = {
  status: "OPERATIONAL",
  engine: "PostgreSQL 17.6 + PostGIS 3.3.7",
  cloudProvider: "Supabase (eu-central-1 Frankfurt)",
  latencyMs: 18,
  totalTables: 31,
  extensions: [
    { extname: "uuid-ossp", extversion: "1.1" },
    { extname: "pgcrypto", extversion: "1.3" },
    { extname: "postgis", extversion: "3.3.7" },
  ],
  recordCounts: {
    cases: 3,
    evidenceItems: 4,
    custodyTransfers: 3,
    dnaProfiles: 2,
    strAlleles: 40,
    auditEvents: 4,
  },
};

export const initialCases: CaseItem[] = [
  {
    id: "case-001",
    case_number: "KFIN-SYN-CASE-2026-0001",
    title: "Synthetic Forensic Demonstration Case 001",
    description: "Synthetic homicide investigation evidence demonstration with multi-exhibit recovery and multi-agency response.",
    status: "ACTIVE",
    priority: "CRITICAL",
    case_type: "CRIMINAL_INVESTIGATION",
    data_classification: "RESTRICTED",
    version: 3,
    incident_date: "2026-09-25T08:30:00Z",
    incident_county: "Nairobi",
    incident_location_coords: "-1.286389,36.817223",
    created_at: "2026-09-25T10:00:00Z",
    originating_org_name: "DCI Headquarters Forensic Services (Synthetic)",
    originating_org_code: "DCI-HQ",
    lead_investigator_name: "Insp. Grace Wanjiku (Synthetic Investigator)",
    lead_investigator_badge: "KFIN-OFF-003",
    evidence_count: 2,
    participant_count: 3,
    assignments: [
      {
        id: "asgn-001",
        userName: "Insp. Grace Wanjiku (Synthetic)",
        userBadge: "KFIN-OFF-003",
        role: "PRIMARY_INVESTIGATOR",
        orgName: "DCI Headquarters Forensic Services",
        assignedAt: "2026-09-25T10:00:00Z",
        isActive: true,
      },
      {
        id: "asgn-002",
        userName: "Sgt. Peter Ochieng (Synthetic)",
        userBadge: "KFIN-OFF-002",
        role: "EXAMINER",
        orgName: "DCI Headquarters Forensic Services",
        assignedAt: "2026-09-25T11:30:00Z",
        isActive: true,
      },
      {
        id: "asgn-003",
        userName: "Dr. Amani Kiprop (Synthetic)",
        userBadge: "KFIN-OFF-001",
        role: "FORENSIC_ANALYST",
        orgName: "National Public Health Reference Lab",
        assignedAt: "2026-09-26T08:00:00Z",
        isActive: true,
      },
    ],
    transfers: [
      {
        id: "trf-001",
        fromOrg: "DCI Headquarters Forensic Services",
        toOrg: "DCI Homicide Specialized Section",
        fromOfficer: "Insp. Grace Wanjiku",
        toOfficer: "Insp. Grace Wanjiku",
        reason: "Escalation to specialized forensic division following touch DNA extraction",
        timestamp: "2026-09-26T12:00:00Z",
        authRef: "DCI-DIR-AUTH-2026-881",
      },
    ],
    timeline: [
      {
        id: "tl-001",
        timestamp: "2026-09-25T10:00:00Z",
        eventType: "CASE_CREATED",
        summary: "Case initialized in OPEN state with priority CRITICAL",
        actor: "Insp. Grace Wanjiku (KFIN-OFF-003)",
      },
      {
        id: "tl-002",
        timestamp: "2026-09-25T10:05:00Z",
        eventType: "ASSIGNMENT_GRANTED",
        summary: "Primary investigator assignment established",
        actor: "Director Amina Hassan (KFIN-OFF-000)",
      },
      {
        id: "tl-003",
        timestamp: "2026-09-25T10:30:00Z",
        eventType: "STATUS_CHANGE",
        summary: "Status transitioned: OPEN -> ACTIVE (Investigation operationalized)",
        actor: "Insp. Grace Wanjiku (KFIN-OFF-003)",
      },
      {
        id: "tl-004",
        timestamp: "2026-09-26T09:00:00Z",
        eventType: "EVIDENCE_COLLECTED",
        summary: "Exhibits EVD-001 & EVD-002 logged into chain-of-custody ledger",
        actor: "Sgt. Kiprono Cheruiyot (KFIN-OFF-004)",
      },
      {
        id: "tl-005",
        timestamp: "2026-09-26T16:00:00Z",
        eventType: "DNA_MATCH_CONFIRMED",
        summary: "CODIS 20 STR profile confirmed match against Convicted Offender Index",
        actor: "Dr. Amani Kiprop (KFIN-OFF-001)",
      },
    ],
    participants: [
      {
        id: "part-001",
        participantType: "VICTIM",
        pseudonym: "SYN-VICTIM-01",
        classification: "CONFIDENTIAL",
        demographics: { age: 34, gender: "F" },
      },
      {
        id: "part-002",
        participantType: "SUSPECT",
        pseudonym: "SYN-SUSPECT-A",
        classification: "RESTRICTED",
        demographics: { age: 29, gender: "M" },
      },
      {
        id: "part-003",
        participantType: "ELIMINATION_SUBJECT",
        pseudonym: "SYN-RESIDENT-01",
        classification: "INTERNAL",
        demographics: { status: "Co-tenant" },
      },
    ],
    notes: [
      {
        id: "note-001",
        authorName: "Insp. Grace Wanjiku",
        authorBadge: "KFIN-OFF-003",
        noteText: "Initial scene reconstruction completed. Multi-surface latent prints recovered alongside biological stains.",
        isConfidential: false,
        createdAt: "2026-09-25T11:00:00Z",
      },
      {
        id: "note-002",
        authorName: "Insp. Grace Wanjiku",
        authorBadge: "KFIN-OFF-003",
        noteText: "Confidential intelligence: Informant K-91 indicated suspect movement towards Thika corridor.",
        isConfidential: true,
        createdAt: "2026-09-25T14:30:00Z",
      },
    ],
    links: [
      {
        id: "link-001",
        targetCaseNumber: "KFIN-SYN-CASE-2026-0002",
        targetTitle: "Mombasa Maritime Seizure & Trace Investigation",
        linkType: "RELATED",
        notes: "Shared contraband serial batch prefix identified across crime scene logistics",
      },
    ],
  },
  {
    id: "case-002",
    case_number: "KFIN-SYN-CASE-2026-0002",
    title: "Mombasa Maritime Seizure & Trace Investigation",
    description: "Synthetic maritime seizure with touch DNA recovery on contraband cargo seals.",
    status: "OPEN",
    priority: "EXPEDITED",
    case_type: "CRIMINAL_INVESTIGATION",
    data_classification: "RESTRICTED",
    version: 1,
    incident_date: "2026-09-26T14:15:00Z",
    incident_county: "Mombasa",
    incident_location_coords: "-4.043477,39.668206",
    created_at: "2026-09-26T15:00:00Z",
    originating_org_name: "DCI Headquarters Forensic Services (Synthetic)",
    originating_org_code: "DCI-HQ",
    lead_investigator_name: "Insp. Grace Wanjiku (Synthetic Investigator)",
    lead_investigator_badge: "KFIN-OFF-003",
    evidence_count: 1,
    participant_count: 1,
    assignments: [
      {
        id: "asgn-004",
        userName: "Insp. Grace Wanjiku (Synthetic)",
        userBadge: "KFIN-OFF-003",
        role: "PRIMARY_INVESTIGATOR",
        orgName: "DCI Headquarters Forensic Services",
        assignedAt: "2026-09-26T15:00:00Z",
        isActive: true,
      },
    ],
    timeline: [
      {
        id: "tl-006",
        timestamp: "2026-09-26T15:00:00Z",
        eventType: "CASE_CREATED",
        summary: "Case opened under maritime jurisdiction reference",
        actor: "Insp. Grace Wanjiku (KFIN-OFF-003)",
      },
    ],
    participants: [
      {
        id: "part-004",
        participantType: "WITNESS",
        pseudonym: "SYN-CREW-01",
        classification: "RESTRICTED",
      },
    ],
    notes: [
      {
        id: "note-003",
        authorName: "Insp. Grace Wanjiku",
        authorBadge: "KFIN-OFF-003",
        noteText: "Port container seals retrieved under chain-of-custody. Submitted for trace DNA extraction.",
        isConfidential: false,
        createdAt: "2026-09-26T16:00:00Z",
      },
    ],
    links: [
      {
        id: "link-002",
        targetCaseNumber: "KFIN-SYN-CASE-2026-0001",
        targetTitle: "Synthetic Forensic Demonstration Case 001",
        linkType: "RELATED",
        notes: "Shared contraband logistics pattern",
      },
    ],
  },
  {
    id: "case-003",
    case_number: "KFIN-SYN-CASE-2026-0003",
    title: "Nakuru Disaster Victim Reference & DVI Inquiry",
    description: "Synthetic disaster victim identification matching inquiry with familial reference collection.",
    status: "ACTIVE",
    priority: "PRIORITY",
    case_type: "DISASTER_VICTIM_IDENTIFICATION",
    data_classification: "CONFIDENTIAL",
    version: 2,
    incident_date: "2026-09-27T11:00:00Z",
    incident_county: "Nakuru",
    incident_location_coords: "-0.303099,36.080025",
    created_at: "2026-09-27T12:00:00Z",
    originating_org_name: "DCI Headquarters Forensic Services (Synthetic)",
    originating_org_code: "DCI-HQ",
    lead_investigator_name: "Insp. Grace Wanjiku (Synthetic Investigator)",
    lead_investigator_badge: "KFIN-OFF-003",
    evidence_count: 1,
    participant_count: 2,
    assignments: [
      {
        id: "asgn-005",
        userName: "Insp. Grace Wanjiku (Synthetic)",
        userBadge: "KFIN-OFF-003",
        role: "PRIMARY_INVESTIGATOR",
        orgName: "DCI Headquarters Forensic Services",
        assignedAt: "2026-09-27T12:00:00Z",
        isActive: true,
      },
    ],
    timeline: [
      {
        id: "tl-007",
        timestamp: "2026-09-27T12:00:00Z",
        eventType: "CASE_CREATED",
        summary: "DVI inquiry opened with familial buccal swabs requested",
        actor: "Insp. Grace Wanjiku (KFIN-OFF-003)",
      },
      {
        id: "tl-008",
        timestamp: "2026-09-27T12:30:00Z",
        eventType: "STATUS_CHANGE",
        summary: "Status transitioned: OPEN -> ACTIVE",
        actor: "Insp. Grace Wanjiku (KFIN-OFF-003)",
      },
    ],
    participants: [
      {
        id: "part-005",
        participantType: "MISSING_PERSON",
        pseudonym: "SYN-VICTIM-DVI-01",
        classification: "CONFIDENTIAL",
      },
      {
        id: "part-006",
        participantType: "ELIMINATION_SUBJECT",
        pseudonym: "SYN-RELATIVE-01",
        classification: "CONFIDENTIAL",
      },
    ],
  },
];

export const initialEvidence: EvidenceItem[] = [
  {
    id: "evd-001",
    item_number: "EVD-001",
    description: "Synthetic blood-stained cotton fabric specimen recovered from scene",
    evidence_type: "BIOLOGICAL_SPECIMEN",
    status: "IN_VAULT",
    tamper_seal_number: "SEAL-KE-849201",
    packaging_type: "Tamper-Evident Biohazard Envelope",
    collection_timestamp: "2026-09-26T09:00:00Z",
    collection_location_desc: "Crime scene master bedroom floor (Synthetic)",
    case_number: "KFIN-SYN-CASE-2026-0001",
    case_title: "Synthetic Forensic Demonstration Case 001",
    storage_facility: "DCI Central Evidence Vault (Synthetic)",
    vault_number: "VAULT-A",
    shelf_identifier: "SHELF-04-BIN-12",
    custodian_name: "Sgt. Kiprono Cheruiyot (Synthetic Custodian)",
  },
  {
    id: "evd-002",
    item_number: "EVD-002",
    description: "Synthetic 9mm Luger fired cartridge casing with breach-face impressions",
    evidence_type: "WEAPON",
    status: "IN_VAULT",
    tamper_seal_number: "SEAL-KE-849205",
    packaging_type: "Rigid Specimen Box",
    collection_timestamp: "2026-09-26T09:45:00Z",
    collection_location_desc: "External perimeter walkway near entrance (Synthetic)",
    case_number: "KFIN-SYN-CASE-2026-0001",
    case_title: "Synthetic Forensic Demonstration Case 001",
    storage_facility: "DCI Central Evidence Vault (Synthetic)",
    vault_number: "VAULT-A",
    shelf_identifier: "SHELF-04-BIN-12",
    custodian_name: "Sgt. Kiprono Cheruiyot (Synthetic Custodian)",
  },
  {
    id: "evd-003",
    item_number: "EVD-003",
    description: "Synthetic touch DNA swab lifted from container locking mechanism",
    evidence_type: "TOUCH_DNA_SWAB",
    status: "IN_VAULT",
    tamper_seal_number: "SEAL-KE-910234",
    packaging_type: "Sterile Swab Transport Tube",
    collection_timestamp: "2026-09-26T16:00:00Z",
    collection_location_desc: "Berth 5 Cargo Container Seal 44-A (Synthetic)",
    case_number: "KFIN-SYN-CASE-2026-0002",
    case_title: "Mombasa Maritime Seizure & Trace Investigation",
    storage_facility: "DCI Central Evidence Vault (Synthetic)",
    vault_number: "VAULT-A",
    shelf_identifier: "SHELF-04-BIN-12",
    custodian_name: "Sgt. Kiprono Cheruiyot (Synthetic Custodian)",
  },
  {
    id: "evd-004",
    item_number: "EVD-004",
    description: "Synthetic buccal swab reference sample from consenting relative",
    evidence_type: "BIOLOGICAL_SPECIMEN",
    status: "IN_VAULT",
    tamper_seal_number: "SEAL-KE-554109",
    packaging_type: "Paper Buccal Collection Kit",
    collection_timestamp: "2026-09-27T14:30:00Z",
    collection_location_desc: "Nakuru Central Sub-County Police Post (Synthetic)",
    case_number: "KFIN-SYN-CASE-2026-0003",
    case_title: "Nakuru Disaster Victim Reference & DVI Inquiry",
    storage_facility: "DCI Central Evidence Vault (Synthetic)",
    vault_number: "VAULT-A",
    shelf_identifier: "SHELF-04-BIN-12",
    custodian_name: "Sgt. Kiprono Cheruiyot (Synthetic Custodian)",
  },
];

export const initialCustodyTransfers: CustodyTransferEvent[] = [
  {
    id: "ct-001",
    transfer_timestamp: "2026-09-27T08:00:00Z",
    transfer_reason: "VAULT_STORAGE",
    authorization_reference: "AUTH-DCI-SEIZURE-2026-001",
    seal_intact: true,
    new_seal_number: "SEAL-KE-849202",
    notes: "Initial recovery from synthetic crime scene into secure intake vault. Sealed and verified.",
    releasing_officer_name: "Insp. Grace Wanjiku (Synthetic Investigator)",
    releasing_officer_badge: "KFIN-OFF-003",
    receiving_officer_name: "Sgt. Kiprono Cheruiyot (Synthetic Custodian)",
    receiving_officer_badge: "KFIN-OFF-002",
    source_facility: "DCI Central Evidence Vault (Synthetic)",
    destination_facility: "DCI Central Evidence Vault (Synthetic)",
  },
  {
    id: "ct-002",
    transfer_timestamp: "2026-09-27T10:30:00Z",
    transfer_reason: "LAB_ANALYSIS",
    authorization_reference: "AUTH-DCI-LAB-TRANS-2026-008",
    seal_intact: true,
    new_seal_number: "SEAL-KE-849203",
    notes: "Transfer to forensic biology division for DNA extraction and profile generation.",
    releasing_officer_name: "Sgt. Kiprono Cheruiyot (Synthetic Custodian)",
    releasing_officer_badge: "KFIN-OFF-002",
    receiving_officer_name: "Dr. Evans Omondi (Synthetic Analyst)",
    receiving_officer_badge: "KFIN-OFF-001",
    source_facility: "DCI Central Evidence Vault (Synthetic)",
    destination_facility: "Forensic Biology Intake Locker (Synthetic)",
  },
  {
    id: "ct-003",
    transfer_timestamp: "2026-09-27T14:00:00Z",
    transfer_reason: "VAULT_STORAGE",
    authorization_reference: "AUTH-DCI-BALL-2026-003",
    seal_intact: true,
    new_seal_number: "SEAL-KE-849206",
    notes: "Ballistics evidence checked into secure armory vault under dual-custody verification.",
    releasing_officer_name: "Insp. Grace Wanjiku (Synthetic Investigator)",
    releasing_officer_badge: "KFIN-OFF-003",
    receiving_officer_name: "Sgt. Kiprono Cheruiyot (Synthetic Custodian)",
    receiving_officer_badge: "KFIN-OFF-002",
    source_facility: "DCI Central Evidence Vault (Synthetic)",
    destination_facility: "DCI Central Evidence Vault (Synthetic)",
  },
];

export const initialDnaProfiles: DnaProfileItem[] = [
  {
    id: "dna-001",
    profile_identifier: "KFIN-SYN-DNA-2026-0001",
    profile_quality: "COMPLETE",
    loci_count: 20,
    profile_status: "ACTIVE",
    extraction_method: "Silica Column Extraction",
    quantification_kit: "Quantifiler Trio Kit",
    amplification_kit: "GlobalFiler STR Amplification",
    electrophoresis_instrument: "Applied Biosystems 3500xL Genetic Analyzer",
    created_at: "2026-09-28T09:15:00Z",
    index_code: "FORENSIC_UNKNOWN",
    index_name: "National Forensic Unknown Crime Scene DNA Index",
    sample_number: "BIO-SYN-001",
    sample_type: "WHOLE_BLOOD",
    donor_type: "SUSPECT",
    analyst_name: "Dr. Evans Omondi (Synthetic Analyst)",
  },
  {
    id: "dna-002",
    profile_identifier: "KFIN-SYN-DNA-2026-0002",
    profile_quality: "COMPLETE",
    loci_count: 20,
    profile_status: "ACTIVE",
    extraction_method: "Silica Column Extraction",
    quantification_kit: "Quantifiler Trio Kit",
    amplification_kit: "GlobalFiler STR Amplification",
    electrophoresis_instrument: "Applied Biosystems 3500xL Genetic Analyzer",
    created_at: "2026-09-28T14:40:00Z",
    index_code: "OFFENDER",
    index_name: "National Convicted Offender DNA Index",
    sample_number: "BIO-SYN-002",
    sample_type: "SALIVA_TRACE",
    donor_type: "VICTIM",
    analyst_name: "Dr. Evans Omondi (Synthetic Analyst)",
  },
];

export const initialStrLoci: StrLocus[] = [
  { locus_name: "D3S1358", allele_1: "15", allele_2: "16", peak_height_1: 1250, peak_height_2: 1190 },
  { locus_name: "vWA", allele_1: "17", allele_2: "18", peak_height_1: 980, peak_height_2: 1040 },
  { locus_name: "FGA", allele_1: "21", allele_2: "23", peak_height_1: 1420, peak_height_2: 1380 },
  { locus_name: "D8S1179", allele_1: "13", allele_2: "14", peak_height_1: 1100, peak_height_2: 1150 },
  { locus_name: "D21S11", allele_1: "28", allele_2: "30", peak_height_1: 890, peak_height_2: 910 },
  { locus_name: "D18S51", allele_1: "14", allele_2: "17", peak_height_1: 760, peak_height_2: 820 },
  { locus_name: "D5S818", allele_1: "11", allele_2: "12", peak_height_1: 1340, peak_height_2: 1290 },
  { locus_name: "D13S317", allele_1: "11", allele_2: "12", peak_height_1: 1120, peak_height_2: 1090 },
  { locus_name: "D7S820", allele_1: "9", allele_2: "10", peak_height_1: 1450, peak_height_2: 1400 },
  { locus_name: "TH01", allele_1: "7", allele_2: "9.3", peak_height_1: 1680, peak_height_2: 1590 },
  { locus_name: "TPOX", allele_1: "8", allele_2: "11", peak_height_1: 1020, peak_height_2: 990 },
  { locus_name: "CSF1PO", allele_1: "10", allele_2: "12", peak_height_1: 880, peak_height_2: 920 },
  { locus_name: "AMEL", allele_1: "X", allele_2: "Y", peak_height_1: 2100, peak_height_2: 2050 },
  { locus_name: "D1S1656", allele_1: "16", allele_2: "17.3", peak_height_1: 940, peak_height_2: 960 },
  { locus_name: "D2S441", allele_1: "11", allele_2: "14", peak_height_1: 1180, peak_height_2: 1220 },
  { locus_name: "D10S1248", allele_1: "13", allele_2: "15", peak_height_1: 1310, peak_height_2: 1290 },
  { locus_name: "D12S391", allele_1: "19", allele_2: "22", peak_height_1: 850, peak_height_2: 890 },
  { locus_name: "D22S1045", allele_1: "15", allele_2: "16", peak_height_1: 1090, peak_height_2: 1140 },
  { locus_name: "D2S1338", allele_1: "19", allele_2: "24", peak_height_1: 970, peak_height_2: 930 },
  { locus_name: "D16S539", allele_1: "11", allele_2: "13", peak_height_1: 1230, peak_height_2: 1260 },
];

export const initialDnaIndices: DnaIndexItem[] = [
  {
    id: "idx-001",
    code: "FORENSIC_UNKNOWN",
    name: "National Forensic Unknown Crime Scene DNA Index",
    description: "Index containing STR DNA profiles from biological evidence recovered at unsolved crime scenes.",
    legal_basis_regulation: "Criminal Procedure Code Cap. 75",
    retention_years_default: 50,
    is_restricted: true,
    profile_count: 1,
  },
  {
    id: "idx-002",
    code: "OFFENDER",
    name: "National Convicted Offender DNA Index",
    description: "Index containing STR DNA profiles of individuals convicted of specified serious offenses.",
    legal_basis_regulation: "National Police Service Act",
    retention_years_default: 75,
    is_restricted: true,
    profile_count: 1,
  },
  {
    id: "idx-003",
    code: "ARRESTEE",
    name: "Qualifying Arrestee DNA Index",
    description: "Index of DNA profiles taken from qualifying arrestees pending adjudication.",
    legal_basis_regulation: "Evidence Act",
    retention_years_default: 10,
    is_restricted: true,
    profile_count: 0,
  },
  {
    id: "idx-004",
    code: "MISSING_PERSON",
    name: "Missing Persons Reference Index",
    description: "Index of reference DNA profiles from missing individuals or biological relatives.",
    legal_basis_regulation: "National Missing Persons Protocol",
    retention_years_default: 50,
    is_restricted: true,
    profile_count: 0,
  },
  {
    id: "idx-005",
    code: "ELIMINATION",
    name: "Forensic Staff Contamination Elimination Index",
    description: "Reference index used solely to detect accidental laboratory or collection contamination.",
    legal_basis_regulation: "ISO/IEC 17025 Standards",
    retention_years_default: 30,
    is_restricted: true,
    profile_count: 0,
  },
];

export const initialLabSubmissions: LabSubmissionItem[] = [
  {
    id: "sub-001",
    submission_number: "KFIN-SYN-SUB-2026-0001",
    urgency: "CRITICAL",
    status: "IN_PROGRESS",
    submission_date: "2026-09-27T10:00:00Z",
    case_summary_notes: "Rush forensic examination requested for biological exhibits recovered from primary scene.",
    case_number: "KFIN-SYN-CASE-2026-0001",
    submitting_org: "DCI Headquarters Forensic Services (Synthetic)",
    receiving_lab: "National Public Health Reference Lab (Synthetic)",
    authorized_by_name: "Insp. Grace Wanjiku (Synthetic Investigator)",
    examination_count: 2,
  },
];

export const initialLabReports: LabReportItem[] = [
  {
    id: "rep-001",
    report_number: "KFIN-SYN-REP-2026-0001",
    conclusion_summary: "A single source male STR DNA profile was successfully obtained from Exhibit EVD-001. Profile matches criteria for national index upload.",
    formal_report_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    is_approved: true,
    issued_at: "2026-09-28T16:30:00Z",
    reporting_analyst: "Dr. Evans Omondi (Synthetic Analyst)",
    approving_director: "Dr. Faith Mutua (Synthetic Lab Director)",
  },
];

export const initialAuditEvents: AuditEventItem[] = [
  {
    id: "aud-001",
    created_at: "2026-09-28T16:30:00Z",
    data_classification: "HIGHLY_RESTRICTED",
    action: "REPORT_APPROVE",
    entity_type: "lab_reports",
    entity_id: "KFIN-SYN-REP-2026-0001",
    outcome: "SUCCESS",
    reason: "Formal laboratory report approved by Director.",
    actor_ip_address: "127.0.0.1",
    actor_name: "Dr. Faith Mutua (Synthetic Lab Director)",
    actor_badge: "KFIN-OFF-004",
  },
  {
    id: "aud-002",
    created_at: "2026-09-28T14:40:00Z",
    data_classification: "HIGHLY_RESTRICTED",
    action: "DNA_INDEX_SEARCH",
    entity_type: "dna_profiles",
    entity_id: "KFIN-SYN-DNA-2026-0001",
    outcome: "SUCCESS",
    reason: "20 CODIS STR allele loci profile registered to FORENSIC_UNKNOWN index.",
    actor_ip_address: "127.0.0.1",
    actor_name: "Dr. Evans Omondi (Synthetic Analyst)",
    actor_badge: "KFIN-OFF-001",
  },
  {
    id: "aud-003",
    created_at: "2026-09-27T10:30:00Z",
    data_classification: "HIGHLY_RESTRICTED",
    action: "EVIDENCE_TRANSFER",
    entity_type: "evidence_items",
    entity_id: "EVD-001",
    outcome: "SUCCESS",
    reason: "Chain of custody transfer executed: Submitting to Forensic Biology Laboratory.",
    actor_ip_address: "127.0.0.1",
    actor_name: "Sgt. Kiprono Cheruiyot (Synthetic Custodian)",
    actor_badge: "KFIN-OFF-002",
  },
  {
    id: "aud-004",
    created_at: "2026-09-25T10:00:00Z",
    data_classification: "HIGHLY_RESTRICTED",
    action: "CASE_CREATE",
    entity_type: "cases",
    entity_id: "KFIN-SYN-CASE-2026-0001",
    outcome: "SUCCESS",
    reason: "Initial synthetic case file opened for demonstration.",
    actor_ip_address: "127.0.0.1",
    actor_name: "Insp. Grace Wanjiku (Synthetic Investigator)",
    actor_badge: "KFIN-OFF-003",
  },
];
