// Phong calculated based on: https://en.wikipedia.org/wiki/Phong_reflection_model

// Shaders (GLSL)
let VSHADER=`
      precision mediump float;
      attribute vec3 a_Position;
      attribute vec3 a_Normal;
      uniform mat4 u_ModelMatrix;
      uniform mat4 u_ViewMatrix;
      uniform mat4 u_ProjMatrix;
      uniform mat4 u_NormalMatrix;
      varying vec3 n;
      varying vec4 worldPos;
      void main() {
        worldPos = u_ModelMatrix * vec4(a_Position, 1.0);
        n = normalize(u_NormalMatrix * vec4(a_Normal, 0.0)).xyz;
        gl_Position = u_ProjMatrix * u_ViewMatrix * worldPos;
      }
  `;

let FSHADER=`
    precision mediump float;
    uniform vec3 u_Color;
    uniform vec3 u_ambientColor;    // Will be controlled by sliders
    uniform vec3 u_diffuseColor;    // Will be controlled by sliders
    uniform vec3 u_specularColor;   // Will be controlled by sliders
    uniform vec3 u_lightDirection;
    uniform vec3 u_lightLocation;
    uniform vec3 u_eyePosition;
    uniform int u_VisualizeNormals;
    varying vec3 n;
    varying vec4 worldPos;

    vec3 calcAmbient(){
        return u_ambientColor * u_Color;
    }
    vec3 calcDiffuse(vec3 l, vec3 normal, vec3 dColor){
        float nDotL = max(dot(l, normal), 0.0);
        return dColor * u_Color * nDotL;
    }
    vec3 calcSpecular(vec3 r, vec3 v, vec3 sColor){ // Added sColor parameter
        float rDotV = max(dot(r,v), 0.0);
        float rDotVPowS = pow(rDotV, 32.0); 
        return sColor * u_Color * rDotVPowS; // Use sColor instead of u_specularColor
    }

    void main() {
        vec3 normalized_n = normalize(n); 
        if (u_VisualizeNormals == 1) {
            gl_FragColor = vec4(normalized_n * 0.5 + 0.5, 1.0); 
        } else {
            vec3 l1 = normalize(u_lightDirection); 
            vec3 l2 = normalize(u_lightLocation - worldPos.xyz); 
            vec3 v = normalize(u_eyePosition - worldPos.xyz);   
            vec3 r1 = reflect(-l1, normalized_n); 
            vec3 r2 = reflect(-l2, normalized_n); 

            vec3 ambient = calcAmbient(); // Uses u_ambientColor internally

            vec3 diffuse1 = calcDiffuse(l1, normalized_n, u_diffuseColor); // Pass u_diffuseColor
            vec3 specular1 = calcSpecular(r1, v, u_specularColor);      // Pass u_specularColor

            vec3 diffuse2 = calcDiffuse(l2, normalized_n, u_diffuseColor); // Pass u_diffuseColor
            vec3 specular2 = calcSpecular(r2, v, u_specularColor);      // Pass u_specularColor
            
            vec3 v_Color = ambient + diffuse1 + specular1 + diffuse2 + specular2; 
            gl_FragColor = vec4(v_Color, 1.0);
        }
    }
`;

let modelMatrix = new Matrix4();
let normalMatrix = new Matrix4();
let models = [];

let lightDirection = new Vector3([1.0, 1.0, 1.0]);
let lightLocation = new Vector3([0.0, 0.5, 1.0]); 

let lightBaseX = lightLocation.elements[0]; 
let g_lastTime = Date.now(); 
const lightAnimationSpeed = 0.5; 
const lightAnimationMagnitude = 2.0; 

// << NEW: Global variables for light color components >>
let ambientLightColor = new Vector3([0.2, 0.2, 0.2]);
let diffuseLightColor = new Vector3([0.8, 0.8, 0.8]);
let specularLightColor = new Vector3([1.0, 1.0, 1.0]);

// Uniform locations
let u_ModelMatrix, u_ViewMatrix, u_ProjMatrix, u_NormalMatrix, u_Color;
let u_ambientColor, u_diffuseColor, u_specularColor; // These will be updated by sliders
let u_lightDirection, u_lightLocation, u_eyePosition, u_VisualizeNormals;
let visualizeNormals = false;  

