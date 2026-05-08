// Simple CSV parser for email/calendar exports
export function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = parseLine(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }

  return records;
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Simple JSON parser with error handling
export function safeJSONParse<T>(content: string, defaultValue: T): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

// Estimate audio duration from file size (rough approximation)
export function estimateAudioDuration(fileSizeBytes: number, sampleRate = 16000, bitsPerSample = 16, channels = 1): number {
  const bytesPerSecond = (sampleRate * bitsPerSample * channels) / 8;
  return fileSizeBytes / bytesPerSecond;
}

// Format time in seconds to MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
