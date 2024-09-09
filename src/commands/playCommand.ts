import { Command } from '../interfaces';
import LTPlayer from '../ltPlayer';
import { isListenableTrackType, getTrackType } from '../utils/spotifyUtils';

export class PlayCommand implements Command {
  constructor(
    private ltPlayer: LTPlayer,
    private uri: Spicetify.ContextTrack,
    private context: any,
    private options: any,
  ) {}

  async execute(ogPlay: Function) {
    this.ltPlayer.muteBeforePlay();
    ogPlay(this.uri, this.context, this.options);
  }

  hasPermission() {
    return this.ltPlayer.isHost || this.options?.ltForced === true;
  }

  notifyRestriction() {
    Spicetify.showNotification('Only the hosts can change songs!');
  }

  specialAction() {
    this.notifyRestriction();
    if (this.options?.repeat === undefined) {
      if (typeof this.uri?.uri === 'string') {
        if (isListenableTrackType(getTrackType(this.uri.uri)))
          this.ltPlayer.requestSong(this.uri.uri);
        else if (
          typeof this.options?.skipTo?.uri === 'string' &&
          isListenableTrackType(getTrackType(this.options.skipTo.uri))
        )
          this.ltPlayer.requestSong(this.options.skipTo.uri);
      }
    }
  }
}
