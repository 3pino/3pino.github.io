"use strict";
/**
 * DragDropHandler Component
 * Manages drag-and-drop functionality for file import with visual feedback
 */
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DragDropHandler = void 0;
const topspin_parser_1 = require("../../utils/topspin-parser");
class DragDropHandler {
    constructor(options) {
        this.dragCounter = 0;
        this.targetElement = options.targetElement;
        this.errorNotification = options.errorNotification;
        this.onFilesDropped = options.onFilesDropped;
        this.overlay = this.createOverlay();
        this.initializeEventListeners();
    }
    /**
     * Create the drag-drop overlay element
     */
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'drag-drop-overlay';
        overlay.innerHTML = `
      <div class="drag-drop-content">
        <div class="drag-drop-icon">📁</div>
        <div class="drag-drop-text">Drop Here</div>
      </div>
    `;
        overlay.style.display = 'none';
        this.targetElement.appendChild(overlay);
        return overlay;
    }
    /**
     * Initialize drag-and-drop event listeners
     */
    initializeEventListeners() {
        // Prevent default drag behaviors on the target element
        this.targetElement.addEventListener('dragenter', this.handleDragEnter.bind(this));
        this.targetElement.addEventListener('dragover', this.handleDragOver.bind(this));
        this.targetElement.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.targetElement.addEventListener('drop', this.handleDrop.bind(this));
        // Prevent overlay from interfering with drag events
        this.overlay.addEventListener('dragenter', (e) => e.preventDefault());
        this.overlay.addEventListener('dragover', (e) => e.preventDefault());
    }
    /**
     * Handle dragenter event
     */
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dragCounter++;
        // Only show overlay on first dragenter
        if (this.dragCounter === 1) {
            this.showOverlay();
        }
    }
    /**
     * Handle dragover event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    /**
     * Handle dragleave event
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dragCounter--;
        // Only hide overlay when all drags have left
        if (this.dragCounter === 0) {
            this.hideOverlay();
        }
    }
    /**
     * Handle drop event
     */
    async handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dragCounter = 0;
        this.hideOverlay();
        try {
            const files = await this.extractFilesFromDrop(e);
            if (files.length === 0) {
                this.errorNotification.show({
                    message: 'No File Found.',
                    duration: 3000
                });
                return;
            }
            // Log all file names
            console.log('Dropped files:');
            files.forEach(file => console.log(file.name));
            // Validate files (currently all files are rejected as specified)
            this.validateFiles(files);
            // Call the callback if provided
            if (this.onFilesDropped) {
                this.onFilesDropped(files);
            }
        }
        catch (error) {
            console.error('Error processing dropped files:', error);
            this.errorNotification.show({
                message: 'Error reading files. Please try again.',
                duration: 5000
            });
        }
    }
    /**
     * Extract files from drag event
     */
    async extractFilesFromDrop(e) {
        var _a;
        const files = [];
        if (!((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.items)) {
            return files;
        }
        const items = Array.from(e.dataTransfer.items);
        for (const item of items) {
            if (item.kind !== 'file')
                continue;
            try {
                // Use File System Access API
                const handle = await item.getAsFileSystemHandle();
                if (handle.kind === 'directory') {
                    // Recursively read directory
                    const dirFiles = await this.readDirectoryHandle(handle);
                    files.push(...dirFiles);
                }
                else if (handle.kind === 'file') {
                    // Read single file
                    const file = await handle.getFile();
                    files.push(file);
                }
            }
            catch (error) {
                console.error('Error reading dropped item:', error);
                // Fallback: try getAsFile() for single files
                const file = item.getAsFile();
                if (file)
                    files.push(file);
            }
        }
        return files;
    }
    /**
     * Read directory using File System Access API (modern)
     */
    async readDirectoryHandle(dirHandle) {
        var _a, e_1, _b, _c;
        const files = [];
        try {
            try {
                for (var _d = true, _e = __asyncValues(dirHandle.values()), _f; _f = await _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const entry = _c;
                    if (entry.kind === 'file') {
                        const file = await entry.getFile();
                        files.push(file);
                    }
                    else if (entry.kind === 'directory') {
                        // Recursively read subdirectory
                        const subFiles = await this.readDirectoryHandle(entry);
                        files.push(...subFiles);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) await _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        catch (error) {
            console.error(`Error reading directory ${dirHandle.name}:`, error);
        }
        return files;
    }
    /**
     * Validate dropped files
     * Currently rejects all files as per step 2 (skip for now)
     */
    validateFiles(files) {
        // Check if this is TopSpin data
        if ((0, topspin_parser_1.isTopSpinData)(files)) {
            // TopSpin data detected - will be handled by onFilesDropped callback
            return;
        }
        // For now, reject all other files with an error message
        for (const file of files) {
            this.errorNotification.show({
                message: `File "${file.name}" is not supported.`,
                duration: 5000
            });
        }
    }
    /**
     * Show the drag-drop overlay
     */
    showOverlay() {
        this.overlay.style.display = 'flex';
        // Trigger reflow for CSS transition
        void this.overlay.offsetHeight;
        this.overlay.classList.add('show');
    }
    /**
     * Hide the drag-drop overlay
     */
    hideOverlay() {
        this.overlay.classList.remove('show');
        setTimeout(() => {
            this.overlay.style.display = 'none';
        }, 200); // Match CSS transition duration
    }
    /**
     * Clean up event listeners and remove overlay
     */
    destroy() {
        this.targetElement.removeEventListener('dragenter', this.handleDragEnter.bind(this));
        this.targetElement.removeEventListener('dragover', this.handleDragOver.bind(this));
        this.targetElement.removeEventListener('dragleave', this.handleDragLeave.bind(this));
        this.targetElement.removeEventListener('drop', this.handleDrop.bind(this));
        if (this.overlay.parentNode) {
            this.targetElement.removeChild(this.overlay);
        }
    }
}
exports.DragDropHandler = DragDropHandler;
//# sourceMappingURL=DragDropHandler.js.map