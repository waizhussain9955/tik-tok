# ⚡ QUICK START GUIDE

## ✅ How to Use the TikTok Downloader

### Follow These Steps:

1. **Make sure the server is running:**
   ```bash
   npm start
   ```
   You should see: `Server running at http://localhost:3000`

2. **Open the app in your browser:**
   - **✅ CORRECT:** Open `http://localhost:3000`
   - **❌ WRONG:** Don't use Live Server (port 5500) or open the HTML file directly

3. **Enter a TikTok profile:**
   - Full URL: `https://www.tiktok.com/@ajmal_raza143`
   - Or just username: `ajmal_raza143`
   - Or with @: `@ajmal_raza143`

4. **Click "Fetch Videos"** and wait for the grid to load

5. **Click "HD Download"** below any video to save it to your device

---

## 🔧 Troubleshooting

### Problem: "404 Not Found" or "Host validation failed"
**Solution:** You're accessing the wrong port!
- Close Live Server (if running)
- Make sure you go to `http://localhost:3000` (NOT port 5500)

### Problem: "No videos found"
**Solutions:**
- Try a different TikTok profile (some accounts block scrapers)
- Test with popular accounts: `@willsmith`, `@khaby.lame`, `@therock`
- Check if the profile is public and has videos

### Problem: Server won't start
```bash
# Kill any process on port 3000
npx kill-port 3000

# Then restart
npm start
```

---

## 📝 Important Notes

1. **Always access via `localhost:3000`** - The Node.js server serves both the frontend AND handles API requests

2. **TikTok blocks automated access** - Not all profiles will work due to anti-bot measures

3. **Download URLs expire quickly** - If a download fails, re-fetch the profile

4. **Test with popular public accounts first** before trying specific profiles

---

## 🎯 Working Example

```
1. Open Chrome/Firefox
2. Go to: http://localhost:3000
3. Type: @willsmith
4. Click: Fetch Videos
5. Wait for grid to appear
6. Click: HD Download on any video
```

---

**Need help? Check the main README.md for detailed documentation!**
