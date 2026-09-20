const axios = require('axios');

async function test() {
    console.log('Testing TikTok API...');
    try {
        const response = await axios.get('http://localhost:3000/api/tiktok/fetch?profile=tiktok');
        console.log('Status:', response.status);
        console.log('Data Preview:', JSON.stringify(response.data).substring(0, 500) + '...');

        if (response.data.videos && response.data.videos.length > 0) {
            console.log('SUCCESS: Videos found!');
            console.log('First video URL:', response.data.videos[0].download_url);
        } else {
            console.log('WARNING: No videos found or structure changed.');
        }
    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

test();
