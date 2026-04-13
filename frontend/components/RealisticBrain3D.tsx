'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface RealisticBrain3DProps {
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

const RealisticBrain3D: React.FC<RealisticBrain3DProps> = ({
  width = 600,
  height = 500,
  autoRotate = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.5;
    controls.minDistance = 2;
    controls.maxDistance = 10;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x8888ff, 0.4);
    directionalLight2.position.set(-5, 3, -5);
    scene.add(directionalLight2);

    const pointLight1 = new THREE.PointLight(0xff6b9d, 0.8, 10);
    pointLight1.position.set(3, 2, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x6bb6ff, 0.8, 10);
    pointLight2.position.set(-3, 2, -3);
    scene.add(pointLight2);

    // Load the brain model from Sketchfab
    const loader = new GLTFLoader();
    let brainModel: THREE.Group | null = null;
    let loadingFailed = false;

    // Loading manager for progress
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (url, loaded, total) => {
      console.log(`Loading: ${(loaded / total * 100).toFixed(2)}%`);
    };

    // Try to load the model
    loader.load(
      // Sketchfab download URL (you'll need to download the model first)
      '/models/brain.glb',
      (gltf) => {
        brainModel = gltf.scene;
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(brainModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        
        brainModel.scale.setScalar(scale);
        brainModel.position.sub(center.multiplyScalar(scale));
        
        // Enable shadows
        brainModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(brainModel);
        console.log('Brain model loaded successfully!');
      },
      (progress) => {
        console.log('Loading progress:', progress);
      },
      (error) => {
        console.error('Error loading brain model:', error);
        loadingFailed = true;
        
        // Fallback: Create a procedural brain if model fails to load
        createFallbackBrain();
      }
    );

    // Fallback brain creation
    const createFallbackBrain = () => {
      const brainGroup = new THREE.Group();

      // Realistic brain tissue material
      const brainTissueMat = new THREE.MeshStandardMaterial({
        color: 0xc9a0a0,
        roughness: 0.95,
        metalness: 0.02,
        emissive: 0x3d2525,
        emissiveIntensity: 0.08
      });

      // Main Cerebrum
      const cerebrumGeo = new THREE.SphereGeometry(1.5, 128, 128);
      const cerebrumPositions = cerebrumGeo.attributes.position;
      
      for (let i = 0; i < cerebrumPositions.count; i++) {
        const x = cerebrumPositions.getX(i);
        const y = cerebrumPositions.getY(i);
        const z = cerebrumPositions.getZ(i);
        
        const noise1 = Math.sin(x * 7) * Math.cos(y * 7) * Math.sin(z * 7) * 0.15;
        const noise2 = Math.sin(x * 14) * Math.cos(y * 14) * 0.08;
        const noise3 = Math.sin(x * 25) * Math.cos(z * 25) * 0.04;
        const noise4 = Math.sin(x * 35) * Math.sin(y * 35) * 0.02;
        const totalNoise = noise1 + noise2 + noise3 + noise4;
        
        cerebrumPositions.setXYZ(
          i,
          x * (1 + totalNoise) * 0.95,
          y * (1 + totalNoise) * 0.85,
          z * (1 + totalNoise) * 1.1
        );
      }
      cerebrumGeo.computeVertexNormals();
      
      const cerebrum = new THREE.Mesh(cerebrumGeo, brainTissueMat);
      cerebrum.position.y = 0.2;
      brainGroup.add(cerebrum);

      // Add blood vessels
      const createBloodVessel = (points: THREE.Vector3[], color: number, radius: number) => {
        const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
        const tubeGeo = new THREE.TubeGeometry(curve, 120, radius, 16, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.3,
          metalness: 0.5,
          emissive: color,
          emissiveIntensity: 0.3
        });
        return new THREE.Mesh(tubeGeo, tubeMat);
      };

      const arteryColor = 0xdd1111;
      const veinColor = 0x4488dd;

      // Add some major vessels
      for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2;
        const vessel = [];
        for (let j = 0; j <= 40; j++) {
          const t = j / 40;
          vessel.push(new THREE.Vector3(
            Math.cos(angle) * (1.0 + t * 0.6),
            0.3 + Math.sin(t * Math.PI) * 0.6,
            Math.sin(angle) * (1.0 + t * 0.6)
          ));
        }
        brainGroup.add(createBloodVessel(vessel, i % 2 === 0 ? arteryColor : veinColor, 0.04));
      }

      scene.add(brainGroup);
      brainModel = brainGroup;
    };

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      controls.update();
      
      // Subtle floating
      if (brainModel) {
        brainModel.position.y = Math.sin(time * 0.4) * 0.1;
      }

      // Dynamic lighting
      pointLight1.position.x = Math.sin(time * 0.6) * 4;
      pointLight1.position.z = Math.cos(time * 0.6) * 4;

      pointLight2.position.x = Math.cos(time * 0.4) * 4;
      pointLight2.position.z = Math.sin(time * 0.4) * 4;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, height, autoRotate]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        borderRadius: '12px',
        overflow: 'hidden'
      }} 
    />
  );
};

export default RealisticBrain3D;

