// Manually add scripts to package.json since we can't edit it directly
const fs = require('fs');

try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Add missing scripts
    packageJson.scripts['windev'] = 'cross-env NODE_ENV=development tsx server/index.ts';
    packageJson.scripts['test:db'] = 'node scripts/test-db.js';
    packageJson.scripts['test:ai'] = 'node scripts/test-ai.js';
    packageJson.scripts['seed:db'] = 'node scripts/seed-db.js';
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Added scripts to package.json');
} catch (error) {
    console.error('❌ Failed to update package.json:', error.message);
}