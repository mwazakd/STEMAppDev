import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface IntegratedGlassmorphismConicalFlaskProps {
  position?: THREE.Vector3;
  scale?: number;
  liquidLevel?: number;
  liquidColor?: string;
  scene: THREE.Scene;
  groupRef?: React.RefObject<THREE.Group>;
  isRunning?: boolean; // Add prop to control bubble visibility
}

export default function IntegratedGlassmorphismConicalFlask({
  position = new THREE.Vector3(0, 0, 0),
  scale = 1,
  liquidLevel = 0,
  liquidColor = "#4488ff",
  scene,
  groupRef,
  isRunning = false
}: IntegratedGlassmorphismConicalFlaskProps) {
  const flaskRef = useRef<THREE.Group | null>(null);
  const liquidRef = useRef<THREE.Mesh | null>(null);
  const bubblesRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // Function to update liquid level directly
  const updateLiquidLevelDirect = (level: number) => {
    if (!liquidRef.current) return;
    
    const clampedLevel = Math.max(0, Math.min(100, level));
    const scale = clampedLevel / 100;
    
    // Flask dimensions: bottom radius = 1.8, top radius = 0.4, height = 3.5
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
  };

  useEffect(() => {
    if (!scene) return;

    const flaskGroup = new THREE.Group();
    flaskGroup.position.copy(position);
    flaskGroup.scale.setScalar(scale);
    flaskRef.current = flaskGroup;
    if (groupRef) {
      (groupRef as React.MutableRefObject<THREE.Group | null>).current = flaskGroup;
    }

    // Glass material - ultra-realistic with consistent properties
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12, // Slightly more transparent to help stream visibility
      roughness: 0.02,
      metalness: 0.1,
      transmission: 0.98,
      thickness: 0.8,
      envMapIntensity: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      ior: 1.52,
      reflectivity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false, // Prevent depth writing issues with stream
      depthTest: true
    });
    
    // Conical body (main part)
    const coneGeometry = new THREE.CylinderGeometry(0.4, 1.8, 3.5, 64, 1, true);
    const cone = new THREE.Mesh(coneGeometry, glassMaterial);
    cone.position.y = -0.25;
    cone.castShadow = true;
    cone.receiveShadow = true;
    cone.renderOrder = 0; // Ensure proper render order
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
    neck.renderOrder = 0; // Ensure proper render order
    flaskGroup.add(neck);
    
    // Top rim with thickness - using same material as main flask
    const rimGeometry = new THREE.TorusGeometry(0.4, 0.06, 16, 64);
    const rim = new THREE.Mesh(rimGeometry, glassMaterial.clone());
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
    
    // Liquid with realistic appearance (conical shape matching flask interior)
    const liquidGeometry = new THREE.CylinderGeometry(0.38, 1.75, 0.1, 64);
    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(liquidColor),
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
    liquid.position.y = -1.95; // Start at bottom
    liquidRef.current = liquid;
    flaskGroup.add(liquid);
    
    // Add some bubbles for realism (restore)
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
    
    const bubbles: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      const angle = (i / 8) * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.6;
      bubble.position.x = Math.cos(angle) * radius;
      bubble.position.z = Math.sin(angle) * radius;
      bubble.position.y = -1.8 + Math.random() * 0.4;
      bubble.scale.setScalar(0.5 + Math.random() * 1.2);
      bubble.visible = isRunning; // Set initial visibility based on isRunning
      flaskGroup.add(bubble);
      bubbles.push(bubble);
    }
    bubblesRef.current = bubbles;
    
    // Add glowing particles in liquid
    const particleCount = 20;
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
    particles.visible = isRunning; // Set initial visibility based on isRunning
    particlesRef.current = particles;
    flaskGroup.add(particles);

    scene.add(flaskGroup);

    // Start animation loop to update liquid level from props
    const animate = () => {
      updateLiquidLevelDirect(liquidLevel);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      scene.remove(flaskGroup);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [scene, position, scale, liquidLevel, liquidColor]);

  // Control bubble and particle visibility based on isRunning state
  useEffect(() => {
    if (bubblesRef.current) {
      bubblesRef.current.forEach(bubble => {
        bubble.visible = isRunning;
      });
    }
    if (particlesRef.current) {
      particlesRef.current.visible = isRunning;
    }
  }, [isRunning]);

  return null;
}
