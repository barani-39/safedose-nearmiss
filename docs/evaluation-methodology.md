# Evaluation Methodology & Scientific Protocol

## 1. Executive Summary

SafeDose NearMiss is an operational safety infrastructure engineered to reduce cognitive friction and underreporting of medication near misses in hospital wards. This protocol defines the empirical evaluation framework used to quantify system performance relative to unstructured baseline incident reporting tools.

---

## 2. Hypotheses & Variables

### Hypotheses
- **$H_1$ (Velocity)**: Guided multi-attribute structured reporting significantly reduces end-to-end incident logging time ($T_{completion}$) compared to unstructured narrative entry ($p < 0.001$).
- **$H_2$ (Completeness)**: Structured required prompts eliminate omitted workflow parameters, increasing clinical parameter completeness from $< 35\%$ to $> 85\%$.
- **$H_3$ (Actionability)**: Automated extraction of systemic contributing factors improves the proportion of reports actionable by pharmacy safety committees from $< 50\%$ to $> 90\%$.
- **$H_4$ (Safety Guardrail Invariance)**: Rule-based boundary checking achieves 100% interception of medical advice queries and known-harm submissions without false negative leakage.

### Variables Matrix

| Variable | Type | Operational Definition | Measurement Instrument |
| :--- | :--- | :--- | :--- |
| **Reporting Paradigm** | Independent | `BASELINE` (unstructured free-text) vs `SAFEDOSE` (guided multi-field structured form) | System configuration / Route |
| **Completion Velocity ($T$)** | Dependent | Wall-clock seconds from form initialization to successful submission | High-resolution timestamp delta |
| **Completeness Score ($C$)** | Dependent | Percentage (0–100%) of 7 essential clinical safety dimensions populated | `calculateCompletenessScore()` |
| **Actionable Yield ($Y$)** | Dependent | Boolean determination ($1/0$) that report contains $\ge 20$ chars narrative and $\ge 1$ contributing factor | Algorithmic criteria check |
| **Subjective Friction ($S$)** | Dependent | 1–5 Likert rating representing perceived workload and psychological safety | Post-submission evaluation rating |

---

## 3. Mathematical Formulas

### 3.1 Velocity Delta ($\Delta T$)
$$\Delta T = \frac{\bar{T}_{baseline} - \bar{T}_{safedose}}{\bar{T}_{baseline}} \times 100\%$$
*Where:*
- $\bar{T}_{baseline}$ is the mean completion time of baseline sessions (target: $< 75\text{s}$; benchmark typical: $180\text{--}240\text{s}$).
- $\bar{T}_{safedose}$ is the measured mean completion time for SafeDose reports.

### 3.2 Completeness Index ($C$)
$$C = \left( \frac{\sum_{i=1}^{7} w_i}{7} \right) \times 100\%$$
*Where indicators $w_1 \dots w_7 \in \{0, 1\}$ represent:*
1. Ward / clinical area specification
2. Medication anatomical / therapeutic category
3. Medication management workflow stage
4. Incident typology
5. Systemic contributing factors selection
6. Minimum descriptive narrative length ($\ge 20$ characters)
7. Operational review priority designation

### 3.3 Actionable Yield Rate ($Y_{rate}$)
$$Y_{rate} = \frac{\sum_{j=1}^{N} \mathbb{I}(\text{len}(\text{desc}_j) \ge 20 \land |\text{factors}_j| \ge 1)}{N} \times 100\%$$

---

## 4. Threats to Validity & Safeguards

1. **Hawthorne / Novelty Effect**: In experimental setups, participants may report faster or more conscientiously due to active observation.
   - *Safeguard*: Identical benchmark scenarios are tested under both baseline and SafeDose interfaces with timing randomized across ward profiles.
2. **Synthetic Benchmark Limitations**: Benchmark scenarios cannot capture the full spectrum of unpredictable chaotic ward pressures.
   - *Safeguard*: All benchmark results are explicitly flagged with `SYNTHETIC BENCHMARK` provenance. Live clinical findings are categorized as pending.
3. **Subjective Rating Bias**: Self-reported satisfaction may skew toward recent usability impressions.
   - *Safeguard*: Primary performance claims rely on objective, deterministic metrics (time in seconds, completeness fields present).

---

## 5. Algorithmic Guardrails Verification

SafeDose implements deterministic zero-leak boundaries:
- **Medical Advice Interception**: Prohibits clinician diagnostic or treatment dosage queries using regex pattern arrays, providing explicit redirection to institutional clinical escalation channels.
- **Harm Boundary Redirection**: Detects contradictory narrative tokens (e.g., "patient died", "cardiac arrest", "patient was harmed") and alerts the reporter that incidents with known patient harm must be routed to formal clinical governance incident systems.
- **PII Scrubbing**: Warns reporters on detected emails, phone numbers, NHS/MRN identifiers, and explicit patient names to uphold psychological safety and privacy.
