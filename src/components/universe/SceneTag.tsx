import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * A DOM label pinned to a point in 3D space. Projected every frame and written straight to
 * the element's transform, so it never re-renders React or creates nested React roots
 * (which is what makes drei's <Html> unsafe inside rapidly-swapping stages).
 */
export function SceneTag({
  text,
  active = false,
  position = [0, 0, 0],
  tone,
}: {
  text: string;
  active?: boolean;
  position?: [number, number, number];
  tone?: "storm";
}) {
  const anchor = useRef<THREE.Group>(null);
  const { gl, camera, size } = useThree();
  const el = useMemo(() => {
    if (typeof document === "undefined") return null;
    const span = document.createElement("span");
    span.className = "scene-tag scene-tag-floating";
    span.setAttribute("aria-hidden", "true");
    span.style.opacity = "0"; // hidden until the first projected frame places it
    return span;
  }, []);
  const v = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const host = gl.domElement.parentElement;
    if (!el || !host) return;
    host.appendChild(el);
    return () => el.remove();
  }, [el, gl]);
  useEffect(() => {
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("is-reached", active);
    el.classList.toggle("is-storm", tone === "storm");
  }, [el, text, active, tone]);

  useFrame(() => {
    if (!el || !anchor.current) return;
    anchor.current.getWorldPosition(v);
    v.project(camera);
    const hidden = v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2;
    el.style.opacity = hidden ? "0" : "";
    const x = ((v.x + 1) / 2) * size.width;
    const y = ((1 - v.y) / 2) * size.height;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
  });
  return <group ref={anchor} position={position} />;
}
