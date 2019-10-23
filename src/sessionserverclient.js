/*
 * $Id: sessionserverclient.js 45045 2018-05-02 12:01:11Z robertj $
 */

/**
 * Lichtblick Server API
 */
export default class SessionServerClient {
  constructor(baseUri) {
    this.baseUri = baseUri;
  }

  post(uri, params = {}) {
    return fetch(this.baseUri + uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(params)
    }).then(function (response) {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    }).catch(function(ex) {
    });
  }

  save(data) {
    return this.post('/data/set', { data });
  }

  load(id) {
    return this.post('/data/get', { id });
  }

  blobSet(dataUrl) {
    return this.post('/blob/set', { data: dataUrl })
      .then(res => this.blobGetUri(res.id));
  }

  blobGetUri(id) {
    return this.baseUri + '/blob/get/' + id;
  }
}
