import { Command } from '../interfaces';
import LTPlayer from '../ltPlayer';

export class ClearQueueCommand implements Command {
  constructor(private ltPlayer: LTPlayer) {}

  async execute(ogClearQueue: Function) {
    //ogClearQueue();
    this.ltPlayer.clearQueue();
  }

  hasPermission() {
    return this.ltPlayer.isHost;
  }

  notifyRestriction() {
    Spicetify.showNotification('Only the hosts can clear the queue!');
  }

  specialAction() {
    this.notifyRestriction();
  }
}
