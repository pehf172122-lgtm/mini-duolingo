import React, { useEffect, useState } from 'react'
import { useAuth } from '../state/auth'
import * as contentApi from '../services/content'
import * as pronunciationApi from '../services/pronunciation'

type UnitWithLessons = {
  unitId: string
  title: string
  lessons: any[]
}

export default function Content() {
  const { accessToken } = useAuth()
  const [units, setUnits] = useState<UnitWithLessons[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [exercises, setExercises] = useState<any[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [animateLessons, setAnimateLessons] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({})
  const [exerciseAudio, setExerciseAudio] = useState<Record<string, File | null>>({})
  const [exerciseResults, setExerciseResults] = useState<Record<string, any>>({})
  const [audioResults, setAudioResults] = useState<Record<string, any>>({})
  const [lessonLives, setLessonLives] = useState<Record<string, number>>({})
  const [livesShakeKey, setLivesShakeKey] = useState<number>(0)
  const [recordingExerciseId, setRecordingExerciseId] = useState<string | null>(null)
  const [recordedAudio, setRecordedAudio] = useState<Record<string, { blob: Blob; url: string }>>({})
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const audioChunksRef = React.useRef<Blob[]>([])
  const [nextLifeSeconds, setNextLifeSeconds] = useState<number>(0)

  const currentLives = selectedLessonId ? lessonLives[selectedLessonId] : undefined

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

  const refreshUnits = async (keepSelection = true) => {
    if (!accessToken) return
    setLoadingUnits(true)
    try {
      const data = await contentApi.getUnitsWithProgress(accessToken)
      const list = data?.units || []
      setUnits(list)
      if (keepSelection && selectedUnitId) {
        const unit = list.find((u: UnitWithLessons) => u.unitId === selectedUnitId)
        setLessons(unit?.lessons || [])
      }
    } catch {
      setMsg('Failed to load units')
    } finally {
      setLoadingUnits(false)
    }
  }

  useEffect(() => {
    if (!accessToken) return
    refreshUnits(false)
  }, [accessToken])

  const loadLessons = async (unitId: string) => {
    if (!accessToken) return
    setSelectedUnitId(unitId)
    setSelectedLessonId(null)
    setExercises([])
    setExerciseResults({})
    setAudioResults({})
    setExerciseAnswers({})
    setExerciseAudio({})
    setMsg('')
    setAnimateLessons(false)

    const unit = units.find(u => u.unitId === unitId)
    if (unit) {
      setLessons(unit.lessons || [])
      setTimeout(() => setAnimateLessons(true), 0)
      return
    }

    await refreshUnits(true)
    setTimeout(() => setAnimateLessons(true), 0)
  }

  const loadExercises = async (lesson: any) => {
    if (!accessToken) return
    if (lesson.status === 'locked') {
      setMsg('Lesson locked. Complete the previous lesson to unlock it.')
      return
    }
    setSelectedLessonId(lesson.lessonId)
    setLoadingExercises(true)
    setMsg('')
    try {
      const data = await contentApi.getExercisesByLesson(accessToken, lesson.lessonId)
      setExercises(data || [])
      const livesData = await contentApi.getLessonLives(accessToken, lesson.lessonId)
      if (typeof livesData?.lives === 'number') {
        setLessonLives(prev => ({ ...prev, [lesson.lessonId]: livesData.lives }))
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

  const setAnswer = (exerciseId: string, value: string) => {
    setExerciseAnswers(prev => ({ ...prev, [exerciseId]: value }))
  }

  const setAudio = (exerciseId: string, file: File | null) => {
    setExerciseAudio(prev => ({ ...prev, [exerciseId]: file }))
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
      if (typeof result?.lives === 'number' && selectedLessonId) {
        setLessonLives(prev => {
          const prevLives = prev[selectedLessonId]
          if (typeof prevLives === 'number' && result.lives < prevLives) {
            setLivesShakeKey(Date.now())
          }
          return { ...prev, [selectedLessonId]: result.lives }
        })
      }
      if (selectedLessonId) {
        const livesData = await contentApi.getLessonLives(accessToken, selectedLessonId)
        if (typeof livesData?.nextLifeInSeconds === 'number') {
          setNextLifeSeconds(livesData.nextLifeInSeconds)
        }
      }
      await refreshUnits(true)
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

  const handleEvaluateAudio = async (exercise: any) => {
    if (!accessToken) return
    const file = exerciseAudio[exercise.id]
    if (!file) {
      setMsg('Please choose an audio file.')
      return
    }
    setMsg('')
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

  return (
    <div className="content-page">
      <div className="content-hero">
        <div className="content-hero-text">
          <h2>Your Path</h2>
          <p>Pick a unit and complete lessons to unlock the next ones.</p>
        </div>
        <div className="content-hero-right">
          {typeof currentLives === 'number' && (
            <div key={livesShakeKey} className="global-lives">
              <div className="global-lives-hearts">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={i < currentLives ? 'heart full' : 'heart empty'}>
                    {i < currentLives ? '❤️' : '🤍'}
                  </span>
                ))}
              </div>
              <div className="global-lives-timer">
                {nextLifeSeconds > 0 ? `Next life in ${formatTime(nextLifeSeconds)}` : 'Full lives'}
              </div>
            </div>
          )}
          <div className="content-hero-badge">XP +10</div>
        </div>
      </div>

      <section className="content-card">
        <div className="section-header">
          <h3>Units</h3>
          {loadingUnits && <span className="section-meta">Loading...</span>}
        </div>
        <div className="unit-list">
          {units.map(u => (
            <button
              key={u.unitId}
              className={`unit-chip ${selectedUnitId === u.unitId ? 'active' : ''}`}
              onClick={() => loadLessons(u.unitId)}
            >
              <span className="unit-dot" />
              {u.title}
            </button>
          ))}
        </div>

        {selectedUnitId && (
          <div className={`lessons-block ${animateLessons ? 'unit-selected' : ''}`}>
            <div className="section-header">
              <h3>Lessons</h3>
              <span className="section-meta">Select a lesson to start</span>
            </div>
            <div className="lessons-grid">
              {lessons.map((l: any, index: number) => {
                const locked = l.status === 'locked'
                const completed = l.status === 'completed'
                return (
                  <div
                    key={l.lessonId}
                    className={`lesson-card ${locked ? 'locked' : 'unlocked'} ${completed ? 'completed' : ''} ${locked ? '' : 'is-clickable'}`}
                    style={{ animationDelay: `${index * 70}ms` }}
                    onClick={() => !locked && loadExercises(l)}
                  >
                    <div className="lesson-header">
                      <span className={`lesson-icon ${locked ? 'locked' : 'unlocked'}`}>
                        {locked ? '🔒' : completed ? '✅' : '⭐'}
                      </span>
                      <div className="lesson-title">{l.title}</div>
                    </div>

                    <div className="lesson-status">
                      {locked ? 'Locked' : completed ? 'Completed' : 'Unlocked'}
                    </div>

                    {l.progress > 0 && (
                      <>
                        <div className="lesson-progress">
                          <div
                            className="lesson-progress-bar"
                            style={{ width: `${l.progress}%` }}
                          />
                        </div>
                        <div className="lesson-progress-text">
                          {l.progress}% completed
                        </div>
                      </>
                    )}

                    {locked && <div className="lesson-lock-overlay" />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {selectedLessonId && (
          <div className="exercises-block">
            <div className="section-header">
              <h3>Exercises</h3>
              <div className="lesson-header-right">
                {typeof lessonLives[selectedLessonId] === 'number' && (
                  <div key={livesShakeKey} className="lesson-lives">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <span key={i} className={i < lessonLives[selectedLessonId] ? 'heart full' : 'heart empty'}>
                        {i < lessonLives[selectedLessonId] ? '❤️' : '🤍'}
                      </span>
                    ))}
                  </div>
                )}
                {typeof lessonLives[selectedLessonId] === 'number' && (
                  <div className="lesson-lives-timer">
                    {nextLifeSeconds > 0 ? `Next life in ${formatTime(nextLifeSeconds)}` : 'Full lives'}
                  </div>
                )}
                {loadingExercises && <span className="section-meta">Loading...</span>}
              </div>
            </div>
            {exercises.length === 0 && !loadingExercises && (
              <div className="empty-state">No exercises found for this lesson.</div>
            )}
            <div className="exercise-list">
              {exercises.map((ex: any) => {
                const result = exerciseResults[ex.id]
                const audioResult = audioResults[ex.id]
                return (
                  <div key={ex.id} className="exercise-card">
                    <div className="exercise-meta">
                      <span className="exercise-type">{ex.type}</span>
                    </div>
                    <div className="exercise-prompt">{ex.prompt}</div>

                    <input
                      className="exercise-input"
                      placeholder="Type your answer"
                      value={exerciseAnswers[ex.id] || ''}
                      onChange={e => setAnswer(ex.id, e.target.value)}
                    />

                    {ex.type === 'PRONUNCIATION' && (
                      <div className="exercise-audio">
                        <button
                          type="button"
                          className={recordingExerciseId === ex.id ? 'danger' : 'secondary'}
                          onClick={() => recordingExerciseId === ex.id ? stopRecording() : startRecording(ex.id)}
                        >
                          {recordingExerciseId === ex.id ? 'Stop Recording' : 'Record'}
                        </button>

                        {recordingExerciseId === ex.id && (
                          <div className="recording-wave">
                            <span />
                            <span />
                            <span />
                            <span />
                          </div>
                        )}

                        {recordedAudio[ex.id] && (
                          <>
                            <audio controls src={recordedAudio[ex.id].url} />
                            <button type="button" className="primary" onClick={() => sendRecording(ex)}>
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
                        onClick={() => handleValidate(ex)}
                      >
                        Check Answer
                      </button>
                    </div>

                    {result && (
                      <div className="exercise-result">
                        <span className={result.correct ? 'result-good' : 'result-bad'}>
                          {result.correct ? 'Correct' : 'Incorrect'}
                        </span>
                        {typeof result.lives === 'number' && (
                          <div className="lives-row">
                            <span className="lives-label">Lives:</span>
                            <span className="lives-hearts">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <span key={i} className={i < result.lives ? 'heart full' : 'heart empty'}>
                                  {i < result.lives ? '❤️' : '🤍'}
                                </span>
                              ))}
                            </span>
                          </div>
                        )}
                        {result.score !== undefined && (
                          <span className="result-detail">Score: {result.score}</span>
                        )}
                        {result.feedback && (
                          <div className="result-feedback">{result.feedback}</div>
                        )}
                        {result?.vocabInfo && (
                          <div className="vocab-info">
                            {result.vocabInfo.ipa && (
                              <div className="vocab-ipa">IPA: {result.vocabInfo.ipa}</div>
                            )}

                            {Array.isArray(result.vocabInfo.meanings) && (
                              <div className="vocab-meanings">
                                {result.vocabInfo.meanings.map((m: any) => (
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
                        {result.repeat && (
                          <div className="repeat-note">
                            Reintento: no suma XP ni afecta vidas.
                          </div>
                        )}
                      </div>
                    )}

                    {audioResult && (
                      <div className="exercise-result">
                        <span className="result-detail">Audio score: {audioResult.score}</span>
                        {audioResult.feedback && (
                          <div className="result-feedback">{audioResult.feedback}</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="msg">{msg}</div>
      </section>
    </div>
  )
}