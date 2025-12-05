// Fluent VX Project Creator
// Uses templates from src/cli/template/

import * as fs from 'fs';
import * as path from 'path';

// Template copying utilities
function copyTemplateFiles(templateDir: string, targetDir: string, variables: Record<string, string>) {
  function copyRecursive(src: string, dest: string) {
    const stats = fs.statSync(src);

    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const files = fs.readdirSync(src);
      for (const file of files) {
        // Skip .stub files in directory listing - they are processed separately
        if (file.endsWith('.stub')) continue;
        copyRecursive(path.join(src, file), path.join(dest, file));
      }
    } else {
      // Process .stub files
      if (src.endsWith('.stub')) {
        const finalDest = dest.replace('.stub', path.extname(src.replace('.stub', '')) || '.ts');
        let content = fs.readFileSync(src, 'utf-8');

        // Replace template variables
        for (const [key, value] of Object.entries(variables)) {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        fs.writeFileSync(finalDest, content);
        console.log(`✅ Processed template: ${path.relative(process.cwd(), finalDest)}`);
      } else {
        let content = fs.readFileSync(src, 'utf-8');

        // Replace template variables
        for (const [key, value] of Object.entries(variables)) {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        fs.writeFileSync(dest, content);
      }
    }
  }

  copyRecursive(templateDir, targetDir);

  // Process all .stub files in the template directory
  function processStubFiles(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        processStubFiles(fullPath);
      } else if (file.endsWith('.stub')) {
        const relativePath = path.relative(templateDir, fullPath);
        const destPath = path.join(targetDir, relativePath.replace('.stub', '.ts'));
        copyRecursive(fullPath, destPath);
      }
    }
  }

  processStubFiles(templateDir);
}

export interface CreateOptions {
  template?: 'basic' | 'advanced' | 'api';
  typescript?: boolean;
}

export class ProjectCreator {
  private projectName: string;
  private options: Required<CreateOptions>;
  private projectPath: string;

  constructor(name: string, options: CreateOptions = {}) {
    this.projectName = name;
    this.options = {
      template: 'basic',
      typescript: false,
      ...options
    };
    // Support initializing in current directory with '.'
    this.projectPath = name === '.' ? process.cwd() : path.join(process.cwd(), name);
  }

  async create(): Promise<void> {
    this.validateProjectName();
    this.copyFromTemplate();
  }

  private copyFromTemplate(): void {
    // Find template directory - works in both dev and built environments
    let templateDir = path.join(__dirname, 'template', this.options.template);

    // In development, templates are in src/cli/template/
    if (!fs.existsSync(templateDir)) {
      templateDir = path.join(__dirname, '..', '..', 'src', 'cli', 'template', this.options.template);
    }

    // Double check - if still not found, try relative to current file
    if (!fs.existsSync(templateDir)) {
      templateDir = path.join(__dirname, '..', 'template', this.options.template);
    }

    if (!fs.existsSync(templateDir)) {
      throw new Error(`Template directory not found: ${templateDir}`);
    }

    const variables = {
      projectName: this.projectName === '.' ? path.basename(process.cwd()) : this.projectName
    };

    console.log(`📋 Copying template files from ${templateDir}`);
    copyTemplateFiles(templateDir, this.projectPath, variables);
  }

  private validateProjectName(): void {
    if (!this.projectName) {
      throw new Error('Project name is required');
    }

    // Skip validation for current directory initialization
    if (this.projectName === '.') {
      return;
    }

    if (fs.existsSync(this.projectPath)) {
      throw new Error(`Directory "${this.projectName}" already exists`);
    }

    // Validate project name
    if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(this.projectName)) {
      throw new Error('Project name must start with a letter and contain only letters, numbers, hyphens, and underscores');
    }
  }
}

export async function createProject(name: string, options: CreateOptions = {}): Promise<void> {
  const creator = new ProjectCreator(name, options);
  await creator.create();
}