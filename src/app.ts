async function main() {
  if (
    !Spicetify.CosmosAsync ||
    !Spicetify.Platform ||
    !Spicetify.LocalStorage ||
    !Spicetify.React
  ) {
    setTimeout(main, 1000);
    return;
  }

  // Lazy import because we have to wait for the API to load
  const LTPlayer = await import('./ltPlayer');
  const ltPlayer = new LTPlayer.default();
  const settings = ltPlayer.settingsManager.settings;

  if (
    settings.autoConnect &&
    !ltPlayer.client.connected &&
    !ltPlayer.client.connecting
  ) {
    if (settings.server) {
      console.log(`Autoconnecting to ${settings.server}`);
      ltPlayer.client.connect();
    }
  }
}

export default main;
