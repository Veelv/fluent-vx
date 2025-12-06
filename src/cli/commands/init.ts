/**
 * Init command handler
 */

import { createProject } from '../create';

export async function handleInit(args: string[]): Promise<void> {
  console.log('🚀 Initializing Fluent VX project in current directory...');

  // Create project in current directory
  await createProject('.', {
    template: 'basic',
    typescript: false
  });

  console.log('\n✅ Project initialized successfully!');
  console.log('\n🎯 Zero-config setup complete!');
  console.log('   npm install');
  console.log('   npm run dev');
  console.log('\n📁 Pages: ./src/pages/ (automatic routing)');
  console.log('📄 App: ./src/app.vx (main layout)');
  console.log('🎨 Styles: ./src/styles/global.css');
}