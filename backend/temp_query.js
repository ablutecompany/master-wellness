const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

prisma.$executeRawUnsafe('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS household_data JSONB')
  .then(() => console.log('Column added'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
