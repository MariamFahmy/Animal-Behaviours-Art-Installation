import * as THREE from 'three';
import { VectorUtil } from '../../Util/VectorUtil.js';

export class Character {

	// Character Constructor
	constructor(mColor, scene) {
		this.scene = scene;
		this.size = 10;

		// Create our cone geometry and material
		let coneGeo = new THREE.ConeGeometry(this.size/2, this.size, 10);
		let coneMat = new THREE.MeshStandardMaterial({color: mColor});
		
		// Create the local cone mesh (of type Object3D)
		let mesh = new THREE.Mesh(coneGeo, coneMat);
		// Increment the y position so our cone is just atop the y origin
		mesh.position.y = mesh.position.y+1;
		// Rotate our X value of the mesh so it is facing the +z axis
		mesh.rotateX(Math.PI/2);

		// Add our mesh to a Group to serve as the game object
		this.gameObject = new THREE.Group();
		this.gameObject.add(mesh);		

		// Initialize movement variables
		this.location = new THREE.Vector3(-25,0,-35);
		this.velocity = new THREE.Vector3(4,0,0.5);
		this.acceleration = new THREE.Vector3(0, 0, 0);

		this.topSpeed = 20;
		this.mass = 1;
		this.maxForce = 10;
		this.frictionMagnitude = 0;

		// predator and prey
		this.maxForce = 15;
		this.wanderAngle = null;
	}

	// Seek steering behaviour
	seek(target) {
		let desired = new THREE.Vector3();
		desired.subVectors(target, this.location);
		desired.setLength(this.topSpeed);

		let steer = new THREE.Vector3();
		steer.subVectors(desired, this.velocity);

		if (steer.length() > this.maxForce) {
			steer.setLength(this.maxForce);
		}
		return steer;
	}

	// Wander steering behaviour
	wander() {
		let d = 10;
		let r = 10;
		let a = 0.3;

		let futureLocation = this.velocity.clone();
		futureLocation.setLength(d);
		futureLocation.add(this.location);



		if (this.wanderAngle == null) {
			this.wanderAngle = Math.random() * (Math.PI*2);
		} else {
			let change = Math.random() * (a*2) - a;
			this.wanderAngle = this.wanderAngle + change;
		}

		let target = new THREE.Vector3(r*Math.sin(this.wanderAngle), 0, r*Math.cos(this.wanderAngle));
		target.add(futureLocation);
		return this.seek(target);

	}

	// Alignment steering behvaiour
	align(characters) {
		// You will want to tune neighbourDistance 
		//  to work for your application
		let neighbourDistance = 20;

		// will be used for average velocity
		let vectorSum = new THREE.Vector3();
		let count = 0;

		// Iterate over all other characters
		for (let i = 0; i < characters.length; i++) {
			let distance = this.location.distanceTo(characters[i].location);

			if ((distance < neighbourDistance) && (distance != 0)) {
				vectorSum.add(characters[i].velocity);
				count++;
			}

		}
		// Can't divide by 0!
		if (count == 0) {
			return new THREE.Vector3();
		}

		// averageVelocity is our desired velocity
		let averageVelocity = VectorUtil.divideScalar(vectorSum, count);
		averageVelocity.setLength(this.topSpeed);
		// Again, using Reynold's formula, desired velocity - velocity
		let steer = VectorUtil.sub(averageVelocity, this.velocity);
		return steer;
	}

	// Cohesion steering behaviour
	cohesion(characters) {
		// You will want to tune neighbourDistance 
		//  to work for your application
		let neighbourDistance = 20;

		let locationSum = new THREE.Vector3();
		let count = 0;

		// Iterate all other characters
		for (let i = 0; i < characters.length; i++) {
			let distance = this.location.distanceTo(characters[i].location);

			if ((distance < neighbourDistance) && (distance != 0)) {
				locationSum.add(characters[i].location);
				count++;
			}
		}
		// Can't divide by 0!
		if (count == 0) {
			return new THREE.Vector3();
		}

		// averageLocation is the average location of
		// all characters within the neighbour distance
		let averageLocation = VectorUtil.divideScalar(locationSum, count);
		let steer = this.seek(averageLocation);
		return steer;

	}

	// Separate steering behaviour
	separate(characters) {
		// You will want to tune neighbourDistance
		//  to work for your application
		let desiredSeparation = 6;
		let vectorSum = new THREE.Vector3();
		let count = 0;

		// Iterate over all other characters
		for (let i = 0; i < characters.length; i++) {
			let distance = this.location.distanceTo(characters[i].location);

			if ((distance < desiredSeparation) && (distance != 0)) {
				// Get away!!!!!!
				let desiredVelocity = VectorUtil.sub(this.location, characters[i].location);
				desiredVelocity.normalize();
				vectorSum.add(desiredVelocity);
				count++;
			}
		}
		// Can't divide by 0!
		if (count == 0) {
			return new THREE.Vector3();
		}
		// averageVector is our desired velocity
		// Which is the average direction to separate
		let averageVector = VectorUtil.divideScalar(vectorSum, count);
		averageVector.setLength(this.topSpeed);

		// Again, using Reynolds formula, desired velocity - velocity
		let steer = VectorUtil.sub(averageVector, this.velocity);
		
		return steer;
	}

