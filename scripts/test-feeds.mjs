import fs from 'fs';
import path from 'path';

// Read the config file directly to extract URLs (bypassing TS compilation for a quick check)
const configPath = path.resolve('./lib/newsConfig.ts');
const configContent = fs.readFileSync(configPath, 'utf-8');

// Regex to find all URLs in the SOURCES object
const urlRegex = /(?:url|feed):\s*['"](https?:\/\/[^'"]+)['"]/g;
const urls = [];
let match;
while ((match = urlRegex.exec(configContent)) !== null) {
 urls.push(match[1]);
}

console.log(`🔍 Found ${urls.length} feed URLs to test...`);

async function testFeeds() {
 let failed = 0;
 for (const url of urls) {
 try {
 const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
 if (!response.ok) {
 console.error(`❌ BROKEN: ${url} (HTTP ${response.status})`);
 failed++;
 continue;
 }
 
 const text = await response.text();
 if (!text.includes('<rss') && !text.includes('<feed') && !text.includes('<?xml')) {
 console.warn(`⚠️ WARNING: ${url} responded, but does not look like valid XML/RSS.`);
 failed++;
 } else {
 console.log(`✅ OK: ${url}`);
 }
 } catch (err) {
 console.error(`❌ FAILED TO CONNECT: ${url} (${err.message})`);
 failed++;
 }
 }
 
 console.log('-----------------------------------');
 if (failed === 0) {
 console.log('🎉 SUCCESS: Zero broken links detected!');
 } else {
 console.log(`🚨 ALERT: ${failed} feeds failed validation. Please update newsConfig.ts.`);
 }
}

testFeeds();
