// RobotModel.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import type { Group, AnimationClip, Object3D } from 'three';
import type { GLTF } from 'three-stdlib';

type RobotModelProps = JSX.IntrinsicElements['group'];

const RobotModel: React.FC<RobotModelProps> = (props) => {
  const group = useRef<Group>(null);

  // Load models (typed via GLTF from three-stdlib)
  const { scene: robotScene, animations } = useGLTF('/models/robot.glb') as unknown as GLTF & {
    scene: Group;
    animations: AnimationClip[];
  };
  const { scene: moneyScene1 } = useGLTF('/models/money.glb') as unknown as GLTF & { scene: Group };
  const { scene: moneyScene2 } = useGLTF('/models/money1.glb') as unknown as GLTF & { scene: Group };

  // Animations
  const { mixer } = useAnimations(animations as AnimationClip[], group);

  // State
  const [arrived, setArrived] = useState(false);
  const [dropSecond, setDropSecond] = useState(false);

  // Clone money stacks so each instance is independent
  const [money1] = useState<Object3D>(() => moneyScene1.clone());
  const [money2] = useState<Object3D>(() => moneyScene2.clone());

  // Y positions for drop animation
  const money1Y = useRef<number>(5);
  const money2Y = useRef<number>(5);

  // Start trimmed walk animation
  useEffect(() => {
    if (!animations || animations.length === 0 || !group.current) return;

    const originalClip = animations[0];
    const trimmedClip = THREE.AnimationUtils.subclip(
      originalClip,
      `${originalClip.name}_trimmed`,
      0,
      75
    );
    const walkAction = mixer.clipAction(trimmedClip, group.current);
    walkAction.reset().setLoop(THREE.LoopRepeat, Infinity).play();

    return () => {
      walkAction.stop();
    };
  }, [animations, mixer]);

  // Initial placement of money stacks
  useEffect(() => {
    // Money 1 (left of robot, slightly smaller)
    money1.position.set(-5, 5, -2.5);
    (money1.scale as THREE.Vector3).set(2, 1.5, 2.5);

    // Money 2 (right of robot, larger)
    money2.position.set(-5, 5, -2.5);
    (money2.scale as THREE.Vector3).set(3, 2.2, 3.2);
  }, [money1, money2]);

  // Frame loop
  useFrame(() => {
    if (!group.current) return;

    // Walk-in
    if (!arrived) {
      group.current.position.x += 0.04;
      if (group.current.position.x >= 0) {
        group.current.position.x = 0;
        setArrived(true);
        setTimeout(() => setDropSecond(true), 1000);
      }
    }

    // Idle bounce + drops
    if (arrived) {
      const t = performance.now() * 0.002;
      group.current.position.y = -1 + Math.sin(t * 4) * 0.05;

      if (money1Y.current > -1.1) {
        money1Y.current -= 0.05;
        money1.position.y = money1Y.current;
      }

      if (dropSecond && money2Y.current > -1.1) {
        money2Y.current -= 0.05;
        money2.position.y = money2Y.current;
      }
    }
  });

  return (
    <>
      {/* 👣 Robot */}
      <primitive
        ref={group}
        object={robotScene}
        position={[-5, -1, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={2.5}
        {...props}
      />

      {/* 💸 Money stacks */}
      {arrived && <primitive object={money1} />}
      {arrived && <primitive object={money2} />}
    </>
  );
};

export default RobotModel;

// (Optional) Preload for faster first render
useGLTF.preload('/models/robot.glb');
useGLTF.preload('/models/money.glb');
useGLTF.preload('/models/money1.glb');