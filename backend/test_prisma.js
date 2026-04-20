const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const userId = '13dfed66-a4c8-47c1-ae3b-017eace68b9d'; // Or any valid UID from db
  // Find a valid user
  const userFirst = await prisma.user.findFirst();
  if(!userFirst) return;
  
  console.log('Original name:', userFirst.name);
  
  const updated = await prisma.user.update({
    where: { id: userFirst.id },
    data: { name: 'Teste Persist Real 001' }
  });
  
  console.log('Updated name from update result:', updated.name);
  
  const refetched = await prisma.user.findUnique({ where: { id: userFirst.id } });
  console.log('Refetched name:', refetched.name);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
