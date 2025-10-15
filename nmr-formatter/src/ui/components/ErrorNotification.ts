/**
 * ErrorNotification Component
 * Manages error notification banners in the top-right corner with auto-dismiss and stacking support
 */

export interface NotificationOptions {
  message: string;
  duration?: number; // milliseconds, 0 for no auto-dismiss
}

export class ErrorNotification {
  private container: HTMLElement;
  private notifications: Map<string, HTMLElement> = new Map();
  private notificationCount: number = 0;

  constructor() {
    this.container = this.createContainer();
    document.body.appendChild(this.container);
  }

  /**
   * Create the notification container element
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'notification-container';
    return container;
  }

  /**
   * Show an error notification banner
   * @param options Notification configuration
   * @returns Notification ID for programmatic dismissal
   */
  public show(options: NotificationOptions): string {
    const id = `notification-${++this.notificationCount}`;
    const duration = options.duration ?? 5000; // Default 5 seconds

    const notification = this.createNotification(id, options.message);
    this.notifications.set(id, notification);
    this.container.appendChild(notification);

    // Trigger reflow for CSS transition
    void notification.offsetHeight;
    notification.classList.add('show');

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  /**
   * Create a notification element
   */
  private createNotification(id: string, message: string): HTMLElement {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.setAttribute('data-notification-id', id);

    const messageSpan = document.createElement('span');
    messageSpan.className = 'notification-message';
    messageSpan.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close notification');
    closeButton.addEventListener('click', () => {
      this.dismiss(id);
    });

    notification.appendChild(messageSpan);
    notification.appendChild(closeButton);

    return notification;
  }

  /**
   * Dismiss a notification by ID
   */
  public dismiss(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification) return;

    notification.classList.remove('show');
    notification.classList.add('hide');

    // Remove from DOM after transition
    setTimeout(() => {
      if (notification.parentNode) {
        this.container.removeChild(notification);
      }
      this.notifications.delete(id);
    }, 300); // Match CSS transition duration
  }

  /**
   * Dismiss all notifications
   */
  public dismissAll(): void {
    for (const id of this.notifications.keys()) {
      this.dismiss(id);
    }
  }

  /**
   * Clean up and remove the notification container
   */
  public destroy(): void {
    this.dismissAll();
    if (this.container.parentNode) {
      document.body.removeChild(this.container);
    }
  }
}
