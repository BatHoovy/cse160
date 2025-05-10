// Lab3/asg3.js

// Shaders (VERTEX_SHADER and FRAGMENT_SHADER remain the same)
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
    uniform vec4 baseColor;      

    void main() {
        vec4 texColor = texture2D(u_Sampler, v_UV);
        float t = u_texColorWeight;
        gl_FragColor = (1.0 - t) * baseColor + t * texColor;
    }
`;


var GlobalRotation = 0;
var shapes = []; // This will now be populated by generateWorld()
var gl; 
var camera;

// Uniform locations
let u_texColorWeightLocation;
let baseColorLocation;
let u_ModelMatrixLocation;
let u_viewMatrixLocation;
let u_projectionMatrixLocation;
let u_SamplerLocation;

// Define the 2D map for the world
// Values represent the height of the wall (number of cubes stacked vertically)
// 0 means no wall.
let g_map = [];

function generateSampleMap32x32() {
    g_map = []; // Clear previous map if any
    const MAP_SIZE = 32;
    for (let z = 0; z < MAP_SIZE; z++) {
        g_map[z] = [];
        for (let x = 0; x < MAP_SIZE; x++) {
            if (x === 0 || x === MAP_SIZE - 1 || z === 0 || z === MAP_SIZE - 1) {
                g_map[z][x] = 8; // Border wall height
            } else {
                // Add some internal structures or features
                if ((x > 5 && x < 10 && z > 5 && z < 10)) {
                     g_map[z][x] = Math.floor(Math.random() * 4) + 2; // Structure 1
                } else if (x > 15 && x < 20 && z > 12 && z < 18 && (x % 2 == 0 || z % 2 == 0) ) {
                     g_map[z][x] = Math.floor(Math.random() * 5) + 3; // Structure 2 (checkerboard-like)
                } else if (x == 15 && z > 1 && z < MAP_SIZE -2 ) {
                     g_map[z][x] = 6; // A line wall
                }
                else {
                    g_map[z][x] = 0; // Empty space
                }
            }
        }
    }
     // Add a floor of height 1 everywhere within the borders where it's currently empty
    for (let z = 1; z < MAP_SIZE - 1; z++) {
        for (let x = 1; x < MAP_SIZE - 1; x++) {
            if (g_map[z][x] === 0) {
                g_map[z][x] = 1;
            }
        }
    }
}


function generateWorld() {
    shapes = []; // Clear existing shapes

    // generateSampleMap32x32(); // Use the 32x32 map
    // Or, for testing with the small map from the prompt:
    g_map = [
        [1, 2, 0, 4],
        [1, 1, 0, 1],
        [3, 0, 0, 1],
        [1, 1, 1, 1]
    ];


    const MAP_DEPTH = g_map.length;    // Number of rows (z-dimension)
    const MAP_WIDTH = g_map[0].length; // Number of columns (x-dimension)

    for (let z_idx = 0; z_idx < MAP_DEPTH; z_idx++) {
        for (let x_idx = 0; x_idx < MAP_WIDTH; x_idx++) {
            let height = g_map[z_idx][x_idx];
            if (height > 0) {
                for (let y_level = 0; y_level < height; y_level++) {
                    let block = new cube(); // Assuming 'cube' is your class for a single cube

                    // Calculate world coordinates
                    // Center the map around X=0, Z=0. Adjust Z to be in front of camera.
                    // Each cube is 1x1x1 after scaling.
                    let worldX = x_idx - MAP_WIDTH / 2.0 + 0.5;
                    let worldY = y_level + 0.5; // Base of the stack is at y=0.5
                    let worldZ = z_idx - MAP_DEPTH / 2.0 + 0.5;

                    block.translate(worldX, worldY, worldZ - (MAP_DEPTH / 2.0) - 5); // Move map away from camera
                    block.scale(0.5, 0.5, 0.5); // Scale the default 2x2x2 cube to 1x1x1

                    // Optional: Customize cube appearance (e.g., color, texture blending)
                    block.texColorWeight = 1.0; // Default to full texture for wall blocks
                    // block.baseColor = [Math.random(), Math.random(), Math.random(), 1.0]; // Random colors

                    shapes.push(block);
                }
            }
        }
    }
}


function loadWorld(){
  let texture = gl.createTexture(); 
  let img = new Image(); 
  img.src = "textures/dirt.jpg"; // Ensure this path is correct

  img.onload = function(){
    console.log("image loaded:", img.src);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); 

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(u_SamplerLocation, 0); 

    requestAnimationFrame(animate); 
  }
  img.onerror = function() {
    console.error("Failed to load texture: " + img.src);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture); 
    const whitePixel = new Uint8Array([255, 255, 255, 255]); 
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
    gl.uniform1i(u_SamplerLocation, 0);
    requestAnimationFrame(animate); 
  }
}

var g_last = Date.now(); 

function animate(now){
    requestAnimationFrame(animate); // Request the next frame

    let elapsed = now - g_last;
    g_last = now;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(u_viewMatrixLocation, false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(u_projectionMatrixLocation, false, camera.projectionMatrix.elements);
    
    for(let s of shapes){
      draw(s);
    }
}

function draw(geometry){
    geometry.modelMatrix.setIdentity(); 
    geometry.modelMatrix.multiply(geometry.translationMatrix);
    geometry.modelMatrix.multiply(geometry.rotationMatrix); 
    geometry.modelMatrix.multiply(geometry.scaleMatrix);

    gl.uniformMatrix4fv(u_ModelMatrixLocation, false, geometry.modelMatrix.elements);
    gl.uniform1f(u_texColorWeightLocation, geometry.texColorWeight);
    gl.uniform4fv(baseColorLocation, geometry.baseColor);

    // It's more efficient to bind buffer once if all shapes use the same vertex data structure,
    // but bufferData per draw is needed if vertices change or are specific per geometry object instance.
    // For now, assuming each 'cube' instance has its own vertices array reference (though they are identical for all cubes).
    // If all cubes share the exact same vertex data, this could be optimized by setting bufferData once.
    // However, the current 'cube' class constructor creates a new Float32Array for each instance.
    gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, geometry.vertices.length/8);
}

function keydown(ev) {
    const moveSpeed = 0.2; // Increased speed slightly
    const panAngle = 3;   

    switch(ev.key.toUpperCase()) { 
        case 'W': camera.moveForward(moveSpeed); break;
        case 'S': camera.moveBackwards(moveSpeed); break;
        case 'A': camera.moveLeft(moveSpeed); break;
        case 'D': camera.moveRight(moveSpeed); break;
        case 'Q': camera.panLeft(panAngle); break;
        case 'E': camera.panRight(panAngle); break;
        default: return; 
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
    gl.clearColor(0.1, 0.1, 0.2, 1.0); // Slightly lighter background

    if(!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
        console.log("Failed to compile and load shaders.")
        return -1;
    }

    u_ModelMatrixLocation = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    u_viewMatrixLocation = gl.getUniformLocation(gl.program, "u_viewMatrix");
    u_projectionMatrixLocation = gl.getUniformLocation(gl.program, "u_projectionMatrix");
    u_SamplerLocation = gl.getUniformLocation(gl.program, "u_Sampler");
    u_texColorWeightLocation = gl.getUniformLocation(gl.program, "u_texColorWeight");
    baseColorLocation = gl.getUniformLocation(gl.program, "baseColor");

    let vertexBuffer = gl.createBuffer();
    if(!vertexBuffer) {
        console.log("Can't create buffer");
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    let FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;

    let a_Position = gl.getAttribLocation(gl.program, "a_Position");
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 8*FLOAT_SIZE, 0*FLOAT_SIZE);
    gl.enableVertexAttribArray(a_Position);

    let a_Color = gl.getAttribLocation(gl.program, "a_Color");
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 8*FLOAT_SIZE, 3*FLOAT_SIZE);
    gl.enableVertexAttribArray(a_Color);

    let a_UV = gl.getAttribLocation(gl.program, "a_UV");
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 8*FLOAT_SIZE, 6*FLOAT_SIZE);
    gl.enableVertexAttribArray(a_UV);

    // Adjusted camera far plane for potentially larger scenes
    camera = new Camera(canvas.width/canvas.height, 0.1, 100); 
    // Position camera to see the generated map
    camera.eye = new Vector3([0, 2, 10]); // Adjust eye position as needed
    camera.at = new Vector3([0, 2, 0]);   // Look towards the center of the map area
    camera.updateView();

    document.onkeydown = function(ev){ keydown(ev); };

    // --- Generate World from Map ---
    // You can switch between these two map generation calls:
    generateSampleMap32x32(); // For the 32x32 map with borders and a floor
    // generateWorld();           // For the small 4x4 map defined inside generateWorld()
                               // To use the 4x4 map, comment out generateSampleMap32x32() and make sure
                               // generateWorld() uses the small g_map definition.
                               // For now, let's make generateWorld use the map created by generateSampleMap32x32
    // The `generateWorld` function will now use the `g_map` that's globally defined
    // and potentially set by `generateSampleMap32x32`.
    // Let's adjust generateWorld to always use the global g_map.

    // Ensure g_map is defined before calling generateWorld if it's not set inside
    if (g_map.length === 0) { // If no map was pre-generated by a specific function
        // Default to the 32x32 map or the small one
        generateSampleMap32x32();
        // Or, to use the small map from the prompt if generateSampleMap32x32 is not called:
        // g_map = [
        //     [1, 2, 0, 4], [1, 1, 0, 1], [3, 0, 0, 1], [1, 1, 1, 1]
        // ];
    }
    generateWorld(); // This will use the current content of global `g_map`


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    loadWorld(); 
}
