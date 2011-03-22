var createWorkSimulator = function(logger, config) {
    // private methods and variables
    
    var tick = 0;   // logical time.   incremented each request
    var allocationsMap = {};  // maps expiration tick to arrays of allocations
    
    var matrix = [];    // populate a matrix we'll transpose to simulate cpu work
    
    for (var i = 0; i < config.compute.transpose.matrixSize; ++i) {
        matrix[i] = [];
        
        for (var j = 0; j < config.compute.transpose.matrixSize; ++j) {
            matrix[i][j] = i + j;
        }
    }
    
    // public methods

    return {
        processTick : function() {
            // Do all allocations for this tick
            
            for (var i = 0; i < config.allocations.length; ++i) {
                if (0 != (tick % config.allocations[i].perTick)) {
                    continue;
                }
                
                var numAllocations = config.allocations[i].number;                
                var expirationTick = tick + config.allocations[i].lifetimeTicks;
                var sizeBytes = config.allocations[i].sizeBytes;
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
            
            for (var i = 0; i < config.compute.transpose.iterations; ++i) {
                for (var j = 0; j < config.compute.transpose.matrixSize; ++j) {
                    for (var k = 0; k < config.compute.transpose.matrixSize; ++k) {
                        matrix[i][j] = matrix[j][i];
                    }
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
