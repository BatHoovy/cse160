
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;    // Per-object model matrix
  uniform mat4 u_ViewMatrix;     // Camera view matrix
  uniform mat4 u_ProjMatrix;     // Projection matrix
  uniform mat4 u_GlobalRotation; // ADDED: Global rotation matrix

  void main() {
    // Apply projection * view * global_rotation * model * position
    gl_Position = u_ProjMatrix * u_ViewMatrix * u_GlobalRotation * u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  // REMOVED: varying vec4 v_Color;
  uniform vec4 u_FragColor; // ADDED: Uniform for color
  void main() {
    // CHANGED: gl_FragColor = v_Color;
    gl_FragColor = u_FragColor; // Use the uniform
  }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let a_Color; // New attribute for vertex color
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjMatrix;

let gAnimalGlobalRotation = 0; // Global rotation angle
let u_GlobalRotation; // Location of u_GlobalRotation uniform
let u_FragColor;

let g_cube = null; // Global cube object
let g_cylinder = null;
let g_projMatrix = new Matrix4();
let g_viewMatrix = new Matrix4();
let g_modelMatrix = new Matrix4(); // Can be used if cube doesn't have its own
let g_modelMatrix2 = new Matrix4();

// Rotation angles controlled by sliders
let g_angleX = 0;
let g_angleY = 0;
let g_cameraZ = 3; // Camera position on Z axis

let g_joint1Angle = 0;
let g_joint2Angle = 0; // Elbow
let g_joint3Angle = 0;

let g_time = 0; // Global time variable (e.g., seconds)
let g_startTime = performance.now() / 1000.0; // Store the start time
let g_seconds = 0; // Store elapsed seconds

let g_animationOn = false; // Flag to control animation state
let g_rightElbowAngle = 0;
let g_rightShoulderAngle = 0;
let g_rightHandAngle = 0;

let g_isDragging = false;
let g_lastMouseX = -1;
let g_lastMouseY = -1;
let g_mouseRotateX = 0; // Rotation accumulated from vertical drag
let g_mouseRotateY = 0;

let g_eyeAnimationOn = false;      // Flag for eye animation state
let g_eyeOffsetY = 0;            // Current vertical offset for eyes
let g_eyeAnimationStartTime = 0; // When the eye animation started
const EYE_ANIMATION_DURATION = 0.5; // Duration of eye bounce in seconds
const EYE_BOUNCE_HEIGHT = 0.1;

let g_cylinderOffsetY = 0;

function setupWebGL() {

  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas, { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return false;
  }
  // Enable depth testing
  gl.enable(gl.DEPTH_TEST);
  return true;
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return false;
  }

  // Get the storage location of attribute variables
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position or a_Color');
    return false;
  }

  // Get the storage location of uniform variables
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');

  if (!u_ModelMatrix || !u_ViewMatrix || !u_ProjMatrix || !u_FragColor || !u_GlobalRotation) {
    console.log('Failed to get the storage location of matrix uniforms');
    return false;
  }
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor'); // Add this
  if (!u_ModelMatrix || !u_ViewMatrix || !u_ProjMatrix || !u_FragColor) { // Check it
    console.log('Failed to get the storage location of matrix or color uniforms');
    return false;
  }
  return true;
}

function addActionsForHTMLUI() {

  document.getElementById('globalAngleSlide').addEventListener('input', function () {
    gAnimalGlobalRotation = this.value;
    document.getElementById('globalAngleValue').innerText = this.value;
    renderScene(); // Re-render when the angle changes
  });

  document.getElementById('joint1Slide').addEventListener('input', function () {
    g_joint1Angle = this.value;
    document.getElementById('joint1Value').innerText = this.value;
    renderScene(); // Re-render when the angle changes
  });
  document.getElementById('joint2Slide').addEventListener('input', function () {
    g_joint2Angle = this.value;
    document.getElementById('joint2Value').innerText = this.value;
    renderScene(); // Re-render when the angle changes
  });
  document.getElementById('joint3Slide').addEventListener('input', function () {
    g_joint3Angle = this.value;
    document.getElementById('joint3Value').innerText = this.value;
  });

  document.getElementById('animOnButton').onclick = function () { g_animationOn = true; };
  document.getElementById('animOffButton').onclick = function () { g_animationOn = false; };
}

function main() {
  if (!setupWebGL()) return;
  if (!connectVariablesToGLSL()) return;

  addActionsForHTMLUI();

  // Set the clear color and enable depth testing
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST); // Make sure depth test is enabled

  // Create the cube object
  g_cube = new Cube();
  if (!g_cube) {
    console.log('Failed to create the cube object');
    return;
  }
  g_cylinder = new Cylinder(0.3, 0.8, 16);

  canvas.onmousedown = mouseDown;
  canvas.onmousemove = mouseMove;

  document.onmouseup = mouseUp;

  tick();
}

