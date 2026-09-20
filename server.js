const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');
const path = require('path');
const { ZipArchive } = require('archiver');
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const cache = new NodeCache({ stdTTL: 900 }); // 15 min cache

// Safety: Prevent server from exiting on unexpected stream aborts or detached frame errors
process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception caught safely:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Unhandled Rejection caught safely:', reason);
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Detect Chrome executable (Local vs Vercel Serverless)
const getLaunchConfig = async () => {
    if (process.env.VERCEL) {
        try {
            const chromium = require('@sparticuz/chromium');
            return {
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            };
        } catch (e) {
            console.error('Vercel Chromium error:', e.message);
        }
    }

    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser'
    ];

    let foundPath = null;
    for (const p of paths) {
        if (p && fs.existsSync(p)) {
            foundPath = p;
            break;
        }
    }

    return {
        executablePath: foundPath,
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--window-position=-32000,-32000',
            '--window-size=800,600'
        ]
    };
};

// ==========================================
// RESILIENT TIKWM OFFSCREEN BRIDGE
// ==========================================
class ResilientTikwmBridge {
    constructor() {
        this.browser = null;
        this.page = null;
        this.isReady = false;
        this.initPromise = null;
    }

    async init() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                if (this.browser) {
                    try { await this.browser.close(); } catch (e) {}
                }

                const launchConfig = await getLaunchConfig();
                if (!launchConfig.executablePath) {
                    console.error('❌ Chrome/Chromium executable not found on host system.');
                    return;
                }

                console.log('🚀 Launching TikWM Offscreen Session Engine...');
                this.browser = await puppeteer.launch(launchConfig);

                this.page = await this.browser.newPage();
                await this.refreshSession();

                // Keep session warm with 2-minute heartbeat
                setInterval(async () => {
                    try {
                        if (this.page && this.isReady) {
                            await this.page.evaluate(() => fetch('https://www.tikwm.com/').catch(() => {}));
                        }
                    } catch (e) {}
                }, 120000);

            } catch (err) {
                console.error('❌ TikWM Bridge init error:', err.message);
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    async getFreshPage() {
        this.isReady = false;
        try {
            if (this.page) {
                await this.page.close().catch(() => {});
            }
        } catch (e) {}
        this.page = null;

        if (!this.browser || !this.browser.isConnected()) {
            await this.init();
            return;
        }

        try {
            this.page = await this.browser.newPage();
            await this.refreshSession();
        } catch (e) {
            console.error('getFreshPage error, reinitializing browser:', e.message);
            await this.init();
        }
    }

    async refreshSession() {
        this.isReady = false;
        console.log('⏳ Connecting to TikWM to establish Cloudflare clearance...');
        try {
            if (!this.page || this.page.isClosed()) {
                this.page = await this.browser.newPage();
            }
            await this.page.goto('https://www.tikwm.com/', { waitUntil: 'domcontentloaded', timeout: 35000 });
        } catch (e) {
            console.warn('Navigation warning:', e.message);
        }

        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 1000));
            try {
                if (!this.page || this.page.isClosed()) break;
                const title = await this.page.title();
                console.log(`[Bridge] Sec ${i + 1}: title='${title}'`);
                if (title && title.includes('TikWM')) {
                    this.isReady = true;
                    console.log('✅ TikWM Cloudflare clearance established! Engine is READY.');
                    return;
                }
            } catch (tErr) {}
        }
        console.warn('⚠️ TikWM clearance note: will continue and retry on next call.');
    }

    async executeApi(url) {
        for (let attempt = 0; attempt < 3; attempt++) {
            if (!this.browser || !this.page || this.page.isClosed()) {
                await this.getFreshPage();
            }

            try {
                const result = await this.page.evaluate(async (endpoint) => {
                    try {
                        const res = await fetch(endpoint, {
                            headers: { 'Accept': 'application/json' }
                        });
                        const text = await res.text();
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            return { code: -99, msg: 'CHALLENGE', raw: text.substring(0, 50) };
                        }
                    } catch (netErr) {
                        return { code: -1, msg: netErr.message };
                    }
                }, url);

                if (result && result.code === -99) {
                    console.log('⚠️ Security challenge detected during API call. Auto-refreshing session...');
                    await this.getFreshPage();
                    continue;
                }

                if (result && result.code === 0) return result;
                if (result) return result;
            } catch (err) {
                console.error(`Attempt ${attempt + 1} error:`, err.message);
                await this.getFreshPage();
            }
        }
        return { code: -1, msg: 'API request failed after session refresh' };
    }

    async fetchUserPosts(username, count = 50, cursor = 0) {
        const url = `https://www.tikwm.com/api/user/posts?unique_id=${encodeURIComponent(username)}&count=${count}&cursor=${cursor}`;
        return await this.executeApi(url);
    }

    async fetchSearch(username, count = 50, cursor = 0) {
        const url = `https://www.tikwm.com/api/feed/search?keywords=@${encodeURIComponent(username)}&count=${count}&cursor=${cursor}`;
        return await this.executeApi(url);
    }
}

const bridge = new ResilientTikwmBridge();
bridge.init(); // Initialize engine on server boot

// Helper to extract clean username
const extractUsername = (input) => {
    const regex = /tiktok\.com\/@([a-zA-Z0-9_.]+)/;
    const match = input.match(regex);
    return match ? match[1] : input.replace(/^@/, '').trim();
};

// ==========================================
// API ROUTES
// ==========================================

