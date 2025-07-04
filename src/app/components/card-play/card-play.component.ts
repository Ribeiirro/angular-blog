import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { YoutubeService } from '../../services/youtube.service';
declare var YT: any; // Declara YT global da API

@Component({
  selector: 'app-card-play',
  imports: [CommonModule],
  templateUrl: './card-play.component.html',
  styleUrl: './card-play.component.css',
})
export class CardPlayComponent implements OnInit, AfterViewInit {
  @ViewChild('seekBarContainer') seekBarContainer?: ElementRef;
  @Input() selectedVideo: any;
  @Output() videoSelected = new EventEmitter<any>();
  player: any;
  videos: any[] = [];
  currIndex: number = 0;
  isPlaying = false;
  isBuffering = false;
  currentTime = '00:00';
  trackLength = '00:00';
  seekWidth = 0;
  seekHoverWidth = 0;
  seekTime = '00:00';
  isTrackTimeActive = false;
  errorMessage: string | null = null;

  currAlbum = 'Todah Music';
  currTrackName = '';
  bgArtworkUrl = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private youtubeService: YoutubeService
  ) {}

  ngOnInit() {
    this.loadVideos();
  }

  loadVideos() {
    this.youtubeService.getAllVideos().subscribe({
      next: (videos) => {
        this.videos = videos;
        console.log(
          'Total de vídeos no CardPlayComponent:',
          this.videos.length
        );
        this.errorMessage =
          videos.length > 0
            ? null
            : 'Nenhum vídeo disponível no cache. Tente novamente após o reinício da cota.';
        if (this.selectedVideo) {
          this.currIndex =
            this.videos.findIndex(
              (v) => v.videoId === this.selectedVideo.videoId
            ) || 0;
          this.updateTrackInfo();
        }
        if ((window as any)['YT'] && (window as any)['YT'].Player) {
          this.loadYouTubePlayer();
        } else {
          (window as any)['onYouTubeIframeAPIReady'] = () =>
            this.loadYouTubePlayer();
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar vídeos:', error);
        this.errorMessage = error.message.includes('Quota exceeded')
          ? 'A cota diária da API do YouTube foi excedida. Tente novamente amanhã às 04:00 ou limpe o cache para usar vídeos salvos.'
          : error.message.includes('API key not valid')
          ? 'Chave da API inválida. Contate o administrador.'
          : 'Erro ao carregar vídeos. Tente novamente mais tarde.';
        this.cdr.detectChanges();
      },
    });
  }

  clearCacheAndReload() {
    this.youtubeService.clearCache();
    this.loadVideos();
  }

  loadYouTubePlayer() {
    if (!this.videos.length) {
      console.error('Nenhum vídeo disponível para carregar o player');
      this.errorMessage = 'Nenhum vídeo disponível para reprodução.';
      this.cdr.detectChanges();
      return;
    }
    this.player = new (window as any).YT.Player('ytplayer', {
      height: '0',
      width: '0',
      videoId: this.videos[this.currIndex].videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event: any) => {
          console.log(
            'YouTube Player pronto:',
            this.videos[this.currIndex].videoId
          );
          this.updateTrackInfo();
          this.cdr.detectChanges();
        },
        onStateChange: (event: any) => {
          const state = event.data;
          this.isPlaying = state === (window as any).YT.PlayerState.PLAYING;
          this.isBuffering = state === (window as any).YT.PlayerState.BUFFERING;
          console.log('Estado do player:', state);
          this.cdr.detectChanges();
        },
        onError: (event: any) => {
          console.error('Erro no YouTube Player:', event.data);
          this.errorMessage =
            event.data === 150 || event.data === 101
              ? 'Vídeo não disponível para incorporação'
              : `Erro no player: ${event.data}`;
          this.cdr.detectChanges();
        },
      },
    });
  }

  updateTrackInfo() {
    if (this.videos[this.currIndex]) {
      this.currTrackName = this.videos[this.currIndex].title;
      this.bgArtworkUrl = this.videos[this.currIndex].thumbnail;
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit() {
    setInterval(() => this.updateCurrentTime(), 500);
  }

  ngOnChanges() {
    if (this.selectedVideo && this.videos.length > 0) {
      this.currIndex =
        this.videos.findIndex(
          (v) => v.videoId === this.selectedVideo.videoId
        ) || 0;
      this.updateTrackInfo();
      if (this.player) {
        this.loadVideo();
      } else {
        this.loadYouTubePlayer();
      }
    }
  }

  playPause(): void {
    if (!this.player) {
      console.error('Player não inicializado');
      return;
    }
    const state = this.player.getPlayerState();
    console.log('Estado atual do player:', state);
    if (state === (window as any).YT.PlayerState.PLAYING) {
      this.player.pauseVideo();
      this.isPlaying = false;
    } else {
      this.player.playVideo();
      this.isPlaying = true;
    }
    this.cdr.detectChanges();
  }

  selectTrack(flag: number): void {
    if (flag === 1) {
      this.currIndex = (this.currIndex + 1) % this.videos.length;
    } else if (flag === -1) {
      this.currIndex =
        (this.currIndex - 1 + this.videos.length) % this.videos.length;
    }
    this.updateTrackInfo();
    this.loadVideo();
    this.videoSelected.emit(this.videos[this.currIndex]); // Notificar CardComponent
  }

  loadVideo(): void {
    if (!this.player || !this.videos.length || !this.videos[this.currIndex]) {
      console.error('Player ou vídeos não disponíveis');
      return;
    }
    this.player.loadVideoById(this.videos[this.currIndex].videoId);
    this.seekWidth = 0;
    this.isTrackTimeActive = false;
    this.currentTime = '00:00';
    this.trackLength = '00:00';
    this.isPlaying = false;
    this.cdr.detectChanges();
  }

  updateCurrentTime(): void {
    if (!this.player || typeof this.player.getCurrentTime !== 'function')
      return;

    const current = this.player.getCurrentTime();
    const duration = this.player.getDuration();

    this.currentTime = this.formatTime(current);
    this.trackLength = this.formatTime(duration);
    this.seekWidth = (current / duration) * 100;

    this.isTrackTimeActive = !isNaN(current) && !isNaN(duration);
    this.cdr.detectChanges();
  }

  showHover(event: MouseEvent): void {
    if (!this.seekBarContainer || !this.player) return;

    const rect = this.seekBarContainer.nativeElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const duration = this.player.getDuration();
    const seekTo = duration * (offsetX / rect.width);

    this.seekHoverWidth = offsetX;
    this.seekTime = this.formatTime(seekTo);
    this.cdr.detectChanges();
  }

  hideHover(): void {
    this.seekHoverWidth = 0;
    this.seekTime = '00:00';
    this.cdr.detectChanges();
  }

  playFromClickedPos(event: MouseEvent): void {
    if (!this.seekBarContainer || !this.player) return;

    const rect = this.seekBarContainer.nativeElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const duration = this.player.getDuration();
    const seekTo = duration * (offsetX / rect.width);

    this.player.seekTo(seekTo, true);
    this.cdr.detectChanges();
  }

  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const sec = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${min}:${sec}`;
  }
}
// export class CardPlayComponent implements OnInit, AfterViewInit {
//   @ViewChild('seekBarContainer') seekBarContainer?: ElementRef;
//   @Input() selectedVideo: any;
//   @Output() videoSelected = new EventEmitter<any>(); // Emitir vídeo selecionado
//   player: any;
//   videos: any[] = [];
//   currIndex: number = 0;
//   isPlaying = false;
//   isBuffering = false;
//   currentTime = '00:00';
//   trackLength = '00:00';
//   seekWidth = 0;
//   seekHoverWidth = 0;
//   seekTime = '00:00';
//   isTrackTimeActive = false;

//   currAlbum = 'Todah Music';
//   currTrackName = '';
//   bgArtworkUrl = '';

//   constructor(
//     private cdr: ChangeDetectorRef,
//     private youtubeService: YoutubeService
//   ) {}

//   ngOnInit() {
//     this.youtubeService.getAllVideos().subscribe((videos) => {
//       this.videos = videos;
//       console.log('Vídeos carregados:', this.videos);
//       if (this.selectedVideo) {
//         this.currIndex = this.videos.findIndex(v => v.videoId === this.selectedVideo.videoId) || 0;
//         this.updateTrackInfo();
//       }
//       if ((window as any)['YT'] && (window as any)['YT'].Player) {
//         this.loadYouTubePlayer();
//       } else {
//         (window as any)['onYouTubeIframeAPIReady'] = () => this.loadYouTubePlayer();
//       }
//     });
//   }

//   ngAfterViewInit() {
//     setInterval(() => this.updateCurrentTime(), 500);
//   }

//   ngOnChanges() {
//     if (this.selectedVideo && this.videos.length > 0) {
//       this.currIndex = this.videos.findIndex(v => v.videoId === this.selectedVideo.videoId) || 0;
//       this.updateTrackInfo();
//       if (this.player) {
//         this.loadVideo();
//       } else {
//         this.loadYouTubePlayer();
//       }
//     }
//   }

//   loadYouTubePlayer() {
//     if (this.videos.length === 0 || !this.videos[this.currIndex]) {
//       console.error('Nenhum vídeo disponível para reprodução');
//       return;
//     }

//     if (this.player) {
//       this.player.destroy();
//     }

//     this.player = new (window as any).YT.Player('ytplayer', {
//       height: '0',
//       width: '0',
//       videoId: this.videos[this.currIndex].videoId,
//       playerVars: {
//         autoplay: 0,
//         controls: 0,
//         modestbranding: 1,
//         rel: 0,
//         showinfo: 0,
//       },
//       events: {
//         onReady: (event: any) => {
//           console.log('YouTube Player pronto:', this.videos[this.currIndex].videoId);
//           this.updateCurrentTime();
//           this.cdr.detectChanges();
//         },
//         onStateChange: (event: any) => {
//           const state = event.data;
//           this.isPlaying = state === (window as any).YT.PlayerState.PLAYING;
//           this.isBuffering = state === (window as any).YT.PlayerState.BUFFERING;
//           console.log('Estado do player:', state);
//           this.cdr.detectChanges();
//         },
//         onError: (event: any) => {
//           console.error('Erro no YouTube Player:', event.data);
//         },
//       },
//     });
//   }

//   playPause(): void {
//     if (!this.player) {
//       console.error('Player não inicializado');
//       return;
//     }
//     const state = this.player.getPlayerState();
//     console.log('Estado atual do player:', state);
//     if (state === (window as any).YT.PlayerState.PLAYING) {
//       this.player.pauseVideo();
//       this.isPlaying = false;
//     } else {
//       this.player.playVideo();
//       this.isPlaying = true;
//     }
//     this.cdr.detectChanges();
//   }

//   selectTrack(flag: number): void {
//     if (flag === 1) {
//       this.currIndex = (this.currIndex + 1) % this.videos.length;
//     } else if (flag === -1) {
//       this.currIndex = (this.currIndex - 1 + this.videos.length) % this.videos.length;
//     }
//     this.updateTrackInfo();
//     this.loadVideo();
//     this.videoSelected.emit(this.videos[this.currIndex]); // Notificar CardComponent
//   }

//   updateTrackInfo(): void {
//     const video = this.videos[this.currIndex];
//     if (video) {
//       this.currTrackName = video.title.includes('|') ? video.title.split('|')[1].trim() : video.title;
//       this.bgArtworkUrl = video.thumbnail;
//       console.log('Thumbnail atualizada:', this.bgArtworkUrl);
//       this.cdr.detectChanges();
//     } else {
//       console.error('Vídeo não encontrado para o índice:', this.currIndex);
//       this.bgArtworkUrl = 'assets/logo.jpg';
//       this.cdr.detectChanges();
//     }
//   }

//   loadVideo(): void {
//     if (!this.player || !this.videos.length || !this.videos[this.currIndex]) {
//       console.error('Player ou vídeos não disponíveis');
//       return;
//     }
//     this.player.loadVideoById(this.videos[this.currIndex].videoId);
//     this.seekWidth = 0;
//     this.isTrackTimeActive = false;
//     this.currentTime = '00:00';
//     this.trackLength = '00:00';
//     this.isPlaying = false;
//     this.cdr.detectChanges();
//   }

//   updateCurrentTime(): void {
//     if (!this.player || typeof this.player.getCurrentTime !== 'function') return;

//     const current = this.player.getCurrentTime();
//     const duration = this.player.getDuration();

//     this.currentTime = this.formatTime(current);
//     this.trackLength = this.formatTime(duration);
//     this.seekWidth = (current / duration) * 100;

//     this.isTrackTimeActive = !isNaN(current) && !isNaN(duration);
//     this.cdr.detectChanges();
//   }

//   showHover(event: MouseEvent): void {
//     if (!this.seekBarContainer || !this.player) return;

//     const rect = this.seekBarContainer.nativeElement.getBoundingClientRect();
//     const offsetX = event.clientX - rect.left;
//     const duration = this.player.getDuration();
//     const seekTo = duration * (offsetX / rect.width);

//     this.seekHoverWidth = offsetX;
//     this.seekTime = this.formatTime(seekTo);
//     this.cdr.detectChanges();
//   }

//   hideHover(): void {
//     this.seekHoverWidth = 0;
//     this.seekTime = '00:00';
//     this.cdr.detectChanges();
//   }

//   playFromClickedPos(event: MouseEvent): void {
//     if (!this.seekBarContainer || !this.player) return;

//     const rect = this.seekBarContainer.nativeElement.getBoundingClientRect();
//     const offsetX = event.clientX - rect.left;
//     const duration = this.player.getDuration();
//     const seekTo = duration * (offsetX / rect.width);

//     this.player.seekTo(seekTo, true);
//     this.cdr.detectChanges();
//   }

//   formatTime(seconds: number): string {
//     const min = Math.floor(seconds / 60).toString().padStart(2, '0');
//     const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
//     return `${min}:${sec}`;
//   }
// }
