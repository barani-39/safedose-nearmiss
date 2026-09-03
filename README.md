# SafeDose NearMiss

## Medication Near-Miss Safety Reporting & Learning System

**Educational prototype — operational safety support only. Not medical advice. Not certified for clinical use.**

---

## Problem Statement

Medication near misses can reveal important weaknesses in hospital workflows before actual patient harm occurs. However, staff may fail to report near misses because existing reporting systems can feel slow, complicated, bureaucratic, punitive, blame-focused, and difficult to use during busy shifts.

SafeDose NearMiss provides a psychologically safe reporting workflow that focuses on:
- What happened?
- Where did it happen?
- What factors contributed?
- How can the organisation learn from it?

Rather than: Who made the mistake?

## Objective

Build a complete, polished, working full-stack web application for medication near-miss reporting and organisational learning, designed for a simulated busy inpatient hospital ward where staff administer high-risk medicines.

## Features

- **Rapid structured reporting form** (~60 seconds to complete)
- **Anonymous reporting** (default ON, reporter identity never stored when anonymous)
- **Rule-based automated classification** with human review requirement
- **Review queue** with sorting and filtering by status, priority, ward, and incident type
- **Report detail page** with reviewer notes, status changes, and 1-click classification confirmation
- **Safety dashboard** with real-time charts calculated from stored data
- **Operational safety insights** generated from deterministic aggregation
- **Patient Safety Journeys** (`/journeys`) — Deeply documented clinical walkthroughs across HIGH and MEDIUM urgency levels with interactive timeline stepper
- **Stakeholder Validation** (`/validation`) — Usability reviews from ICU nurse specialists, medication safety officers, and governance leads with live evaluation submission
- **Empirical Evaluation Engine** (`/evaluation`) — Controlled comparison matrix (Baseline vs Target vs Measured SafeDose), percentage improvements, Missing-Information Analysis, and Error Analysis
- **Evaluation Session Hook & Reconciliation** — Every SafeDose submission records an evaluation session in `evaluation_sessions`; idempotent background reconciliation syncs historical reports
- **Privacy detection** for email addresses, phone numbers, and hospital numbers
- **Medical advice boundary detection** — refuses clinical questions with immediate red refusal banner
- **Contradictory information detection** (e.g., harm=No but narrative mentions harm)
- **Vague report detection** — prompts for more context
- **Baseline evaluation form** (`/evaluation/baseline`) for academic comparison
- **Synthetic demo data** (fictional ward reports, clearly marked)
- **Automated Test Suite** (Vitest) — 13 passing unit and invariant tests (`npm test`)

## Architecture

```
Reporter
  ↓
Structured Report Form
  ↓
Validation (privacy, medical-advice, vagueness, harm boundary)
  ↓
Database (Supabase / PostgreSQL)
  ↓
Automated Operational Suggestion (rule-based keyword classifier)
  ↓
Human Reviewer (review queue → detail page → confirm/change)
  ↓
Confirmed Classification
  ↓
Dashboard (real-time analytics from stored data)
  ↓
Operational Learning
```

### Conceptual Architecture

The application is a single-page React application with client-side routing. It communicates directly with Supabase (PostgreSQL) for all data persistence. No server-side application code is required beyond Supabase's built-in RLS-protected API.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| Charts | Recharts |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| Auth | None (no-auth prototype — all data is shared) |

## Database Design

### Table: `near_miss_reports`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated unique ID |
| created_at | timestamptz | Submission timestamp |
| updated_at | timestamptz | Last update timestamp |
| ward | text | Ward/area where event occurred |
| custom_ward | text (nullable) | Custom ward name if "Other" |
| medicine_category | text | Broad medicine category |
| workflow_stage | text | Stage in medication workflow |
| incident_type | text | Type of incident |
| operational_priority | text | LOW / MEDIUM / HIGH |
| contributing_factors | text[] | Array of contributing factor tags |
| short_description | text | Narrative of what happened |
| immediate_action | text (nullable) | What was done immediately |
| medication_administered | text | Yes / No / Unsure |
| patient_harm_status | text | No / Yes / Unsure |
| anonymous | boolean | Whether report is anonymous |
| reporter_identifier | text (nullable) | Only set if not anonymous |
| status | text | Submitted / Under Review / Action Required / Closed |
| reviewer_notes | text (nullable) | Notes added by safety reviewer |
| suggested_category | text (nullable) | Automated suggestion |
| suggestion_confidence | text (nullable) | LOW / MEDIUM / HIGH heuristic |
| human_verified_category | text (nullable) | Reviewer-confirmed classification |
| reviewed_at | timestamptz (nullable) | When reviewer last saved |
| is_synthetic | boolean | Marks demo data |

