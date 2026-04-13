'use client';

import React, { useRef, useEffect, useState } from 'react';
import type * as THREE from 'three';
interface Brain3DProps {
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

const Brain3D: React.FC<Brain3DProps> = ({
  width = 450,
  height = 400,
  autoRotate = false
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let animationId: number;
    let renderer: any;
    let scene: any;

    const init = async () => {
      try {
        if (!containerRef.current) return;

        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);

        // Camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 5;

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        containerRef.current.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 1;

        // Lights
        scene.add(new THREE.AmbientLight(0x404040, 0.6));
        
        const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
        light1.position.set(5, 5, 5);
        scene.add(light1);

        const pointLight1 = new THREE.PointLight(0xff69b4, 1.5);
        pointLight1.position.set(-3, 2, 3);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x00ffff, 1.5);
        pointLight2.position.set(3, -2, 3);
        scene.add(pointLight2);

        // Brain Group
        const brainGroup = new THREE.Group();

        // Ultra-realistic brain tissue material
        const brainTissueMat = new THREE.MeshStandardMaterial({
          color: 0xc9a0a0,
          roughness: 0.95,
          metalness: 0.02,
          emissive: 0x3d2525,
          emissiveIntensity: 0.08
        });

        // Main Cerebrum with ultra-realistic cortical folds
        const cerebrumGeo = new THREE.SphereGeometry(1.5, 128, 128);
        const cerebrumPositions = cerebrumGeo.attributes.position;

        // Create highly detailed gyri and sulci (brain folds)
        for (let i = 0; i < cerebrumPositions.count; i++) {
          const x = cerebrumPositions.getX(i);
          const y = cerebrumPositions.getY(i);
          const z = cerebrumPositions.getZ(i);

          // Complex multi-layer noise for ultra-realistic brain texture
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

        // Cerebellum
        const cerebellumGeo = new THREE.SphereGeometry(0.6, 48, 48);
        const cerebellumPositions = cerebellumGeo.attributes.position;
        for (let i = 0; i < cerebellumPositions.count; i++) {
          const x = cerebellumPositions.getX(i);
          const y = cerebellumPositions.getY(i);
          const z = cerebellumPositions.getZ(i);

          const noise = Math.sin(x * 15) * Math.cos(y * 15) * 0.04;
          cerebellumPositions.setXYZ(
            i,
            x * (1 + noise),
            y * (1 + noise) * 0.7,
            z * (1 + noise)
          );
        }
        cerebellumGeo.computeVertexNormals();

        const cerebellum = new THREE.Mesh(cerebellumGeo, brainTissueMat);
        cerebellum.position.set(0, -0.7, -1.2);
        brainGroup.add(cerebellum);

        // Brain Stem
        const stemGeo = new THREE.CylinderGeometry(0.3, 0.35, 1, 24);
        const stem = new THREE.Mesh(stemGeo, brainTissueMat);
        stem.position.set(0, -1.2, -0.5);
        stem.rotation.x = 0.3;
        brainGroup.add(stem);

        // Function to create ultra-realistic blood vessels that follow brain surface
        const createBloodVessel = (points: THREE.Vector3[], color: number, radius: number, isArtery = true) => {
          const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
          const tubeGeo = new THREE.TubeGeometry(curve, 120, radius, 16, false);
          const tubeMat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.5,
            emissive: color,
            emissiveIntensity: isArtery ? 0.3 : 0.25
          });
          return new THREE.Mesh(tubeGeo, tubeMat);
        };

        // ARTERIES (Bright Red) - Following brain surface contours
        const arteryColor = 0xdd1111;

        // Main arterial trunk from bottom (like carotid)
        const mainTrunk = [];
        for (let i = 0; i <= 30; i++) {
          const t = i / 30;
          mainTrunk.push(new THREE.Vector3(
            -0.2,
            -1.5 + t * 1.3,
            0.3 + Math.sin(t * Math.PI) * 0.2
          ));
        }
        brainGroup.add(createBloodVessel(mainTrunk, arteryColor, 0.08, true));

        // Middle Cerebral Artery - Left (thick, winding along surface)
        const mcaLeft = [];
        for (let i = 0; i <= 80; i++) {
          const t = i / 80;
          const angle = t * Math.PI * 1.5;
          mcaLeft.push(new THREE.Vector3(
            -0.3 - Math.cos(angle) * 1.2,
            -0.3 + Math.sin(angle) * 1.1 + Math.sin(t * 10) * 0.1,
            0.8 - t * 0.6 + Math.cos(t * 8) * 0.15
          ));
        }
        brainGroup.add(createBloodVessel(mcaLeft, arteryColor, 0.07, true));

        // Middle Cerebral Artery - Right (thick, winding along surface)
        const mcaRight = [];
        for (let i = 0; i <= 80; i++) {
          const t = i / 80;
          const angle = t * Math.PI * 1.5;
          mcaRight.push(new THREE.Vector3(
            0.3 + Math.cos(angle) * 1.2,
            -0.3 + Math.sin(angle) * 1.1 + Math.sin(t * 10) * 0.1,
            0.8 - t * 0.6 + Math.cos(t * 8) * 0.15
          ));
        }
        brainGroup.add(createBloodVessel(mcaRight, arteryColor, 0.07, true));

        // Anterior Cerebral Arteries (curving over top)
        for (let side = -1; side <= 1; side += 2) {
          const aca = [];
          for (let i = 0; i <= 50; i++) {
            const t = i / 50;
            aca.push(new THREE.Vector3(
              side * (0.3 - t * 0.2 + Math.sin(t * 6) * 0.1),
              0.2 + t * 1.2 + Math.cos(t * 5) * 0.1,
              1.0 - t * 1.5 + Math.sin(t * 7) * 0.12
            ));
          }
          brainGroup.add(createBloodVessel(aca, arteryColor, 0.06, true));
        }

        // Posterior Cerebral Arteries (wrapping around back)
        for (let side = -1; side <= 1; side += 2) {
          const pca = [];
          for (let i = 0; i <= 55; i++) {
            const t = i / 55;
            pca.push(new THREE.Vector3(
              side * (0.4 + t * 0.8 + Math.cos(t * 8) * 0.1),
              0.4 - t * 0.9 + Math.sin(t * 6) * 0.12,
              -0.5 - t * 0.8 + Math.cos(t * 9) * 0.1
            ));
          }
          brainGroup.add(createBloodVessel(pca, arteryColor, 0.06, true));
        }

        // Secondary arterial branches (branching from main arteries)
        for (let i = 0; i < 25; i++) {
          const angle = (i / 25) * Math.PI * 2;
          const heightLevel = Math.sin(angle * 3) * 0.6;
          const branch = [];
          for (let j = 0; j <= 35; j++) {
            const t = j / 35;
            const wiggle = Math.sin(t * 12) * 0.08;
            branch.push(new THREE.Vector3(
              Math.cos(angle) * (1.0 + t * 0.6) + wiggle,
              heightLevel + Math.sin(t * Math.PI) * 0.5 + Math.cos(t * 8) * 0.08,
              Math.sin(angle) * (1.0 + t * 0.6) + Math.sin(t * 10) * 0.08
            ));
          }
          brainGroup.add(createBloodVessel(branch, arteryColor, 0.045, true));
        }

        // Tertiary arterial branches (smaller, more winding)
        for (let i = 0; i < 40; i++) {
          const angle = (i / 40) * Math.PI * 2;
          const offset = (i % 3) * 0.5;
          const branch = [];
          for (let j = 0; j <= 25; j++) {
            const t = j / 25;
            const wiggle1 = Math.sin(t * 15) * 0.06;
            const wiggle2 = Math.cos(t * 12) * 0.06;
            branch.push(new THREE.Vector3(
              Math.cos(angle + offset) * (1.1 + t * 0.4) + wiggle1,
              0.3 + Math.sin(t * Math.PI * 1.2) * 0.4 + wiggle2,
              Math.sin(angle + offset) * (1.1 + t * 0.4) + Math.sin(t * 14) * 0.05
            ));
          }
          brainGroup.add(createBloodVessel(branch, arteryColor, 0.03, true));
        }

        // Fine arterial network (capillary-like, very detailed)
        for (let i = 0; i < 60; i++) {
          const angle = (i / 60) * Math.PI * 2;
          const heightOffset = (i % 7) * 0.25 - 0.5;
          const capillary = [];
          for (let j = 0; j <= 20; j++) {
            const t = j / 20;
            const wiggle = Math.sin(t * 20) * 0.04;
            capillary.push(new THREE.Vector3(
              Math.cos(angle) * (1.25 + t * 0.35) + wiggle,
              heightOffset + Math.sin(t * Math.PI) * 0.25 + Math.cos(t * 18) * 0.04,
              Math.sin(angle) * (1.25 + t * 0.35) + Math.sin(t * 16) * 0.04
            ));
          }
          brainGroup.add(createBloodVessel(capillary, arteryColor, 0.02, true));
        }

        // VEINS (Light Blue) - Venous drainage following brain surface
        const veinColor = 0x4488dd;

        // Superior Sagittal Sinus (thick vein running along top midline)
        const sss = [];
        for (let i = 0; i <= 80; i++) {
          const t = i / 80;
          sss.push(new THREE.Vector3(
            Math.sin(t * Math.PI * 3) * 0.12,
            1.3 - t * 0.6 + Math.cos(t * 8) * 0.08,
            1.6 - t * 2.9 + Math.sin(t * 10) * 0.1
          ));
        }
        brainGroup.add(createBloodVessel(sss, veinColor, 0.09, false));

        // Major lateral veins (thick, winding along sides)
        for (let side = -1; side <= 1; side += 2) {
          const lateral = [];
          for (let i = 0; i <= 60; i++) {
            const t = i / 60;
            lateral.push(new THREE.Vector3(
              side * (1.0 + t * 0.6 + Math.cos(t * 9) * 0.1),
              1.1 - t * 1.5 + Math.sin(t * 7) * 0.12,
              0.6 - t * 0.8 + Math.cos(t * 11) * 0.1
            ));
          }
          brainGroup.add(createBloodVessel(lateral, veinColor, 0.075, false));
        }

        // Transverse sinus veins (wrapping around back)
        for (let side = -1; side <= 1; side += 2) {
          const transverse = [];
          for (let i = 0; i <= 50; i++) {
            const t = i / 50;
            transverse.push(new THREE.Vector3(
              side * (0.2 + t * 1.1 + Math.sin(t * 8) * 0.08),
              0.5 - t * 0.7 + Math.cos(t * 10) * 0.1,
              -0.8 - t * 0.5 + Math.sin(t * 12) * 0.08
            ));
          }
          brainGroup.add(createBloodVessel(transverse, veinColor, 0.065, false));
        }

        // Secondary venous branches
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2;
          const heightLevel = Math.cos(angle * 2) * 0.5;
          const vein = [];
          for (let j = 0; j <= 30; j++) {
            const t = j / 30;
            const wiggle = Math.sin(t * 10) * 0.07;
            vein.push(new THREE.Vector3(
              Math.cos(angle) * (1.15 + t * 0.45) + wiggle,
              heightLevel + 0.3 - t * 0.7 + Math.cos(t * 9) * 0.08,
              Math.sin(angle) * (1.15 + t * 0.45) + Math.sin(t * 11) * 0.07
            ));
          }
          brainGroup.add(createBloodVessel(vein, veinColor, 0.04, false));
        }

