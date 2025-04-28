class Cube {
    constructor() {
        this.type = 'cube';
        this.vertexBuffer = null;

        this.indexBuffer = null;
        this.vertices = null;

        this.n = 0;

        this.initVertexBuffers(); 
    }

    initVertexBuffers() {

        const v = new Float32Array([   
             0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, 
             0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, 
             0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, 
            -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, 
            -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, 
             0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  
        ]);

        const indices = new Uint8Array([
             0, 1, 2,   0, 2, 3,    
             4, 5, 6,   4, 6, 7,    
             8, 9,10,   8,10,11,    
            12,13,14,  12,14,15,    
            16,17,18,  16,18,19,    
            20,21,22,  20,22,23     
         ]);

        this.n = indices.length;

        this.vertexBuffer = gl.createBuffer();

        this.indexBuffer = gl.createBuffer(); 
        if (!this.vertexBuffer || !this.indexBuffer) {
            console.log('Failed to create buffer objects');
            return false;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return true;
    }

    render(modelMatrix,color) { 

        if (a_Position < 0 || !u_FragColor || !u_ModelMatrix) {
             console.log('Attribute or uniform location invalid. Ensure connectVariablesToGLSL ran successfully.');
             return;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

     gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

     gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

     gl.drawElements(gl.TRIANGLES, this.n, gl.UNSIGNED_BYTE, 0);

    }
}