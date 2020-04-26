import { Component, OnInit, Input } from '@angular/core';
import {GreetingService} from "./greeting.service";
import {Greeting} from "./greeting.model";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @Input() greeting: Greeting;
  greetingService: GreetingService;

  constructor(greetingService: GreetingService) {
    this.greetingService = greetingService;
  }
  ngOnInit(): void {
    this.getGreeting();
  }

  getGreeting() {
    this.greetingService.getGreeting()
      .subscribe(greeting => this.greeting = greeting);
  }

  title = 'sprangtron-ui';
}
