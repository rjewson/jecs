const indexOnPrototype = (obj, index) => (obj.prototype._index_ = index);
const emptyNullArray = count => Array(count).fill(null);

export const createEngine = (entityCount, componentTypes) => {
    componentTypes.forEach(indexOnPrototype);
    const components = componentTypes.map(() => emptyNullArray(entityCount));
    const systems = [];
    const freeEntities = Array(entityCount)
        .fill(0)
        .map((x, i) => entityCount - i - 1);
    return { components, systems, freeEntities };
};

export const serializeEngine = engine => ({
    components: JSON.stringify(engine.components),
    freeEntities: JSON.stringify(engine.freeEntities),
});

export const restoreEngine = (engine, data) => {
    engine.components = JSON.parse(data.components);
    engine.freeEntities = JSON.parse(data.freeEntities);
    rematchAllEntities(engine);
};

const componentIndex = component => component._index_;

const getComponentFromEntityByIndex = (engine, entity, componentIndex) => engine.components[componentIndex][entity];

const setComponentOnEntity = (engine, entity, component) =>
    (engine.components[componentIndex(component)][entity] = component);

const deleteComponentOnEntity = (engine, entity, component) =>
    (engine.components[componentIndex(component)][entity] = null);

const componentFactoryToIndex = components => components.map(component => component.prototype._index_);

const deleteAllComponentsOnEntity = (engine, entity) =>
    engine.components.forEach(component => deleteComponentOnEntity(engine, entity, component));

const returnEntity = (enginem, entity) => engine.freeEntities.push(entity);

export const createEntity = engine => engine.freeEntities.pop();

export const deleteEntity = (engine, entity) => {
    returnEntity(engine, entity);
    deleteAllComponentsOnEntity(engine, entity);
};

export const addComponentsToEntity = (engine, entity, components) => {
    components.forEach(component => setComponentOnEntity(engine, entity, component));
    matchEntityToSystems(engine, entity);
};

export const removeComponentsFromEntity = (engine, entity, components) => {
    components.forEach(component => deleteComponentOnEntity(engine, entity, component));
    matchEntityToSystems(engine, entity);
};

export const addSystemToEngine = (engine, system) => {
    system.components = componentFactoryToIndex(system.components).sort();
    system.entities = new Set();
    engine.systems.push(system);
};

export const entityComponentsForSystem = (engine, entity, system) =>
    system.components.map(componentIndex => getComponentFromEntityByIndex(engine, entity, componentIndex));

export const addEntityToSystem = (engine, entity, system) =>
    !system.entities.has(entity) &&
    system.entities.add(entity) &&
    system.onAdded &&
    system.onAdded.apply(null, entityComponentsForSystem(engine, entity, system));

export const removeEntityFromSystem = (engine, entity, system) =>
    system.entities.has(entity) &&
    system.entities.delete(entity) &&
    system.onRemoved &&
    system.onRemoved.apply(null, entityComponentsForSystem(engine, entity, system));

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

const rematchAllEntities = engine => engine.components[0].forEach((x, entity) => matchEntityToSystems(engine, entity));

export const tickAllSystems = engine =>
    engine.systems.forEach(system =>
        system.entities.forEach(entity =>
            system.onUpdate.apply(null, entityComponentsForSystem(engine, entity, system)),
        ),
    );
