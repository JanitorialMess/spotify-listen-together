import { Command } from '../interfaces';
import LTPlayer from '../ltPlayer';

export class SkipToPreviousCommand implements Command {
  constructor(private ltPlayer: LTPlayer, private e: any) {}

  async execute(ogSkipToPrevious: Function) {
    if (Spicetify.Player.getProgress() <= 3000) {
      ogSkipToPrevious(this.e);
    } else {
      Spicetify.Player.seek(0);
    }
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
