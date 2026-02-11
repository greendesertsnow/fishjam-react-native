import express from 'express';
import { FishjamClient } from '@fishjam-cloud/js-server-sdk';
import GeminiIntegration from '@fishjam-cloud/js-server-sdk/gemini';
// @ts-ignore
import { Modality } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const fishjamClient = new FishjamClient({
  fishjamId: process.env.FISHJAM_ID!,
  managementToken: process.env.FISHJAM_MANAGEMENT_TOKEN!
});

const genAi = GeminiIntegration.createClient({
  apiKey: process.env.GOOGLE_API_KEY!,
});

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-native-audio-preview-12-2025';

app.post('/join-room', async (req, res) => {
  try {
    const { peerName } = req.body;

    // Create room
    const room = await fishjamClient.createRoom();
    console.log('Room created:', room.id);

    // Add peer
    const { peerToken } = await fishjamClient.createPeer(room.id, {
      metadata: { name: peerName },
    });

    // Create Agent
    const { agent } = await fishjamClient.createAgent(room.id, {
      subscribeMode: 'auto',
      output: GeminiIntegration.geminiInputAudioSettings,
    });

    // Create Agent Track for Gemini Output
    const agentTrack = agent.createTrack(GeminiIntegration.geminiOutputAudioSettings);

    // Connect to Gemini Live
    const session = await genAi.live.connect({
      model: GEMINI_MODEL,
      config: { 
        responseModalities: [Modality.AUDIO] 
      },
      callbacks: {
        // Google -> Fishjam
        onmessage: (msg: any) => {
          if (msg.data) {
            const pcmData = Buffer.from(msg.data, 'base64');
            agent.sendData(agentTrack.id, pcmData);
          }
          
          if (msg.serverContent?.interrupted) {
            console.log('Agent was interrupted by user.');
            agent.interruptTrack(agentTrack.id);
          }
        }
      }
    });

    // Fishjam -> Google
    agent.on('trackData', ({ data }) => {
      session.sendRealtimeInput({
        audio: {
          mimeType: GeminiIntegration.inputMimeType,
          data: Buffer.from(data).toString('base64'),
        }
      });
    });

    res.json({
      roomId: room.id,
      peerToken,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Fishjam backend running on port 3000');
});
