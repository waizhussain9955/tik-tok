const axios = require('axios');

async function testProfile(username) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing profile: @${username}`);
    console.log('='.repeat(60));

    try {
        const response = await axios.get(`http://localhost:3000/api/tiktok/fetch?profile=${username}`);
        console.log('✓ API Response Status:', response.status);
        console.log('✓ Profile:', response.data.profile);
        console.log('✓ Total Videos:', response.data.total_videos);
        console.log('✓ Cached:', response.data.cached);

        if (response.data.videos && response.data.videos.length > 0) {
            console.log('\n📹 First 3 Videos:');
            response.data.videos.slice(0, 3).forEach((video, i) => {
                console.log(`\n  Video ${i + 1}:`);
                console.log(`    ID: ${video.id}`);
                console.log(`    Description: ${video.description?.substring(0, 50)}...`);
                console.log(`    Thumbnail: ${video.thumbnail?.substring(0, 60)}...`);
                console.log(`    Download URL: ${video.download_url?.substring(0, 60)}...`);
                console.log(`    Play Count: ${video.playCount}`);
            });
            console.log('\n✅ SUCCESS: Videos fetched!');
        } else {
            console.log('⚠️  WARNING: No videos found');
        }

        return response.data;
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
        return null;
    }
}

async function runTests() {
    console.log('\n🧪 Starting Comprehensive TikTok Downloader Tests...\n');

    // Test with multiple popular accounts
    const testAccounts = [
        '1.shotgaming',  // User's original request
        'tiktok',        // Official TikTok
        'willsmith',     // Celebrity account
        'khaby.lame'     // Very popular creator
    ];

    for (const account of testAccounts) {
        await testProfile(account);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between tests
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Tests Complete!');
    console.log('='.repeat(60) + '\n');
}

runTests();
