import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function GlassmorphismBurette() {
  const mountRef = useRef(null);

  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const animRef = useRef(null);

  const liquidRef = useRef(null);
  const meniscusRef = useRef(null);
  const stopcockRef = useRef(null);
  const streamRef = useRef(null);
  const labelGroupRef = useRef(null);

  const [liquidLevel, setLiquidLevel] = useState(75);
  const [liquidColor, setLiquidColor] = useState("#1976d2");
  const [stopcockOpen, setStopcockOpen] = useState(false);
  const [dispensing, setDispensing] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(6, 2.6, 6.5);
    camera.lookAt(0, 0.6, 0);
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(6, 10, 6);
    scene.add(dir);
    const rim = new THREE.PointLight(0x88ccff, 0.9, 30);
    rim.position.set(-6, 4, -4);
    scene.add(rim);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 0.2, 64),
      new THREE.MeshStandardMaterial({ color: 0x222630, roughness: 0.45, metalness: 0.6 })
    );
    base.position.y = -3.12;
    scene.add(base);

    const burette = new THREE.Group();
    scene.add(burette);
    burette.position.y = 2.1;

    const tubeVisibleLength = 6.0;
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
    const colors = [];
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
    burette.add(outerMesh);

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
    burette.add(innerMesh);

    const funnel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, outerRadius, 0.6, 48),
      glassMat.clone()
    );
    funnel.position.y = tubeVisibleLength / 2 + 0.32;
    burette.add(funnel);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.135, 0.36, 32),
      glassMat.clone()
    );
    neck.position.y = -tubeVisibleLength / 2 - 0.24;
    burette.add(neck);

    const taperLength = 0.7;
    const taper = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, taperLength, 48),
      glassMat.clone()
    );
    taper.position.y = -tubeVisibleLength / 2 - 0.24 - taperLength / 2 - 0.08;
    taper.rotation.x = Math.PI;
    burette.add(taper);

    const outletOuter = 0.0125;
    const outlet = new THREE.Mesh(
      new THREE.CylinderGeometry(outletOuter, outletOuter, 0.14, 20),
      glassMat.clone()
    );
    outlet.position.y = taper.position.y - taperLength / 2 - 0.07;
    burette.add(outlet);

    const nozzleInner = new THREE.Mesh(
      new THREE.CylinderGeometry(outletOuter - 0.006, outletOuter - 0.006, 0.14 + 0.002, 12),
      new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.7 })
    );
    nozzleInner.position.copy(outlet.position);
    burette.add(nozzleInner);

    const scGroup = new THREE.Group();
    scGroup.position.y = -tubeVisibleLength / 2 - 0.26;
    stopcockRef.current = scGroup;

    // Stopcock body (main cylinder)
    const scBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.28, 32),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.25, metalness: 0.8 })
    );
    scBody.rotation.z = Math.PI / 2;
    scGroup.add(scBody);

    // Stopcock handle (the rotating part)
    const scHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x7f7f7f, roughness: 0.25, metalness: 0.9 })
    );
    scHandle.position.x = 0;
    scGroup.add(scHandle);

    // Red grip with visual indicator bar
    const scGrip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.16, 16),
      new THREE.MeshStandardMaterial({ color: 0xd9534f, roughness: 0.4, metalness: 0.1 })
    );
    scGrip.rotation.z = Math.PI / 2;
    scGrip.position.x = 0.36;
    scGroup.add(scGrip);

    // Visual indicator bar (normal to the red grip)
    const indicatorBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.02, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.2, metalness: 0.8 })
    );
    indicatorBar.position.x = 0.36;
    indicatorBar.position.y = 0.08; // Position it above the grip
    scGroup.add(indicatorBar);

    burette.add(scGroup);

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
    burette.add(liquid);

    const menPts = [];
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
    burette.add(menMesh);

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

    const labels = new THREE.Group();
    labelGroupRef.current = labels;

    const majorCount = 5;
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
      // Position tick closer to glass surface
      tick.position.set(outerRadius + 0.015, y, 0);
      labels.add(tick);

      if (isMajor) {
        const number = (i / minorPerMajor) * 10;
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#d8efff";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(number), canvas.width / 2, canvas.height / 2);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(0.36, 0.18, 1);
        // Position label directly on the glass surface with minimal offset
        sprite.position.set(outerRadius + 0.01, y, 0.0);
        sprite.center.set(0.0, 0.5); // Anchor left edge to glass
        labels.add(sprite);
      }
    }

    burette.add(labels);

    const applyLiquid = (pct) => {
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
      if (liquidRef.current) liquidRef.current.material.color.set(c);
      if (meniscusRef.current) meniscusRef.current.material.color.set(c);
      if (streamRef.current) streamRef.current.material.color.set(c);
    };

    applyLiquid(liquidLevel);

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let theta = 0.8;
    let phi = 1.0;
    const onMouseDown = (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      setAutoRotate(false);
    };
    const onMouseMove = (e) => {
      if (!isDragging || !cameraRef.current) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      theta -= dx * 0.006;
      phi -= dy * 0.006;
      phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi));
      const r = 7.0;
      cameraRef.current.position.x = r * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.position.y = r * Math.cos(phi);
      cameraRef.current.position.z = r * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.lookAt(0, 0.6, 0);
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    const ray = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (ev) => {
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
    renderer.domElement.addEventListener("click", onClick);

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      if (autoRotate && !isDragging && cameraRef.current) {
        theta += 0.0025;
        const r = 7.0;
        cameraRef.current.position.x = r * Math.sin(phi) * Math.cos(theta);
        cameraRef.current.position.z = r * Math.sin(phi) * Math.sin(theta);
        cameraRef.current.lookAt(0, 0.6, 0);
      }

      if (dispensing && stopcockOpen && liquidRef.current) {
        if (streamRef.current) streamRef.current.visible = true;
        setLiquidLevel((prev) => {
          const next = Math.max(0, +(prev - 0.18).toFixed(2));
          applyLiquid(next);
          if (next <= 0) {
            setDispensing(false);
            if (streamRef.current) streamRef.current.visible = false;
          }
          return next;
        });
      } else {
        if (streamRef.current) streamRef.current.visible = false;
      }

      renderer.render(scene, camera);
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("click", onClick);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (liquidRef.current) {
      liquidRef.current.material.color.set(liquidColor);
    }
    if (meniscusRef.current) {
      meniscusRef.current.material.color.set(liquidColor);
    }
    if (streamRef.current) {
      streamRef.current.material.color.set(liquidColor);
    }
  }, [liquidColor]);

  useEffect(() => {
    const tubeVisibleLength = 6.0;
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
    }
  }, [liquidLevel]);

  useEffect(() => {
    if (!stopcockRef.current) return;
    // Rotate around X-axis (the axis of the stopcock body)
    stopcockRef.current.rotation.x = stopcockOpen ? Math.PI / 2 : 0;
  }, [stopcockOpen]);

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
    <div className="w-full h-screen bg-gradient-to-b from-slate-950 via-indigo-900 to-slate-900 text-white flex flex-col">
      <header className="p-4 border-b border-slate-700">
        <h1 className="text-2xl font-semibold">Realistic Burette — 3D (built from scratch)</h1>
        <p className="text-sm text-slate-300 mt-1">Tapered outlet, on-glass numeric graduations, concave meniscus.</p>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 p-4 bg-black bg-opacity-40 backdrop-blur-md border-r border-slate-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200">Liquid Color</label>
              <div className="flex gap-2 mt-2">
                {["#1976d2", "#d32f2f", "#388e3c", "#f57c00", "#7b1fa2"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setLiquidColor(c)}
                    className={`w-10 h-8 rounded-md border-2 ${liquidColor === c ? "border-white" : "border-slate-600"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">Liquid Level: {liquidLevel.toFixed(0)}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={liquidLevel}
                onChange={(e) => setLiquidLevel(parseInt(e.target.value))}
                className="w-full mt-2 accent-blue-500"
              />
            </div>

            <div>
              <button onClick={toggleDispense} className={`w-full py-2 rounded ${dispensing ? "bg-red-600" : "bg-green-600"} font-semibold`}>
                {dispensing ? "Stop Dispensing" : "Start Dispensing"}
              </button>
            </div>

            <div>
              <button onClick={() => setStopcockOpen((s) => !s)} className="w-full py-2 rounded bg-slate-700 hover:bg-slate-600">
                {stopcockOpen ? "Close Stopcock" : "Open Stopcock"}
              </button>
            </div>

            <div>
              <button onClick={() => setAutoRotate((s) => !s)} className="w-full py-2 rounded bg-slate-700 hover:bg-slate-600">
                {autoRotate ? "Auto-Rotate ON" : "Auto-Rotate OFF"}
              </button>
            </div>

            <div className="text-xs text-slate-300 pt-2 bg-slate-800 bg-opacity-50 p-3 rounded">
              <p><strong>Tip:</strong> Click the stopcock handle in the 3D view to toggle it. Drag to rotate the camera.</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 relative">
          <div ref={mountRef} className="w-full h-full" />
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 p-2 rounded text-xs">Drag to rotate • Click handle to open/close</div>
        </main>
      </div>
    </div>
  );
}