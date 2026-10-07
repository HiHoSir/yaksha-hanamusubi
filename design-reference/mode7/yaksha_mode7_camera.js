// Shin Momotarou-style perspective camera approximation
// t = 0 at top/far, 1 at bottom/near.

export function perspectiveScale(t, {
  far = 0.34,
  near = 1.30,
  gamma = 1.85
} = {}) {
  t = Math.max(0, Math.min(1, t));
  return far + (near - far) * Math.pow(t, gamma);
}

export function mode7LikeMatrix(angleRad, scale) {
  const c = Math.cos(angleRad) * scale;
  const s = Math.sin(angleRad) * scale;
  return {
    a:  c,
    b:  s,
    c: -s,
    d:  c
  };
}

// Build scanline/strip parameters for Canvas strip rendering or WebGL uniforms.
export function buildPerspectiveStrips({
  height,
  stripHeight = 2,
  angleRad = 0,
  far = 0.34,
  near = 1.30,
  gamma = 1.85
}) {
  const strips = [];
  for (let y = 0; y < height; y += stripHeight) {
    const centerY = Math.min(height - 1, y + stripHeight * 0.5);
    const t = centerY / Math.max(1, height - 1);
    const scale = perspectiveScale(t, { far, near, gamma });
    strips.push({
      y,
      h: Math.min(stripHeight, height - y),
      scale,
      matrix: mode7LikeMatrix(angleRad, scale)
    });
  }
  return strips;
}
