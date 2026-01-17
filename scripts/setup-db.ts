#!/usr/bin/env tsx

/**
 * Database setup helper for md-tasks
 *
 * This script helps you set up your Supabase database by providing
 * clear instructions and the SQL to run.
 *
 * Usage:
 *   npm run setup:db
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

console.log('='.repeat(70));
console.log('  md-tasks Database Setup');
console.log('='.repeat(70));
console.log();

if (!supabaseUrl) {
  console.error('⚠️  Error: EXPO_PUBLIC_SUPABASE_URL not found in .env');
  console.error();
  console.error('Please create a .env file with your Supabase credentials.');
  console.error('See .env.example for the required variables.');
  process.exit(1);
}

console.log('✓ Environment variables loaded');
console.log(`  Project: ${supabaseUrl}`);
console.log();

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

if (!fs.existsSync(migrationsDir)) {
  console.error(`⚠️  Migrations directory not found: ${migrationsDir}`);
  process.exit(1);
}

const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.error('⚠️  No migration files found.');
  process.exit(1);
}

console.log('📋 Database Migration Instructions');
console.log('-'.repeat(70));
console.log();
console.log('To set up your database, run the following SQL in your Supabase dashboard:');
console.log();
console.log('  1. Go to: https://supabase.com/dashboard/project/_/sql/new');
console.log('  2. Copy and paste the SQL below');
console.log('  3. Click "Run" to execute');
console.log();
console.log('='.repeat(70));
console.log();

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(filePath, 'utf-8');

  console.log(`-- Migration: ${file}`);
  console.log('-'.repeat(70));
  console.log(sql);
  console.log();
}

console.log('='.repeat(70));
console.log();
console.log('✓ Migration SQL displayed above');
console.log();
console.log('💡 Alternative: If you have Supabase CLI installed, run:');
console.log('   supabase db push');
console.log();
