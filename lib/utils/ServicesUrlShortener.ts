import UrlShorterServices from "../config/urlShorterServices.json" with { type: "json" };
import type URLShortenerServiceRequest from "../types/URLShortenerServiceRequest.ts";
import type {URLShortenerMultiServiceRequest} from "../types/URLShortenerMultiServiceRequest.ts";

const PREFIX = "https://";
const POSTFIX = "/--";
const POST_METHOD = "POST"
const BODY_PREFIX = "url="

export const DEFAULT_CHARACTERS_LIMIT = 256;

class ServicesUrlShortener {
  private constructor() {}
  public static getPostUrl(serviceUrl: string): string {
    return PREFIX + serviceUrl + POSTFIX;
  }

  public static getBody(url: string) {
    return BODY_PREFIX + encodeURIComponent(url);
  }

  private static async fetchShorterUrl(request: URLShortenerServiceRequest): Promise<string> {
    const postUrl = ServicesUrlShortener.getPostUrl(request.serviceUrl);
    return fetch(postUrl, {
    method: POST_METHOD,
    headers: request.headers,
    body: ServicesUrlShortener.getBody(request.url),
  }).then(async function (response) {
    if (response.ok) {
      const text = await response.text();
      if (text.length < 256) {
        return text;
      } else {
        return request.url;
      }
    } else {
      console.error("Could not get shorten url from service:", request.serviceUrl, response.statusText);
    }
    return request.url;
  }, function() {
    return request.url;
  });
  }

  private static async tryShorterWithServices(request: URLShortenerMultiServiceRequest): Promise<string> {
    var servicesFetchPromises: Promise<string>[] = [];
    for (let serviceUrl in UrlShorterServices) {
      const serviceHeaders = UrlShorterServices[serviceUrl].headers || request.headers;
      const thisServiceRequest: URLShortenerServiceRequest = {
        serviceUrl: serviceUrl,
        url: request.url,
        headers: serviceHeaders,
        overrideBody: undefined, // to silence this shitty error
      }
      servicesFetchPromises.push(
        ServicesUrlShortener.fetchShorterUrl(thisServiceRequest)
      );
    }
    return Promise.race(servicesFetchPromises);
  }

  public static async tryShorterWithServicesAndLimit(request: URLShortenerMultiServiceRequest, lengthLimit: number | undefined): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (lengthLimit && request.url.length < lengthLimit) {
        return resolve(request.url);
      }
      return ServicesUrlShortener.tryShorterWithServices(request).then(shorterUrl => {
         if (lengthLimit && shorterUrl && shorterUrl.length < lengthLimit) {
          return resolve(shorterUrl);
         } else {
          return reject("No one of services can shorten this url now");
         }
      })
    })
  }
}

export {ServicesUrlShortener, type URLShortenerMultiServiceRequest};
