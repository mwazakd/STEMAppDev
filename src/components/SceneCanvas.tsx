import { useEffect, useRef } from 'react'
import { TitrationScene } from '../lib/three/scene'
import { ChemistryEngine } from '../lib/chemistry/engine'

interface SceneCanvasProps {
  chemistryEngine: ChemistryEngine
  isActive: boolean
}

export default function SceneCanvas({ chemistryEngine, isActive }: SceneCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<TitrationScene | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Three.js scene
    const scene = new TitrationScene(containerRef.current, chemistryEngine)
    sceneRef.current = scene

    // Handle window resize
    const handleResize = () => {
      if (sceneRef.current) {
        sceneRef.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (sceneRef.current) {
        sceneRef.current.dispose()
      }
    }
  }, [chemistryEngine])

  useEffect(() => {
    if (sceneRef.current) {
      if (isActive) {
        // Start dropping droplets
        // The scene will handle the dropping logic
      } else {
        // Stop dropping droplets
        sceneRef.current.stopDropping()
      }
    }
  }, [isActive])

  return (
    <div 
      ref={containerRef} 
      className="scene-container"
      style={{ 
        width: '100%', 
        height: '100%',
        cursor: isActive ? 'pointer' : 'default'
      }}
    />
  )
}
