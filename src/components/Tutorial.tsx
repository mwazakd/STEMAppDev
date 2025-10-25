import React from 'react'

interface TutorialProps {
  onClose: () => void
}

export default function Tutorial({ onClose }: TutorialProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Welcome to Titration Simulator</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ lineHeight: '1.6', color: '#555' }}>
          <h3 style={{ color: '#333', marginTop: '20px' }}>🎯 What is Titration?</h3>
          <p>
            Titration is a laboratory technique used to determine the concentration of an unknown solution 
            by adding a known solution drop by drop until a chemical reaction is complete.
          </p>

          <h3 style={{ color: '#333', marginTop: '20px' }}>🧪 How to Use This Simulator</h3>
          <ol style={{ paddingLeft: '20px' }}>
            <li><strong>Start the Experiment:</strong> Click "Start Titration" to begin adding droplets</li>
            <li><strong>Add Droplets:</strong> Click anywhere on the scene or press Space to add droplets</li>
            <li><strong>Watch the Changes:</strong> Observe the pH changes and color transitions</li>
            <li><strong>Monitor the Graph:</strong> See the titration curve develop in real-time</li>
            <li><strong>Save Your Work:</strong> Click "Save Experiment" when finished</li>
          </ol>

          <h3 style={{ color: '#333', marginTop: '20px' }}>📊 Understanding the Interface</h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong>Burette Controls:</strong> Adjust concentration and droplet size</li>
            <li><strong>Solution Status:</strong> Monitor pH, volume, and chemical species</li>
            <li><strong>Indicator Selection:</strong> Choose different pH indicators</li>
            <li><strong>Titration Curve:</strong> Real-time graph of pH vs volume added</li>
          </ul>

          <h3 style={{ color: '#333', marginTop: '20px' }}>🔬 Key Concepts</h3>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
            <p><strong>pH Scale:</strong> 0-14 scale measuring acidity/alkalinity</p>
            <p><strong>Indicators:</strong> Chemicals that change color at specific pH ranges</p>
            <p><strong>Endpoint:</strong> The point where the indicator changes color</p>
            <p><strong>Equivalence Point:</strong> When moles of acid = moles of base</p>
          </div>

          <h3 style={{ color: '#333', marginTop: '20px' }}>🎮 Controls</h3>
          <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
            <p><strong>Mouse/Touch:</strong> Click to add droplets</p>
            <p><strong>Keyboard:</strong> Press Space to add droplets</p>
            <p><strong>Mobile:</strong> Tap the screen to interact</p>
          </div>

          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Ready to Start?</h3>
            <p style={{ margin: '0 0 20px 0' }}>Click "Start Titration" and begin your experiment!</p>
            <button 
              className="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid white',
                color: 'white'
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
