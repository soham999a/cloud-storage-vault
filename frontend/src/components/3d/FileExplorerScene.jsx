import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  useHelper, 
  Text,
  Float,
  Stars
} from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import FolderModel from './FolderModel';
import FileModel from './FileModel';

// Grid layout helper
const calculateGridPosition = (index, totalItems, spacing = 2) => {
  const itemsPerRow = Math.ceil(Math.sqrt(totalItems));
  const row = Math.floor(index / itemsPerRow);
  const col = index % itemsPerRow;
  
  const centerOffset = (itemsPerRow - 1) * spacing / 2;
  
  return [
    col * spacing - centerOffset,
    0,
    row * spacing - centerOffset
  ];
};

// Lighting setup component
const SceneLighting = () => {
  const directionalLightRef = useRef();
  const pointLightRef = useRef();
  
  // Helper to visualize light direction in development
  // useHelper(directionalLightRef, THREE.DirectionalLightHelper, 1, 'red');
  // useHelper(pointLightRef, THREE.PointLightHelper, 0.5, 'blue');
  
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight 
        ref={directionalLightRef}
        position={[5, 8, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize-width={1024} 
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight 
        ref={pointLightRef}
        position={[-5, 5, -5]} 
        intensity={0.5} 
        color="#5f5fff"
      />
      <pointLight 
        position={[5, 3, -5]} 
        intensity={0.3} 
        color="#ff5f5f"
      />
    </>
  );
};

// Floor component
const Floor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial 
        color="#111111" 
        metalness={0.8}
        roughness={0.3}
        envMapIntensity={0.5}
      />
    </mesh>
  );
};

// Main scene component
const FileExplorerScene = ({ files = [], folders = [], onFileClick, onFolderClick, currentPath = '/' }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const cameraControlsRef = useRef();
  
  // Calculate total items for grid layout
  const totalItems = files.length + folders.length;
  
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={['#050505']} />
        
        {/* Camera setup */}
        <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
        <OrbitControls 
          ref={cameraControlsRef}
          enableDamping 
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2 - 0.1}
          target={[0, 0, 0]}
        />
        
        {/* Environment and lighting */}
        <SceneLighting />
        <Environment preset="night" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* Floor */}
        <Floor />
        
        {/* Path indicator */}
        <Float
          speed={2}
          rotationIntensity={0.2}
          floatIntensity={0.5}
          position={[0, 2, -5]}
        >
          <Text
            color="#ffffff"
            fontSize={0.5}
            maxWidth={10}
            lineHeight={1}
            letterSpacing={0.02}
            textAlign="center"
            font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
            anchorX="center"
            anchorY="middle"
          >
            {currentPath}
          </Text>
        </Float>
        
        {/* Folders */}
        {folders.map((folder, index) => (
          <FolderModel 
            key={`folder-${folder.id || index}`}
            position={calculateGridPosition(index, totalItems)}
            name={folder.name}
            color="#00ff00"
            onClick={() => onFolderClick && onFolderClick(folder)}
          />
        ))}
        
        {/* Files */}
        {files.map((file, index) => (
          <FileModel 
            key={`file-${file.id || index}`}
            position={calculateGridPosition(index + folders.length, totalItems)}
            fileName={file.name}
            onClick={() => onFileClick && onFileClick(file)}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default FileExplorerScene;
