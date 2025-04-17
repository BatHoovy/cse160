class Circle {
    constructor() {
        this.type = 'circle';
        this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 5.0;
        this.segments = 30; 
    }

    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

        // Set the color
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
         
        var radius = size / 100.0; 
        
        let angleStep = 360 / this.segments;
        let vertices = [];
        
        for (var angle = 0; angle <= 360; angle += angleStep) {
            let radianAngle = angle * Math.PI / 180;
            let x = xy[0] + radius * Math.cos(radianAngle);
            let y = xy[1] + radius * Math.sin(radianAngle);
            vertices.push(x, y);
        }
        
        drawTriangleFan(vertices);
    }
}

function drawTriangleFan(vertices) {
    var n = vertices.length / 2;     

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
}