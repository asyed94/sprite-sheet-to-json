export class Anim {
	name /** @type {string} */;
	frames /** @type {Frame[]} */;
}

export class Frame {
	x /** @type {number} */;
	y /** @type {number} */;
	w /** @type {number} */;
	h /** @type {number} */;
}

export class SourceSize {
	w /** @type {number} */;
	h /** @type {number} */;
}

class Meta {
	app /** @type {string} */;
	version /** @type {string} */;
	image /** @type {string} */;
	format /** @type {string} */;
	size /** @type {SourceSize} */;
	scale /** @type {string} */;
	smartupdate /** @type {string=} */;
}

/**
 * From Andreas Löw, creator of TexturePacker:
 * https://gamedev.stackexchange.com/a/116000
 * Modified 2024 BattoJutsu
 */
export class TexturePackerJsonHashFrame {
	frame /** @type {Frame} */;
	rotated /** @type {boolean} */;
	trimmed /** @type {boolean} */;
	spriteSourceSize /** @type {Frame} */;
	sourceSize /** @type {SourceSize} */;
}

export class TexturePackerJsonHash {
	frames; /** @type {TexturePackerJsonHashFrame[]} */
	meta /** @type {Meta} */;
}

/**
 * 
 * @param {string} name 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @param {number} frameW 
 * @param {number} frameH 
 * @param {number} frameCount 
 * @returns {Anim}
 */
export function newAnim(name, x, y, w, h, frameW, frameH, frameCount = Infinity) {
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

	const frames /** @type {Frame[]} */ = [];

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

/**
 * 
 * @param {Iterable<Anim>} anims 
 * @param {string} sourceName 
 * @param {number} sourceW 
 * @param {number} sourceH 
 * @returns {TexturePackerJsonHash}
 */
export function anims2json(anims, sourceName, sourceW, sourceH) {
	const /** @type {TexturePackerJsonHash} */ hash = {
		frames: [],
		meta: {
			app: 'sprite-sheet-to-json',
			version: '1.0.0',
			image: sourceName,
			format: 'RGBA8888',
			size: { w: sourceW, h: sourceH },
			scale: '1',
		},
	};

	for (const anim of anims) {
		for (const [i, { x, y, w, h }] of anim.frames.entries()) {
			hash.frames.push({
				frame: { x, y, w, h },
				rotated: false,
				trimmed: false,
				spriteSourceSize: { x, y, w, h },
				sourceSize: {
					w: sourceW,
					h: sourceH,
				},
			});
		}
	}

	return hash;
}
