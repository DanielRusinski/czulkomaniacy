import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const Dice3D = ({ rolling, targetValue, onFinish }) => {
  const diceRef = useRef();
  const [displayValue, setDisplayValue] = useState(1);

  useEffect(() => {
    let interval;
    if (rolling) {
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 80);
      const timer = setTimeout(() => {
        clearInterval(interval);
        setDisplayValue(targetValue);
        if (onFinish) onFinish();
      }, 800);
      return () => { clearInterval(interval); clearTimeout(timer); };
    }
  }, [rolling, targetValue, onFinish]);

  useFrame((state) => {
    if (!diceRef.current) return;
    if (rolling) {
      diceRef.current.rotation.x += 0.4;
      diceRef.current.rotation.y += 0.4;
      diceRef.current.position.y = 1.5 + Math.abs(Math.sin(state.clock.elapsedTime * 20)) * 0.5;
    } else {
      diceRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.3;
      diceRef.current.position.y = THREE.MathUtils.lerp(diceRef.current.position.y, 1.2, 0.1);
    }
  });

  return (
    <group position={[5, 1.2, 5]}>
      <mesh ref={diceRef} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="white" />
        {[
          [0, 0, 0.51, [0, 0, 0]], [0, 0, -0.51, [0, Math.PI, 0]], [0.51, 0, 0, [0, Math.PI/2, 0]],
          [-0.51, 0, 0, [0, -Math.PI/2, 0]], [0, 0.51, 0, [-Math.PI/2, 0, 0]], [0, -0.51, 0, [Math.PI/2, 0, 0]],
        ].map((p, i) => (
          <Text key={i} position={p.slice(0,3)} rotation={p[3]} fontSize={0.6} color="#db2777" fontWeight="black">
            {displayValue}
          </Text>
        ))}
      </mesh>
    </group>
  );
};

export default Dice3D;