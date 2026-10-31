import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { sequelize, User, Tax, PaymentTerm } from '../models/index.js';
import { ROLES } from '../../../shared/constants/index.js';

export const seedDatabase = async () => {
  console.log('Seeding initial system data...');

  // 1. Seed Admin User
  const adminEmail = env.seed.adminEmail.trim().toLowerCase();
  const existingAdmin = await User.findOne({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.seed.adminPassword, 12);
    await User.create({
      email: adminEmail,
      passwordHash,
      role: ROLES.ADMIN,
      name: 'System Admin',
      isActive: true,
    });
    console.log(`[Seed] Created admin account: ${adminEmail}`);
  } else {
    console.log(`[Seed] Admin user already exists: ${adminEmail}`);
  }

  // 2. Seed Standard Taxes
  const defaultTaxes = [
    { name: 'GST 18%', rate: 18.0, type: 'percentage', isActive: true },
    { name: 'GST 5%', rate: 5.0, type: 'percentage', isActive: true },
    { name: 'Exempt 0%', rate: 0.0, type: 'percentage', isActive: true },
  ];

  for (const tax of defaultTaxes) {
    const [record, created] = await Tax.findOrCreate({
      where: { name: tax.name },
      defaults: tax,
    });
    if (created) {
      console.log(`[Seed] Created tax: ${tax.name} (${tax.rate}%)`);
    }
  }

  // 3. Seed Standard Payment Terms
  const defaultTerms = [
    { name: 'Immediate', dueDays: 0 },
    { name: 'Net 15', dueDays: 15 },
    { name: 'Net 30', dueDays: 30 },
  ];

  for (const term of defaultTerms) {
    const [record, created] = await PaymentTerm.findOrCreate({
      where: { name: term.name },
      defaults: term,
    });
    if (created) {
      console.log(`[Seed] Created payment term: ${term.name} (${term.dueDays} days)`);
    }
  }

  console.log('Seeding completed successfully.');
};

// If run directly from CLI
if (process.argv[1]?.endsWith('index.js')) {
  (async () => {
    try {
      await sequelize.authenticate();
      await seedDatabase();
      process.exit(0);
    } catch (err) {
      console.error('[Seed Error]:', err);
      process.exit(1);
    }
  })();
}
