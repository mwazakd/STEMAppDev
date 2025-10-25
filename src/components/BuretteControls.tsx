import { useState } from 'react'

interface BuretteControlsProps {
  onStart: () => void
  onStop: () => void
  onSave: () => void
  isActive: boolean
  canSave: boolean
}

export default function BuretteControls({ onStart, onStop, onSave, isActive, canSave }: BuretteControlsProps) {
  const [concentration, setConcentration] = useState(0.1)
  const [dropletSize, setDropletSize] = useState(0.1)

  return (
    <div className="controls-panel">
      <h3>Burette Controls</h3>
      
      <div className="slider">
        <label>Concentration (M): {concentration.toFixed(2)}</label>
        <input
          type="range"
          min="0.01"
          max="1.0"
          step="0.01"
          value={concentration}
          onChange={(e) => setConcentration(parseFloat(e.target.value))}
          disabled={isActive}
        />
      </div>

      <div className="slider">
        <label>Droplet Size (mL): {dropletSize.toFixed(1)}</label>
        <input
          type="range"
          min="0.05"
          max="0.5"
          step="0.05"
          value={dropletSize}
          onChange={(e) => setDropletSize(parseFloat(e.target.value))}
          disabled={isActive}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        {!isActive ? (
          <button 
            className="button" 
            onClick={onStart}
            style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' }}
          >
            Start Titration
          </button>
        ) : (
          <button 
            className="button" 
            onClick={onStop}
            style={{ background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' }}
          >
            Stop Titration
          </button>
        )}
        
        <button 
          className="button" 
          onClick={onSave}
          disabled={!canSave}
          style={{ 
            background: canSave ? 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' : '#ccc',
            cursor: canSave ? 'pointer' : 'not-allowed'
          }}
        >
          Save Experiment
        </button>
      </div>

      <div className="info-display">
        <p><strong>Instructions:</strong></p>
        <p>• Click or tap to add droplets</p>
        <p>• Press Space to add droplets</p>
        <p>• Watch the pH change and color transition</p>
        <p>• Save your experiment when done</p>
      </div>
    </div>
  )
}
