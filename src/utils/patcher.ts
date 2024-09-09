import { LiteEvent } from './liteEvent';
import LTPlayer from '../ltPlayer';
import { isTrackPaused } from './spotifyUtils';

import {
  ClearQueueCommand,
  PauseCommand,
  PlayCommand,
  RemoveFromQueueCommand,
  ResumeCommand,
  SeekToCommand,
  SkipToNextCommand,
  SkipToPreviousCommand,
} from '../commands';
import { Command } from '../interfaces';
import { AddToQueueCommand } from '../commands/addToQueueCommand';

export let ogPlayerAPI: any;
export default class Patcher {
  private patched = false;
  private lastData: any = null;
  constructor(public ltPlayer: LTPlayer) {}

  private readonly onTrackChanged = new LiteEvent<string>();
  public get trackChanged() {
    return this.onTrackChanged.expose();
  }

  patchAll() {
    if (this.patched) return;
    console.log('Patching');
    this.setOGFunctions();
    this.subscribeToPlayerEvents();
    this.overridePlayerFunctions();
    this.patched = true;
  }

  unpatchAll() {
    if (!this.patched) return;
    console.log('Unpatching');
    this.restorePlayerFunctions();
    this.patched = false;
  }

  private setOGFunctions() {
    const methods = [
      'play',
      'pause',
      'resume',
      'seekTo',
      'skipToNext',
      'skipToPrevious',
      'addToQueue',
      'removeFromQueue',
      'clearQueue',
    ];

    ogPlayerAPI = methods.reduce((obj: { [key: string]: any }, method) => {
      obj[method] = Spicetify.Platform.PlayerAPI[method].bind(
        Spicetify.Platform.PlayerAPI,
      );
      return obj;
    }, {});

    // Manual patching for nested functions
    ogPlayerAPI.emitSync =
      Spicetify.Platform.PlayerAPI._events._emitter.emitSync.bind(
        Spicetify.Platform.PlayerAPI._events._emitter,
      );

    if (Spicetify.Platform.PlaybackAPI.setVolume) {
      ogPlayerAPI.setVolume = (volume: number) => {
        Spicetify.Platform.PlaybackAPI.setVolume(volume);
      };
    }
  }

  private subscribeToPlayerEvents() {
    Spicetify.Player.addEventListener('songchange', (event) => {
      this.trackChangeHandler(event!.data);
    });
  }

  private trackChangeHandler = (data: any) => {
    if (!data) return;

    if (this.lastData?.item?.uri !== data?.item?.uri) {
      this.onTrackChanged.trigger(data?.item?.uri || '');
    }

    this.lastData = data;
  };

  private overridePlayerFunctions() {
    const handlers = {
      play: this.playHandler(ogPlayerAPI.play),
      pause: this.pauseHandler(ogPlayerAPI.pause),
      resume: this.resumeHandler(ogPlayerAPI.resume),
      skipToNext: this.skipToNextHandler(ogPlayerAPI.skipToNext),
      seekTo: this.seekToHandler(ogPlayerAPI.seekTo),
      skipToPrevious: this.skipToPreviousHandler(ogPlayerAPI.skipToPrevious),
      addToQueue: this.addToQueueHandler(ogPlayerAPI.addToQueue),
      removeFromQueue: this.removeFromQueueHandler(ogPlayerAPI.removeFromQueue),
      clearQueue: this.clearQueueHandler(ogPlayerAPI.clearQueue),
    };

    for (const [key, handler] of Object.entries(handlers)) {
      Spicetify.Platform.PlayerAPI[key] = handler;
    }

    if (ogPlayerAPI.emitSync) {
      Spicetify.Platform.PlayerAPI._events._emitter.emitSync =
        this.emitSyncHandler;
    }

    if (ogPlayerAPI.setVolume) {
      Spicetify.Platform.PlayerAPI.setVolume = this.setVolumeHandler;
    }

    Spicetify.Platform.History.listen(this.historyChangeHandler);
  }

