# PakPlay Mobile - React Native Expo App

**Where Pakistan Plays — Mobile Edition**

This is the standalone React Native mobile application for the PakPlay platform, built with Expo. It mirrors the functionality of the Next.js web app while being optimized for mobile devices.

---

## 📱 Project Overview

PakPlay Mobile is a **completely separate** project from the Next.js web application. It connects to the same Supabase backend and provides all user-facing features on mobile platforms (iOS & Android).

### Key Features

#### 🎯 User Features
- ✅ Browse sports venues with filters (location, sport type, price)
- ✅ View detailed venue information with photos, reviews, amenities
- ✅ Book venues via WhatsApp integration
- ✅ Submit and view venue reviews
- ✅ Special offers and deals
- ✅ User authentication (Sign Up / Sign In)
- ✅ Profile management
- ✅ Search venues by name and location

#### 🏢 Venue Owner Features
- ✅ Owner dashboard with stats
- ✅ Manage multiple venues
- ✅ View and manage bookings
- ✅ Analytics and insights
- ✅ Venue editing and photo management
- ✅ Special offers management

#### ❌ NOT Included
- ❌ Admin features (web-only)

---

## 🎨 Design & Branding

### Color Theme (Matching Web App)
```javascript
Primary (Sunset Orange): #FF6B35
Secondary (Midnight Blue): #1E3A8A
Accent (Lime Green): #A7F432
Background: #F8F9FA
Foreground: #212121
```

### Typography
- Primary Font: System Default (San Francisco iOS / Roboto Android)
- Font Sizes: 12px to 32px
- Font Weights: Regular (400), Medium (500), Semibold (600), Bold (700)

---

## 🏗️ Project Structure

```
pakplay-mobile/
├── assets/                      # App icons, splash screens, images
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── config/
│   │   └── supabase.ts         # Supabase client configuration
│   ├── constants/
│   │   └── theme.ts            # Colors, spacing, fonts
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state management
│   ├── navigation/
│   │   ├── RootNavigator.tsx   # Root navigation (Auth + Main)
│   │   ├── MainTabNavigator.tsx    # Bottom tabs for users
│   │   └── OwnerTabNavigator.tsx   # Bottom tabs for owners
│   ├── screens/
│   │   ├── auth/               # Sign In, Sign Up
│   │   ├── home/               # Home screen with stats
│   │   ├── venues/             # Browse & detail screens
│   │   ├── offers/             # Special offers
│   │   ├── owner/              # Owner dashboard & management
│   │   ├── profile/            # User profile settings
│   │   └── more/               # More options menu
│   └── types/
│       └── supabase.ts         # TypeScript types for database
├── App.tsx                     # Root component
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js 18+** and npm
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go** app on your phone (for testing)
- **Supabase account** (same as web app)

### Step 1: Install Dependencies

```bash
cd pakplay-mobile
npm install
```

### Step 2: Environment Configuration

1. Copy `ENV_TEMPLATE.txt` to create a `.env` file:
```bash
cp ENV_TEMPLATE.txt .env
```

2. Edit `.env` with your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Important:** Use the **SAME** Supabase credentials as your Next.js web app!

### Step 3: Start Development Server

```bash
npm start
```

This will open Expo DevTools in your browser.

### Step 4: Run on Device

#### Option 1: Physical Device (Recommended)
1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Scan the QR code from Expo DevTools
3. App will load on your device

#### Option 2: iOS Simulator (Mac only)
```bash
npm run ios
```

#### Option 3: Android Emulator
```bash
npm run android
```

---

## 🔧 Backend Integration

### Supabase Setup

The mobile app uses the **exact same Supabase database** as the web application.

#### Database Tables Used:
- `venues` - Venue listings
- `venue_photos` - Venue images
- `venue_reviews` - Customer reviews
- `bookings` - Booking records
- `profiles` - User profiles
- `special_offers` - Special deals
- `contact_submissions` - Contact form submissions

#### Authentication:
- Email/Password authentication via Supabase Auth
- Session stored securely using AsyncStorage
- Automatic token refresh

#### Storage:
- Venue photos stored in Supabase Storage
- Review photos uploaded to Storage bucket

> **No Backend Changes Required** - The app connects to existing backend infrastructure.

---

## 🚀 Key Features Implementation

### 1. Authentication Flow
```typescript
// Context-based authentication
import { useAuth } from './contexts/AuthContext';

const { user, signIn, signUp, signOut } = useAuth();
```

- Sign In / Sign Up screens
- Role-based navigation (User vs Venue Owner)
- Persistent sessions using AsyncStorage

### 2. Navigation Structure

```
RootNavigator (Stack)
├── AuthStack
│   ├── SignIn
│   └── SignUp
├── MainTabs (for regular users)
│   ├── Home
│   ├── Venues
│   ├── Offers
│   └── More
└── OwnerTabs (for venue owners)
    ├── Dashboard
    ├── My Venues
    ├── Bookings
    └── More
```

### 3. Data Fetching Pattern
```typescript
// Example: Fetch venues
const { data, error } = await supabase
  .from('venues')
  .select('*, venue_photos(*)')
  .eq('status', 'approved')
  .order('created_at', { ascending: false });
```

### 4. WhatsApp Booking Integration
```typescript
// Open WhatsApp with pre-filled message
import { Linking } from 'react-native';

