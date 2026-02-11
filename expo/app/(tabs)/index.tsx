import React, { useState } from 'react';
import { StyleSheet, View, Text, Button, ScrollView, Platform } from 'react-native';
import { useConnection, useSandbox, useInitializeDevices, useCamera, usePeers, RTCView } from '@fishjam-cloud/react-native-client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

function VideoPlayer({ stream }: { stream: MediaStream | null | undefined }) {
  if (!stream) {
    return (
      <View style={styles.videoPlaceholder}>
        <Text style={{ color: 'white' }}>No video</Text>
      </View>
    );
  }
  return (
    <RTCView mediaStream={stream} style={styles.video} objectFit="cover" />
  );
}

export default function HomeScreen() {
  const { joinRoom, peerStatus } = useConnection();
  const { cameraStream } = useCamera();
  const { remotePeers } = usePeers();
  const { initializeDevices } = useInitializeDevices();
  const { getSandboxPeerToken } = useSandbox();
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = async () => {
    try {
      const roomName = "testRoom";
      const peerName = `user_${Date.now()}`;

      // Initialize devices first
      await initializeDevices();

      // In sandbox environment, you can get the peer token from our sandbox API
      // const peerToken = await getSandboxPeerToken(roomName, peerName);
      
      // Connect to local backend instead for Gemini integration
      // Use your computer's local IP address
      const API_URL = 'http://192.168.0.13:3000'; 
      console.log(`Fetching token from ${API_URL}/join-room`);
      
      const response = await fetch(`${API_URL}/join-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          peerName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      const { peerToken } = data;

      console.log("Got token from backend:", peerToken?.substring(0, 10) + "...");

      if (!peerToken) {
        throw new Error("Received empty peer token from backend");
      }

      console.log("Attempting to join Fishjam room...");
      try {
        await joinRoom({ peerToken });
        console.log("Successfully joined room!");
        setIsJoined(true);
      } catch (connectionError) {
        console.error("Error calling joinRoom:", connectionError);
        throw connectionError;
      }
    } catch (error) {
      console.error("Failed to join room (main catch):", error);
      alert(`Failed to join room: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Fishjam Video Call</ThemedText>
        <ThemedText style={styles.status}>Status: {peerStatus}</ThemedText>
      </ThemedView>

      {!isJoined && <Button title="Join Room" onPress={handleJoin} />}

      {cameraStream && (
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Your Video</ThemedText>
          <VideoPlayer stream={cameraStream} />
        </View>
      )}

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Other Participants</ThemedText>
        {remotePeers.length === 0 ? (
          <ThemedText>No other participants</ThemedText>
        ) : (
          remotePeers.map((peer) => (
            <View key={peer.id} style={styles.participant}>
              <ThemedText>{(peer.metadata as any)?.name || peer.id}</ThemedText>
              {peer.cameraTrack?.stream && (
                <VideoPlayer stream={peer.cameraTrack.stream} />
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  participant: {
    marginBottom: 10,
  },
  video: {
    height: 200,
    width: "100%",
    borderRadius: 8,
  },
  videoPlaceholder: {
    height: 200,
    width: "100%",
    backgroundColor: "#000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
