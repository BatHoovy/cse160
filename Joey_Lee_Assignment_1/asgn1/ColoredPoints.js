// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
  attribute vec4 a_Position; 
  uniform float u_Size;
  void main() { 
    gl_Position = a_Position; 
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

const POINT=0;
const TRIANGLE=1;
const CIRCLE=2;
//Globals related to UI ELEMENTS
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=5;
let g_selectedSeg=10;
let g_selectedType=POINT;
function addActionsForHTMLUI(){
  document.getElementById("green").onclick=function(){g_selectedColor=[0.0,1.0,0.0,1.0];};
  document.getElementById("red").onclick=function(){g_selectedColor=[1.0,0.0,0.0,1.0];};
  document.getElementById("clear").onclick=function(){g_shapesList=[];renderAllShapes();};

  document.getElementById("pointButton").onclick=function(){g_selectedType=POINT};
  document.getElementById("triangleButton").onclick=function(){g_selectedType=TRIANGLE};
  document.getElementById("circleButton").onclick=function(){g_selectedType=CIRCLE};

  document.getElementById("draw").onclick=function(){drawTriangles();};



  document.getElementById("redSlide").addEventListener('mouseup',function(){g_selectedColor[0]=this.value/100;});
  document.getElementById("greenSlide").addEventListener('mouseup',function(){g_selectedColor[1]=this.value/100;});
  document.getElementById("blueSlide").addEventListener('mouseup',function(){g_selectedColor[2]=this.value/100;});

  document.getElementById("sizeSlide").addEventListener('mouseup',function(){g_selectedSize=this.value;});
  document.getElementById("segSlide").addEventListener('mouseup',function(){g_selectedSeg=this.value;});


}
const PREDEFINED_TRIANGLES = [
  { 
      vertices: [-0.2, 0.0, 0.0, 0.0, 0.0, 0.2],
      color: [1.0, 0.0, 0.0, 1.0]  
  },
  { 
      vertices: [0.2, 0.0, 0.0, 0.0, 0.0, 0.2],
      color: [0.0, 1.0, 0.0, 1.0]  
  },
  { 
      vertices: [-0.2, 0.0, 0.0, 0.0, 0.0, -0.2],
      color: [0.0, 0.0, 1.0, 1.0]  
  },
  {
    vertices: [0.2, 0.0, 0.0, 0.0, 0.0, -0.2],
    color: [1.0, 1.0, 1.0, 1.0]  
},
{
  vertices: [0.2, 0.0, 0.4, 0.0, 0.4, 0.2],
  color: [1.0, 1.0, 1.0, 1.0]  
},
{
  vertices: [0.2, 0.0, 0.2, 0.2, 0.0, 0.2],
  color: [1.0, 1.0, 1.0, 1.0]  
},
{
  vertices: [0.2, 0.0, 0.2, 0.2, 0.4, 0.2],
  color: [1.0, 0.0, 1.0, 1.0]  
},
{
  vertices: [0.2, 0.2, 0.4, 0.2, 0.2, 0.4],
  color: [1.0, 0.5, 1.0, 1.0]  
},
{
  vertices: [0.2, 0.2, 0.2, 0.4, 0.0, 0.2],
  color: [1.0, 0.0, 0.5, 1.0]  
},
{
  vertices: [-0.2, 0.0, -0.2, 0.2, 0.0, 0.2],
  color: [1.0, 0.0, 0.5, 1.0]  
},
{
  vertices: [-0.2, 0.0, -0.4, 0.2, -0.4, 0.0],
  color: [1.0, 0.0, 0.5, 1.0]  
},
{
  vertices: [-0.2, 0.0, -0.2, 0.2, -0.4, 0.2],
  color: [0.3, 0.3, 0.5, 1.0]  
},
{
  vertices: [-0.2, 0.2, -0.2, 0.4, 0, 0.2],
  color: [1.0, 1.0, 0.3, 1.0]  
},
{
  vertices: [-0.4, 0.2, -0.2, 0.2, -0.2, 0.4],
  color: [1.0, 0.0, 0.5, 1.0]  
},
{
  vertices: [-0.2, 0.0, -0.2, -0.2, 0.0, -0.2],
  color: [1.0, 0.0, 0.5, 1.0]  
},
{
  vertices: [-0.4, 0.0, -0.2, 0.0, -0.2, -0.2],
  color: [0.3, 0.0, 0.5, 1.0]  
},
{
  vertices: [-0.2, -0.2, 0.0, -0.2, 0.0, -0.4],
  color: [1.0, 1.0, 1.2, 1.0]  
},
{
  vertices: [0.2, 0.0, 0.2, -0.2, 0.0, -0.2],
  color: [1.0, 1.0, 0.5, 1.0]  
},
{
  vertices: [0.2, 0.0, 0.4, 0.0, 0.2, -0.2],
  color: [0.5, 1.0, 0.5, 1.0]  
},
{
  vertices: [0.2, -0.2, 0.0, -0.2, 0.0, -0.4],
  color: [0.5, 1.0, 0.5, 1.0]  
}

];
function drawTriangles(){
  PREDEFINED_TRIANGLES.forEach(triData => {
    let triangle = new Triangle();
    triangle.vertices = triData.vertices;
    triangle.color = triData.color; // Use current color
    triangle.size = g_selectedSize;
    g_shapesList.push(triangle);
  });
  renderAllShapes();
}
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHTMLUI();
  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove= function(ev){if(ev.buttons==1){click(ev)}};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}


var g_shapesList=[]
//var g_points = [];  // The array for the position of a mouse press
//var g_colors = [];  // The array to store the color of a point
//var g_sizes = [];
function click(ev) {
  
  [x,y]= convertCoordinatesEventToGL(ev);
  let point;
  if(g_selectedType==POINT){
    point= new Point();
  }else if(g_selectedType==TRIANGLE){
    point=new Triangle();
  }else{
    point= new Circle();
    point.segments=g_selectedSeg;
  }
  point.position=[x,y];
  point.color=g_selectedColor.slice();
  point.size=g_selectedSize;
  g_shapesList.push(point);
  // // Store the coordinates to g_points array
  // g_points.push([x, y]);
  // g_colors.push(g_selectedColor.slice());
  // g_sizes.push(g_selectedSize);
  // Store the coordinates to g_points array
  // if (x >= 0.0 && y >= 0.0) {      // First quadrant
  //   g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
  // } else if (x < 0.0 && y < 0.0) { // Third quadrant
  //   g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
  // } else {                         // Others
  //   g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
  // }

  renderAllShapes();
}

function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return([x,y]); 
}

function renderAllShapes(){
  var startTime=performance.now();
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList .length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: "+ Math.floor(10000/duration),"numdot");
}

function sendTextToHTML(text,htmlID){
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log("failed to get "+htmlID+"from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}