/**
 * The creep library : how to manage creeps with basic features that you can override
 */

var basic_work = require('./work.basic');
var body       = require('./body');
var messages   = require('./messages');
var names      = require('./names');
var objects    = require('./objects');
var path       = require('./path');
var rooms      = require('./rooms');
var rooms_work = require('./work.rooms');
var sources    = require('./sources');

/**
 * Use sources() / targets() to find its initial source / target
 *
 * @type string
 */
module.exports.AUTO = 'AUTO';

/**
 * @type boolean
 */
module.exports.DEBUG = false;

/**
 * This value for spawn() enables the automatic available source terrain finder
 *
 * @type string
 */
module.exports.ENERGY = 'ENERGY';

/**
 * This is returned by targetWork() when job is done
 *
 * @type string
 */
module.exports.JOB_DONE = 'JOB_DONE';

/**
 * @type number
 */
module.exports.NO_SOURCE = 1;

/**
 * @type number
 */
module.exports.NO_TARGET = 2;

/**
 * @type number
 */
module.exports.SOURCE_WORK_OFF = 3;

/**
 * @type number
 */
module.exports.TARGET_WORK_OFF = 4;

/**
 * @type number
 */
module.exports.WAIT = 5;

/**
 * Body parts for a starter creep
 * CARRY, MOVE, WORK
 * - consume 200 energy units
 * - harvests 2 energy units per tick
 * - carrie 25 energy units per tick
 *
 * @type string[]
 */
module.exports.body_parts = [CARRY, MOVE, WORK];

/**
 * When true, find a new target each time the creep finishes filling in
 *
 * @type boolean
 */
module.exports.find_next_target = false;

/**
 * The default role when this creep is spawned
 *
 * @type string
 */
module.exports.role = 'creep';

/**
 * @type boolean If true, do not find another source when source job is done
 */
module.exports.single_source = false;

/**
 * @type boolean If true, do not find another target when target job is done
 */
module.exports.single_target = false;

/**
 * If false, disable source work :
 * sourceJobDone always returns true, targetJobDone always returns false, sources always returns []
 *
 * @type boolean
 */
module.exports.source_work = true;

/**
 * If false, disable target work :
 * sourceJobDone always returns false, targetJobDone always returns true, targets always returns []
 *
 * @type boolean
 */
module.exports.target_work = true;

/**
 * Returns true if the creep can continue its source work, without any consideration about its source state
 *
 * Default behaviour : the creep is not full of energy
 *
 * @param creep
 */
module.exports.canWorkSource = function(creep)
{
	return !objects.energyFull(creep);
};

/**
 * Returns true if the creep can continue its target work, without any consideration about its target state
 *
 * Default behaviour : the creep has energy
 *
 * @param creep
 */
module.exports.canWorkTarget = function(creep)
{
	return objects.energy(creep) > 0;
};

/**
 * Set the source of the creep and return the source.
 * If no available source, delete the source from memory and returns null.
 *
 * @param context RoomObject
 * @return object source
 */
module.exports.findSource = function(context)
{
	if (context instanceof Creep) context.say('source');
	var sources = this.sources(context);
	if (sources.length) {
		var source = sources[0];
		if (context instanceof Creep) context.memory.source = source.id;
		return source;
	}
	if (context instanceof Creep) delete context.memory.source;
	return null;
};

/**
 * Set the source of the creep and returns the source id.
 * If no available source, delete the source from memory and returns null.
 *
 * @param creep Creep
 * @return string
 */
module.exports.findSourceId = function(creep)
{
	var source = this.findSource(creep);
	return source ? source.id : null;
};

/**
 * Set the target of the creep and returns the target.
 * If no available target, delete the target from memory and return null.
 *
 * @param context RoomObject
 * @return object target
 */
module.exports.findTarget = function(context)
{
	if (context instanceof Creep) context.say('source');
	var targets = this.targets(context);
	if (targets.length) {
		var target = targets[0];
		if (context instanceof Creep) context.memory.target = target.id;
		return target;
	}
	if (context instanceof Creep) delete context.memory.target;
	return null;
};

/**
 * Set the target of the creep and returns the target id.
 * If no available target, delete the target from memory and return null.
 *
 * @param creep Creep
 * @return string
 */
module.exports.findTargetId = function(creep)
{
	var target = this.findTarget(creep);
	return target ? target.id : null;
};

/**
 * Returns true if creep has only one source
 *
 * @param creep
 * @returns boolean
 */
module.exports.singleSource = function(creep)
{
	return (creep.memory['single_source'] !== undefined) ? creep.memory.single_source : this.single_source;
};

/**
 * Returns true if creep has only one target
 *
 * @param creep
 * @returns boolean
 */
module.exports.singleTarget = function(creep)
{
	return (creep.memory['single_target'] !== undefined) ? creep.memory.single_target : this.single_target;
};

