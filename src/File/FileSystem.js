import fs from "fs";
import path from "path";

/**
 * Represents a path to a file/folder in the operating system
 */
export class PathString {

    /**
     * File path in the system
     * @type {String}
     */
    path = '';

    /**
     * Initializes a Path String object with the source path
     * @param {String} path 
     */
    constructor(path) {
        this.path = path;
    }

    /**
     * Returns true/false if the path exists
     * @returns {Boolean}
     */
    exists() {
        return fs.existsSync(this.path);
    }

    /**
     * Returns the name of the last portion of the path
     */
    getName() {
        return path.basename(this.path);
    }

    /**
     * Returns the full path
     */
    getFullPath() {
        return path.resolve(this.path);
    }

    /**
     * Returns informations about the path
     */
    getPathStatistics() {
        const statistics = {
            createdIn: undefined,
            modifiedIn: undefined,
        }

        const statusPath = fs.statSync(path.resolve(this.path));
        statistics.createdIn = statusPath.birthtime;
        statistics.modifiedIn = statusPath.mtime;

        return statistics;
    }
}

/**
 * Represents a path to a file in the operating system
 */
export class PathFile extends PathString {
    /**
     * Initializes a Path File object with the source path
     */
    constructor(path) {
        super(path);
    }

    /**
     * Returns the extension of the file
     */
    getExtension() {
        return path.extname(this.path);
    }

    /**
     * Try and create the desired file
     * @param {Boolean} shouldReplaceIfExists - (OPTIONAL) (DEFAULT FALSE) If the file should be replaced if it already exists
     * @param {*} defaultValue - (OPTIONAL) Default value to be written in the file
     */
    create(shouldReplaceIfExists, defaultValue) {
        const retornoCreate = {
            /**
             * If the operation was successful
             */
            isSuccess: false,
            /**
             * Error details in case of failure
             */
            error: {
                message: ''
            }
        }

        const contentToWrite = defaultValue || '';

        try {
            if (shouldReplaceIfExists || !fs.existsSync(this.path)) {

                // Check if dir exists
                const dir = path.dirname(this.path);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                fs.writeFileSync(this.path, contentToWrite);
                retornoCreate.isSuccess = true;
            } else {
                retornoCreate.error.message = 'File already exists';
            }
        } catch (ex) {
            retornoCreate.error.message = ex.message;
        }

        return retornoCreate;
    }


    /**
     * Delete the file
     */
    delete() {
        const retornoDelete = {
            /**
             * If the operation was successful
             */
            isSuccess: false,
            /**
             * Error details in case of failure
             */
            error: {
                message: ''
            }
        }

        try {
            fs.unlinkSync(this.path);
            retornoDelete.isSuccess = true;
        } catch (ex) {
            retornoDelete.error.message = ex.message;
        }

        return retornoDelete;
    }
}

/**
 * Represents a path to a folder in the operating system
 */
export class PathFolder extends PathString {

    /**
     * Initializes a Path Folder object with the source path
     * @param {String} path 
     */
    constructor(path) {
        super(path);
    }

    create() {
        const retornoCreate = {
            /**
             * If the operation was successful
             */
            isSuccess: false,
            /**
             * Error details in case of failure
             */
            error: {
                message: ''
            }
        }

        try {
            if (!fs.existsSync(this.path)) {
                fs.mkdirSync(this.path, { recursive: true });
                retornoCreate.isSuccess = true;
            } else {
                retornoCreate.error.message = 'Folder already exists';
            }
        } catch (ex) {
            retornoCreate.error.message = ex.message;
        }

        return retornoCreate;
    }

    /**
     * Delete the folder
     */
    delete() {
        const retornoDelete = {
            /**
             * If the operation was successful
             */
            isSuccess: false,
            /**
             * Error details in case of failure
             */
            error: {
                message: ''
            }
        }

        try {
            fs.rmdirSync(this.path);
            retornoDelete.isSuccess = true;
        } catch (ex) {
            retornoDelete.error.message = ex.message;
        }

        return retornoDelete;
    }
}

/**
 * Represents a text file in the operating system
 */
export class TextFile extends PathFile {
    constructor(filePath) {
        super(filePath);
    }

    /**
     * Add a new string or an array of strings to the file
     * @param {(String | Array)} contentToWrite 
     * @returns {Boolean} True/false if the content was successfully added to the file
     */
    addLine(contentToWrite) {
        const retornAddLines = {
            isSuccess: false,
            error: {
                message: ''
            }
        };

        // Array containing the line(s) to be written to the file
        let linesToWrite = [];

        if (Array.isArray(contentToWrite)) {

            // If it's an array, iterate over each content in the array and add it to the lines array
            contentToWrite.forEach(arrayContent => {
                if (typeof arrayContent == "object") {
                    // If it's an object, convert it to string
                    try {
                        linesToWrite.push(JSON.stringify(arrayContent, null, 4));
                    } catch (ex) {
                        retornAddLines.error.message = `An error occurred while converting object to string, canceling save: ${ex.message}`;
                        return retornAddLines;
                    }
                } else {
                    // If it's any other type, convert to string
                    linesToWrite.push(arrayContent.toString());
                }
            });

        } else if (typeof contentToWrite == "string") {
            // If it's a string, just add it to the array
            linesToWrite.push(contentToWrite);
        } else if (typeof contentToWrite == "object") {
            // If it's an object, try to convert it to string and add to the array
            try {
                linesToWrite.push(JSON.stringify(contentToWrite, null, 4));
            } catch (ex) {
                retornAddLines.error.message = `An error occurred while converting object to string, canceling save: ${ex.message}`;
                return retornAddLines;
            }
        }

        if (!this.exists()) {
            const createFile = this.create();
            if (!createFile.isSuccess) {
                retornAddLines.error.message = `An error occurred while creating the TXT file, canceling save: ${createFile.error.message}`;
                return retornAddLines
            }
        }

        // Iterate over each line to be written to the txt file
        for (let line of linesToWrite) {

            // Use try to ensure no errors occur
            try {
                fs.appendFileSync(this.path, `${line}\n`, { encoding: "utf-8" });
            } catch (ex) {
                retornAddLines.error.message = `An error occurred while saving information to the TXT file, canceling save: ${ex.message}`;
                return retornAddLines;
            }
        }

        retornAddLines.isSuccess = true;
        return retornAddLines;
    }

    /**
     * Set the text of the file. This will overwrite the current content of the file
     */
    setText(text) {
        const retornSetText = {
            isSuccess: false,
            error: {
                message: ''
            }
        }

        try {
            fs.writeFileSync(this.path, text);
            retornSetText.isSuccess = true;
        } catch (ex) {
            retornSetText.error.message = `An error occurred while saving information to the TXT file, canceling save: ${ex.message}`;
        }

        return retornSetText;
    }

    /**
     * Deletes all characters in the file, leaving it as an empty txt file
     * @return {Boolean} True/false if the file was successfully cleared
     */
    clearFile() {
        const retornClear = {
            isSuccess: false,
            error: {
                message: ''
            }
        }

        try {
            fs.writeFileSync(this.path, '');
            retornClear.isSuccess = true;
        } catch (ex) {
            retornClear.error.message = `An error occurred while clearing the TXT file: ${ex.message}`;
        }

        return retornClear;
    }
}