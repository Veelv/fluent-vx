/**
 * Fluent VX CLI - Professional Logger
 */

import { Logger } from '../types/cli.types';

export class CLILogger implements Logger {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  warn(message: string): void {
    console.warn(`⚠️  ${message}`);
  }

  error(message: string): void {
    console.error(`❌ ${message}`);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(`🔍 ${message}`);
    }
  }

  success(message: string): void {
    console.log(`✅ ${message}`);
  }

  loading(message: string): void {
    console.log(`⏳ ${message}`);
  }

  banner(title: string, subtitle?: string): void {
    const width = 60;
    const titlePadding = Math.max(0, width - title.length - 4);
    const leftPad = Math.floor(titlePadding / 2);
    const rightPad = titlePadding - leftPad;

    console.log('='.repeat(width));
    console.log(`=${' '.repeat(leftPad)}${title}${' '.repeat(rightPad)}=`);
    if (subtitle) {
      const subtitlePadding = Math.max(0, width - subtitle.length - 4);
      const subLeftPad = Math.floor(subtitlePadding / 2);
      const subRightPad = subtitlePadding - subLeftPad;
      console.log(`=${' '.repeat(subLeftPad)}${subtitle}${' '.repeat(subRightPad)}=`);
    }
    console.log('='.repeat(width));
  }

  stats(stats: Record<string, any>): void {
    console.log('\n📊 Stats:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
  }

  request(id: number, method: string, path: string, duration?: number): void {
    const durationStr = duration ? ` ${duration}ms` : '';
    console.log(`📨 [${id}] ${method} ${path}${durationStr}`);
  }

  compilation(file: string, duration: number): void {
    console.log(`⚡ Compiled ${file} in ${duration}ms`);
  }
}

// Global logger instance
export const logger = new CLILogger();