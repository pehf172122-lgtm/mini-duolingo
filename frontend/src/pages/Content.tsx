import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth'
import { useToast } from '../components/Toast'
import * as contentApi from '../services/content'
import Confetti from 'react-confetti'

type Lesson = {
  lessonId: string
  title: string
  status: 'locked' | 'available' | 'completed'
}

type UnitWithLessons = {
  unitId: string
  title: string
  lessons: Lesson[]
}

const NODE_ICONS = ['⭐', '📖', '⭐', '🏆', '⭐', '📖', '⭐', '🎯']

function nodeClass(status: string) {
  if (status === 'completed') return 'node-btn node-done'
  if (status === 'available') return 'node-btn node-active'
  return 'node-btn node-locked'
}

function nodeIcon(lesson: Lesson, idx: number) {
  if (lesson.status === 'locked') return '🔒'
  return NODE_ICONS[idx % NODE_ICONS.length]
}

export default function Content() {
  const { accessToken } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [units, setUnits]       = useState<UnitWithLessons[]>([])
  const [loading, setLoading]   = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const fromRoute = (location.state as any)?.showConfetti
    if (!fromRoute) return
    setShowConfetti(true)
    const id = setTimeout(() => setShowConfetti(false), 3000)
    nav(location.pathname, { replace: true, state: null })
    return () => clearTimeout(id)
  }, [location.state])

  useEffect(() => {
    if (!accessToken) return
    setLoading(true)
    contentApi.getUnitsWithProgress(accessToken)
      .then(data => setUnits(data?.units || []))
      .catch(err => toast.error(err?.message || 'Error al cargar el contenido'))
      .finally(() => setLoading(false))
  }, [accessToken])

  const openLesson = (lesson: Lesson) => {
    if (lesson.status === 'locked') {
      toast.info('Completa la lección anterior para desbloquear esta.')
      return
    }
    nav(`/lesson/${lesson.lessonId}`, { state: { lessonTitle: lesson.title } })
  }

  if (!accessToken) return null

  return (
    <div>
      {showConfetti && <Confetti recycle={false} numberOfPieces={150} />}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          🦉 Cargando tu ruta de aprendizaje...
        </div>
      )}

      {!loading && units.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          No hay unidades disponibles todavía.
        </div>
      )}

      {units.map((unit, uIdx) => (
        <div key={unit.unitId} className="content-page" style={{ marginBottom: 48 }}>

          {/* Section banner */}
          <div className="section-banner">
            <div className="section-banner-left">
              <span className="section-banner-back">← ETAPA {uIdx + 1}, SECCIÓN 1</span>
              <span className="section-banner-title">{unit.title}</span>
            </div>
            <button className="section-banner-guide">📋 GUÍA</button>
          </div>

          {/* Lesson path */}
          <div className="lesson-path">
            {unit.lessons.map((lesson, lIdx) => {
              const isActive = lesson.status === 'available'
              const isDone   = lesson.status === 'completed'

              return (
                <React.Fragment key={lesson.lessonId}>
                  {lIdx > 0 && (
                    <div className={`path-connector ${isDone ? 'done' : ''}`} />
                  )}

                  <div className="path-node">
                    {/* Owl mascot floats to the right of the active node */}
                    {isActive && (
                      <div className="path-owl-wrap">
                        <img
                          src="/Imagen2.png"
                          alt="Duo"
                          className="path-owl"
                        />
                      </div>
                    )}

                    <div className="path-node-bubble">
                      {isActive && <span className="bubble-label">EMPEZAR</span>}
                      {lesson.status === 'locked' && (
                        <span className="bubble-label locked-label">BLOQUEADO</span>
                      )}
                      <button
                        className={nodeClass(lesson.status)}
                        onClick={() => openLesson(lesson)}
                        title={lesson.title}
                      >
                        {nodeIcon(lesson, lIdx)}
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}