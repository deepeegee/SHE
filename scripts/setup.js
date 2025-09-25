const { execSync } = require('child_process');

console.log('🚀 Setting up SHE Week Voting MVP...\n');

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\n🗄️  Setting up database...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('\n🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n✅ Setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Copy .env.example to .env.local');
  console.log('2. Fill in your environment variables');
  console.log('3. Run: npm run dev');
  console.log('\n🎉 Happy coding!');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
