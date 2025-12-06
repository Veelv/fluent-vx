/**
 * Professional build command handler
 * Uses the advanced build system with chunks and manifest
 */

import { runBuild } from '../../core/build/builder';

export async function handleBuild(args: string[]): Promise<void> {
  console.log('🔨 Starting Fluent VX Professional Build...');

  // Parse command line arguments
  const options: any = {
    minify: true, // Default to minified
    sourcemap: false,
    analyze: false,
    prerender: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--out-dir':
      case '-o':
        options.outDir = args[++i];
        break;
      case '--minify':
        options.minify = true;
        break;
      case '--no-minify':
        options.minify = false;
        break;
      case '--sourcemap':
        options.sourcemap = true;
        break;
      case '--analyze':
        options.analyze = true;
        break;
      case '--prerender':
        options.prerender = true;
        break;
    }
  }

  // Run the professional build system
  const result = await runBuild(options);

  if (result.success) {
    console.log('\n🎉 Build completed successfully!');
    console.log(`📁 Output: ${result.output.dir}`);
    console.log(`📦 Chunks: ${result.stats.chunksCount}`);
    console.log(`🎨 Assets: ${result.stats.assetsCount}`);
    console.log(`💾 Size: ${formatBytes(result.stats.totalSize)}`);
    console.log(`⏱️  Time: ${result.stats.buildTime}ms`);

    console.log('\n🚀 Next steps:');
    console.log('  vx preview    - Preview production build');
    console.log('  Deploy .vx/.dist/ to your hosting provider');
  } else {
    console.error('\n❌ Build failed!');
    process.exit(1);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
