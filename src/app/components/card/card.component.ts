import { Component } from '@angular/core';
import { CardPlayComponent } from '../card-play/card-play.component';

@Component({
  selector: 'app-card',
  imports: [
    CardPlayComponent
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {

}
