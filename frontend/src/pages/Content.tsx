import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth'
import * as contentApi from '../services/content'
import Confetti from 'react-confetti'

type UnitWithLessons = {
  unitId: string
  title: string
  lessons: any[]
}

export default function Content() {
  const { accessToken } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [units, setUnits] = useState<UnitWithLessons[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [animateLessons, setAnimateLessons] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)


  useEffect(() => {
    const showFromRoute = (location.state as any)?.showConfetti
    if (!showFromRoute) return
    setShowConfetti(true)
    const id = setTimeout(() => setShowConfetti(false), 3000)
    nav(location.pathname, { replace: true, state: null })
    return () => clearTimeout(id)
  }, [location.state, nav, location.pathname])

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

  const openLesson = (lesson: any) => {
    if (lesson.status === 'locked') {
      setMsg('Lesson locked. Complete the previous lesson to unlock it.')
      return
    }
    nav(`/lesson/${lesson.lessonId}`, { state: { lessonTitle: lesson.title } })
  }
  
  if (!accessToken) return <div className="card">Please login to view content.</div>

  return (
    <div className="content-page">
      {showConfetti && <Confetti />}
      <div className="content-hero">
        <div className="content-hero-text">
          <h2>Your Path</h2>
          <p>Pick a unit and complete lessons to unlock the next ones.</p>
        </div>
        <div className="content-hero-right">

          <div className="content-hero-badge">XP +10</div>
        </div>
      </div>

      <section className="content-card">
        <div className="section-header">
          <h3>Units</h3>
          {loadingUnits && <span className="section-meta">Loading...</span>}
        </div>
          <div className="unit-stack">
            {units.map(u => (
              <div key={u.unitId} className="unit-card">
                <button
                 className={`unit-card-btn ${selectedUnitId === u.unitId ? 'active' : ''}`}
                 onClick={() => loadLessons(u.unitId)}
                >
                  {u.title}
                </button>

                {selectedUnitId === u.unitId && (
                  <div className="lesson-circles">
                    {lessons.map((l: any) => {
                      const locked = l.status === 'locked'
                      return (
                        <button
                          key={l.lessonId}
                          className={`lesson-circle ${locked ? 'locked' : 'unlocked'}`}
                          onClick={() => !locked && openLesson(l)}
                        >
                          {locked ? '🔒' : '⭐'}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="msg">{msg}</div>
        </section>
    </div>
  )
}