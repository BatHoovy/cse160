
var VERTEX_SHADER = `
    precision mediump float;

    attribute vec3 a_Position;
    attribute vec3 a_Color;
    attribute vec2 a_UV;

    varying vec3 v_Color;
    varying vec2 v_UV;

    uniform mat4 u_ModelMatrix; 
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;

    void main() {
        v_Color = a_Color;
        v_UV = a_UV;
        gl_Position = u_projectionMatrix * u_viewMatrix * u_ModelMatrix * vec4(a_Position, 1.0);
    }
`;

var FRAGMENT_SHADER = `
    precision mediump float;

    varying vec3 v_Color; 
    varying vec2 v_UV;

    uniform sampler2D u_Sampler;
    uniform float u_texColorWeight;
    uniform vec4 u_baseColor; 

    void main() {
        vec4 texColor = texture2D(u_Sampler, v_UV);
        float t = u_texColorWeight;
        gl_FragColor = (1.0 - t) * u_baseColor + t * texColor;
    }
`;

var gl;
var camera;
var shapes = [];

// Uniform locations
let u_texColorWeightLocation;
let u_baseColorLocation;
let u_ModelMatrixLocation;
let u_viewMatrixLocation;
let u_projectionMatrixLocation;
let u_SamplerLocation;


let worldVertexBuffer;
let worldVertexCount;
let worldModelMatrix = new Matrix4(); 

let isMouseDown = false;
let lastMouseX = -1;
let lastMouseY = -1;
const MOUSE_SENSITIVITY_X = 0.2; 
const MOUSE_SENSITIVITY_Y = 0.2; 

let myCustomCubeGroup = [];
let groupTransform = new Matrix4();

let g_map = [];

function setupCustomCubeGroup() {

  let faceCube = new cube(); 

  faceCube.translate(0, 0, 0);      
  faceCube.scale(0.5, 0.5, 0.5);  

  faceCube.baseColor = [1.0, 0.0, 0.7, 1.0]; 
  faceCube.texColorWeight = 0.0; 

  myCustomCubeGroup.push(faceCube);

  let leftEye = new cube(); 

  leftEye.translate(-0.15, 0.15, 0.6); 
  leftEye.scale(0.1, 0.1, 0.1);     

  leftEye.baseColor = [0.0, 0.0, 0.0, 1.0]; 
  leftEye.texColorWeight = 0.0;    

  myCustomCubeGroup.push(leftEye);

  let rightEye = new cube(); 

  rightEye.translate(0.15, 0.15, 0.6); 
  rightEye.scale(0.1, 0.1, 0.1);    

  rightEye.baseColor = [0.0, 0.0, 0.0, 1.0]; 
  rightEye.texColorWeight = 0.0;   

  myCustomCubeGroup.push(rightEye);

  groupTransform.translate(-4.5, 1.5, -18); 
  const rand = Math.floor(Math.random() * 3);
  if (rand === 1) {
    groupTransform.translate(-7, 0, 0);
  } else if (rand === 2) {
    groupTransform.translate(7, 0, 0);
  }
}

function generateSampleMap32x32() {
  g_map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,9,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,1,1,2,2,2,2,2,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3,3,3,2,1,1,2,3,3,3,2,1,1],
    [1,1,1,1,1,9,1,1,1,1,1,1,1,1,1,1,1,1,2,3,4,3,2,1,1,2,3,4,3,2,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3,3,3,2,1,1,2,3,3,3,2,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,1,1,2,2,2,2,2,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,9,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,5,5,5,5,5,1,1,5,5,5,5,5,1,1,5,5,5,5,5,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,5,1,1,1,5,1,1,5,1,1,1,5,1,1,5,1,1,1,5,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,5,1,1,1,5,1,1,5,1,1,1,5,1,1,5,1,1,1,5,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,5,1,1,1,5,1,1,5,1,1,1,5,1,1,5,1,1,1,5,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,5,5,5,5,5,1,1,5,5,5,5,5,1,1,5,5,5,5,5,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];
  for (let i = 0; i < g_map.length; i++) {
    g_map[i][0] = 9;
    g_map[i][31] = 9;
  }
}

