import {Anim, newAnim, anims2json} from './animations';

/** STATE */

// Map to hold anims
const anims: Map<string, Anim> = new Map();

/** GUI */

// Invisible canvas to hold sprite sheet image data
const main = document.createElement('canvas');
const mainCtx = main.getContext('2d');

// Invisible canvas to hold animation frame overlays
const overlay = document.createElement('canvas');
const overlayCtx = overlay.getContext('2d');

// Visible canvas to display everything at 4x scale
const disp = document.getElementById('disp') as HTMLCanvasElement;
const dispCtx = disp.getContext('2d');

// Browse button to pick sprite sheet image
const browseBtn = document.getElementById('browse') as HTMLInputElement;
browseBtn.addEventListener('change', handleFile);

// View JSON button to show TexturePacker JSON Hash output
const viewJsonBtn = document.getElementById('view-json') as HTMLButtonElement;
viewJsonBtn.addEventListener('click', showJson);

// Save JSON button to download TexturePacker JSON Hash output
const saveJsonBtn = document.getElementById('save-json') as HTMLButtonElement;
saveJsonBtn.addEventListener('click', saveJson);

// Anims select
const animsSel = document.getElementById('anims') as HTMLSelectElement;
animsSel.addEventListener('change', selectAnim);

// Frames select
const framesSel = document.getElementById('frames') as HTMLSelectElement;

// Add Anim
const addAnimBtn = document.getElementById('add-anim') as HTMLButtonElement;
addAnimBtn.addEventListener('click', addAnim);
// Del Anim
const delAnimBtn = document.getElementById('del-anim') as HTMLButtonElement;
delAnimBtn.addEventListener('click', delAnim);

// Add Frame
const addFrameBtn = document.getElementById('add-frame') as HTMLButtonElement;
// Del Frame
const delFrameBtn = document.getElementById('del-frame') as HTMLButtonElement;

// Name
const namePanel = document.getElementById('name-panel') as HTMLDivElement;
const nameText = document.getElementById('name-text') as HTMLInputElement;
nameText.addEventListener('focus', () => nameText.select());
nameText.addEventListener('input', setAnimName);

// Frames
const framesPanel = document.getElementById('frames-panel') as HTMLDivElement;

// Frames controls
const framesCtls = {
  x: document.getElementById('x') as HTMLInputElement,
  y: document.getElementById('y') as HTMLInputElement,
  w: document.getElementById('w') as HTMLInputElement,
  h: document.getElementById('h') as HTMLInputElement,
  frameW: document.getElementById('frame-w') as HTMLInputElement,
  frameH: document.getElementById('frame-h') as HTMLInputElement,
  frameCount: document.getElementById('frame-count') as HTMLInputElement,
};
Object.values(framesCtls).forEach(ctl => {
  ctl.addEventListener('focus', () => ctl.select());
  ctl.addEventListener('input', updateAnim);
});

// Create/Cancel Anim
const createBtn = document.getElementById('create') as HTMLButtonElement;
createBtn.addEventListener('click', createAnim);
const cancelBtn = document.getElementById('cancel') as HTMLButtonElement;
cancelBtn.addEventListener('click', cancelAnim);

// View JSON div
const jsonDiv = document.getElementById('json-div') as HTMLInputElement;
const jsonFade = document.getElementById('json-fade') as HTMLInputElement;
const jsonText = document.getElementById('json-text') as HTMLInputElement;
jsonFade.addEventListener('click', hideJson);

/** FUNCTIONS */

async function handleFile() {
  // Get file handle
  const file = this.files[0] as File;

  // Create img element
  const img = new Image();
  img.addEventListener('load', function () {
    // Load image into main
    main.width = this.width;
    main.height = this.height;
    mainCtx.imageSmoothingEnabled = false;
    mainCtx.drawImage(img, 0, 0);

    // Fit overlay canvas to main
    overlay.width = main.width;
    overlay.height = main.height;

    // Scale disp to 4x main
    disp.width = main.width * 4;
    disp.height = main.height * 4;

    // Refresh display
    refreshDisp();
  });

  // Load file into img
  img.src = URL.createObjectURL(file);
}

function selectAnim() {
  const animOpt = animsSel.options[animsSel.selectedIndex];
  if (animOpt) {
    // Show name panel
    namePanel.style.visibility = 'visible';

    // Fill name text
    nameText.value = animOpt.text;

    // Draw its overlay
    drawOverlay(anims.get(animOpt.text));
  } else {
    // Hide name panel
    namePanel.style.visibility = 'hidden';
  }
}

function addAnim() {
  showCreatePanel();

  updateAnim();
}

function updateAnim() {
  // Restrict input
  for (const key in framesCtls) {
    const ctl = framesCtls[key];
    ctl.value = ctl.value.replace(/[^0-9]/, '');
  }

  for (const key of ['x', 'w', 'frameW']) {
    const ctl = framesCtls[key];
    ctl.value = Math.min(ctl.value, main.width);
  }

  for (const key of ['y', 'h', 'frameH']) {
    const ctl = framesCtls[key];
    ctl.value = Math.min(ctl.value, main.height);
  }

  // Create anim from frames values
  const anim = newAnim(
    nameText.value,
    Number(framesCtls.x.value),
    Number(framesCtls.y.value),
    Number(framesCtls.w.value),
    Number(framesCtls.h.value),
    Number(framesCtls.frameW.value),
    Number(framesCtls.frameH.value),
    Number(framesCtls.frameCount.value)
  );

  // Draw it
  drawOverlay(anim);
}

