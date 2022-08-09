import * as THREE from "three";
import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5], far: 50 }}>
      <Webcam />
      <OrbitControls autoRotate />
      <EffectComposer multisampling={1} frameBufferType={THREE.HalfFloatType}>
        <ChromaticAberration
          blendFunction={BlendFunction.DIFFERENCE} // blend mode
          offset={[0.032, 0]} // color offset
        />
      </EffectComposer>
    </Canvas>
  );
}

function Webcam() {
  const [video, setVideo] = useState();
  const analyser = useRef();
  const plane = useRef();
  useEffect(() => {
    (async () => {
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
  useFrame(() => {
    if (analyser.current) {
      const data = analyser.current.getAverageFrequency();
      plane.current.material.color.setRGB(data / 100, 0, 0);
      plane.current.scale.x = plane.current.scale.y = (data / 100) * 2;
    }
  });
  return (
    <mesh ref={plane}>
      <planeBufferGeometry args={[3.2, 1.9]} />
      {video && (
        <meshStandardMaterial emissive={"white"} side={THREE.DoubleSide}>
          <videoTexture attach="map" args={[video]} />
          <videoTexture attach="emissiveMap" args={[video]} />
        </meshStandardMaterial>
      )}
    </mesh>
  );
}
