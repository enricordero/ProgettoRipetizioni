'use strict';
const _URL = '';

/**
 *
 * @param {string} method The method of the request
 * @param {string} url The resource of the request
 * @param {JSON} params Optional params in JSON format
 * @returns
 */
async function inviaRichiesta(method, url = '', params = {}) {
  method = method.toUpperCase();
  let options = {
    method: method,
    headers: {},
    mode: 'cors', // default
    cache: 'no-cache', // default
    credentials: 'same-origin', // default
    redirect: 'follow', // default
    referrerPolicy: 'no-referrer' // default no-referrer-when-downgrade
  };

  if (method == 'GET') {
    const queryParams = new URLSearchParams();
    for (let key in params) {
      let value = params[key];
      // Notare che i parametri di tipo object vengono serializzati
      if (value && typeof value === 'object') queryParams.append(key, JSON.stringify(value));
      else queryParams.append(key, value);
    }
    url += '?' + queryParams.toString();
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else {
    if (params instanceof FormData) {
      // In caso di formData occorre OMETTERE il Content-Type !
      // options.headers["Content-Type"]="multipart/form-data;"
      options['body'] = params; // Accept FormData, File, Blob
    } else {
      options['body'] = JSON.stringify(params);
      options.headers['Content-Type'] = 'application/json';
    }
  }

  try {
    const response = await fetch(_URL + url, options);
    if (!response.ok) {
      let err = await response.text();
      return { status: response.status, err };
    } else {
      let data = await response.json().catch(function (err) {
        console.log(err);
        return { status: 422, err: 'Response contains an invalid json' };
      });
      return { status: 200, data };
    }
  } catch {
    return { status: 408, err: 'Connection Refused or Server timeout' };
  }
}

function base64Convert(blob) {
  return new Promise(function (resolve, reject) {
    let reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = function (event) {
      resolve(event.target.result); // event.target sarebbe reader
    };
    reader.onerror = function (error) {
      reject(error);
    };
  });
}