/**
 * @typedef ListenerActions
 * @property {Function} remove - Call this function to remove the registered callback
 * @property {String} eventName - Name of the event where the callback was registered
 * @property {Number} executionId - ID of the registered callback. Used to request removal
 */

/**
 * Callback execution settings
 * @typedef ExecutionParameters
 * @property {Boolean} removeAfterExecute - If true, the execution will be removed after being executed
 * @property {EventExpiration} expireAfterMs - If the callback is not called after the defined milliseconds, the callback is automatically removed
 * @property {Boolean} onlyOneInstance - If true, the callback will only be executed if it is not currently being executed
 */

/**
 * Expiration behavior after milliseconds
 * @typedef EventExpiration
 * @property {Number} expireAfterMs - If the callback is not called after the defined milliseconds, the callback is automatically removed
 * @property {Function} callback - Callback to invoke when the function is canceled due to expiration
 */

/**
 * Returns a promise that waits x milliseconds to resolve
 * @param {Number} ms - Time in milliseconds to wait
 * @returns 
 */
export async function pause(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

/**
 * Instance of a new event manager
 */
export class EventEmitter {

    /**
     * Name that identifies this event emitter
     */
    nameId = ''

    /**
     * List of existing events
     * @type {Event[]}
     */
    events = []

    /**
     * Incremental ID for each added event
     */
    eventIds = 0;


    /**
     * Instantiate a new event manager
     * @param {String} name - A name(optional) that identifies this instance
     */
    constructor(name) {
        if (name == undefined) {
            this.nameId = `EventEmitter-${Math.random().toString(36).substring(7)}`;
        } else {
            this.nameId = name;
        }
    }

    /**
     * Add a callback to be executed when the specified event is triggered
     * @param {String} eventName - Name of the event to trigger. Ex: 'newData'
     * @param {Function} callback - Function to be executed when the event is triggered
     * @param {ExecutionParameters} parameters - Additional parameters for the callback execution
     * @returns {ListenerActions} - Returns an object with functions to interact with the added callback
     */
    addEvent(eventName, callback, parameters) {
        let event = this.events.find((e) => e.getEventName() == eventName);

        if (event == undefined) {
            event = new Event(this, eventName, this.eventIds++);
            this.eventIds++;
            this.events.push(event);
        }

        let newExecutionId = event.addExecution(callback, parameters);

        /**
         * @type {ListenerActions}
         */
        const callbackInteractions = {
            remove: () => {
                this.removeExecution(eventName, newExecutionId);
            },
            executionId: newExecutionId,
            eventName: event.getEventName()
        }

        return callbackInteractions;
    }

    /**
     * Emit an event
     * @param {String} eventName - Name of the event to be triggered
     * @param  {...any} args - Arguments to be passed to the callback execution
     */
    emitEvent(eventName, ...args) {
        let event = this.events.find((e) => e.getEventName() == eventName);

        if (event == undefined) {
            return;
        }

        // Execute event
        event.execute(...args);
    }

    /**
     * Remove all callbacks from an event
     * @param {String} eventName - Name of the event to remove along with its callbacks
     */
    removeEvent(eventName) {
        const totalEvents = this.events.length;
        this.events = this.events.filter((event) => event.getEventName() != eventName);
    }

    /**
     * Remove a callback from an event
     * @param {String} eventName - Name of the event where the callback is located
     * @param {String} executionId - ID of the execution to be removed
     */
    removeExecution(eventName, executionId) {
        let event = this.events.find((e) => e.getEventName() == eventName);

        if (event == undefined) {
            return;
        }

        event.removeExecution(executionId);

        // If there are no callbacks, remove the event altogether
        if (event.getTotalExecutions() == 0) {
            this.events = this.events.filter((e) => e.getEventName() != eventName);
        }
    }

    /**
     * Remove all registered events
     */
    removeAllEvents() {
        this.events = [];
    }
}

/**
 * An event containing its executions
 */
class Event {
    /**
     * Instance of the emitter to which this event belongs
     */
    emitterInstance;

    /**
     * Name of the trigger event
     */
    eventName = ''

    /**
     * ID number of the registered event. Used to identify the event
     */
    eventId = -1;

    /**
     * Callback executions
     * @type {Execution[]}
     */
    executions = []

    /**
     * Incremental ID for each added execution
     */
    executionCounter = 0;

    /**
     * Instantiate a new trigger event
     * @param {EventEmitter} emitter - Instance of the emitter to which this event belongs
     * @param {String} eventName - Name of the event to be triggered
     */
    constructor(emitter, eventName, eventId) {
        this.emitterInstance = emitter;
        this.eventName = eventName;
        this.eventId = eventId;
    }

    /**
     * Add a new execution to this event
     * @param {Function} callbackFunction - Function to be executed when the event is triggered
     * @param {ExecutionParameters} parameters - Additional parameters for the callback execution
     * @returns {Number} - Unique ID of the added execution
     */
    addExecution(callbackFunction, parameters) {
        const newExecution = new Execution(this, this.executionCounter, callbackFunction, parameters);
        this.executions.push(newExecution);

        this.executionCounter++;

        return newExecution.getID();
    }

    /**
     * Execute this event, triggering all executions
     */
    execute(...args) {
        this.executions.forEach((execution) => {
            execution.execute(...args);
        });
    }

    /**
     * Remove an execution from this event
     * @param {Number} id - ID of the execution to be removed 
     */
    removeExecution(id) {
        const total = this.executions.length;
        this.executions = this.executions.filter((execution) => execution.getID() != id);
    }

    /**
     * Returns the configured event name
     */
    getEventName() {
        return this.eventName;
    }

    /**
     * Unique event ID
     */
    getID() {
        return this.eventId;
    }

    /**
     * Returns the total number of callbacks registered for this event
     */
    getTotalExecutions() {
        return this.executions.length;
    }
}

/**
 * An execution of a callback defined by a user
 */
class Execution {

    /**
     * Instance of the event to which this execution belongs
     */
    eventInstance;

    /**
     * An ID to identify this execution
     */
    executionId = -1;

    /**
     * Configuration parameters for this callback
     */
    parameters = {
        /**
         * Expiration settings
         */
        expirationCallback: {
            /**
             * If the callback expiration is defined
             */
            enabled: false,
            /**
             * Time in milliseconds to expire
             */
            timeMs: -1,
            /**
             * Callback to execute after expiration
             */
            callback: () => { }
        },
        /**
         * If the callback should be removed after being executed
         */
        removeAfterExecute: false,
        /**
         * If the callback should not be executed again while it is already being executed
         */
        onlyOneExecutionAtATime: false,
    }

    /**
     * State of this execution
     */
    state = {
        /**
         * If this event is being executed
         */
        isExecuting: false,
        /**
         * If this callback has been executed at least once
         */
        hasExecuted: false,
        /**
         * setTimeout that expires the callback execution
         */
        expirationTimeout: -1,
    }

    /**
     * Function to be executed when the event is triggered
     */
    callbackFunction = () => { }

    /**
     * Instantiate a new execution of a callback
     * @param {Event} event - Instance of the event to which this execution belongs
     * @param {Number} id - Unique ID of the execution
     * @param {ExecutionParameters} parameters - Additional parameters for the callback execution
     * @param {Function} callback 
     */
    constructor(event, id, callback, parameters) {
        this.eventInstance = event;
        this.executionId = id;
        this.callbackFunction = callback;

        if (parameters != undefined) {

            // Execute only once
            if (parameters.removeAfterExecute != undefined) {
                this.parameters.removeAfterExecute = parameters.removeAfterExecute;
            }

            // Expire after a time
            if (parameters.expireAfterMs != undefined) {
                this.parameters.expirationCallback.enabled = true;
                this.parameters.expirationCallback.timeMs = parameters.expireAfterMs.expireAfterMs;
                this.parameters.expirationCallback.callback = parameters.expireAfterMs.callback;
                this.activateAutomaticCancellation();
            }

            // Prevent execution if already executing
            if (parameters.onlyOneInstance != undefined) {
                this.parameters.onlyOneExecutionAtATime = parameters.onlyOneInstance;
            }
        }
    }

    /**
     * Activate the setTimeout that cancels
     */
    activateAutomaticCancellation() {
        this.state.expirationTimeout = setTimeout(() => {
            this.parameters.expirationCallback.callback();
            this.cancel();
        }, this.parameters.expirationCallback.timeMs);
    }

    /**
     * Cancel the expiration timeout
     */
    stopAutomaticCancellation() {
        if (this.state.expirationTimeout == -1) return;
        clearTimeout(this.state.expirationTimeout);
    }

    /**
     * Unique execution ID
     */
    getID() {
        return this.executionId;
    }

    /**
     * Remove this callback from the event's list
     */
    cancel() {
        this.stopAutomaticCancellation();
        this.eventInstance.removeExecution(this.executionId);
    }

    /**
     * Execute callback function
     */
    async execute(...args) {
        this.stopAutomaticCancellation();

        if (this.state.isExecuting && this.parameters.onlyOneExecutionAtATime) {
            return;
        }

        // Set as executing
        this.state.isExecuting = true;

        // Call the callback function
        try {
            await this.callbackFunction(...args);
        } catch (ex) {
        }

        // Set as not executing and has executed
        this.state.isExecuting = false;
        this.state.hasExecuted = true;

        // If it should be removed after execution
        if (this.parameters.removeAfterExecute) {
            this.cancel();
        }
    }

    /**
     * If this execution is being executed
     */
    isExecuting() {
        return this.state.isExecuting;
    }
}