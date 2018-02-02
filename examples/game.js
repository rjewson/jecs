import * as JECS from "../src/jecs.js";

const Position = function(x, y) {
    this.x = x;
    this.y = y;
};

const Graphics = function(id) {
    this.id = id;
};

const renderSystem = function(render) {
    return {
        components: [Position, Graphics],
        onAdded: (entity, position, graphics) => {
            console.log(`adding ${entity}...`);
        },
        onUpdate: (entity, dt, position, graphics) => {
            console.log(`Render ${entity} : ${graphics.id} @ ${position.x},${position.y} with ${render}`);
        },
        onRemoved: (entity, position, graphics) => {
            console.log("removing ${entity}...");
        },
    };
};

let engine = JECS.createEngine(10, [Position, Graphics]);

JECS.addSystemToEngine(engine, renderSystem("renderer instance"));

const player = JECS.createEntity(engine);
JECS.addComponentsToEntity(engine, player, [new Position(1, 2), new Graphics("me")]);

console.log(engine);

JECS.tickAllSystems(engine);

const player2 = JECS.createEntity(engine);
JECS.addComponentsToEntity(engine, player2, [new Position(1, 2), new Graphics("me")]);
JECS.tickAllSystems(engine);
console.log(engine);

JECS.deleteEntity(engine, player);
JECS.tickAllSystems(engine);
console.log(engine);

JECS.deleteEntity(engine, player2);
JECS.tickAllSystems(engine);
console.log(engine);

JECS.addEntityCapacityToEngine(engine,10);
console.log(engine);
