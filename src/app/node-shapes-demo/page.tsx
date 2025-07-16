'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shapes, 
  Box, 
  Circle, 
  Triangle, 
  Play, 
  Pause, 
  RotateCcw,
  Eye,
  Settings,
  Zap
} from 'lucide-react';

export default function NodeShapesDemo() {
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const forceContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentShape, setCurrentShape] = useState('sphere');
  const animationRef = useRef<number>();
  const sceneRef = useRef<any>(null);

  // Shape definitions for Three.js
  const shapes = {
    sphere: { geometry: 'SphereGeometry', args: [0.5, 16, 16], color: 0x3b82f6 },
    cube: { geometry: 'BoxGeometry', args: [1, 1, 1], color: 0xef4444 },
    cone: { geometry: 'ConeGeometry', args: [0.5, 1, 16], color: 0x10b981 },
    cylinder: { geometry: 'CylinderGeometry', args: [0.5, 0.5, 1, 16], color: 0xf59e0b },
    torus: { geometry: 'TorusGeometry', args: [0.5, 0.2, 8, 16], color: 0x8b5cf6 },
    icosahedron: { geometry: 'IcosahedronGeometry', args: [0.6, 0], color: 0x06b6d4 },
    dodecahedron: { geometry: 'DodecahedronGeometry', args: [0.6, 0], color: 0xec4899 },
    tetrahedron: { geometry: 'TetrahedronGeometry', args: [0.8, 0], color: 0x84cc16 },
    octahedron: { geometry: 'OctahedronGeometry', args: [0.8, 0], color: 0xf97316 },
    ring: { geometry: 'RingGeometry', args: [0.3, 0.6, 16], color: 0x6366f1 },
    plane: { geometry: 'PlaneGeometry', args: [1, 1], color: 0x14b8a6 },
    star: { geometry: 'custom', color: 0xfbbf24 }, // Custom star shape
    diamond: { geometry: 'custom', color: 0xdb2777 }, // Custom diamond shape
    heart: { geometry: 'custom', color: 0xdc2626 }, // Custom heart shape
    cross: { geometry: 'custom', color: 0x7c3aed } // Custom cross shape
  };

  // Sample data for React Force Graph
  const graphData = {
    nodes: [
      { id: 'center', name: 'Hub', val: 20, color: '#3b82f6' },
      { id: 'sphere', name: 'Sphere', val: 15, color: '#ef4444', shape: 'sphere' },
      { id: 'cube', name: 'Cube', val: 12, color: '#10b981', shape: 'cube' },
      { id: 'cone', name: 'Cone', val: 10, color: '#f59e0b', shape: 'cone' },
      { id: 'cylinder', name: 'Cylinder', val: 8, color: '#8b5cf6', shape: 'cylinder' },
      { id: 'torus', name: 'Torus', val: 6, color: '#06b6d4', shape: 'torus' },
      { id: 'icosahedron', name: 'Icosahedron', val: 4, color: '#ec4899', shape: 'icosahedron' },
      { id: 'dodecahedron', name: 'Dodecahedron', val: 3, color: '#84cc16', shape: 'dodecahedron' },
      { id: 'tetrahedron', name: 'Tetrahedron', val: 2, color: '#f97316', shape: 'tetrahedron' }
    ],
    links: [
      { source: 'center', target: 'sphere' },
      { source: 'center', target: 'cube' },
      { source: 'center', target: 'cone' },
      { source: 'center', target: 'cylinder' },
      { source: 'center', target: 'torus' },
      { source: 'center', target: 'icosahedron' },
      { source: 'center', target: 'dodecahedron' },
      { source: 'center', target: 'tetrahedron' }
    ]
  };

  useEffect(() => {
    if (!threeContainerRef.current) return;

    const initThreeJS = async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(
        75,
        threeContainerRef.current!.clientWidth / threeContainerRef.current!.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 5);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(threeContainerRef.current!.clientWidth, threeContainerRef.current!.clientHeight);
      threeContainerRef.current!.appendChild(renderer.domElement);

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Create showcase of different shapes
      const createShapeGrid = () => {
        const shapeNames = Object.keys(shapes);
        const gridSize = Math.ceil(Math.sqrt(shapeNames.length));
        const spacing = 2;

        shapeNames.forEach((shapeName, index) => {
          const shape = shapes[shapeName as keyof typeof shapes];
          const x = (index % gridSize - gridSize / 2) * spacing;
          const y = (Math.floor(index / gridSize) - gridSize / 2) * spacing;

          let geometry;
          
          if (shape.geometry === 'custom') {
            // Create custom geometries
            switch (shapeName) {
              case 'star':
                geometry = new THREE.BufferGeometry();
                const starVertices = [];
                for (let i = 0; i < 10; i++) {
                  const angle = (i / 10) * Math.PI * 2;
                  const radius = i % 2 === 0 ? 0.8 : 0.4;
                  starVertices.push(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius,
                    0
                  );
                }
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
                break;
              case 'diamond':
                geometry = new THREE.ConeGeometry(0.6, 1.2, 4);
                break;
              case 'heart':
                geometry = new THREE.SphereGeometry(0.4, 16, 16);
                break;
              case 'cross':
                geometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
                break;
              default:
                geometry = new THREE.SphereGeometry(0.5, 16, 16);
            }
          } else {
            // @ts-ignore
            geometry = new THREE[shape.geometry](...shape.args);
          }

          const material = new THREE.MeshPhongMaterial({
            color: shape.color,
            transparent: true,
            opacity: 0.8
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(x, y, 0);
          mesh.userData = { shapeName, originalY: y };
          scene.add(mesh);
        });
      };

      createShapeGrid();

      // Animation loop
      const animate = () => {
        if (!isPlaying) return;
        
        animationRef.current = requestAnimationFrame(animate);
        
        const time = Date.now() * 0.001;
        
        // Animate all shapes
        scene.children.forEach((child: any) => {
          if (child.userData.shapeName) {
            child.rotation.y = time * 0.5;
            child.position.y = child.userData.originalY + Math.sin(time * 2 + child.position.x) * 0.2;
          }
        });
        
        controls.update();
        renderer.render(scene, camera);
      };
      
      animate();

      // Cleanup
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (threeContainerRef.current && renderer.domElement) {
          threeContainerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    };

    initThreeJS();
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize React Force Graph
  useEffect(() => {
    if (!forceContainerRef.current) return;

    const initForceGraph = async () => {
      const ForceGraph3D = (await import('react-force-graph-3d')).default;
      const THREE = await import('three');

      const fgRef = { current: null };

      const createForceGraph = () => {
        // This would normally be done with React component
        // For demo purposes, showing the concept
        console.log('Force Graph would be initialized here with custom node shapes');
      };

      createForceGraph();
    };

    initForceGraph();
  }, []);

  const shapeDescriptions = {
    sphere: "Basic sphere - most common node shape, good for general-purpose nodes",
    cube: "Box geometry - useful for structured data, buildings, or containers",
    cone: "Cone shape - great for hierarchical data, pointing to relationships",
    cylinder: "Cylindrical nodes - good for columns, pipes, or cylindrical objects",
    torus: "Donut shape - useful for cycles, rings, or circular processes",
    icosahedron: "20-sided polyhedron - complex geometry, good for detailed nodes",
    dodecahedron: "12-sided polyhedron - geometric complexity, mathematical beauty",
    tetrahedron: "4-sided pyramid - simple but distinctive shape",
    octahedron: "8-sided double pyramid - diamond-like appearance",
    ring: "Flat ring - good for categories or circular relationships",
    plane: "Flat plane - useful for cards, documents, or flat surfaces",
    star: "Custom star shape - attention-grabbing, good for important nodes",
    diamond: "Custom diamond - precious, valuable, or key nodes",
    heart: "Custom heart - emotional connections, favorites, or love",
    cross: "Custom cross - intersections, medical, or religious contexts"
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shapes className="h-8 w-8" />
          Node Shapes Demo
        </h1>
        <p className="text-gray-600 mt-2">
          Explore different node shapes available in Three.js, React Force Graph, and custom geometries
        </p>
      </div>

      <Tabs defaultValue="threejs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="threejs">Three.js Shapes</TabsTrigger>
          <TabsTrigger value="force">Force Graph</TabsTrigger>
          <TabsTrigger value="custom">Custom Shapes</TabsTrigger>
        </TabsList>

        <TabsContent value="threejs" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Box className="h-5 w-5" />
                      Three.js Geometry Showcase
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    ref={threeContainerRef}
                    className="w-full h-[600px] bg-gray-900 rounded-lg"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Available Shapes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {Object.entries(shapes).map(([name, shape]) => (
                      <div key={name} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant="outline"
                            className="capitalize"
                          >
                            {name}
                          </Badge>
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: `#${shape.color.toString(16).padStart(6, '0')}` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600">
                          {shapeDescriptions[name as keyof typeof shapeDescriptions]}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="force" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                React Force Graph Custom Nodes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Force Graph Node Shape Control</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Method 1:</strong> Use <code>nodeThreeObject</code> prop to inject custom Three.js objects</p>
                    <p><strong>Method 2:</strong> Use <code>nodeThreeObjectExtend</code> to modify existing geometries</p>
                    <p><strong>Method 3:</strong> Use <code>nodeColor</code> and <code>nodeVal</code> for basic customization</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Built-in Shapes</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Sphere (default)</li>
                      <li>• Box</li>
                      <li>• Cone</li>
                      <li>• Cylinder</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Custom Shapes</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Any Three.js geometry</li>
                      <li>• Loaded 3D models</li>
                      <li>• Procedural geometry</li>
                      <li>• Sprite images</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Example Code:</h4>
                  <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`// Custom node shapes in React Force Graph
<ForceGraph3D
  nodeThreeObject={({ id, color, val }) => {
    const geometry = new THREE.BoxGeometry(val, val, val);
    const material = new THREE.MeshLambertMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }}
  nodeThreeObjectExtend={true}
/>`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Custom Geometry Creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Procedural Shapes</h3>
                    <div className="space-y-2 text-sm">
                      <p>• <strong>BufferGeometry:</strong> Custom vertex arrays</p>
                      <p>• <strong>ExtrudeGeometry:</strong> 2D shapes to 3D</p>
                      <p>• <strong>LatheGeometry:</strong> Rotational shapes</p>
                      <p>• <strong>ParametricGeometry:</strong> Mathematical functions</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Loaded Models</h3>
                    <div className="space-y-2 text-sm">
                      <p>• <strong>GLTF/GLB:</strong> Complex 3D models</p>
                      <p>• <strong>OBJ:</strong> Object files</p>
                      <p>• <strong>FBX:</strong> Autodesk format</p>
                      <p>• <strong>STL:</strong> 3D printing files</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Performance Considerations:</h4>
                  <div className="space-y-2 text-sm">
                    <p>• <strong>Instancing:</strong> Use InstancedMesh for many identical shapes</p>
                    <p>• <strong>LOD:</strong> Level of detail for distant objects</p>
                    <p>• <strong>Geometry sharing:</strong> Reuse geometries, vary materials</p>
                    <p>• <strong>Culling:</strong> Don&apos;t render off-screen objects</p>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium mb-2">Use Cases by Shape:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="font-medium text-sm">Network Visualization:</p>
                      <p className="text-xs text-gray-600">Servers (cubes), Users (spheres), Connections (cylinders)</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Org Charts:</p>
                      <p className="text-xs text-gray-600">Executives (diamonds), Managers (hexagons), Employees (circles)</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Data Flow:</p>
                      <p className="text-xs text-gray-600">Processes (rectangles), Decision points (diamonds), Data (cylinders)</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Social Networks:</p>
                      <p className="text-xs text-gray-600">VIPs (stars), Groups (polygons), Regular users (spheres)</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}