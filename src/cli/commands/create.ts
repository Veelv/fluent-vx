/**
 * Create command handler
 */

import { createProject } from '../create';

export async function handleCreate(args: string[]): Promise<void> {
  const projectName = args[0];

  if (!projectName) {
    console.error('❌ Project name is required');
    console.log('Usage: vx create <project-name>');
    process.exit(1);
  }

  console.log(`🚀 Creating Fluent VX project: ${projectName}`);
  console.log('📦 Setting up project structure...');

  await createProject(projectName, {
    template: 'basic',
    typescript: false
  });

  console.log('\n✅ Project created successfully!');
  console.log('\n🎯 Next steps:');
  console.log(`   cd ${projectName}`);
  console.log('   npm install');
  console.log('   npm run dev');
  console.log('\n🎉 Happy coding with Fluent VX!');
  console.log('   https://fluent-vx.dev');
}