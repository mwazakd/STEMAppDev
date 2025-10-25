import React, { useState, useEffect } from 'react'
import { ChemistryEngine } from '../lib/chemistry/engine'
import { getIndicatorColor, getIndicatorName, getIndicatorRange } from '../lib/chemistry/indicator'

interface BeakerUIProps {
  chemistryEngine: ChemistryEngine
  isActive: boolean
}

export default function BeakerUI({ chemistryEngine, isActive }: BeakerUIProps) {
  const [currentState, setCurrentState] = useState(chemistryEngine.getCurrentState())
  const [currentPH, setCurrentPH] = useState(chemistryEngine.getCurrentPH())
  const [indicatorType, setIndicatorType] = useState<'phenolphthalein' | 'methylOrange' | 'bromothymolBlue'>('phenolphthalein')

  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive) {
        setCurrentState(chemistryEngine.getCurrentState())
        setCurrentPH(chemistryEngine.getCurrentPH())
      }
    }, 100)

    return () => clearInterval(interval)
  }, [chemistryEngine, isActive])

  const indicatorColor = getIndicatorColor(currentPH, indicatorType)
  const indicatorName = getIndicatorName(indicatorType)
  const indicatorRange = getIndicatorRange(indicatorType)

  const getPHColor = (pH: number) => {
    if (pH < 3) return '#ff0000' // red
    if (pH < 6) return '#ff8000' // orange
    if (pH < 7) return '#ffff00' // yellow
    if (pH < 8) return '#80ff00' // yellow-green
    if (pH < 10) return '#00ff00' // green
    if (pH < 12) return '#00ff80' // blue-green
    return '#0000ff' // blue
  }

  return (
    <div className="beaker-info" style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      zIndex: 100,
      minWidth: '250px'
    }}>
      <h3>Solution Status</h3>
      
      <div className="info-display">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>pH:</span>
          <span style={{ 
            color: getPHColor(currentPH),
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            {currentPH.toFixed(2)}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Volume:</span>
          <span>{(currentState.volumeL * 1000).toFixed(1)} mL</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Temperature:</span>
          <span>{(currentState.temperature - 273.15).toFixed(1)}°C</span>
        </div>
      </div>

      <div style={{ marginTop: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Indicator:
        </label>
        <select 
          value={indicatorType} 
          onChange={(e) => setIndicatorType(e.target.value as any)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            background: 'white'
          }}
        >
          <option value="phenolphthalein">Phenolphthalein</option>
          <option value="methylOrange">Methyl Orange</option>
          <option value="bromothymolBlue">Bromothymol Blue</option>
        </select>
      </div>

      <div className="info-display" style={{ marginTop: '15px' }}>
        <p><strong>{indicatorName}</strong></p>
        <p>Range: {indicatorRange.color}</p>
        <p>pH: {indicatorRange.min} - {indicatorRange.max}</p>
        
        <div style={{ 
          marginTop: '10px',
          padding: '10px',
          borderRadius: '4px',
          background: `rgba(${Math.round(indicatorColor.r * 255)}, ${Math.round(indicatorColor.g * 255)}, ${Math.round(indicatorColor.b * 255)}, ${indicatorColor.a})`,
          border: '1px solid #ddd'
        }}>
          <p style={{ margin: 0, textAlign: 'center', fontWeight: 'bold' }}>
            Current Color
          </p>
        </div>
      </div>

      <div className="info-display" style={{ marginTop: '15px' }}>
        <p><strong>Species Present:</strong></p>
        {Object.entries(currentState.moles).map(([species, moles]) => (
          <div key={species} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{species}:</span>
            <span>{(moles * 1000).toFixed(3)} mmol</span>
          </div>
        ))}
        {Object.keys(currentState.moles).length === 0 && (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No species added yet</p>
        )}
      </div>
    </div>
  )
}
