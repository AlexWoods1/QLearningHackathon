from pathlib import Path

import numpy as np
import sounddevice as sd
import soundfile as sf
import whisper
import yt_dlp

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "audio"
MODEL = None
SAMPLE_RATE = 16000


def get_model():
    global MODEL
    if MODEL is None:
        print("Loading Whisper tiny model (CPU)...")
        MODEL = whisper.load_model("tiny")
    return MODEL


def transcribe(audio_path, language=None):
    print("Transcribing...")
    model = get_model()
    kwargs = {"fp16": False, "verbose": False}
    if language:
        kwargs["language"] = language
    result = model.transcribe(str(audio_path), **kwargs)
    return result["text"]


def record_microphone(out_path=None, sample_rate=SAMPLE_RATE):
    """Record from the default mic until the user presses Enter."""
    AUDIO_DIR.mkdir(exist_ok=True)
    out_path = Path(out_path) if out_path else AUDIO_DIR / "answer.wav"
    frames = []

    def callback(indata, _frames, _time, status):
        if status:
            print(status)
        frames.append(indata.copy())

    print("Recording... speak now, then press Enter when finished.")
    with sd.InputStream(
        samplerate=sample_rate,
        channels=1,
        dtype="float32",
        callback=callback,
    ):
        input()

    if not frames:
        raise RuntimeError("No audio captured from the microphone.")

    audio = np.concatenate(frames, axis=0)
    sf.write(str(out_path), audio, sample_rate)
    return out_path


def listen_and_transcribe(language=None):
    audio_path = record_microphone()
    return transcribe(audio_path, language=language).strip()


def load_youtube_audio(url):
    AUDIO_DIR.mkdir(exist_ok=True)
    out_tmpl = str(AUDIO_DIR / "audio.%(ext)s")
    mp3_path = AUDIO_DIR / "audio.mp3"

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": out_tmpl,
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ],
    }

    print("Downloading audio...")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    return mp3_path


def main():
    # https://www.youtube.com/watch?v=dQw4w9WgXcQ
    url = input("Enter the youtube url: ")
    audio_path = load_youtube_audio(url)
    text = transcribe(audio_path)
    print(text)


if __name__ == "__main__":
    main()
