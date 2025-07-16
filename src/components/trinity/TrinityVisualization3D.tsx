'use client';

import { useEffect, useRef, useState } from 'react';

interface TrinityData {
  quest: string;
  service: string;
  pledge: string;
}

interface TrinityCharacteristics {
  questType?: 'aggressive' | 'peaceful' | 'balanced';
  serviceType?: 'individual' | 'collective' | 'systemic';
  pledgeType?: 'ambitious' | 'steady' | 'adaptive';
  intensity?: 'high' | 'medium' | 'low';
}

interface TrinityVisualization3DProps {
  trinityData?: TrinityData;
  trinityCharacteristics?: TrinityCharacteristics;
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  showFace?: boolean;
  className?: string;
}

export default function TrinityVisualization3D({
  trinityData,
  trinityCharacteristics,
  size = 'medium',
  showLabels = true,
  showFace = false,
  className = ''
}: TrinityVisualization3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const trinityGroupRef = useRef<any>(null);
  const animationRef = useRef<number>();
  
  const [isLoaded, setIsLoaded] = useState(false);

  // Dynamic trinity color system based on characteristics
  const getTrinityColors = () => {
    const baseColors = {
      quest: 0x0ea5e9,    // Blue - from Quest Core color system
      service: 0x22c55e,  // Green - from Quest Core color system  
      pledge: 0xf59e0b    // Orange - from Quest Core color system
    };

    // Color variations based on trinity characteristics
    const colorVariations = {
      quest: {
        aggressive: 0xe11d48,   // Red - bold, action-oriented
        peaceful: 0x3b82f6,    // Blue - calm, thoughtful
        balanced: 0x8b5cf6     // Purple - harmony
      },
      service: {
        individual: 0x10b981,  // Emerald - personal focus
        collective: 0x059669,  // Green - community focus
        systemic: 0x047857     // Dark green - systems thinking
      },
      pledge: {
        ambitious: 0xf59e0b,   // Orange - high energy
        steady: 0xd97706,      // Amber - consistent
        adaptive: 0xca8a04     // Yellow - flexible
      }
    };

    // Apply characteristic-based colors if available
    const colors = { ...baseColors };
    
    if (trinityCharacteristics?.questType) {
      colors.quest = colorVariations.quest[trinityCharacteristics.questType];
    }
    
    if (trinityCharacteristics?.serviceType) {
      colors.service = colorVariations.service[trinityCharacteristics.serviceType];
    }
    
    if (trinityCharacteristics?.pledgeType) {
      colors.pledge = colorVariations.pledge[trinityCharacteristics.pledgeType];
    }

    return colors;
  };

  const trinityColors = getTrinityColors();

  // Intensity-based configurations
  const getIntensityMultipliers = () => {
    const intensity = trinityCharacteristics?.intensity || 'medium';
    
    const multipliers = {
      high: { animation: 1.5, emissive: 0.4, rotation: 1.8 },
      medium: { animation: 1.0, emissive: 0.2, rotation: 1.0 },
      low: { animation: 0.6, emissive: 0.1, rotation: 0.5 }
    };
    
    return multipliers[intensity];
  };

  const intensityConfig = getIntensityMultipliers();

  // Size configurations
  const sizeConfig = {
    small: { container: 300, elements: 0.8, spacing: 1.2 },
    medium: { container: 400, elements: 1.0, spacing: 1.5 },
    large: { container: 600, elements: 1.2, spacing: 2.0 }
  };

  const config = sizeConfig[size];

  useEffect(() => {
    if (!containerRef.current) return;

    const initTrinityVisualization = async () => {
      try {
        // Dynamically import Three.js
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = null; // Transparent background
        sceneRef.current = scene;

        // Camera setup  
        const camera = new THREE.PerspectiveCamera(
          75,
          containerRef.current!.clientWidth / containerRef.current!.clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 0, 6);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x000000, 0); // Transparent background
        containerRef.current!.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3; // Gentle rotation

        // Professional lighting setup
        const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Trinity group container
        const trinityGroup = new THREE.Group();
        trinityGroupRef.current = trinityGroup;

        // Sacred geometry - Trinity triangle positions
        const positions = {
          quest: { x: 0, y: config.spacing, z: 0 },                    // Top
          service: { x: -config.spacing * 0.866, y: -config.spacing * 0.5, z: 0 }, // Bottom left
          pledge: { x: config.spacing * 0.866, y: -config.spacing * 0.5, z: 0 }    // Bottom right
        };

        // Create trinity elements
        const trinityElements: { [key: string]: any } = {};

        // Quest element (top) - Icosahedron for exploration/discovery
        const questGeometry = new THREE.IcosahedronGeometry(0.5 * config.elements, 1);
        const questMaterial = new THREE.MeshPhongMaterial({
          color: trinityColors.quest,
          transparent: true,
          opacity: 0.9,
          emissive: trinityColors.quest,
          emissiveIntensity: intensityConfig.emissive,
          shininess: 100
        });
        const questMesh = new THREE.Mesh(questGeometry, questMaterial);
        questMesh.position.set(positions.quest.x, positions.quest.y, positions.quest.z);
        trinityElements.quest = questMesh;
        trinityGroup.add(questMesh);

        // Service element (bottom left) - Cylinder for stability/foundation  
        const serviceGeometry = new THREE.CylinderGeometry(0.4 * config.elements, 0.4 * config.elements, 0.6 * config.elements, 12);
        const serviceMaterial = new THREE.MeshPhongMaterial({
          color: trinityColors.service,
          transparent: true,
          opacity: 0.9,
          emissive: trinityColors.service,
          emissiveIntensity: intensityConfig.emissive,
          shininess: 100
        });
        const serviceMesh = new THREE.Mesh(serviceGeometry, serviceMaterial);
        serviceMesh.position.set(positions.service.x, positions.service.y, positions.service.z);
        trinityElements.service = serviceMesh;
        trinityGroup.add(serviceMesh);

        // Pledge element (bottom right) - Octahedron for commitment/action
        const pledgeGeometry = new THREE.OctahedronGeometry(0.5 * config.elements, 0);
        const pledgeMaterial = new THREE.MeshPhongMaterial({
          color: trinityColors.pledge,
          transparent: true,
          opacity: 0.9,
          emissive: trinityColors.pledge,
          emissiveIntensity: intensityConfig.emissive,
          shininess: 100
        });
        const pledgeMesh = new THREE.Mesh(pledgeGeometry, pledgeMaterial);
        pledgeMesh.position.set(positions.pledge.x, positions.pledge.y, positions.pledge.z);
        trinityElements.pledge = pledgeMesh;
        trinityGroup.add(pledgeMesh);

        // Sacred geometry connections - Triangle
        const connectionMaterial = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.6,
          linewidth: 2
        });

        // Create triangle connections
        const trianglePoints = [
          new THREE.Vector3(positions.quest.x, positions.quest.y, positions.quest.z),
          new THREE.Vector3(positions.service.x, positions.service.y, positions.service.z),
          new THREE.Vector3(positions.pledge.x, positions.pledge.y, positions.pledge.z),
          new THREE.Vector3(positions.quest.x, positions.quest.y, positions.quest.z) // Close the triangle
        ];

        const triangleGeometry = new THREE.BufferGeometry().setFromPoints(trianglePoints);
        const triangleLine = new THREE.Line(triangleGeometry, connectionMaterial);
        trinityGroup.add(triangleLine);

        // Sacred geometry - Outer circle
        const outerCircleGeometry = new THREE.RingGeometry(config.spacing * 1.3, config.spacing * 1.35, 64);
        const outerCircleMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        const outerCircle = new THREE.Mesh(outerCircleGeometry, outerCircleMaterial);
        outerCircle.rotation.x = -Math.PI / 2;
        trinityGroup.add(outerCircle);

        // Enhanced vector face overlay with sacred geometry
        if (showFace) {
          const faceGroup = new THREE.Group();
          
          // Main face outline - geometric representation inspired by sacred geometry
          const facePoints = [
            new THREE.Vector3(0, 1.8, 0.1),     // Crown point
            new THREE.Vector3(-0.9, 1.0, 0.1),  // Left temple
            new THREE.Vector3(-0.8, 0.2, 0.1),  // Left cheek
            new THREE.Vector3(-0.5, -0.4, 0.1), // Left jaw
            new THREE.Vector3(0, -0.8, 0.1),    // Chin center
            new THREE.Vector3(0.5, -0.4, 0.1),  // Right jaw
            new THREE.Vector3(0.8, 0.2, 0.1),   // Right cheek
            new THREE.Vector3(0.9, 1.0, 0.1),   // Right temple
            new THREE.Vector3(0, 1.8, 0.1)      // Close to crown
          ];

          const faceGeometry = new THREE.BufferGeometry().setFromPoints(facePoints);
          const faceMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
          });
          const faceLine = new THREE.Line(faceGeometry, faceMaterial);
          faceGroup.add(faceLine);

          // Third eye / inner vision symbol at quest position
          const thirdEyeGeometry = new THREE.CircleGeometry(0.15, 16);
          const thirdEyeMaterial = new THREE.LineBasicMaterial({
            color: trinityColors.quest,
            transparent: true,
            opacity: 0.6
          });
          const thirdEyeWireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(thirdEyeGeometry),
            thirdEyeMaterial
          );
          thirdEyeWireframe.position.set(0, 0.8, 0.11);
          faceGroup.add(thirdEyeWireframe);

          // Heart center at service position (left of face)
          const heartPoints = [
            new THREE.Vector3(-0.6, 0.1, 0.11),   // Heart center
            new THREE.Vector3(-0.7, 0.2, 0.11),   // Left curve
            new THREE.Vector3(-0.65, 0.3, 0.11),  // Left peak
            new THREE.Vector3(-0.6, 0.25, 0.11),  // Center top
            new THREE.Vector3(-0.55, 0.3, 0.11),  // Right peak
            new THREE.Vector3(-0.5, 0.2, 0.11),   // Right curve
            new THREE.Vector3(-0.6, 0.1, 0.11)    // Close
          ];
          const heartGeometry = new THREE.BufferGeometry().setFromPoints(heartPoints);
          const heartMaterial = new THREE.LineBasicMaterial({
            color: trinityColors.service,
            transparent: true,
            opacity: 0.6
          });
          const heartLine = new THREE.Line(heartGeometry, heartMaterial);
          faceGroup.add(heartLine);

          // Voice/expression symbol at pledge position (mouth area)
          const mouthPoints = [
            new THREE.Vector3(-0.3, -0.5, 0.11),
            new THREE.Vector3(-0.1, -0.6, 0.11),
            new THREE.Vector3(0.1, -0.6, 0.11),
            new THREE.Vector3(0.3, -0.5, 0.11)
          ];
          const mouthGeometry = new THREE.BufferGeometry().setFromPoints(mouthPoints);
          const mouthMaterial = new THREE.LineBasicMaterial({
            color: trinityColors.pledge,
            transparent: true,
            opacity: 0.6
          });
          const mouthLine = new THREE.Line(mouthGeometry, mouthMaterial);
          faceGroup.add(mouthLine);

          // Sacred geometry overlay - connecting the trinity points on the face
          const connectingLines = [
            // Third eye to heart
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, 0.8, 0.1),
              new THREE.Vector3(-0.6, 0.1, 0.1)
            ]),
            // Heart to mouth
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(-0.6, 0.1, 0.1),
              new THREE.Vector3(0, -0.55, 0.1)
            ]),
            // Mouth to third eye
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, -0.55, 0.1),
              new THREE.Vector3(0, 0.8, 0.1)
            ])
          ];

          const connectionMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
          });

          connectingLines.forEach(geometry => {
            const line = new THREE.Line(geometry, connectionMaterial);
            faceGroup.add(line);
          });

          trinityGroup.add(faceGroup);
        }

        // Add colored point lights for each trinity element
        const questLight = new THREE.PointLight(trinityColors.quest, 1.5, 5);
        questLight.position.copy(questMesh.position);
        trinityGroup.add(questLight);

        const serviceLight = new THREE.PointLight(trinityColors.service, 1.5, 5);
        serviceLight.position.copy(serviceMesh.position);
        trinityGroup.add(serviceLight);

        const pledgeLight = new THREE.PointLight(trinityColors.pledge, 1.5, 5);
        pledgeLight.position.copy(pledgeMesh.position);
        trinityGroup.add(pledgeLight);

        scene.add(trinityGroup);

        // Animation loop
        const animate = () => {
          animationRef.current = requestAnimationFrame(animate);
          
          // Update controls
          controls.update();
          
          // Animate trinity elements with unique patterns
          const time = Date.now() * 0.001;
          
          if (trinityElements.quest) {
            // Quest: Gentle floating and pulsing (exploration) - intensity-based
            trinityElements.quest.position.y = positions.quest.y + Math.sin(time * 1.2 * intensityConfig.animation) * 0.1;
            trinityElements.quest.rotation.y = time * 0.5 * intensityConfig.rotation;
            trinityElements.quest.material.emissiveIntensity = intensityConfig.emissive + Math.sin(time * 2 * intensityConfig.animation) * 0.1;
          }
          
          if (trinityElements.service) {
            // Service: Steady heartbeat pulse (service rhythm) - intensity-based
            const heartbeat = Math.sin(time * 2.5 * intensityConfig.animation) * 0.8 + 0.2;
            trinityElements.service.scale.setScalar(1 + heartbeat * 0.1 * intensityConfig.animation);
            trinityElements.service.material.emissiveIntensity = intensityConfig.emissive + heartbeat * 0.1;
          }
          
          if (trinityElements.pledge) {
            // Pledge: Sharp rotation and intensity (commitment/action) - intensity-based
            trinityElements.pledge.rotation.x = time * 1.5 * intensityConfig.rotation;
            trinityElements.pledge.rotation.z = time * 1.2 * intensityConfig.rotation;
            trinityElements.pledge.material.emissiveIntensity = intensityConfig.emissive + Math.sin(time * 3 * intensityConfig.animation) * 0.15;
          }
          
          renderer.render(scene, camera);
        };
        
        animate();
        setIsLoaded(true);

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
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
          if (containerRef.current && renderer.domElement) {
            containerRef.current.removeChild(renderer.domElement);
          }
          renderer.dispose();
        };

      } catch (error) {
        console.error('Error initializing Trinity 3D visualization:', error);
      }
    };

    initTrinityVisualization();
  }, [config, showFace, trinityColors, intensityConfig, trinityCharacteristics]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`trinity-visualization-3d ${className}`}>
      <div 
        ref={containerRef}
        className="w-full rounded-lg relative bg-gradient-to-br from-slate-900 to-blue-900"
        style={{ height: config.container }}
      />
      
      {showLabels && isLoaded && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="trinity-quest px-3 py-2 rounded-lg border">
            <div className="text-sm font-medium text-quest-700">Quest</div>
            {trinityData?.quest && (
              <div className="text-xs text-quest-600 mt-1 truncate">
                {trinityData.quest.substring(0, 30)}...
              </div>
            )}
          </div>
          <div className="trinity-service px-3 py-2 rounded-lg border">
            <div className="text-sm font-medium text-service-700">Service</div>
            {trinityData?.service && (
              <div className="text-xs text-service-600 mt-1 truncate">
                {trinityData.service.substring(0, 30)}...
              </div>
            )}
          </div>
          <div className="trinity-pledge px-3 py-2 rounded-lg border">
            <div className="text-sm font-medium text-pledge-700">Pledge</div>
            {trinityData?.pledge && (
              <div className="text-xs text-pledge-600 mt-1 truncate">
                {trinityData.pledge.substring(0, 30)}...
              </div>
            )}
          </div>
        </div>
      )}
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
          <div className="text-white text-sm">Loading Trinity Visualization...</div>
        </div>
      )}
    </div>
  );
}