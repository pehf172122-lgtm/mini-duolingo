import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Confetti from 'react-confetti'

interface LessonSummaryProps {
  totalExercises: number
  correctCount:   number
  xpEarned?:      number
  onContinue?:    () => void
}

export default function LessonSummary({
  totalExercises,
  correctCount,
  xpEarned = 10,
  onContinue,
}: LessonSummaryProps) {
  const nav = useNavigate()
  const accuracy = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 0
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Slight delay so the animation feels intentional
    const id = setTimeout(() => setShow(true), 80)
    return () => clearTimeout(id)
  }, [])

  const handleContinue = () => {
    if (onContinue) onContinue()
    else nav('/content')
  }

  const grade = accuracy >= 90 ? '🏆' : accuracy >= 60 ? '⭐' : '💪'
  const gradeMsg =
    accuracy >= 90 ? '¡Perfecto! Eres increíble.' :
    accuracy >= 60 ? '¡Buen trabajo! Sigue así.' :
    'Sigue practicando, ¡lo lograrás!'

  return (
    <div className={`summary-overlay ${show ? 'summary-visible' : ''}`}>
      <Confetti recycle={false} numberOfPieces={180} />

      <div className="summary-card">
        {/* Trophy */}
        <div className="summary-trophy">{grade}</div>
        <h2 className="summary-title">¡Lección completada!</h2>
        <p className="summary-subtitle">{gradeMsg}</p>

        {/* Stats row */}
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="summary-stat-icon">⚡</span>
            <span className="summary-stat-value">+{xpEarned}</span>
            <span className="summary-stat-label">XP ganado</span>
          </div>
          <div className="summary-stat">
            <span className="summary-stat-icon">🎯</span>
            <span className="summary-stat-value">{accuracy}%</span>
            <span className="summary-stat-label">Precisión</span>
          </div>
          <div className="summary-stat">
            <span className="summary-stat-icon">✅</span>
            <span className="summary-stat-value">{correctCount}/{totalExercises}</span>
            <span className="summary-stat-label">Correctas</span>
          </div>
        </div>

        <button className="summary-btn" onClick={handleContinue}>
          CONTINUAR
        </button>
      </div>
    </div>
  )
}