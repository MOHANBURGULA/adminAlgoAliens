# OpenAI Module

Wraps the OpenAI API for two tasks: speech-to-text transcription and transcript evaluation.

## Required Environment Variable
```
OPENAI_API_KEY=sk-your-key-here
```

---

## Methods

### transcribeVideo(buffer, filename)
Sends a video/audio buffer to OpenAI Whisper API and returns the transcript as a string.

- Model: `whisper-1`
- Language: English
- The buffer is written to a temp file, sent to Whisper, then cleaned up

---

### evaluateTranscript(transcript, expectedAnswers)
Sends the transcript and expected answer topics to GPT-4o-mini for evaluation.

Returns:
```ts
{
  relevanceScore: number,    // 0-100
  aiDetectionScore: number,  // 0-100 (higher = more AI-like)
  finalScore: number,        // combined score
  feedback: string           // 2-3 sentence summary
}
```

**How AI detection works:**
GPT is prompted to identify patterns typical of AI-generated or heavily scripted speech, such as overly formal sentence structure, lack of filler words, perfect grammar throughout, and absence of natural hesitation. A score above 60 indicates likely AI use.

**How relevance scoring works:**
GPT compares the transcript against the `expectedAnswer` texts stored in the questions table for that course. It checks topic coverage, key concepts mentioned, and technical accuracy.

---

## Files
| File | Purpose |
|------|---------|
| `openai.service.ts` | Whisper transcription + GPT evaluation |
| `openai.module.ts` | Module definition — exports OpenAiService |