**RLS**: Enabled. Policies allow `anon, authenticated` full CRUD (no-auth educational prototype with intentionally shared data).

### Table: `evaluation_sessions`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated unique ID |
| created_at | timestamptz | Session timestamp |
| reporting_method | text | BASELINE or SAFEDOSE |
| completion_seconds | integer | Time to complete |
| completeness_score | double precision | 0–100 deterministic score |
| usable_report | boolean | Whether report was usable |
| satisfaction_score | integer | 1–5 rating |
| ward | text | Ward entered |
| description | text | Free-text from session |
| notes | text | Additional notes |

## Reporting Workflow

1. Staff member navigates to `/report`
2. Fills structured form: ward, medicine category, workflow stage, incident type, priority, contributing factors, description, immediate action, medication administered, patient harm status
3. Safety checks run in real-time:
   - Medical advice detection blocks submission if clinical questions are detected
   - Privacy detection warns about possible identifying information
   - Vague description detection prompts for more context
   - Patient harm = Yes blocks submission and redirects to organisational incident reporting
   - Contradictory harm information flags for human review
4. Anonymous toggle (default ON) — when ON, reporter_identifier is never stored
5. On submit, rule-based classifier generates a suggested category and confidence
6. Report is persisted to database
7. Confirmation page shows report ID, timestamp, priority, and status

## Reviewer Workflow

1. Safety reviewer navigates to `/review`
2. Views all reports with sorting (date, priority, status) and filtering (status, priority, ward, incident type)
3. High-priority reports are visually highlighted with restrained orange styling
4. Clicks a report to open detail page at `/review/:id`
5. Reviews: overview, description, contributing factors, immediate action, automated suggestion
6. Human review section: confirms/edits classification, updates priority, changes status, adds reviewer notes
7. Clicks "Save Review" — changes persist to database

## Human Review Points

1. **Reporter verifies submission** — confirmation page after submit
2. **Privacy warning requires reporter review** — identifying info detection
3. **Uncertain/contradictory report requires safety reviewer** — harm status flags
4. **Automated classification requires reviewer confirmation** — suggestion is never final
5. **Reviewer determines status/action** — human decides Submitted → Under Review → Action Required → Closed
6. **Organisational action remains a human decision** — dashboard insights are informational only

## Safety Boundaries

- **No medical advice**: The system detects and refuses clinical questions ("What dose should I give?")
- **No diagnoses, prescriptions, dosing, or treatment recommendations**
- **No clinical emergency instructions**
- **Patient harm = Yes blocks submission** and redirects to organisational pathways
- **Automated suggestions are always labelled as suggestions requiring human confirmation**
- **Every page displays the operational safety disclaimer**

## Privacy Considerations

- Users are warned to avoid entering patient-identifying information
- Basic pattern detection checks for email addresses, phone-number-like patterns, hospital/MRN numbers, and patient name references
- Detection is not perfect and is not claimed to be a complete PHI/PII safeguard
- No sensitive text is sent to third-party AI APIs
- Anonymous reports never store reporter identity

## Automated Classification

The system uses a **deterministic rule-based keyword classifier** (no LLM dependency):

1. The description text is matched against keyword maps for each incident type
2. Each match increments a score for that category
3. The highest-scoring category becomes the suggested classification
4. Confidence is calculated: HIGH (3+ matches), MEDIUM (2 matches), LOW (1 match)
5. If no keywords match, the suggestion is "Other" with LOW confidence
6. Every suggestion is labelled: "Automated operational suggestion — requires human confirmation"

### Integration Point for Future ML

The classifier is isolated in `src/lib/safety.ts` in the `classifyReport()` function. A future Python ML model (scikit-learn, TF-IDF, Logistic Regression) can replace this function by exposing an API endpoint that the frontend calls instead. No other application code needs to change.

## Synthetic Dataset

25 fictional near-miss reports are included as synthetic demonstration data. They are:
- Completely fictional — no real patient data or identifiers
- Varied across wards, medicines, incident types, workflow stages, priorities, and statuses
- Marked with `is_synthetic = true` in the database
- Displayed with a "Demo" badge in the review queue and detail pages
- Loaded idempotently — the loader checks for existing synthetic records and does not duplicate

