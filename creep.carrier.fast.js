/**
 * The fast carrier :
 * - is as fast as it can (outside of swamps)
 * - goes to energy dropped on the ground by heavy harvesters
 * - bring this energy to extensions and spawn
 */

module.exports.__proto__ = require('./creep.harvester');

/**
 * Body parts for a fast carrier
 * CARRY x 5, MOVE x5, consumes 500 energy units, moves 250 energy / tick
 */
module.exports.body_parts = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];

/**
 * Finds a new target each time it finishes filling in
 *
 * @type boolean
 */
module.exports.find_next_target = true;

/**
 * Its role : specialized in energy transportation
 */
module.exports.role = 'carrier';

/**
 * The carrier source work is to pickup the dropped energy
 *
 * @param creep  Creep
 * @param source energy
 */
module.exports.sourceJob = function(creep, source)
{
	return creep.pickup(source);
};

/**
 * The carrier source is the nearest dropped energy
 *
 * @param creep Creep optional
 */
module.exports.sources = function(creep)
{
	var position = creep ? creep.pos : Game.spawns.Spawn.pos;
	var source = position.findClosestByRange(FIND_DROPPED_ENERGY);
	return (source ? [source] : []);
};

/**
 * The targets are :
 * - the simple harvesters targets (extensions, then spawn), that need energy)
 * - upgraders
 *
 * @param [creep] Creep
 * @returns Creep[]|StructureExtension[]|StructureSpawn[]|StructureTower[]
 */
module.exports.targets = function(creep)
{
	// priority to harvester's target : extensions, then spawn, that need energy
	targets = this.__proto__.targets(creep);
	if (targets.length) {
		return targets;
	}
	// next target : towers
	var targets = _.filter(Game.structures, structure => structure.structureType == STRUCTURE_TOWER);
	if (targets.length) {
		return targets;
	}
	// next target : builders
	var room = creep ? creep.room : Game.spawns.Spawn.room;
	targets = room.find(FIND_MY_CREEPS, { filter: creep =>
		(creep.memory.role == 'builder') && (creep.carry.energy < creep.carryCapacity)
	});
	// next target : the upgrader
	if (!targets.length) {
		targets = room.find(FIND_MY_CREEPS, { filter: creep =>
			(creep.memory.role == 'upgrader') && (creep.carry.energy < creep.carryCapacity)
		});
	}
	// the creep that have the less energy first
	targets.sort(function(creep1, creep2) {
		var fill1 = creep1.carry.energy / creep1.carryCapacity;
		var fill2 = creep2.carry.energy / creep2.carryCapacity;
		if (fill1 < fill2) return -1;
		if (fill1 > fill2) return 1;
		return 0;
	});
	return targets;
};
