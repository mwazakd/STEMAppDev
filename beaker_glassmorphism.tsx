import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Droplets } from 'lucide-react';

export default function GlassmorphismBeaker() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const beakerRef = useRef(null);
  const liquidRef = useRef(null);
  const animationIdRef = useRef(null);
  const mouseDownRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3 });
  
  const [liquidColor, setLiquidColor] = useState('#4488ff');
  const [liquidLevel, setLiquidLevel] = useState(50);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(0);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(5, 3, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lighting setup for glassmorphism effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    scene.add(mainLight);
    
    // Rim lights for glass effect
    const rimLight1 = new THREE.PointLight(0x4488ff, 1.5, 20);
    rimLight1.position.set(-3, 2, 3);
    scene.add(rimLight1);
    
    const rimLight2 = new THREE.PointLight(0xff88cc, 1.5, 20);
    rimLight2.position.set(3, 2, -3);
    scene.add(rimLight2);
    
    const topLight = new THREE.SpotLight(0xffffff, 0.8);
    topLight.position.set(0, 10, 0);
    topLight.angle = Math.PI / 6;
    topLight.penumbra = 0.5;
    topLight.castShadow = true;
    scene.add(topLight);
    
    // Environment for reflections
    const envGeometry = new THREE.SphereGeometry(50, 32, 32);
    const envMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a1a3e,
      side: THREE.BackSide
    });
    const envSphere = new THREE.Mesh(envGeometry, envMaterial);
    scene.add(envSphere);
    
    // Floor/Platform
    const platformGeometry = new THREE.CylinderGeometry(3, 3, 0.3, 64);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a4a,
      roughness: 0.3,
      metalness: 0.8
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -2;
    platform.receiveShadow = true;
    scene.add(platform);
    
    // Create beaker with advanced glassmorphism
    const beakerGroup = new THREE.Group();
    beakerRef.current = beakerGroup;
    
    // Beaker wall - ultra-realistic glass
    const wallGeometry = new THREE.CylinderGeometry(1.5, 1.6, 4, 64, 1, true);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      roughness: 0.02,
      metalness: 0.1,
      transmission: 0.98,
      thickness: 0.8,
      envMapIntensity: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      ior: 1.52,
      reflectivity: 0.9,
      side: THREE.DoubleSide
    });
    const beakerWall = new THREE.Mesh(wallGeometry, glassMaterial);
    beakerWall.castShadow = true;
    beakerWall.receiveShadow = true;
    beakerGroup.add(beakerWall);
    
    // Beaker bottom
    const bottomGeometry = new THREE.CylinderGeometry(1.6, 1.6, 0.2, 64);
    const beakerBottom = new THREE.Mesh(bottomGeometry, glassMaterial.clone());
    beakerBottom.position.y = -2;
    beakerBottom.castShadow = true;
    beakerBottom.receiveShadow = true;
    beakerGroup.add(beakerBottom);
    
    // Top rim with slight thickness for realism
    const rimGeometry = new THREE.TorusGeometry(1.5, 0.08, 16, 64);
    const rimMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.01,
      metalness: 0.2,
      transmission: 0.95,
      thickness: 0.5,
      clearcoat: 1.0,
      ior: 1.52
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.y = 2;
    rim.rotation.x = Math.PI / 2;
    beakerGroup.add(rim);
    
    // Measurement markings on glass
    for (let i = 0; i < 5; i++) {
      const markGeometry = new THREE.TorusGeometry(1.52, 0.01, 8, 32);
      const markMaterial = new THREE.MeshBasicMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.4
      });
      const mark = new THREE.Mesh(markGeometry, markMaterial);
      mark.position.y = -1.5 + i * 0.8;
      mark.rotation.x = Math.PI / 2;
      beakerGroup.add(mark);
    }
    
    scene.add(beakerGroup);
    
    // Liquid with realistic appearance
    const liquidGeometry = new THREE.CylinderGeometry(1.45, 1.55, 0.1, 64);
    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.3,
      thickness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      ior: 1.33,
      reflectivity: 0.5
    });
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid.position.y = -1;
    liquidRef.current = liquid;
    beakerGroup.add(liquid);
    
    // Liquid surface with fresnel effect
    const surfaceGeometry = new THREE.CircleGeometry(1.45, 64);
    const surfaceMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.05,
      metalness: 0.3,
      transmission: 0.4,
      clearcoat: 1.0,
      side: THREE.DoubleSide
    });
    const liquidSurface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    liquidSurface.rotation.x = -Math.PI / 2;
    liquidSurface.position.y = -1;
    beakerGroup.add(liquidSurface);
    
    // Add some bubbles for realism
    const bubbleGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const bubbleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      transmission: 0.95,
      roughness: 0,
      metalness: 0,
      ior: 1.33
    });
    
    for (let i = 0; i < 8; i++) {
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      const angle = (i / 8) * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.8;
      bubble.position.x = Math.cos(angle) * radius;
      bubble.position.z = Math.sin(angle) * radius;
      bubble.position.y = -1.5 + Math.random() * 0.5;
      bubble.scale.setScalar(0.5 + Math.random() * 1);
      beakerGroup.add(bubble);
    }
    
    // Add glowing particles in liquid
    const particleCount = 30;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.3;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = -1.5 + Math.random() * 0.8;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.03,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    beakerGroup.add(particles);
    
    // Animation loop
    const animate = () => {
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        // Auto-rotate
        if (autoRotate && !mouseDownRef.current) {
          autoRotateRef.current += 0.003;
          const radius = 7;
          cameraAngleRef.current.theta = autoRotateRef.current;
          cameraRef.current.position.x = radius * Math.sin(cameraAngleRef.current.phi) * Math.cos(cameraAngleRef.current.theta);
          cameraRef.current.position.y = radius * Math.cos(cameraAngleRef.current.phi);
          cameraRef.current.position.z = radius * Math.sin(cameraAngleRef.current.phi) * Math.sin(cameraAngleRef.current.theta);
          cameraRef.current.lookAt(0, 0, 0);
        }
        
        // Animate rim lights for dynamic glass effect
        const time = Date.now() * 0.001;
        rimLight1.position.x = Math.cos(time * 0.5) * 4;
        rimLight1.position.z = Math.sin(time * 0.5) * 4;
        rimLight2.position.x = Math.cos(time * 0.5 + Math.PI) * 4;
        rimLight2.position.z = Math.sin(time * 0.5 + Math.PI) * 4;
        
        // Animate particles
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += Math.sin(time + i) * 0.001;
          if (positions[i * 3 + 1] > -0.7) {
            positions[i * 3 + 1] = -1.5;
          }
        }
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Slight liquid surface animation
        if (liquidSurface) {
          liquidSurface.position.y = -1 + Math.sin(time * 2) * 0.01;
        }
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();
    
    // Mouse controls
    const handleMouseDown = (e) => {
      mouseDownRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      setAutoRotate(false);
    };
    
    const handleMouseMove = (e) => {
      if (mouseDownRef.current && cameraRef.current) {
        const deltaX = e.clientX - lastMouseRef.current.x;
        const deltaY = e.clientY - lastMouseRef.current.y;
        
        cameraAngleRef.current.theta -= deltaX * 0.005;
        cameraAngleRef.current.phi -= deltaY * 0.005;
        cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleRef.current.phi));
        
        const radius = 7;
        cameraRef.current.position.x = radius * Math.sin(cameraAngleRef.current.phi) * Math.cos(cameraAngleRef.current.theta);
        cameraRef.current.position.y = radius * Math.cos(cameraAngleRef.current.phi);
        cameraRef.current.position.z = radius * Math.sin(cameraAngleRef.current.phi) * Math.sin(cameraAngleRef.current.theta);
        cameraRef.current.lookAt(0, 0, 0);
        
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };
    
    const handleMouseUp = () => {
      mouseDownRef.current = false;
    };
    
    const handleWheel = (e) => {
      e.preventDefault();
      if (cameraRef.current) {
        const delta = e.deltaY * 0.01;
        const direction = new THREE.Vector3();
        cameraRef.current.getWorldDirection(direction);
        cameraRef.current.position.addScaledVector(direction, delta);
      }
    };
    
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel);
    
    const handleResize = () => {
      if (mountRef.current && cameraRef.current && rendererRef.current) {
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);
  
  // Update liquid color
  useEffect(() => {
    if (liquidRef.current) {
      liquidRef.current.material.color.setStyle(liquidColor);
    }
  }, [liquidColor]);
  
  // Update liquid level
  useEffect(() => {
    if (liquidRef.current && beakerRef.current) {
      const scale = liquidLevel / 100;
      const height = scale * 3.5;
      liquidRef.current.scale.y = height * 10;
      liquidRef.current.position.y = -1.8 + (height / 2);
      
      // Update surface position
      const children = beakerRef.current.children;
      for (let child of children) {
        if (child.geometry && child.geometry.type === 'CircleGeometry') {
          child.position.y = liquidRef.current.position.y + (height * 0.5);
        }
      }
    }
  }, [liquidLevel]);
  
  return (
    <div className="w-full h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex flex-col">
      <div className="bg-black bg-opacity-50 backdrop-blur-md p-6 border-b border-cyan-500 border-opacity-40 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Droplets className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Glassmorphism Beaker</h1>
          </div>
          <p className="text-cyan-200 text-sm">Ultra-realistic glass beaker with advanced material properties</p>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-black bg-opacity-40 backdrop-blur-lg p-6 border-r border-cyan-500 border-opacity-30 overflow-y-auto">
          <h2 className="text-2xl font-bold text-cyan-300 mb-6">Controls</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-3">
                Liquid Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['#4488ff', '#ff4488', '#44ff88', '#ffaa44', '#aa44ff', '#ff88cc', '#88ffcc', '#ccff88'].map(color => (
                  <button
                    key={color}
                    onClick={() => setLiquidColor(color)}
                    className={`w-full h-12 rounded-lg border-2 transition-all ${
                      liquidColor === color ? 'border-white scale-110' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-3">
                Liquid Level: {liquidLevel}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={liquidLevel}
                onChange={(e) => setLiquidLevel(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
            
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                autoRotate
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {autoRotate ? '🔄 Auto-Rotate ON' : '⏸️ Auto-Rotate OFF'}
            </button>
            
            <div className="bg-indigo-900 bg-opacity-60 p-4 rounded-lg border border-indigo-500">
              <h3 className="text-sm font-semibold text-cyan-300 mb-2">Glass Features:</h3>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>✨ High transmission (98%)</li>
                <li>💎 Realistic refraction (IOR: 1.52)</li>
                <li>🌟 Clearcoat for shine</li>
                <li>🎨 Dynamic rim lighting</li>
                <li>💧 Animated liquid particles</li>
                <li>🫧 Realistic bubbles</li>
                <li>📏 Measurement markings</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="flex-1 relative">
          <div ref={mountRef} className="w-full h-full" />
          <div className="absolute top-6 left-6 bg-black bg-opacity-70 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-xl">
            <p className="font-semibold text-sm">🖱️ Drag to rotate • Scroll to zoom</p>
          </div>
          <div className="absolute bottom-6 left-6 bg-black bg-opacity-70 backdrop-blur-sm text-cyan-300 px-4 py-3 rounded-lg shadow-xl max-w-md">
            <p className="text-xs leading-relaxed">
              This beaker features advanced glassmorphism with 98% transmission, 
              realistic refraction, clearcoat shine, and dynamic lighting. 
              The glass material uses physical properties to simulate real-world behavior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}