CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  constituency VARCHAR(200) NOT NULL,
  ward VARCHAR(200) NOT NULL,
  village VARCHAR(200) NOT NULL,
  county VARCHAR(100) NOT NULL DEFAULT 'Trans-Nzoia',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_constituency ON locations(constituency);
CREATE INDEX IF NOT EXISTS idx_locations_ward ON locations(ward);
CREATE INDEX IF NOT EXISTS idx_locations_village ON locations(village);
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_unique ON locations(county, constituency, ward, village);
CREATE INDEX IF NOT EXISTS idx_locations_county_constituency_ward ON locations(county, constituency, ward);
