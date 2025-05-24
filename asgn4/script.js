// Import the Three.js library
import * as THREE from 'three';

// 1. Scene Setup
// Create a new scene
const scene = new THREE.Scene();
// Set a background color for the scene (e.g., sky blue)
scene.background = new THREE.Color(0x87ceeb);

// 2. Camera Setup (Perspective)
// Create a perspective camera
// Parameters: FOV, aspect ratio, near clipping plane, far clipping plane
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Position the camera further back so we can see the objects
camera.position.set(0, 5, 15);
// Make the camera look at the center of the scene (0,0,0)
camera.lookAt(0, 0, 0);

// 3. Renderer Setup
// Create a WebGL renderer with antialiasing for smoother edges
const renderer = new THREE.WebGLRenderer({ antialias: true });
// Set the size of the renderer to match the window dimensions
renderer.setSize(window.innerWidth, window.innerHeight);
// Append the renderer's canvas element to the HTML body
document.body.appendChild(renderer.domElement);

// 4. Shapes (Meshes)

// Cube 🧊
// Define the geometry (shape) of the cube
const cubeGeometry = new THREE.BoxGeometry(2, 2, 2); // width, height, depth
// Define the material (appearance) of the cube
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red color
// Create the mesh by combining the geometry and material
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
// Position the cube to the left
cube.position.x = -4;
// Add the cube to the scene
scene.add(cube);

// Sphere  ⚪
// Define the geometry of the sphere
const sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32); // radius, widthSegments, heightSegments
// Define the material of the sphere
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Green color
// Create the sphere mesh
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
// Position the sphere in the center (default is 0,0,0 so no change needed for x if centered)
sphere.position.x = 0;
// Add the sphere to the scene
scene.add(sphere);

// Cylinder 🥫
// Define the geometry of the cylinder
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 3, 32); // radiusTop, radiusBottom, height, radialSegments
// Define the material of the cylinder
const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue color
// Create the cylinder mesh
const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
// Position the cylinder to the right
cylinder.position.x = 4;
// Add the cylinder to the scene
scene.add(cylinder);

// 5. Light Source (Directional Light) 💡
// Create a directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 3); // White light, intensity 3
// Set the position of the light source (this also defines its direction)
directionalLight.position.set(5, 10, 7.5); // x, y, z
// Add the directional light to the scene
scene.add(directionalLight);

// Ambient light to softly illuminate the whole scene
// This helps to see parts of objects that are not directly lit by the directional light
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light, intensity 2
scene.add(ambientLight);


// 6. Animation Loop
function animate() {
    // Request the next frame of the animation
    requestAnimationFrame(animate);

    // Animate the cube: rotate it on its x and y axes
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Render the scene from the perspective of the camera
    renderer.render(scene, camera);
}

// 7. Handle Window Resize
// Add an event listener for the window resize event
window.addEventListener('resize', () => {
    // Update the camera's aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    // Update the camera's projection matrix after changing the aspect ratio
    camera.updateProjectionMatrix();
    // Update the renderer's size
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the animation loop
animate(); //
