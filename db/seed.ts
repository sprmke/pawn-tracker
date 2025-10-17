import { config } from 'dotenv';

// Load environment variables from .env.local before importing db
config({ path: '.env.local' });

import { db } from './index';
import { investors } from './schema';

const seedInvestors = [
  { name: 'Michael Manlulu', email: 'michael.manlulu@test.com' },
  { name: 'Arianna Perez', email: 'arianna.perez@test.com' },
  { name: 'Precious Natividad', email: 'precious.natividad@test.com' },
  { name: 'Migui Lapira', email: 'migui.lapira@test.com' },
  { name: 'Aida Perez', email: 'aida.perez@test.com' },
  { name: 'Mike Perez', email: 'mike.perez@test.com' },
  { name: 'Justin Perez', email: 'justin.perez@test.com' },
  { name: 'Joann Perez', email: 'joann.perez@test.com' },
];

async function seed() {
  console.log('Seeding database...');

  try {
    // Insert investors
    console.log('Inserting investors...');
    await db.insert(investors).values(seedInvestors);
    console.log('Investors seeded successfully!');

    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
