import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Pause, RotateCcw, Info, Beaker } from 'lucide-react';
import * as THREE from 'three';

// Chemistry calculation utilities
const calculatePH = (concentration, volume, type, titrantConc, titrantVol, titrantType) => {
  const totalVol = volume + titrantVol;
  if (totalVol === 0) return type === 'acid' ? 1 : 13;
  
  const initialMoles = concentration * volume / 1000;
  const titrantMoles = titrantConc * titrantVol / 1000;
  
  let excessMoles = 0;
  let resultType = type;
  
  if (type === 'acid' && titrantType === 'base') {
    excessMoles = initialMoles - titrantMoles;
    if (excessMoles < 0) {
      resultType = 'base';
      excessMoles = Math.abs(excessMoles);
    }
  } else if (type === 'base' && titrantType === 'acid') {
    excessMoles = initialMoles - titrantMoles;
    if (excessMoles < 0) {
      resultType = 'acid';
      excessMoles = Math.abs(excessMoles);
    }
  }
  
  const excessConc = (excessMoles / totalVol) * 1000;
  
  if (excessConc < 1e-7) return 7.0;
  
  if (resultType === 'acid') {
    return Math.max(0, -Math.log10(excessConc));
  } else {
    return Math.min(14, 14 + Math.log10(excessConc));
  }
};

const getIndicatorColor = (pH) => {
  if (pH < 8.2) {
    return new THREE.Color(0.8, 0.8, 0.9);
  } else if (pH > 10) {
    return new THREE.Color(1.0, 0.1, 0.6);
  } else {
    const t = (pH - 8.2) / 1.8;
    return new THREE.Color(0.8 + (0.2 * t), 0.8 - (0.7 * t), 0.9 - (0.3 * t));
  }
};