        // Smaller venous network
        for (let i = 0; i < 35; i++) {
          const angle = (i / 35) * Math.PI * 2;
          const offset = (i % 4) * 0.4;
          const smallVein = [];
          for (let j = 0; j <= 22; j++) {
            const t = j / 22;
            const wiggle = Math.sin(t * 14) * 0.05;
            smallVein.push(new THREE.Vector3(
              Math.cos(angle + offset) * (1.3 + t * 0.3) + wiggle,
              0.5 - t * 0.6 + Math.cos(t * 12) * 0.06,
              Math.sin(angle + offset) * (1.3 + t * 0.3) + Math.sin(t * 15) * 0.05
            ));
          }
          brainGroup.add(createBloodVessel(smallVein, veinColor, 0.028, false));
        }

        scene.add(brainGroup);

        // Animation
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          const time = Date.now() * 0.001;

          controls.update();

          // Subtle floating motion
          brainGroup.position.y = Math.sin(time * 0.4) * 0.1;

          // Gentle auto-rotation when not being controlled
          if (autoRotate) {
            brainGroup.rotation.y += 0.003;
          }

          // Dynamic lighting for depth
          pointLight1.position.x = Math.sin(time * 0.6) * 4;
          pointLight1.position.z = Math.cos(time * 0.6) * 4;

          pointLight2.position.x = Math.cos(time * 0.4) * 4;
          pointLight2.position.z = Math.sin(time * 0.4) * 4;

          renderer.render(scene, camera);
        };

        animate();
        setIsLoading(false);

      } catch (err: any) {
        console.error('Brain init error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer) renderer.dispose();
      if (scene) {
        scene.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
      }
    };
  }, [width, height, autoRotate]);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-900 rounded-lg border border-gray-600" style={{ width, height }}>
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg border border-gray-600 z-10" style={{ width, height }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
            <div className="text-gray-400">Loading Brain...</div>
          </div>
        </div>
      )}
      <div ref={containerRef} className="rounded-lg overflow-hidden border border-gray-600 bg-gray-900" style={{ width, height }} />
    </div>
  );
};

export default Brain3D;

