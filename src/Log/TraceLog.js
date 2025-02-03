import { formatDateToString } from "../Date/FormatDates.js";

/**
 * The Trace Log class is used to record a trace of logs in a desired sequence
 */
export class TraceLog {

    /**
     * @type {LogType[]}
     */
    #logs = []

    #incrementId = 0;
    #incrementTypeId = 0;

    constructor() {
        return this;
    }

    /**
     * Adds a new log type for organization
     ** If one with the name already exists, it will only be returned
     * @param {String} type - The name to give to the log
     */
    addType(type) {
        let logType = this.#logs.find(logType => logType.getType() == type);

        if (logType == undefined) {

            this.#incrementId++;
            logType = new LogType(this, type, this.#incrementId);

            this.#logs.push(logType);;
        }

        return logType;
    }

    /**
     * Appends the logs of another TraceLog
     * @param {TraceLog} tracelogInst - TraceLog class
     */
    appendTraceLog(tracelogInst) {
        if (!(tracelogInst instanceof TraceLog)) {
            throw new Error('The parameter passed is not an instance of TraceLog');
        }

        /**
         * @typedef LogMessageOrganize
         * @property {LogMessageType} message - Log message
         * @property {LogType} type - Log type that this message belongs to
         * @property {Number} newSequenceId - Sequence in which the message will be added
         */

        /**
         * Stores all messages from the previous tracer in the sequence they were added regardless of the log type
         * @type {LogMessageOrganize[]}
         */
        let messagesInOrderFromTracer = [];

        for (const messageType of tracelogInst.getLogs()) {
            for (const message of messageType.getMessages()) {
                messagesInOrderFromTracer.push({
                    message: message,
                    type: messageType
                });
            }
        }

        // Sort the messages in the order they were added
        messagesInOrderFromTracer.sort((a, b) => a.message.sequence - b.message.sequence);

        // Now go through each one and add it to its respective log type with a new numbering respecting its previous order
        for (const logMessage of messagesInOrderFromTracer) {

            let belongingLogType = this.#logs.find(logType => logType.getType() == logMessage.type.getType());

            // If the log type does not exist, add it
            if (belongingLogType == undefined) {

                belongingLogType = this.addType(logMessage.type.getType());
                logMessage.newSequenceId = belongingLogType.getSequenceID();
            }

            // Add the message to the log type
            belongingLogType.add(logMessage.message.message, logMessage.message.date);
        }

        return this;
    }

    /**
     * Returns the stored log types
     */
    getLogs() {
        return this.#logs;
    }

    /**
     * Returns all saved messages
     * @param {Boolean} isAscending - Whether to return in ascending order (by default returns descending if the parameter is not provided)
     */
    getOrderedHistory(isAscending) {
        let orderedMessages = [];

        for (const logType of this.#logs) {
            let isSearchingSequence = true
            let currentSeqIndex = logType.getSequenceID();
            let logTypeSequences = []

            while (isSearchingSequence) {

                // Find the sequence of this log type, for example if there are 3 logs in the sequence [Generator], [Test1] [Test2] and this message is from Test2, the sequence should return [Generator], [Test1]
                let existsPreviousSeq = this.#logs.find(logPrev => logPrev.getSequenceID() == (currentSeqIndex - 1))

                // If there is a previous sequence to this one, save it
                if (existsPreviousSeq) {
                    logTypeSequences.push(existsPreviousSeq.getType());
                    currentSeqIndex--;
                } else {
                    // Reached the last one
                    isSearchingSequence = false;
                }
            }

            logTypeSequences.reverse();

            for (const message of logType.getMessages()) {
                orderedMessages.push({
                    sequenceId: message.sequence,
                    logTypeSequence: logTypeSequences,
                    logType: logType.getType(),
                    date: message.date,
                    message: message.message
                });
            }
        }

        return orderedMessages.sort((a, b) => {
            if (isAscending) {
                return a.sequenceId - b.sequenceId;
            } else {
                return b.sequenceId - a.sequenceId;
            }
        }).map(message => {

            let logMsg = `${formatDateToString(message.date, '%day%/%month%/%year% %hour%:%minute%:%second%:%millis%')}`;

            let previousLogTypeSequences = message.logTypeSequence.concat();

            previousLogTypeSequences.push(message.logType);

            if (previousLogTypeSequences.length != 0) {

                logMsg += ` [`;
                let isFirst = true;
                for (const previousType of previousLogTypeSequences) {

                    if (!isFirst) {
                        logMsg += `>`;
                    }

                    logMsg += `${previousType}`;
                    isFirst = false;
                }
                logMsg += `]`;
            }

            logMsg += `: ${message.message}`;
            return logMsg;
        });
    }

    /**
     * Returns the new incremental ID of the next message(independent of the Type Log)
     */
    _getNextMessageID() {
        this.#incrementTypeId++;
        return this.#incrementTypeId;
    }
}

/**
 * @typedef LogMessageType
 * @property {String} message - Log message
 * @property {Date} date - Date the message was added
 * @property {Number} sequence - Unique sequence in which the message was added
 */

class LogType {

    /**
     * @type {TraceLog}
     */
    #traceInstance;

    /**
     * Log type
     */
    #type;

    /**
     * @type {LogMessageType[]}
     */
    #messages = []

    #sequenceAdded = -1;

    constructor(tracer, type, idSequence) {
        this.#traceInstance = tracer;
        this.#type = type;
        this.#sequenceAdded = idSequence;
    }

    /**
     * Returns the sequence ID in which this log was added
     */
    getSequenceID() {
        return this.#sequenceAdded;
    }

    /**
     * Name of this log type
     */
    getType() {
        return this.#type;
    }

    /**
     * Adds a log message to the trace
     * @param {String} msg - Message to add
     * @param {Date} date - Date the message was added (optional) 
     */
    add(msg, date) {
        let messageContent = '';
        if (typeof msg == 'object') {
            messageContent = JSON.stringify(msg);
        } else {
            messageContent = msg;
        }

        this.#messages.push({
            date: date != undefined && date instanceof Date ? date : new Date(),
            sequence: this.#traceInstance._getNextMessageID(),
            message: messageContent,
        })

        return this;
    }

    /**
     * Returns the log messages
     */
    getMessages() {
        return this.#messages;
    }
}