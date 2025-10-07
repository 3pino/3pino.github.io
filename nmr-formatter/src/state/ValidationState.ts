/**
 * Validation State Management
 * Tracks validation errors for metadata and table fields
 */

export interface FieldError {
    fieldId: string;
    message: string;
}

export class ValidationState {
    private errors: Map<string, string> = new Map();
    private changeListeners: Array<(errors: Map<string, string>) => void> = [];

    hasError(fieldId: string): boolean {
        return this.errors.has(fieldId);
    }

    getError(fieldId: string): string | undefined {
        return this.errors.get(fieldId);
    }

    getAllErrors(): Map<string, string> {
        return new Map(this.errors);
    }

    setError(fieldId: string, message: string): void {
        this.errors.set(fieldId, message);
        this.notifyChange();
    }

    clearError(fieldId: string): void {
        this.errors.delete(fieldId);
        this.notifyChange();
    }

    clearAllErrors(): void {
        this.errors.clear();
        this.notifyChange();
    }

    hasAnyErrors(): boolean {
        return this.errors.size > 0;
    }

    onChange(listener: (errors: Map<string, string>) => void): void {
        this.changeListeners.push(listener);
    }

    private notifyChange(): void {
        this.changeListeners.forEach(listener => listener(this.getAllErrors()));
    }
}
