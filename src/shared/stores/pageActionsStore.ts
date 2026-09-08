export class PageActionsStore {
  private handlers: Record<string, () => void> = {};

  set(id: string, handler: () => void) {
    this.handlers[id] = handler;
  }

  clear(id: string) {
    delete this.handlers[id];
  }

  run(id: string) {
    this.handlers[id]?.();
  }
}

export const pageActionsStore = new PageActionsStore();