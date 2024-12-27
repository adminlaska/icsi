-- Fragen-Tabelle
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    category_id INTEGER REFERENCES question_categories(id),
    question TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Antworten-Tabelle
CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verknüpfungstabelle für Fragen und Energietypen
CREATE TABLE IF NOT EXISTS question_energy_types (
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    energy_type_id INTEGER REFERENCES energy_types(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, energy_type_id)
);

-- Verknüpfungstabelle für Fragen und Messtypen
CREATE TABLE IF NOT EXISTS question_measurement_types (
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    measurement_type_id INTEGER REFERENCES measurement_types(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, measurement_type_id)
);

-- Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_questions_supplier ON questions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id); 