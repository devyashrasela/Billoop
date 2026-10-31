import { migrator } from './migrator.js';
import { sequelize } from '../config/db.js';

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected for migrations.');

    const command = process.argv[2] || 'up';
    if (command === 'down') {
      console.log('Reverting last migration...');
      await migrator.down();
      console.log('Migration rollback complete.');
    } else {
      console.log('Applying pending migrations...');
      await migrator.up();
      console.log('All migrations applied successfully.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();

