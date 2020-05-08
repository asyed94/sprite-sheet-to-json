export interface Anim {
  name: string;
  frames: Frame[];
}

export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * From Andreas Löw, creator of TexturePacker:
 * https://gamedev.stackexchange.com/a/116000
 */
export interface TexturePackerJsonHashFrame {
  frame: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  sourceSize: {
    w: number;
    h: number;
  };
}

export interface TexturePackerJsonHash {
  frames: {[name: string]: TexturePackerJsonHashFrame};
  meta: {
    app: string;
    version: string;
    image: string;
    format: string;
    size: {w: number; h: number};
    scale: string;
    smartupdate?: string;
  };
}

export function newAnim(
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  frameW: number,
  frameH: number,
  frameCount: number = Infinity
): Anim {
  // w, h, frameW, frameH, frameCount should always be > 0
  if (w < 1) w = 1;
  if (h < 1) h = 1;
  if (frameW < 1) frameW = 1;
  if (frameH < 1) frameH = 1;
  if (frameCount < 1) frameCount = Infinity;

  // Don't divide by 0
  if (frameH === 0 && h !== frameH) frameH = h;
  if (frameW === 0 && w !== frameW) frameW = w;

  const rows = Math.max(Math.ceil(h / frameH), 0);
  const cols = Math.max(Math.ceil(w / frameW), 0);

  const frames: Frame[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (frameCount > 0) {
        frames.push({
          x: x + col * frameW,
          y: y + row * frameH,
          w: frameW,
          h: frameH,
        });
        frameCount--;
      }
    }
  }

  return {
    name,
    frames,
  };
}

export function anims2json(
  anims: Iterable<Anim>,
  sourceName: string,
  sourceW: number,
  sourceH: number
): TexturePackerJsonHash {
  const hash: TexturePackerJsonHash = {
    frames: {},
    meta: {
      app: 'sprite-sheet-to-json',
      version: '1.0.0',
      image: sourceName,
      format: 'RGBA8888',
      size: {w: sourceW, h: sourceH},
      scale: '1',
    },
  };

  for (const anim of anims) {
    for (const [i, {x, y, w, h}] of anim.frames.entries()) {
      hash.frames[`${anim.name}-${i}`] = {
        frame: {x, y, w, h},
        rotated: false,
        trimmed: false,
        spriteSourceSize: {x, y, w, h},
        sourceSize: {
          w: sourceW,
          h: sourceH,
        },
      };
    }
  }

  return hash;
}
