# Animal Behaviours Three.js Interactive Art Installation
An interactive art installation that makes use of algorithms such as: 
- flow-field pathfinding
- complex movement algorithms such as wandering, separation, cohesion, alignment and flocking
- a state machine for decision making
- a Lindenmayer system for procedural content generation

## Description
This project is an interactive art installation showing animal behavior such as:
- birds flocking and flying
- a predator chasing and eating a prey
- a baby duck following its mother
All these behaviors are inspired by real life.
## How to Run
Install three.js and vite, then run the command “npx vite” as shown here: https://threejs.org/docs/#manual/en/introduction/Installation
## Controls
The user controls the mother duck. Use the up, down, right and left arrow keys to move. 
Topics Implemented and How to View Them in the Application
• Complex movement algorithms: wander (Character.js)
o The zebra wanders
• Decision making: state machine (Guard.js, State.js)
o The lion is initially in the state of chasing the zebra, then when it reaches the zebra, it 
changes to the eating state, then finally changes to a wandering state
• Procedural Content Generation: Lindenmayer system (Lsystem.js)
o The brown tree in the middle is generated using a Lindenmayer system
• Pathfinding: flow field (NPC.js)
o The baby duck follows mother duck using the flow field algorithm
• Other: separation, cohesion, alignment, flocking (Character.js)
o The birds flying are using algorithms including separation, cohesion and alignment