// 1. Fetch Profile Videos (Bulk)
app.get('/api/tiktok/fetch', async (req, res) => {
    const { profile, max = 100 } = req.query;
    if (!profile) return res.status(400).json({ error: 'Profile username or URL is required' });

    const username = extractUsername(profile);
    const cacheKey = `profile_${username.toLowerCase()}`;

    const cachedData = cache.get(cacheKey);
    if (cachedData && cachedData.total_videos > 0) {
        console.log(`💾 Serving cached data for @${username} (${cachedData.total_videos} videos)`);
        return res.json({ ...cachedData, cached: true });
    }

    console.log(`\n🚀 Fetching bulk videos for @${username} via TikWM Bridge...`);

    try {
        let allVideos = [];
        let authorInfo = null;
        let cursor = 0;
        let hasMore = true;
        const targetMax = Math.min(parseInt(max) || 100, 150);

        // Strategy 1: User Posts API with cursor loop
        while (hasMore && allVideos.length < targetMax) {
            const data = await bridge.fetchUserPosts(username, 50, cursor);

            if (data.code === 0 && data.data?.videos && data.data.videos.length > 0) {
                data.data.videos.forEach(v => {
                    if (!allVideos.some(existing => existing.video_id === v.video_id)) {
                        allVideos.push(v);
                    }
                });

                if (!authorInfo && data.data.videos[0]?.author) {
                    authorInfo = data.data.videos[0].author;
                }

                cursor = data.data.cursor || 0;
                hasMore = data.data.hasMore;
                console.log(`  Fetched batch: ${data.data.videos.length} videos (total unique: ${allVideos.length})`);

                if (!hasMore || data.data.videos.length === 0) break;
                await new Promise(r => setTimeout(r, 400));
            } else {
                break;
            }
        }

        // Strategy 2: Search API fallback if user posts returned < 5
        if (allVideos.length < 5) {
            console.log('  Trying search API fallback...');
            const searchData = await bridge.fetchSearch(username, 50, 0);
            if (searchData.code === 0 && searchData.data?.videos) {
                searchData.data.videos.forEach(v => {
                    if (v.author?.unique_id?.toLowerCase() === username.toLowerCase()) {
                        if (!allVideos.some(existing => existing.video_id === v.video_id)) {
                            allVideos.push(v);
                        }
                    }
                });
                if (!authorInfo && searchData.data.videos[0]?.author) {
                    authorInfo = searchData.data.videos[0].author;
                }
            }
        }

        const finalVideos = allVideos.slice(0, targetMax);
        console.log(`✅ Completed @${username}: Found ${finalVideos.length} videos.`);

        const responsePayload = {
            profile: username,
            author: authorInfo ? {
                nickname: authorInfo.nickname || username,
                unique_id: authorInfo.unique_id || username,
                avatar: authorInfo.avatar || null
            } : {
                nickname: username,
                unique_id: username,
                avatar: null
            },
            total_videos: finalVideos.length,
            videos: finalVideos.map(v => ({
                id: v.video_id,
                thumbnail: v.cover || v.origin_cover,
                download_url: v.play,
                wm_download_url: v.wmplay,
                music_url: v.music,
                description: v.title || 'TikTok Video',
                playCount: v.play_count || 0,
                diggCount: v.digg_count || 0,
                duration: v.duration || 0
            }))
        };

        if (responsePayload.total_videos > 0) {
            cache.set(cacheKey, responsePayload);
        }

        res.json({ ...responsePayload, cached: false });

    } catch (error) {
        console.error('💥 Fetch Error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to fetch videos from TikTok' });
    }
});

// 2. Download Single Video / Audio (Proxy Stream with fallback redirect)
app.get('/api/tiktok/download', async (req, res) => {
    const { url, filename, type } = req.query;
    if (!url) return res.status(400).send('URL is required');

    const decodedUrl = decodeURIComponent(url);
    const isAudio = type === 'audio' || decodedUrl.includes('.mp3');
    const defaultName = isAudio ? `tiktok_audio_${Date.now()}.mp3` : `tiktok_video_${Date.now()}.mp4`;
    const cleanName = (filename ? sanitizeFilename(filename) : defaultName);

    try {
        const response = await axios({
            url: decodedUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        res.setHeader('Content-Disposition', `attachment; filename="${cleanName}"`);
        res.setHeader('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');

        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }

        response.data.pipe(res);

    } catch (error) {
        console.warn(`Proxy stream direct failed (${error.message}), redirecting directly to CDN...`);
        res.redirect(decodedUrl);
    }
});

// 3. Bulk Download as ZIP (Streamed on the fly)
app.post('/api/tiktok/download-zip', async (req, res) => {
    const { videos, username } = req.body;
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
        return res.status(400).json({ error: 'Videos array is required' });
    }

    const zipFilename = `tiktok_${username || 'bulk'}_${Date.now()}.zip`;
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = new ZipArchive({
        zlib: { level: 5 }
    });

    archive.on('error', (err) => {
        console.error('Archive error:', err);
        if (!res.headersSent) res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    console.log(`📦 Creating bulk ZIP with ${videos.length} videos...`);

    for (let i = 0; i < videos.length; i++) {
        const item = videos[i];
        if (!item.url) continue;

        try {
            const streamRes = await axios({
                url: item.url,
                method: 'GET',
                responseType: 'stream',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const fileName = item.filename || `tiktok_${item.id || (i + 1)}.mp4`;
            archive.append(streamRes.data, { name: fileName });

        } catch (e) {
            console.error(`Failed to stream video ${item.id} to zip:`, e.message);
        }
    }

    await archive.finalize();
    console.log(`✅ Bulk ZIP complete: ${zipFilename}`);
});

function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Server Health
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        engine: 'TikWM Native Bridge',
        ready: bridge.isReady,
        uptime: process.uptime()
    });
});

if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 TikTok Bulk Downloader Server running on http://localhost:${port}`);
        console.log(`⚡ Engine: Native TikWM Session Bridge (No RapidAPI)`);
        console.log(`======================================================\n`);
    });
}

module.exports = app;
