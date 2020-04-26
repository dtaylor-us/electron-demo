import {Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, retry, tap} from 'rxjs/operators';
import {Greeting} from "./greeting.model";

const SERVICE_URL = 'http//localhost:8080/greeting';

@Injectable({
  providedIn: 'root'
})
export class GreetingService {

  constructor(private http: HttpClient) {
  }

  url = SERVICE_URL;

  // getGreeting(): Observable<Greeting> {
  //   // TODO: send the message _after_ fetching the heroes
  //   return this.http.get(this.url);
  // }
  getGreeting(): Observable<Greeting> {
    return this.http.get<Greeting>('http://localhost:8080/greeting');
  }
}
