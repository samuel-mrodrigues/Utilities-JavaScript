import path from "path";
import fs from "fs";

export class Logger {
    #name;
    #logDirectory;
    #parentLogger;
    #enableFileLogging = true;
    #enableConsoleLogging = true;

    /**
     * Instantiate a Logger
     * @param {String} name - Name for log recognition and file name generation
     * @param {Object} params - Additional parameters for console display
     * @param {Boolean} params.shouldWriteToFile - If by default it should write to the log file
     * @param {Boolean} params.shouldShowInConsole - If by default it should show the log message in the console
     * @param {String} params.logDirectoryPath - The root path where logs will be saved (C://Windows/Users/Logs...).
     * @param {Logger} params.parentLogger - Sets the parent logger of this new logger, using its logger settings.
     */
    constructor(name, params) {
        this.#name = name;

        if (params != undefined) {
            if (params.shouldWriteToFile != undefined) this.#enableFileLogging = params.shouldWriteToFile;
            if (params.shouldShowInConsole != undefined) this.#enableConsoleLogging = params.shouldShowInConsole;
            if (params.logDirectoryPath != undefined && params.logDirectoryPath != '') {
                this.#logDirectory = params.logDirectoryPath;

                if (this.#logDirectory[0] == './') this.#logDirectory.substring(2, this.#logDirectory.length - 1);
            } else {
                this.#logDirectory = '';
            }

            if (params.parentLogger != undefined) this.#parentLogger = params.parentLogger;
        }
        return this;
    }

    /**
     * Log a message to the console
     * @param {String} msg - Message to display in the console
     * @param {Object} params - Additional parameters for console display
     * @param {Boolean} params.writeToFile - If it should also write to the log file
     * @param {Boolean} params.showInConsole - If it should show the log message in the console
     */
    log(msg, params) {
        let definedParams = {
            shouldWriteToFile: false,
            shouldShowInConsole: false
        };

        if (params != undefined) {
            definedParams.shouldWriteToFile = params.writeToFile;
            definedParams.shouldShowInConsole = params.showInConsole;
        }

        let messageContent = '';
        if (typeof msg == 'object') {
            try {
                messageContent = JSON.stringify(msg, null);
            } catch (ex) { }
        } else {
            messageContent = msg.toString();
        }

        let shouldShowInConsole = false;
        let shouldSaveLogToFile = false;

        if (this.#enableConsoleLogging) {
            shouldShowInConsole = true;
        }

        if (this.#enableFileLogging) {
            shouldSaveLogToFile = true;
        }

        if (definedParams.shouldWriteToFile) shouldSaveLogToFile = true;
        if (definedParams.shouldShowInConsole) shouldShowInConsole = true;

        if (shouldSaveLogToFile) {
            this.#logToFile(`${messageContent}`);
        }

        if (shouldShowInConsole) {
            this.#logToConsole(`${messageContent}`);
        }
    }

    /**
     * Toggle between showing or not in the console
     * @param {Boolean} bool 
     */
    toggleLogConsole(bool) {
        this.#enableConsoleLogging = bool;
    }

    /**
     * Save the log to the file
     */
    #logToFile(content) {
        const saveDirectory = this.getSaveDirectory().complete;

        if (!fs.existsSync(path.dirname(saveDirectory))) {
            fs.mkdirSync(path.dirname(saveDirectory), { recursive: true });
        }
        fs.appendFileSync(saveDirectory, `[${this.getTime()}] -> ${content}\n`, { encoding: 'utf-8' });
    }

    /**
     * Log to the console
     * @param {String} content 
     */
    #logToConsole(content) {
        let logSequence = this.getLoggerSequence();

        console.log(`${this.getTime()} [${logSequence.join('->')}] ${content}`);
    }

    /**
     * Returns where the file will be saved
     */
    getSaveDirectory() {
        let logFilePath = ``;

        if (this.getParentLogger() != undefined) {
            logFilePath = `${this.getParentLogger().getSaveDirectory().directory}`;

            if (this.#logDirectory != undefined && this.#logDirectory != '') {
                logFilePath += `\\${this.#logDirectory}`;
            }
        } else {
            logFilePath = path.resolve(`${this.#logDirectory}\\${this.getDate()}`);
        }

        return {
            directory: logFilePath,
            fileName: `${this.#name}.log`,
            complete: `${logFilePath}\\${this.#name}.log`
        };
    }

    /**
     * Returns a string in the format hour:minute:second
     */
    getTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    }

    /**
     * Returns a string in the format yearmonthday
     */
    getDate() {
        const now = new Date();
        return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    }

    /**
     * Returns the folder where this instance of the Log is saving its logs
     */
    getLogDirectory() {
        return this.#logDirectory;
    }

    /**
     * Returns the parent logger of this logger
     */
    getParentLogger() {
        return this.#parentLogger;
    }

    /**
     * Returns an array with the sequence of parent loggers of this logger
     * @returns {[]}
     */
    getLoggerSequence() {
        let seq = [];
        if (this.#parentLogger != undefined) {
            seq = seq.concat(this.#parentLogger.getLoggerSequence());
        }
        seq.push(this.#name);
        return seq;
    }
}