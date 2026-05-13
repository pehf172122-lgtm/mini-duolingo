import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth'
import { useToast } from '../components/Toast'
import * as contentApi from '../services/content'
import * as pronunciationApi from '../services/pronunciation'
import LessonSummary from '../components/LessonSummary'

export default function LessonExercises() {
  const { accessToken } = useAuth()
  const { lessonId } = useParams()
  const nav = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const lessonTitle = (location.state as any)?.lessonTitle

  const [exercises, setExercises]             = useState<any[]>([])
  const [loading, setLoading]                 = useState(false)
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({})
  const [exerciseResults, setExerciseResults] = useState<Record<string, any>>({})
  const [audioResults, setAudioResults]       = useState<Record<string, any>>({})
  const [lessonLives, setLessonLives]         = useState<number | null>(null)
  const [nextLifeSeconds, setNextLifeSeconds] = useState(0)
  const [currentIdx, setCurrentIdx]           = useState(0)
  const [checking, setChecking]               = useState(false)
  const [showSummary, setShowSummary]         = useState(false)

  const [recordingId, setRecordingId]         = useState<string | null>(null)
  const [recordedAudio, setRecordedAudio]     = useState<Record<string, { blob: Blob; url: string }>>({})
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const audioChunksRef   = React.useRef<Blob[]>([])

  const total         = exercises.length
  const correctCount  = exercises.filter(ex => exerciseResults[ex.id]?.correct).length
  const answeredCount = exercises.filter(ex => exerciseResults[ex.id]).length
  const progress      = total ? (answeredCount / total) * 100 : 0
  const current       = exercises[currentIdx]
  const currentResult = current ? exerciseResults[current.id] : null
  const isAnswered    = !!currentResult
  const isCorrect     = currentResult?.correct
  const isLast        = currentIdx === total - 1

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2,'0')}:${Math.floor(s % 60).toString().padStart(2,'0')}`

  /* ── Timer ───────────────────────────────────── */
  useEffect(() => {
    if (nextLifeSeconds <= 0) return
    const id = setInterval(() => setNextLifeSeconds(p => p > 0 ? p - 1 : 0), 1000)
    return () => clearInterval(id)
  }, [nextLifeSeconds])

  /* ── Load ────────────────────────────────────── */
  useEffect(() => {
    if (!accessToken || !lessonId) return
    setLoading(true)
    Promise.all([
      contentApi.getExercisesByLesson(accessToken, lessonId),
      contentApi.getLessonLives(accessToken, lessonId),
    ])
      .then(([exData, livesData]) => {
        setExercises(exData || [])
        if (typeof livesData?.lives === 'number') setLessonLives(livesData.lives)
        if (typeof livesData?.nextLifeInSeconds === 'number') setNextLifeSeconds(livesData.nextLifeInSeconds)
      })
      .catch(err => toast.error(err?.message || 'Error al cargar ejercicios'))
      .finally(() => setLoading(false))
  }, [accessToken, lessonId])

  /* ── Validate ────────────────────────────────── */
  const handleCheck = async () => {
    if (!accessToken || !current || checking) return
    const answer = exerciseAnswers[current.id] || ''
    if (!answer.trim()) { toast.info('Escribe tu respuesta antes de verificar.'); return }
    setChecking(true)
    try {
      const result = await contentApi.validateExercise(accessToken, current.id, answer)
      setExerciseResults(prev => ({ ...prev, [current.id]: result }))
      if (typeof result?.lives === 'number') setLessonLives(result.lives)
      if (result.correct) toast.success('¡Correcto! +10 XP')
      else toast.error('Incorrecto. ¡Inténtalo de nuevo!')
      const livesData = await contentApi.getLessonLives(accessToken, lessonId!)
      if (typeof livesData?.nextLifeInSeconds === 'number') setNextLifeSeconds(livesData.nextLifeInSeconds)
    } catch (err: any) {
      toast.error(err?.message || 'Error al verificar')
    } finally {
      setChecking(false)
    }
  }

  /* ── Recording ───────────────────────────────── */
  const startRecording = async (exerciseId: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Tu navegador no soporta grabación de audio.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = e => { if (e.data?.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecordedAudio(prev => ({ ...prev, [exerciseId]: { blob, url: URL.createObjectURL(blob) } }))
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      setRecordingId(exerciseId)
    } catch { toast.error('Permiso de micrófono denegado.') }
  }

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecordingId(null) }

  const sendRecording = async (exercise: any) => {
    if (!accessToken) return
    const rec = recordedAudio[exercise.id]
    if (!rec) { toast.info('No hay grabación para este ejercicio.'); return }
    try {
      const file = new File([rec.blob], `rec-${exercise.id}.webm`, { type: 'audio/webm' })
      const result = await pronunciationApi.evaluateAudio(accessToken, {
        word: exercise.correct_answer,
        expectedText: exercise.correct_answer,
        audio: file,
      })
      setAudioResults(prev => ({ ...prev, [exercise.id]: result }))
      toast.success(`Puntuación de pronunciación: ${result.score}`)
    } catch (err: any) { toast.error(err?.message || 'Error al evaluar audio') }
  }

  /* ── Finish ──────────────────────────────────── */
  const handleFinish = () => setShowSummary(true)

  if (!accessToken || !lessonId) return null

  /* ── Summary screen ──────────────────────────── */
  if (showSummary) {
    return (
      <LessonSummary
        totalExercises={total}
        correctCount={correctCount}
        xpEarned={correctCount * 10}
      />
    )
  }

  return (
    <div className="lesson-page">
      {/* Top bar */}
      <div className="lesson-topbar">
        <button className="lesson-exit-btn" onClick={() => nav('/content')} title="Salir">✕</button>
        <div className="lesson-progress-wrap">
          <div className="lesson-progress-bar-outer">
            <div className="lesson-progress-bar-inner" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {typeof lessonLives === 'number' && (
          <div className="lesson-lives-wrap">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < lessonLives ? 'heart' : 'heart empty'}>
                {i < lessonLives ? '❤️' : '🤍'}
              </span>
            ))}
            {nextLifeSeconds > 0 && (
              <span className="lesson-lives-timer">{fmt(nextLifeSeconds)}</span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="lesson-body">
        {loading && <div className="lesson-loading">Cargando ejercicios...</div>}

        {!loading && !current && (
          <div className="lesson-empty">No hay ejercicios para esta lección.</div>
        )}

        {current && (
          <>
            <div className="lesson-exercise-type">{current.type}</div>
            <h2 className="lesson-prompt">{current.prompt}</h2>

            {current.type !== 'PRONUNCIATION' && (
              <input
                className="lesson-input"
                placeholder="Escribe tu respuesta..."
                value={exerciseAnswers[current.id] || ''}
                onChange={e => {
                  if (isAnswered) return
                  setExerciseAnswers(prev => ({ ...prev, [current.id]: e.target.value }))
                }}
                onKeyDown={e => { if (e.key === 'Enter' && !isAnswered) handleCheck() }}
                disabled={isAnswered}
                autoFocus
              />
            )}

            {current.type === 'PRONUNCIATION' && (
              <div className="lesson-audio-wrap">
                <button
                  className={recordingId === current.id ? 'lesson-btn-record recording' : 'lesson-btn-record'}
                  onClick={() => recordingId === current.id ? stopRecording() : startRecording(current.id)}
                >
                  {recordingId === current.id ? (
                    <><div className="recording-wave"><span/><span/><span/><span/></div>Detener</>
                  ) : '🎙️ Grabar'}
                </button>
                {recordedAudio[current.id] && (
                  <div className="lesson-audio-controls">
                    <audio controls src={recordedAudio[current.id].url} />
                    <button className="lesson-btn-send" onClick={() => sendRecording(current)}>
                      Enviar grabación
                    </button>
                  </div>
                )}
                {audioResults[current.id] && (
                  <div className="lesson-audio-result">
                    <span className="result-detail">Puntuación: {audioResults[current.id].score}</span>
                    {audioResults[current.id].feedback && (
                      <p className="feedback-detail">{audioResults[current.id].feedback}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Feedback banner */}
            {isAnswered && (
              <div className={`lesson-feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
                <div className="feedback-icon">{isCorrect ? '✅' : '❌'}</div>
                <div className="feedback-body">
                  <p className="feedback-title">{isCorrect ? '¡Correcto!' : 'Respuesta incorrecta'}</p>
                  {currentResult?.feedback && <p className="feedback-detail">{currentResult.feedback}</p>}
                  {currentResult?.vocabInfo && (
                    <div className="vocab-info">
                      {currentResult.vocabInfo.ipa && <span className="vocab-ipa">IPA: {currentResult.vocabInfo.ipa}</span>}
                      {Array.isArray(currentResult.vocabInfo.meanings) &&
                        currentResult.vocabInfo.meanings.map((m: any) => (
                          <div key={m.id}>
                            <p className="vocab-meaning-text">{m.meaning}</p>
                            {m.examples?.length > 0 && (
                              <ul className="vocab-examples">
                                {m.examples.map((ex: any) => <li key={ex.id}>{ex.example_text}</li>)}
                              </ul>
                            )}
                          </div>
                        ))
                      }
                    </div>
                  )}
                  {currentResult?.repeat && <p className="repeat-note">Reintento — no afecta XP ni vidas.</p>}
                  {typeof currentResult?.lives === 'number' && (
                    <div className="lives-row" style={{ marginTop: 8 }}>
                      <span className="lives-label">Vidas:</span>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} className={i < currentResult.lives ? 'heart' : 'heart empty'}>
                          {i < currentResult.lives ? '❤️' : '🤍'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {current && (
        <div className={`lesson-footer ${isAnswered ? (isCorrect ? 'footer-correct' : 'footer-wrong') : ''}`}>
          {currentIdx > 0 && !isAnswered && (
            <button className="lesson-btn-skip" onClick={() => setCurrentIdx(i => i - 1)}>
              Anterior
            </button>
          )}
          {!isAnswered ? (
            <button
              className="lesson-btn-check"
              onClick={handleCheck}
              disabled={checking || !exerciseAnswers[current.id]?.trim()}
            >
              {checking ? 'Verificando...' : 'VERIFICAR'}
            </button>
          ) : isLast ? (
            <button className="lesson-btn-check" onClick={handleFinish}>
              VER RESULTADO
            </button>
          ) : (
            <button className="lesson-btn-check" onClick={() => setCurrentIdx(i => i + 1)}>
              SIGUIENTE
            </button>
          )}
        </div>
      )}
    </div>
  )
}