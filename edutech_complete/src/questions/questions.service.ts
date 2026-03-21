import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Question } from './question.entity'

@Injectable()
export class QuestionsService {

  constructor(
    @InjectRepository(Question)
    private repo: Repository<Question>
  ) {}

  // Get module quiz questions — shuffle options but keep track of correct answer
  // Every user gets the same questions but in shuffled order
  async getModuleQuestions(courseId: number, moduleId: number) {
    const questions = await this.repo.find({ where: { courseId, moduleId, type: 'module' } })
    return this.shuffleQuestions(questions)
  }

  // Get final quiz questions for a course
  async getFinalQuizQuestions(courseId: number) {
    const questions = await this.repo.find({ where: { courseId, type: 'final' } })
    return this.shuffleQuestions(questions)
  }

  // Get questions by IDs (used during answer evaluation)
  getQuestionsByIds(ids: number[]) {
    return this.repo.findByIds(ids)
  }

  // Get expected answers for all final quiz questions (used for video evaluation)
  async getExpectedAnswers(courseId: number): Promise<string[]> {
    const questions = await this.repo.find({ where: { courseId, type: 'final' } })
    return questions
      .filter(q => q.expectedAnswer)
      .map(q => q.expectedAnswer)
  }

  // Shuffle the order of questions — same questions, different order per request
  private shuffleQuestions(questions: Question[]) {
    return questions
      .map(q => ({
        id: q.id,
        questionText: q.questionText,
        options: this.shuffleArray([...q.options]),  // shuffle options too
        // NOTE: correctOptionIndex is NOT sent to the frontend
      }))
      .sort(() => Math.random() - 0.5) // shuffle question order
  }

  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

}
