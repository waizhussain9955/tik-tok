const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('debug_tiktok.html', 'utf8');
const $ = cheerio.load(html);

const scriptContent = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
if (!scriptContent) {
    console.log('Script not found');
    process.exit(1);
}

try {
    const json = JSON.parse(scriptContent);
    const scope = json.__DEFAULT_SCOPE__;
    console.log('Keys in __DEFAULT_SCOPE__:', Object.keys(scope));

    // Check for user detail
    if (scope['webapp.user-detail']) {
        console.log('Found webapp.user-detail');
        if (scope['webapp.user-detail'].itemInfo) {
            console.log('Found itemInfo');
            if (scope['webapp.user-detail'].itemInfo.itemStruct) {
                console.log('Found itemStruct (Video List). Length:', scope['webapp.user-detail'].itemInfo.itemStruct.length);
            } else {
                console.log('itemStruct NOT found in itemInfo');
                console.log('itemInfo Keys:', Object.keys(scope['webapp.user-detail'].itemInfo));
            }
        } else {
            console.log('itemInfo NOT found in webapp.user-detail');
        }
    } else {
        console.log('webapp.user-detail NOT found. dumping other logical keys...');
        // Look for anything that looks like a video list
        Object.keys(scope).forEach(key => {
            if (JSON.stringify(scope[key]).includes('video')) {
                console.log(`Key '${key}' might contain video data.`);
            }
        });
    }

} catch (e) {
    console.error('JSON Parse error:', e);
}
