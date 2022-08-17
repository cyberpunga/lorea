import * as THREE from "three";
import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export default function App() {
  return (
    <Canvas camera={{ position: [0, 8, 8] }}>
      <Webcam />
      <OrbitControls enablePan={false} autoRotate />
      <EffectComposer multisampling={1} frameBufferType={THREE.HalfFloatType}>
        <ChromaticAberration blendFunction={BlendFunction.DIFFERENCE} offset={[0.08, -0.08]} />
      </EffectComposer>
    </Canvas>
  );
}

function Webcam({ count = 32, radius = 32, temp = new THREE.Object3D() }) {
  const ref = useRef();
  const analyser = useRef();
  const [video, setVideo] = useState();

  useEffect(() => {
    (async function () {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 1280, height: 720, facingMode: "user" },
      });
      // deal with video
      const vid = document.createElement("video");
      vid.srcObject = stream;
      vid.muted = true;
      vid.play();
      setVideo(vid);
      // deal with audio
      const listener = new THREE.AudioListener();
      listener.gain.disconnect();
      const audio = new THREE.Audio(listener);
      const context = listener.context;
      const source = context.createMediaStreamSource(stream);
      audio.setNodeSource(source);
      analyser.current = new THREE.AudioAnalyser(audio, 32);
    })();
  }, []);

  useFrame(({ camera }) => {
    for (let i = 0; i < count; i++) {
      // Set positions
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      temp.position.copy(new THREE.Vector3().setFromSphericalCoords(radius, phi, theta));
      // Planes always look at the camera
      temp.lookAt(camera.position);
      // Add some audio reactive behaviour here
      if (analyser.current) {
        const audioFreq = analyser.current.getAverageFrequency();
        // temp.material.color.setRGB(audioFreq / 100, 0, 0);
        temp.scale.x = temp.scale.y = THREE.MathUtils.lerp(temp.scale.x, audioFreq * 0.02, 0.02);
      }

      temp.updateMatrix();
      ref.current.setMatrixAt(i++, temp.matrix);
    }
    // Update the instance
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <planeBufferGeometry args={[16, 9]} />
      {video ? (
        <meshStandardMaterial emissive={0xffffffff}>
          <videoTexture attach="map" args={[video]} />
          <videoTexture attach="emissiveMap" args={[video]} />
        </meshStandardMaterial>
      ) : (
        <meshNormalMaterial />
      )}
    </instancedMesh>
  );
}
