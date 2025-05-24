class Camera {
  constructor(aspectRatio, near = 0.1, far = 1000) {
    this.fov = 60;
    this.eye = new Vector3([0, 0, 0]);
    this.at = new Vector3([0, 0, -1]);
    this.up = new Vector3([0, 1, 0]);

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.projectionMatrix.setPerspective(this.fov, aspectRatio, near, far);

    this._tempVec3_1 = new Vector3();
    this._tempVec3_2 = new Vector3(); 
    this._tempMatrix4_1 = new Matrix4();

    this.updateView();
  }

  updateView() {
    this.viewMatrix.setLookAt(
        this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
        this.at.elements[0], this.at.elements[1], this.at.elements[2],
        this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }

  moveForward(speed) {
    let f = this._tempVec3_1;
    f.set(this.at);
    f.sub(this.eye); 
    f.normalize();
    f.mul(speed);

    this.eye.add(f);
    this.at.add(f);
    this.updateView();
  }

  moveBackwards(speed) {
    let b = this._tempVec3_1;
    b.set(this.eye);
    b.sub(this.at); 
    b.normalize();
    b.mul(speed);

    this.eye.add(b);
    this.at.add(b);
    this.updateView();
  }

  moveLeft(speed) {
    let f = this._tempVec3_1;
    f.set(this.at);
    f.sub(this.eye); 

    let s = Vector3.cross(this.up, f); 
    s.normalize();
    s.mul(speed);

    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  moveRight(speed) {
    let f = this._tempVec3_1;
    f.set(this.at);
    f.sub(this.eye); 

    let s = Vector3.cross(f, this.up); 
    s.normalize();
    s.mul(speed);

    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  moveUp(speed) {
    let verticalOffset = this._tempVec3_1; 
    verticalOffset.set(this.up);           
    verticalOffset.mul(speed);             

    this.eye.add(verticalOffset);          
    this.at.add(verticalOffset);           
    this.updateView();
  }

  moveDown(speed) {
    let verticalOffset = this._tempVec3_1; 
    verticalOffset.set(this.up);           
    verticalOffset.mul(-speed);            

    this.eye.add(verticalOffset);          
    this.at.add(verticalOffset);           
    this.updateView();
  }

  panLeft(alpha) {
    let f = this._tempVec3_1; 
    f.set(this.at);
    f.sub(this.eye); 

    let rotationMatrix = this._tempMatrix4_1; 
    rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

    let f_prime = rotationMatrix.multiplyVector3(f);

    let newAt = this._tempVec3_2; 
    newAt.set(this.eye);
    newAt.add(f_prime);
    this.at.set(newAt);

    this.updateView();
  }

  panRight(alpha) {
    let f = this._tempVec3_1;
    f.set(this.at);
    f.sub(this.eye);

    let rotationMatrix = this._tempMatrix4_1;
    rotationMatrix.setRotate(-alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

    let f_prime = rotationMatrix.multiplyVector3(f);

    let newAt = this._tempVec3_2;
    newAt.set(this.eye);
    newAt.add(f_prime);
    this.at.set(newAt);

    this.updateView();
  }

  pitchView(beta) { 
    let direction = this._tempVec3_1;
    direction.set(this.at).sub(this.eye); 

    let right = Vector3.cross(direction, this.up); 
    right.normalize();

    let rotationMatrix = this._tempMatrix4_1;
    rotationMatrix.setRotate(beta, right.elements[0], right.elements[1], right.elements[2]);

    let newDirection = rotationMatrix.multiplyVector3(direction);
    let newUp = rotationMatrix.multiplyVector3(this.up);

    let checkForward = new Vector3().set(newDirection).normalize(); 

    if (Math.abs(checkForward.elements[1]) < 0.996) { 
        this.at.set(this.eye).add(newDirection); 
        this.up.set(newUp).normalize(); 
    }

    this.updateView();
  }
}