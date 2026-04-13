/**
 * 3D Brain Viewer using Three.js
 * Creates an interactive 3D brain model with realistic anatomy
 */

class BrainViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.brainGroup = null;
        this.animationId = null;
        this.rotationSpeed = 0;
        
        this.init();
        this.createBrainModel();
        this.setupLighting();
        this.animate();
        
        // Hide loading overlay
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.display = 'none';
            }
        }, 1000);
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a202c);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 5);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Controls setup
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.maxDistance = 10;
        this.controls.minDistance = 2;

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Update coordinates display
        this.controls.addEventListener('change', () => this.updateCoordinates());
    }

    createBrainModel() {
        this.brainGroup = new THREE.Group();

        // Create left hemisphere (pink)
        const leftHemisphere = this.createHemisphere(-0.5, 0xff69b4);
        leftHemisphere.name = 'left-hemisphere';
        this.brainGroup.add(leftHemisphere);

        // Create right hemisphere (orange)
        const rightHemisphere = this.createHemisphere(0.5, 0xffa500);
        rightHemisphere.name = 'right-hemisphere';
        this.brainGroup.add(rightHemisphere);

        // Create brainstem (blue)
        const brainstem = this.createBrainstem();
        brainstem.name = 'brainstem';
        this.brainGroup.add(brainstem);

        // Create cerebellum (yellow)
        const cerebellum = this.createCerebellum();
        cerebellum.name = 'cerebellum';
        this.brainGroup.add(cerebellum);

        this.scene.add(this.brainGroup);
    }

    createHemisphere(offsetX, color) {
        const geometry = new THREE.SphereGeometry(1.2, 32, 32);
        
        // Modify vertices to create brain-like shape
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const z = vertices[i + 2];
            
            // Add noise for realistic brain surface
            const noise = (Math.sin(x * 3) + Math.cos(y * 4) + Math.sin(z * 2)) * 0.1;
            vertices[i] += noise;
            vertices[i + 1] += noise;
            vertices[i + 2] += noise;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 30,
            transparent: true,
            opacity: 1.0
        });

        const hemisphere = new THREE.Mesh(geometry, material);
        hemisphere.position.x = offsetX;
        hemisphere.castShadow = true;
        hemisphere.receiveShadow = true;

        // Add surface detail lines
        this.addSurfaceDetails(hemisphere, color);

        return hemisphere;
    }

    addSurfaceDetails(mesh, color) {
        const edges = new THREE.EdgesGeometry(mesh.geometry);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(color).multiplyScalar(0.7),
            transparent: true,
            opacity: 0.3
        });
        const lines = new THREE.LineSegments(edges, lineMaterial);
        mesh.add(lines);
    }

    createBrainstem() {
        const geometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0x4169e1,
            shininess: 30
        });

        const brainstem = new THREE.Mesh(geometry, material);
        brainstem.position.set(0, -1.2, 0);
        brainstem.castShadow = true;
        brainstem.receiveShadow = true;

        return brainstem;
    }

    createCerebellum() {
        const geometry = new THREE.SphereGeometry(0.6, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            shininess: 30
        });

        const cerebellum = new THREE.Mesh(geometry, material);
        cerebellum.position.set(0, -0.8, -1.2);
        cerebellum.scale.set(1, 0.7, 1);
        cerebellum.castShadow = true;
        cerebellum.receiveShadow = true;

        return cerebellum;
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point light for additional illumination
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
        pointLight.position.set(-5, 5, 5);
        this.scene.add(pointLight);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Auto-rotation
        if (this.rotationSpeed > 0 && this.brainGroup) {
            this.brainGroup.rotation.y += this.rotationSpeed * 0.01;
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        
        // Update zoom level display
        this.updateZoomLevel();
    }

    updateCoordinates() {
        const coords = document.getElementById('coordinates');
        if (coords && this.camera) {
            const pos = this.camera.position;
            coords.textContent = `X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}`;
        }
    }

    updateZoomLevel() {
        const zoomElement = document.getElementById('zoom-level');
        if (zoomElement && this.camera) {
            const distance = this.camera.position.distanceTo(this.controls.target);
            const zoomPercent = Math.round((10 - distance) / 8 * 100);
            zoomElement.textContent = `Zoom: ${Math.max(0, Math.min(100, zoomPercent))}%`;
        }
    }

    onWindowResize() {
        if (!this.container) return;

        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    // Public methods for controlling the viewer
    setOpacity(opacity) {
        const opacityValue = opacity / 100;
        if (this.brainGroup) {
            this.brainGroup.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = opacityValue;
                    child.material.transparent = opacityValue < 1;
                }
            });
        }
    }

    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
    }

    setViewMode(mode) {
        if (!this.brainGroup) return;

        this.brainGroup.children.forEach(child => {
            if (child.material) {
                switch (mode) {
                    case 'wireframe':
                        child.material.wireframe = true;
                        break;
                    case 'points':
                        // Convert to points material
                        const pointsMaterial = new THREE.PointsMaterial({
                            color: child.material.color,
                            size: 0.05
                        });
                        child.material = pointsMaterial;
                        break;
                    default: // solid
                        child.material.wireframe = false;
                        break;
                }
            }
        });
    }

    resetView() {
        if (this.controls) {
            this.controls.reset();
            this.camera.position.set(0, 0, 5);
            this.controls.target.set(0, 0, 0);
        }
        if (this.brainGroup) {
            this.brainGroup.rotation.set(0, 0, 0);
        }
        this.rotationSpeed = 0;
    }

    takeScreenshot() {
        if (this.renderer) {
            const link = document.createElement('a');
            link.download = 'brain-screenshot.png';
            link.href = this.renderer.domElement.toDataURL();
            link.click();
        }
    }

    highlightRegion(regionName) {
        if (!this.brainGroup) return;

        // Reset all materials
        this.brainGroup.children.forEach(child => {
            if (child.material && child.material.emissive) {
                child.material.emissive.setHex(0x000000);
            }
        });

        // Highlight selected region
        const region = this.brainGroup.children.find(child => child.name === regionName);
        if (region && region.material && region.material.emissive) {
            region.material.emissive.setHex(0x444444);
        }
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.controls) {
            this.controls.dispose();
        }
    }
}

// Export for use in other scripts
window.BrainViewer = BrainViewer;
