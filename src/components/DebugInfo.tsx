import { useState, useEffect } from 'react'

interface DebugInfoProps {
  chemistryEngine: any
}

export default function DebugInfo({ chemistryEngine }: DebugInfoProps) {
  const [debugInfo, setDebugInfo] = useState({
    objectsInScene: 0,
    lightsInScene: 0,
    materialsLoaded: 0,
    glbLoaded: false
  })

  useEffect(() => {
    const interval = setInterval(() => {
      // Check if Three.js objects are loaded
      const scene = (window as any).threeScene
      if (scene) {
        setDebugInfo({
          objectsInScene: scene.children.length,
          lightsInScene: scene.children.filter((child: any) => child.type === 'Light').length,
          materialsLoaded: Object.keys((window as any).THREE?.Cache?.files || {}).length,
          glbLoaded: (window as any).glbLoaded || false
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 1000,
      fontFamily: 'monospace'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Debug Info</h4>
      <div>Objects in scene: {debugInfo.objectsInScene}</div>
      <div>Lights: {debugInfo.lightsInScene}</div>
      <div>Materials: {debugInfo.materialsLoaded}</div>
      <div>GLB loaded: {debugInfo.glbLoaded ? '✅' : '❌'}</div>
      <div>pH: {chemistryEngine?.getCurrentPH()?.toFixed(2) || 'N/A'}</div>
      <div>Volume: {((chemistryEngine?.getCurrentState()?.volumeL || 0) * 1000).toFixed(1)} mL</div>
    </div>
  )
}