function tick() {

  g_seconds = performance.now() / 1000.0 - g_startTime;

  if (g_animationOn) {
    updateAnimationAngles();
  }
  updateEyeAnimation();

  renderScene();

  requestAnimationFrame(tick);
}

function updateAnimationAngles() {

  if (g_animationOn) {

    g_rightElbowAngle = 45 * Math.sin(g_seconds * 4);
    g_rightShoulderAngle = 25 * Math.cos(g_seconds * 2);
    g_rightHandAngle = 30 * Math.sin(g_seconds * 6);
    g_cylinderOffsetY = 0.1 * Math.sin(g_seconds * 3);
  }

}

function updateEyeAnimation() {
  if (g_eyeAnimationOn) {
    let timeElapsed = g_seconds - g_eyeAnimationStartTime;
    let halfDuration = EYE_ANIMATION_DURATION / 2.0;

    if (timeElapsed < halfDuration) {
      g_eyeOffsetY = EYE_BOUNCE_HEIGHT * (timeElapsed / halfDuration);
    } else if (timeElapsed < EYE_ANIMATION_DURATION) {
      g_eyeOffsetY = EYE_BOUNCE_HEIGHT * ((EYE_ANIMATION_DURATION - timeElapsed) / halfDuration);
    } else {
      g_eyeAnimationOn = false;
      g_eyeOffsetY = 0;
    }
  }
}
function mouseMove(ev) {

  if (!g_isDragging) return;

  let x = ev.clientX;
  let y = ev.clientY;

  let deltaX = x - g_lastMouseX;
  let deltaY = y - g_lastMouseY;

  g_mouseRotateY += deltaX / canvas.width * 200;
  g_mouseRotateX += deltaY / canvas.height * 200;

  g_lastMouseX = x;
  g_lastMouseY = y;

}
function mouseUp(ev) {
  g_isDragging = false;
}

function mouseDown(ev) {
  let x = ev.clientX;
  let y = ev.clientY;
  let rect = ev.target.getBoundingClientRect();

  if (x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom) {

    if (ev.shiftKey) {

      g_eyeAnimationOn = true;
      g_eyeAnimationStartTime = g_seconds;
      g_eyeOffsetY = 0;

    } else {

      g_lastMouseX = x;
      g_lastMouseY = y;
      g_isDragging = true;
    }
  }
}

