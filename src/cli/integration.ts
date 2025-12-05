// Fluent VX CLI Integration System
// Uses the professional integration system

import { IntegrationManager } from '../integrations/manager';
import { createIntegration } from '../integrations/factory';
import { validateIntegration } from '../integrations/validation';

/**
 * CLI Integration Manager
 * Uses the professional integration system
 */
const cliIntegrationManager = new IntegrationManager({
  strict: false, // CLI should be more forgiving
  logger: (message: string) => console.log(`🔌 ${message}`)
});

/**
 * Add an integration to the project using the integration system
 */
export async function handleAddIntegration(args: string[]): Promise<void> {
  const integrationName = args[0];

  if (!integrationName) {
    console.error('❌ Integration name is required');
    console.log('Usage: vx add <integration-name>');
    console.log('Example: vx add my-integration');
    process.exit(1);
  }

  // Assume integration package name
  const packageName = `@fluent-vx/${integrationName}`;

  try {
    console.log(`➕ Adding integration: ${integrationName}`);

    // Check if fluent-vx.config.ts exists
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.join(process.cwd(), 'fluent-vx.config.ts');

    if (!fs.existsSync(configPath)) {
      console.error('❌ No fluent-vx.config.ts found in current directory');
      console.error('   Make sure you are in a Fluent VX project directory');
      console.error('   Run "vx init" to create a new project');
      process.exit(1);
    }

    // Install the package using npm
    const { execSync } = await import('child_process');

    try {
      console.log(`📦 Installing ${packageName}...`);
      execSync(`npm install ${packageName}`, { stdio: 'inherit' });
      console.log(`✅ Installed ${packageName}`);
    } catch (error) {
      console.error(`❌ Failed to install ${packageName}`);
      console.error('   Make sure the integration exists and is published');
      process.exit(1);
    }

    // Read current config
    const configContent = fs.readFileSync(configPath, 'utf-8');

    // Check if integration is already present
    const importRegex = new RegExp(`import\\s+${integrationName}\\s+from\\s+['"\`]${packageName}['"\`]`, 'g');
    if (importRegex.test(configContent)) {
      console.error(`❌ Integration "${integrationName}" is already installed`);
      process.exit(1);
    }

    // Add import statement
    const importStatement = `import ${integrationName} from '${packageName}';`;
    let updatedConfig = configContent;

    // Find the last import and add after it
    const importMatches = configContent.match(/import\s+.*from\s+['"`][^'"`]+['"`]\s*;/g);
    if (importMatches) {
      const lastImport = importMatches[importMatches.length - 1];
      updatedConfig = updatedConfig.replace(lastImport, `${lastImport}\n${importStatement}`);
    } else {
      // No imports found, add at the beginning
      updatedConfig = updatedConfig.replace(/^/, `${importStatement}\n\n`);
    }

    // Add to integrations array
    const integrationsMatch = updatedConfig.match(/integrations:\s*\[([\s\S]*?)\]/);
    if (integrationsMatch) {
      const integrationsBlock = integrationsMatch[1];
      const newIntegration = `${integrationName}()`;

      let updatedIntegrations;
      if (integrationsBlock.trim()) {
        // Add to existing integrations
        updatedIntegrations = integrationsBlock.replace(/\s*$/, `,\n  ${newIntegration}\n`);
      } else {
        // Empty array
        updatedIntegrations = `\n  ${newIntegration}\n`;
      }

      updatedConfig = updatedConfig.replace(
        integrationsMatch[0],
        `integrations: [${updatedIntegrations}]`
      );
    }

    fs.writeFileSync(configPath, updatedConfig);
    console.log(`✅ Added "${integrationName}" to fluent-vx.config.ts`);

    // Validate and register the integration using the integration system
    try {
      const integration = await createIntegration({
        name: integrationName,
        version: '1.0.0',
        title: integrationName,
        description: `Integration for ${integrationName}`
      });

      const isValid = validateIntegration(integration);
      if (isValid) {
        // Register with the CLI integration manager
        cliIntegrationManager.add(integration);
        console.log(`✅ Integration "${integrationName}" validated and registered`);
      } else {
        console.warn(`⚠️ Integration validation failed`);
      }
    } catch (validationError) {
      console.warn(`⚠️ Could not validate integration: ${validationError}`);
    }

    console.log(`\n🎉 Integration "${integrationName}" added successfully!`);
    console.log('   The integration is now ready to use');

  } catch (error) {
    console.error('❌ Failed to add integration:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Remove an integration from the project using the integration system
 */
export async function handleRemoveIntegration(args: string[]): Promise<void> {
  const integrationName = args[0];

  if (!integrationName) {
    console.error('❌ Integration name is required');
    console.log('Usage: vx remove <integration-name>');
    console.log('Example: vx remove my-integration');
    process.exit(1);
  }

  try {
    console.log(`🗑️ Removing integration: ${integrationName}`);

    // Check if fluent-vx.config.ts exists
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.join(process.cwd(), 'fluent-vx.config.ts');

    if (!fs.existsSync(configPath)) {
      console.error('❌ No fluent-vx.config.ts found in current directory');
      console.error('   Make sure you are in a Fluent VX project directory');
      process.exit(1);
    }

    // Read current config
    const configContent = fs.readFileSync(configPath, 'utf-8');

    // Parse config to find integrations array
    const integrationsMatch = configContent.match(/integrations:\s*\[([\s\S]*?)\]/);
    if (!integrationsMatch) {
      console.error('❌ No integrations array found in fluent-vx.config.ts');
      console.error('   The config file may be malformed');
      process.exit(1);
    }

    const integrationsBlock = integrationsMatch[1];

    // Check if integration is present
    const hasIntegration = integrationsBlock.includes(integrationName);
    if (!hasIntegration) {
      console.error(`❌ Integration "${integrationName}" not found in config`);
      console.error('   Available integrations in your config:');

      // Try to extract integration names from the block
      const importMatches = configContent.match(/import\s+(\w+)\s+from\s+['"`]@fluent-vx\/[^'"`]+['"`]/g);
      if (importMatches) {
        importMatches.forEach(match => {
          const importName = match.match(/import\s+(\w+)\s+from/)?.[1];
          if (importName) {
            console.error(`     - ${importName}`);
          }
        });
      } else {
        console.error('     (none found)');
      }
      process.exit(1);
    }

    // Remove integration from config
    let updatedConfig = configContent;

    // Remove import statement
    const packageName = `@fluent-vx/${integrationName}`;
    const importRegex = new RegExp(`import\\s+${integrationName}\\s+from\\s+['"\`]${packageName}['"\`]\\s*;?\n?`, 'g');
    updatedConfig = updatedConfig.replace(importRegex, '');

    // Remove from integrations array
    const lines = integrationsBlock.split('\n');
    const filteredLines = lines.filter(line => !line.includes(integrationName));

    // Clean up empty lines and trailing commas
    const cleanedLines = filteredLines
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, index, arr) => {
        if (index < arr.length - 1 && !line.endsWith(',')) {
          return line + ',';
        }
        return line;
      });

    const updatedIntegrations = cleanedLines.join('\n');
    updatedConfig = updatedConfig.replace(
      integrationsMatch[0],
      `integrations: [\n  ${updatedIntegrations}\n]`
    );

    fs.writeFileSync(configPath, updatedConfig);
    console.log(`✅ Removed "${integrationName}" from fluent-vx.config.ts`);

    // Try to uninstall the package
    const { execSync } = await import('child_process');

    try {
      console.log(`📦 Uninstalling ${packageName}...`);
      execSync(`npm uninstall ${packageName}`, { stdio: 'inherit' });
      console.log(`✅ Uninstalled ${packageName}`);
    } catch (error) {
      console.warn(`⚠️ Could not uninstall ${packageName}. You may need to remove it manually.`);
      console.warn(`   Try: npm uninstall ${packageName}`);
    }

    console.log(`\n🎉 Integration "${integrationName}" removed successfully!`);
    console.log('   Run "npm install" to update dependencies');

  } catch (error) {
    console.error('❌ Failed to remove integration:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Verify and fix integrations (iv command)
 * Checks installed @fluent-vx/* packages and ensures they're configured
 */
export async function handleVerifyIntegrations(args: string[]): Promise<void> {
  console.log('🔍 Verifying Fluent VX integrations...');

  try {
    // Check if fluent-vx.config.ts exists
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.join(process.cwd(), 'fluent-vx.config.ts');

    if (!fs.existsSync(configPath)) {
      console.error('❌ No fluent-vx.config.ts found in current directory');
      console.error('   Run "vx init" to create a new project first');
      process.exit(1);
    }

    // Check if package.json exists
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.error('❌ No package.json found in current directory');
      process.exit(1);
    }

    // Read package.json to find installed @fluent-vx/* packages
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Find all @fluent-vx/* packages
    const fluentVxPackages = Object.keys(dependencies)
      .filter(pkg => pkg.startsWith('@fluent-vx/'))
      .map(pkg => pkg.replace('@fluent-vx/', ''));

    if (fluentVxPackages.length === 0) {
      console.log('✅ No Fluent VX integrations found in package.json');
      return;
    }

    console.log(`📦 Found ${fluentVxPackages.length} Fluent VX package(s):`);
    fluentVxPackages.forEach(pkg => console.log(`   - @fluent-vx/${pkg}`));

    // Read current config
    const configContent = fs.readFileSync(configPath, 'utf-8');

    // Check which integrations are missing from config
    const missingIntegrations: string[] = [];

    for (const integrationName of fluentVxPackages) {
      const packageName = `@fluent-vx/${integrationName}`;

      // Check if import exists
      const importRegex = new RegExp(`import\\s+${integrationName}\\s+from\\s+['"\`]${packageName}['"\`]`, 'g');
      if (!importRegex.test(configContent)) {
        missingIntegrations.push(integrationName);
      }
    }

    if (missingIntegrations.length === 0) {
      console.log('✅ All Fluent VX integrations are properly configured!');
      return;
    }

    console.log(`\n🔧 Found ${missingIntegrations.length} integration(s) to configure:`);
    missingIntegrations.forEach(name => console.log(`   - ${name}`));

    // Ask for confirmation (unless --yes flag)
    const force = args.includes('--yes') || args.includes('-y');

    if (!force) {
      console.log('\n⚠️  This will modify your fluent-vx.config.ts file.');
      console.log('   Continue? (y/N): ');

      // Simple stdin confirmation
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise<string>(resolve => {
        rl.question('', (answer) => {
          rl.close();
          resolve(answer.toLowerCase());
        });
      });

      if (answer !== 'y' && answer !== 'yes') {
        console.log('❌ Operation cancelled');
        return;
      }
    }

    // Configure missing integrations
    let updatedConfig = configContent;

    for (const integrationName of missingIntegrations) {
      const packageName = `@fluent-vx/${integrationName}`;

      console.log(`🔧 Configuring ${integrationName}...`);

      // Add import statement
      const importStatement = `import ${integrationName} from '${packageName}';`;
      const importMatches = updatedConfig.match(/import\s+.*from\s+['"`][^'"`]+['"`]\s*;/g);

      if (importMatches) {
        const lastImport = importMatches[importMatches.length - 1];
        updatedConfig = updatedConfig.replace(lastImport, `${lastImport}\n${importStatement}`);
      } else {
        // No imports found, add at the beginning
        updatedConfig = updatedConfig.replace(/^/, `${importStatement}\n\n`);
      }

      // Add to integrations array
      const integrationsMatch = updatedConfig.match(/integrations:\s*\[([\s\S]*?)\]/);
      if (integrationsMatch) {
        const integrationsBlock = integrationsMatch[1];
        const newIntegration = `${integrationName}()`;

        let updatedIntegrations;
        if (integrationsBlock.trim()) {
          // Add to existing integrations
          updatedIntegrations = integrationsBlock.replace(/\s*$/, `,\n  ${newIntegration}\n`);
        } else {
          // Empty array
          updatedIntegrations = `\n  ${newIntegration}\n`;
        }

        updatedConfig = updatedConfig.replace(
          integrationsMatch[0],
          `integrations: [${updatedIntegrations}]`
        );
      }

      console.log(`✅ Added ${integrationName} to fluent-vx.config.ts`);
    }

    // Write updated config
    fs.writeFileSync(configPath, updatedConfig);

    console.log(`\n🎉 Successfully configured ${missingIntegrations.length} integration(s)!`);
    console.log('   Run "npm run dev" to see the changes');

  } catch (error) {
    console.error('❌ Failed to verify integrations:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}