function loadTextureForGeometry(geometry, texturePath) {
  geometry.texture = gl.createTexture();
  geometry.textureLoaded = false;

  let img = new Image();
  img.src = texturePath;

  img.onload = function() {
    console.log("Image loaded:", img.src);
    gl.bindTexture(gl.TEXTURE_2D, geometry.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    geometry.textureLoaded = true;
  }

  img.onerror = function() {
    console.error("Failed to load texture:", img.src);
    gl.bindTexture(gl.TEXTURE_2D, geometry.texture);
    const whitePixel = new Uint8Array([255, 255, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
    geometry.textureLoaded = true;
  }
}

function generateWorld() {
    let allWorldVerticesList = []; 
    let baseCube = new cube();
    let singleCubeVertices = baseCube.vertices; 
    let floatsPerVertex = 8; 

    if (!g_map || g_map.length === 0 || !g_map[0]) {
        console.error("g_map not initialized before generateWorld call.");
        return;
    }
    const MAP_DEPTH = g_map.length;
    const MAP_WIDTH = g_map[0].length;

    for (let z_idx = 0; z_idx < MAP_DEPTH; z_idx++) {
        for (let x_idx = 0; x_idx < MAP_WIDTH; x_idx++) {
            let height = g_map[z_idx][x_idx];
            if (height > 0) {
                for (let y_level = 0; y_level < height; y_level++) {
                    let worldX = x_idx - MAP_WIDTH / 2.0 + 0.5;
                    let worldY = y_level + 0.5;
                    let worldZ_untranslated = z_idx - MAP_DEPTH / 2.0 + 0.5;

                    let instanceModelMatrix = new Matrix4();

                    instanceModelMatrix.translate(worldX, worldY, worldZ_untranslated - (MAP_DEPTH / 2.0) - 5);
                    instanceModelMatrix.scale(0.5, 0.5, 0.5);

                    for (let i = 0; i < singleCubeVertices.length; i += floatsPerVertex) {
                        let pos = new Vector3([singleCubeVertices[i], singleCubeVertices[i+1], singleCubeVertices[i+2]]);
                        let color = [singleCubeVertices[i+3], singleCubeVertices[i+4], singleCubeVertices[i+5]];
                        let uv = [singleCubeVertices[i+6], singleCubeVertices[i+7]];

                        let transformedPos = instanceModelMatrix.multiplyVector3(pos);

                        allWorldVerticesList.push(transformedPos.elements[0], transformedPos.elements[1], transformedPos.elements[2]);
                        allWorldVerticesList.push(color[0], color[1], color[2]);
                        allWorldVerticesList.push(uv[0], uv[1]);
                    }
                }
            }
        }
    }

    if (worldVertexBuffer === undefined) { 
        worldVertexBuffer = gl.createBuffer();
    }

    if (allWorldVerticesList.length > 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allWorldVerticesList), gl.STATIC_DRAW);
        worldVertexCount = allWorldVerticesList.length / floatsPerVertex;
    } else {
        worldVertexCount = 0;
    }
}

function loadWorld() {

  let worldTexture = gl.createTexture();
  let worldImg = new Image();
  worldImg.src = "textures/dirt.jpg";

  worldImg.onload = function() {
    console.log("World texture loaded:", worldImg.src);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, worldTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, worldImg);
    gl.uniform1i(u_SamplerLocation, 0);

    window.worldTexture = worldTexture; 

    requestAnimationFrame(animate); 
  }

  worldImg.onerror = function() {
    console.error("Failed to load world texture:", worldImg.src);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, worldTexture); 
    const whitePixel = new Uint8Array([255, 255, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
    gl.uniform1i(u_SamplerLocation, 0);

    window.worldTexture = worldTexture;

    requestAnimationFrame(animate); 
  }

  let sky = new cube(); 
  sky.baseColor = [1.0, 1.0, 1.0, 1.0]; 
  sky.texColorWeight = 1.0; 
  sky.translate(0, 0, 0); 
  sky.scale(100, 100, 100); 
  loadTextureForGeometry(sky, "textures/sky.jpg"); 
  shapes.push(sky);

  let ground = new cube();
  ground.baseColor = [1.0, 1.0, 1.0, 1.0];
  ground.texColorWeight = 1.0; 
  ground.translate(0, -0.6, 0); 
  ground.scale(100, 0.1, 100); 
  loadTextureForGeometry(ground, "textures/grass.png");
  shapes.push(ground);
}

var g_last = Date.now();

function animate(now) {
  var startTime = performance.now();
  requestAnimationFrame(animate); 
  g_last = now; 

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_viewMatrixLocation, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_projectionMatrixLocation, false, camera.projectionMatrix.elements);

  for (let s of shapes) {

      if (s !== window.worldGeometryObject) {
          draw(s); 
      }
  }

  for (let i = 0; i < myCustomCubeGroup.length; i++) {
      let currentCube = myCustomCubeGroup[i];

      let localModelMatrix = new Matrix4();
      localModelMatrix.multiply(currentCube.translationMatrix); 
      localModelMatrix.multiply(currentCube.rotationMatrix);   
      localModelMatrix.multiply(currentCube.scaleMatrix);      

      let finalModelMatrix = new Matrix4().set(groupTransform).multiply(localModelMatrix);

      gl.uniformMatrix4fv(u_ModelMatrixLocation, false, finalModelMatrix.elements);

      gl.uniform1f(u_texColorWeightLocation, currentCube.texColorWeight);
      gl.uniform4fv(u_baseColorLocation, new Float32Array(currentCube.baseColor));

      gl.activeTexture(gl.TEXTURE0); 
      if (currentCube.texture && currentCube.textureLoaded) {
          gl.bindTexture(gl.TEXTURE_2D, currentCube.texture);
      } else if (window.worldTexture) { 
          gl.bindTexture(gl.TEXTURE_2D, window.worldTexture);
      }
      gl.uniform1i(u_SamplerLocation, 0); 

      if (!currentCube.buffer) { 
          currentCube.buffer = gl.createBuffer();

          gl.bindBuffer(gl.ARRAY_BUFFER, currentCube.buffer);
          gl.bufferData(gl.ARRAY_BUFFER, currentCube.vertices, gl.STATIC_DRAW);
      } else {
          gl.bindBuffer(gl.ARRAY_BUFFER, currentCube.buffer); 
      }

      const FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;
      const STRIDE = 8 * FLOAT_SIZE; 

      const a_Position = gl.getAttribLocation(gl.program, "a_Position");
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, STRIDE, 0 * FLOAT_SIZE); 
      gl.enableVertexAttribArray(a_Position);

      const a_Color = gl.getAttribLocation(gl.program, "a_Color");
      gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, STRIDE, 3 * FLOAT_SIZE); 
      gl.enableVertexAttribArray(a_Color);

      const a_UV = gl.getAttribLocation(gl.program, "a_UV");
      gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, STRIDE, 6 * FLOAT_SIZE); 
      gl.enableVertexAttribArray(a_UV);

      gl.drawArrays(gl.TRIANGLES, 0, currentCube.vertices.length / 8); 
  }

  gl.uniform1f(u_texColorWeightLocation, 1.0);
  if (worldVertexBuffer && worldVertexCount > 0) {
      gl.uniformMatrix4fv(u_ModelMatrixLocation, false, worldModelMatrix.elements); 

      if (window.worldTexture) { 
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, window.worldTexture);
          gl.uniform1i(u_SamplerLocation, 0);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexBuffer);

      const FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;
      const STRIDE = 8 * FLOAT_SIZE; 

      const a_Position = gl.getAttribLocation(gl.program, "a_Position");
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, STRIDE, 0 * FLOAT_SIZE);
      gl.enableVertexAttribArray(a_Position);

      const a_Color = gl.getAttribLocation(gl.program, "a_Color");
      gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, STRIDE, 3 * FLOAT_SIZE);
      gl.enableVertexAttribArray(a_Color);

      const a_UV = gl.getAttribLocation(gl.program, "a_UV");
      gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, STRIDE, 6 * FLOAT_SIZE);
      gl.enableVertexAttribArray(a_UV);

      gl.drawArrays(gl.TRIANGLES, 0, worldVertexCount);
  }
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

