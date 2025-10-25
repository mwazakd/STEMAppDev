import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Pause, RotateCcw, Info, Beaker } from 'lucide-react';
import * as THREE from 'three';

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

export default function TitrationSimulator3D() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const beakerLiquidRef = useRef(null);
  const buretteLiquidRef = useRef(null);
  const dropletRef = useRef(null);
  const stirRodRef = useRef(null);
  const animationIdRef = useRef(null);
  
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
  const [sceneReady, setSceneReady] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  
  const lastUpdateRef = useRef(Date.now());
  const stirAngleRef = useRef(0);
  const mouseDownRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: 0, phi: Math.PI / 4 });
  const autoRotateRef = useRef(0);
  const buretteGroupRef = useRef(null);
  const stopcockRef = useRef(null);
  const beakerGroupRef = useRef(null);
  
  const currentPH = useMemo(() => {
    return calculatePH(solutionConc, solutionVol, solutionType, titrantConc, titrantAdded, titrantType);
  }, [solutionConc, solutionVol, solutionType, titrantConc, titrantAdded, titrantType]);
  
  const indicatorColor = useMemo(() => getIndicatorColor(currentPH), [currentPH]);
  
  const equivalencePoint = useMemo(() => {
    const eqVol = (solutionConc * solutionVol) / titrantConc;
    return eqVol.toFixed(2);
  }, [solutionConc, solutionVol, titrantConc]);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(8, 4, 8);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 15, 10);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);
    
    const benchGeometry = new THREE.BoxGeometry(20, 0.4, 12);
    const benchMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x6b4423,
      roughness: 0.8,
      metalness: 0.1
    });
    const bench = new THREE.Mesh(benchGeometry, benchMaterial);
    bench.position.y = -0.2;
    bench.receiveShadow = true;
    scene.add(bench);
    
    const beakerGroup = new THREE.Group();
    beakerGroup.position.set(0, 0, 0);
    beakerGroupRef.current = beakerGroup;
    
    const beakerWallGeometry = new THREE.CylinderGeometry(1.2, 1.3, 3.5, 32, 1, true);
    const beakerMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      roughness: 0.05,
      metalness: 0.05,
      transmission: 0.95,
      thickness: 0.5,
      side: THREE.DoubleSide
    });
    const beakerWall = new THREE.Mesh(beakerWallGeometry, beakerMaterial);
    beakerWall.castShadow = true;
    beakerWall.receiveShadow = true;
    beakerGroup.add(beakerWall);
    
    const beakerBottomGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.15, 32);
    const beakerBottom = new THREE.Mesh(beakerBottomGeometry, beakerMaterial);
    beakerBottom.position.y = -1.75;
    beakerGroup.add(beakerBottom);
    
    const liquidGeometry = new THREE.CylinderGeometry(1.15, 1.25, 0.1, 32);
    const liquidMaterial = new THREE.MeshPhongMaterial({
      color: 0xccccee,
      transparent: true,
      opacity: 0.8,
      shininess: 100
    });
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid.position.y = -1;
    beakerLiquidRef.current = liquid;
    beakerGroup.add(liquid);
    
    scene.add(beakerGroup);
    
    const standGroup = new THREE.Group();
    
    const basePlateGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.3, 32);
    const metalMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x444444,
      roughness: 0.4,
      metalness: 0.9
    });
    const basePlate = new THREE.Mesh(basePlateGeometry, metalMaterial);
    basePlate.position.y = 0.15;
    basePlate.castShadow = true;
    standGroup.add(basePlate);
    
    const rodGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8, 16);
    const verticalRod = new THREE.Mesh(rodGeometry, metalMaterial);
    verticalRod.position.set(1.5, 4, 0);
    verticalRod.castShadow = true;
    standGroup.add(verticalRod);
    
    const horizontalArmGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 16);
    const horizontalArm = new THREE.Mesh(horizontalArmGeometry, metalMaterial);
    horizontalArm.position.set(0.5, 6.5, 0);
    horizontalArm.rotation.z = Math.PI / 2;
    horizontalArm.castShadow = true;
    standGroup.add(horizontalArm);
    
    scene.add(standGroup);
    
    const buretteGroup = new THREE.Group();
    buretteGroup.position.set(0, 6.5, 0);
    buretteGroupRef.current = buretteGroup;
    
    const buretteTubeGeometry = new THREE.CylinderGeometry(0.18, 0.18, 5, 32, 1, true);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      metalness: 0.05,
      transmission: 0.9,
      thickness: 0.3
    });
    const buretteTube = new THREE.Mesh(buretteTubeGeometry, glassMaterial);
    buretteTube.castShadow = true;
    buretteGroup.add(buretteTube);
    
    const buretteLiquidGeometry = new THREE.CylinderGeometry(0.15, 0.15, 5, 32);
    const buretteLiquidMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.7,
      shininess: 100
    });
    const buretteLiquid = new THREE.Mesh(buretteLiquidGeometry, buretteLiquidMaterial);
    buretteLiquidRef.current = buretteLiquid;
    buretteGroup.add(buretteLiquid);
    
    const tipGeometry = new THREE.CylinderGeometry(0.04, 0.08, 0.5, 16);
    const tip = new THREE.Mesh(tipGeometry, glassMaterial);
    tip.position.y = -2.75;
    buretteGroup.add(tip);
    
    const stopcockGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.1);
    const stopcockMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x555555,
      roughness: 0.5,
      metalness: 0.7
    });
    const stopcock = new THREE.Mesh(stopcockGeometry, stopcockMaterial);
    stopcock.position.y = -2.4;
    stopcockRef.current = stopcock;
    buretteGroup.add(stopcock);
    
    scene.add(buretteGroup);
    
    const dropletGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const dropletMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.9,
      shininess: 100
    });
    const droplet = new THREE.Mesh(dropletGeometry, dropletMaterial);
    droplet.position.set(0, 3.5, 0);
    droplet.visible = false;
    dropletRef.current = droplet;
    scene.add(droplet);
    
    const stirRodGeometry = new THREE.CylinderGeometry(0.04, 0.04, 4, 16);
    const stirRodMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x999999,
      roughness: 0.2,
      metalness: 0.8
    });
    const stirRod = new THREE.Mesh(stirRodGeometry, stirRodMaterial);
    stirRod.position.set(0.6, 0.5, 0);
    stirRod.rotation.z = 0.2;
    stirRod.visible = false;
    stirRod.castShadow = true;
    stirRodRef.current = stirRod;
    scene.add(stirRod);
    
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    gridHelper.position.y = -0.4;
    scene.add(gridHelper);
    
    setSceneReady(true);
    
    const animate = () => {
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        if (autoRotate && !mouseDownRef.current) {
          autoRotateRef.current += 0.002;
          const radius = 12;
          cameraAngleRef.current.theta = autoRotateRef.current;
          cameraRef.current.position.x = radius * Math.sin(cameraAngleRef.current.phi) * Math.cos(cameraAngleRef.current.theta);
          cameraRef.current.position.y = radius * Math.cos(cameraAngleRef.current.phi) + 2;
          cameraRef.current.position.z = radius * Math.sin(cameraAngleRef.current.phi) * Math.sin(cameraAngleRef.current.theta);
          cameraRef.current.lookAt(0, 2, 0);
        }
        
        if (buretteGroupRef.current && isRunning) {
          buretteGroupRef.current.position.y = 6.5 + Math.sin(Date.now() * 0.01) * 0.02;
        }
        
        if (beakerGroupRef.current && isStirring) {
          const wobble = Math.sin(Date.now() * 0.003) * 0.01;
          beakerGroupRef.current.rotation.z = wobble;
        }
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();
    
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
        cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2, cameraAngleRef.current.phi));
        
        const radius = 12;
        cameraRef.current.position.x = radius * Math.sin(cameraAngleRef.current.phi) * Math.cos(cameraAngleRef.current.theta);
        cameraRef.current.position.y = radius * Math.cos(cameraAngleRef.current.phi) + 2;
        cameraRef.current.position.z = radius * Math.sin(cameraAngleRef.current.phi) * Math.sin(cameraAngleRef.current.theta);
        cameraRef.current.lookAt(0, 2, 0);
        
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
  
  useEffect(() => {
    if (beakerLiquidRef.current && sceneReady) {
      beakerLiquidRef.current.material.color = indicatorColor;
      
      const maxHeight = 3.2;
      const liquidHeight = ((solutionVol + titrantAdded) / 100) * maxHeight;
      beakerLiquidRef.current.scale.y = liquidHeight * 10;
      beakerLiquidRef.current.position.y = -1.7 + (liquidHeight / 2);
    }
    
    if (buretteLiquidRef.current && sceneReady) {
      const remaining = 100 - titrantAdded;
      const scale = remaining / 100;
      buretteLiquidRef.current.scale.y = scale;
      buretteLiquidRef.current.position.y = -2.5 * (1 - scale);
    }
  }, [indicatorColor, solutionVol, titrantAdded, sceneReady]);
  
  useEffect(() => {
    if (stopcockRef.current && sceneReady) {
      if (isRunning) {
        stopcockRef.current.rotation.z = Math.PI / 2;
      } else {
        stopcockRef.current.rotation.z = 0;
      }
    }
  }, [isRunning, sceneReady]);
  
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        const now = Date.now();
        const delta = (now - lastUpdateRef.current) / 1000;
        lastUpdateRef.current = now;
        
        const flowRate = 1.2; // Increased flow rate for continuous stream
        const increment = flowRate * delta;
        
        setTitrantAdded(prev => {
          const newVol = Math.min(prev + increment, 100);
          if (newVol >= 100) setIsRunning(false);
          return newVol;
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [isRunning]);
  
  useEffect(() => {
    if (dropletRef.current && sceneReady) {
      if (isRunning) {
        dropletRef.current.visible = true;
        // Create a continuous stream effect with multiple segments
        const streamGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8);
        const streamMaterial = new THREE.MeshPhongMaterial({
          color: 0x4488ff,
          transparent: true,
          opacity: 0.9,
          shininess: 100
        });
        
        // Create multiple stream segments for continuous flow
        const streamSegments = [];
        for (let i = 0; i < 8; i++) {
          const segment = new THREE.Mesh(streamGeometry, streamMaterial);
          segment.position.set(0, 3.5 - (i * 0.4), 0);
          segment.visible = true;
          sceneRef.current.add(segment);
          streamSegments.push(segment);
        }
        
        const interval = setInterval(() => {
          streamSegments.forEach((segment, index) => {
            segment.position.y -= 0.15;
            if (segment.position.y < -0.5) {
              segment.position.y = 3.5;
            }
          });
        }, 20);
        
        return () => {
          clearInterval(interval);
          streamSegments.forEach(segment => {
            sceneRef.current.remove(segment);
          });
        };
      } else {
        dropletRef.current.visible = false;
        dropletRef.current.position.y = 3.5;
      }
    }
  }, [isRunning, sceneReady]);
  
  useEffect(() => {
    if (stirRodRef.current && sceneReady) {
      stirRodRef.current.visible = isStirring;
      
      if (isStirring) {
        const interval = setInterval(() => {
          stirAngleRef.current += 0.15;
          if (stirRodRef.current) {
            stirRodRef.current.position.x = Math.cos(stirAngleRef.current) * 0.4;
            stirRodRef.current.position.z = Math.sin(stirAngleRef.current) * 0.4;
            stirRodRef.current.rotation.y = stirAngleRef.current;
          }
        }, 30);
        return () => clearInterval(interval);
      }
    }
  }, [isStirring, sceneReady]);
  
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
    if (!isRunning) lastUpdateRef.current = Date.now();
    setIsRunning(!isRunning);
  };
  
  const reset = () => {
    setIsRunning(false);
    setTitrantAdded(0);
    setData([]);
  };
  
  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 overflow-hidden flex flex-col">
      <div className="bg-black bg-opacity-40 backdrop-blur-md p-4 border-b border-cyan-500 border-opacity-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Beaker className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">3D Titration Simulator</h1>
          </div>
          <button
            onClick={() => setShowTutorial(!showTutorial)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition shadow-lg"
          >
            <Info className="w-4 h-4" />
            {showTutorial ? 'Hide' : 'Show'} Guide
          </button>
        </div>
      </div>
      
      {showTutorial && (
        <div className="bg-yellow-900 bg-opacity-95 backdrop-blur-sm border-b border-yellow-600 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <h3 className="font-bold text-yellow-100 mb-2 text-lg">Quick Guide:</h3>
            <div className="grid grid-cols-2 gap-4 text-yellow-200 text-sm">
              <ul className="space-y-1">
                <li>• Drag on 3D view to rotate camera</li>
                <li>• Scroll to zoom in/out</li>
                <li>• Start button begins titration</li>
                <li>• Auto-rotate shows all angles</li>
              </ul>
              <ul className="space-y-1">
                <li>• Stir activates the stirring rod</li>
                <li>• Watch stopcock rotate when dispensing</li>
                <li>• Monitor color change as pH shifts</li>
                <li>• Equipment vibrates realistically</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 bg-black bg-opacity-50 backdrop-blur-md p-6 overflow-y-auto border-r border-cyan-500 border-opacity-30 shadow-xl">
          <h2 className="text-xl font-bold text-cyan-300 mb-4">Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">
                Analyte (in beaker)
              </label>
              <select
                value={solutionType}
                onChange={(e) => setSolutionType(e.target.value)}
                className="w-full p-2 bg-gray-900 text-white border border-cyan-500 border-opacity-50 rounded-lg focus:border-cyan-400 focus:outline-none"
                disabled={isRunning || titrantAdded > 0}
              >
                <option value="acid">Acid (HCl)</option>
                <option value="base">Base (NaOH)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">
                Concentration: {solutionConc.toFixed(2)} M
              </label>
              <input
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                value={solutionConc}
                onChange={(e) => setSolutionConc(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
                disabled={isRunning || titrantAdded > 0}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">
                Volume: {solutionVol} mL
              </label>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={solutionVol}
                onChange={(e) => setSolutionVol(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
                disabled={isRunning || titrantAdded > 0}
              />
            </div>
            
            <hr className="border-gray-700 my-4" />
            
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">
                Titrant (in burette)
              </label>
              <select
                value={titrantType}
                onChange={(e) => setTitrantType(e.target.value)}
                className="w-full p-2 bg-gray-900 text-white border border-cyan-500 border-opacity-50 rounded-lg focus:border-cyan-400 focus:outline-none"
                disabled={isRunning || titrantAdded > 0}
              >
                <option value="acid">Acid (HCl)</option>
                <option value="base">Base (NaOH)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">
                Concentration: {titrantConc.toFixed(2)} M
              </label>
              <input
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                value={titrantConc}
                onChange={(e) => setTitrantConc(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
                disabled={isRunning || titrantAdded > 0}
              />
            </div>
            
            <div className="bg-indigo-900 bg-opacity-60 p-3 rounded-lg border border-indigo-500 shadow-inner">
              <p className="text-sm text-cyan-200">
                <strong>Equivalence Point:</strong> {equivalencePoint} mL
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={toggleDispensing}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition shadow-lg ${
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
              className={`px-4 py-3 rounded-lg font-semibold transition shadow-lg ${
                isStirring
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Stir
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-cyan-900 bg-opacity-60 p-3 rounded-lg border border-cyan-500 shadow-inner">
              <p className="text-xs text-cyan-300 mb-1">pH</p>
              <p className="text-2xl font-bold text-cyan-100">{currentPH.toFixed(2)}</p>
            </div>
            <div className="bg-purple-900 bg-opacity-60 p-3 rounded-lg border border-purple-500 shadow-inner">
              <p className="text-xs text-purple-300 mb-1">Volume Added</p>
              <p className="text-2xl font-bold text-purple-100">{titrantAdded.toFixed(1)} mL</p>
            </div>
          </div>
          
          {data.length > 5 && (
            <div className="mt-4 p-3 bg-green-900 bg-opacity-60 rounded-lg border border-green-500 shadow-inner">
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
        
        <div className="flex-1 relative">
          <div ref={mountRef} className="w-full h-full" />
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm shadow-lg">
            <p className="font-semibold">🖱️ Drag to rotate • 🖱️ Scroll to zoom</p>
          </div>
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-4 py-2 rounded-lg font-semibold transition shadow-lg ${
                autoRotate
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {autoRotate ? '🔄 Auto-Rotate ON' : '⏸️ Auto-Rotate OFF'}
            </button>
          </div>
          {!sceneReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-white text-xl">Loading 3D Scene...</div>
            </div>
          )}
        </div>
        
        <div className="w-96 bg-black bg-opacity-50 backdrop-blur-md p-6 overflow-y-auto border-l border-cyan-500 border-opacity-30 shadow-xl">
          <h2 className="text-xl font-bold text-cyan-300 mb-4">Titration Curve</h2>
          
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
            <div className="bg-gray-800 bg-opacity-60 p-3 rounded-lg border border-gray-600">
              <h3 className="text-sm font-semibold text-cyan-300 mb-2">Key Points:</h3>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Steep curve = equivalence point region</li>
                <li>• Color change occurs near pH 8-10</li>
                <li>• Buffer region shows gradual pH change</li>
              </ul>
            </div>
            
            {data.length > 0 && (
              <div className="bg-gray-800 bg-opacity-60 p-3 rounded-lg border border-gray-600">
                <h3 className="text-sm font-semibold text-purple-300 mb-2">Current Data:</h3>
                <p className="text-xs text-gray-300">Points collected: {data.length}</p>
                <p className="text-xs text-gray-300">pH range: {Math.min(...data.map(d => d.pH)).toFixed(1)} - {Math.max(...data.map(d => d.pH)).toFixed(1)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}