const whatsappUrl = `https://wa.me/${venuePhone}?text=${encodedMessage}`;
Linking.openURL(whatsappUrl);
```

---

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` file
   - Use Expo's secure storage for sensitive data

2. **API Keys**
   - Supabase Anon Key is safe for client-side use
   - Row-Level Security (RLS) policies protect data

3. **Authentication**
   - Sessions stored in AsyncStorage (encrypted on iOS)
   - Automatic token refresh

---

## 📱 Platform-Specific Considerations

### iOS
- Uses SafeAreaView for notch handling
- Native date/time pickers
- System fonts (San Francisco)

### Android
- Material Design guidelines followed
- Back button navigation handled
- System fonts (Roboto)

---

## 🧪 Testing

```bash
# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android

# Web preview (limited functionality)
npm run web
```

---

## 📦 Build for Production

### iOS (TestFlight / App Store)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure build
eas build:configure

# Build iOS app
eas build --platform ios
```

### Android (Google Play Store)

```bash
# Build Android app
eas build --platform android
```

---

## 🚧 Screens Implementation Status

### ✅ Completed
- [x] Sign In Screen
- [x] Sign Up Screen
- [x] Home Screen (with stats and featured venues)
- [x] More Screen (menu)
- [x] Auth Context & Navigation

### 🟡 Partial Implementation
- [ ] Venues Browse Screen (needs filters implementation)
- [ ] Venue Detail Screen (needs booking form)
- [ ] Owner Dashboard (needs charts/analytics)
- [ ] Owner Venues Management
- [ ] Owner Bookings View

### ❌ TODO
- [ ] Offers Screen (full implementation)
- [ ] Profile Screen (edit profile)
- [ ] Review Submission
- [ ] Venue Photo Gallery
- [ ] Search & Filters
- [ ] Push Notifications
- [ ] Deep Linking

---

## 🔄 Web App Parity

| Feature | Web App | Mobile App | Status |
|---------|---------|------------|--------|
| Authentication | ✅ | ✅ | Complete |
| Browse Venues | ✅ | 🟡 | Partial |
| Venue Detail | ✅ | 🟡 | Partial |
| WhatsApp Booking | ✅ | ✅ | Complete |
| Reviews | ✅ | ❌ | TODO |
| Special Offers | ✅ | ❌ | TODO |
| Owner Dashboard | ✅ | 🟡 | Partial |
| Admin Panel | ✅ | ❌ | Not Planned |

---

## 🛠️ Development Workflow

### Adding a New Screen

1. Create screen file: `src/screens/category/ScreenName.tsx`
2. Add to navigation: Update `RootNavigator.tsx` or tab navigators
3. Create types: Add to navigation param lists
4. Test on both iOS and Android

### Adding API Calls

1. Import supabase client: `import { supabase } from '@/config/supabase';`
2. Use async/await pattern
3. Handle errors properly
4. Show loading states

### Styling Guidelines

- Use theme constants from `src/constants/theme.ts`
- Follow React Native StyleSheet patterns
- Use flexbox for layouts
- Test on multiple screen sizes

---

## 🐛 Common Issues & Solutions

### Issue: App not connecting to Supabase
**Solution:** Check `.env` file exists and has correct URLs

### Issue: White screen on launch
**Solution:** Clear cache: `expo start -c`

### Issue: Image picker not working
**Solution:** Add permissions to `app.json`:
```json
"expo": {
  "permissions": ["CAMERA", "MEDIA_LIBRARY"]
}
```

---

## 📚 Dependencies

### Core
- **expo** - Managed React Native platform
- **react-navigation** - Navigation library
- **@supabase/supabase-js** - Backend client
- **@react-native-async-storage/async-storage** - Local storage

### UI & UX
- **@expo/vector-icons** - Icons
- **expo-image-picker** - Photo uploads
- **react-native-gesture-handler** - Gestures
- **react-native-reanimated** - Animations

### Utilities
- **date-fns** - Date formatting
- **expo-linking** - Deep linking & URL schemes

---

## 🤝 Contributing

### Code Style
- Use TypeScript for all new files
- Follow React hooks best practices
- Keep components small and focused
- Write meaningful commit messages

### Pull Request Process
1. Create feature branch
2. Test on iOS and Android
3. Update README if needed
4. Submit PR with description

---

## 📄 License

This project is private and proprietary to PakPlay.

---

## 📞 Support

For questions or issues:
- Check the web app documentation in `../pakplay-next/README.md`
- Review Expo documentation: [docs.expo.dev](https://docs.expo.dev)
- Review Supabase docs: [supabase.com/docs](https://supabase.com/docs)

---

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Project setup and configuration
- [x] Authentication implementation
- [x] Basic navigation structure
- [x] Home screen with stats
- [ ] Complete venue browsing

### Phase 2
- [ ] Full venue detail with booking
- [ ] Review submission and display
- [ ] Owner dashboard completion
- [ ] Venue management features

### Phase 3
- [ ] Push notifications
- [ ] In-app chat
- [ ] Payment integration
- [ ] Advanced filters
- [ ] Favorites system

---

**Made with ❤️ in Pakistan**

**PakPlay Mobile** - Connecting Sports Enthusiasts with Quality Venues
