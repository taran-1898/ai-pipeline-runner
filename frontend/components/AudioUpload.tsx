"use client";

import { useState } from "react";

export function AudioUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/uploads", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      setStatus(`Upload failed: ${res.status}`);
    } else {
      setStatus("Uploaded");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
      <button
        type="submit"
        className="px-3 py-1 rounded bg-sky-600 text-sm hover:bg-sky-500 disabled:opacity-50"
        disabled={!file}
      >
        Upload audio
      </button>
      {status && <div className="text-xs text-slate-400">{status}</div>}
    </form>
  );
}

