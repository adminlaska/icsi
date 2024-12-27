-- Erstelle die Tabellen für die Typen
CREATE TABLE IF NOT EXISTS energy_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS measurement_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Erstelle die Verknüpfungstabellen
CREATE TABLE IF NOT EXISTS supplier_energy_types (
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    energy_type_id INTEGER REFERENCES energy_types(id) ON DELETE CASCADE,
    PRIMARY KEY (supplier_id, energy_type_id)
);

CREATE TABLE IF NOT EXISTS supplier_measurement_types (
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    measurement_type_id INTEGER REFERENCES measurement_types(id) ON DELETE CASCADE,
    PRIMARY KEY (supplier_id, measurement_type_id)
);

-- Füge die Grunddaten ein
INSERT INTO energy_types (name) 
VALUES 
    ('gas'),
    ('strom')
ON CONFLICT (name) DO NOTHING;

INSERT INTO measurement_types (name) 
VALUES 
    ('rlm'),
    ('slp')
ON CONFLICT (name) DO NOTHING; 