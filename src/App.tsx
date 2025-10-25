import { useState } from 'react'
import TitrationSimulator3D from './titration-3d-sim-simple'
import SceneCanvas from './components/SceneCanvas'
import BuretteControls from './components/BuretteControls'
import BeakerUI from './components/BeakerUI'
import Graph from './components/Graph'
import Tutorial from './components/Tutorial'
import DebugInfo from './components/DebugInfo'
import { ChemistryEngine } from './lib/chemistry/engine'
import { TitrationDB } from './lib/storage/db'

function App() {
  const [chemistryEngine] = useState(() => new ChemistryEngine())
  const [db] = useState(() => new TitrationDB())
  const [isExperimentActive, setIsExperimentActive] = useState(false)
  const [showTutorial, setShowTutorial] = useState(true)
  const [, setCurrentExperiment] = useState<string | null>(null)
  const [useAdvanced3D, setUseAdvanced3D] = useState(true) // Toggle between simple and advanced 3D

  const handleStartExperiment = () => {
    chemistryEngine.reset()
    setIsExperimentActive(true)
    setCurrentExperiment(null)
  }

  const handleStopExperiment = () => {
    setIsExperimentActive(false)
  }

  const handleSaveExperiment = async () => {
    if (!isExperimentActive) return

    const experimentData = {
      id: Date.now().toString(36),
      name: `Experiment ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      titrationPoints: chemistryEngine.getTitrationPoints(),
      finalState: chemistryEngine.getCurrentState(),
      settings: {
        initialVolume: 0.1,
        dropletVolume: 0.0001,
        species: 'NaOH',
        concentration: 0.1
      }
    }

    try {
      await db.saveExperiment(experimentData)
      setCurrentExperiment(experimentData.id)
      console.log('Experiment saved:', experimentData.id)
    } catch (error) {
      console.error('Failed to save experiment:', error)
    }
  }

  const handleLoadExperiment = async (experimentId: string) => {
    try {
      const experiment = await db.getExperiment(experimentId)
      if (experiment) {
        // Reset and load experiment data
        chemistryEngine.reset()
        // Note: In a real implementation, you'd need to restore the chemistry state
        setCurrentExperiment(experimentId)
        setIsExperimentActive(true)
      }
    } catch (error) {
      console.error('Failed to load experiment:', error)
    }
  }

  // Use the advanced 3D simulator if enabled
  if (useAdvanced3D) {
    return <TitrationSimulator3D />
  }

  return (
    <div className="app-container">
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
        <span style={{ fontSize: '12px' }}>Switch to the advanced version</span>
      </div>

      <SceneCanvas 
        chemistryEngine={chemistryEngine}
        isActive={isExperimentActive}
      />
      
      <BuretteControls 
        onStart={handleStartExperiment}
        onStop={handleStopExperiment}
        onSave={handleSaveExperiment}
        isActive={isExperimentActive}
        canSave={chemistryEngine.getTitrationPoints().length > 0}
      />
      
      <BeakerUI 
        chemistryEngine={chemistryEngine}
        isActive={isExperimentActive}
      />
      
      <Graph 
        chemistryEngine={chemistryEngine}
        isActive={isExperimentActive}
      />

      {showTutorial && (
        <Tutorial 
          onClose={() => setShowTutorial(false)}
        />
      )}

      <DebugInfo chemistryEngine={chemistryEngine} />
    </div>
  )
}

export default App
