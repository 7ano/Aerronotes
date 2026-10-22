/*
# MIAT Central (AeroNotes) — Core Schema

## Overview
Creates the three data tables that power the MIAT Central study platform for
aircraft engineering students: a resource hub, an EASA Part-66 quiz bank, and a
student note submission board. No authentication is required — the app is
single-tenant and intentionally public/shared.

## New Tables

### resources
- `id` (uuid, PK)
- `title` (text) — display title of the resource
- `description` (text) — short summary
- `track` (text) — 'academic' or 'easa'
- `track_ref` (text) — semester label like "Semester 3" or module code like "M3"
- `subject` (text) — e.g. "Thermofluids", "Electrical Fundamentals"
- `type` (text) — 'pdf_summary' | 'lecture_slides' | 'past_paper' | 'lab_manual'
- `file_url` (text) — URL to the downloadable file
- `pages` (int) — page count for display
- `created_at` (timestamptz)

### quiz_questions
- `id` (uuid, PK)
- `module_code` (text) — e.g. "M3", "M7", "M11A"
- `module_name` (text) — e.g. "Electrical Fundamentals"
- `topic` (text) — sub-topic within the module
- `question` (text) — the question text
- `option_a` (text)
- `option_b` (text)
- `option_c` (text)
- `correct_answer` (text) — 'a', 'b', or 'c'
- `explanation` (text) — shown after answering
- `created_at` (timestamptz)

### note_submissions
- `id` (uuid, PK)
- `student_name` (text)
- `track` (text) — 'academic' or 'easa'
- `track_ref` (text) — semester or module
- `subject` (text)
- `title` (text)
- `content` (text) — note body
- `created_at` (timestamptz)

## Security
- RLS enabled on all three tables.
- CRUD granted to `anon, authenticated` (no-auth single-tenant app).
- All policies use `USING (true)` / `WITH CHECK (true)` because the data is
  intentionally public — any visitor can browse resources, take quizzes, and
  submit notes.
*/

-- ── resources ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  track text NOT NULL DEFAULT 'academic',
  track_ref text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'pdf_summary',
  file_url text NOT NULL DEFAULT '',
  pages int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON resources TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_resources" ON resources;
CREATE POLICY "public_read_resources" ON resources FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_insert_resources" ON resources;
CREATE POLICY "public_insert_resources" ON resources FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_resources" ON resources;
CREATE POLICY "public_update_resources" ON resources FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_delete_resources" ON resources;
CREATE POLICY "public_delete_resources" ON resources FOR DELETE
  TO anon, authenticated USING (true);

-- ── quiz_questions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code text NOT NULL,
  module_name text NOT NULL DEFAULT '',
  topic text NOT NULL DEFAULT '',
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  correct_answer text NOT NULL DEFAULT 'a',
  explanation text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON quiz_questions TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_quiz" ON quiz_questions;
CREATE POLICY "public_read_quiz" ON quiz_questions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_insert_quiz" ON quiz_questions;
CREATE POLICY "public_insert_quiz" ON quiz_questions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_quiz" ON quiz_questions;
CREATE POLICY "public_update_quiz" ON quiz_questions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_delete_quiz" ON quiz_questions;
CREATE POLICY "public_delete_quiz" ON quiz_questions FOR DELETE
  TO anon, authenticated USING (true);

-- ── note_submissions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS note_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL DEFAULT 'Anonymous',
  track text NOT NULL DEFAULT 'academic',
  track_ref text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE note_submissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON note_submissions TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_notes" ON note_submissions;
CREATE POLICY "public_read_notes" ON note_submissions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_insert_notes" ON note_submissions;
CREATE POLICY "public_insert_notes" ON note_submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_notes" ON note_submissions;
CREATE POLICY "public_update_notes" ON note_submissions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_delete_notes" ON note_submissions;
CREATE POLICY "public_delete_notes" ON note_submissions FOR DELETE
  TO anon, authenticated USING (true);

