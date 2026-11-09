import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

console.log('========================================================================');
console.log('🚀 ELFAZNI SERVICES — MASTER FULL SYSTEM AUDIT & AUTOMATED QA RUNNER');
console.log('========================================================================\n');

const SUITES = [
  { name: 'Theme & Appearance Editor', script: 'qa/test-theme-editor.mjs' },
  { name: 'Rich Text Editor & Documents A-E', script: 'qa/test-rich-editor.mjs' },
  { name: 'CRM Modules, RBAC Roles & Calendar', script: 'qa/test-crm-roles-calendar.mjs' },
  { name: 'Website Requests & Admin Mailbox', script: 'qa/test-website-requests.mjs' },
  { name: 'Multi-Device Responsive Visual Audit', script: 'qa/test-responsive-devices.mjs' },
];

const masterSummary = {
  timestamp: new Date().toISOString(),
  suites: [],
  totalTests: 0,
  totalPassed: 0,
  totalFailed: 0,
};

for (const suite of SUITES) {
  console.log(`\n========================================================================`);
  console.log(`▶ EXECUTING SUITE: ${suite.name.toUpperCase()}`);
  console.log(`========================================================================\n`);

  try {
    const cmd = `export PATH="/usr/local/bin:$PATH" && node --import tsx ${suite.script}`;
    execSync(cmd, { stdio: 'inherit', env: { ...process.env, PATH: `/usr/local/bin:${process.env.PATH}` } });
    console.log(`\n✔ Suite finished successfully: ${suite.name}\n`);
  } catch (err) {
    console.error(`\n✖ Suite exited with error: ${suite.name}`, err.message);
  }
}

// Consolidate JSON results
const resultFiles = [
  { name: 'Theme Editor', file: 'qa/theme-qa-results.json' },
  { name: 'Rich Text Editor', file: 'qa/rich-editor-qa-results.json' },
  { name: 'CRM & Roles', file: 'qa/crm-roles-qa-results.json' },
  { name: 'Website Requests', file: 'qa/website-requests-qa-results.json' },
  { name: 'Responsive Audit', file: 'qa/responsive-qa-results.json' },
];

for (const rf of resultFiles) {
  if (fs.existsSync(rf.file)) {
    try {
      const data = JSON.parse(fs.readFileSync(rf.file, 'utf8'));
      const passed = data.filter(r => r.passed).length;
      const failed = data.filter(r => !r.passed).length;
      masterSummary.suites.push({
        name: rf.name,
        total: data.length,
        passed,
        failed,
        tests: data,
      });
      masterSummary.totalTests += data.length;
      masterSummary.totalPassed += passed;
      masterSummary.totalFailed += failed;
    } catch {}
  }
}

fs.writeFileSync('qa/master-audit-summary.json', JSON.stringify(masterSummary, null, 2));

console.log('========================================================================');
console.log('🏁 MASTER AUDIT EXECUTION COMPLETE');
console.log(`📊 Total Tests: ${masterSummary.totalTests}`);
console.log(`✅ Passed: ${masterSummary.totalPassed}`);
console.log(`❌ Failed: ${masterSummary.totalFailed}`);
console.log(`📈 Success Rate: ${masterSummary.totalTests ? Math.round((masterSummary.totalPassed / masterSummary.totalTests) * 100) : 0}%`);
console.log('========================================================================\n');
