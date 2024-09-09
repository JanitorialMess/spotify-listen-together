import { Command } from '../interfaces';
import LTPlayer from '../ltPlayer';

export class RemoveFromQueueCommand implements Command {
  constructor(
    private ltPlayer: LTPlayer,
    private items: Spicetify.ContextTrack[],
  ) {}

  async execute(ogRemoveFromQueue: Function) {
    //ogRemoveFromQueue(this.items);
    this.ltPlayer.removeFromQueue(this.items);
  }

  hasPermission() {
    return this.ltPlayer.isHost;
  }

  notifyRestriction() {
    Spicetify.showNotification('Only the hosts can update the queue!');
  }

  specialAction() {
    this.notifyRestriction();
  }
}
