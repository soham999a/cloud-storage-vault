import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// Helper function to determine file color based on type
const getFileColor = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  
  // Document files
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) {
    return '#4285F4'; // Blue
  }
  // Image files
  else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
    return '#EA4335'; // Red
  }
  // Video files
  else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) {
    return '#FBBC05'; // Yellow
  }
  // Audio files
  else if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
    return '#34A853'; // Green
  }
  // Archive files
  else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return '#9C27B0'; // Purple
  }
  // Default
  return '#9AA0A6'; // Gray
};

const FileModel = ({ position = [0, 0, 0], fileName = 'file.txt', onClick, scale = 0.8 }) => {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const fileColor = getFileColor(fileName);
  
  // Animation for hover effect
  const { fileScale, fileY, intensity } = useSpring({
    fileScale: hovered ? [scale * 1.1, scale * 1.1, scale * 1.1] : [scale, scale, scale],
    fileY: hovered ? position[1] + 0.1 : position[1],
    intensity: hovered ? 1.5 : 1,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  // Gentle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3 + position[0]) * 0.05;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() + position[2]) * 0.05;
    }
  });

  return (
    <animated.group
      ref={groupRef}
      position-x={position[0]}
      position-z={position[2]}
      position-y={fileY}
      scale={fileScale}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* File base */}
      <animated.mesh castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.05, 0.9]} />
        <animated.meshStandardMaterial 
          color="#ffffff" 
          metalness={0.3} 
          roughness={0.4}
        />
      </animated.mesh>
      
      {/* File content */}
      <animated.mesh castShadow receiveShadow position={[0, 0.03, 0]}>
        <boxGeometry args={[0.65, 0.02, 0.85]} />
        <animated.meshStandardMaterial 
          color="#f5f5f5" 
          metalness={0.1} 
          roughness={0.6}
        />
      </animated.mesh>
      
      {/* File icon/indicator */}
      <animated.mesh castShadow receiveShadow position={[0, 0.06, 0]}>
        <boxGeometry args={[0.3, 0.05, 0.3]} />
        <animated.meshStandardMaterial 
          color={fileColor} 
          metalness={0.5} 
          roughness={0.2}
          emissive={fileColor}
          emissiveIntensity={intensity}
        />
      </animated.mesh>
      
      {/* File corner fold */}
      <animated.mesh castShadow receiveShadow position={[0.25, 0.06, -0.35]}>
        <boxGeometry args={[0.2, 0.05, 0.2]} />
        <animated.meshStandardMaterial 
          color="#e0e0e0" 
          metalness={0.3} 
          roughness={0.4}
        />
      </animated.mesh>
      
      {/* File name */}
      <Text
        position={[0, -0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.9}
        lineHeight={1}
        textAlign="center"
      >
        {fileName.length > 15 ? fileName.substring(0, 12) + '...' : fileName}
      </Text>
    </animated.group>
  );
};

export default FileModel;
