const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRawUnsafe("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'profiles'")
.then(res => { console.log(JSON.stringify(res, null, 2)); process.exit(0); })
.catch(err => { console.error(err.message); process.exit(1); })
