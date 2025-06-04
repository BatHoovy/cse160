import * as THREE from 'three';

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene Setup
const scene = new THREE.Scene();

// Skybox Setup
const cubeTextureLoader = new THREE.CubeTextureLoader();
const skyboxTexture = cubeTextureLoader.load([
    'sky.jpg', 'sky.jpg', 'sky.jpg', 'sky.jpg', 'sky.jpg', 'sky.jpg'
]);
scene.background = skyboxTexture;
scene.environment = skyboxTexture;

// Camera Setup 
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); 

camera.position.set(0, 5, 10); 
camera.lookAt(0, 2.5, 0); 

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true }); 
renderer.setSize(window.innerWidth, window.innerHeight); 
document.body.appendChild(renderer.domElement); 

// OrbitControls Setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 100; 
controls.minPolarAngle = 0; 
controls.maxPolarAngle = Math.PI; 

// Texture Loader 
const textureLoader = new THREE.TextureLoader();
const flowerTexture = textureLoader.load('flower-1.jpg'); 



// Ground Cube
const groundGeometry = new THREE.BoxGeometry(50, 0.2, 50); 
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 }); 
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.y = -1.1; 
scene.add(ground);

// Cube 
const cubeGeometry = new THREE.BoxGeometry(2, 2, 2); 
const cubeMaterial = new THREE.MeshStandardMaterial({ map: flowerTexture }); 
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial); 
cube.position.x = -7; 
cube.position.y = 0; 
scene.add(cube); 

// Sphere  
const sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32); 
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); 
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial); 
sphere.position.x = -10; 
sphere.position.y = -1.0 + 1.5; 
scene.add(sphere); 

// Cylinder 
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 3, 32); 
const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); 
const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial); 
cylinder.position.x = -13; 
cylinder.position.y = -1.0 + 1.5; 
scene.add(cylinder); 

// Light Source 
const directionalLight = new THREE.DirectionalLight(0xffffff, 3); 
directionalLight.position.set(5, 10, 7.5); 
scene.add(directionalLight); 

const helper = new THREE.DirectionalLightHelper(directionalLight);
scene.add(helper);

const ambientLight = new THREE.AmbientLight(0xffffff, 2); 
scene.add(ambientLight); 

const pointLight = new THREE.PointLight(0xffffff, 2, 50); 
pointLight.position.set(0, 4, 5); 
scene.add(pointLight);

const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.5); 
scene.add(pointLightHelper);

// Function to load OBJ/MTL models
function loadObjMtlModel(basePath, mtlFile, objFile, scale, position, scene, modelName) {
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(basePath);
    mtlLoader.load(mtlFile, (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(basePath);
        objLoader.load(objFile, (object) => {
            object.scale.set(scale.x, scale.y, scale.z);
            object.position.set(position.x, position.y, position.z);
            scene.add(object);
            console.log(`${modelName} loaded successfully at ${position.x}, ${position.y}, ${position.z}.`);
        }, 
        (xhr) => { /* console.log(`${modelName} OBJ: ${(xhr.loaded / xhr.total * 100)}% loaded`); */ }, 
        (error) => { console.error(`An error happened loading the ${modelName} OBJ model:`, error); });
    }, 
    (xhr) => { /* console.log(`${modelName} MTL: ${(xhr.loaded / xhr.total * 100)}% loaded`); */ }, 
    (error) => { console.error(`An error happened loading the ${modelName} MTL file:`, error); });
}



loadObjMtlModel('OBJ/', 'chair.mtl', 'chair.obj', { x: 0.1, y: 0.1, z: 0.1 }, { x: 0, y: -1.0, z: -8 }, scene, 'Chair'); // Moved chair back

// Food items array
const foodItems = [
    { name: 'bread' }, { name: 'burger' }, { name: 'jelly' }, { name: 'chicken' },
    { name: 'chips' }, { name: 'pretzel' }, { name: 'ribs' }, { name: 'cookie' },
    { name: 'cupcake' }, { name: 'donut' }, { name: 'drink' }, { name: 'egg' },
    { name: 'waffle'}, 
    { name: 'ham' }, { name: 'toast'}, 
    { name: 'nugget' }
];

const foodScale = { x: 7, y: 7, z: 7 };
const foodYPosition = -4 + (foodScale.y / 2); 

const gridRows = 4;
const gridCols = 4;
const gridSpacing = 2.5; 
const gridStartX = -((gridCols - 1) * gridSpacing) / 2;
const gridStartZ = -((gridRows - 1) * gridSpacing) / 2; 

let itemIndex = 0;
for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
        if (itemIndex < foodItems.length) {
            const foodItemData = foodItems[itemIndex];
            const modelName = foodItemData.name.charAt(0).toUpperCase() + foodItemData.name.slice(1);
            
            
            const mtl = foodItemData.mtl || `${foodItemData.name}.mtl`;
            const obj = foodItemData.obj || `${foodItemData.name}.obj`;

            const xPos = gridStartX + c * gridSpacing;
            const zPos = gridStartZ + r * gridSpacing;
            
            loadObjMtlModel('OBJ/', mtl, obj, foodScale, { x: xPos, y: foodYPosition, z: zPos }, scene, modelName);
            itemIndex++;
        }
    }
}


//  Animation Loop
function animate() {
    requestAnimationFrame(animate); 
    controls.update(); 
    cube.rotation.x += 0.01; 
    cube.rotation.y += 0.01; 
    renderer.render(scene, camera); 
}

window.addEventListener('resize', () => { 
    camera.aspect = window.innerWidth / window.innerHeight; 
    camera.updateProjectionMatrix(); 
    renderer.setSize(window.innerWidth, window.innerHeight); 
});

animate();