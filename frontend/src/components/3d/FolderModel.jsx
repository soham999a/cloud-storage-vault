import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const FolderModel = ({ position = [0, 0, 0], name = 'Folder', onClick, color = '#00ff00', scale = 1 }) => {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Animation for hover effect
  const { folderScale, folderY, intensity } = useSpring({
    folderScale: hovered ? [scale * 1.1, scale * 1.1, scale * 1.1] : [scale, scale, scale],
    folderY: hovered ? position[1] + 0.1 : position[1],
    intensity: hovered ? 1.5 : 1,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  // Gentle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.05;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime()) * 0.05;
    }
  });

  return (
    <animated.group
      ref={groupRef}
      position-x={position[0]}
      position-z={position[2]}
      position-y={folderY}
      scale={folderScale}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Folder base */}
      <animated.mesh castShadow receiveShadow>
        <boxGeometry args={[1, 0.1, 0.8]} />
        <animated.meshStandardMaterial 
          color={color} 
          metalness={0.5} 
          roughness={0.2} 
          emissive={color}
          emissiveIntensity={intensity}
        />
      </animated.mesh>
      
      {/* Folder front */}
      <animated.mesh castShadow receiveShadow position={[0, 0.25, 0.35]}>
        <boxGeometry args={[1, 0.5, 0.1]} />
        <animated.meshStandardMaterial 
          color={color} 
          metalness={0.5} 
          roughness={0.2}
          emissive={color}
          emissiveIntensity={intensity}
        />
      </animated.mesh>
      
      {/* Folder back */}
      <animated.mesh castShadow receiveShadow position={[0, 0.25, -0.35]}>
        <boxGeometry args={[1, 0.5, 0.1]} />
        <animated.meshStandardMaterial 
          color={color} 
          metalness={0.5} 
          roughness={0.2}
          emissive={color}
          emissiveIntensity={intensity}
        />
      </animated.mesh>
      
      {/* Folder left */}
      <animated.mesh castShadow receiveShadow position={[-0.45, 0.25, 0]}>
        <boxGeometry args={[0.1, 0.5, 0.8]} />
        <animated.meshStandardMaterial 
          color={color} 
          metalness={0.5} 
          roughness={0.2}
          emissive={color}
          emissiveIntensity={intensity}
        />
      </animated.mesh>
      
      {/* Folder right */}
      <animated.mesh castShadow receiveShadow position={[0.45, 0.25, 0]}>
        <boxGeometry args={[0.1, 0.5, 0.8]} />
        <animated.meshStandardMaterial 
          color={color} 
          metalness={0.5} 
          roughness={0.2}
          emissive={color}
          emissiveIntensity={intensity}
        />
      </animated.mesh>
      
      {/* Folder top (lid) */}
      <animated.mesh castShadow receiveShadow position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1, 0.1, 0.8]} />
        <animated.meshStandardMaterial 
          color={color} 
          metalness={0.5} 
          roughness={0.2}
          emissive={color}
          emissiveIntensity={intensity}
          transparent
          opacity={0.9}
        />
      </animated.mesh>
      
      {/* Folder name */}
      <Text
        position={[0, -0.3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.9}
        lineHeight={1}
        textAlign="center"
      >
        {name}
      </Text>
    </animated.group>
  );
};

export default FolderModel;
