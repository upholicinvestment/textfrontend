// RobotModel.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  ComponentPropsWithoutRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import type { Group, AnimationClip, Object3D } from "three";
import type { GLTF } from "three-stdlib";

type RobotModelProps = ComponentPropsWithoutRef<"group">;

// Relaxed result type (scene as Group for convenience)
type GLTFWithScene = Omit<GLTF, "scene"> & { scene: Group };

const RobotModel: React.FC<RobotModelProps> = (props) => {
  // Root group that receives animation actions
  const group = useRef<Group>(null!);

  // ✅ No generics — works across drei versions that expect a single/none generic
  const robotGltf = useGLTF("/models/robot.glb") as unknown as GLTFWithScene;
  const moneyGltf1 = useGLTF("/models/money.glb") as unknown as GLTFWithScene;
  const moneyGltf2 = useGLTF("/models/money1.glb") as unknown as GLTFWithScene;

  // Use mixer only (avoid unused `actions` warning)
  const { mixer } = useAnimations(
    (robotGltf.animations as AnimationClip[]) || [],
    group
  );

  // State
  const [arrived, setArrived] = useState(false);
  const [dropSecond, setDropSecond] = useState(false);
  const scheduledDropRef = useRef(false);

  // Independent clones for money stacks
  const money1 = useMemo<Object3D>(() => moneyGltf1.scene.clone(), [moneyGltf1.scene]);
  const money2 = useMemo<Object3D>(() => moneyGltf2.scene.clone(), [moneyGltf2.scene]);

  // Y positions for drop animation
  const money1Y = useRef<number>(5);
  const money2Y = useRef<number>(5);

  // Start trimmed walk animation on mount
  useEffect(() => {
    if (!robotGltf.animations?.length || !group.current) return;

    const originalClip = robotGltf.animations[0];
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
  }, [robotGltf.animations, mixer]);

  // Optional: enable shadows on robot meshes
  useEffect(() => {
    robotGltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }, [robotGltf.scene]);

  // Initial placement/scales for money stacks
  useEffect(() => {
    // Money 1 (left of robot, slightly smaller)
    money1.position.set(-5, 5, -2.5);
    money1.scale.set(2, 1.5, 2.5);

    // Money 2 (right of robot, larger)
    money2.position.set(-5, 5, -2.5);
    money2.scale.set(3, 2.2, 3.2);
  }, [money1, money2]);

  // Frame loop
  useFrame(() => {
    const g = group.current;
    if (!g) return;

    // Walk-in
    if (!arrived) {
      g.position.x += 0.04;
      if (g.position.x >= 0) {
        g.position.x = 0;
        setArrived(true);
        if (!scheduledDropRef.current) {
          scheduledDropRef.current = true;
          setTimeout(() => setDropSecond(true), 1000);
        }
      }
    }

    // Idle bounce + drops
    if (arrived) {
      const t = performance.now() * 0.002;
      g.position.y = -1 + Math.sin(t * 4) * 0.05;

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
      {/* 👣 Robot (wrap scene in a group so ref targets a Group) */}
      <group
        ref={group}
        position={[-5, -1, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={2.5}
        {...props}
      >
        <primitive object={robotGltf.scene} />
      </group>

      {/* 💸 Money stacks */}
      {arrived && <primitive object={money1} />}
      {arrived && <primitive object={money2} />}
    </>
  );
};

export default RobotModel;

// (Optional) Preload for faster first render
useGLTF.preload("/models/robot.glb");
useGLTF.preload("/models/money.glb");
useGLTF.preload("/models/money1.glb");