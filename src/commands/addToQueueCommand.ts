import { Command } from '../interfaces';
import LTPlayer from '../ltPlayer';

export class AddToQueueCommand implements Command {
  constructor(
    private ltPlayer: LTPlayer,
    private items: Spicetify.ContextTrack[],
  ) {}

  async execute(ogAddToQueue: Function) {
    //ogAddToQueue(this.items);
    this.ltPlayer.addToQueue(this.items);
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
