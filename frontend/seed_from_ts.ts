import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

// Import the fixtures from frontend
import { mockSkuListResponse } from '@/lib/fixtures/reference/skus';
import { mockSupplierListResponse } from '@/lib/fixtures/reference/suppliers';
import { mockShipmentListResponse } from '@/lib/fixtures/reference/shipments';

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set in ../.env");
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    console.log("Connected to Supabase.");

    // Clear existing tables
    console.log("Clearing existing data...");
    await client.query("DELETE FROM shipments;");
    await client.query("DELETE FROM skus;");
    await client.query("DELETE FROM suppliers;");
    console.log("Data cleared.");

    // Insert Suppliers
    console.log(`Inserting ${mockSupplierListResponse.items.length} suppliers...`);
    for (const s of mockSupplierListResponse.items) {
      await client.query(
        `INSERT INTO suppliers (
          id, supplier_code, name, country, contact_email, status, region, risk_rating, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [s.id, s.supplier_code, s.name, s.country, s.contact_email, s.status, s.region, s.risk_rating, s.created_at, s.updated_at]
      );
    }

    // Insert SKUs
    console.log(`Inserting ${mockSkuListResponse.items.length} skus...`);
    for (const s of mockSkuListResponse.items) {
      await client.query(
        `INSERT INTO skus (
          id, sku_code, name, description, unit_of_measure, status, risk_score, risk_level, category, supplier_ids_json, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [s.id, s.sku_code, s.name, s.description, s.unit_of_measure, s.status, s.risk_score, s.risk_level, s.category, JSON.stringify(s.supplier_ids), s.created_at, s.updated_at]
      );
    }

    // Insert Shipments
    console.log(`Inserting ${mockShipmentListResponse.items.length} shipments...`);
    for (const s of mockShipmentListResponse.items) {
      await client.query(
        `INSERT INTO shipments (
          id, shipment_code, status, origin_port_id, destination_port_id, route_id, supplier_id, sku_ids_json, carrier, order_date, expected_delivery_date, events_json, created_at, updated_at, eta
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [s.id, s.shipment_code, s.status, s.origin_port_id, s.destination_port_id, s.route_id, s.supplier_id, JSON.stringify(s.sku_ids), s.carrier, s.order_date, s.expected_delivery_date, JSON.stringify(s.events), s.created_at, s.updated_at, "2026-02-10 08:00:00"]
      );
    }

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.end();
  }
}

seed().catch(console.error);
