import { Command } from '../interfaces';
import LTPlayer from '../ltPlayer';

export class PauseCommand implements Command {
  constructor(private ltPlayer: LTPlayer) {}

  async execute(ogPause: Function) {
    await ogPause();
    this.ltPlayer.requestUpdateSong(true, Spicetify.Player.getProgress());
  }

  hasPermission() {
    return this.ltPlayer.isHost;
  }

  notifyRestriction() {
    Spicetify.showNotification('Only the hosts can pause songs!');
  }

  specialAction() {
    this.notifyRestriction();
  }
}
