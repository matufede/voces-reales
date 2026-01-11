import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// PCM Audio helpers
function floatTo16BitPCM(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

function base64ToUint8Array(base64: string) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export class LiveClient {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async connect(onTranscription: (text: string, isUser: boolean) => void) {
    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log("Live Session Opened");
          this.startAudioStream(stream);
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Audio Output
          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData && this.outputContext) {
            this.playAudioChunk(audioData);
          }

          // Handle Transcriptions
          if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
             // Sometimes text comes in parts for display
          }
          
          if (message.serverContent?.outputTranscription?.text) {
             onTranscription(message.serverContent.outputTranscription.text, false);
          }
          if (message.serverContent?.inputTranscription?.text) {
             onTranscription(message.serverContent.inputTranscription.text, true);
          }
        },
        onclose: () => console.log("Live Session Closed"),
        onerror: (err) => console.error("Live Session Error", err),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        inputAudioTranscription: { model: "gemini-2.5-flash" },
        outputAudioTranscription: { model: "gemini-2.5-flash" },
        systemInstruction: "You are a helpful and charismatic AI podcast host. Speak Spanish fluently with a friendly tone."
      },
    });

    return this.sessionPromise;
  }

  private startAudioStream(stream: MediaStream) {
    if (!this.inputContext) return;
    
    const source = this.inputContext.createMediaStreamSource(stream);
    const processor = this.inputContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = floatTo16BitPCM(inputData);
      
      // Convert to base64
      let binary = '';
      const bytes = new Uint8Array(pcm16.buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64Data = window.btoa(binary);

      if (this.sessionPromise) {
        this.sessionPromise.then(session => {
          session.sendRealtimeInput({
            media: {
              mimeType: 'audio/pcm;rate=16000',
              data: b64Data
            }
          });
        });
      }
    };
    
    source.connect(processor);
    processor.connect(this.inputContext.destination);
  }

  private async playAudioChunk(base64Data: string) {
    if (!this.outputContext) return;

    const rawBytes = base64ToUint8Array(base64Data);
    
    // Decode manual PCM (16-bit, 24kHz, 1 channel)
    const dataInt16 = new Int16Array(rawBytes.buffer);
    const buffer = this.outputContext.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = this.outputContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputContext.destination);
    
    this.nextStartTime = Math.max(this.outputContext.currentTime, this.nextStartTime);
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
  }

  disconnect() {
    // Close session usually happens via session object, but here we just stop audio
    if (this.inputContext) this.inputContext.close();
    if (this.outputContext) this.outputContext.close();
    this.sources.forEach(s => s.stop());
  }
}
