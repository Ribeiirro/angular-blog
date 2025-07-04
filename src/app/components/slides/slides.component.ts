import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-slides',
  imports: [
    CommonModule
  ],
  templateUrl: './slides.component.html',
  styleUrl: './slides.component.css'
})
export class SlidesComponent implements AfterViewInit {
  @ViewChild('carousel', { static: true }) carouselRef!: ElementRef;
  @ViewChild('list', { static: true }) listRef!: ElementRef;
  @ViewChild('runningTimeBar', { static: true }) runningTimeBarRef!: ElementRef;
  @ViewChild('arrowsDiv', { static: true }) arrowsDivRef!: ElementRef;

  items!: HTMLElement[];
  transitionTimeout: any;
  autoNextTimeout: any;
  readonly TIME_RUNNING = 1500;
  readonly TIME_AUTO_NEXT = 3500;

  slides = [
    {
      title: 'SUNRISE ON PEAKS',
      name: 'Sunrise',
      des: 'Witness the serene beauty...',
      img: 'https://images.pexels.com/photos/552785/pexels-photo-552785.jpeg'
    },
    {
      title: 'RUGGED ROCKS',
      name: 'Rocky',
      des: 'Explore the rugged beauty...',
      img: 'https://images.pexels.com/photos/17804524/pexels-photo-17804524/free-photo-of-barren-rocky-mountains.jpeg'
    },
    {
      title: 'FOREST PATHWAY',
      name: 'Forest',
      des: 'A peaceful trail through...',
      img: 'https://images.pexels.com/photos/6439041/pexels-photo-6439041.jpeg'
    },
    {
      title: 'COLORFUL MEADOW',
      name: 'Meadow',
      des: 'A colorful meadow filled...',
      img: 'https://images.pexels.com/photos/2832061/pexels-photo-2832061.jpeg'
    },
    {
      title: 'SERENE LAKE',
      name: 'Lake',
      des: 'A calm and serene lake...',
      img: 'https://images.pexels.com/photos/552784/pexels-photo-552784.jpeg'
    }
  ];

  ngAfterViewInit(): void {
    const carousel = this.carouselRef.nativeElement;
    const list = this.listRef.nativeElement;
    const runningTimeBar = this.runningTimeBarRef.nativeElement;
    const arrowsDiv = this.arrowsDivRef.nativeElement;

    const items = Array.from(list.querySelectorAll('.item')) as HTMLElement[];
    this.items = items;

    // Adiciona número nos slides
    items.forEach((item, index) => {
      const title = item.querySelector('.title');
      if (title) {
        title.setAttribute('data-item', (index + 1).toString());
      }
    });

    // Cria barra de progresso
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'progress-bar-container';

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBarContainer.appendChild(progressBar);
    arrowsDiv.appendChild(progressBarContainer);

    // Eventos
    const nextBtn = carousel.querySelector('.next') as HTMLButtonElement;
    const prevBtn = carousel.querySelector('.prev') as HTMLButtonElement;

    nextBtn.addEventListener('click', () => this.handleSliderNavigation('next'));
    prevBtn.addEventListener('click', () => this.handleSliderNavigation('prev'));

    // Início
    this.autoNextTimeout = setTimeout(() => nextBtn.click(), this.TIME_AUTO_NEXT);
    this.resetAnimation();
    this.afterSlideChange();
  }

  resetAnimation() {
    const bar = this.runningTimeBarRef.nativeElement;
    bar.style.animation = 'none';
    bar.offsetHeight;
    bar.style.animation = `runningTime ${this.TIME_AUTO_NEXT / 3000}s linear forwards`;
  }

  handleSliderNavigation(direction: 'next' | 'prev') {
    const carousel = this.carouselRef.nativeElement;
    const list = this.listRef.nativeElement;
    const items = list.querySelectorAll('.item');

    if (direction === 'next') {
      list.appendChild(items[0]);
      carousel.classList.add('next');
    } else if (direction === 'prev') {
      list.prepend(items[items.length - 1]);
      carousel.classList.add('prev');
    }

    this.afterSlideChange();
  }

  afterSlideChange() {
    const list = this.listRef.nativeElement;
    const arrowsDiv = this.arrowsDivRef.nativeElement;
    const items = Array.from(list.querySelectorAll('.item')) as HTMLElement[];

    const oldNumber = arrowsDiv.querySelector('.slide-number');
    if (oldNumber) oldNumber.remove();

    const activeIndex = parseInt(items[1].querySelector('.title')?.getAttribute('data-item') || '1');
    const formatted = activeIndex < 10 ? `0${activeIndex}` : `${activeIndex}`;

    const div = document.createElement('div');
    div.classList.add('slide-number');
    div.textContent = `${formatted}/${items.length}`;
    // arrowsDiv.appendChild(div);

    this.updateProgressBar();
    this.resetCarouselState();
  }

  updateProgressBar() {
    const list = this.listRef.nativeElement;
    const totalSlides = this.items.length;
    const current = parseInt(list.querySelector('.item')?.querySelector('.title')?.getAttribute('data-item') || '1') + 1;
    const progress = (current / totalSlides) * 100;

    const progressBar = this.carouselRef.nativeElement.querySelector('.progress-bar') as HTMLElement;
    if (progressBar) progressBar.style.width = `${progress}%`;
  }

  resetCarouselState() {
    clearTimeout(this.transitionTimeout);
    clearTimeout(this.autoNextTimeout);

    const carousel = this.carouselRef.nativeElement;
    this.transitionTimeout = setTimeout(() => {
      carousel.classList.remove('next');
      carousel.classList.remove('prev');
    }, this.TIME_RUNNING);

    this.autoNextTimeout = setTimeout(() => {
      carousel.querySelector('.next').click();
    }, this.TIME_AUTO_NEXT);

    this.resetAnimation();
  }
}
