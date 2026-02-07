import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GameMap } from "./Game/World/GameMap.js";
import { Character } from "./Game/Behaviour/Character.js";
import { BabyDuck } from "./Game/Behaviour/BabyDuck.js";
import { Player } from "./Game/Behaviour/Player.js";
import { Controller } from "./Game/Behaviour/Controller.js";
import { Resources } from "../js/Util/Resources.js";
import { LSystem } from "./Game/World/LSystem.js";
import { Lion } from "./Game/Behaviour/Lion.js";

// Create Scene
const SCENE = new THREE.Scene();
const CAMERA = new THREE.PerspectiveCamera(
  100,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const RENDERER = new THREE.WebGLRenderer();

const ORBIT_CONTROLS = new OrbitControls(CAMERA, RENDERER.domElement);
const CLOCK = new THREE.Clock();
const CONTROLLER = new Controller(document); // controller to allow user to use arrow keys to move

let gameMap;
let user;
let babyDuck;
let characters = [];
let resources;
let PREY, PREDATOR;

// Setup our scene
async function setup() {
  SCENE.background = new THREE.Color(0xffffff);
  RENDERER.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(RENDERER.domElement);

  CAMERA.position.y = 65;
  CAMERA.lookAt(0, 0, 0);

  //Create Light
  let directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(0, 5, 5);
  SCENE.add(directionalLight);

  // initialize our gameMap
  gameMap = new GameMap();
  gameMap.init(SCENE);
  SCENE.add(gameMap.gameObject);

  // Load resources
  let files = [
    { name: "duck", url: "/models/Duck with a gun.glb" },
    { name: "flock", url: "/models/flying duck.glb" },
    { name: "baby duck", url: "/models/Duck with a gun.glb" },
    { name: "lion", url: "/models/Lion.glb" },
    { name: "zebra", url: "/models/Zebra.glb" },
  ];
  resources = new Resources(files);
  await resources.loadAll();

  PREY = new Character(new THREE.Color(0x00ff00), SCENE);
  PREDATOR = new Lion(new THREE.Color(0x0000ff), PREY, SCENE);

  // Create baby duck and mother duck (user)
  babyDuck = new BabyDuck(new THREE.Color(0x000000), SCENE);
  user = new Player(new THREE.Color(0xff0000), SCENE);

  babyDuck.setModel(resources.get("baby duck"));
  user.setModel(resources.get("duck"));

  // Add the characters to the scene
  SCENE.add(babyDuck.gameObject);
  SCENE.add(user.gameObject);

  // Get a random starting place for the baby duck and player
  let startBabyDuck = gameMap.graph.getRandomEmptyTile();
  let startPlayer = gameMap.graph.getRandomEmptyTile();

  // this is where we start the baby duck
  babyDuck.location = gameMap.localize(startBabyDuck);

  // this is where we start the player
  user.location = gameMap.localize(startPlayer);

  // Add birds that will flock
  addFlockToScene();

  addProcedurallyGeneratedTree();

  // let goals = [];
  // for (let i = 0; i < 3; i++) {
  // 	goals.push(gameMap.graph.getRandomEmptyTile());
  // }
  // setup our flow field
  // gameMap.setupFlowField(goals);
  gameMap.setupSingleGoalFlowField(startPlayer);

  // Predator and prey
  // set character locations (random)
  PREDATOR.location = gameMap.localize(gameMap.graph.nodes[100]);
  PREY.location = gameMap.localize(gameMap.graph.nodes[210]);

  PREDATOR.setModel(resources.get("lion"));
  PREY.size = 15;
  PREY.topSpeed = 5;
  PREY.setModel(resources.get("zebra"));

  // add our characters to the scene
  SCENE.add(PREDATOR.gameObject);
  SCENE.add(PREY.gameObject);

  //First call to animate
  animate();
}

// animate
function animate() {
  requestAnimationFrame(animate);
  RENDERER.render(SCENE, CAMERA);

  let deltaTime = CLOCK.getDelta();

  for (let i = 0; i < characters.length; i++) {
    // Flocking!

    // Separate
    let separate = characters[i].separate(characters);
    separate.multiplyScalar(4);
    characters[i].applyForce(separate);

    // Alignment
    let alignment = characters[i].align(characters);
    alignment.multiplyScalar(3);
    characters[i].applyForce(alignment);

    // Cohesion
    let cohesion = characters[i].cohesion(characters);
    cohesion.multiplyScalar(2);
    characters[i].applyForce(cohesion);

    characters[i].update(deltaTime, gameMap);
  }

  let steerNPC = babyDuck.interactiveFlow(gameMap, user);
  // let steer = npc.flow(gameMap);
  babyDuck.applyForce(steerNPC);

  babyDuck.update(deltaTime, gameMap);
  user.update(deltaTime, gameMap, CONTROLLER);

  // predator and prey
  PREDATOR.update(PREY, deltaTime, gameMap);

  PREY.applyForce(PREY.flee(PREDATOR.location));
  PREY.update(deltaTime, gameMap);

  ORBIT_CONTROLS.update();
}

function addFlockToScene() {
  for (let i = 0; i < 50; i++) {
    let c = new Character(0xff0000, SCENE);
    c.location = new THREE.Vector3(
      Math.random() * 50 - 25,
      30,
      Math.random() * 50 - 25,
    );
    c.update(CLOCK.getDelta(), gameMap);
    characters.push(c);
    c.setModel(resources.get("flock"));
    SCENE.add(c.gameObject);
  }
}

function addProcedurallyGeneratedTree() {
  let rules = {
    X: "F[u+FXd][u-FXd]",
    F: "FF",
  };
  let axiom = "X";

  let lsystem = new LSystem(rules);
  let str = lsystem.generate(axiom, 7);
  let tree = lsystem.interpret(str);
  tree.position.y += 5;
  SCENE.add(tree);
}

setup();
