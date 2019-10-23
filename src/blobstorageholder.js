export default class BlobStorageHolder {
  constructor(sessionServer, dataUrl) {
    this.sessionServer = sessionServer;
    this.dataUrl = dataUrl;
    this.blobUrl = undefined;
  }

  static isDataUrl(url) {
    return url && url.startsWith("data:");
  }

  get success() {
    return this.dataUrl != this.blobUrl;
  }

  get completed() {
    return this.blobUrl != undefined;
  }

  getUrl() {
    if (this.completed)
      return Promise.resolve(this.blobUrl);

    return this.sessionServer.blobSet(this.dataUrl)
      .then(res => {
        return this.blobUrl = res;
      })
      .catch(() => {
        return this.blobUrl = this.dataUrl;
      });
  }
}
