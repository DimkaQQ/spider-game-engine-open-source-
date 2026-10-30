const { transform } = require('sucrase');

const testCode = `
import React from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

export default function World() {
  return (
    <group>
      <ambientLight intensity={0.5} />
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </group>
  );
}
`;

const res = transform(testCode, { transforms: ['jsx', 'imports', 'typescript'] });
console.log('R3F transform success:', !!res.code);
