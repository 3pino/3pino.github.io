"use strict";
// Centralized logging utility
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["NONE"] = 4] = "NONE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    static setLogLevel(level) {
        this.logLevel = level;
    }
    static debug(message, ...args) {
        if (this.logLevel <= LogLevel.DEBUG) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }
    static info(message, ...args) {
        if (this.logLevel <= LogLevel.INFO) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }
    static warn(message, ...args) {
        if (this.logLevel <= LogLevel.WARN) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }
    static error(message, ...args) {
        if (this.logLevel <= LogLevel.ERROR) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }
}
exports.Logger = Logger;
Logger.logLevel = LogLevel.INFO;
//# sourceMappingURL=logger.js.map