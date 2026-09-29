/**
 * Reproducible Evaluation Seeding Script
 * 
 * Inserts structured near-miss benchmark cases and baseline evaluation sessions
 * into the database.
 * 
 * Safety Guard:
 * Refuses execution in production unless ALLOW_DEMO_SEED=true is explicitly set.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Production execution guard
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  console.error('❌ Refusing to run demo seeding in production environment without ALLOW_DEMO_SEED=true.');
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

interface NearMissCSVRecord {
  case_id: string;
  ward: string;
  medicine_category: string;
  workflow_stage: string;
  incident_type: string;
  operational_priority: 'LOW' | 'MEDIUM' | 'HIGH';
  contributing_factors: string;
  short_description: string;
  immediate_action: string;
  medication_administered: 'Yes' | 'No' | 'Unsure';
  patient_harm_status: 'No' | 'Yes' | 'Unsure';
  anonymous: string;
  is_synthetic: string;
  provenance_source: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(content: string): NearMissCSVRecord[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const records: NearMissCSVRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, index) => {
      obj[h.trim()] = values[index] ? values[index].trim() : '';
    });
    records.push(obj as unknown as NearMissCSVRecord);
  }

  return records;
}

const BENCHMARK_BASELINES = [
  {
    ward: 'ICU',
    description: 'Patient insulin dose was almost given without checking the blood glucose level first because of handover delay.',
    completion_seconds: 195,
    completeness_score: 25,
    usable_report: false,
    satisfaction_score: 2,
    notes: 'Academic Baseline Benchmark Session #1 - unstructured narrative (Demo Seed)',
  },
  {
    ward: 'Emergency',
    description: 'Morphine syringe found left on counter without patient label. Discarded by senior sister before administration.',
    completion_seconds: 220,
    completeness_score: 30,
    usable_report: true,
    satisfaction_score: 3,
    notes: 'Academic Baseline Benchmark Session #2 - unstructured narrative (Demo Seed)',
  },
  {
    ward: 'Surgical Ward',
    description: 'Antibiotic IV infusion bag hung at 200ml/hr instead of 100ml/hr. Caught 10 minutes in when alarm beeped.',
    completion_seconds: 180,
    completeness_score: 25,
    usable_report: false,
    satisfaction_score: 2,
    notes: 'Academic Baseline Benchmark Session #3 - unstructured narrative (Demo Seed)',
  },
  {
    ward: 'Medical Ward',
    description: 'Warfarin dose prescribed for 6pm but patient already took morning dose at home. Family mentioned it during tea round.',
    completion_seconds: 240,
    completeness_score: 35,
    usable_report: true,
    satisfaction_score: 2,
    notes: 'Academic Baseline Benchmark Session #4 - unstructured narrative (Demo Seed)',
  },
  {
    ward: 'Paediatrics',
    description: 'Syringe driver rate calculated with adult formula. Doctor realized mistake while signing the chart.',
    completion_seconds: 210,
    completeness_score: 20,
    usable_report: false,
    satisfaction_score: 1,
    notes: 'Academic Baseline Benchmark Session #5 - unstructured narrative (Demo Seed)',
  },
  {
    ward: 'Maternity',
    description: 'Oxytocin infusion line almost connected to epidural port. Color coded connector mismatch noticed.',
    completion_seconds: 175,
    completeness_score: 30,
    usable_report: true,
    satisfaction_score: 3,
    notes: 'Academic Baseline Benchmark Session #6 - unstructured narrative (Demo Seed)',
  },
  {
    ward: 'Oncology',
    description: 'Pre-chemo antiemetic omitted from drug kardex. Nurse noticed before chemotherapy started.',
    completion_seconds: 260,
    completeness_score: 25,
    usable_report: false,
    satisfaction_score: 2,
    notes: 'Academic Baseline Benchmark Session #7 - unstructured narrative (Demo Seed)',
  },
  {
    ward: 'Cardiology',
    description: 'Digoxin prescribed despite low potassium on morning labs. Pharmacist flagged during clinical round.',
    completion_seconds: 190,
    completeness_score: 35,
    usable_report: true,
    satisfaction_score: 3,
    notes: 'Academic Baseline Benchmark Session #8 - unstructured narrative (Demo Seed)',
  },
];

async function seedData() {
  console.log('--- SafeDose NearMiss Evaluation Seeding ---');
  const csvPath = path.join(rootDir, 'data', 'evaluation', 'near_miss_cases.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Benchmark CSV not found at ${csvPath}`);
    process.exit(1);
  }

  const rawCSV = fs.readFileSync(csvPath, 'utf8');
  const cases = parseCSV(rawCSV);
  console.log(`Loaded ${cases.length} synthetic benchmark cases from ${csvPath}.`);

  const exportDir = path.join(rootDir, 'data', 'evaluation', 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Format reports for insertion
  const reportsToInsert = cases.map((c, i) => {
    const factors = c.contributing_factors ? c.contributing_factors.split(';').map((f) => f.trim()) : [];
    return {
      ward: c.ward,
      custom_ward: null,
      medicine_category: c.medicine_category,
      workflow_stage: c.workflow_stage,
      incident_type: c.incident_type,
      operational_priority: c.operational_priority,
      contributing_factors: factors,
      short_description: c.short_description,
      immediate_action: c.immediate_action || null,
      medication_administered: c.medication_administered,
      patient_harm_status: c.patient_harm_status,
      anonymous: c.anonymous === 'true',
      reporter_identifier: null,
      status: 'Submitted' as const,
      is_synthetic: true,
      created_at: new Date(Date.now() - (cases.length - i) * 3600000).toISOString(),
    };
  });

  // Always write local export fixture
  const offlineFixturePath = path.join(exportDir, 'seeded_benchmark_reports.json');
  fs.writeFileSync(offlineFixturePath, JSON.stringify(reportsToInsert, null, 2), 'utf8');
  console.log(`✓ Saved local benchmark fixture to ${offlineFixturePath}`);

  if (!supabaseUrl || !supabaseKey) {
    console.log('ℹ️ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. Skipping live Supabase seeding (offline fixture created).');
    return;
  }

  try {
    const client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    console.log(`Connecting to Supabase at: ${supabaseUrl}`);

    // Check reachability
    const { error: pingError } = await client.from('near_miss_reports').select('id', { head: true, count: 'exact' });
    if (pingError) {
      console.warn(`⚠️ Supabase endpoint unreachable (${pingError.message}). Live seeding skipped; offline fixture available.`);
      return;
    }

    // Insert benchmark baselines
    console.log(`Inserting ${BENCHMARK_BASELINES.length} benchmark baseline sessions...`);
    const { error: bErr } = await client.from('evaluation_sessions').insert(BENCHMARK_BASELINES);
    if (bErr) console.warn('Warning inserting baseline sessions:', bErr.message);
    else console.log('✓ Benchmark baseline sessions seeded successfully.');

    // Insert sample reports
    console.log(`Inserting ${reportsToInsert.length} synthetic near-miss reports...`);
    const { data: insertedReports, error: rErr } = await client.from('near_miss_reports').insert(reportsToInsert).select('id, ward, operational_priority, workflow_stage, short_description');
    if (rErr) {
      console.warn('Warning inserting near-miss reports:', rErr.message);
    } else if (insertedReports) {
      console.log(`✓ Inserted ${insertedReports.length} near-miss reports into database.`);

      // Create matching evaluation sessions
      const evalSessions = insertedReports.map((r, idx) => ({
        reporting_method: 'SAFEDOSE',
        completion_seconds: 40 + ((idx * 5) % 25),
        completeness_score: 95,
        usable_report: true,
        satisfaction_score: 5,
        ward: r.ward,
        description: r.short_description,
        notes: `SafeDose Report ID: ${r.id} | Priority: ${r.operational_priority} | Stage: ${r.workflow_stage} (Demo Seed)`,
      }));

      const { error: eErr } = await client.from('evaluation_sessions').insert(evalSessions);
      if (eErr) console.warn('Warning creating evaluation sessions for seeded reports:', eErr.message);
      else console.log(`✓ Created ${evalSessions.length} matching SafeDose evaluation sessions.`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('⚠️ Seeding could not connect to live Supabase:', msg);
  }

  console.log('Seeding procedure completed.');
}

seedData();
