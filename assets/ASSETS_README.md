# 📱 Assets Folder

This folder should contain your app's icons and splash screens.

## Required Assets

### 1. **icon.png** (1024x1024px)
- Main app icon
- Square, PNG format
- Recommended: Use your PakPlay logo on #FF6B35 background

### 2. **adaptive-icon.png** (1024x1024px)
- Android adaptive icon
- Should have safe area in center (66% of dimensions)
- Background color: #FF6B35

### 3. **splash.png** (1284x2778px for iOS)
- Splash screen image
- Centered logo/branding
- Background: #FF6B35

### 4. **favicon.png** (48x48px)
- Web favicon
- Optional for mobile-only apps

## Quick Fix: Use Expo Default Assets

**Option 1: Generate from logo**

If you have a logo, use an online tool:
- https://easyappicon.com/
- https://makeappicon.com/
- https://appicon.co/

**Option 2: Use Expo's asset tool**

```bash
npx expo prebuild --clean
```

This will generate default assets.

**Option 3: Temporarily disable custom icons**

See the temporary app.json configuration below.

## 🎨 Brand Colors

Use these colors for consistency:
- Primary: `#FF6B35`
- Background: `#FFFFFF`
- Logo should match the web app branding

## 📐 Specifications

| Asset | Dimensions | Format | Notes |
|-------|-----------|--------|-------|
| icon.png | 1024x1024 | PNG | Required |
| adaptive-icon.png | 1024x1024 | PNG | Android only |
| splash.png | 1284x2778 | PNG | Scales down |
| favicon.png | 48x48 | PNG | Web only |

## 🚀 After Adding Assets

1. Place your images in this `assets/` folder
2. Run `npx expo start --clear`
3. Test on both iOS and Android

## 📝 Notes

- For now, placeholder files have been created
- Replace them with actual branded assets ASAP
- You can copy logo from Next.js project: `../pakplay-next/src/assets/pp logo.png`
