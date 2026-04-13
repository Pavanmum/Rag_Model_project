'use client';

import React, { useRef, useEffect, useState } from 'react';

interface SimpleBrain3DProps {
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

const SimpleBrain3D: React.FC<SimpleBrain3DProps> = ({
  width = 400,
  height = 350,
  autoRotate = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scene: any = null;
    let renderer: any = null;
    let camera: any = null;
    let brain: any = null;
    let controls: any = null;
    let animationId: number | null = null;

    const initThreeJS = async () => {
      try {
        if (!mountRef.current) {
          console.log('Mount ref not ready, retrying...');
          setTimeout(initThreeJS, 100);
          return;
        }

        console.log('Starting simple 3D brain initialization...');

        // Dynamic import of Three.js and OrbitControls
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');
        console.log('Three.js and OrbitControls loaded successfully');

        // Scene setup with gradient background
        scene = new THREE.Scene();

        // Create gradient background
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d')!;
        const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f1e');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);
        const texture = new THREE.CanvasTexture(canvas);
        scene.background = texture;

        // Camera setup
        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 0, 3.5);

        // Renderer setup with shadows
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Add OrbitControls for interactive rotation
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // Smooth damping effect
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.minDistance = 2;
        controls.maxDistance = 10;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 0.5;
        controls.rotateSpeed = 0.8;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        console.log('OrbitControls initialized with smooth damping');

        // Enhanced lighting setup
        const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
        scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0x6a9fff, 1.2);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Fill light from the side
        const fillLight = new THREE.DirectionalLight(0xff6a9f, 0.6);
        fillLight.position.set(-5, 3, -3);
        scene.add(fillLight);

        // Rim light for depth
        const rimLight = new THREE.DirectionalLight(0x9f6aff, 0.5);
        rimLight.position.set(0, -3, -5);
        scene.add(rimLight);

        // Point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0x00ccff, 0.8, 50);
        pointLight1.position.set(-3, 2, 3);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff00cc, 0.6, 50);
        pointLight2.position.set(3, -2, 3);
        scene.add(pointLight2);

        // Create Brain model group
        const brainGroup = new THREE.Group();
        console.log('Creating brain model...');

        const cerebrumGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const cerebrumMaterial = new THREE.MeshStandardMaterial({
          color: 0xd4a5a5, // Pink/rose color
          roughness: 0.7,
          metalness: 0.2,
          emissive: 0x4a2020,
          emissiveIntensity: 0.1
        });

        const cerebrum = new THREE.Mesh(cerebrumGeometry, cerebrumMaterial);
        cerebrum.castShadow = true;
        cerebrum.receiveShadow = true;
        cerebrum.position.y = 0.1;
        brainGroup.add(cerebrum);

        // 2. CEREBELLUM (Back lower part - Yellow/Beige color)
        console.log('Creating cerebellum...');
        const cerebellumGeometry = new THREE.SphereGeometry(0.55, 24, 24);

        // Add cerebellar folds (folia)
        const cerebellumVertices = cerebellumGeometry.attributes.position.array;
        for (let i = 0; i < cerebellumVertices.length; i += 3) {
          const x = cerebellumVertices[i];
          const y = cerebellumVertices[i + 1];
          const z = cerebellumVertices[i + 2];

          const folia =
            Math.sin(x * 20) * 0.05 +
            Math.sin(y * 25) * 0.04 +
            Math.sin(z * 18) * 0.045;

          const length = Math.sqrt(x * x + y * y + z * z);
          const modifier = 1 + folia;

          cerebellumVertices[i] = (x / length) * modifier * 0.55;
          cerebellumVertices[i + 1] = (y / length) * modifier * 0.55;
          cerebellumVertices[i + 2] = (z / length) * modifier * 0.55;
        }

        cerebellumGeometry.attributes.position.needsUpdate = true;
        cerebellumGeometry.computeVertexNormals();

        const cerebellumMaterial = new THREE.MeshStandardMaterial({
          color: 0xd4c4a5, // Yellow/beige color
          roughness: 0.7,
          metalness: 0.2,
          emissive: 0x4a4020,
          emissiveIntensity: 0.1
        });

        const cerebellum = new THREE.Mesh(cerebellumGeometry, cerebellumMaterial);
        cerebellum.castShadow = true;
        cerebellum.receiveShadow = true;
        cerebellum.position.set(0, -0.6, -0.5);
        brainGroup.add(cerebellum);

        // 3. BRAIN STEM (Bottom center - Blue/Purple color)
        console.log('Creating brain stem...');
        const brainStemGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 32);

        const brainStemMaterial = new THREE.MeshStandardMaterial({
          color: 0x7a8fb5, // Blue color
          roughness: 0.6,
          metalness: 0.3,
          emissive: 0x202a4a,
          emissiveIntensity: 0.1
        });

