# fishjam-react-native

A React Native application integrated with Fishjam for video calls and Gemini Live for AI interactions.

## Audio Quality Note
> [!IMPORTANT]
> Audio may appear choppy when running in an iOS or Android simulator due to virtualized audio driver limitations and lack of hardware Acoustic Echo Cancellation (AEC).
> This has been tested on a real Android device, where the audio is flowing smoothly and echo cancellation is functional.

## Project Structure
- `expo/`: The React Native Expo application.
- `backend/`: Node.js Express server handling Fishjam room orchestration and Gemini Live integration.

## Getting Started
### Backend
1. `cd backend`
2. `npm install`
3. Create `.env` from `.env.example`
4. `npm run dev`

### Mobile App
1. `cd expo`
2. `npm install`
3. Create `.env` from `.env.example`
4. `npx expo run:ios` or `npx expo run:android`
