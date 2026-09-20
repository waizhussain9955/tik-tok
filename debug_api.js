const axios = require('axios');
const fs = require('fs');

async function getRealVideos(username) {
    console.log(`\n🔍 Fetching REAL videos for @${username}...\n`);

    try {
        const profileUrl = `https://www.tiktok.com/@${username}`;
        const res = await axios.get(profileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 15000
        });

        const html = res.data;

        // Try UNIVERSAL_DATA
        const universalMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.+?)<\/script>/s);
        if (universalMatch) {
            console.log('✅ Found UNIVERSAL_DATA');
            const json = JSON.parse(universalMatch[1]);
            const scope = json.__DEFAULT_SCOPE__;

            // Save for analysis
            fs.writeFileSync('scope_data.json', JSON.stringify(scope, null, 2));
            console.log('Saved full scope to scope_data.json');

            // Check webapp.user-detail
            if (scope['webapp.user-detail']) {
                const userDetail = scope['webapp.user-detail'];
                console.log('user-detail keys:', Object.keys(userDetail));
            }
        }

    } catch (e) {
        console.log('Error:', e.message);
    }
}

getRealVideos('khaby.lame');
