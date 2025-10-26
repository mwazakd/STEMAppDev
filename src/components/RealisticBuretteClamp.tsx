import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Grip } from 'lucide-react';

export default function RealisticBuretteClamp() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animRef = useRef<number | null>(null);

  const leftArmRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);
  const liquidRef = useRef<THREE.Mesh | null>(null);
  const meniscusRef = useRef<THREE.Mesh | null>(null);
  const stopcockRef = useRef<THREE.Group | null>(null);
  const streamRef = useRef<THREE.Mesh | null>(null);
  const labelGroupRef = useRef<THREE.Group | null>(null);

  const [gripWidth, setGripWidth] = useState(24); // Default to accommodate burette diameter (0.4 units)
  const [autoRotate, setAutoRotate] = useState(true);
  const [liquidLevel, setLiquidLevel] = useState(75);
  const [liquidColor, setLiquidColor] = useState("#1976d2");
  const [stopcockOpen, setStopcockOpen] = useState(false);
  const [dispensing, setDispensing] = useState(false);

  const thetaRef = useRef(0);
  const phiRef = useRef(Math.PI / 3);
  const autoAngleRef = useRef(0);
  const mouseDownRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(5, 3, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    const fillLight = new THREE.PointLight(0x4488ff, 0.8, 20);
    fillLight.position.set(-3, 3, 3);
    scene.add(fillLight);

    // Grid floor
    const gridHelper = new THREE.GridHelper(8, 16, 0x444444, 0x222222);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // Materials
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.3,
      metalness: 0.9
    });

    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95,
      metalness: 0.05
    });

    // Vertical mounting rod (off to the side)
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 5, 32),
      metalMat
    );
    rod.position.set(0, 0.5, -2);
    rod.castShadow = true;
    scene.add(rod);

    // Rod base (under the rod)
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.9, 0.4, 32),
      metalMat
    );
    base.position.set(0, -1.8, -2);
    base.castShadow = true;
    scene.add(base);

    // Mounting bracket (clamps onto the rod)
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.2, 0.4),
      metalMat
    );
    bracket.position.set(0, 0, -1.8);
    bracket.castShadow = true;
    scene.add(bracket);

    // Clamp collar that attaches to the vertical rod
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.08, 16, 32),
      metalMat
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0, -2);
    collar.castShadow = true;
    scene.add(collar);

    // Clamp screw for the collar
    const clampScrew = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 })
    );
    clampScrew.rotation.z = Math.PI / 2;
    clampScrew.position.set(0.25, 0, -2);
    scene.add(clampScrew);

    // LEFT ARM - Horizontal bar extending from back
    const leftArm = new THREE.Group();
    leftArmRef.current = leftArm;

    // Main horizontal arm (along Z axis)
    const leftBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.25, 3.5),
      metalMat
    );
    leftBar.castShadow = true;
    leftArm.add(leftBar);

    // Rubber pad on inner face (right side)
    const leftPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.15, 2.0),
      rubberMat
    );
    leftPad.position.x = 0.2;
    leftArm.add(leftPad);

    // Grooves for grip (along Z axis)
    for (let i = 0; i < 6; i++) {
      const groove = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.16, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1.0 })
      );
      groove.position.set(0.2, 0, -0.8 + i * 0.3);
      leftArm.add(groove);
    }

    leftArm.position.set(-0.8, 0, 0);
    scene.add(leftArm);

    // RIGHT ARM - Mirror of left (horizontal, along Z axis)
    const rightArm = new THREE.Group();
    rightArmRef.current = rightArm;

    const rightBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.25, 3.5),
      metalMat
    );
    rightBar.castShadow = true;
    rightArm.add(rightBar);

    const rightPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.15, 2.0),
      rubberMat
    );
    rightPad.position.x = -0.2;
    rightArm.add(rightPad);

    for (let i = 0; i < 6; i++) {
      const groove = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.16, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1.0 })
      );
      groove.position.set(-0.2, 0, -0.8 + i * 0.3);
      rightArm.add(groove);
    }

    rightArm.position.set(0.8, 0, 0);
    scene.add(rightArm);

    // Horizontal support beam connecting arms (connects to bracket)
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.15, 0.3),
      metalMat
    );
    beam.position.set(0, 0, -1.5);
    beam.castShadow = true;
    scene.add(beam);

    // Realistic Burette (replacing simple one)
    const buretteGroup = new THREE.Group();
    scene.add(buretteGroup);
    buretteGroup.position.set(0, 0, 0);

    const tubeVisibleLength = 3.2;
    const outerRadius = 0.2;
    const glassThickness = 0.035;
    const innerRadius = outerRadius - glassThickness;

    const outerGeom = new THREE.CylinderGeometry(outerRadius, outerRadius, tubeVisibleLength, 64, 1, true);
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
      transmission: 0.98,
      transparent: true,
      opacity: 0.12,
      roughness: 0.02,
      metalness: 0.02,
      ior: 1.52,
      thickness: 0.6,
      clearcoat: 1.0,
      side: THREE.DoubleSide
    });
    
    // Add gradient effect to glass using vertex colors
    const colors: number[] = [];
    const posAttr = outerGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      const t = (y + tubeVisibleLength / 2) / tubeVisibleLength;
      const r = 0.9 + t * 0.1;
      const g = 0.95 + t * 0.05;
      const b = 1.0;
      colors.push(r, g, b);
    }
    outerGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    glassMat.vertexColors = true;
    
    const outerMesh = new THREE.Mesh(outerGeom, glassMat);
    outerMesh.castShadow = true;
    buretteGroup.add(outerMesh);

    const innerGeom = new THREE.CylinderGeometry(innerRadius, innerRadius, tubeVisibleLength + 0.02, 64, 1, true);
    const innerMat = new THREE.MeshPhysicalMaterial({
      transmission: 0.99,
        transparent: true,
      opacity: 0.03,
      roughness: 0.01,
      metalness: 0.01,
      side: THREE.BackSide
    });
    const innerMesh = new THREE.Mesh(innerGeom, innerMat);
    buretteGroup.add(innerMesh);

    const funnel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, outerRadius, 0.6, 48),
      glassMat.clone()
    );
    funnel.position.y = tubeVisibleLength / 2 + 0.32;
    buretteGroup.add(funnel);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.135, 0.36, 32),
      glassMat.clone()
    );
    neck.position.y = -tubeVisibleLength / 2 - 0.24;
    buretteGroup.add(neck);

    const taperLength = 0.7;
    const taper = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, taperLength, 48),
      glassMat.clone()
    );
    taper.position.y = -tubeVisibleLength / 2 - 0.24 - taperLength / 2 - 0.08;
    taper.rotation.x = Math.PI;
    buretteGroup.add(taper);

    const outletOuter = 0.0125;
    const outlet = new THREE.Mesh(
      new THREE.CylinderGeometry(outletOuter, outletOuter, 0.14, 20),
      glassMat.clone()
    );
    outlet.position.y = taper.position.y - taperLength / 2 - 0.07;
    buretteGroup.add(outlet);

    const nozzleInner = new THREE.Mesh(
      new THREE.CylinderGeometry(outletOuter - 0.006, outletOuter - 0.006, 0.14 + 0.002, 12),
      new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.7 })
    );
    nozzleInner.position.copy(outlet.position);
    buretteGroup.add(nozzleInner);

    // Stopcock
    const scGroup = new THREE.Group();
    scGroup.position.y = -tubeVisibleLength / 2 - 0.26;
    stopcockRef.current = scGroup;

    const scBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.28, 32),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.25, metalness: 0.8 })
    );
    scBody.rotation.z = Math.PI / 2;
    scGroup.add(scBody);

    const scHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x7f7f7f, roughness: 0.25, metalness: 0.9 })
    );
    scHandle.position.x = 0;
    scGroup.add(scHandle);

    const scGrip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.16, 16),
      new THREE.MeshStandardMaterial({ color: 0xd9534f, roughness: 0.4, metalness: 0.1 })
    );
    scGrip.rotation.z = Math.PI / 2;
    scGrip.position.x = 0.36;
    scGroup.add(scGrip);

    buretteGroup.add(scGroup);

    // Liquid inside burette
    const maxLiquidHeight = tubeVisibleLength - 0.06;
    const liquidGeom = new THREE.CylinderGeometry(innerRadius - 0.004, innerRadius - 0.004, maxLiquidHeight, 64);
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(liquidColor),
      transparent: true,
      opacity: 0.86,
      roughness: 0.12,
      metalness: 0.02,
      transmission: 0.45,
      thickness: 0.18,
      ior: 1.33
    });
    const liquid = new THREE.Mesh(liquidGeom, liquidMat);
    liquid.castShadow = false;
    liquid.receiveShadow = false;
    liquidRef.current = liquid;
    liquid.position.y = -tubeVisibleLength / 2 + maxLiquidHeight / 2;
    buretteGroup.add(liquid);

    // Meniscus
    const menPts: THREE.Vector2[] = [];
    const menRadius = innerRadius - 0.002;
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const r = menRadius * (1 - 0.02 * Math.exp(-6 * t));
      const y = 0.02 * Math.sin(Math.PI * t) * -1;
      menPts.push(new THREE.Vector2(r, y));
    }
    const menGeo = new THREE.LatheGeometry(menPts, 64);
    const menMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(liquidColor),
      transparent: true,
      opacity: 0.6,
      transmission: 0.35,
      roughness: 0.03,
      ior: 1.33
    });
    const menMesh = new THREE.Mesh(menGeo, menMat);
    menMesh.rotation.x = Math.PI;
    meniscusRef.current = menMesh;
    buretteGroup.add(menMesh);

    // Dispensing stream
    const streamGeom = new THREE.CylinderGeometry(0.018, 0.02, 0.9, 12);
    const streamMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(liquidColor),
        transparent: true,
        opacity: 0.7,
      transmission: 0.6,
      roughness: 0.05
    });
    const streamMesh = new THREE.Mesh(streamGeom, streamMat);
    streamMesh.visible = false;
    streamRef.current = streamMesh;
    streamMesh.position.y = outlet.position.y - 0.5;
    scene.add(streamMesh);

    // Graduation labels
    const labels = new THREE.Group();
    labelGroupRef.current = labels;

    const majorCount = 3;
    const minorPerMajor = 5;
    const totalMinor = majorCount * minorPerMajor;

    for (let i = 0; i <= totalMinor; i++) {
      const fraction = i / totalMinor;
      const y = tubeVisibleLength / 2 - fraction * tubeVisibleLength - (tubeVisibleLength / 2);
      const isMajor = i % minorPerMajor === 0;
      const tickWidth = isMajor ? 0.04 : 0.02;
      const tickHeight = isMajor ? 0.012 : 0.008;

      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(tickWidth, tickHeight, 0.002),
        new THREE.MeshStandardMaterial({ color: 0xcfe6ff, emissive: 0x061423, roughness: 0.3 })
      );
      tick.position.set(outerRadius + 0.015, y, 0);
      labels.add(tick);

      if (isMajor) {
        const number = (i / minorPerMajor) * 10;
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#d8efff";
          ctx.font = "bold 30px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(number), canvas.width / 2, canvas.height / 2);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(0.36, 0.18, 1);
        sprite.position.set(outerRadius + 0.01, y, 0.0);
        sprite.center.set(0.0, 0.5);
        labels.add(sprite);
      }
    }

    buretteGroup.add(labels);

    // Liquid application function
    const applyLiquid = (pct: number) => {
      const clamped = Math.max(0, Math.min(100, pct));
      const scale = clamped / 100;
      if (liquidRef.current) {
        liquidRef.current.scale.y = scale;
        const full = maxLiquidHeight;
        const visibleH = full * scale;
        const bottomY = -tubeVisibleLength / 2 + visibleH / 2;
        liquidRef.current.position.y = bottomY;

        if (meniscusRef.current) {
          meniscusRef.current.position.y = bottomY + visibleH / 2 + 0.004;
          meniscusRef.current.visible = clamped > 0;
        }
      }
      const c = new THREE.Color(liquidColor);
      if (liquidRef.current && liquidRef.current.material instanceof THREE.MeshPhysicalMaterial) {
        liquidRef.current.material.color.set(c);
      }
      if (meniscusRef.current && meniscusRef.current.material instanceof THREE.MeshPhysicalMaterial) {
        meniscusRef.current.material.color.set(c);
      }
      if (streamRef.current && streamRef.current.material instanceof THREE.MeshPhysicalMaterial) {
        streamRef.current.material.color.set(c);
      }
    };

    applyLiquid(liquidLevel);

    // Animation loop
    const animate = () => {
      if (autoRotate && !mouseDownRef.current && cameraRef.current) {
        autoAngleRef.current += 0.003;
        const radius = 7;
        const theta = thetaRef.current + autoAngleRef.current;
        const phi = phiRef.current;
        cameraRef.current.position.x = radius * Math.sin(phi) * Math.cos(theta);
        cameraRef.current.position.y = radius * Math.cos(phi);
        cameraRef.current.position.z = radius * Math.sin(phi) * Math.sin(theta);
        cameraRef.current.lookAt(0, 0, 0);
      }

      // Handle dispensing
      if (dispensing && stopcockOpen && liquidRef.current) {
        if (streamRef.current) streamRef.current.visible = true;
        setLiquidLevel((prev) => {
          const next = Math.max(0, +(prev - 0.18).toFixed(2));
          // Don't call applyLiquid here - let the useEffect handle it
          if (next <= 0) {
            setDispensing(false);
            if (streamRef.current) streamRef.current.visible = false;
          }
          return next;
        });
      } else {
        if (streamRef.current) streamRef.current.visible = false;
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Mouse controls for camera orbit
    const onMouseDown = (e: MouseEvent) => {
      mouseDownRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      setAutoRotate(false);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDownRef.current || !cameraRef.current) return;
      
      const deltaX = e.clientX - lastMouseRef.current.x;
      const deltaY = e.clientY - lastMouseRef.current.y;
      
      thetaRef.current -= deltaX * 0.005;
      phiRef.current -= deltaY * 0.005;
      phiRef.current = Math.max(0.1, Math.min(Math.PI - 0.1, phiRef.current));
      
      const radius = 7;
      cameraRef.current.position.x = radius * Math.sin(phiRef.current) * Math.cos(thetaRef.current);
      cameraRef.current.position.y = radius * Math.cos(phiRef.current);
      cameraRef.current.position.z = radius * Math.sin(phiRef.current) * Math.sin(thetaRef.current);
      cameraRef.current.lookAt(0, 0, 0);
      
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      mouseDownRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (cameraRef.current) {
        const delta = e.deltaY * 0.01;
        const direction = new THREE.Vector3();
        cameraRef.current.getWorldDirection(direction);
        cameraRef.current.position.addScaledVector(direction, delta);
      }
    };

    // Click handling for stopcock
    const ray = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (ev: MouseEvent) => {
      if (!rendererRef.current || !cameraRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(mouse, cameraRef.current);
      if (stopcockRef.current) {
        const hits = ray.intersectObjects(stopcockRef.current.children, true);
        if (hits.length > 0) {
          setStopcockOpen((s) => !s);
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
    renderer.domElement.addEventListener('click', onClick);

    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('click', onClick);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  // Update arm positions based on grip width (horizontal movement along X axis)
  // Limited by the beam length (2.0 units total, so max 0.85 units from center)
  // This effect ensures arms maintain their grip width regardless of scene rotation
  useEffect(() => {
    const maxWidth = 0.85; // Maximum distance from center
    const width = (gripWidth / 100) * maxWidth;
    if (leftArmRef.current) {
      leftArmRef.current.position.x = -0.3 - width;
    }
    if (rightArmRef.current) {
      rightArmRef.current.position.x = 0.3 + width;
    }
  }, [gripWidth]);

  // Liquid level effect - handles both manual slider changes and dispensing
  useEffect(() => {
    const tubeVisibleLength = 3.2;
    const maxLiquidHeight = tubeVisibleLength - 0.06;
    if (liquidRef.current && meniscusRef.current) {
      const pct = Math.max(0, Math.min(100, liquidLevel));
      const scale = pct / 100;
      liquidRef.current.scale.y = scale;
      const visibleH = maxLiquidHeight * scale;
      const bottomY = -tubeVisibleLength / 2 + visibleH / 2;
      liquidRef.current.position.y = bottomY;
      meniscusRef.current.position.y = bottomY + visibleH / 2 + 0.004;
      meniscusRef.current.visible = pct > 0;
      
      // Update liquid color for all liquid-related meshes
      const c = new THREE.Color(liquidColor);
      if (liquidRef.current.material instanceof THREE.MeshPhysicalMaterial) {
        liquidRef.current.material.color.set(c);
      }
      if (meniscusRef.current.material instanceof THREE.MeshPhysicalMaterial) {
        meniscusRef.current.material.color.set(c);
      }
      if (streamRef.current && streamRef.current.material instanceof THREE.MeshPhysicalMaterial) {
        streamRef.current.material.color.set(c);
      }
    }
  }, [liquidLevel, liquidColor]);

  // Stopcock rotation effect
  useEffect(() => {
    if (!stopcockRef.current) return;
    stopcockRef.current.rotation.z = stopcockOpen ? Math.PI / 2 : 0;
  }, [stopcockOpen]);

  // Dispensing validation effect
  useEffect(() => {
    if (dispensing && !stopcockOpen) {
      setDispensing(false);
      alert("Open the stopcock first (click its handle) to dispense.");
    }
  }, [dispensing, stopcockOpen]);

  const toggleDispense = () => {
    if (!stopcockOpen) {
      alert("Open the stopcock (click handle) before dispensing.");
      return;
    }
    setDispensing((s) => !s);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col">
      <div className="bg-black bg-opacity-50 backdrop-blur-md p-5 border-b border-cyan-500 border-opacity-40">
        <div className="flex items-center gap-4">
          <Grip className="w-10 h-10 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Realistic Burette Clamp</h1>
            <p className="text-sm text-cyan-200">Professional lab clamp with realistic glass burette - complete with stopcock & graduations</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-black bg-opacity-40 backdrop-blur-lg p-6 border-r border-cyan-500 border-opacity-30">
          <h2 className="text-xl font-bold text-cyan-300 mb-6">Controls</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-3">
                Grip Width: {gripWidth}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={gripWidth}
                onChange={(e) => setGripWidth(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <p className="text-xs text-slate-400 mt-2">
                0% = closed tight, 100% = fully open
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-3">
                Liquid Color
              </label>
              <div className="flex gap-2">
                {["#1976d2", "#d32f2f", "#388e3c", "#f57c00", "#7b1fa2"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setLiquidColor(c)}
                    className={`w-8 h-8 rounded-md border-2 ${liquidColor === c ? "border-white" : "border-slate-600"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-3">
                Liquid Level: {liquidLevel.toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={liquidLevel}
                onChange={(e) => setLiquidLevel(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <button
                onClick={toggleDispense}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  dispensing ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {dispensing ? '🛑 Stop Dispensing' : '💧 Start Dispensing'}
              </button>
            </div>

            <div>
              <button
                onClick={() => setStopcockOpen((s) => !s)}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  stopcockOpen ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-700 hover:bg-gray-600'
                } text-white`}
              >
                {stopcockOpen ? '🔓 Stopcock Open' : '🔒 Stopcock Closed'}
              </button>
            </div>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                autoRotate ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'
              } text-white`}
            >
              {autoRotate ? '🔄 Auto-Rotate ON' : '⏸️ Auto-Rotate OFF'}
            </button>

            <div className="bg-indigo-900 bg-opacity-60 p-4 rounded-lg border border-indigo-500">
              <h3 className="text-sm font-semibold text-cyan-300 mb-3">Realistic Burette</h3>
              <ul className="text-xs text-slate-300 space-y-2">
                <li>🔬 <strong>Glass construction</strong> - realistic transparency & refraction</li>
                <li>📏 <strong>Graduation marks</strong> - precise volume measurements</li>
                <li>💧 <strong>Liquid meniscus</strong> - concave surface effect</li>
                <li>🔧 <strong>Stopcock valve</strong> - click to open/close</li>
                <li>🌊 <strong>Dispensing stream</strong> - visual liquid flow</li>
              </ul>
            </div>

            <div className="bg-purple-900 bg-opacity-60 p-4 rounded-lg border border-purple-500">
              <h3 className="text-sm font-semibold text-purple-300 mb-2">Clamp Features:</h3>
              <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                <li>Clamp collar attaches to vertical stand rod</li>
                <li>Arms extend horizontally forward</li>
                <li>Adjust grip width to hold burette securely</li>
                <li>Rubber pads protect glass from damage</li>
              </ol>
            </div>

            <div className="bg-green-900 bg-opacity-60 p-4 rounded-lg border border-green-500">
              <h3 className="text-sm font-semibold text-green-300 mb-2">Usage Tips:</h3>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Click stopcock handle to open/close</li>
                <li>• Adjust liquid level with slider</li>
                <li>• Change liquid color for different solutions</li>
                <li>• Start dispensing only when stopcock is open</li>
              </ul>
            </div>
          </div>
        </aside>

        <main className="flex-1 relative">
          <div ref={mountRef} className="w-full h-full" />
          <div className="absolute top-6 left-6 bg-black bg-opacity-70 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-xl">
            <p className="font-semibold text-sm">🖱️ Drag to rotate • Scroll to zoom • Click stopcock to open/close</p>
          </div>
          <div className="absolute bottom-6 right-6 bg-black bg-opacity-70 backdrop-blur-sm text-cyan-300 px-4 py-3 rounded-lg shadow-xl max-w-sm">
            <p className="text-xs leading-relaxed">
              <strong>Realistic Burette Clamp:</strong> Professional lab equipment with glass burette featuring 
              graduation marks, stopcock valve, liquid meniscus, and dispensing stream. 
              Adjust grip width to hold securely!
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}