function draw(geometry) {
  geometry.modelMatrix.setIdentity();
  geometry.modelMatrix.multiply(geometry.translationMatrix);
  geometry.modelMatrix.multiply(geometry.rotationMatrix);
  geometry.modelMatrix.multiply(geometry.scaleMatrix);

  gl.uniformMatrix4fv(u_ModelMatrixLocation, false, geometry.modelMatrix.elements);
  gl.uniform1f(u_texColorWeightLocation, geometry.texColorWeight);
  gl.uniform4fv(u_baseColorLocation, new Float32Array(geometry.baseColor));

  gl.activeTexture(gl.TEXTURE0); 
  if (geometry.texture && geometry.textureLoaded) {
    gl.bindTexture(gl.TEXTURE_2D, geometry.texture);
  } else if (window.worldTexture) { 
    gl.bindTexture(gl.TEXTURE_2D, window.worldTexture);
  }
  gl.uniform1i(u_SamplerLocation, 0);

  if (!geometry.buffer) {
    geometry.buffer = gl.createBuffer();
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, geometry.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);

  const FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;
  const STRIDE = 8 * FLOAT_SIZE;

  const a_Position = gl.getAttribLocation(gl.program, "a_Position");
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, STRIDE, 0);
  gl.enableVertexAttribArray(a_Position);

  const a_Color = gl.getAttribLocation(gl.program, "a_Color");
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, STRIDE, 3 * FLOAT_SIZE);
  gl.enableVertexAttribArray(a_Color);

  const a_UV = gl.getAttribLocation(gl.program, "a_UV");
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, STRIDE, 6 * FLOAT_SIZE);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, geometry.vertices.length / 8);
}