-- ── Seed: Resources ────────────────────────────────────────
INSERT INTO resources (title, description, track, track_ref, subject, type, file_url, pages) VALUES
('Thermofluids — Conservation Equations', 'Comprehensive summary of mass, momentum, and energy conservation principles.', 'academic', 'Semester 3', 'Thermofluids', 'pdf_summary', 'https://example.com/thermofluids-conservation.pdf', 24),
('Thermofluids Lecture Slides — Week 1-6', 'Slide deck covering fluid properties, statics, and kinematics.', 'academic', 'Semester 3', 'Thermofluids', 'lecture_slides', 'https://example.com/thermofluids-w1-6.pptx', 180),
('Thermofluids Past Paper 2023 — Solutions', 'Fully worked solutions to the 2023 final examination.', 'academic', 'Semester 3', 'Thermofluids', 'past_paper', 'https://example.com/thermofluids-2023-solutions.pdf', 12),
('Thermofluids Lab Manual — Wind Tunnel', 'Step-by-step procedures for the wind tunnel experiment lab.', 'academic', 'Semester 3', 'Thermofluids', 'lab_manual', 'https://example.com/thermofluids-wind-tunnel-lab.pdf', 18),
('Piston Engines — 4-Stroke Cycle Summary', 'Detailed breakdown of the Otto cycle and valve timing diagrams.', 'academic', 'Semester 5', 'Piston Engines', 'pdf_summary', 'https://example.com/piston-4stroke-summary.pdf', 16),
('Piston Engines Lecture Slides — Carburetion', 'Slides covering float-type carburetors and fuel injection systems.', 'academic', 'Semester 5', 'Piston Engines', 'lecture_slides', 'https://example.com/piston-carburetion.pptx', 95),
('Aircraft Structures — Stress Analysis Notes', 'Summary of stress, strain, and Mohr''s circle analysis.', 'academic', 'Semester 4', 'Aircraft Structures', 'pdf_summary', 'https://example.com/structures-stress-summary.pdf', 20),
('Aircraft Structures Lab Manual — Material Testing', 'Tensile and hardness testing procedures with data sheets.', 'academic', 'Semester 4', 'Aircraft Structures', 'lab_manual', 'https://example.com/structures-material-lab.pdf', 22),
('Digital Techniques — Logic Gates Summary', 'Boolean algebra and combinational logic circuit reference.', 'academic', 'Semester 2', 'Digital Techniques', 'pdf_summary', 'https://example.com/digital-logic-summary.pdf', 14),
('Digital Techniques Past Paper 2022 — Solutions', 'Worked solutions for the 2022 digital techniques exam.', 'academic', 'Semester 2', 'Digital Techniques', 'past_paper', 'https://example.com/digital-2022-solutions.pdf', 10),
('M3 Electrical Fundamentals — DC Circuits', 'Summary of Ohm''s law, Kirchhoff''s laws, and network theorems.', 'easa', 'M3', 'Electrical Fundamentals', 'pdf_summary', 'https://example.com/m3-dc-circuits.pdf', 28),
('M3 Electrical Fundamentals Lecture Slides', 'Complete slide deck for Module 3 covering AC/DC theory.', 'easa', 'M3', 'Electrical Fundamentals', 'lecture_slides', 'https://example.com/m3-lecture-slides.pptx', 220),
('M7 Maintenance Practices — Tooling & Safety', 'Reference guide for aircraft maintenance tooling and safety procedures.', 'easa', 'M7', 'Maintenance Practices', 'pdf_summary', 'https://example.com/m7-tooling-safety.pdf', 35),
('M7 Maintenance Practices Lab Manual', 'Hands-on procedures for lockwire, torque, and inspection.', 'easa', 'M7', 'Maintenance Practices', 'lab_manual', 'https://example.com/m7-lab-manual.pdf', 30),
('M11A Turbine Aerodynamics — Compressor Theory', 'Summary of axial compressor aerodynamics and stage loading.', 'easa', 'M11A', 'Turbine Aerodynamics', 'pdf_summary', 'https://example.com/m11a-compressor-theory.pdf', 32),
('M11A Turbine Aerodynamics Past Paper 2023', 'Past exam with annotated solutions for Module 11A.', 'easa', 'M11A', 'Turbine Aerodynamics', 'past_paper', 'https://example.com/m11a-2023-solutions.pdf', 15),
('M1 Mathematics — Calculus Summary', 'Differentiation and integration reference for Module 1.', 'easa', 'M1', 'Mathematics', 'pdf_summary', 'https://example.com/m1-calculus-summary.pdf', 26),
('M8 Basic Aerodynamics — Lift & Drag', 'Summary of lift coefficient, drag polar, and wing theory.', 'easa', 'M8', 'Basic Aerodynamics', 'pdf_summary', 'https://example.com/m8-lift-drag.pdf', 22);