  private restorePlayerFunctions() {
    const methods = [
      'play',
      'pause',
      'resume',
      'seekTo',
      'skipToNext',
      'skipToPrevious',
      'addToQueue',
      'removeFromQueue',
      'clearQueue',
    ];

    methods.forEach((method) => {
      Spicetify.Platform.PlayerAPI[method] = ogPlayerAPI[method];
    });

    if (ogPlayerAPI.emitSync) {
      Spicetify.Platform.PlayerAPI._events._emitter.emitSync =
        ogPlayerAPI.emitSync;
    }

    if (ogPlayerAPI.setVolume) {
      Spicetify.Platform.PlaybackAPI.setVolume = ogPlayerAPI.setVolume;
    }
  }

  private emitSyncHandler = (e: any, t: any) => {
    if (this.ltPlayer.client.connected && !this.ltPlayer.isHost) {
      if (t?.action === 'play' && t?.options?.ltForced !== true) return;
      if (t?.action === 'pause' && isTrackPaused()) return;
      if (t?.action === 'resume' && !isTrackPaused()) return;
    }
    return ogPlayerAPI.emitSync(e, t);
  };

  private playHandler = (ogPlay: any) => {
    return async (
      uri: Spicetify.ContextTrack,
      context: any,
      options?: any,
    ): Promise<void> => {
      const command = new PlayCommand(this.ltPlayer, uri, context, options);
      this.restrictAccess(() => ogPlay(uri, context, options), command);
    };
  };

  private pauseHandler = (ogPause: any) => {
    return async (): Promise<void> => {
      const command = new PauseCommand(this.ltPlayer);
      this.restrictAccess(ogPause, command);
    };
  };

  private resumeHandler = (ogResume: any) => {
    return async (): Promise<void> => {
      const command = new ResumeCommand(this.ltPlayer);
      this.restrictAccess(ogResume, command);
    };
  };

  private skipToNextHandler = (ogSkipToNext: any) => {
    return async (e: any): Promise<void> => {
      const command = new SkipToNextCommand(this.ltPlayer, e);
      this.restrictAccess(ogSkipToNext, command);
    };
  };

  private seekToHandler = (ogSkipTo: any) => {
    return async (ms: number): Promise<void> => {
      const command = new SeekToCommand(this.ltPlayer, ms);
      this.restrictAccess(ogSkipTo, command);
    };
  };

  private skipToPreviousHandler = (ogSkipToPrevious: any) => {
    return async (e: any): Promise<void> => {
      const command = new SkipToPreviousCommand(this.ltPlayer, e);
      this.restrictAccess(ogSkipToPrevious, command);
    };
  };

  private addToQueueHandler = (ogAddToQueue: any) => {
    return async (items: Spicetify.ContextTrack[]): Promise<void> => {
      const command = new AddToQueueCommand(this.ltPlayer, items);
      this.restrictAccess(ogAddToQueue, command);
    };
  };

  private removeFromQueueHandler = (ogRemoveFromQueue: any) => {
    return async (items: Spicetify.ContextTrack[]): Promise<void> => {
      const command = new RemoveFromQueueCommand(this.ltPlayer, items);
      this.restrictAccess(ogRemoveFromQueue, command);
    };
  };

  private clearQueueHandler = (ogClearQueue: any) => {
    return async (): Promise<void> => {
      const command = new ClearQueueCommand(this.ltPlayer);
      this.restrictAccess(ogClearQueue, command);
    };
  };

  private setVolumeHandler = (e: number) => {
    if (!this.ltPlayer.client.connected || this.ltPlayer.canChangeVolume)
      ogPlayerAPI.setVolume(e);
  };

  private historyChangeHandler = ({ pathname }: { pathname?: string }) => {
    let pathParts = pathname?.split('/', 3).filter((i) => i);
    if (
      (pathParts?.length || 0) >= 2 &&
      pathParts![0].toLowerCase() == 'listentogether'
    ) {
      this.ltPlayer.ui.quickConnect(decodeURIComponent(pathParts![1]));
      Spicetify.Platform.History.goBack();
    }
  };

  private async restrictAccess(ogFunc: any, command: Command) {
    if (!this.ltPlayer.client.connected && !this.ltPlayer.client.connecting) {
      console.log('Not connected');
      ogFunc();
    } else if (command.hasPermission()) {
      console.log('Has permission');
      await command.execute(ogFunc);
    } else {
      console.log('No permission');
      command.specialAction();
    }
  }
}