function keydown(ev) {
    const moveSpeed = 0.2;
    const panAngle = 3; 

    switch(ev.key.toUpperCase()) {
        case 'W': camera.moveForward(moveSpeed); break;
        case 'S': camera.moveBackwards(moveSpeed); break;
        case 'A': camera.moveLeft(moveSpeed); break;
        case 'D': camera.moveRight(moveSpeed); break;
        case 'Q': camera.panLeft(panAngle); break;
        case 'E': camera.panRight(panAngle); break;
        case 'R': camera.moveUp(moveSpeed); break;   
        case 'F': camera.moveDown(moveSpeed); break;
        case 'B': 
            addBlockInFront();
            break;
        case 'N': 
            deleteBlockInFront();
            break;
        default: return;
    }
}

function getTargetBlockIndices() {
    if (!g_map || g_map.length === 0 || !g_map[0]) {
        console.error("g_map is not initialized for getTargetBlockIndices.");
        return null;
    }
    const MAP_WIDTH = g_map[0].length;
    const MAP_DEPTH = g_map.length;
    const targetDistance = 2; 

    let forward = new Vector3();
    forward.set(camera.at).sub(camera.eye).normalize();

    let targetPoint = new Vector3();
    targetPoint.set(camera.eye).add(new Vector3(forward.elements).mul(targetDistance));

    let x_idx = Math.round(targetPoint.elements[0] + MAP_WIDTH / 2.0 - 0.5);
    let z_idx = Math.round(targetPoint.elements[2] + MAP_DEPTH + 4.5);
    let y_level = Math.round(targetPoint.elements[1] - 0.5); 

    x_idx = Math.max(0, Math.min(x_idx, MAP_WIDTH - 1));
    z_idx = Math.max(0, Math.min(z_idx, MAP_DEPTH - 1));
    y_level = Math.max(0, y_level); 

    return { x: x_idx, z: z_idx, y: y_level };
}