function renderScene() {
  var startTime = performance.now();

  g_viewMatrix.setLookAt(0, 0, g_cameraZ, 0, 0, -100, 0, 1, 0);
  g_projMatrix.setPerspective(50, canvas.width / canvas.height, 1, 100);
  let globalRotMat = new Matrix4();

  globalRotMat.rotate(g_mouseRotateY, 0, 1, 0);
  globalRotMat.rotate(g_mouseRotateX, 1, 0, 0);

  globalRotMat.rotate(gAnimalGlobalRotation, 0, 1, 0);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ViewMatrix, false, g_viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, g_projMatrix.elements);
  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotMat.elements);

  const baseColor = [1, 0, 0.4, 1.0];
  const armColor = [0.0, 0.8, 0.2, 1.0];
  const forearmColor = [0.9, 0.6, 0.0, 1.0];

  const leftArmColor = armColor;
  const leftForearmColor = forearmColor;
  const cylinderColor = [0.3, 0.5, 0.8, 1.0];
  const eyeColor = [0.1, 0.1, 0.1, 1.0];
  const handColor = [0.8, 0.8, 0.2, 1.0];

  let baseMatrix = new Matrix4();
  baseMatrix.translate(0, -0.5, 0);
  baseMatrix.scale(0.4, 0.4, 0.4);
  if (g_cube) {
    g_cube.render(baseMatrix, baseColor);
  } else { return; }

  let cylinderMatrix = new Matrix4();
  let currentCylinderOffsetY = g_animationOn ? g_cylinderOffsetY : 0;
  cylinderMatrix.translate(0, -0.4 + currentCylinderOffsetY, 0);
  cylinderMatrix.scale(0.5, 0.5, 0.5);
  cylinderMatrix.rotate(0, 1, 0, 0);
  if (g_cylinder) {
    g_cylinder.render(cylinderMatrix, cylinderColor);
  }

  const eyeBaseY = 0.1;
  const eyeBaseZ = 0.51;
  const eyeSpacingX = 0.15;
  const eyeScale = 0.1;

  let leftEyeMatrix = new Matrix4(baseMatrix);
  leftEyeMatrix.translate(-eyeSpacingX, eyeBaseY + g_eyeOffsetY, eyeBaseZ);
  leftEyeMatrix.scale(eyeScale, eyeScale, eyeScale);
  g_cube.render(leftEyeMatrix, eyeColor);

  let rightEyeMatrix = new Matrix4(baseMatrix);
  rightEyeMatrix.translate(eyeSpacingX, eyeBaseY + g_eyeOffsetY, eyeBaseZ);
  rightEyeMatrix.scale(eyeScale, eyeScale, eyeScale);
  g_cube.render(rightEyeMatrix, eyeColor);

  let armLength = 1;
  let forearmLength = 1;
  let armThickness = 0.2;

  let handLength = 0.3;
  let handThickness = 0.15;

  let rightArmMatrix = new Matrix4(baseMatrix);
  rightArmMatrix.translate(0.2, 0, 0);
  let currentRightShoulderAngle = g_animationOn ? g_rightShoulderAngle : g_joint1Angle;
  rightArmMatrix.rotate(currentRightShoulderAngle, 0, 0, 1);
  rightArmMatrix.translate(armLength / 2, 0, 0);
  rightArmMatrix.scale(armLength, armThickness, armThickness);
  g_cube.render(rightArmMatrix, armColor);

  let rightForearmMatrix = new Matrix4(baseMatrix);
  rightForearmMatrix.translate(0.2, 0, 0);
  rightForearmMatrix.rotate(currentRightShoulderAngle, 0, 0, 1);
  rightForearmMatrix.translate(armLength, 0, 0);
  let currentRightElbowAngle = g_animationOn ? g_rightElbowAngle : g_joint2Angle;
  rightForearmMatrix.rotate(currentRightElbowAngle, 0, 0, 1);
  rightForearmMatrix.translate(forearmLength / 2, 0, 0);
  rightForearmMatrix.scale(forearmLength, armThickness, armThickness);
  g_cube.render(rightForearmMatrix, forearmColor);

  let rightHandMatrix = new Matrix4(baseMatrix);

  rightHandMatrix.translate(0.2, 0, 0);
  rightHandMatrix.rotate(currentRightShoulderAngle, 0, 0, 1);
  rightHandMatrix.translate(armLength, 0, 0);
  rightHandMatrix.rotate(currentRightElbowAngle, 0, 0, 1);

  rightHandMatrix.translate(forearmLength, 0, 0);
  let currentRightHandAngle = g_animationOn ? g_rightHandAngle : g_joint3Angle;
  rightHandMatrix.rotate(currentRightHandAngle, 0, 0, 1);

  rightHandMatrix.translate(handLength / 2, 0, 0);

  rightHandMatrix.scale(handLength, handThickness, handThickness);
  g_cube.render(rightHandMatrix, handColor);

  let leftArmMatrix = new Matrix4(baseMatrix);
  leftArmMatrix.translate(-0.2, 0, 0);
  leftArmMatrix.rotate(-currentRightShoulderAngle, 0, 0, 1);
  leftArmMatrix.translate(-armLength / 2, 0, 0);
  leftArmMatrix.scale(armLength, armThickness, armThickness);
  g_cube.render(leftArmMatrix, leftArmColor);

  let leftForearmMatrix = new Matrix4(baseMatrix);
  leftForearmMatrix.translate(-0.2, 0, 0);
  leftForearmMatrix.rotate(-currentRightShoulderAngle, 0, 0, 1);
  leftForearmMatrix.translate(-armLength, 0, 0);
  leftForearmMatrix.rotate(-currentRightElbowAngle, 0, 0, 1);
  leftForearmMatrix.translate(-forearmLength / 2, 0, 0);
  leftForearmMatrix.scale(forearmLength, armThickness, armThickness);
  g_cube.render(leftForearmMatrix, leftForearmColor);

  let leftHandMatrix = new Matrix4(baseMatrix);

  leftHandMatrix.translate(-0.2, 0, 0);
  leftHandMatrix.rotate(-currentRightShoulderAngle, 0, 0, 1);
  leftHandMatrix.translate(-armLength, 0, 0);
  leftHandMatrix.rotate(-currentRightElbowAngle, 0, 0, 1);

  leftHandMatrix.translate(-forearmLength, 0, 0);

  leftHandMatrix.rotate(-currentRightHandAngle, 0, 0, 1);

  leftHandMatrix.translate(-handLength / 2, 0, 0);

  leftHandMatrix.scale(handLength, handThickness, handThickness);
  g_cube.render(leftHandMatrix, handColor);

  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration), "numdot");

}
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("failed to get " + htmlID + "from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}