export interface Command {
  execute(ogFunc: Function): void;
  hasPermission(): boolean;
  notifyRestriction(): void;
  specialAction(): void;
}
