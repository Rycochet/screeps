var getRoute = require('my.route');

module.exports =
{

	/**
	 * @param creep Creep
	 * @param reset_target boolean
	 **/
	fill: function(creep, reset_target)
	{
		if (!this.full(creep, reset_target)) {
			var source = Game.getObjectById(creep.memory.source);
			if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
				creep.moveTo(source);
				//getRoute(creep, source);
			}
			return true;
		}
		return false;
	},

	/**
	 * @param creep Creep
	 * @param reset_target boolean
	 */
	full: function(creep, reset_target)
	{
		if (creep.memory.full) {
			if (creep.carry.energy == 0) {
				creep.memory.full = false;
				if (reset_target) {
					creep.memory.target = 0;
				}
			}
		}
		else if (creep.carry.energy == creep.carryCapacity) {
			creep.memory.full = true;
		}
		return creep.memory.full;
	}

};
