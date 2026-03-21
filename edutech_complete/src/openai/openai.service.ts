import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

@Injectable()
export class OpenAiService {

  private client: OpenAI
  private readonly logger = new Logger(OpenAiService.name)

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  // Step 1: Transcribe audio/video using Whisper
  async transcribeVideo(videoBuffer: Buffer, filename: string): Promise<string> {
    // Write buffer to a temp file (Whisper API needs a file stream)
    const tmpPath = path.join(os.tmpdir(), filename)
    fs.writeFileSync(tmpPath, videoBuffer)

    try {
      const response = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(tmpPath),
        model: 'whisper-1',
        language: 'en'
      })
      return response.text
    } finally {
      fs.unlinkSync(tmpPath) // clean up temp file
    }
  }

  // Step 2: Score answer relevance + detect AI-generated speech
  async evaluateTranscript(
    transcript: string,
    expectedAnswers: string[]
  ): Promise<{
    relevanceScore: number
    aiDetectionScore: number
    finalScore: number
    feedback: string
  }> {
    const expectedText = expectedAnswers.join('\n')

    const prompt = `
You are evaluating a student's spoken explanation for a technical course.

EXPECTED ANSWER TOPICS:
${expectedText}

STUDENT TRANSCRIPT:
"${transcript}"

Evaluate on TWO dimensions and return ONLY valid JSON:

1. relevanceScore (0-100): How well does the student's answer cover the expected topics?
   - 90-100: Excellent, covers all key points clearly
   - 70-89: Good, covers most key points
   - 50-69: Partial, misses significant points
   - 0-49: Poor, largely irrelevant

2. aiDetectionScore (0-100): How likely is this transcript AI-generated or read from a script?
   - 0-30: Natural human speech (good)
   - 31-60: Some scripted patterns
   - 61-100: Strongly AI-generated or verbatim script (bad)

3. finalScore (0-100): Overall score = relevanceScore * (1 - aiDetectionScore/200)
   This penalises AI-like speech.

4. feedback: 2-3 sentence summary of strengths and weaknesses.

Respond ONLY with this JSON (no markdown, no explanation):
{
  "relevanceScore": <number>,
  "aiDetectionScore": <number>,
  "finalScore": <number>,
  "feedback": "<string>"
}
`

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    })

    const raw = response.choices[0].message.content || '{}'

    try {
      return JSON.parse(raw)
    } catch {
      this.logger.error('Failed to parse GPT response:', raw)
      return {
        relevanceScore: 0,
        aiDetectionScore: 0,
        finalScore: 0,
        feedback: 'Evaluation failed. Please try again.'
      }
    }
  }

}
