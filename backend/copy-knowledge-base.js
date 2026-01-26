// Simple script to copy knowledge-base folder to dist
// This ensures the knowledge base is available in the built output

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../knowledge-base');
const targetDir = path.join(__dirname, 'dist/knowledge-base');

try {
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  }

  // Copy knowledge-base directory
  if (fs.existsSync(sourceDir)) {
    // Remove target if it exists
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    
    // Copy directory
    fs.cpSync(sourceDir, targetDir, { recursive: true });
    console.log('✓ Copied knowledge-base to dist/knowledge-base');
  } else {
    console.warn('⚠ knowledge-base directory not found at:', sourceDir);
  }
} catch (error) {
  console.error('Error copying knowledge-base:', error.message);
  // Don't fail the build if copy fails - the path resolution will try other locations
}
