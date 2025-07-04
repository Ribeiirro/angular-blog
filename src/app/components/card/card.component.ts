import { Component, OnInit } from '@angular/core';
import { CardPlayComponent } from '../card-play/card-play.component';
import { YoutubeService } from 'src/app/services/youtube.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [CardPlayComponent, CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
})

export class CardComponent implements OnInit {
  videos: any[] = [];
  selectedVideo: any;

  constructor(private youtubeService: YoutubeService) {}

  ngOnInit(): void {
    this.youtubeService.getLatestVideos(5).subscribe(({ items }) => {
      this.videos = items;
      this.selectedVideo = this.videos[0]; // Define o primeiro como padrão
      console.log('Vídeos do CardComponent:', this.videos);
    });
  }

  selectVideo(video: any): void {
    this.selectedVideo = video;
  }

  onVideoSelected(video: any): void {
    // Verificar se o vídeo está na lista limitada de 5
    const isInList = this.videos.some(v => v.videoId === video.videoId);
    this.selectedVideo = isInList ? video : null; // Remover selectedVideo se não estiver na lista
  }

  get artist(): string {
    return this.selectedVideo?.title?.split('|')[0]?.trim() ?? 'Desconhecido';
  }

  get musicTitle(): string {
    return this.selectedVideo?.title?.split('|')[1]?.trim() ?? this.selectedVideo?.title;
  }
}
