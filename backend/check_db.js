const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = '52680848-7d77-4941-911a-d5a000da76e9';
  console.log("Checking user", userId);
  
  const res = await prisma.$queryRawUnsafe(`SELECT * FROM public.profiles WHERE id = $1::uuid`, userId);
  console.log("Profiles DB:", res);
}

main().catch(console.error).finally(() => prisma.$disconnect());
