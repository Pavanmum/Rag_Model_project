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
    let animationId: number | null = null;

    const initThreeJS = async () => {
      try {
        if (!mountRef.current) return;
        
        console.log('Starting simple 3D brain initialization...');
        
        // Dynamic import of Three.js
        const THREE = await import('three');
        console.log('Three.js loaded successfully');
        
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);

        // Camera setup
        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 0, 3);

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ 
          antialias: true, 
          alpha: true
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Simple lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Create simple brain geometry
        console.log('Creating simple brain geometry...');
        const brainGeometry = new THREE.SphereGeometry(1, 32, 32);
        
        // Simple brain material
        const brainMaterial = new THREE.MeshPhongMaterial({
          color: 0xf4c2a1, // Brain tissue color
          shininess: 30
        });

        // Create brain mesh
        brain = new THREE.Mesh(brainGeometry, brainMaterial);
        scene.add(brain);
        console.log('Brain mesh added to scene');

        // Add to DOM
        mountRef.current.appendChild(renderer.domElement);
        console.log('3D brain model added to DOM');

        // Animation loop
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          
          // Simple rotation
          if (autoRotate && brain) {
            brain.rotation.y += 0.01;
            brain.rotation.x += 0.005;
          }
          
          renderer.render(scene, camera);
        };
        
        animate();
        
        // Set loading to false after a short delay
        setTimeout(() => {
          setIsLoading(false);
          console.log('3D brain model loaded successfully');
        }, 500);
        
      } catch (err) {
        console.error('Failed to load 3D brain model:', err);
        setError(`Failed to load 3D brain model: ${err.message}`);
        setIsLoading(false);
      }
    };

    initThreeJS();

    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
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
