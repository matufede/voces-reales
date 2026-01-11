
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceSettings } from "../types";

const API_KEY = process.env.API_KEY || '';

/**
 * Uses Gemini TTS to generate audio (Single Voice)
 */
export const generateAudioProduction = async (
  text: string,
  voiceSettings: VoiceSettings
): Promise<string> => {
  if (!API_KEY) throw new Error("API Key faltante");

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const modelId = "gemini-2.5-flash-preview-tts";

  // Configuration for TTS
  let config: any = {
    responseModalities: [Modality.AUDIO],
  };

  let promptText = text;

  // Helper to parse voice ID and style instructions
  const getVoiceConfig = (vSettings: VoiceSettings) => {
    let cleanVoiceId = vSettings.voiceId;
    let styleInstruction = "";

    // Handle composite IDs for accents (e.g. Charon-Arg)
    if (cleanVoiceId.includes('-Arg')) {
      cleanVoiceId = cleanVoiceId.split('-')[0];
      styleInstruction = "(Habla con un marcado acento argentino rioplatense, usando 'vos' y entonación típica) ";
    }

    // Handle explicit style selection
    if (vSettings.style !== 'Natural') {
      if (vSettings.style === 'Argentino') {
        styleInstruction += "(Habla con acento argentino) ";
      } else if (vSettings.style === 'Infantil') {
        styleInstruction += "(Habla con voz de niño pequeño, con tono inocente, alegre y mucha energía) ";
      } else {
        styleInstruction += `(Habla con tono ${vSettings.style}) `;
      }
    }

    // Handle Speed (Translating number to prompt instruction)
    if (vSettings.speed !== 1.0) {
      if (vSettings.speed <= 0.7) {
        styleInstruction += "(Habla muy despacio, arrastrando las palabras y haciendo pausas largas) ";
      } else if (vSettings.speed < 1.0) {
        styleInstruction += "(Habla un poco más lento y pausado de lo normal) ";
      } else if (vSettings.speed >= 1.6) {
        styleInstruction += "(Habla extremadamente rápido y acelerado) ";
      } else if (vSettings.speed > 1.0) {
        styleInstruction += "(Habla rápido y dinámico) ";
      }
    }

    // Handle Pitch (Translating number to prompt instruction)
    if (vSettings.pitch !== 0) {
      if (vSettings.pitch <= -5) {
        styleInstruction += "(Usa un tono de voz muy grave, profundo y resonante) ";
      } else if (vSettings.pitch < 0) {
        styleInstruction += "(Usa un tono de voz ligeramente más grave) ";
      } else if (vSettings.pitch >= 5) {
        styleInstruction += "(Usa un tono de voz muy agudo y fino) ";
      } else if (vSettings.pitch > 0) {
        styleInstruction += "(Usa un tono de voz ligeramente más agudo) ";
      }
    }

    return { cleanVoiceId, styleInstruction };
  };

  const { cleanVoiceId, styleInstruction } = getVoiceConfig(voiceSettings);
  
  if (styleInstruction) {
    // We prepend the instructions to the text so the model processes "how" to say it before "what" to say.
    promptText = `${styleInstruction} ${text}`;
  }

  config.speechConfig = {
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: cleanVoiceId }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: [{ text: promptText }] }],
      config: config
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received from Gemini.");
    }
    
    return base64Audio;
  } catch (error) {
    console.error("TTS Generation Error:", error);
    throw error;
  }
};

// Helper to convert raw PCM base64 to a playable Blob URL (WAV)
export const pcmToWav = (base64PCM: string, sampleRate: number = 24000): string => {
  // Clean the string to remove any whitespace that might break atob
  const cleanBase64 = base64PCM.replace(/\s/g, '');
  const binaryString = window.atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = bytes.length;

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const wavBytes = new Uint8Array(wavHeader.byteLength + bytes.byteLength);
  wavBytes.set(new Uint8Array(wavHeader), 0);
  wavBytes.set(bytes, wavHeader.byteLength);

  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

// Calculate duration from PCM Base64 without creating a blob
export const getDurationFromBase64PCM = (base64PCM: string, sampleRate: number = 24000): number => {
  const cleanBase64 = base64PCM.replace(/\s/g, '');
  const binaryString = window.atob(cleanBase64);
  const bytesLength = binaryString.length;
  
  // 16-bit audio = 2 bytes per sample
  const numSamples = bytesLength / 2;
  const durationSeconds = numSamples / sampleRate;
  
  return durationSeconds;
};

// --- Subtitle Helpers ---

// Helper to split script into timed segments
const getScriptSegments = (script: string) => {
  // 1. Clean script of acting tags
  const cleanScript = script.replace(/\[.*?\]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // 2. Split into segments (sentences or chunks of max 60 chars)
  const sentences = cleanScript.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanScript];
  const segments: string[] = [];
  
  sentences.forEach(sentence => {
    if (sentence.length > 60) {
      // Split long sentences by comma or space
      const parts = sentence.match(/.{1,60}(?:,|$|\s)/g) || [sentence];
      segments.push(...parts.map(p => p.trim()));
    } else {
      segments.push(sentence.trim());
    }
  });

  const totalChars = segments.reduce((acc, seg) => acc + seg.length, 0);
  return { segments, totalChars };
};

// Generate SRT (SubRip Subtitle)
export const generateSRTFile = (script: string, durationInSeconds: number): string => {
  const formatTimeSRT = (seconds: number) => {
    const date = new Date(0);
    date.setMilliseconds(seconds * 1000);
    const hh = date.getUTCHours().toString().padStart(2, '0');
    const mm = date.getUTCMinutes().toString().padStart(2, '0');
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    return `${hh}:${mm}:${ss},${ms}`; // Comma for ms, full HH:MM:SS
  };

  const { segments, totalChars } = getScriptSegments(script);
  let currentTime = 0;
  let srtContent = "";

  segments.forEach((segment, index) => {
    if (!segment) return;
    const segmentDuration = totalChars > 0 ? (segment.length / totalChars) * durationInSeconds : durationInSeconds;
    const startTime = currentTime;
    const endTime = currentTime + segmentDuration;

    srtContent += `${index + 1}\n`;
    srtContent += `${formatTimeSRT(startTime)} --> ${formatTimeSRT(endTime)}\n`;
    srtContent += `${segment}\n\n`;

    currentTime = endTime;
  });

  const blob = new Blob([srtContent], { type: 'text/plain' });
  return URL.createObjectURL(blob);
};