## Evaluation Methodology

### Prototype Report Completeness Score

**Formula**: Count of present operational fields / total fields × 100

Fields checked (7 total):
1. Ward (non-empty)
2. Medicine category (non-empty)
3. Workflow stage (non-empty)
4. Incident type (non-empty)
5. At least one contributing factor
6. Description (≥20 characters)
7. Operational priority (non-empty)

**Baseline completeness** (2 fields): Ward + Description (≥20 chars)

This is a deterministic academic metric, not a clinically validated score.

### Evaluation Metrics

| Metric | Description |
|--------|-------------|
| Completion time | Seconds from page load to submit |
| Completeness score | 0–100% based on formula above |
| Usable report | Boolean — meets minimum information threshold |
| Satisfaction | 1–5 user rating |
| Reporting method | BASELINE vs SAFEDOSE |

Results are calculated from collected data only. No results are fabricated. If no data exists, the evaluation page displays "No evaluation data collected yet."

## Edge Cases

| Case | Input | Expected Behaviour |
|------|-------|-------------------|
| Vague Report | "Something went wrong." | Prompts for more operational context |
| Medical Advice Request | "What dose should I give?" | No medical answer; shows safety disclaimer; blocks submission |
| Possible Identifier | Email/phone in description | Privacy warning shown |
| Contradictory Harm | Harm=No but narrative mentions harm | Flagged for human review |
| Low-Confidence Classification | No keywords match | Suggests "Other" with LOW confidence; human review required |

## Installation

```bash
npm install
```

## Local Development

```bash
npm run dev
```

The application runs on Vite's dev server. Supabase environment variables are pre-configured.

## Testing

```bash
npm test            # Run automated test suite (Vitest, 13 unit and invariant tests)
npm run typecheck   # TypeScript type checking
npm run build       # Production build
npm run lint        # ESLint
```

### Manual End-to-End Test Scenarios

**Scenario A — Storage Near Miss (Medium Priority)**
- Ward: Medical Ward
- Medicine: Insulin
- Workflow: Storage
- Incident: Storage Error
- Priority: Medium
- Factor: Storage Layout
- Verify: Report → Submission → Review Queue → Reviewer → Dashboard

**Scenario B — Duplicate Order Near Miss (High Priority)**
- Ward: ICU
- Medicine: Anticoagulant
- Workflow: Administration
- Incident: Duplicate Order
- Priority: High
- Factors: Communication, Handover
- Verify: Report → High Priority → Review Queue → Human Review → Action Required → Dashboard

## Deployment

The application is deployed via Bolt. The Supabase database is provisioned automatically.

## Demo Scenarios

1. **Home page** — landing page with value cards and demo data status
2. **Report a Near Miss** — structured form with all safety checks
3. **Review Queue** — filterable list of all reports (including demo data)
4. **Report Detail** — human review interface with classification confirmation
5. **Dashboard** — real-time charts and operational insights
6. **Evaluation** — baseline form, SafeDose form, comparison analytics
7. **About / Safety** — safety boundaries and prototype disclaimer

## Limitations

- **No authentication** — this is a no-auth educational prototype; all data is shared
- **Rule-based classifier** — not a trained ML model; keyword matching only
- **Privacy detection is basic** — pattern matching, not a complete PHI/PII safeguard
- **No real-time updates** — pages reload data on navigation
- **Simulated reviewer role** — no role-based access control
- **Not clinically validated** — educational prototype only

## Future Improvements

### Machine Learning Experiment

**Dataset**: 500–1000 synthetic near-miss narratives
**Labels**: Wrong Dose, Wrong Medication, Duplicate Order, Wrong Route, Wrong Timing, Storage Error, Communication Error, Labelling Error

**Pipeline**:
```
Synthetic narratives
  ↓
Train/Test Split
  ↓
TF-IDF Vectorisation
  ↓
Logistic Regression
  ↓
Prediction
  ↓
Confidence Score
  ↓
Human Review
```

**Metrics**: Accuracy, Precision, Recall, F1, Confusion Matrix

This ML model is for **incident classification only**. It must NOT make treatment decisions.

### Other Future Work
- Supabase Auth for real reviewer authentication
- Real-time subscription updates for the review queue
- Export to CSV/PDF for audit reports
- Trend analysis over time (week/month comparisons)
- Integration with hospital incident management systems

---

**Educational prototype only — not approved or certified for clinical use.**
