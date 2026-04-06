"use client"

import { Plus, Trash2 } from "lucide-react"
import Button from "@/components/admin/ui/Button"
import {
  createEmptyQuizQuestion,
  type QuizActivityConfig,
} from "@/lib/module-activities"

type QuizBuilderProps = {
  onChange: (value: QuizActivityConfig) => void
  value: QuizActivityConfig
}

export function QuizBuilder({ onChange, value }: QuizBuilderProps) {
  const updateQuestion = (
    questionId: string,
    updater: (question: typeof value.questions[number]) => typeof value.questions[number],
  ) => {
    onChange({
      questions: value.questions.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Quiz builder</p>
          <p className="mt-1 text-xs text-slate-400">
            Add, remove, and explain multiple-choice questions without opening the code editor.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              questions: [...value.questions, createEmptyQuizQuestion()],
            })
          }
        >
          <Plus size={14} />
          Add question
        </Button>
      </div>

      <div className="space-y-4">
        {value.questions.map((question, questionIndex) => (
          <div
            key={question.id}
            className="rounded-[24px] border border-white/10 bg-[#0C0816] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Question {questionIndex + 1}</p>
                <p className="text-xs text-slate-400">
                  Store the prompt, options, and explanation together.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    questions: value.questions.filter((entry) => entry.id !== question.id),
                  })
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 px-3 py-2 text-xs text-rose-100 transition hover:bg-rose-500/10"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>

            <textarea
              value={question.question}
              onChange={(event) =>
                updateQuestion(question.id, (current) => ({
                  ...current,
                  question: event.target.value,
                }))
              }
              placeholder="Enter the quiz question"
              className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {question.options.map((option, optionIndex) => (
                <div key={`${question.id}-${optionIndex}`} className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Option {optionIndex + 1}
                  </label>
                  <input
                    value={option}
                    onChange={(event) =>
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        options: current.options.map((entry, currentIndex) =>
                          currentIndex === optionIndex ? event.target.value : entry,
                        ),
                      }))
                    }
                    placeholder={`Option ${optionIndex + 1}`}
                    className="input-ui"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <select
                value={question.correctOptionIndex}
                onChange={(event) =>
                  updateQuestion(question.id, (current) => ({
                    ...current,
                    correctOptionIndex: Number(event.target.value),
                  }))
                }
                className="input-ui"
              >
                {question.options.map((_, optionIndex) => (
                  <option key={optionIndex} value={optionIndex}>
                    Correct option: {optionIndex + 1}
                  </option>
                ))}
              </select>

              <textarea
                value={question.explanation}
                onChange={(event) =>
                  updateQuestion(question.id, (current) => ({
                    ...current,
                    explanation: event.target.value,
                  }))
                }
                placeholder="Optional explanation shown after evaluation"
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#090612] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:ring-2 focus:ring-fuchsia-400/10"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
