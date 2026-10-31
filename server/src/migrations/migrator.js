import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const migrator = new Umzug({
  migrations: {
    glob: ['*.js', { cwd: __dirname, ignore: ['index.js', 'migrator.js'] }],
    resolve: ({ name, path: filePath, context }) => {
      return {
        name,
        up: async () => {
          const migration = await import(pathToFileURL(filePath).href);
          return migration.up({ context, sequelize });
        },
        down: async () => {
          const migration = await import(pathToFileURL(filePath).href);
          return migration.down({ context, sequelize });
        },
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'SequelizeMeta' }),
  logger: console,
});

