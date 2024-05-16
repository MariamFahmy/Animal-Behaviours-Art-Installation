import * as THREE from 'three';

export class State {
	// Creating an abstract class in JS
	// Ensuring enterState and updateState are implemented
	constructor() {
	    if(this.constructor == State) {
	       throw new Error("Class is of abstract type and cannot be instantiated");
	    };

	    if(this.enterState == undefined) {
	        throw new Error("enterState method must be implemented");
	    };

	     if(this.updateState == undefined) {
	        throw new Error("updateState method must be implemented");
	    };
	}
}

export class PatrolState extends State {
	enterState(guard, enemy) {
		guard.topSpeed = 10;
	}

	updateState(guard, enemy) {
		guard.applyForce(guard.wander());
	}
}



export class ChaseState extends State {
	
	enterState(guard, enemy) {
		guard.topSpeed = 30;

	}

	updateState(guard, enemy) {
		if (guard.location.distanceTo(enemy.location) <= 5) {
			guard.switchState(enemy, new EatPreyState())
		} else {
			guard.applyForce(guard.seek(enemy.location));
		}
		
	}

  
}

export class EatPreyState extends State {
	enterState(guard, enemy) {
		enemy.disappear()
	}

	updateState(guard, enemy) {
		guard.switchState(enemy, new PatrolState())
	}
}










