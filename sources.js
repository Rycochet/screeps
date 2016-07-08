var Source = require('source');

module.exports =
{

	/**
	 * @return string the id of the first source with at least one available access terrain
	 */
	availableSourceId: function()
	{
		for (var source_id in Memory.sources) {
			source = Memory.sources[source_id];
			for (var terrain in source.terrains) {
				terrain = source.terrains[terrain];
				if (!terrain.creep) {
					return source_id;
				}
			}
		}
		return null;
	},

	/**
	 * @return integer The number of available terrains
	 */
	availableTerrainsCount: function()
	{
		var available_terrains_count = 0;
		for (var source in Memory.sources) {
			source = Memory.sources[source];
			available_terrains_count += source.availableTerrainsCount();
		}
	  return available_terrains_count;
	},

	/**
	 * List all available sources
	 * List all accessible points to these sources (capacity)
	 * Affect existing creeps to their source access terrain
	 *
	 * @param force boolean if set to true, refresh existing sources memory
	 */
	memorize: function(force)
	{
		if (force || !Memory.sources) {
			// reset memory sources
			Memory.sources = {};
			for (var room_key in Game.rooms) {
				Game.rooms[room_key].find(FIND_SOURCES_ACTIVE).forEach(function (source) {
					Memory.sources[source.id] = new Source(source);
				});
			}
			// affects creeps
			for (var creep_name in Game.creeps) {
				var creep = Game.creeps[creep_name];
				if (Memory.sources[creep.source]) {
					Memory.sources[creep.source].affect(creep);
				}
			}
		}
	}

};
