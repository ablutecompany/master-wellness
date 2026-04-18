const { execSync } = require('child_process');

console.log('--- STARTING PRISMA DB SYNC ---');

let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('DATABASE_URL is not set!');
    process.exit(1);
}

// Ensure the schema engine can connect via IPv4 Session Pooler (port 5432)
if (dbUrl.includes('db.wyddxokuugxwwigzvoja.supabase.co')) {
    console.log('Detected Legacy IPv6 Host. Rewriting for Session Pooler (IPv4) for schema ops...');
    
    // Rewrite host to the Session Pooler (port 5432 is mandatory for schema operations in Supabase Pooler)
    dbUrl = dbUrl.replace('db.wyddxokuugxwwigzvoja.supabase.co:5432', 'aws-0-eu-central-1.pooler.supabase.com:5432');
    
    // Inject Supavisor tenant project
    if (!dbUrl.includes('postgres.wyddxokuugxwwigzvoja')) {
        dbUrl = dbUrl.replace('postgres:', 'postgres.wyddxokuugxwwigzvoja:');
    }

    // Ensure we do NOT use pgbouncer=true for migrations/db push (Schema operations require session mode)
    dbUrl = dbUrl.replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');
}

try {
    console.log('Executing: npx prisma db push --accept-data-loss');
    execSync('npx prisma db push --accept-data-loss', {
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: 'inherit'
    });
    console.log('--- PRISMA DB SYNC COMPLETED SUCCESSFULLY ---');
} catch (err) {
    console.error('--- PRISMA DB SYNC FAILED ---');
    console.error(err.message);
    process.exit(1);
}
