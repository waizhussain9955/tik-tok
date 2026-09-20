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

    console.log('Top Level Keys:');
    Object.keys(scope).forEach(k => console.log(k));

    // Deep search for video-like structures
    function findKey(obj, targetKey, path = '') {
        if (!obj || typeof obj !== 'object') return;

        if (Array.isArray(obj)) {
            obj.forEach((item, i) => findKey(item, targetKey, `${path}[${i}]`));
            return;
        }

        Object.keys(obj).forEach(key => {
            if (key === targetKey) {
                console.log(`FOUND ${targetKey} at: ${path}.${key}`);
                if (Array.isArray(obj[key])) {
                    console.log(`Length: ${obj[key].length}`);
                    // Print first item keys
                    if (obj[key].length > 0) {
                        console.log('Sample Item Keys:', Object.keys(obj[key][0]));
                    }
                }
            }
            findKey(obj[key], targetKey, `${path}.${key}`);
        });
    }

    console.log('\nSearching for itemStruct...');
    findKey(scope, 'itemStruct');

    console.log('\nSearching for itemList...');
    findKey(scope, 'itemList');

} catch (e) {
    console.error('Error:', e);
}
