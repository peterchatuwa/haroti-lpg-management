# 🎨 Logo Update Guide

## ✅ Current Status

**Logo Issue:** FIXED ✅

The website now displays a temporary SVG logo with your Haroti Gas brand colors:
- **Blue circle** background (#0047AB)
- **Orange flame** icon (#FF6B35)
- **"HAROTI" text** in blue
- **"Gas" text** in orange

**Location:** https://harotiholdingslimited.com/haroti-logo.svg

---

## 📸 To Upload Your Actual Logo

You have **3 options** to replace the temporary logo with your actual Haroti logo:

### Option 1: Upload via SCP (Recommended)

If you have the Haroti logo file on your computer:

```bash
# Replace the path with your logo file location
scp "C:\Path\To\Your\Haroti Logo.jpg" root@169.58.127.129:/tmp/haroti-logo.jpg

# Then SSH and convert/copy it
ssh root@169.58.127.129

# If it's a JPG/PNG, you can either:
# A) Use it directly (rename to .png)
cp /tmp/haroti-logo.jpg /opt/haroti-lpg/website/public/haroti-logo.png

# B) Or keep as SVG if you have an SVG version
cp /tmp/haroti-logo.svg /opt/haroti-lpg/website/public/haroti-logo.svg

# Rebuild and update
cd /opt/haroti-lpg/website
npm run build
rm -rf /opt/haroti-lpg/website-dist
cp -r dist /opt/haroti-lpg/website-dist
docker restart haroti-web
```

### Option 2: Direct File Replacement on VPS

```bash
# SSH into VPS
ssh root@169.58.127.129

# Navigate to website public folder
cd /opt/haroti-lpg/website/public

# Replace the logo (you can upload via any file transfer method)
# Then rebuild:
cd /opt/haroti-lpg/website
npm run build
rm -rf /opt/haroti-lpg/website-dist
cp -r dist /opt/haroti-lpg/website-dist
docker restart haroti-web
```

### Option 3: Use Web-Based File Manager

If you have a file manager tool installed on your VPS (like Webmin or similar), you can:
1. Navigate to `/opt/haroti-lpg/website/public/`
2. Upload your logo file as `haroti-logo.png` or `haroti-logo.svg`
3. Run the rebuild commands

---

## 🔄 Quick Logo Update Commands

Once you've uploaded your logo file to the VPS:

```bash
ssh root@169.58.127.129

# Go to website directory
cd /opt/haroti-lpg/website

# Rebuild website
npm run build

# Update deployed files
rm -rf /opt/haroti-lpg/website-dist
cp -r dist /opt/haroti-lpg/website-dist

# Restart web container
docker restart haroti-web

# Wait 3 seconds
sleep 3

# Clear browser cache and reload website
echo "✅ Logo updated! Clear your browser cache and refresh"
```

---

## 📏 Logo Specifications

For best results, your logo file should be:

### Dimensions
- **Recommended:** 200px width × 60px height (or similar aspect ratio)
- **Minimum:** 150px width
- **Maximum:** 400px width
- **Format:** PNG (transparent background) or SVG (vector)

### File Size
- **Recommended:** < 100 KB
- **Maximum:** < 500 KB

### File Formats Supported
- **.svg** - Best quality, scalable (recommended)
- **.png** - Good quality, supports transparency
- **.jpg** - Acceptable, but no transparency

---

## 🎨 Current Brand Colors

The website uses these Haroti Gas brand colors throughout:

| Element | Color | Hex Code |
|---------|-------|----------|
| Primary (Blue) | Haroti Blue | `#0047AB` |
| Accent (Orange) | Haroti Orange | `#FF6B35` |
| Success (Green) | Haroti Green | `#28A745` |
| Text/Secondary | Haroti Gray | `#6C757D` |

Your logo should ideally incorporate these colors for brand consistency.

---

## 🔍 Verifying the Logo

After updating:

1. **Clear browser cache:** Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
2. **Hard refresh:** Ctrl+F5 (Cmd+Shift+R on Mac)
3. **Visit:** https://harotiholdingslimited.com
4. **Check:** Logo should appear in the header (top left)
5. **Check:** Logo should also appear in the footer

The logo appears in **2 locations**:
- Header (top navigation bar)
- Footer (bottom of page)

---

## 🐛 Troubleshooting

### Logo not showing after update?

1. **Clear browser cache completely**
   ```
   Chrome: Settings → Privacy → Clear browsing data
   Firefox: Settings → Privacy → Clear Data
   ```

2. **Hard refresh the page**
   - Windows/Linux: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

3. **Try incognito/private mode**
   - This bypasses cache entirely

4. **Check file was uploaded**
   ```bash
   ssh root@169.58.127.129
   ls -la /opt/haroti-lpg/website/public/haroti-logo.*
   ```

5. **Check file is in website dist**
   ```bash
   docker exec haroti-web ls -la /usr/share/nginx/html/website/haroti-logo.*
   ```

6. **Verify it's accessible**
   ```bash
   curl -I https://harotiholdingslimited.com/haroti-logo.svg
   # Should return: HTTP/2 200
   ```

---

## 💡 Need Help?

If you need help uploading your logo:

1. Share the logo file
2. Tell me the file format (JPG, PNG, SVG)
3. I can guide you through the upload process

Or simply send me the logo image and I can integrate it for you!

---

## 📝 Notes

**Current Temporary Logo:**
- Created as placeholder with brand colors
- Shows "HAROTI Gas" text with flame icon
- Blue and orange color scheme
- Will be replaced with actual logo once uploaded

**File Location on VPS:**
- Source: `/opt/haroti-lpg/website/public/haroti-logo.svg`
- Deployed: `/usr/share/nginx/html/website/haroti-logo.svg` (inside Docker container)
- Public URL: `https://harotiholdingslimited.com/haroti-logo.svg`

---

*Last Updated: August 6, 2026 - 4:25 AM UTC*
