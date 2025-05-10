// Lab3/camera.js
class Camera {
  constructor(aspectRatio, near = 0.1, far = 1000) { // Added default values for near/far
    this.fov = 60;
    this.eye = new Vector3([0, 0, 0]); // Initialize eye to (0,0,0)
    this.at = new Vector3([0, 0, -1]);  // Initialize at to (0,0,-1) (formerly center)
    this.up = new Vector3([0, 1, 0]);

    this.viewMatrix = new Matrix4();
    // updateView will be called after attributes are set

    this.projectionMatrix = new Matrix4();
    // Use the provided aspectRatio, near, and far parameters
    this.projectionMatrix.setPerspective(this.fov, aspectRatio, near, far);

    this.updateView(); // Initial call to set up the view matrix
  }

  updateView() {
    this.viewMatrix.setLookAt(
        this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
        this.at.elements[0], this.at.elements[1], this.at.elements[2],
        this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }

  moveForward(speed) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye); // f = at - eye
    f.normalize();
    f.mul(speed);

    this.eye.add(f);
    this.at.add(f);
    this.updateView();
  }

  moveBackwards(speed) {
    let b = new Vector3();
    b.set(this.eye);
    b.sub(this.at); // b = eye - at
    b.normalize();
    b.mul(speed);

    this.eye.add(b);
    this.at.add(b);
    this.updateView();
  }

  moveLeft(speed) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye); // f = at - eye

    // s = up x f
    let s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(speed);

    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  moveRight(speed) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye); // f = at - eye

    // s = f x up
    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(speed);

    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  panLeft(alpha) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye); // f = at - eye

    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

    let f_prime = rotationMatrix.multiplyVector3(f);

    // Update at = eye + f_prime
    let newAt = new Vector3();
    newAt.set(this.eye);
    newAt.add(f_prime);
    this.at.set(newAt);

    this.updateView();
  }

  panRight(alpha) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye); // f = at - eye

    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(-alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

    let f_prime = rotationMatrix.multiplyVector3(f);
    
    // Update at = eye + f_prime
    let newAt = new Vector3();
    newAt.set(this.eye);
    newAt.add(f_prime);
    this.at.set(newAt);
    
    this.updateView();
  }
}