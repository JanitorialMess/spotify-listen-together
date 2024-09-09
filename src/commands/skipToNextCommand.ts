import { Command } from '../interfaces';
import LTPlayer from '../ltPlayer';

export class SkipToNextCommand implements Command {
  constructor(private ltPlayer: LTPlayer, private e: any) {}

  async execute(ogSkipToNext: Function) {
    ogSkipToNext(this.e);
  }

  hasPermission() {
    return this.ltPlayer.isHost;
  }

  notifyRestriction() {
    Spicetify.showNotification('Only the hosts can change songs!');
  }

  specialAction() {
    this.notifyRestriction();
  }
}
