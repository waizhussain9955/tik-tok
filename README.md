# TikTok Bulk Video Downloader

A complete **full-stack** TikTok video downloader system with a premium dark-themed UI and robust backend scraping capabilities.

## 🚀 Features

✅ **Modern Web Interface** - Clean, dark-themed UI with glassmorphism effects  
✅ **5×5 Grid Layout** - Display up to 25 videos per page with smooth pagination  
✅ **HD Video Downloads** - Direct download to your device (laptop/desktop)  
✅ **Server-Side Caching** - 15-minute cache to prevent rate limiting  
✅ **Proxy Downloads** - Backend proxy endpoint to bypass CORS restrictions  
✅ **Dual Scraping Strategy** - TikWM API primary + HTML scraping fallback  
✅ **Responsive Design** - Mobile and desktop friendly  
✅ **Future WordPress Ready** - Frontend code structured for Gutenberg block conversion  

---

## 📦 Installation

### Prerequisites
- **Node.js** 16+ (with npm)
- **Active Internet Connection**

### Quick Start

```bash
# 1. Navigate to project directory
cd "d:/tik tok project/bulk-downloader-tiktok"

# 2. Install dependencies (already done if you see node_modules)
npm install

# 3. Start the server
npm start
```

The server will start at **http://localhost:3000**

---

## 🎯 Usage

### Web Interface
1. Open your browser to `http://localhost:3000`
2. Enter a TikTok profile URL (e.g., `https://www.tiktok.com/@username`) or just the username
3. Click **"Fetch Videos"**
4. Browse videos in the **5×5 grid**
5. Click **"HD Download"** below any video to save it

### API Endpoints

#### Fetch Profile Videos
```http
GET /api/tiktok/fetch?profile={username}
```

**Response:**
```json
{
  "profile": "username",
  "total_videos": 25,
  "cached": false,
  "videos": [
    {
      "id": "7123456789",
      "thumbnail": "https://...",
      "download_url": "https://...",
      "description": "Video caption",
      "playCount": 1000000
    }
  ]
}
```

#### Download Video (Proxy)
```http
GET /api/tiktok/download?url={encoded_video_url}
```

---

## 🏗️ Architecture

### Frontend (`/public`)
- **`index.html`** - Main page structure
- **`style.css`** - Dark theme with glassmorphism + responsive grid
- **`script.js`** - API integration, pagination, download handling

### Backend (`server.js`)
- **Express.js** server on port 3000
- **Dual Scraping Strategy:**
  1. **Primary:** TikWM API (`https://www.tikwm.com/api/user/posts`)
  2. **Fallback:** Direct HTML scraping (extracts JSON from `__UNIVERSAL_DATA_FOR_REHYDRATION__` or `SIGI_STATE`)
- **NodeCache** for 15-minute caching
- **CORS enabled** for local frontend access
- **Streaming proxy** for video downloads

---

## ⚠️ Important Limitations

### TikTok Anti-Scraping Measures
TikTok actively prevents automated access. You may encounter:

1. **Empty Video Lists** - Profiles may return 0 videos due to:
   - **Bot Detection** - TikTok blocks requests without proper browser fingerprints
   - **Region Restrictions** - Different content per geographic location
   - **Private/Restricted Accounts** - Not all profiles are publicly scrapable
   - **Rate Limiting** - Too many requests = temporary blocks

2. **Download URL Expiration** - Video URLs from scraping expire quickly (signed/tokenized)

3. **API Reliability** - Third-party APIs (TikWM) may:
   - Change structure without notice
   - Have usage limits
   - Require authentication in the future

### Recommended Solutions
- **Use with moderation** (avoid rapid-fire requests)
- **Test with known public creators** (willsmith, khaby.lame, etc.)
- **Consider official TikTok APIs** for production use (requires developer account)
- **Use headless browsers** (Puppeteer/Playwright) for more reliable scraping

---

## 🔧 Troubleshooting

### Server Won't Start
```bash
# Kill existing processes on port 3000
npx kill-port 3000

# Restart
npm start
```

### No Videos Found
- **Try different accounts** - Some profiles block automated access
- **Check server logs** - Look for "Fetching videos for..." messages
- **Disable cache temporarily** - Uncomment cache bypass in `server.js` line 128

### Downloads Not Working
- **Check browser console** for errors
- **Verify download_url** in API response isn't empty
- **Try the proxy endpoint** manually: `/api/tiktok/download?url=...`

---

## 🔮 WordPress Plugin Conversion

The frontend is **ready for WordPress** with minimal changes:

### Steps for Kadence Block Integration
1. **Copy `/public` files** to your plugin directory
2. **Enqueue scripts/styles** in PHP:
   ```php
   wp_enqueue_style('tiktok-downloader', plugin_url('style.css'));
   wp_enqueue_script('tiktok-downloader', plugin_url('script.js'));
   ```
3. **Update fetch URL** in `script.js`:
   ```javascript
   const response = await fetch(`https://your-api-server.com/api/tiktok/fetch?profile=${input}`);
   ```
4. **Keep backend running** on your own server or cloud function

---

## 📁 Project Structure

```
bulk-downloader-tiktok/
├── public/
│   ├── index.html          # Main frontend page
│   ├── style.css           # Premium dark theme CSS
│   └── script.js           # Frontend logic + API calls
├── server.js               # Express backend + scraping logic
├── package.json            # Dependencies + scripts
├── README.md               # This file
├── test_api.js             # Quick API test
├── test_comprehensive.js   # Multi-account test
└── node_modules/          # Dependencies (auto-generated)
```

---

## 🛡️ Legal & Ethical Use

⚠️ **Disclaimer:**  
This tool is for **educational purposes** and personal use only. Users must:
- Respect TikTok's Terms of Service
- Only download content they have rights to use
- Not redistribute copyrighted material
- Comply with local copyright laws

**The developers are NOT responsible for misuse of this software.**

---

## 🤝 Contributing

This is a custom-built solution. For production use, consider:
- Adding authentication/rate limiting
- Implementing queue system for bulk downloads
- Using official TikTok API (if available for your region)
- Deploying backend to cloud (Vercel, Railway, etc.)

---

## 📝 License

**ISC** - Use at your own risk. No warranty provided.

---

## 🆘 Support

For issues or questions:
1. Check the **Troubleshooting** section
2. Review server console logs
3. Test with different TikTok profiles
4. Ensure your internet connection is stable

---

**Built with ❤️ for bulk TikTok video management**