// Slider DOM element references
let lightXSlider, lightYSlider, lightZSlider;
let ambientRSlider, ambientGSlider, ambientBSlider;
let diffuseRSlider, diffuseGSlider, diffuseBSlider;
let specularRSlider, specularGSlider, specularBSlider;


function drawModel(model) {
    modelMatrix.setIdentity();
    modelMatrix.translate(model.translate[0], model.translate[1], model.translate[2]);
    modelMatrix.rotate(model.rotate[0], 1, 0, 0);
    modelMatrix.rotate(model.rotate[1], 0, 1, 0);
    modelMatrix.rotate(model.rotate[2], 0, 0, 1);
    modelMatrix.scale(model.scale[0], model.scale[1], model.scale[2]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniform3f(u_Color, model.color[0], model.color[1], model.color[2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, model.normals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indices, gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
}

function initBuffer(attibuteName, n) {
    let shaderBuffer = gl.createBuffer();
    if(!shaderBuffer) { console.log("Can't create buffer."); return -1; }
    gl.bindBuffer(gl.ARRAY_BUFFER, shaderBuffer);
    let shaderAttribute = gl.getAttribLocation(gl.program, attibuteName);
    gl.vertexAttribPointer(shaderAttribute, n, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderAttribute);
    return shaderBuffer;
}

function animateLight() {
    let now = Date.now();
    let angle = (now / 1000) * lightAnimationSpeed;
    let animatedOffsetX = Math.sin(angle) * lightAnimationMagnitude;
    lightLocation.elements[0] = lightBaseX + animatedOffsetX;
}

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    animateLight(); 
    
    // Update light property uniforms
    gl.uniform3fv(u_ambientColor, ambientLightColor.elements);
    gl.uniform3fv(u_diffuseColor, diffuseLightColor.elements);
    gl.uniform3fv(u_specularColor, specularLightColor.elements);
    
    gl.uniform3fv(u_lightLocation, lightLocation.elements);
    gl.uniform3fv(u_eyePosition, camera.eye.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, camera.projMatrix.elements);
    gl.uniform1i(u_VisualizeNormals, visualizeNormals ? 1 : 0);

    for(let m of models) {
        drawModel(m);
    }
    requestAnimationFrame(draw);
}

function addModel(color, shapeType) {
    let model = null;
    if (shapeType === "cube") model = new Cube(color);
    else if (shapeType === "sphere") model = new Sphere(color);
    if (model) models.push(model);
    return model;
}

function onZoomInput(value) {
    camera.zoom(1.0 + (value - 1) / 10); 
}

function onLightPositionInput() {
    if (lightXSlider && lightYSlider && lightZSlider) {
        lightBaseX = parseFloat(lightXSlider.value); 
        lightLocation.elements[1] = parseFloat(lightYSlider.value);
        lightLocation.elements[2] = parseFloat(lightZSlider.value);
    }
}

// << NEW function to handle light property slider inputs >>
function onLightPropertiesInput() {
    if (ambientRSlider && ambientGSlider && ambientBSlider) {
        ambientLightColor.elements[0] = parseFloat(ambientRSlider.value);
        ambientLightColor.elements[1] = parseFloat(ambientGSlider.value);
        ambientLightColor.elements[2] = parseFloat(ambientBSlider.value);
    }
    if (diffuseRSlider && diffuseGSlider && diffuseBSlider) {
        diffuseLightColor.elements[0] = parseFloat(diffuseRSlider.value);
        diffuseLightColor.elements[1] = parseFloat(diffuseGSlider.value);
        diffuseLightColor.elements[2] = parseFloat(diffuseBSlider.value);
    }
    if (specularRSlider && specularGSlider && specularBSlider) {
        specularLightColor.elements[0] = parseFloat(specularRSlider.value);
        specularLightColor.elements[1] = parseFloat(specularGSlider.value);
        specularLightColor.elements[2] = parseFloat(specularBSlider.value);
    }
    // Uniforms will be updated in the draw loop
}

window.addEventListener("keydown", function(event) {
    let speed = 0.1, panSpeed = 2.0; 
    switch (event.key) {
        case "w": camera.moveForward(speed); break;
        case "s": camera.moveForward(-speed); break;
        case "a": camera.pan(panSpeed); break;
        case "d": camera.pan(-panSpeed); break;
    }
});

function toggleNormalVisualization() {
    visualizeNormals = !visualizeNormals;
    console.log("Normal visualization: " + (visualizeNormals ? "ON" : "OFF"));
}

function main() {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext("webgl");
    if(!gl) { console.log("Failed to get webgl context"); return -1; }

    // Light Position Sliders
    lightXSlider = document.getElementById("lightXSlider");
    lightYSlider = document.getElementById("lightYSlider");
    lightZSlider = document.getElementById("lightZSlider");
    if (lightXSlider && lightYSlider && lightZSlider) {
        lightBaseX = lightLocation.elements[0]; 
        lightXSlider.value = lightBaseX;
        lightYSlider.value = lightLocation.elements[1];
        lightZSlider.value = lightLocation.elements[2];
    }

    // << NEW: Get references to light property sliders and set initial values >>
    ambientRSlider = document.getElementById("ambientRSlider");
    ambientGSlider = document.getElementById("ambientGSlider");
    ambientBSlider = document.getElementById("ambientBSlider");
    if(ambientRSlider) ambientRSlider.value = ambientLightColor.elements[0];
    if(ambientGSlider) ambientGSlider.value = ambientLightColor.elements[1];
    if(ambientBSlider) ambientBSlider.value = ambientLightColor.elements[2];

    diffuseRSlider = document.getElementById("diffuseRSlider");
    diffuseGSlider = document.getElementById("diffuseGSlider");
    diffuseBSlider = document.getElementById("diffuseBSlider");
    if(diffuseRSlider) diffuseRSlider.value = diffuseLightColor.elements[0];
    if(diffuseGSlider) diffuseGSlider.value = diffuseLightColor.elements[1];
    if(diffuseBSlider) diffuseBSlider.value = diffuseLightColor.elements[2];

    specularRSlider = document.getElementById("specularRSlider");
    specularGSlider = document.getElementById("specularGSlider");
    specularBSlider = document.getElementById("specularBSlider");
    if(specularRSlider) specularRSlider.value = specularLightColor.elements[0];
    if(specularGSlider) specularGSlider.value = specularLightColor.elements[1];
    if(specularBSlider) specularBSlider.value = specularLightColor.elements[2];

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(!initShaders(gl, VSHADER, FSHADER)) { console.log("Failed to initialize shaders."); return -1; }

    u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
    u_ProjMatrix = gl.getUniformLocation(gl.program, "u_ProjMatrix");
    u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
    u_Color = gl.getUniformLocation(gl.program, "u_Color");
    u_ambientColor = gl.getUniformLocation(gl.program, "u_ambientColor");
    u_diffuseColor = gl.getUniformLocation(gl.program, "u_diffuseColor");
    u_specularColor = gl.getUniformLocation(gl.program, "u_specularColor");
    u_lightDirection = gl.getUniformLocation(gl.program, "u_lightDirection");
    u_lightLocation = gl.getUniformLocation(gl.program, "u_lightLocation");
    u_eyePosition = gl.getUniformLocation(gl.program, "u_eyePosition");
    u_VisualizeNormals = gl.getUniformLocation(gl.program, "u_VisualizeNormals"); 

    let n_shapes = 3; 
    for (let i = 0; i < n_shapes; i++){ 
      let r = Math.random(), g = Math.random(), b = Math.random();
      let x_pos = (i - (n_shapes - 1) / 2.0) * 2.0; 
      addModel([r,g,b], "cube").setTranslate(x_pos, -0.5, 0.0).setScale(0.5,0.5,0.5);
      addModel([r,g,b], "sphere").setTranslate(x_pos, 0.5, 0.0).setScale(0.5,0.5,0.5);
    }
    pointLightSphere = addModel([1,1,0], "sphere");
    pointLightSphere.setScale(0.1,0.1,0.1);

    vertexBuffer = initBuffer("a_Position", 3);
    normalBuffer = initBuffer("a_Normal", 3);
    indexBuffer = gl.createBuffer();
    if(!indexBuffer) { console.log("Can't create buffer."); return -1; }

    // Initial uniform settings (will be updated by sliders in draw loop)
    gl.uniform3fv(u_lightDirection, lightDirection.elements);
    gl.uniform1i(u_VisualizeNormals, visualizeNormals ? 1 : 0);

    camera = new Camera();
    g_lastTime = Date.now(); 
    draw();
}