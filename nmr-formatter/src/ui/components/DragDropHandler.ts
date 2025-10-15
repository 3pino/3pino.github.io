/**
 * DragDropHandler Component
 * Manages drag-and-drop functionality for file import with visual feedback
 */

import { ErrorNotification } from './ErrorNotification';

export interface DragDropOptions {
  targetElement: HTMLElement;
  onFilesDropped?: (files: File[]) => void;
  errorNotification: ErrorNotification;
}

export class DragDropHandler {
  private targetElement: HTMLElement;
  private overlay: HTMLElement;
  private errorNotification: ErrorNotification;
  private onFilesDropped?: (files: File[]) => void;
  private dragCounter: number = 0;

  constructor(options: DragDropOptions) {
    this.targetElement = options.targetElement;
    this.errorNotification = options.errorNotification;
    this.onFilesDropped = options.onFilesDropped;

    this.overlay = this.createOverlay();
    this.initializeEventListeners();
  }

  /**
   * Create the drag-drop overlay element
   */
  private createOverlay(): HTMLElement {
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
  private initializeEventListeners(): void {
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
  private handleDragEnter(e: DragEvent): void {
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
  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Handle dragleave event
   */
  private handleDragLeave(e: DragEvent): void {
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
  private handleDrop(e: DragEvent): void {
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
  private extractFiles(e: DragEvent): File[] {
    const files: File[] = [];

    if (e.dataTransfer?.items) {
      // Use DataTransferItemList interface
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file') {
          const file = e.dataTransfer.items[i].getAsFile();
          if (file) files.push(file);
        }
      }
    } else if (e.dataTransfer?.files) {
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
  private validateFiles(files: File[]): void {
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
  private showOverlay(): void {
    this.overlay.style.display = 'flex';
    // Trigger reflow for CSS transition
    void this.overlay.offsetHeight;
    this.overlay.classList.add('show');
  }

  /**
   * Hide the drag-drop overlay
   */
  private hideOverlay(): void {
    this.overlay.classList.remove('show');
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 200); // Match CSS transition duration
  }

  /**
   * Clean up event listeners and remove overlay
   */
  public destroy(): void {
    this.targetElement.removeEventListener('dragenter', this.handleDragEnter.bind(this));
    this.targetElement.removeEventListener('dragover', this.handleDragOver.bind(this));
    this.targetElement.removeEventListener('dragleave', this.handleDragLeave.bind(this));
    this.targetElement.removeEventListener('drop', this.handleDrop.bind(this));

    if (this.overlay.parentNode) {
      this.targetElement.removeChild(this.overlay);
    }
  }
}
