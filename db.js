const fs = require('fs');
const path = require('path');
const { logError, logInfo } = require('./logger');

class Database {
    constructor(dbFilePath = path.join(__dirname, '..', 'database.json')) {
        this.filePath = dbFilePath;
        this.data = {};
        this.init();
    }

    init() {
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify({}, null, 4));
            logInfo('Initialized new database.json');
        } else {
            this.load();
        }
    }

    load() {
        try {
            const rawData = fs.readFileSync(this.filePath, 'utf-8');
            this.data = JSON.parse(rawData);
        } catch (error) {
            logError(`Failed to load database.json: ${error.message}`);
            this.data = {};
        }
    }

    save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 4));
        } catch (error) {
            logError(`Failed to save to database.json: ${error.message}`);
        }
    }

    get(key) {
        return this.data[key];
    }

    set(key, value) {
        this.data[key] = value;
        this.save();
    }

    delete(key) {
        if (this.data.hasOwnProperty(key)) {
            delete this.data[key];
            this.save();
            return true;
        }
        return false;
    }

    has(key) {
        return this.data.hasOwnProperty(key);
    }
}

module.exports = new Database();