/**
 * Gets the creep source ready for work
 * - if the current one still exists and source job is not done, returns it
 * - if find next source, returns it
 * - if the current one does not exist anymore and no other source was found, returns null
 *
 * @param creep Creep
 * @returns RoomObject|null
 */
module.exports.source = function(creep)
{
	let source = objects.get(creep, creep.memory.source);
	if (!source || this.sourceJobDone(creep)) source = this.singleSource(creep) ? null : this.findSource(creep);
	return source;
};

/**
 * Count number of creeps into the source
 * If context is a creep, don't count this creep as creeps affected to the source
 *
 * @param source    RoomObject
 * @param [context] RoomObject If is a creep, does not count this creep
 * @returns number
 */
module.exports.sourceCount = function(source, context)
{
	var count = 0;
	for (let creep_name in Memory.creeps) if (Memory.creeps.hasOwnProperty(creep_name)) {
		let creep = Memory.creeps[creep_name];
		if ((creep.source == source.id) && (!context || !context.name || (context.name != creep_name))) {
			count ++;
		}
	}
	return count;
};

/**
 * The work the creep must do at its source
 * Or how it gets its energy from source
 *
 * @param creep  Creep
 * @return number 0 if no error, error code if error during the job
 */
module.exports.sourceJob = function(creep)
{
	let source = objects.get(creep, creep.memory.source);
	if (this.DEBUG) console.log('s: source =', source);
	let result = objects.getEnergy(creep, source);
	if (this.DEBUG) console.log('s: result =', messages.error(result));
	return result;
};

/**
 * Return true if the creep is full of energy
 * Store the full information into its memory
 *
 * @param creep Creep
 * @return boolean
 */
module.exports.sourceJobDone = function(creep)
{
	let source = objects.get(creep, creep.memory.source);
	if (this.DEBUG) console.log('s: source =', source);
	let result = !objects.energy(source);
	if (this.DEBUG) console.log(
		result ? 's: source job done (source energy empty)' : 's: source job continue (need more energy)'
	);
	return result;
};

/**
 * A simple sources selector :
 * Default is energy sources : dropped energy, and if not container / storage energy
 *
 * @param context RoomObject
 * @return string[] Sources id
 */
module.exports.sources = function(context)
{
	if (!this.source_work) return [];
	var source = context.pos.findClosestByRange(FIND_DROPPED_ENERGY);
	if (!source) source = context.pos.findClosestByRange(FIND_STRUCTURES, { filter: structure =>
		(structure.structureType == STRUCTURE_CONTAINER) || (structure.structureType == STRUCTURE_STORAGE)
	});
	if (!source) source = context.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
	return source ? [source] : [];
};

/**
 * The common source work algorithm
 *
 * @param creep Creep
 * @returns number OK if worked well, else an ERR_ constant
 */
module.exports.sourceWork = function(creep)
{
	if (!this.source_work) {
		creep.memory.step = 'goToTarget';
		return this.SOURCE_WORK_OFF;
	}

	if (!this.canWorkSource(creep)) {
		if (this.target_work && this.canWorkTarget(creep) && this.target(creep)) {
			creep.memory.step = 'goToTarget';
			return OK;
		}
		return this.WAIT;
	}

	if (!this.source(creep)) {
		if (this.target_work && this.canWorkTarget(creep) && this.target(creep)) creep.memory.step = 'goToTarget';
		return this.NO_SOURCE;
	}

	return this.sourceJob(creep);
};

/**
 * Spawn a creep, giving it a role, source and target (optionals)
 *
 * @param [options] {{ target: RoomObject|RoomPosition|string, source: RoomObject|RoomPosition|string, role: string,
 *                     name: string }}
 * @return Creep|null
 */
module.exports.spawn = function(options)
{
	if (!options) options = {};
	// spawn
	if (!options.spawn && options.source) options.spawn = rooms.get(rooms.nameOf(options.source), 'spawn');
	if (!options.spawn && options.target) options.spawn = rooms.get(rooms.nameOf(options.target), 'spawn');
	// body parts
	var body_parts = this.body_parts;
	if (options.accept_little && options.spawn.canCreateCreep(body_parts)) {
		body_parts = body.parts(body_parts, options.spawn.room.energyAvailable);
	}
	// create creep
	if (body_parts && !options.spawn.canCreateCreep(body_parts)) {
		if (!options.name)   options.name   = names.chooseName();
		if (!options.role)   options.role   = this.role;
		if (!options.source) options.source = this.findSource(options.spawn);
		if (!options.target) options.target = this.findTarget(options.spawn);
		// source / target id
		if (options.source && (options.source instanceof RoomObject)) options.source = options.source.id;
		if (options.target && (options.target instanceof RoomObject)) options.target = options.target.id;
		// prepare creep memory
		var memory = { role: options.role };
		if (options.source) memory.source = options.source;
		if (options.target) memory.target = options.target;
		// spawn a new creep
		var creep_name = options.spawn.createCreep(body_parts, options.name, memory);
		console.log('spawns ' + options.role + ' ' + creep_name);
		return Game.creeps[creep_name];
	}
	return null;
};