const TitrationSimulator3D = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const beakerLiquidRef = useRef(null);
  const buretteLiquidRef = useRef(null);
  const dropletRef = useRef(null);
  const stirRodRef = useRef(null);
  const animationIdRef = useRef(null);
  
  // Experiment state
  const [solutionType, setSolutionType] = useState('acid');
  const [solutionConc, setSolutionConc] = useState(0.1);
  const [solutionVol, setSolutionVol] = useState(25);
  const [titrantType, setTitrantType] = useState('base');
  const [titrantConc, setTitrantConc] = useState(0.1);
  const [titrantAdded, setTitrantAdded] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [data, setData] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isStirring, setIsStirring] = useState(false);
  
  const lastUpdateRef = useRef(Date.now());
  const stirAngleRef = useRef(0);
  const mouseDownRef = useRef(false);
  const lastMouseXRef = useRef(0);
  
  // Calculate current pH
  const currentPH = useMemo(() => {
    return calculatePH(solutionConc, solutionVol, solutionType, titrantConc, titrantAdded, titrantType);
  }, [solutionConc, solutionVol, solutionType, titrantConc, titrantAdded, titrantType]);
  
  const indicatorColor = useMemo(() => getIndicatorColor(currentPH), [currentPH]);
  
  const equivalencePoint = useMemo(() => {
    const eqVol = (solutionConc * solutionVol) / titrantConc;
    return eqVol.toFixed(2);
  }, [solutionConc, solutionVol, titrantConc]);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4ff);
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);
    
    // Lab bench
    const benchGeometry = new THREE.BoxGeometry(15, 0.3, 8);
    const benchMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b7355,
      roughness: 0.8,
      metalness: 0.1
    });
    const bench = new THREE.Mesh(benchGeometry, benchMaterial);
    bench.position.y = -0.15;
    bench.receiveShadow = true;
    scene.add(bench);
    
    // Back wall
    const wallGeometry = new THREE.PlaneGeometry(15, 10);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xe8f0ff,
      side: THREE.DoubleSide
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 5, -4);
    wall.receiveShadow = true;
    scene.add(wall);
    
    // Beaker
    const beakerGroup = new THREE.Group();
    beakerGroup.position.set(0, 0, 0);
    
    // Beaker glass (cylinder with no top/bottom)
    const beakerGeometry = new THREE.CylinderGeometry(1, 1.1, 3, 32, 1, true);
    const beakerMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.9,
      thickness: 0.1
    });
    const beaker = new THREE.Mesh(beakerGeometry, beakerMaterial);
    beaker.castShadow = true;
    beaker.receiveShadow = true;
    beakerGroup.add(beaker);
    
    // Beaker base
    const baseGeometry = new THREE.CylinderGeometry(1.1, 1.1, 0.1, 32);
    const baseMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -1.5;
    beakerGroup.add(base);
    
    // Liquid in beaker
    const liquidGeometry = new THREE.CylinderGeometry(0.95, 1.05, 0.1, 32);
    const liquidMaterial = new THREE.MeshPhongMaterial({
      color: 0xccccee,
      transparent: true,
      opacity: 0.7,
      shininess: 100
    });
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid.position.y = -1;
    beakerLiquidRef.current = liquid;
    beakerGroup.add(liquid);
    
    scene.add(beakerGroup);
    
    // Burette stand
    const standGroup = new THREE.Group();
    standGroup.position.set(0, 0, 0);
    
    // Base plate
    const basePlateGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32);
    const standMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.8
    });
    const basePlate = new THREE.Mesh(basePlateGeometry, standMaterial);
    basePlate.position.y = 0.1;
    basePlate.castShadow = true;
    standGroup.add(basePlate);
    
    // Vertical rod
    const rodGeometry = new THREE.CylinderGeometry(0.08, 0.08, 7, 16);
    const rod = new THREE.Mesh(rodGeometry, standMaterial);
    rod.position.set(1.2, 3.5, 0);
    rod.castShadow = true;
    standGroup.add(rod);
    
    // Horizontal clamp arm
    const clampArmGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1.5, 16);
    const clampArm = new THREE.Mesh(clampArmGeometry, standMaterial);
    clampArm.position.set(0.5, 5, 0);
    clampArm.rotation.z = Math.PI / 2;
    standGroup.add(clampArm);
    
    scene.add(standGroup);
    
    // Burette
    const buretteGroup = new THREE.Group();
    buretteGroup.position.set(0, 5, 0);
    
    // Main burette tube
    const buretteGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 32, 1, true);
    const buretteMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.8
    });
    const buretteBody = new THREE.Mesh(buretteGeometry, buretteMaterial);
    buretteBody.castShadow = true;
    buretteGroup.add(buretteBody);
    
    // Burette liquid
    const buretteLiquidGeometry = new THREE.CylinderGeometry(0.13, 0.13, 4, 32);
    const buretteLiquidMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.6,
      shininess: 80
    });
    const buretteLiquid = new THREE.Mesh(buretteLiquidGeometry, buretteLiquidMaterial);
    buretteLiquid.position.y = 0;
    buretteLiquidRef.current = buretteLiquid;
    buretteGroup.add(buretteLiquid);
    
    // Burette tip
    const tipGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.3, 16);
    const tip = new THREE.Mesh(tipGeometry, buretteMaterial);
    tip.position.y = -2.15;
    buretteGroup.add(tip);
    
    // Stopcock
    const stopcockGeometry = new THREE.BoxGeometry(0.4, 0.08, 0.08);
    const stopcockMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const stopcock = new THREE.Mesh(stopcockGeometry, stopcockMaterial);
    stopcock.position.y = -1.9;
    buretteGroup.add(stopcock);
    
    scene.add(buretteGroup);
    
    // Droplet (initially hidden)
    const dropletGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const dropletMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.8,
      shininess: 100
    });
    const droplet = new THREE.Mesh(dropletGeometry, dropletMaterial);
    droplet.position.set(0, 2.7, 0);
    droplet.visible = false;
    dropletRef.current = droplet;
    scene.add(droplet);
    
    // Stirring rod
    const stirRodGeometry = new THREE.CylinderGeometry(0.03, 0.03, 3.5, 16);
    const stirRodMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x888888,
      roughness: 0.3,
      metalness: 0.7
    });
    const stirRod = new THREE.Mesh(stirRodGeometry, stirRodMaterial);
    stirRod.position.set(0.5, 0.5, 0);
    stirRod.rotation.z = 0.3;
    stirRod.visible = false;
    stirRodRef.current = stirRod;
    scene.add(stirRod);
    
    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Rotate camera slightly for dynamic view
      const time = Date.now() * 0.0001;
      camera.position.x = Math.sin(time) * 0.5;
      camera.lookAt(0, 2, 0);
      
      renderer.render(scene, camera);
    };
    animate();
    
    // Mouse controls for camera
    const handleMouseDown = (e) => {
      mouseDownRef.current = true;
      lastMouseXRef.current = e.clientX;
    };
    
    const handleMouseMove = (e) => {
      if (mouseDownRef.current) {
        const deltaX = e.clientX - lastMouseXRef.current;
        camera.position.x += deltaX * 0.01;
        camera.position.z -= deltaX * 0.005;
        camera.lookAt(0, 2, 0);
        lastMouseXRef.current = e.clientX;
      }
    };
    
    const handleMouseUp = () => {
      mouseDownRef.current = false;
    };
    
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    
    // Handle window resize
    const handleResize = () => {
      if (mountRef.current && camera && renderer) {
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);
  
  // Update liquid colors and levels
  useEffect(() => {
    if (beakerLiquidRef.current) {
      beakerLiquidRef.current.material.color = indicatorColor;
      
      // Update liquid height
      const maxHeight = 2.8;
      const liquidHeight = ((solutionVol + titrantAdded) / 100) * maxHeight;
      beakerLiquidRef.current.scale.y = liquidHeight;
      beakerLiquidRef.current.position.y = -1.5 + (liquidHeight / 2);
    }
    
    if (buretteLiquidRef.current) {
      const maxBuretteHeight = 4;
      const buretteLiquidHeight = ((100 - titrantAdded) / 100) * maxBuretteHeight;
      buretteLiquidRef.current.scale.y = buretteLiquidHeight / 4;
      buretteLiquidRef.current.position.y = 2 - (maxBuretteHeight - buretteLiquidHeight) / 2;
    }
  }, [indicatorColor, solutionVol, titrantAdded]);
  
  // Dispensing animation
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        const now = Date.now();
        const delta = (now - lastUpdateRef.current) / 1000;
        lastUpdateRef.current = now;
        
        const flowRate = 0.5;
        const increment = flowRate * delta;
        
        setTitrantAdded(prev => {
          const newVol = Math.min(prev + increment, 100);
          if (newVol >= 100) {
            setIsRunning(false);
          }
          return newVol;
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [isRunning]);
  
  // Droplet animation
  useEffect(() => {
    if (dropletRef.current) {
      if (isRunning) {
        dropletRef.current.visible = true;
        const interval = setInterval(() => {
          if (dropletRef.current) {
            dropletRef.current.position.y -= 0.05;
            if (dropletRef.current.position.y < 0) {
              dropletRef.current.position.y = 2.7;
            }
          }
        }, 50);
        return () => clearInterval(interval);
      } else {
        dropletRef.current.visible = false;
        dropletRef.current.position.y = 2.7;
      }
    }
  }, [isRunning]);
  
  // Stirring animation
  useEffect(() => {
    if (stirRodRef.current) {
      stirRodRef.current.visible = isStirring;
      
      if (isStirring) {
        const interval = setInterval(() => {
          stirAngleRef.current += 0.1;
          if (stirRodRef.current) {
            stirRodRef.current.position.x = Math.cos(stirAngleRef.current) * 0.3;
            stirRodRef.current.position.z = Math.sin(stirAngleRef.current) * 0.3;
            stirRodRef.current.rotation.y = stirAngleRef.current;
          }
        }, 30);
        return () => clearInterval(interval);
      }
    }
  }, [isStirring]);
  
  // Update data for graph
  useEffect(() => {
    if (titrantAdded > 0) {
      setData(prev => {
        const lastPoint = prev[prev.length - 1];
        if (!lastPoint || Math.abs(lastPoint.volume - titrantAdded) > 0.1) {
          return [...prev, { 
            volume: parseFloat(titrantAdded.toFixed(2)), 
            pH: parseFloat(currentPH.toFixed(2)) 
          }];
        }
        return prev;
      });
    }
  }, [titrantAdded, currentPH]);
  
  const toggleDispensing = () => {
    if (!isRunning) {
      lastUpdateRef.current = Date.now();
    }
    setIsRunning(!isRunning);
  };
  
  const reset = () => {
    setIsRunning(false);
    setTitrantAdded(0);
    setData([]);
  };
  
  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 to-indigo-900 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-black bg-opacity-30 backdrop-blur-sm p-4 border-b border-white border-opacity-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Beaker className="w-8 h-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">3D Titration Simulator</h1>
            </div>
            <button
              onClick={() => setShowTutorial(!showTutorial)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
            >
              <Info className="w-4 h-4" />
              {showTutorial ? 'Hide' : 'Show'} Tutorial
            </button>
          </div>
        </div>
        
        {/* Tutorial */}
        {showTutorial && (
          <div className="bg-yellow-900 bg-opacity-90 backdrop-blur-sm border-b border-yellow-600 p-4">
            <div className="max-w-7xl mx-auto">
              <h3 className="font-bold text-yellow-100 mb-2">How to Use:</h3>
              <ol className="list-decimal list-inside space-y-1 text-yellow-200 text-sm">
                <li>Configure your analyte and titrant solutions</li>
                <li>Click Start to begin dispensing titrant from the burette</li>
                <li>Click Stir to activate the magnetic stirrer</li>
                <li>Watch the solution color change as pH shifts</li>
                <li>Drag on the 3D view to rotate the camera</li>
                <li>Monitor the titration curve in real-time</li>
              </ol>
            </div>
          </div>
        )}
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="w-80 bg-black bg-opacity-40 backdrop-blur-sm p-6 overflow-y-auto border-r border-white border-opacity-20">
            <h2 className="text-xl font-bold text-white mb-4">Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Analyte (in beaker)
                </label>
                <select
                  value={solutionType}
                  onChange={(e) => setSolutionType(e.target.value)}
                  className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded-lg"
                  disabled={isRunning || titrantAdded > 0}
                >
                  <option value="acid">Acid (HCl)</option>
                  <option value="base">Base (NaOH)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Concentration: {solutionConc} M
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={solutionConc}
                  onChange={(e) => setSolutionConc(parseFloat(e.target.value))}
                  className="w-full"
                  disabled={isRunning || titrantAdded > 0}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Volume: {solutionVol} mL
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={solutionVol}
                  onChange={(e) => setSolutionVol(parseFloat(e.target.value))}
                  className="w-full"
                  disabled={isRunning || titrantAdded > 0}
                />
              </div>
              
              <hr className="border-gray-600 my-4" />
              
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Titrant (in burette)
                </label>
                <select
                  value={titrantType}
                  onChange={(e) => setTitrantType(e.target.value)}
                  className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded-lg"
                  disabled={isRunning || titrantAdded > 0}
                >
                  <option value="acid">Acid (HCl)</option>
                  <option value="base">Base (NaOH)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Concentration: {titrantConc} M
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={titrantConc}
                  onChange={(e) => setTitrantConc(parseFloat(e.target.value))}
                  className="w-full"
                  disabled={isRunning || titrantAdded > 0}
                />
              </div>
              
              <div className="bg-indigo-900 bg-opacity-50 p-3 rounded-lg border border-indigo-500">
                <p className="text-sm text-cyan-200">
                  <strong>Equivalence Point:</strong> {equivalencePoint} mL
                </p>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={toggleDispensing}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                  isRunning
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => setIsStirring(!isStirring)}
                className={`px-4 py-3 rounded-lg font-medium transition ${
                  isStirring
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Stir
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            
            {/* Status Display */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-cyan-900 bg-opacity-50 p-3 rounded-lg border border-cyan-500">
                <p className="text-xs text-cyan-300">pH</p>
                <p className="text-2xl font-bold text-cyan-100">{currentPH.toFixed(2)}</p>
              </div>
              <div className="bg-purple-900 bg-opacity-50 p-3 rounded-lg border border-purple-500">
                <p className="text-xs text-purple-300">Titrant Added</p>
                <p className="text-2xl font-bold text-purple-100">{titrantAdded.toFixed(1)} mL</p>
              </div>
            </div>
            
            {/* Analysis */}
            {data.length > 5 && (
              <div className="mt-4 p-3 bg-green-900 bg-opacity-50 rounded-lg border border-green-500">
                <p className="text-sm text-green-200">
                  <strong>Analysis:</strong> {
                    Math.abs(parseFloat(equivalencePoint) - titrantAdded) < 2
                      ? 'Near equivalence point!'
                      : titrantAdded < parseFloat(equivalencePoint)
                      ? 'Before equivalence point'
                      : 'Past equivalence point'
                  }
                </p>
              </div>
            )}
          </div>
          
          {/* Center - 3D View */}
          <div className="flex-1 relative">
            <div ref={mountRef} className="w-full h-full" />
            <div className="absolute top-4 left-4 bg-black bg-opacity-60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm">
              <p>Drag to rotate camera</p>
            </div>
          </div>
          
          {/* Right Panel - Graph */}
          <div className="w-96 bg-black bg-opacity-40 backdrop-blur-sm p-6 overflow-y-auto border-l border-white border-opacity-20">
            <h2 className="text-xl font-bold text-white mb-4">Titration Curve</h2>
            
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis
                    dataKey="volume"
                    label={{ value: 'Volume (mL)', position: 'insideBottom', offset: -5, fill: '#fff' }}
                    stroke="#fff"
                    tick={{ fill: '#fff' }}
                  />
                  <YAxis
                    domain={[0, 14]}
                    label={{ value: 'pH', angle: -90, position: 'insideLeft', fill: '#fff' }}
                    stroke="#fff"
                    tick={{ fill: '#fff' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pH"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400 border border-gray-600 rounded-lg">
                Start the titration to see the curve
              </div>
            )}
            
            <div className="mt-6 space-y-3">
              <div className="bg-gray-800 bg-opacity-60 p-3 rounded-lg">
                <h3 className="text-sm font-semibold text-cyan-300 mb-2">Key Points:</h3>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Steep curve = equivalence point region</li>
                  <li>• Color change occurs near pH 8-10</li>
                  <li>• Buffer region shows gradual pH change</li>
                </ul>
              </div>
              
              {data.length > 0 && (
                <div className="bg-gray-800 bg-opacity-60 p-3 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-300 mb-2">Current Data:</h3>
                  <p className="text-xs text-gray-300">Points collected: {data.length}</p>
                  <p className="text-xs text-gray-300">pH range: {Math.min(...data.map(d => d.pH)).toFixed(1)} - {Math.max(...data.map(d => d.pH)).toFixed(1)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitrationSimulator3D;