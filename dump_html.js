const axios = require('axios');
const fs = require('fs');

const url = 'https://www.tiktok.com/@tiktok'; // Using official tiktok account as test

async function dump() {
    console.log(`Fetching ${url}...`);
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'max-age=0',
            }
        });
        fs.writeFileSync('debug_tiktok.html', data);
        console.log('Saved to debug_tiktok.html');
    } catch (e) {
        console.error('Error:', e.message);
    }
}

dump();
