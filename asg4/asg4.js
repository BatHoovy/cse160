
// Shaders 
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
    uniform vec3 u_ambientColor;
    uniform vec3 u_diffuseColor;    
    uniform vec3 u_specularColor;  
    uniform vec3 u_lightDirection;  // Directional light 1
    uniform vec3 u_lightLocation;   // Point light 2 position
    uniform vec3 u_eyePosition;
    uniform int u_VisualizeNormals;
    uniform int u_LightingOn;

    // Spotlight Uniforms
    uniform vec3 u_SpotlightPos;
    uniform vec3 u_SpotlightDir;       
    uniform float u_SpotlightCosCutoff;  
    uniform float u_SpotlightExponent;   

    varying vec3 n;
    varying vec4 worldPos;

    vec3 calcAmbient(){
        return u_ambientColor * u_Color;
    }
    vec3 calcDiffuse(vec3 l, vec3 normal, vec3 dColor){
        float nDotL = max(dot(l, normal), 0.0);
        return dColor * u_Color * nDotL;
    }
    vec3 calcSpecular(vec3 r, vec3 v, vec3 sColor){
        float rDotV = max(dot(r,v), 0.0);
        float rDotVPowS = pow(rDotV, 32.0);
        return sColor * u_Color * rDotVPowS;
    }

    void main() {
        vec3 finalColor;

        if (u_LightingOn == 0) { // Lighting is off
            finalColor = u_Color;
        } else { // Lighting is ON
            vec3 normalized_n = normalize(n);
            if (u_VisualizeNormals == 1) { // Normal visualization mode
                finalColor = normalized_n * 0.5 + 0.5;
            } else { // Standard Phong lighting
                vec3 ambient = calcAmbient();
                vec3 totalDiffuse = vec3(0.0);
                vec3 totalSpecular = vec3(0.0);

                vec3 v = normalize(u_eyePosition - worldPos.xyz); // View vector

                // Light 1: Directional
                vec3 l1 = normalize(u_lightDirection);
                vec3 r1 = reflect(-l1, normalized_n);
                totalDiffuse += calcDiffuse(l1, normalized_n, u_diffuseColor);
                totalSpecular += calcSpecular(r1, v, u_specularColor);

                // Light 2: Point
                vec3 l2_vec = u_lightLocation - worldPos.xyz;
                vec3 l2 = normalize(l2_vec);
                vec3 r2 = reflect(-l2, normalized_n);
                totalDiffuse += calcDiffuse(l2, normalized_n, u_diffuseColor);
                totalSpecular += calcSpecular(r2, v, u_specularColor);

                // Light 3: Spotlight
                vec3 spotToFragVec = worldPos.xyz - u_SpotlightPos; 
                float spotDist = length(spotToFragVec);
                vec3 spotToFragDir = normalize(spotToFragVec); 

                float spotDot = dot(-spotToFragDir, normalize(u_SpotlightDir));

                if (spotDot > u_SpotlightCosCutoff) { 
                    float spotEffect = pow(spotDot, u_SpotlightExponent);
                    
                    vec3 l_spot = -spotToFragDir; 
                    vec3 r_spot = reflect(-l_spot, normalized_n);

                    totalDiffuse += calcDiffuse(l_spot, normalized_n, u_diffuseColor) * spotEffect;
                    totalSpecular += calcSpecular(r_spot, v, u_specularColor) * spotEffect;
                }
                finalColor = ambient + totalDiffuse + totalSpecular;
            }
        }
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

let modelMatrix = new Matrix4();
let normalMatrix = new Matrix4();
let models = [];

// Existing light properties
let lightDirection = new Vector3([1.0, 1.0, 1.0]);
let lightLocation = new Vector3([0.0, 0.5, 1.0]);
let lightBaseX = lightLocation.elements[0];
let g_lastTime = Date.now();
const lightAnimationSpeed = 0.5;
const lightAnimationMagnitude = 2.0;

let ambientLightColor = new Vector3([0.2, 0.2, 0.2]);
let diffuseLightColor = new Vector3([0.8, 0.8, 0.8]);
let specularLightColor = new Vector3([1.0, 1.0, 1.0]);

// Spotlight Properties
let spotlightPos = new Vector3([0, 1, 3]);
let spotlightDir = new Vector3([0, -0.5, -1]);
let spotlightAngle = 15.0;
let spotlightCosCutoff = Math.cos(spotlightAngle * Math.PI / 180.0);
let spotlightExponent = 30.0;

let spotlightVisualSphere = null;


// Uniform locations
let u_ModelMatrix, u_ViewMatrix, u_ProjMatrix, u_NormalMatrix, u_Color;
let u_ambientColor, u_diffuseColor, u_specularColor;
let u_lightDirection, u_lightLocation, u_eyePosition, u_VisualizeNormals, u_LightingOn;
let u_SpotlightPos, u_SpotlightDir, u_SpotlightCosCutoff, u_SpotlightExponent;

// Global states
let visualizeNormals = false;
let isLightingOn = true;

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

    gl.uniform3fv(u_ambientColor, ambientLightColor.elements);
    gl.uniform3fv(u_diffuseColor, diffuseLightColor.elements);
    gl.uniform3fv(u_specularColor, specularLightColor.elements);

    gl.uniform3fv(u_lightDirection, lightDirection.elements);
    gl.uniform3fv(u_lightLocation, lightLocation.elements);
    if (typeof pointLightSphere !== 'undefined' && pointLightSphere) {
        pointLightSphere.setTranslate(lightLocation.elements[0], lightLocation.elements[1], lightLocation.elements[2]);
    }

    if (spotlightVisualSphere) {
        spotlightVisualSphere.setTranslate(spotlightPos.elements[0], spotlightPos.elements[1], spotlightPos.elements[2]);
    }

    gl.uniform3fv(u_SpotlightPos, spotlightPos.elements);
    let normalizedSpotlightDir = new Vector3(spotlightDir.elements).normalize();
    gl.uniform3fv(u_SpotlightDir, normalizedSpotlightDir.elements);
    gl.uniform1f(u_SpotlightCosCutoff, spotlightCosCutoff);
    gl.uniform1f(u_SpotlightExponent, spotlightExponent);

    gl.uniform3fv(u_eyePosition, camera.eye.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, camera.projMatrix.elements);
    gl.uniform1i(u_VisualizeNormals, visualizeNormals ? 1 : 0);
    gl.uniform1i(u_LightingOn, isLightingOn ? 1 : 0);

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

function onZoomInput(value) { camera.zoom(1.0 + (value - 1) / 10); }
function onLightPositionInput() { 
    if (lightXSlider && lightYSlider && lightZSlider) {
        lightBaseX = parseFloat(lightXSlider.value);
        lightLocation.elements[1] = parseFloat(lightYSlider.value);
        lightLocation.elements[2] = parseFloat(lightZSlider.value);
    }
}
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
function toggleLighting() { 
    isLightingOn = !isLightingOn;
    console.log("Lighting: " + (isLightingOn ? "ON" : "OFF"));
}

function main() {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext("webgl");
    if(!gl) { console.log("Failed to get webgl context"); return -1; }

    lightXSlider = document.getElementById("lightXSlider"); 
    lightYSlider = document.getElementById("lightYSlider"); 
    lightZSlider = document.getElementById("lightZSlider"); 
    if (lightXSlider && lightYSlider && lightZSlider) {
        lightBaseX = lightLocation.elements[0];
        lightXSlider.value = lightBaseX;
        lightYSlider.value = lightLocation.elements[1];
        lightZSlider.value = lightLocation.elements[2];
    }
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
    u_LightingOn = gl.getUniformLocation(gl.program, "u_LightingOn");
    u_SpotlightPos = gl.getUniformLocation(gl.program, "u_SpotlightPos");
    u_SpotlightDir = gl.getUniformLocation(gl.program, "u_SpotlightDir");
    u_SpotlightCosCutoff = gl.getUniformLocation(gl.program, "u_SpotlightCosCutoff");
    u_SpotlightExponent = gl.getUniformLocation(gl.program, "u_SpotlightExponent");

    // Model creation
    let n_shapes = 2;
    for (let i = 0; i < n_shapes; i++){
      let r = Math.random(), g = Math.random(), b = Math.random();
      let x_pos = (i - (n_shapes - 1) / 2.0) * 4.0;
      let cube = addModel([r,g,b], "cube");
      cube.setTranslate(x_pos, -0.5, 0.0);
      cube.setScale(0.5,0.5,0.5);
      let sphere = addModel([r,g,b], "sphere");
      sphere.setTranslate(x_pos, 0.5, 0.0);
      sphere.setScale(0.5,0.5,0.5);
    }
    
    let head = addModel([1,0.75,1],"cube");
    head.setTranslate(0,-0.5,0.3);
    head.setScale(0.5,0.5,0.5);
    

    //Eyes
    const eyeColor = [0.5,0.5,0.5];
    const eyeScale = [0.08, 0.08, 0.08];
    const headY = -0.5; 
    const headZFront = 0.4 + (0.5/2); 

    let leftEye = addModel(eyeColor, "sphere");
    leftEye.setTranslate(-0.15, headY + 0.1, headZFront +0.2); 
    leftEye.setScale(eyeScale[0], eyeScale[1], eyeScale[2]);

    let rightEye = addModel(eyeColor, "sphere");
    rightEye.setTranslate(0.15, headY + 0.1, headZFront +0.2); 
    rightEye.setScale(eyeScale[0], eyeScale[1], eyeScale[2]);

    // Arms 
    const armColor = [0,1,0]; 
    const armScale = [0.1, 0.4, 0.1]; 
    const armY = headY - 0.25; 

    let leftArm = addModel(armColor, "cube");
    leftArm.setTranslate(-0.5, armY+0.4, 0.4); 
    leftArm.setScale(armScale[0], armScale[1], armScale[2]);
    leftArm.setRotate(0,0,45,1); 

    let rightArm = addModel(armColor, "cube");
    rightArm.setTranslate(0.5, armY+0.4, 0.4); 
    rightArm.setScale(armScale[0], armScale[1], armScale[2]);
    rightArm.setRotate(0,0,-45,1); 

    pointLightSphere = addModel([1,1,0], "sphere"); 
    pointLightSphere.setScale(0.1,0.1,0.1);

    
    spotlightVisualSphere = addModel([0.8, 0.8, 1.0], "sphere"); 
    spotlightVisualSphere.setScale(0.1, 0.1, 0.1); 
    
    vertexBuffer = initBuffer("a_Position", 3);
    normalBuffer = initBuffer("a_Normal", 3);
    indexBuffer = gl.createBuffer();
    if(!indexBuffer) { console.log("Can't create buffer."); return -1; }

    gl.uniform3fv(u_lightDirection, lightDirection.elements);
    gl.uniform1i(u_VisualizeNormals, visualizeNormals ? 1 : 0);
    gl.uniform1i(u_LightingOn, isLightingOn ? 1 : 0);

    camera = new Camera();
    g_lastTime = Date.now();
    draw();
}