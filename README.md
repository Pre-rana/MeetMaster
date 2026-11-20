# MeetMaster

AI-powered meeting script intelligence app with the help of JavaScript Expo. Built to run on an Android phone through **Expo Go** (no Android Studio required).

## PowerShell setup

Run these from the project folder. Skip `create-expo-app` if this repo already exists.

```powershell
cd C:\Users\prera\OneDrive\Desktop\Aditi\Coding\MeetMaster

# Only if starting from an empty folder:
npx create-expo-app@latest . --template blank --yes

npx expo install expo-audio expo-file-system expo-document-picker expo-print expo-sharing expo-notifications expo-constants @react-native-async-storage/async-storage @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context

Copy-Item .env.example .env
notepad .env
```

Put a Gemini API key in `.env`:

```
EXPO_PUBLIC_GEMINI_API_KEY=your_real_key
```

Start Expo Go:

```powershell
npx expo start
```

Scan the QR code with Expo Go on Android. After changing `.env`, stop Metro (`Ctrl+C`) and start it again so the key is inlined.

## Demo path for viva

1. Leave **Offline Demo Mode** on. Dashboard already contains two sample meetings with transcripts, decisions, and tasks.
2. Toggle Pending/Completed, mark a task done, tap a meeting.
3. On a sample meeting, ask Q&A such as `Who owns what?` (needs Gemini key) and export the PDF.
4. Record a short clip or pick an audio file, then **Process with Gemini**.

## Expo Go pitfalls checklist

- **Microphone:** Expo Go will prompt on first record. If denied, enable Camera/Microphone for Expo Go in Android Settings.
- **Gemini key:** `process.env.EXPO_PUBLIC_GEMINI_API_KEY` is bundled at start time. Restart Metro after editing `.env`. Demo screens still work without a key.
- **Audio format:** Expo Go recordings are usually `.m4a`. If Gemini rejects a picked file, try a short MP3/WAV/M4A clip.
- **Notifications:** Android 13+ needs the notification permission. Expo Go can show local reminders; they are not as reliable as a custom dev build. Verify by creating a live meeting whose task deadline is a few minutes in the future.
- **PDF share sheet:** `expo-print` writes a temp PDF, `expo-sharing` opens the system share UI. If sharing is unavailable, the app shows an alert.
- **Document picker:** Use **Pick sample audio clip** if the examiner does not want a live recording.
- **Cache vs documents:** Recordings are stored under the app document directory so Android is less likely to delete them mid-demo.
- **Same Wi-Fi:** Phone and PC must see the same network, or use Expo tunnel (`npx expo start --tunnel`) if campus LAN blocks Metro.
