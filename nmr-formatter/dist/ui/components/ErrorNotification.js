"use strict";
/**
 * ErrorNotification Component
 * Manages error notification banners in the top-right corner with auto-dismiss and stacking support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorNotification = void 0;
class ErrorNotification {
    constructor() {
        this.notifications = new Map();
        this.notificationCount = 0;
        this.container = this.createContainer();
        document.body.appendChild(this.container);
    }
    /**
     * Create the notification container element
     */
    createContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        return container;
    }
    /**
     * Show an error notification banner
     * @param options Notification configuration
     * @returns Notification ID for programmatic dismissal
     */
    show(options) {
        var _a;
        const id = `notification-${++this.notificationCount}`;
        const duration = (_a = options.duration) !== null && _a !== void 0 ? _a : 5000; // Default 5 seconds
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
    createNotification(id, message) {
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
    dismiss(id) {
        const notification = this.notifications.get(id);
        if (!notification)
            return;
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
    dismissAll() {
        for (const id of this.notifications.keys()) {
            this.dismiss(id);
        }
    }
    /**
     * Clean up and remove the notification container
     */
    destroy() {
        this.dismissAll();
        if (this.container.parentNode) {
            document.body.removeChild(this.container);
        }
    }
}
exports.ErrorNotification = ErrorNotification;
//# sourceMappingURL=ErrorNotification.js.map