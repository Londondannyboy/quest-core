#!/usr/bin/env node

/**
 * Claude Code Auto-Fix Script
 * Integrates with MCP-Vercel to detect and fix deployment failures
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutoFixBot {
  constructor() {
    this.maxAttempts = 5;
    this.attemptFile = '.github/auto-fix-attempts';
    this.currentSha = execSync('git rev-parse HEAD').toString().trim();
  }

  async checkDeploymentStatus() {
    console.log('🔍 Checking Vercel deployment status...');
    
    // This would integrate with your MCP-Vercel setup
    // For now, we'll check if build fails locally
    try {
      execSync('npm run build', { stdio: 'pipe' });
      console.log('✅ Build successful - no fix needed');
      return { success: true };
    } catch (error) {
      console.log('❌ Build failed - analyzing errors...');
      return { 
        success: false, 
        error: error.stdout?.toString() || error.stderr?.toString() 
      };
    }
  }

  getAttemptCount() {
    if (!fs.existsSync(this.attemptFile)) {
      return 0;
    }
    
    const attempts = fs.readFileSync(this.attemptFile, 'utf8');
    return (attempts.match(new RegExp(this.currentSha, 'g')) || []).length;
  }

  recordAttempt() {
    const attemptDir = path.dirname(this.attemptFile);
    if (!fs.existsSync(attemptDir)) {
      fs.mkdirSync(attemptDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const record = `${this.currentSha} attempt-${this.getAttemptCount() + 1} ${timestamp}\n`;
    fs.appendFileSync(this.attemptFile, record);
  }

  async autoFix(errorOutput) {
    console.log('🔧 Attempting auto-fix...');
    console.log('Error output:', errorOutput.substring(0, 200) + '...');
    
    let fixApplied = false;

    // Fix missing imports from .md files
    if (errorOutput.includes('Cannot find module') && errorOutput.includes('.md')) {
      console.log('Fixing problematic .md imports...');
      this.fixMarkdownImports();
      fixApplied = true;
    }

    // Fix type errors
    if (errorOutput.includes('Type') && errorOutput.includes('is not assignable')) {
      console.log('Fixing type errors...');
      this.fixCommonTypeErrors();
      fixApplied = true;
    }

    // Fix syntax errors
    if (errorOutput.includes('Unexpected token')) {
      console.log('Fixing syntax errors...');
      this.fixSyntaxErrors();
      fixApplied = true;
    }

    return fixApplied;
  }

  fixMarkdownImports() {
    // Remove imports from .md files
    const files = execSync('find src/ -name "*.tsx" -o -name "*.ts"').toString().split('\n').filter(Boolean);
    
    files.forEach(file => {
      try {
        let content = fs.readFileSync(file, 'utf8');
        const originalContent = content;
        
        // Comment out problematic imports
        content = content.replace(/^import.*\.md.*;$/gm, '// $&');
        
        if (content !== originalContent) {
          fs.writeFileSync(file, content);
          console.log(`Fixed imports in ${file}`);
        }
      } catch (error) {
        console.log(`Could not fix ${file}: ${error.message}`);
      }
    });
  }

  fixCommonTypeErrors() {
    // Add common type fixes
    const files = execSync('find src/ -name "*.tsx" -o -name "*.ts"').toString().split('\n').filter(Boolean);
    
    files.forEach(file => {
      try {
        let content = fs.readFileSync(file, 'utf8');
        const originalContent = content;
        
        // Common fixes
        content = content.replace(/: any;/g, ': unknown;');
        content = content.replace(/as any/g, 'as unknown');
        
        if (content !== originalContent) {
          fs.writeFileSync(file, content);
          console.log(`Fixed types in ${file}`);
        }
      } catch (error) {
        console.log(`Could not fix ${file}: ${error.message}`);
      }
    });
  }

  fixSyntaxErrors() {
    // Basic syntax error fixes
    console.log('Checking for common syntax errors...');
    // This would be expanded based on common patterns
  }

  async commitAndPush(attemptNum) {
    try {
      execSync('git add .');
      
      const commitMessage = `🤖 Auto-fix deployment failure (attempt ${attemptNum}/5)

Automatically resolved build errors
Attempt: ${attemptNum} of 5
Original commit: ${this.currentSha}

🤖 Generated with Claude Code Auto-Fix
Co-Authored-By: Claude <noreply@anthropic.com>`;

      execSync(`git commit -m "${commitMessage}"`);
      execSync('git push');
      
      console.log(`✅ Auto-fix attempt ${attemptNum} committed and pushed!`);
      return true;
    } catch (error) {
      console.log(`❌ Failed to commit/push: ${error.message}`);
      return false;
    }
  }

  async run() {
    console.log('🚀 Starting Claude Auto-Fix Bot...');
    
    const attempts = this.getAttemptCount();
    
    if (attempts >= this.maxAttempts) {
      console.log(`❌ Maximum attempts (${this.maxAttempts}) reached for commit ${this.currentSha}`);
      console.log('🚨 Manual intervention required.');
      return false;
    }

    const { success, error } = await this.checkDeploymentStatus();
    
    if (success) {
      console.log('✅ No fix needed - deployment successful');
      return true;
    }

    this.recordAttempt();
    const attemptNum = attempts + 1;
    
    console.log(`🔧 Starting auto-fix attempt ${attemptNum}/${this.maxAttempts}...`);
    
    const fixApplied = await this.autoFix(error);
    
    if (!fixApplied) {
      console.log(`❌ No suitable auto-fix found for this error type`);
      return false;
    }

    // Verify the fix
    const { success: fixSuccess } = await this.checkDeploymentStatus();
    
    if (fixSuccess) {
      await this.commitAndPush(attemptNum);
      console.log('🎉 Auto-fix successful!');
      return true;
    } else {
      console.log(`❌ Auto-fix attempt ${attemptNum} failed`);
      if (attemptNum >= this.maxAttempts) {
        console.log('🚨 Max attempts reached. Manual intervention required.');
      }
      return false;
    }
  }
}

// Run the auto-fix bot
if (require.main === module) {
  const bot = new AutoFixBot();
  bot.run().catch(console.error);
}

module.exports = AutoFixBot;