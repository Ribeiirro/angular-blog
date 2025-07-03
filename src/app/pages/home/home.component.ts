import { Component, OnInit } from '@angular/core';
import { SlidesComponent } from 'src/app/components/slides/slides.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    imports: [ SlidesComponent]
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
