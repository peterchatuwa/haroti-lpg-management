# Namecheap DNS Setup for harotiholdingslimited.com

## Records to Add

### Record 1: Main Domain (A Record)
```
Type: A Record
Host: @
Value: 169.58.127.129
TTL: Automatic (or 3600)
```

### Record 2: WWW Subdomain (CNAME Record)
```
Type: CNAME Record
Host: www
Value: harotiholdingslimited.com
TTL: Automatic (or 3600)
```

---

## Visual Guide

### Adding the A Record:
1. Click "Add New Record" button
2. Select **"A Record"** from the Type dropdown
3. In the **Host** field, enter: `@`
4. In the **Value** field, enter: `169.58.127.129`
5. Leave TTL as **Automatic**
6. Click the **checkmark** ✓ to save

### Adding the CNAME Record:
1. Click "Add New Record" button again
2. Select **"CNAME Record"** from the Type dropdown
3. In the **Host** field, enter: `www`
4. In the **Value** field, enter: `harotiholdingslimited.com`
5. Leave TTL as **Automatic**
6. Click the **checkmark** ✓ to save

---

## Important Notes

### Remove Default Records (if present)
Namecheap often adds a default parking page record. You may need to:
- **Delete** any existing A Record with Host "@" pointing to a different IP
- **Delete** any existing CNAME with Host "www" pointing to parkingpage.namecheap.com

### Your Final DNS Table Should Look Like:
```
┌──────────┬──────┬─────────────────────────┬──────────┐
│ Type     │ Host │ Value                   │ TTL      │
├──────────┼──────┼─────────────────────────┼──────────┤
│ A Record │ @    │ 169.58.127.129          │ Automatic│
│ CNAME    │ www  │ harotiholdingslimited.com│ Automatic│
└──────────┴──────┴─────────────────────────┴──────────┘
```

---

## Verification

### After Saving:
1. Click "Save All Changes" (if there's a button)
2. Wait 5-15 minutes for initial propagation

### Test DNS Propagation:
Open Command Prompt/Terminal and run:
```bash
nslookup harotiholdingslimited.com
```

You should see: `Address: 169.58.127.129`

### Online Checker:
Visit: https://www.whatsmydns.net/#A/harotiholdingslimited.com

You should see green checkmarks showing `169.58.127.129` globally

---

## Timeline

- **5-15 minutes**: DNS starts working for most locations
- **30-60 minutes**: Fully propagated globally
- **Up to 24 hours**: Rare, but possible in some regions

---

## Once DNS Propagates

You'll be able to access:
- **Corporate Website**: https://harotiholdingslimited.com
- **Management System**: https://harotiholdingslimited.com/app
- **API Docs**: https://harotiholdingslimited.com/api/docs

---

## Troubleshooting

### "This site can't be reached"
- DNS hasn't propagated yet - wait longer
- Clear your browser cache
- Try incognito/private mode

### "Your connection is not private" (SSL error)
- This is normal if VPS isn't deployed yet
- Deploy first, then SSL will work automatically

### Still showing Namecheap parking page
- Delete the old parking page records
- Make sure you saved the new records
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

---

## Summary

**Only 2 records needed:**
1. ✅ A Record: @ → 169.58.127.129
2. ✅ CNAME: www → harotiholdingslimited.com

That's it! No subdomain records needed for /app access.
