// Engine factory.  Creates engine structure.
export const createEngine = (entityCount, componentTypes) => {
    componentTypes.forEach(indexOnPrototype);
    return addEntityCapacityToEngine({
        components: componentTypes.map(() => []),
        systems: [],
        entities: [],
        freeEntities: []
    },entityCount)
};

// Adds capacity to an engine to support [count] entities
export const addEntityCapacityToEngine = (engine, count) => {
    const start = engine.freeEntities.length + engine.entities.length;
    engine.components = engine.components.map(v => [...v, ...emptyNullArray(count)]);
    engine.freeEntities = [...entityRange(start, count), ...engine.freeEntities];
    return engine;
};

// Returns a component from and entity by index
// getComponentFromEntityByIndex :: ({k: v}, Number, Number) => {k: v}
const getComponentFromEntityByIndex = (engine, entity, componentIndex) => engine.components[componentIndex][entity];

// Sets a component on an entity.  index is calculated.
const setComponentOnEntity = (engine, entity, component) =>
    (engine.components[componentIndex(component)][entity] = component);

// Deletes a component on an entity.  index is calculated.
const deleteComponentOnEntity = (engine, entity, component) =>
    (engine.components[componentIndex(component)][entity] = null);

// Returns an array of component indexs based on an array of factory functions its passed.
const componentFactoryToIndex = components => components.map(component => component.prototype._index_);

// removes all components on an entity.
const deleteAllComponentsOnEntity = (engine, entity) =>
    engine.components.forEach(componentList => (componentList[entity] = null));

// frees an entity (id) by returning it to the pool.
const returnEntity = (enginem, entity) => engine.freeEntities.push(entity);

// 'creates' and entity by reserving an id from the pool.
export const createEntity = engine => {
    const entity = engine.freeEntities.pop();
    engine.entities.push(entity);
    engine.entities.sort();
    return entity;
};

// 'deletes' and entity by freeing its id and removing all components in that row.
export const deleteEntity = (engine, entity) => {
    engine.entities.splice(engine.entities.indexOf(entity), 1);
    engine.freeEntities.push(entity);
    engine.freeEntities.sort((a, b) => b - a);
    removeEntityFromAllSystems(engine, entity);
    deleteAllComponentsOnEntity(engine, entity);
};

// adds an array of components to an entity
export const addComponentsToEntity = (engine, entity, components) => {
    components.forEach(component => setComponentOnEntity(engine, entity, component));
    matchEntityToSystems(engine, entity);
};

// removes an array of components from and entity
export const removeComponentsFromEntity = (engine, entity, components) => {
    components.forEach(component => deleteComponentOnEntity(engine, entity, component));
    matchEntityToSystems(engine, entity);
};

// add system to engine
export const addSystemToEngine = (engine, system) => {
    system.components = componentFactoryToIndex(system.components).sort();
    system.entities = new Map();
    engine.systems.push(system);
};

// creates a cached 'view' of all components on a single entity that 1 system needs
const entityComponentsForSystem = (engine, entity, system) =>
    system.components.map(componentIndex => getComponentFromEntityByIndex(engine, entity, componentIndex));

// adds entity to system
const addEntityToSystem = (engine, entity, system) => {
    if (!system.entities.has(entity)) system.entities.set(entity, entityComponentsForSystem(engine, entity, system));
    if (system.onAdded) system.onAdded(entity, ...system.entities.get(entity));
};

// removes entity from system
const removeEntityFromSystem = (engine, entity, system) => {
    if (system.entities.has(entity)) {
        if (system.onRemoved) system.onRemoved(entity, ...system.entities.get(entity));
        system.entities.delete(entity);
    }
};

// The 'brains'.  Checks an entity against all the know systems.  Corresponding add/remove function is called.
const matchEntityToSystems = (engine, entity) =>
    engine.systems.forEach(
        system =>
            system.components.reduce(
                (sum, componentIndex) =>
                    getComponentFromEntityByIndex(engine, entity, componentIndex) ? sum - 1 : sum,
                system.components.length,
            ) === 0
                ? addEntityToSystem(engine, entity, system)
                : removeEntityFromSystem(engine, entity, system),
    );

// Only used when reloading state
const rematchAllEntities = engine => engine.components[0].forEach((x, entity) => matchEntityToSystems(engine, entity));

// Full cleanup
const removeEntityFromAllSystems = (engine, entity) =>
    engine.systems.forEach(system => removeEntityFromSystem(engine, entity, system));

// Updates all systems
export const tickAllSystems = (engine, dt = 0) =>
    engine.systems.forEach(system =>
        system.entities.forEach((components, entity) => system.onUpdate(entity, dt, ...components)),
    );

// Utility Functions
const indexOnPrototype = (obj, index) => (obj.prototype._index_ = index);
const emptyNullArray = count => Array(count).fill(null);
const componentIndex = component => component._index_;
const reverseOrder = (a, b) => b - a;
const entityRange = (start, len) =>
    emptyNullArray(len)
        .map((_, i) => start + i)
        .sort(reverseOrder);

// utiltity method to serialize the engine state
export const serializeEngine = engine => ({
    components: JSON.stringify(engine.components),
    freeEntities: JSON.stringify(engine.freeEntities),
    entities: JSON.stringify(engine.entities),
});

// restores the serialized engine state.  Only use on new engine instance, with systemes added
export const restoreEngine = (engine, data) => {
    engine.components = JSON.parse(data.components);
    engine.freeEntities = JSON.parse(data.freeEntities);
    engine.entities = JSON.parse(data.entities);
    rematchAllEntities(engine);
};
