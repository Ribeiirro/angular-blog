import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuBarComponent } from './components/menu-bar/menu-bar.component';
import { HeaderBarComponent } from './components/header-bar/header-bar.component';
import { CardComponent } from './components/card/card.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [RouterOutlet, MenuBarComponent, HeaderBarComponent, CardComponent]
})
export class AppComponent {
  title = 'angular-blog';
}
