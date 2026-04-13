'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface BrainViewer3DProps {
  selectedRegion: string;
  isLoading: boolean;
}

interface BrainViewer3DRef {
  highlightRegion: (region: string) => void;
  resetView: () => void;
  takeScreenshot: () => void;
  setOpacity: (opacity: number) => void;
  setRotationSpeed: (speed: number) => void;
  setViewMode: (mode: string) => void;
}

const BrainViewer3D = forwardRef<BrainViewer3DRef, BrainViewer3DProps>(
  ({ selectedRegion, isLoading }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<any>(null);
    const rendererRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const controlsRef = useRef<any>(null);
    const brainGroupRef = useRef<any>(null);
    const animationIdRef = useRef<number | null>(null);
    const rotationSpeedRef = useRef<number>(0);

    const regions = [
      { id: 'whole-brain', name: 'Whole Brain' },
      { id: 'left-hemisphere', name: 'Left Hemisphere' },
      { id: 'right-hemisphere', name: 'Right Hemisphere' },
      { id: 'frontal-lobe', name: 'Frontal Lobe' },
      { id: 'parietal-lobe', name: 'Parietal Lobe' },
      { id: 'temporal-lobe', name: 'Temporal Lobe' },
      { id: 'occipital-lobe', name: 'Occipital Lobe' },
      { id: 'cerebellum', name: 'Cerebellum' },
      { id: 'brainstem', name: 'Brainstem' }
    ];

    useImperativeHandle(ref, () => ({
      highlightRegion: (region: string) => {
        highlightRegion(region);
      },
      resetView: () => {
        resetView();
      },
      takeScreenshot: () => {
        takeScreenshot();
      },
      setOpacity: (opacity: number) => {
        setOpacity(opacity);
      },
      setRotationSpeed: (speed: number) => {
        setRotationSpeed(speed);
      },
      setViewMode: (mode: string) => {
        setViewMode(mode);
      }
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      // Initialize Three.js scene
      initializeScene();

      // Cleanup function
      return () => {
        cleanup();
      };
    }, []);

    const initializeScene = async () => {
      if (!containerRef.current) return;

      // Dynamically import Three.js
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

      // Scene setup with high-tech background
      sceneRef.current = new THREE.Scene();

      // Create gradient background like in medical imaging
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d')!;

      // Create radial gradient
      const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
      gradient.addColorStop(0, '#001122');
      gradient.addColorStop(0.5, '#000811');
      gradient.addColorStop(1, '#000000');

      context.fillStyle = gradient;
      context.fillRect(0, 0, 512, 512);

      // Add grid pattern
      context.strokeStyle = '#003366';
      context.lineWidth = 1;
      context.globalAlpha = 0.3;

      for (let i = 0; i <= 512; i += 32) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, 512);
        context.stroke();

        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(512, i);
        context.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      sceneRef.current.background = texture;

      // Camera setup
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      cameraRef.current.position.set(2, 1, 4); // Better angle to show brain details

      // Renderer setup
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current.setSize(width, height);
      rendererRef.current.shadowMap.enabled = true;
      rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;
      
      containerRef.current.appendChild(rendererRef.current.domElement);

      // Controls setup
      controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.05;
      controlsRef.current.enableZoom = true;
      controlsRef.current.enablePan = true;
      controlsRef.current.maxDistance = 10;
      controlsRef.current.minDistance = 2;

      // Create brain model
      createBrainModel(THREE);

      // Setup lighting
      setupLighting(THREE);

      // Start animation loop
      animate();

      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      };

      window.addEventListener('resize', handleResize);
      
      // Hide loading after a delay
      setTimeout(() => {
        const loadingElement = document.getElementById('brain-loading');
        if (loadingElement) {
          loadingElement.style.display = 'none';
        }
      }, 1000);
    };

    const createBrainModel = (THREE: any) => {
      brainGroupRef.current = new THREE.Group();

      // Create realistic brain with cortical folds
      const brain = createRealisticBrain(THREE);
      brain.name = 'whole-brain';
      brainGroupRef.current.add(brain);

      // Create brainstem
      const brainstem = createBrainstem(THREE);
      brainstem.name = 'brainstem';
      brainGroupRef.current.add(brainstem);

      // Create cerebellum
      const cerebellum = createCerebellum(THREE);
      cerebellum.name = 'cerebellum';
      brainGroupRef.current.add(cerebellum);

      sceneRef.current.add(brainGroupRef.current);
    };

    const createRealisticBrain = (THREE: any) => {
      const brainGroup = new THREE.Group();

      // Create main brain structure with advanced materials
      const brainMesh = createAdvancedBrainMesh(THREE);
      brainGroup.add(brainMesh);

      // Create neural network visualization
      const neuralNetwork = createNeuralNetwork(THREE);
      brainGroup.add(neuralNetwork);

      // Create glowing activity hotspot
      const activityHotspot = createActivityHotspot(THREE);
      brainGroup.add(activityHotspot);

      // Create wireframe overlay
      const wireframeOverlay = createWireframeOverlay(THREE);
      brainGroup.add(wireframeOverlay);

      return brainGroup;
    };

    const createAdvancedBrainMesh = (THREE: any) => {
      // Create high-detail brain geometry
      const geometry = new THREE.SphereGeometry(1.4, 128, 128);

      // Get vertices for modification
      const vertices = geometry.attributes.position.array;
      const vertexCount = vertices.length / 3;

      // Create realistic brain shape with cortical folds
      for (let i = 0; i < vertexCount; i++) {
        const i3 = i * 3;
        const x = vertices[i3];
        const y = vertices[i3 + 1];
        const z = vertices[i3 + 2];

        // Normalize position to get direction
        const length = Math.sqrt(x * x + y * y + z * z);
        const nx = x / length;
        const ny = y / length;
        const nz = z / length;

        // Create brain-like shape - BRAIN ONLY, NO BODY
        let shapeModifier = 1.0;

        // Remove lower body/neck parts completely
        if (ny < -0.2) {
          shapeModifier *= 0.1; // Almost eliminate lower parts
        }

        // Create longitudinal fissure (split between hemispheres)
        const fissureDepth = Math.exp(-Math.abs(nx) * 8) * 0.15;
        if (Math.abs(nx) < 0.1 && ny > -0.2) {
          shapeModifier -= fissureDepth;
        }

        // Add detailed cortical folds and sulci
        const corticalNoise =
          Math.sin(nx * 15 + ny * 12) * 0.08 +
          Math.sin(ny * 18 + nz * 14) * 0.06 +
          Math.sin(nz * 22 + nx * 16) * 0.04 +
          Math.sin(nx * 28 + ny * 24 + nz * 20) * 0.03 +
          Math.sin(nx * 35 + ny * 30 + nz * 25) * 0.02;

        // Add larger gyri and sulci patterns
        const majorFolds =
          Math.sin(nx * 8 + ny * 6) * 0.12 +
          Math.sin(ny * 10 + nz * 8) * 0.10 +
          Math.cos(nz * 9 + nx * 7) * 0.08;

        // Combine all modifications
        const totalModifier = shapeModifier + corticalNoise + majorFolds * 0.5;

        // Apply modifications
        vertices[i3] = nx * totalModifier * 1.4;
        vertices[i3 + 1] = ny * totalModifier * 1.4;
        vertices[i3 + 2] = nz * totalModifier * 1.4;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      // Create clear, bright brain material
      const material = new THREE.MeshPhongMaterial({
        color: 0x00ccff, // Brighter cyan for clarity
        shininess: 60,
        transparent: true,
        opacity: 0.95, // More opaque for clarity
        emissive: 0x003366, // Stronger glow
        side: THREE.DoubleSide
      });

      const brain = new THREE.Mesh(geometry, material);
      brain.castShadow = true;
      brain.receiveShadow = true;
      brain.position.y = 0; // Center the brain

      return brain;
    };

    const createNeuralNetwork = (THREE: any) => {
      const networkGroup = new THREE.Group();

      // Create neural pathways as glowing lines - reduced for clarity
      const pathwayMaterial = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.4, // More subtle
        linewidth: 1
      });

      // Create fewer neural pathways for cleaner look
      for (let i = 0; i < 25; i++) {
        const points = [];
        const startAngle = (i / 25) * Math.PI * 2;
        const startRadius = 1.2 + Math.random() * 0.3;

        // Start point on brain surface
        const startX = Math.cos(startAngle) * startRadius;
        const startY = (Math.random() - 0.5) * 2;
        const startZ = Math.sin(startAngle) * startRadius;

        points.push(new THREE.Vector3(startX, startY, startZ));

        // Create curved pathway
        for (let j = 1; j <= 5; j++) {
          const t = j / 5;
          const curve = Math.sin(t * Math.PI) * 0.3;
          const x = startX * (1 - t * 0.5) + curve * (Math.random() - 0.5);
          const y = startY * (1 - t * 0.3) + curve * (Math.random() - 0.5);
          const z = startZ * (1 - t * 0.5) + curve * (Math.random() - 0.5);

          points.push(new THREE.Vector3(x, y, z));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, pathwayMaterial);
        networkGroup.add(line);
      }

      return networkGroup;
    };

    const createActivityHotspot = (THREE: any) => {
      const hotspotGroup = new THREE.Group();

      // Create main glowing sphere for activity center
      const hotspotGeometry = new THREE.SphereGeometry(0.15, 32, 32);
      const hotspotMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
      });

      const hotspot = new THREE.Mesh(hotspotGeometry, hotspotMaterial);
      hotspot.position.set(0.5, 0.3, 0.8); // Position in right hemisphere
      hotspotGroup.add(hotspot);

      // Create particle system for neural activity
      const particleCount = 200;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Random positions around the hotspot
        const radius = Math.random() * 0.5 + 0.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        positions[i3] = 0.5 + radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = 0.3 + radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = 0.8 + radius * Math.cos(phi);

        // Golden yellow particles
        colors[i3] = 1.0;     // R
        colors[i3 + 1] = 1.0; // G
        colors[i3 + 2] = 0.0; // B
      }

      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const particleMaterial = new THREE.PointsMaterial({
        size: 0.02,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      const particles = new THREE.Points(particleGeometry, particleMaterial);
      hotspotGroup.add(particles);

      return hotspotGroup;
    };

    const createWireframeOverlay = (THREE: any) => {
      // Create wireframe version of brain for overlay effect
      const geometry = new THREE.SphereGeometry(1.45, 32, 32);

      // Modify geometry to match brain shape
      const vertices = geometry.attributes.position.array;
      const vertexCount = vertices.length / 3;

      for (let i = 0; i < vertexCount; i++) {
        const i3 = i * 3;
        const x = vertices[i3];
        const y = vertices[i3 + 1];
        const z = vertices[i3 + 2];

        const length = Math.sqrt(x * x + y * y + z * z);
        const nx = x / length;
        const ny = y / length;
        const nz = z / length;

        let shapeModifier = 1.0;

        if (ny < -0.3) {
          shapeModifier *= 0.7 + (ny + 0.3) * 0.5;
        }

        const fissureDepth = Math.exp(-Math.abs(nx) * 8) * 0.15;
        if (Math.abs(nx) < 0.1 && ny > -0.2) {
          shapeModifier -= fissureDepth;
        }

        vertices[i3] = nx * shapeModifier * 1.45;
        vertices[i3 + 1] = ny * shapeModifier * 1.45;
        vertices[i3 + 2] = nz * shapeModifier * 1.45;
      }

      geometry.attributes.position.needsUpdate = true;

      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });

      const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
      wireframe.position.y = 0.2;

      return wireframe;
    };

    const createBrainstem = (THREE: any) => {
      // Create more realistic brainstem shape
      const geometry = new THREE.CylinderGeometry(0.25, 0.35, 1.2, 16);

      // Modify vertices for more organic shape
      const vertices = geometry.attributes.position.array;
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];

        // Add slight curvature and organic variation
        const noise = Math.sin(y * 4) * 0.05 + Math.cos(x * 6 + z * 6) * 0.03;
        vertices[i] += noise;
        vertices[i + 2] += noise * 0.5;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhongMaterial({
        color: 0xe8d5c4, // Lighter brain tissue color
        shininess: 20,
        transparent: true,
        opacity: 0.9
      });

      const brainstem = new THREE.Mesh(geometry, material);
      brainstem.position.set(0, -1.0, -0.2);
      brainstem.rotation.x = 0.1; // Slight forward tilt
      brainstem.castShadow = true;
      brainstem.receiveShadow = true;

      return brainstem;
    };

    const createCerebellum = (THREE: any) => {
      const geometry = new THREE.SphereGeometry(0.55, 32, 32);

      // Create cerebellar folds (folia)
      const vertices = geometry.attributes.position.array;
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];

        // Create characteristic cerebellar folding pattern
        const folia =
          Math.sin(x * 20) * 0.04 +
          Math.sin(y * 25) * 0.03 +
          Math.sin(z * 18) * 0.035 +
          Math.cos(x * 15 + y * 12) * 0.025;

        const length = Math.sqrt(x * x + y * y + z * z);
        const modifier = 1 + folia;

        vertices[i] = (x / length) * modifier * 0.55;
        vertices[i + 1] = (y / length) * modifier * 0.55;
        vertices[i + 2] = (z / length) * modifier * 0.55;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhongMaterial({
        color: 0xf0c8a0, // Slightly different shade for cerebellum
        shininess: 18,
        transparent: true,
        opacity: 0.95
      });

      const cerebellum = new THREE.Mesh(geometry, material);
      cerebellum.position.set(0, -0.7, -1.1);
      cerebellum.scale.set(1.2, 0.8, 1.0); // Characteristic cerebellum shape
      cerebellum.castShadow = true;
      cerebellum.receiveShadow = true;

      return cerebellum;
    };

    const setupLighting = (THREE: any) => {
      // Dark ambient light for high-tech feel
      const ambientLight = new THREE.AmbientLight(0x001122, 0.3);
      sceneRef.current.add(ambientLight);

      // Main blue directional light
      const directionalLight = new THREE.DirectionalLight(0x4a90e2, 1.2);
      directionalLight.position.set(3, 4, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      sceneRef.current.add(directionalLight);

      // Cyan fill light for neural network highlighting
      const fillLight = new THREE.DirectionalLight(0x00ffff, 0.6);
      fillLight.position.set(-3, 2, -2);
      sceneRef.current.add(fillLight);

      // Golden rim light for activity hotspot
      const rimLight = new THREE.DirectionalLight(0xffaa00, 0.4);
      rimLight.position.set(0, -2, -5);
      sceneRef.current.add(rimLight);

      // Multiple colored point lights for futuristic effect
      const pointLight1 = new THREE.PointLight(0x00aaff, 0.8, 100);
      pointLight1.position.set(-2, 3, 4);
      sceneRef.current.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xffff00, 0.6, 50);
      pointLight2.position.set(2, 1, -3);
      sceneRef.current.add(pointLight2);

      const pointLight3 = new THREE.PointLight(0xff00aa, 0.4, 80);
      pointLight3.position.set(0, -1, 3);
      sceneRef.current.add(pointLight3);
    };

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      // Smooth brain movement and rotation
      if (brainGroupRef.current) {
        // Auto-rotation when enabled
        if (rotationSpeedRef.current > 0) {
          brainGroupRef.current.rotation.y += rotationSpeedRef.current * 0.01;
        } else {
          // Gentle floating animation when not rotating
          brainGroupRef.current.rotation.y += 0.002;
          brainGroupRef.current.position.y = Math.sin(time * 0.5) * 0.1;
        }
      }

      // Animate brain components
      if (brainGroupRef.current) {
        brainGroupRef.current.children.forEach((child: any, index: number) => {
          if (child.children) {
            // Animate neural network lines
            child.children.forEach((subChild: any, subIndex: number) => {
              if (subChild.material && subChild.material.opacity !== undefined) {
                // Pulsing neural pathways
                const pulseSpeed = 2 + subIndex * 0.1;
                const opacity = 0.3 + Math.sin(time * pulseSpeed + subIndex) * 0.3;
                subChild.material.opacity = Math.max(0.1, opacity);
              }
            });
          }

          // Animate activity hotspot
          if (child.position && index === 2) { // Hotspot group
            const pulse = 1 + Math.sin(time * 3) * 0.2;
            child.scale.setScalar(pulse);

            // Animate particles
            if (child.children[1] && child.children[1].geometry) {
              const positions = child.children[1].geometry.attributes.position.array;
              for (let i = 0; i < positions.length; i += 3) {
                const originalX = 0.5;
                const originalY = 0.3;
                const originalZ = 0.8;

                const radius = 0.3 + Math.sin(time * 2 + i * 0.1) * 0.2;
                const theta = time * 0.5 + i * 0.1;
                const phi = time * 0.3 + i * 0.05;

                positions[i] = originalX + radius * Math.sin(phi) * Math.cos(theta);
                positions[i + 1] = originalY + radius * Math.sin(phi) * Math.sin(theta);
                positions[i + 2] = originalZ + radius * Math.cos(phi);
              }
              child.children[1].geometry.attributes.position.needsUpdate = true;
            }
          }

          // Animate wireframe overlay
          if (child.material && child.material.wireframe) {
            const opacity = 0.2 + Math.sin(time * 1.5) * 0.1;
            child.material.opacity = opacity;
          }
        });

        // Subtle breathing animation when not rotating
        if (rotationSpeedRef.current === 0) {
          const breathingScale = 1 + Math.sin(time * 0.5) * 0.02;
          brainGroupRef.current.scale.setScalar(breathingScale);
        }
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    const highlightRegion = (region: string) => {
      if (!brainGroupRef.current) return;

      // Reset all materials
      brainGroupRef.current.children.forEach((child: any) => {
        if (child.material && child.material.emissive) {
          child.material.emissive.setHex(0x000000);
          child.material.opacity = child.name === 'whole-brain' ? 1.0 : 0.9;
        }
      });

      // Highlight selected region
      if (region === 'whole' || region === 'whole-brain') {
        const brainMesh = brainGroupRef.current.children.find((child: any) => child.name === 'whole-brain');
        if (brainMesh && brainMesh.material && brainMesh.material.emissive) {
          brainMesh.material.emissive.setHex(0x222222);
        }
      } else if (region === 'left-hemisphere') {
        // Simulate left hemisphere highlighting by adjusting color
        const brainMesh = brainGroupRef.current.children.find((child: any) => child.name === 'whole-brain');
        if (brainMesh && brainMesh.material) {
          brainMesh.material.emissive.setHex(0x331122);
        }
      } else if (region === 'right-hemisphere') {
        // Simulate right hemisphere highlighting
        const brainMesh = brainGroupRef.current.children.find((child: any) => child.name === 'whole-brain');
        if (brainMesh && brainMesh.material) {
          brainMesh.material.emissive.setHex(0x223311);
        }
      } else {
        // For other regions, find and highlight the specific mesh
        const regionMesh = brainGroupRef.current.children.find((child: any) => child.name === region);
        if (regionMesh && regionMesh.material && regionMesh.material.emissive) {
          regionMesh.material.emissive.setHex(0x444444);
        }
      }
    };

    const toggleRotation = () => {
      rotationSpeedRef.current = rotationSpeedRef.current > 0 ? 0 : 1;
    };

    const resetView = () => {
      if (controlsRef.current && cameraRef.current) {
        controlsRef.current.reset();
        cameraRef.current.position.set(2, 1, 4);
        controlsRef.current.target.set(0, 0, 0);
      }
      if (brainGroupRef.current) {
        brainGroupRef.current.rotation.set(0, 0, 0);
        brainGroupRef.current.scale.setScalar(1);
      }
      rotationSpeedRef.current = 0;
    };

    const takeScreenshot = () => {
      if (rendererRef.current) {
        const link = document.createElement('a');
        link.download = 'brain-screenshot.png';
        link.href = rendererRef.current.domElement.toDataURL();
        link.click();
      }
    };

    const setOpacity = (opacity: number) => {
      const opacityValue = opacity / 100;
      if (brainGroupRef.current) {
        brainGroupRef.current.children.forEach((child: any) => {
          if (child.material) {
            child.material.opacity = opacityValue;
            child.material.transparent = opacityValue < 1;
          }
        });
      }
    };

    const setRotationSpeed = (speed: number) => {
      rotationSpeedRef.current = speed;
    };

    const setViewMode = (mode: string) => {
      if (!brainGroupRef.current) return;

      brainGroupRef.current.children.forEach((child: any) => {
        if (child.material) {
          switch (mode) {
            case 'wireframe':
              child.material.wireframe = true;
              break;
            case 'solid':
            default:
              child.material.wireframe = false;
              break;
          }
        }
      });
    };

    const cleanup = () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };

    return (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />

        {/* Medical Interface Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top HUD */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
            <div className="bg-black/70 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-sm">
              <h3 className="text-cyan-400 text-sm font-mono mb-2">NEURAL ACTIVITY MONITOR</h3>
              <div className="space-y-1 text-xs font-mono">
                <div className="text-green-400">STATUS: ACTIVE</div>
                <div className="text-yellow-400">FREQ: 40-100 Hz</div>
                <div className="text-blue-400">SYNC: 98.7%</div>
              </div>
            </div>

            <div className="bg-black/70 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-sm">
              <h3 className="text-cyan-400 text-sm font-mono mb-2">BRAIN REGIONS</h3>
              <div className="space-y-1">
                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => highlightRegion(region.id)}
                    className={`block w-full text-left px-2 py-1 text-xs font-mono rounded transition-colors ${
                      selectedRegion === region.id
                        ? 'bg-cyan-600/50 text-cyan-200 border border-cyan-400'
                        : 'bg-gray-900/50 text-gray-300 hover:bg-gray-700/50 border border-gray-600'
                    }`}
                  >
                    {region.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-auto">
            <div className="bg-black/70 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-sm">
              <h3 className="text-cyan-400 text-sm font-mono mb-2">CONTROLS</h3>
              <div className="space-y-2">
                <button
                  onClick={toggleRotation}
                  className="w-full px-3 py-1 bg-cyan-600/20 border border-cyan-500 text-cyan-300 text-xs font-mono rounded hover:bg-cyan-600/40 transition-colors"
                >
                  {rotationSpeedRef.current > 0 ? 'STOP ROTATION' : 'START ROTATION'}
                </button>
                <button
                  onClick={resetView}
                  className="w-full px-3 py-1 bg-yellow-600/20 border border-yellow-500 text-yellow-300 text-xs font-mono rounded hover:bg-yellow-600/40 transition-colors"
                >
                  RESET VIEW
                </button>
                <button
                  onClick={takeScreenshot}
                  className="w-full px-3 py-1 bg-green-600/20 border border-green-500 text-green-300 text-xs font-mono rounded hover:bg-green-600/40 transition-colors"
                >
                  CAPTURE
                </button>
              </div>
            </div>

            <div className="bg-black/70 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-sm">
              <h3 className="text-cyan-400 text-sm font-mono mb-2">NEURAL METRICS</h3>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-400">ACTIVITY:</span>
                  <span className="text-yellow-400">87.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">COHERENCE:</span>
                  <span className="text-green-400">94.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">LATENCY:</span>
                  <span className="text-blue-400">12ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-cyan-500/50"></div>
          <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-cyan-500/50"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-cyan-500/50"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-cyan-500/50"></div>
        </div>

        {isLoading && (
          <div id="brain-loading" className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-cyan-400">
            <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
            <p className="font-mono">INITIALIZING NEURAL INTERFACE...</p>
          </div>
        )}
      </div>
    );
  }
);

BrainViewer3D.displayName = 'BrainViewer3D';

export default BrainViewer3D;
