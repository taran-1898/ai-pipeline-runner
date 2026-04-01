"use client";

import { useState, useRef } from "react";
import { sendVoice } from "../lib/api";

type VoiceResult = {
  transcript: string;
  pipelineGenerated: boolean;
  runId?: string | null;
};

export function AudioUpload({ onResult }: { onResult?: (r: VoiceResult) => void }) {
  const [status, setStatus] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // iOS Safari falls back to audio/mp4; find first supported
      const mimeType =
        ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(
          (m) => MediaRecorder.isTypeSupported(m)
        ) ?? "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        setStatus("Recording ready — tap Send to transcribe.");
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setStatus("Recording…");
      setAudioUrl(null);
      setAudioBlob(null);
    } catch (err: any) {
      setStatus(`Mic denied: ${err.message}`);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudioBlob(f);
    setAudioUrl(URL.createObjectURL(f));
    setStatus("File selected — tap Send.");
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setStatus("Uploading & transcribing…");

    try {
      const ext = audioBlob.type.includes("mp4")
        ? "m4a"
        : audioBlob.type.includes("ogg")
        ? "ogg"
        : "webm";
      const fd = new FormData();
      fd.append("file", audioBlob, `recording.${ext}`);

      const result = await sendVoice(fd);
      const msg = result.pipelineGenerated
        ? `✓ Pipeline started! Run ID: ${result.runId}`
        : `✓ Transcript: ${result.transcript}`;
      setStatus(msg);
      onResult?.(result);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Mic button */}
        <button
          type="button"
          onClick={toggleRecording}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            isRecording
              ? "bg-red-600 hover:bg-red-500 animate-pulse"
              : "bg-slate-700 hover:bg-slate-600"
          }`}
        >
          {isRecording ? "⏹ Stop" : "🎙 Record"}
        </button>

        {/* File picker fallback — useful on iOS where mic may be unavailable */}
        <label className="px-3 py-1 rounded text-sm bg-slate-700 hover:bg-slate-600 cursor-pointer">
          📂 File
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Send button */}
        {audioBlob && (
          <button
            type="button"
            onClick={handleSend}
            className="px-3 py-1 rounded text-sm bg-sky-600 hover:bg-sky-500"
          >
            Send ↗
          </button>
        )}
      </div>

      {/* Audio preview */}
      {audioUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio controls src={audioUrl} className="w-full max-h-12 rounded" />
      )}

      {status && <div className="text-xs text-slate-400 whitespace-pre-wrap">{status}</div>}
    </div>
  );
}