function createAnim() {
  // Hide Name/Frames panel
  hideCreatePanel();

  // Create anim from frames values
  const anim = newAnim(
    nameText.value,
    Number(framesCtls.x.value),
    Number(framesCtls.y.value),
    Number(framesCtls.w.value),
    Number(framesCtls.h.value),
    Number(framesCtls.frameW.value),
    Number(framesCtls.frameH.value),
    Number(framesCtls.frameCount.value)
  );

  // Add it to the anims map
  anims.set(anim.name, anim);

  // Add an option for it to the anims selector
  const animOpt = document.createElement('option');
  animOpt.text = anim.name;
  animsSel.add(animOpt);

  // Select it
  animsSel.selectedIndex = animOpt.index;
  selectAnim();
}

function cancelAnim() {
  // Hide Name/Frames panel
  hideCreatePanel();

  // Clear overlay
  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

  // Refresh disp
  refreshDisp();
}

function delAnim() {
  const delIdx = animsSel.selectedIndex;
  const animOpt = animsSel.options[animsSel.selectedIndex];
  if (animOpt) {
    // Delete anim from anims map
    anims.delete(animOpt.text);

    // Remove its option from anims selector
    animOpt.remove();

    // Clear the overlay
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    refreshDisp();

    // Select the one that replaced it
    const maxIdx = animsSel.options.length - 1;
    animsSel.selectedIndex = Math.min(delIdx, maxIdx);
    selectAnim();
  }
}

function setAnimName() {
  // Restrict input
  nameText.value = nameText.value.replace(/[^a-zA-Z0-9_-]/, '');
  // Get anim
  const animOpt = animsSel.options[animsSel.selectedIndex];
  if (animOpt) {
    // Change its name
    const anim = anims.get(animOpt.text);
    anims.delete(anim.name);
    anim.name = nameText.value;
    animOpt.text = nameText.value;
    anims.set(anim.name, anim);
  }
}

function drawOverlay(anim: Anim) {
  // Clear overlay
  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

  // Draw an overlay for the anim
  for (const frame of anim.frames) {
    overlayCtx.imageSmoothingEnabled = false;
    overlayCtx.lineWidth = 1;
    overlayCtx.strokeStyle = 'black';
    overlayCtx.translate(0.5, 0.5);
    overlayCtx.strokeRect(frame.x, frame.y, frame.w - 1, frame.h - 1);
    overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Refresh disp
  refreshDisp();
}

function refreshDisp() {
  // Clear disp
  dispCtx.clearRect(0, 0, disp.width, disp.height);

  // Draw main and overlay to disp
  dispCtx.imageSmoothingEnabled = false;
  // dispCtx.globalCompositeOperation = 'screen';
  dispCtx.drawImage(
    main,
    0,
    0,
    main.width,
    main.height,
    0,
    0,
    disp.width,
    disp.height
  );
  dispCtx.drawImage(
    overlay,
    0,
    0,
    overlay.width,
    overlay.height,
    0,
    0,
    disp.width,
    disp.height
  );
}

function showCreatePanel() {
  // Ensure no anim is already selected
  animsSel.selectedIndex = -1;

  // Show name/frames panel
  namePanel.style.visibility = 'visible';
  framesPanel.style.visibility = 'visible';

  // Disable everything else
  browseBtn.disabled = true;
  animsSel.disabled = true;
  framesSel.disabled = true;
  addAnimBtn.disabled = true;
  delAnimBtn.disabled = true;
  addFrameBtn.disabled = true;
  delFrameBtn.disabled = true;
}

function hideCreatePanel() {
  // Hide name/frames panel
  namePanel.style.visibility = 'hidden';
  framesPanel.style.visibility = 'hidden';

  // Enable everything else
  browseBtn.disabled = false;
  animsSel.disabled = false;
  framesSel.disabled = false;
  addAnimBtn.disabled = false;
  delAnimBtn.disabled = false;
  addFrameBtn.disabled = false;
  delFrameBtn.disabled = false;
}

function showJson() {
  const srcName = browseBtn.files.length > 0 ? browseBtn.files[0].name : '';
  const jsonHash = anims2json(anims.values(), srcName, main.width, main.height);
  jsonText.value = JSON.stringify(jsonHash, null, 2);
  jsonDiv.style.visibility = 'visible';
}

function hideJson() {
  jsonDiv.style.visibility = 'hidden';
}

function saveJson() {
  const srcName = browseBtn.files.length > 0 ? browseBtn.files[0].name : 'name';
  const split = srcName.split('.');
  const name = split.length > 1 ? split.slice(0, -1).join('.') : srcName;
  const jsonName = name + '.json';

  const jsonHash = anims2json(anims.values(), srcName, main.width, main.height);
  const json = JSON.stringify(jsonHash, null, 2);

  download(jsonName, json);
}

function download(filename: string, text: string | number | boolean) {
  const element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
  );
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