-- ── Seed: Quiz Questions ───────────────────────────────────
INSERT INTO quiz_questions (module_code, module_name, topic, question, option_a, option_b, option_c, correct_answer, explanation) VALUES
('M3', 'Electrical Fundamentals', 'DC Circuits', 'In a series circuit, the total resistance is equal to:', 'The reciprocal of the sum of reciprocals', 'The sum of individual resistances', 'The average of individual resistances', 'b', 'In a series circuit, current flows through each component in sequence, so total resistance is the sum of all individual resistances: R_total = R1 + R2 + R3 + ...'),
('M3', 'Electrical Fundamentals', 'Kirchhoff''s Laws', 'Kirchhoff''s Current Law (KCL) states that:', 'The sum of currents entering a node equals the sum leaving it', 'Voltage across parallel elements is the same', 'Power equals voltage times current', 'a', 'KCL is based on conservation of charge: all current entering a junction must equal all current leaving that junction.'),
('M3', 'Electrical Fundamentals', 'AC Theory', 'In a purely inductive AC circuit, the current:', 'Is in phase with the voltage', 'Lags the voltage by 90 degrees', 'Leads the voltage by 90 degrees', 'b', 'In a pure inductor, current lags voltage by 90 degrees because the inductor opposes changes in current through back-EMF.'),
('M3', 'Electrical Fundamentals', 'Capacitance', 'The capacitance of a parallel plate capacitor is directly proportional to:', 'The distance between plates', 'The area of the plates and permittivity of the dielectric', 'The voltage applied across it', 'b', 'C = εA/d. Capacacitance increases with plate area (A) and dielectric permittivity (ε), and decreases with plate separation (d).'),
('M3', 'Electrical Fundamentals', 'Power', 'In a DC circuit, electrical power can be calculated as:', 'P = V × I', 'P = V / I', 'P = I / V', 'a', 'Power is the product of voltage and current: P = V × I (measured in watts). Also expressible as P = I²R or P = V²/R.'),
('M7', 'Maintenance Practices', 'Safety', 'What is the purpose of lockwire (safety wire)?', 'To improve electrical grounding', 'To prevent fasteners from loosening due to vibration', 'To seal against fluid leaks', 'b', 'Lockwire is a mechanical locking device that prevents threaded fasteners from backing out due to vibration, a critical safety requirement in aviation.'),
('M7', 'Maintenance Practices', 'Torque', 'When torquing a critical fastener, the torque value specifies:', 'The rotational speed to apply', 'The rotational force to apply to the fastener', 'The number of turns to make', 'b', 'Torque is a measure of rotational force (moment), typically in inch-pounds or Newton-meters, ensuring correct clamping force without over-stretching the bolt.'),
('M7', 'Maintenance Practices', 'Inspection', 'A crack found during visual inspection that is within allowable limits is called:', 'A rejectable defect', 'A reportable defect within limits', 'A non-reportable cosmetic issue', 'b', 'If a crack is within the allowable limits specified in the AMM (Aircraft Maintenance Manual), it is reportable but does not require immediate rejection — it must be monitored.'),
('M7', 'Maintenance Practices', 'Tooling', 'Which torque wrench type provides the most accurate torque measurement?', 'Beam type torque wrench', 'Click type torque wrench', 'Dial indicating torque wrench', 'c', 'Dial indicating torque wrenches provide a continuous visual readout of applied torque, offering the highest accuracy and allowing the operator to verify the exact value in real time.'),
('M7', 'Maintenance Practices', 'Materials', 'AN standard steel bolts are identified by their:', 'Thread pitch only', 'Grip length, diameter, and head marking', 'Color coding only', 'b', 'AN (Air Force-Navy) bolts are designated by diameter, grip length (shank length), and head markings indicating material and strength class.'),
('M11A', 'Turbine Aerodynamics', 'Compressor', 'The primary function of an axial compressor stator vane is to:', 'Increase the velocity of the airflow', 'Diffuse the air and direct it to the next rotor at the correct angle', 'Compress the air through centrifugal action', 'b', 'Stator vanes act as diffusers — they convert kinetic energy (velocity) from the rotor into pressure, and direct the flow at the correct angle into the next rotor stage.'),
('M11A', 'Turbine Aerodynamics', 'Turbine', 'In a gas turbine engine, the turbine section extracts energy to:', 'Provide thrust directly', 'Drive the compressor and accessories', 'Cool the combustion chamber', 'b', 'The turbine extracts energy from the hot expanding gases to drive the compressor (via the shaft) and engine accessories. In turboprops/turboshafts, it also drives the propeller/rotor.'),
('M11A', 'Turbine Aerodynamics', 'Thermodynamics', 'The Brayton cycle consists of which four processes?', 'Isentropic compression, constant-pressure heat addition, isentropic expansion, constant-pressure heat rejection', 'Isothermal compression, constant-volume heat addition, isentropic expansion, constant-volume heat rejection', 'Adiabatic compression, constant-temperature heat addition, adiabatic expansion, constant-temperature heat rejection', 'a', 'The Brayton (Joule) cycle — the ideal cycle for gas turbine engines — consists of isentropic compression, constant-pressure heat addition, isentropic expansion (through the turbine), and constant-pressure heat rejection.'),
('M11A', 'Turbine Aerodynamics', 'Efficiency', 'The thermal efficiency of an ideal Brayton cycle increases with:', 'Decreasing pressure ratio', 'Increasing pressure ratio', 'Increasing turbine inlet temperature only', 'b', 'For an ideal Brayton cycle, thermal efficiency η = 1 - (1/r_p)^((γ-1)/γ), so efficiency increases with the pressure ratio r_p. Higher pressure ratios mean more work output per unit of heat input.'),
('M11A', 'Turbine Aerodynamics', 'Stall', 'Compressor stall is most likely to occur when:', 'The engine is operating at optimal RPM', 'The airflow over compressor blades is disrupted, causing flow separation', 'The fuel flow is too high', 'b', 'A compressor stall occurs when the angle of attack of the airflow on compressor blades exceeds the critical angle, causing flow separation — often due to rapid throttle changes or foreign object damage.'),
('M8', 'Basic Aerodynamics', 'Lift', 'The lift equation is L = ½ρV²SCL. The coefficient of lift (CL) depends primarily on:', 'Air density and velocity', 'Angle of attack and airfoil shape', 'Wing area and weight', 'b', 'CL is a dimensionless coefficient determined by the airfoil geometry (shape) and the angle of attack. The other variables in the equation (ρ, V, S) are operational/environmental factors.'),
('M8', 'Basic Aerodynamics', 'Drag', 'Parasite drag increases with the square of:', 'Altitude', 'Airspeed', 'Angle of attack', 'b', 'Parasite (form/skin friction) drag is proportional to V² — doubling airspeed quadruples parasite drag. This is why high-speed flight requires streamlined design.'),
('M8', 'Basic Aerodynamics', 'Stall', 'An aircraft stalls when:', 'The engine fails', 'The critical angle of attack is exceeded, causing flow separation', 'The airspeed indicator reads zero', 'b', 'A stall is an aerodynamic event, not an engine event. It occurs when the wing exceeds its critical angle of attack (~15-16° for most airfoils), causing the boundary layer to separate and lift to drop abruptly.'),
('M8', 'Basic Aerodynamics', 'Mach Number', 'Mach number is defined as the ratio of:', 'Airspeed to the speed of sound', 'Altitude to temperature', 'Wing loading to thrust', 'a', 'Mach number M = V/a, where V is the true airspeed and a is the local speed of sound. Mach 1 means the aircraft is traveling at the speed of sound.'),
('M1', 'Mathematics', 'Calculus', 'The derivative of f(x) = x³ with respect to x is:', '3x²', 'x²/3', '3x', 'a', 'Using the power rule: d/dx(x^n) = n·x^(n-1). So d/dx(x³) = 3x².'),
('M1', 'Mathematics', 'Trigonometry', 'In a right triangle, sin(θ) equals:', 'Adjacent over Hypotenuse', 'Opposite over Hypotenuse', 'Opposite over Adjacent', 'b', 'SOH-CAH-TOA: sin(θ) = Opposite/Hypotenuse, cos(θ) = Adjacent/Hypotenuse, tan(θ) = Opposite/Adjacent.'),
('M1', 'Mathematics', 'Algebra', 'If 2x + 5 = 17, then x equals:', '4', '6', '11', 'b', '2x + 5 = 17 → 2x = 12 → x = 6. Basic linear equation solved by isolating the variable.'),
('M5', 'Digital Techniques', 'Logic Gates', 'The output of a NAND gate is LOW when:', 'Both inputs are HIGH', 'Both inputs are LOW', 'One input is HIGH and one is LOW', 'a', 'A NAND gate outputs LOW only when ALL inputs are HIGH. It is the inverse of AND: the AND output is HIGH only when both inputs are HIGH, so NAND inverts that to LOW.'),
('M5', 'Digital Techniques', 'Number Systems', 'The binary number 1011 is equal to what decimal value?', '9', '11', '13', 'b', '1011₂ = 1×8 + 0×4 + 1×2 + 1×1 = 8 + 0 + 2 + 1 = 11 in decimal.'),
('M5', 'Digital Techniques', 'Flip-Flops', 'A D flip-flop is also known as a:', 'Toggle flip-flop', 'Data or Delay flip-flop', 'JK flip-flop', 'b', 'The D flip-flop is called a "Data" or "Delay" flip-flop. It captures the value of the D input at the clock edge and holds it — the output Q follows D at the triggering edge.');