function addBlockInFront() {
  let target = getTargetBlockIndices();
  if (!target) return;

  if (g_map[target.z] && g_map[target.z][target.x] !== undefined) {

      g_map[target.z][target.x]++;

      console.log(`Block placed on top of column map[${target.z}][${target.x}]. New height: ${g_map[target.z][target.x]}`);
      generateWorld(); 
  } else {
      console.error("Cannot add block: Target indices out of bounds or g_map not initialized properly.", target);
  }
}

function deleteBlockInFront() {
  let target = getTargetBlockIndices();
  if (!target) return;

  if (!g_map || g_map.length === 0 || !g_map[0]) {
      console.error("g_map not initialized for deleteBlockInFront.");
      return;
  }
  const MAP_WIDTH = g_map[0].length;
  const MAP_DEPTH = g_map.length;

  if (g_map[target.z] && g_map[target.z][target.x] !== undefined) {
      let currentColumnHeight = g_map[target.z][target.x];

      if (currentColumnHeight > 0) { 
          let newColumnHeight = currentColumnHeight - 1;
          g_map[target.z][target.x] = newColumnHeight;

          if (newColumnHeight === 0) {
             const isBoundary = target.x === 0 || target.x === MAP_WIDTH - 1 || target.z === 0 || target.z === MAP_DEPTH - 1;
             if (!isBoundary) { 
                 g_map[target.z][target.x] = 1; 
                 console.log(`Column at map[${target.z}][${target.x}] top block removed, restored to floor height 1.`);
             } else {
                console.log(`Boundary column at map[${target.z}][${target.x}] top block removed. New height: 0.`);
             }
          } else {
              console.log(`Top block removed from column map[${target.z}][${target.x}]. New height: ${newColumnHeight}`);
          }
          generateWorld(); 
      } else {
          console.log(`Cannot delete block: Column map[${target.z}][${target.x}] is already empty (height 0).`);
      }
  } else {
      console.error("Cannot delete block: Target indices out of bounds or g_map not initialized properly.", target);
  }
}

function handleMouseDown(ev) {
  isMouseDown = true;
  lastMouseX = ev.clientX; 
  lastMouseY = ev.clientY;

}

function handleMouseUp(ev) {
  isMouseDown = false;

}

function handleMouseMove(ev) {
  if (!isMouseDown) { 
      return;
  }

  let dx, dy;
  dx = ev.clientX - lastMouseX;
  dy = ev.clientY - lastMouseY;

  lastMouseX = ev.clientX;
  lastMouseY = ev.clientY;

  if (dx !== 0) {
      if (dx > 0) {
          camera.panRight(dx * MOUSE_SENSITIVITY_X);
      } else {
          camera.panLeft(-dx * MOUSE_SENSITIVITY_X); 
      }
  }

}

function main() {
  let canvas = document.getElementById("webgl");
  gl = getWebGLContext(canvas);
  if(!gl) {
      console.log("Failed to get WebGL context.")
      return -1;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.1, 0.1, 0.2, 1.0); 

  if(!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
      console.log("Failed to compile and load shaders.")
      return -1;
  }

  u_ModelMatrixLocation = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_viewMatrixLocation = gl.getUniformLocation(gl.program, "u_viewMatrix");
  u_projectionMatrixLocation = gl.getUniformLocation(gl.program, "u_projectionMatrix");
  u_SamplerLocation = gl.getUniformLocation(gl.program, "u_Sampler");
  u_texColorWeightLocation = gl.getUniformLocation(gl.program, "u_texColorWeight");
  u_baseColorLocation = gl.getUniformLocation(gl.program, "u_baseColor");

  worldModelMatrix.setIdentity(); 

  groupTransform.setIdentity();
  setupCustomCubeGroup();

  camera = new Camera(canvas.width/canvas.height, 0.1, 200);
  camera.eye = new Vector3([0, 2, 10]); 
  camera.at = new Vector3([0, 2, 0]);   
  camera.updateView();

  document.onkeydown = keydown;

  canvas.onmousedown = handleMouseDown;
  document.onmouseup = handleMouseUp; 
  document.onmousemove = handleMouseMove;

  generateSampleMap32x32(); 
  generateWorld(); 

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
  loadWorld(); 
}