"use strict";
/**
 * DragDropHandler Component
 * Manages drag-and-drop functionality for file import with visual feedback
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DragDropHandler = void 0;
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
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dragCounter = 0;
        this.hideOverlay();
        const files = this.extractFiles(e);
        if (files.length === 0) {
            this.errorNotification.show({
                message: 'No File Found.',
                duration: 3000
            });
            return;
        }
        // Validate files (currently all files are rejected as specified)
        this.validateFiles(files);
        // Call the callback if provided
        if (this.onFilesDropped) {
            this.onFilesDropped(files);
        }
    }
    /**
     * Extract files from drag event
     */
    extractFiles(e) {
        var _a, _b;
        const files = [];
        if ((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.items) {
            // Use DataTransferItemList interface
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                if (e.dataTransfer.items[i].kind === 'file') {
                    const file = e.dataTransfer.items[i].getAsFile();
                    if (file)
                        files.push(file);
                }
            }
        }
        else if ((_b = e.dataTransfer) === null || _b === void 0 ? void 0 : _b.files) {
            // Use DataTransferFileList interface
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                files.push(e.dataTransfer.files[i]);
            }
        }
        return files;
    }
    /**
     * Validate dropped files
     * Currently rejects all files as per step 2 (skip for now)
     */
    validateFiles(files) {
        // For now, reject all files with an error message
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