/**
 * Gets the creep target ready for work
 * - if the current one still exists and target job is not done, returns it
 * - if find next target, returns it
 * - if the current one does not exist anymore and no other target was found, returns null
 *
 * @param creep Creep
 * @returns RoomObject|null
 */
module.exports.target = function(creep)
{
	let target = objects.get(creep, creep.memory.target);
	if (!target || this.targetJobDone(creep)) target = this.singleTarget(creep) ? null : this.findTarget(creep);
	return target;
};

/**
 * Count number of creeps into the target
 * If context is a creep, don't count this creep as creeps affected to the target
 *
 * @param target    RoomObject
 * @param [context] RoomObject If is a creep, does not count this creep
 * @returns number
 */
module.exports.targetCount = function(target, context)
{
	var count = 0;
	for (let creep_name in Memory.creeps) if (Memory.creeps.hasOwnProperty(creep_name)) {
		let creep = Memory.creeps[creep_name];
		if ((creep.target == target.id) && (!context || !context.name || (context.name != creep_name))) {
			count ++;
		}
	}
	return count;
};


/**
 * The work the creep must do at its target
 * The default is to transfer its energy to the target
 *
 * @param creep Creep
 * @return number
 */
module.exports.targetJob = function(creep)
{
	let target = objects.get(creep, creep.memory.target);
	if (this.DEBUG) console.log('t: target =', target);
	let result = objects.putEnergy(creep, target);
	if (this.DEBUG) console.log('t: result =', messages.error(result));
	return result;
};

/**
 * Job is done when the target is filled with energy
 *
 * @param creep Creep
 * @return boolean
 */
module.exports.targetJobDone = function(creep)
{
	let target = objects.get(creep, creep.memory.target);
	if (this.DEBUG) console.log('t: target =', target);
	let result = objects.energyFull(target);
	if (this.DEBUG) console.log(
		result ? 't: target job done (target energy full)' : 't: target job continue (target energy not full)'
	);
	return result;
};

/**
 * Find an available target for the harvester : the first not filled-in spawn
 *
 * @param context RoomObject
 * @return StructureSpawn[]
 **/
module.exports.targets = function(context)
{
	if (!this.target_work) return [];
	// the nearest extension without energy into the current room
	let target = context.pos.findClosestByRange(FIND_STRUCTURES, { filter: structure =>
	(structure.structureType == STRUCTURE_EXTENSION) && !objects.energyFull(structure)
	});
	if (target) return [target];
	// the nearest spawn without energy into the current room
	target = context.pos.findClosestByRange(FIND_STRUCTURES, { filter: structure =>
	(structure.structureType == STRUCTURE_SPAWN) && !objects.energyFull(structure)
	});
	if (target) return [target];
	// the nearest container or storage
	target = context.pos.findClosestByRange(FIND_STRUCTURES, { filter: structure =>
	((structure.structureType == STRUCTURE_CONTAINER) || (structure.structureType == STRUCTURE_STORAGE))
	&& !objects.energyFull(structure)

	});
	return target ? [target] : [];
};

/**
 * The common target work algorithm
 *
 * @param creep Creep
 * @returns number OK if worked well, else an ERR_ constant
 */
module.exports.targetWork = function(creep)
{
	if (!this.target_work) {
		creep.memory.step = 'goToSource';
		return this.TARGET_WORK_OFF;
	}

	if (!this.canWorkTarget(creep)) {
		if (this.source_work && this.canWorkSource(creep) && this.source(creep)) {
			creep.memory.step = 'goToSource';
			return OK;
		}
		return this.WAIT;
	}

	if (!this.target(creep)) {
		if (this.source_work && this.canWorkSource(creep) && this.source(creep)) creep.memory.step = 'goToSource';
		return this.NO_TARGET;
	}

	return this.targetJob(creep);
};

/**
 * Let's work ! work depends on creep role and work mode
 *
 * @param creep Creep
 **/
module.exports.work = function(creep)
{
	if (this.DEBUG) {
		console.log(
			'WORK',
			creep.name,
			creep.memory.role,
			creep.memory.room_role ? creep.memory.room_role : 'basic',
			creep.memory.step ? creep.memory.step : 'no-step'
		);
		console.log('w: single source =', this.singleSource(creep), ', single target =', this.singleTarget(creep));
		console.log('w: source work =',   this.source_work, ', target work =', this.target_work);
	}
	if (creep.memory.room_role) rooms_work.work(this, creep);
	else                        basic_work.work(this, creep);
};
