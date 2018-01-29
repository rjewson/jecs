import * as JECS from "./src/jecs.js";

const Position = function (x, y) {
    this.x = x;
    this.y = y;
};

const Graphics = function (id) {
    this.id = id;
};

const renderSystem = function (render) {
    return {
        components: [Position, Graphics],
        onAdded: (position, graphics) => {
            console.log("adding...");
        },
        onUpdate: (position, graphics) => {
            console.log(`Render ${graphics.id} @ ${position.x},${position.y} with ${render}`);
        },
        onRemoved: (position, graphics) => {
            console.log("removing...");
        }
    };
};

let engine = JECS.createEngine(10, [Position, Graphics]);

JECS.addSystemToEngine(engine, renderSystem("renderer instance"));

const player = JECS.createEntity(engine);

JECS.addComponentsToEntity(engine, player, [new Position(1, 2), new Graphics("me")]);

JECS.tickAllSystems(engine);

console.log(engine);
