import { Command } from '../interfaces';
import LTPlayer from '../ltPlayer';

export class ResumeCommand implements Command {
  constructor(private ltPlayer: LTPlayer) {}

  async execute(ogResume: Function) {
    await ogResume();
    this.ltPlayer.requestUpdateSong(false, Spicetify.Player.getProgress());
  }

  hasPermission() {
    return this.ltPlayer.isHost;
  }

  notifyRestriction() {
    Spicetify.showNotification('Only the hosts can resume songs!');
  }

  specialAction() {
    this.notifyRestriction();
  }
}
