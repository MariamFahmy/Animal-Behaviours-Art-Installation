import { Character } from './Character.js';
import { State, ChaseState } from './State.js';


export class Lion extends Character {

	constructor(colour, enemy) {
		super(colour);
		this.size = 30
		this.state = new ChaseState();
		this.state.enterState(this, enemy);
	}

	switchState(enemy, state) {
		this.state = state;
		this.state.enterState(this, enemy);
	}

	update(enemy, deltaTime, gameMap) {
		super.update(deltaTime, gameMap);
		this.state.updateState(this, enemy);
	}

}