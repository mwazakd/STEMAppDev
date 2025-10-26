import { useState } from 'react'
import TitrationSimulator3D from './titration-3d-sim-simple'
import GlassmorphismBeaker from './components/GlassmorphismBeaker'
import TestGlassmorphism from './components/TestGlassmorphism'

function App() {
  const [useAdvanced3D, setUseAdvanced3D] = useState(true) // Default to advanced 3D
  const [useGlassmorphism, setUseGlassmorphism] = useState(false) // Toggle for glassmorphism beaker
  const [useTestGlassmorphism, setUseTestGlassmorphism] = useState(false) // Toggle for test glassmorphism


  // Use the test glassmorphism beaker if enabled
  if (useTestGlassmorphism) {
    return <TestGlassmorphism />
  }

  // Use the glassmorphism beaker if enabled
  if (useGlassmorphism) {
    return (
      <div>
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px'
        }}>
          <button
            onClick={() => {
              setUseGlassmorphism(false);
              setUseAdvanced3D(false);
            }}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            ← Back to Original
          </button>
          <button
            onClick={() => setUseAdvanced3D(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Use Advanced 3D Simulator
          </button>
        </div>
        <GlassmorphismBeaker />
      </div>
    )
  }

  // Use the advanced 3D simulator if enabled
  if (useAdvanced3D) {
    return (
      <div>
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px'
        }}>
          <button
            onClick={() => {
              setUseGlassmorphism(false);
              setUseAdvanced3D(false);
            }}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            ← Back to Original
          </button>
          <button
            onClick={() => setUseGlassmorphism(true)}
            style={{
              background: 'linear-gradient(135deg, #48cae4 0%, #023e8a 100%)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Use Glassmorphism Beaker
          </button>
        </div>
        <TitrationSimulator3D />
      </div>
    )
  }

  // Default to advanced 3D simulator (no original white background simulator)
  return (
    <div>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <button
          onClick={() => setUseGlassmorphism(true)}
          style={{
            background: 'linear-gradient(135deg, #48cae4 0%, #023e8a 100%)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Use Glassmorphism Beaker
        </button>
        <button
          onClick={() => setUseTestGlassmorphism(true)}
          style={{
            background: 'linear-gradient(135deg, #48cae4 0%, #023e8a 100%)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test Glassmorphism
        </button>
        <span style={{ fontSize: '12px' }}>Switch between different versions</span>
      </div>
      <TitrationSimulator3D />
    </div>
  )
}

export default App
