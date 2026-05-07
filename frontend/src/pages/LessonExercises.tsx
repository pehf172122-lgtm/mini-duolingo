import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth'
import * as contentApi from '../services/content'
import * as pronunciationApi from '../services/pronunciation'
import Confetti from 'react-confetti'

export default function LessonExercises() {
  const { accessToken } = useAuth()
  const { lessonId } = useParams()
  const nav = useNavigate()
  const location = useLocation()
  const lessonTitle = (location.state as any)?.lessonTitle

  const [exercises, setExercises] = useState<any[]>([])
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({})
  const [exerciseResults, setExerciseResults] = useState<Record<string, any>>({})
  const [audioResults, setAudioResults] = useState<Record<string, any>>({})
  const [lessonLives, setLessonLives] = useState<number | null>(null)
  const [nextLifeSeconds, setNextLifeSeconds] = useState(0)
  const [msg, setMsg] = useState('')
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  const [recordingExerciseId, setRecordingExerciseId] = useState<string | null>(null)
  const [recordedAudio, setRecordedAudio] = useState<Record<string, { blob: Blob; url: string }>>({})
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const audioChunksRef = React.useRef<Blob[]>([])

  const totalExercises = exercises.length
  const answeredCount = exercises.filter(ex => exerciseResults[ex.id]).length
  const progressPercent = totalExercises ? Math.round((answeredCount / totalExercises) * 100) : 0
  const currentExercise = exercises[currentExerciseIndex]

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  useEffect(() => {
    if (nextLifeSeconds <= 0) return
    const id = setInterval(() => {
      setNextLifeSeconds(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [nextLifeSeconds])

  useEffect(() => {
    const load = async () => {
      if (!accessToken || !lessonId) return
      setLoadingExercises(true)
      setMsg('')
      try {
        const data = await contentApi.getExercisesByLesson(accessToken, lessonId)
        setExercises(data || [])
        setCurrentExerciseIndex(0)
        const livesData = await contentApi.getLessonLives(accessToken, lessonId)
        if (typeof livesData?.lives === 'number') {
          setLessonLives(livesData.lives)
        }
        if (typeof livesData?.nextLifeInSeconds === 'number') {
          setNextLifeSeconds(livesData.nextLifeInSeconds)
        }
      } catch (err: any) {
        setMsg(err?.message || 'Failed to load exercises')
      } finally {
        setLoadingExercises(false)
      }
    }
    load()
  }, [accessToken, lessonId])

  const handleExitLesson = () => {
    nav('/content')
  }

  const handleFinishLesson = () => {
    setShowConfetti(true)
    setTimeout(() => {
      nav('/content', { state: { showConfetti: true } })
    }, 900)
  }

  const setAnswer = (exerciseId: string, value: string) => {
    setExerciseAnswers(prev => ({ ...prev, [exerciseId]: value }))
  }

  const handleValidate = async (exercise: any) => {
    if (!accessToken) return
    const answer = exerciseAnswers[exercise.id] || ''
    if (!answer) {
      setMsg('Please enter an answer before validating.')
      return
    }
    setMsg('')
    try {
      const result = await contentApi.validateExercise(accessToken, exercise.id, answer)
      setExerciseResults(prev => ({ ...prev, [exercise.id]: result }))
      if (typeof result?.lives === 'number') {
        setLessonLives(result.lives)
      }
      if (lessonId) {
        const livesData = await contentApi.getLessonLives(accessToken, lessonId)
        if (typeof livesData?.nextLifeInSeconds === 'number') {
          setNextLifeSeconds(livesData.nextLifeInSeconds)
        }
      }
    } catch (err: any) {
      setMsg(err?.message || 'Validation failed')
    }
  }

  const startRecording = async (exerciseId: string) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMsg('Your browser does not support audio recording.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setRecordedAudio(prev => ({ ...prev, [exerciseId]: { blob, url } }))
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start()
      setRecordingExerciseId(exerciseId)
      setMsg('')
    } catch (err) {
      setMsg('Microphone permission denied or unavailable.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingExerciseId) {
      mediaRecorderRef.current.stop()
      setRecordingExerciseId(null)
    }
  }

  const sendRecording = async (exercise: any) => {
    if (!accessToken) return
    const rec = recordedAudio[exercise.id]
    if (!rec) {
      setMsg('No recording found for this exercise.')
      return
    }

    const file = new File([rec.blob], `recording-${exercise.id}.webm`, { type: rec.blob.type || 'audio/webm' })

    try {
      const result = await pronunciationApi.evaluateAudio(accessToken, {
        word: exercise.correct_answer,
        expectedText: exercise.correct_answer,
        audio: file
      })
      setAudioResults(prev => ({ ...prev, [exercise.id]: result }))
    } catch (err: any) {
      setMsg(err?.message || 'Audio evaluation failed')
    }
  }

  if (!accessToken) return <div className="card">Please login to view content.</div>
  if (!lessonId) return <div className="card">Missing lesson id.</div>

  return (
    <div className="content-page">
      {showConfetti && <Confetti />}
      <section className="content-card">
        <div className="exercise-header">
          <button className="secondary" onClick={handleExitLesson}>Salir</button>
          <div className="exercise-progress">
            <div className="exercise-progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="lesson-lives-wrap">
            {typeof lessonLives === 'number' && (
              <div className="lesson-lives">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={i < lessonLives ? 'heart full' : 'heart empty'}>
                    {i < lessonLives ? '❤️' : '🤍'}
                  </span>
                ))}
              </div>
            )}
            {nextLifeSeconds > 0 && (
              <div className="lesson-lives-timer">
                Next life in {formatTime(nextLifeSeconds)}
              </div>
            )}
          </div>
        </div>

        <h3>{lessonTitle || 'Lesson'}</h3>

        {loadingExercises && <div className="section-meta">Loading...</div>}
        {!loadingExercises && !currentExercise && (
          <div className="empty-state">No exercises found for this lesson.</div>
        )}

        {currentExercise && (
          <div className="exercise-card">
            <div className="exercise-meta">
              <span className="exercise-type">{currentExercise.type}</span>
            </div>
            <div className="exercise-prompt">{currentExercise.prompt}</div>

            <input
              className="exercise-input"
              placeholder="Type your answer"
              value={exerciseAnswers[currentExercise.id] || ''}
              onChange={e => setAnswer(currentExercise.id, e.target.value)}
            />

            {currentExercise.type === 'PRONUNCIATION' && (
              <div className="exercise-audio">
                <button
                  type="button"
                  className={recordingExerciseId === currentExercise.id ? 'danger' : 'secondary'}
                  onClick={() => recordingExerciseId === currentExercise.id ? stopRecording() : startRecording(currentExercise.id)}
                >
                  {recordingExerciseId === currentExercise.id ? 'Stop Recording' : 'Record'}
                </button>

                {recordingExerciseId === currentExercise.id && (
                  <div className="recording-wave">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                )}

                {recordedAudio[currentExercise.id] && (
                  <>
                    <audio controls src={recordedAudio[currentExercise.id].url} />
                    <button type="button" className="primary" onClick={() => sendRecording(currentExercise)}>
                      Send Recording
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="exercise-actions">
              <button
                type="button"
                className="primary"
                onClick={() => handleValidate(currentExercise)}
              >
                Check Answer
              </button>
            </div>

            {exerciseResults[currentExercise.id] && (
              <div className="exercise-result">
                <span className={exerciseResults[currentExercise.id].correct ? 'result-good' : 'result-bad'}>
                  {exerciseResults[currentExercise.id].correct ? 'Correct' : 'Incorrect'}
                </span>
                {typeof exerciseResults[currentExercise.id].lives === 'number' && (
                  <div className="lives-row">
                    <span className="lives-label">Lives:</span>
                    <span className="lives-hearts">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} className={i < exerciseResults[currentExercise.id].lives ? 'heart full' : 'heart empty'}>
                          {i < exerciseResults[currentExercise.id].lives ? '❤️' : '🤍'}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {exerciseResults[currentExercise.id].score !== undefined && (
                  <span className="result-detail">Score: {exerciseResults[currentExercise.id].score}</span>
                )}
                {exerciseResults[currentExercise.id].feedback && (
                  <div className="result-feedback">{exerciseResults[currentExercise.id].feedback}</div>
                )}
                {exerciseResults[currentExercise.id]?.vocabInfo && (
                  <div className="vocab-info">
                    {exerciseResults[currentExercise.id].vocabInfo.ipa && (
                      <div className="vocab-ipa">IPA: {exerciseResults[currentExercise.id].vocabInfo.ipa}</div>
                    )}

                    {Array.isArray(exerciseResults[currentExercise.id].vocabInfo.meanings) && (
                      <div className="vocab-meanings">
                        {exerciseResults[currentExercise.id].vocabInfo.meanings.map((m: any) => (
                          <div key={m.id} className="vocab-meaning">
                            <div className="vocab-meaning-text">{m.meaning}</div>
                            {Array.isArray(m.examples) && m.examples.length > 0 && (
                              <ul className="vocab-examples">
                                {m.examples.map((ex: any) => (
                                  <li key={ex.id}>{ex.example_text}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {exerciseResults[currentExercise.id].repeat && (
                  <div className="repeat-note">
                    Reintento: no suma XP ni afecta vidas.
                  </div>
                )}
              </div>
            )}

            {audioResults[currentExercise.id] && (
              <div className="exercise-result">
                <span className="result-detail">Audio score: {audioResults[currentExercise.id].score}</span>
                {audioResults[currentExercise.id].feedback && (
                  <div className="result-feedback">{audioResults[currentExercise.id].feedback}</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="exercise-nav">
          {currentExerciseIndex > 0 && (
            <button className="secondary" onClick={() => setCurrentExerciseIndex(i => i - 1)}>
              Anterior
            </button>
          )}

          {currentExerciseIndex < totalExercises - 1 && (
            <button
              className="primary"
              disabled={!exerciseResults[currentExercise?.id]}
              onClick={() => setCurrentExerciseIndex(i => i + 1)}
            >
              Siguiente
            </button>
          )}

          {currentExerciseIndex === totalExercises - 1 && (
            <button
              className="primary"
              disabled={!exerciseResults[currentExercise?.id]}
              onClick={handleFinishLesson}
            >
              Finalizar
            </button>
          )}
        </div>

        <div className="msg">{msg}</div>
      </section>
    </div>
  )
}