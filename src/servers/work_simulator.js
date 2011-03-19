
/**
 *  "allocations": [
        { "sizeBytes": 256, "lifetimeTicks": 0, "perTick": 1, "number": 10 },
        { "sizeBytes": 1024, "lifetimeTicks": 10, "perTick": 10, "number": 2 },
        { "sizeBytes": 1048576, "lifetimeTicks": 100, "perTick": 100, "number": 1 }
    ],
    "loops": [
        { "iterations": 1000, "perTick": 1 }
    ]
    
 * @param allocations
 * @param loops
 * @returns
 */
var createWorkSimulator = function(logger, config) {
    // private methods and variables
    
    var tick = 0;   // logical time.   incremented each request
    var allocations = config.allocations;
    var loops = config.loops;
    var allocationsMap = {};  // maps expiration tick to arrays of allocations
    
    // public methods

    return {
        processTick : function() {
            // Do all allocations for this tick
            
            for (var i = 0; i < allocations.length; ++i) {
                if (0 != (tick % allocations[i].perTick)) {
                    continue;
                }
                
                var numAllocations = allocations[i].number;                
                var expirationTick = tick + allocations[i].lifetimeTicks;
                var sizeBytes = allocations[i].sizeBytes;
                var allocationArray = allocationsMap[expirationTick];
                
                if (!allocationArray) {
                    allocationArray = [];
                    allocationsMap[expirationTick] = allocationArray;
                }

                for (var j = 0; j < numAllocations; ++j) {
                    allocationArray[allocationArray.length] = new Buffer(sizeBytes);
                }
                
                if (logger.isTraceEnabled()) {
                    logger.trace('Allocated', numAllocations, 'of size', sizeBytes, 'at tick', tick);
                }
            }
            
            // Use the cpu for a bit
            
            for (var i = 0; i < loops.length; ++i) {
                if (0 != (tick % loops[i].perTick)) {
                    continue;
                }
                
                var x = 0;
                
                for (var j = 0; j < loops[i].iterations; ++j) {
                    x += j;
                }
            }
            
            // Delete all allocations expiring this tick - allocations with lifetimeTicks of 0 were
            // just allocated.
            
            var expiringAllocations = allocationsMap[tick];
            
            if (expiringAllocations) {
                if (logger.isTraceEnabled()) {
                    logger.trace('Deleted', expiringAllocations.length, 'allocations at tick', tick);
                }
          
                allocationsMap[tick] = undefined;
            }
            
            // Now advance the tick
            
            ++tick;
        }
    };
};

module.exports.createWorkSimulator = createWorkSimulator;
