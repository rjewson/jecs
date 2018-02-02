import * as JECS from "../src/jecs.js";

const Position = function(x, y) {
    this.x = x;
    this.y = y;
};

const Graphics = function(id) {
    this.id = id;
};

const Velocity = function(x, y) {
    this.x = x;
    this.y = y;
};

const physicsSystem = function() {
    return {
        components: [Position, Velocity],
        onUpdate: (entity, dt, position, velocity) => {
            position.x += velocity.x;
            position.y += velocity.y;
        },
    };
};

const renderSystem = function(renderer) {
    return {
        components: [Position, Graphics],
        onAdded: (entity, position, graphics) => {
            renderer.addNode(graphics.id);
        },
        onUpdate: (entity, dt, position, graphics) => {
            renderer.positionNode(graphics.id, position.x, position.y);
        },
        onRemoved: (entity, position, graphics) => {
            renderer.removeNode(graphics.id);
        },
    };
};

const domRender = {
    addNode: id => {
        const el = document.createElement("div");
        el.id = id;
        el.classList.add("thing");
        document.getElementById("game").append(el);
    },
    removeNode: id => {
        root.removeNode(document.getElementById(id));
    },
    positionNode: (id, x, y) => {
        const el = document.getElementById(id);
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
    },
};

let engine = JECS.createEngine(10, [Position, Graphics, Velocity]);

JECS.addSystemToEngine(engine, physicsSystem());
JECS.addSystemToEngine(engine, renderSystem(domRender));

const player = JECS.createEntity(engine);
JECS.addComponentsToEntity(engine, player, [new Position(0, 0), new Graphics("player1"), new Velocity(2, 0)]);

const player2 = JECS.createEntity(engine);
JECS.addComponentsToEntity(engine, player2, [new Position(0, 30), new Graphics("player2"), new Velocity(1, 0)]);

// const state = {
//   }
// JECS.restoreEngine(engine,state);

document.addEventListener("click",()=>{
    console.log(JECS.serializeEngine(engine));
});

const dt = 1000 / 60;
setInterval(() => {
    JECS.tickAllSystems(engine, dt);
}, dt);
