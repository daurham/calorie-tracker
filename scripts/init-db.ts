import { createTables } from '../src/lib/db/schema';

async function initDb() {
  try {
    await createTables();
    console.log('Database tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating database tables:', error);
    process.exit(1);
  }
}

initDb(); 