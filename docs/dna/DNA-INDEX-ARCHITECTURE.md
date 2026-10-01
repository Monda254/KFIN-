# KFIN National DNA Index Architecture

## 1. Overview
KFIN maintains logical and access-control firewalls between national DNA indices to enforce statutory retention, privacy compliance, and authorized access.

## 2. Authorized National Indices

| Index Code | Index Name | Purpose & Inclusion Criteria | Access Restrictions |
| :--- | :--- | :--- | :--- |
| **`FORENSIC`** | National Forensic Evidence Index | Unidentified DNA profiles recovered from crime scenes and biological evidence exhibits. | Active Investigators & Analysts |
| **`OFFENDER`** | National Convicted Offender Index | Legally authorized profiles from convicted offenders. | Restricted (Requires `search:restricted_index` & Clearance Level >= 4) |
| **`MISSING_PERSONS`** | Missing Persons & Relatives Index | Profiles of reported missing persons and consenting family reference donors. | Authorized Investigators & DVI Teams |
| **`UNIDENTIFIED_REMAINS`** | Unidentified Human Remains Index | DNA profiles derived from unidentified deceased remains and disaster victim recovery. | Authorized Investigators & DVI Teams |
| **`ELIMINATION`** | Contamination Elimination Index | Controlled profiles of lab personnel, crime scene officers, and evidence handlers. | Highly Restricted (Quality Assurance & Contamination Audits Only) |

## 3. Logical Firewalls
- An ordinary investigative search cannot query the **Elimination Index** without explicit contamination audit authorization.
- Profiles in the **Missing Persons Index** are logically isolated from criminal offender indexes to preserve donor trust and statutory compliance.
