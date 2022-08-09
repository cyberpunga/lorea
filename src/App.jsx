import * as THREE from "three";
import React, { useRef, useEffect, useState, createRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <Webcam />
      <OrbitControls enableZoom={false} autoRotate />
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
  useFrame(({ camera }) => {
    if (analyser.current && planes.current) {
      const data = analyser.current.getAverageFrequency();
      // planes.current.map((ref) => ref.material.color.setRGB(data / 100, 0, 0));
      planes.current.forEach((ref) => {
        ref.current.scale.x = ref.current.scale.y = (data / 100) * 2;
        ref.current.lookAt(camera.position);
      });
    }
  });
  const length = 16;
  const radius = 32;
  const planes = useRef([]);
  planes.current = Array.from({ length: length }, () => createRef());
  return (
    <React.Fragment>
      {planes.current.map((_, i) => {
        const phi = Math.acos(-1 + (2 * i) / length);
        const theta = Math.sqrt(length * Math.PI) * phi;
        return (
          <mesh
            key={i}
            ref={planes.current[i]}
            position={new THREE.Vector3().setFromSphericalCoords(radius, phi, theta)}
          >
            <planeBufferGeometry args={[16, 9]} />
            {video && (
              <meshStandardMaterial emissive={"white"} side={THREE.DoubleSide}>
                <videoTexture attach="map" args={[video]} />
                <videoTexture attach="emissiveMap" args={[video]} />
              </meshStandardMaterial>
            )}
          </mesh>
        );
      })}
    </React.Fragment>
  );
}
