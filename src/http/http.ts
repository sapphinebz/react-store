import { ajax } from "rxjs/ajax";
import { map } from "rxjs/operators";

export function httpGet<T>(url: string) {
  return ajax<T>({
    url: url,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).pipe(map((response) => response.response));
}

export function httpPost<T>(url: string, body: any) {
  return ajax<T>({
    url: url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  }).pipe(map((response) => response.response));
}
