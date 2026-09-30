# SafeDose Near-Miss Benchmark Dataset

This directory contains benchmark datasets, provenance audits, and reproducibility schemas for evaluating the **SafeDose NearMiss** reporting and triage platform.

---

## 1. Dataset Overview

- **Primary Benchmark File**: [`near_miss_cases.csv`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/data/evaluation/near_miss_cases.csv)
- **Export Artifacts**: [`data/evaluation/exports/`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/data/evaluation/exports/)
- **Total Benchmark Cases**: 25 synthetic benchmark scenarios created for SafeDose evaluation using generic medication-safety event categories.
- **Provenance Category**: `SYNTHETIC BENCHMARK` (explicitly flagged; no real patient or hospital data).
- **Taxonomy Inspiration vs Case Provenance**: Scenarios are generic educational simulations inspired by common medication safety error categories. These are NOT actual hospital incidents, WHO cases, or ISMP incident reports.

---

## 2. Data Dictionary

| Column Name | Type | Allowed Values / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `case_id` | Text | Format `NM-xxx` | Unique identifier for reproducible test case. |
| `ward` | Text | `ICU`, `Emergency`, `Paediatrics`, `Surgical Ward`, `Medical Ward`, `Cardiology`, `Oncology`, `Maternity`, `Orthopaedics`, `Other` | Hospital clinical area where near-miss occurred. |
| `medicine_category` | Text | `High Alert`, `Antibiotics`, `Analgesics`, `Anticoagulants`, `Cardiovascular`, `Chemotherapy`, `Endocrine`, `Respiratory`, `Psychotropic`, `Other` | Anatomical / therapeutic class. |
| `workflow_stage` | Text | `Prescribing`, `Transcribing`, `Dispensing`, `Preparation`, `Administering`, `Monitoring`, `Handover` | Point along the medication management cycle. |
| `incident_type` | Text | `Wrong Dose`, `Wrong Medication`, `Wrong Route`, `Wrong Rate`, `Wrong Timing`, `Wrong Patient`, `Allergy Mismatch`, `Contraindication`, `Duplicate Order`, `Storage Error`, `Labelling Error`, `Omission`, `Expired Medication`, `Wrong Diluent`, `Wrong Equipment`, `Wrong Formulation` | Clinical classification of error type. |
| `operational_priority` | Text | `LOW`, `MEDIUM`, `HIGH` | Operational review priority for safety committee review. |
| `contributing_factors` | Text | Semicolon-separated string of factors (e.g. `High Workload;Distraction`) | Human and systemic factors contributing to the near miss. |
| `short_description` | Text | Min length 20 characters; no patient identifiers. | Objective factual narrative of the incident. |
| `immediate_action` | Text | Free text (optional) | Corrective or mitigating action executed upon catch. |
| `medication_administered`| Text | `No`, `Yes`, `Unsure` | Whether medication reached patient prior to detection. |
| `patient_harm_status` | Text | `No`, `Yes`, `Unsure` | Confirmation of zero-harm boundary. |
| `anonymous` | Boolean| `true`, `false` | Psychological safety reporting mode. |
| `is_synthetic` | Boolean| Must be `true` for all benchmark simulation data. | Provenance integrity flag. |
| `provenance_source` | Text | Factual source attribution string. | Specific guideline or public taxonomy reference. |

---

## 3. Provenance and Zero-Harm Verification

1. **Synthetic Nature**: Every record in this dataset has `is_synthetic = true`. No patient records, health numbers (MRN/NHS), clinician names, or private institutional databases were utilized.
2. **Zero-Harm Boundary**: SafeDose is engineered strictly for **near misses** (events caught prior to patient harm). Any case flagged with `patient_harm_status = Yes` triggers redirection to formal institutional incident escalation pathways.
3. **Medical Advice Prohibition**: SafeDose does not provide clinical diagnostic or dosage recommendations.

---

## 4. Reproducibility Scripts

To seed or evaluate this benchmark data deterministically:

```bash
# Seed demo benchmark sessions into evaluation table
npm run seed

# Run mathematical evaluation and display comparative statistical analysis
npm run eval

# Export sanitized evaluation results with formula injection guards
npm run eval:export
```
