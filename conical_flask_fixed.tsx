import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Droplets } from 'lucide-react';

export default function GlassmorphismConicalFlask() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const flaskRef = useRef(null);
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
    
    // Create conical flask with advanced glassmorphism
    const flaskGroup = new THREE.Group();
    flaskRef.current = flaskGroup;
    
    // Glass material - ultra-realistic
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
    
    // Conical body (main part)
    const coneGeometry = new THREE.CylinderGeometry(0.4, 1.8, 3.5, 64, 1, true);
    const cone = new THREE.Mesh(coneGeometry, glassMaterial);
    cone.position.y = -0.25;
    cone.castShadow = true;
    cone.receiveShadow = true;
    flaskGroup.add(cone);
    
    // Flat bottom
    const bottomGeometry = new THREE.CircleGeometry(1.8, 64);
    const bottom = new THREE.Mesh(bottomGeometry, glassMaterial.clone());
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = -2;
    bottom.castShadow = true;
    bottom.receiveShadow = true;
    flaskGroup.add(bottom);
    
    // Cylindrical neck (narrow top part)
    const neckGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 64, 1, true);
    const neck = new THREE.Mesh(neckGeometry, glassMaterial.clone());
    neck.position.y = 2.1;
    neck.castShadow = true;
    neck.receiveShadow = true;
    flaskGroup.add(neck);
    
    // Top rim with thickness
    const rimGeometry = new THREE.TorusGeometry(0.4, 0.06, 16, 64);
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
    rim.position.y = 2.7;
    rim.rotation.x = Math.PI / 2;
    flaskGroup.add(rim);
    
    // Measurement markings on conical body
    for (let i = 0; i < 4; i++) {
      const y = -1.5 + i * 0.7;
      const radius = 1.8 - (i * 0.35); // Gets smaller as we go up the cone
      const markGeometry = new THREE.TorusGeometry(radius, 0.008, 8, 32);
      const markMaterial = new THREE.MeshBasicMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.5
      });
      const mark = new THREE.Mesh(markGeometry, markMaterial);
      mark.position.y = y;
      mark.rotation.x = Math.PI / 2;
      flaskGroup.add(mark);
    }
    
    scene.add(flaskGroup);
    
    // Liquid with realistic appearance (conical shape matching flask interior)
    // Create liquid as a cone that matches the flask shape
    const liquidGeometry = new THREE.CylinderGeometry(0.38, 1.75, 1.0, 64);
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
      reflectivity: 0.5,
      side: THREE.DoubleSide
    });
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid.position.y = -1.5;
    liquidRef.current = liquid;
    flaskGroup.add(liquid);
    
    // Add some bubbles for realism
    const bubbleGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const bubbleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      transmission: 0.95,
      roughness: 0,
      metalness: 0,
      ior: 1.33
    });
    
    for (let i = 0; i < 10; i++) {
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      const angle = (i / 10) * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.6;
      bubble.position.x = Math.cos(angle) * radius;
      bubble.position.z = Math.sin(angle) * radius;
      bubble.position.y = -1.8 + Math.random() * 0.4;
      bubble.scale.setScalar(0.5 + Math.random() * 1.2);
      flaskGroup.add(bubble);
    }
    
    // Add glowing particles in liquid
    const particleCount = 35;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.9;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = -1.8 + Math.random() * 1.0;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.025,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    flaskGroup.add(particles);
    
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
          if (positions[i * 3 + 1] > -0.5) {
            positions[i * 3 + 1] = -1.8;
          }
        }
        particles.geometry.attributes.position.needsUpdate = true;
        
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
    if (liquidRef.current) {
      const scale = liquidLevel / 100;
      
      // Flask dimensions: bottom radius = 1.8, top radius = 0.4, height = 3.5
      // Liquid sits from y=-2 (bottom) to variable height
      const maxLiquidHeight = 3.4; // Max height liquid can reach in cone
      const currentHeight = scale * maxLiquidHeight;
      
      // Calculate top and bottom radius for liquid at this height
      const flaskBottomRadius = 1.75; // Slightly smaller than flask to sit inside
      const flaskTopRadius = 0.38;
      const flaskHeight = 3.5;
      
      // For a cone, radius changes linearly with height
      // At height h from bottom: radius = bottomRadius - (bottomRadius - topRadius) * (h / totalHeight)
      const liquidTopRadius = flaskBottomRadius - (flaskBottomRadius - flaskTopRadius) * (currentHeight / flaskHeight);
      
      // Update liquid geometry to be a cone from bottom to current height
      const newGeometry = new THREE.CylinderGeometry(
        liquidTopRadius, 
        flaskBottomRadius, 
        currentHeight, 
        64
      );
      
      // Dispose old geometry to prevent memory leak
      liquidRef.current.geometry.dispose();
      liquidRef.current.geometry = newGeometry;
      
      // Position liquid so its bottom is at y=-2 (flask bottom)
      liquidRef.current.position.y = -2 + (currentHeight / 2);
      
      // Update liquid color
      liquidRef.current.material.color.setStyle(liquidColor);
    }
  }, [liquidLevel, liquidColor]);
  
  return (
    <div className="w-full h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex flex-col">
      <div className="bg-black bg-opacity-50 backdrop-blur-md p-6 border-b border-cyan-500 border-opacity-40 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Droplets className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Glassmorphism Conical Flask</h1>
          </div>
          <p className="text-cyan-200 text-sm">Ultra-realistic Erlenmeyer flask with advanced material properties</p>
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
              <h3 className="text-sm font-semibold text-cyan-300 mb-2">Flask Features:</h3>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>✨ High transmission (98%)</li>
                <li>💎 Realistic refraction (IOR: 1.52)</li>
                <li>🌟 Clearcoat for shine</li>
                <li>🎨 Dynamic rim lighting</li>
                <li>💧 Animated liquid particles</li>
                <li>🫧 Realistic bubbles</li>
                <li>📏 Measurement markings</li>
                <li>⚗️ Conical Erlenmeyer shape</li>
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
              This conical flask (Erlenmeyer) features advanced glassmorphism with 98% transmission, 
              realistic refraction, clearcoat shine, and dynamic lighting. 
              The liquid now properly conforms to the conical shape!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}