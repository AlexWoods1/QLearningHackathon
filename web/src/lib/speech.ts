export const SPEECH_LOCALE: Record<string, string> = {
  spanish: "es-ES",
  english: "en-US",
  french: "fr-FR",
  german: "de-DE",
  italian: "it-IT",
  portuguese: "pt-BR",
  japanese: "ja-JP",
  chinese: "zh-CN",
  korean: "ko-KR",
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export type RecognizerOptions = {
  /** When true, restart after the engine ends (used with non-continuous mobile mode). */
  shouldRestart?: () => boolean;
};

function isMobileUa(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/** Merge overlapping speech chunks phones often re-deliver. */
export function mergeTranscript(prev: string, next: string): string {
  const p = prev.trim().replace(/\s+/g, " ");
  const n = next.trim().replace(/\s+/g, " ");
  if (!n) return p;
  if (!p) return n;

  const pLower = p.toLowerCase();
  const nLower = n.toLowerCase();

  if (nLower === pLower || pLower.endsWith(nLower)) return p;
  if (nLower.startsWith(pLower) || nLower.includes(pLower)) return n;
  if (pLower.includes(nLower)) return p;

  const pWords = p.split(" ");
  const nWords = n.split(" ");
  const maxOverlap = Math.min(pWords.length, nWords.length);
  for (let k = maxOverlap; k > 0; k -= 1) {
    const suffix = pWords.slice(-k).join(" ").toLowerCase();
    const prefix = nWords.slice(0, k).join(" ").toLowerCase();
    if (suffix === prefix) {
      return [...pWords, ...nWords.slice(k)].join(" ");
    }
  }

  return `${p} ${n}`;
}

/** Drop immediate repeated words/phrases ("comida comida", "mi comida mi comida"). */
export function collapseRepeatedSpeech(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words.join(" ");

  const out: string[] = [];
  for (const word of words) {
    if (
      out.length > 0 &&
      out[out.length - 1].toLowerCase() === word.toLowerCase()
    ) {
      continue;
    }
    out.push(word);
  }

  // Collapse repeated 2–4 word phrases: "mi comida mi comida favorita"
  for (let size = 4; size >= 2; size -= 1) {
    let i = 0;
    const collapsed: string[] = [];
    while (i < out.length) {
      if (i + size * 2 <= out.length) {
        const a = out
          .slice(i, i + size)
          .join(" ")
          .toLowerCase();
        const b = out
          .slice(i + size, i + size * 2)
          .join(" ")
          .toLowerCase();
        if (a === b) {
          collapsed.push(...out.slice(i, i + size));
          i += size * 2;
          while (
            i + size <= out.length &&
            out
              .slice(i, i + size)
              .join(" ")
              .toLowerCase() === a
          ) {
            i += size;
          }
          continue;
        }
      }
      collapsed.push(out[i]);
      i += 1;
    }
    out.length = 0;
    out.push(...collapsed);
  }

  return out.join(" ");
}

export function speechSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as SpeechWindow;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function createRecognizer(
  language: string,
  onPartial: (text: string) => void,
  onFinal: (text: string) => void,
  onError: (message: string) => void,
  options: RecognizerOptions = {},
): SpeechRecognitionLike | null {
  const w = window as SpeechWindow;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;

  const mobile = isMobileUa();
  const recognition = new Ctor();
  recognition.lang = SPEECH_LOCALE[language.toLowerCase()] || "en-US";
  // Continuous mode on phones often re-emits the same finals → duplicated words.
  recognition.continuous = !mobile;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalText = "";

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const piece = (event.results[i][0]?.transcript ?? "").trim();
      if (!piece) continue;
      if (event.results[i].isFinal) {
        finalText = collapseRepeatedSpeech(mergeTranscript(finalText, piece));
        onFinal(finalText);
      } else {
        interim += (interim ? " " : "") + piece;
      }
    }
    const display = collapseRepeatedSpeech(
      mergeTranscript(finalText, interim),
    );
    onPartial(display);
  };

  recognition.onerror = (event) => {
    if (event.error === "aborted" || event.error === "no-speech") return;
    onError(event.error);
  };

  recognition.onend = () => {
    if (finalText) onFinal(collapseRepeatedSpeech(finalText));
    if (options.shouldRestart?.()) {
      try {
        recognition.start();
      } catch {
        // Already started or not allowed — ignore.
      }
    }
  };

  return recognition;
}
