/**
 * Abstraction for speech-to-text engines so we can swap Whisper or others.
 */
export interface SpeechToTextProvider {
  /**
   * Transcribes audio and returns plain text describing what the user said.
   *
   * This MVP version accepts an audio URL or path string; a real implementation
   * might accept streams or file buffers instead.
   */
  transcribe(audioUrlOrPath: string): Promise<string>;

  /**
   * Transcribes audio directly from a buffer.
   */
  transcribeBuffer?(audioBuffer: Buffer, mimeType: string): Promise<string>;
}