        const brainStem = new THREE.Mesh(brainStemGeometry, brainStemMaterial);
        brainStem.castShadow = true;
        brainStem.receiveShadow = true;
        brainStem.position.set(0, -1.0, -0.2);
        brainStem.rotation.x = 0.2;
        brainGroup.add(brainStem);

        // 4. TEMPORAL LOBE (Side parts - Cyan/Turquoise color)
        console.log('Creating temporal lobes...');
        const temporalGeometry = new THREE.SphereGeometry(0.4, 32, 32);

        const temporalMaterial = new THREE.MeshStandardMaterial({
          color: 0x8fbfb5, // Cyan/turquoise color
          roughness: 0.7,
          metalness: 0.2,
          emissive: 0x204a4a,
          emissiveIntensity: 0.1
        });

        const temporalLeft = new THREE.Mesh(temporalGeometry, temporalMaterial);
        temporalLeft.castShadow = true;
        temporalLeft.position.set(-0.7, -0.2, 0.3);
        temporalLeft.scale.set(1, 0.8, 1.2);
        brainGroup.add(temporalLeft);

        const temporalRight = new THREE.Mesh(temporalGeometry, temporalMaterial.clone());
        temporalRight.castShadow = true;
        temporalRight.position.set(0.7, -0.2, 0.3);
        temporalRight.scale.set(1, 0.8, 1.2);
        brainGroup.add(temporalRight);

        // 5. Add subtle wireframe overlay
        const wireframeGeometry = new THREE.SphereGeometry(1.05, 32, 32);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          wireframe: true,
          transparent: true,
          opacity: 0.08
        });
        const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        brainGroup.add(wireframe);

        brain = brainGroup;
        scene.add(brainGroup);

        console.log('Anatomically detailed brain model created');

        // Add to DOM
        if (!mountRef.current) {
          throw new Error('Mount ref is not available');
        }
        mountRef.current.appendChild(renderer.domElement);
        console.log('3D brain model added to DOM');

        // Animation loop with enhanced effects
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          const time = Date.now() * 0.001;

          // Update controls for smooth damping
          if (controls) {
            controls.update();
          }

          // Only apply auto-rotation if not manually interacting
          if (!autoRotate && brain) {
            // Gentle floating animation even when not auto-rotating
            brain.position.y = Math.sin(time * 0.5) * 0.05;

            // Subtle breathing effect
            const breathe = 1 + Math.sin(time * 0.8) * 0.015;
            brain.scale.setScalar(breathe);
          }

          // Animate point lights for dynamic lighting
          if (scene.children.length > 4) {
            const pointLight1 = scene.children[4];
            const pointLight2 = scene.children[5];

            if (pointLight1 && pointLight1.position) {
              pointLight1.position.x = Math.sin(time * 0.8) * 3;
              pointLight1.position.z = Math.cos(time * 0.8) * 3;
              pointLight1.position.y = Math.sin(time * 0.5) * 2 + 2;
            }

            if (pointLight2 && pointLight2.position) {
              pointLight2.position.x = Math.cos(time * 0.6) * 3;
              pointLight2.position.z = Math.sin(time * 0.6) * 3;
              pointLight2.position.y = Math.cos(time * 0.4) * 2 - 2;
            }
          }

          renderer.render(scene, camera);
        };

        console.log('Starting animation loop...');
        animate();

        // Set loading to false immediately after setup
        console.log('Brain model setup complete, hiding loading state');
        setIsLoading(false);

      } catch (err: any) {
        console.error('Failed to load 3D brain model:', err);
        setError(`Failed to load 3D brain model: ${err?.message || 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    initThreeJS();

    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      if (controls) {
        controls.dispose();
      }

      if (mountRef.current && renderer) {
        try {
          mountRef.current.removeChild(renderer.domElement);
        } catch (e) {
          // Element might already be removed
        }
      }

      if (renderer) {
        renderer.dispose();
      }

      if (scene) {
        scene.traverse((object: any) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material: any) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [width, height, autoRotate]);

  if (isLoading) {
    return (
      <div className="relative">
        <div
          className="rounded-lg overflow-hidden border border-gray-600 bg-gray-900 flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
            <div className="text-gray-400">Loading 3D Brain Model...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <div
          className="rounded-lg overflow-hidden border border-gray-600 bg-gray-900 flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-center">
            <div className="text-red-400 mb-2">⚠️</div>
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mountRef}
        className="rounded-lg overflow-hidden border border-gray-600 bg-gray-900"
        style={{ width, height }}
      />

      {/* Brain Info */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-black/70 px-2 py-1 rounded">
        🧠 3D Brain Model
      </div>

      {/* Auto-rotate indicator */}
      {autoRotate && (
        <div className="absolute top-2 left-2 text-xs text-orange-400 bg-black/70 px-2 py-1 rounded">
          🔄 Auto-rotating
        </div>
      )}
    </div>
  );
};

export default SimpleBrain3D;
