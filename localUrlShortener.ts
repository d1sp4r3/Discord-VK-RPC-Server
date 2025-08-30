import { warn } from "console";
import activeServices from "./active-shorter-services.json" with { type: "json" };
const PREFIX = "https://";
const POSTFIX = "/--";

async function askServiceForShortenUrl(serviceUrl: string, urlToShorten: string, headers: any | undefined): Promise<string> {
  const askUrl = PREFIX + serviceUrl + POSTFIX;
  return fetch(askUrl, {
    method: "POST",
    headers: headers,
    body: `url=${encodeURIComponent(urlToShorten)}`,
  }).then(async function (response) {
    if (response.ok) {
      const text = await response.text();
      if (text.length < 256) {
        return text;
      } else {
        return urlToShorten;
      }
    } else {
      console.error("Could not get shorten url from service:", serviceUrl, response.statusText);
    }
    return urlToShorten;
  }, function() {
    return urlToShorten;
  });
}

async function makeUrlShorter(url: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    if (url.length < 256) {
      return resolve(url);
    }
    for (let serviceUrl in activeServices) {
      const serviceHeaders = activeServices[serviceUrl].headers;
      const responseUrl = await askServiceForShortenUrl(serviceUrl, url, serviceHeaders).catch((errorObject) => {
        console.log("Could not get shorten url from service:", serviceUrl, errorObject)
      });
        if (responseUrl && url !== responseUrl) {
          return resolve(responseUrl);
        }
    }
    reject("No one of services can shorten this url now");
  });
}

export { makeUrlShorter };
