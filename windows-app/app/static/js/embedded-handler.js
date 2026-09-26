/**
 * PVP Embedded Video Handler
 * Provides embedded video extraction modal and playback helpers
 */
class EmbeddedVideoHandler {
  constructor() {
    this.embeddedSources = [];
  }

  displayEmbeddedOptions(data) {
    if (typeof showEmbeddedOptionsModal === 'function') {
      showEmbeddedOptionsModal(data);
    }
  }

  playEmbeddedSource(sourceIndex) {
    if (!this.embeddedSources[sourceIndex]) return;
    const source = this.embeddedSources[sourceIndex];
    if (typeof playEmbeddedSource === 'function') {
      playEmbeddedSource(source);
    }
  }
}

window.embeddedHandler = new EmbeddedVideoHandler();
