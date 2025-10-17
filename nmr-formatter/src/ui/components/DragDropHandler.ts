/**
 * DragDropHandler Component
 * Manages drag-and-drop functionality for file import with visual feedback
 */

import { ErrorNotification } from './ErrorNotification';
import { isTopSpinData, parseTopSpinDirectory } from '../../utils/topspin-parser';

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
    // Append to body instead of target element to avoid scroll issues
    document.body.appendChild(overlay);
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
  private async handleDrop(e: DragEvent): Promise<void> {
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
    } catch (error) {
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
  private async extractFilesFromDrop(e: DragEvent): Promise<File[]> {
    const files: File[] = [];

    if (!e.dataTransfer?.items) {
      return files;
    }

    const items = Array.from(e.dataTransfer.items);

    for (const item of items) {
      if (item.kind !== 'file') continue;

      try {
        // Use File System Access API
        const handle = await (item as any).getAsFileSystemHandle();
        
        if (handle.kind === 'directory') {
          // Recursively read directory
          const dirFiles = await this.readDirectoryHandle(handle);
          files.push(...dirFiles);
        } else if (handle.kind === 'file') {
          // Read single file
          const file = await handle.getFile();
          files.push(file);
        }
      } catch (error) {
        console.error('Error reading dropped item:', error);
        // Fallback: try getAsFile() for single files
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    return files;
  }



  /**
   * Read directory using File System Access API (modern)
   */
  private async readDirectoryHandle(dirHandle: any): Promise<File[]> {
    const files: File[] = [];
    
    try {
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          files.push(file);
        } else if (entry.kind === 'directory') {
          // Recursively read subdirectory
          const subFiles = await this.readDirectoryHandle(entry);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirHandle.name}:`, error);
    }
    
    return files;
  }









  /**
   * Validate dropped files
   * Currently rejects all files as per step 2 (skip for now)
   */
  private validateFiles(files: File[]): void {
    // Check if this is TopSpin data
    if (isTopSpinData(files)) {
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
  private showOverlay(): void {
    // Get target element's position and size
    const rect = this.targetElement.getBoundingClientRect();
    
    // Position overlay to match target element
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = `${rect.top}px`;
    this.overlay.style.left = `${rect.left}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
    
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
