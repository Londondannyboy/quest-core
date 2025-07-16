'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugHeadsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initThreeJS = async () => {
      if (!containerRef.current) return;

      try {
        // Import Three.js
        const THREE = await import('three');
        console.log('Three.js loaded successfully');

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x666666);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
          75,
          containerRef.current.clientWidth / containerRef.current.clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 0, 5);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Much brighter lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Add additional front lighting
        const frontLight = new THREE.DirectionalLight(0xffffff, 1.5);
        frontLight.position.set(0, 0, 10);
        scene.add(frontLight);

        // Create a simple head geometry
        const headGeometry = new THREE.SphereGeometry(1, 32, 32);
        
        // Modify vertices to make it more head-like
        const position = headGeometry.attributes.position;
        for (let i = 0; i < position.count; i++) {
          const x = position.getX(i);
          const y = position.getY(i);
          const z = position.getZ(i);
          
          // Flatten back of head
          if (z < -0.3) {
            position.setZ(i, z * 0.7);
          }
          
          // Create chin
          if (y < -0.5) {
            position.setY(i, y * 1.2);
          }
          
          // Narrow at top
          if (y > 0.3) {
            position.setX(i, x * 0.9);
            position.setZ(i, z * 0.9);
          }
        }
        
        headGeometry.attributes.position.needsUpdate = true;
        headGeometry.computeVertexNormals();

        // Head material
        const headMaterial = new THREE.MeshPhongMaterial({
          color: 0x8B7355,
          transparent: false,
          opacity: 1.0
        });

        const headMesh = new THREE.Mesh(headGeometry, headMaterial);
        scene.add(headMesh);

        // Add some accessories for testing
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 0.2, 0.8);
        scene.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 0.2, 0.8);
        scene.add(rightEye);

        // Nose
        const noseGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const noseMaterial = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 0, 0.9);
        nose.rotation.x = Math.PI / 2;
        scene.add(nose);

        // Mouth
        const mouthGeometry = new THREE.RingGeometry(0.1, 0.15, 16);
        const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.3, 0.8);
        scene.add(mouth);

        console.log('Head geometry created successfully');

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);
          
          // Rotate the head
          headMesh.rotation.y += 0.01;
          
          renderer.render(scene, camera);
        };
        
        animate();

        // Handle window resize
        const handleResize = () => {
          if (!containerRef.current) return;
          
          camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
          if (containerRef.current && renderer.domElement) {
            containerRef.current.removeChild(renderer.domElement);
          }
          renderer.dispose();
        };

      } catch (error) {
        console.error('Error initializing Three.js:', error);
      }
    };

    initThreeJS();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Debug Three.js Head Rendering</h1>
        <p className="text-gray-600 mt-2">
          Simple test to isolate Three.js head geometry rendering issues
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Simple Head Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={containerRef}
            className="w-full h-[600px] border rounded-lg bg-gray-100"
          />
          <div className="mt-4 text-sm text-gray-600">
            <p>This should display:</p>
            <ul className="list-disc list-inside mt-2">
              <li>A rotating head shape (modified sphere)</li>
              <li>Two black eyes</li>
              <li>A nose (cone)</li>
              <li>A mouth (ring)</li>
            </ul>
            <p className="mt-2">
              Check browser console for Three.js loading messages and any errors.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}