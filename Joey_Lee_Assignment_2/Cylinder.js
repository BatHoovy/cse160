class Cylinder {

    constructor(radius = 0.5, height = 1.0, segments = 12) {
        this.type = 'cylinder';
        this.radius = radius;
        this.height = height;
        this.segments = Math.max(3, segments); 

        this.topCapBuffer = null;
        this.bottomCapBuffer = null;
        this.sideBuffer = null;

        this.topCapVertexCount = 0;
        this.bottomCapVertexCount = 0;
        this.sideVertexCount = 0;

        this.initVertexBuffers();
    }

    initVertexBuffers() {
        const radius = this.radius;
        const height = this.height;
        const segments = this.segments;
        const halfHeight = height / 2.0;

        let topCapVertices = [0, halfHeight, 0]; 
        let bottomCapVertices = [0, -halfHeight, 0]; 
        let sideVertices = [];

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);

            topCapVertices.push(x, halfHeight, z);

            bottomCapVertices.push(x, -halfHeight, z);

            sideVertices.push(x, halfHeight, z);  
            sideVertices.push(x, -halfHeight, z); 
        }

        this.topCapVertexCount = topCapVertices.length / 3;
        this.bottomCapVertexCount = bottomCapVertices.length / 3;
        this.sideVertexCount = sideVertices.length / 3;

        this.topCapBuffer = gl.createBuffer();
        if (!this.topCapBuffer) {
            console.error('Failed to create the top cap buffer object');
            return false;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.topCapBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(topCapVertices), gl.STATIC_DRAW);

        this.bottomCapBuffer = gl.createBuffer();
        if (!this.bottomCapBuffer) {
            console.error('Failed to create the bottom cap buffer object');
            return false;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bottomCapBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bottomCapVertices), gl.STATIC_DRAW);

        this.sideBuffer = gl.createBuffer();
        if (!this.sideBuffer) {
            console.error('Failed to create the side buffer object');
            return false;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sideBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sideVertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return true;
    }

    render(modelMatrix, color) {

        if (a_Position < 0 || !u_FragColor || !u_ModelMatrix) {
            console.error('Attribute or uniform location invalid in Cylinder.render.');
            return;
        }

        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

        gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.topCapBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.topCapVertexCount);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bottomCapBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.bottomCapVertexCount);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.sideBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.sideVertexCount);  
    }
}