	// Flee steering behaviour
	flee(target) {
		let flee = this.seek(target).multiplyScalar(-2);
		return flee;
	}

	// Disappear from the scene, e.g. when zebra gets eaten by lion, this method is used to remove it from scene
	disappear() {
		this.scene.remove(this.gameObject)
	}

	setModel(model) {		
		// Bounding box for the object
		var bbox = new THREE.Box3().setFromObject(model);

		// Get the depth of the object for avoiding collisions
		// Of course we could use a bounding box,
		// but for now we will just use one dimension as "size"
		// (this would work better if the model is square)
		let dz = bbox.max.z-bbox.min.z;

		// Scale the object based on how
		// large we want it to be
		let scale = this.size/dz;
		model.scale.set(scale, scale, scale);

        this.gameObject = new THREE.Group();
        this.gameObject.add(model);
    }

	// update character
	update(deltaTime, gameMap) {

		this.physics(gameMap);
		// update velocity via acceleration
		this.velocity.addScaledVector(this.acceleration, deltaTime);
		
		

		if (this.velocity.length() > 0) {

			// rotate the character to ensure they face 
			// the direction of movement
			if (this.velocity.x != 0 || this.velocity.z != 0) {
				let angle = Math.atan2(this.velocity.x, this.velocity.z);
				this.gameObject.rotation.y = angle;
			}
			
			if (this.velocity.length() > this.topSpeed) {
				this.velocity.setLength(this.topSpeed);
			} 

			// update location via velocity
			this.location.addScaledVector(this.velocity, deltaTime);

		}
		
		// set the game object position
		this.gameObject.position.set(this.location.x, this.location.y, this.location.z);
		this.acceleration.multiplyScalar(0);
	
	
	}

	wrapEdges(gameMap) {
		if (this.location.x > gameMap.width / 2) {
			this.location.x = -gameMap.width / 2 + 5;
		}
		else if (this.location.x < -gameMap.width / 2) {
			this.location.x = gameMap.width / 2 - 5;
		}

		if (this.location.z > gameMap.depth / 2) {
			this.location.z = -gameMap.depth / 2 + 5;
		}
		else if (this.location.z < -gameMap.depth / 2) {
			this.location.z = gameMap.depth / 2 - 5;
		}
 	}

	// check edges
	checkEdges(gameMap) {
		this.wrapEdges(gameMap)

		let node = gameMap.quantize(this.location);

		// Avoid errors if node is undefined
		if (node == undefined) {
			return
		}

		let nodeLocation = gameMap.localize(node);

  		if (!node.hasEdgeTo(node.x-1, node.z)) {
  			let nodeEdge = nodeLocation.x - gameMap.tileSize/2;
  			let characterEdge = this.location.x - this.size/2;
  			if (characterEdge < nodeEdge) {
  				this.location.x = nodeEdge + this.size/2;
  			}
  		}

  		if (!node.hasEdgeTo(node.x+1, node.z)) {
			let nodeEdge = nodeLocation.x + gameMap.tileSize/2;
  			let characterEdge = this.location.x + this.size/2;
  			if (characterEdge > nodeEdge) {
  				this.location.x = nodeEdge - this.size/2;
  			}

  		}
		if (!node.hasEdgeTo(node.x, node.z-1)) {
  			let nodeEdge = nodeLocation.z - gameMap.tileSize/2;
  			let characterEdge = this.location.z - this.size/2;
  			if (characterEdge < nodeEdge) {
  				this.location.z = nodeEdge + this.size/2;
  			}
  		}

		if (!node.hasEdgeTo(node.x, node.z+1)) { 
  			let nodeEdge = nodeLocation.z + gameMap.tileSize/2;
  			let characterEdge = this.location.z + this.size/2;
  			if (characterEdge > nodeEdge) {
  				this.location.z = nodeEdge - this.size/2;
  			}
  		}
 	}

	// Apply force to our character
	applyForce(force) {
		// here, we are saying force = force/mass
		force.divideScalar(this.mass);
		// this is acceleration + force/mass
		this.acceleration.add(force);
	}

	// simple physics
	physics(gameMap) {
		this.checkEdges(gameMap);
		// friction
		let friction = this.velocity.clone();
		friction.y = 0;
		friction.multiplyScalar(-1);
		friction.normalize();
		friction.multiplyScalar(this.frictionMagnitude);
		this.applyForce(friction)
		
	
	}
}