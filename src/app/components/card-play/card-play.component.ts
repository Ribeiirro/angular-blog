import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-card-play',
  imports: [CommonModule],
  templateUrl: './card-play.component.html',
  styleUrl: './card-play.component.css',
})

export class CardPlayComponent implements OnInit, AfterViewInit {
  @ViewChild('seekBarContainer') seekBarContainer?: ElementRef;
  @ViewChild('audioElement') audioElement?: ElementRef<HTMLAudioElement>;

  albums: string[] = ['أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ'];
  trackNames: string[] = ['001 Surah Al-Fatihah'];
  albumArtworks: string[] = ['_1'];
  trackUrls: string[] = [
    'https://file.garden/Z-a1C4tJlx8uXKO5/hmmmm/001%20%20%20Surah%20Al%20Fatiha%20by%20Mishary%20Al%20Afasy%20(iRecite).mp3'
  ];

  currIndex: number = 0;
  currAlbum: string = '';
  currTrackName: string = '';
  currArtwork: string = '';
  bgArtworkUrl: string = '';
  isPlaying: boolean = false;
  currentTime: string = '00:00';
  trackLength: string = '00:00';
  seekTime: string = '00:00';
  seekWidth: number = 0;
  seekHoverWidth: number = 0;
  isTrackTimeActive: boolean = false;
  isBuffering: boolean = false;
  playProgress: number = 0;
  private buffInterval: any = null;
  private lastBufferTime: number = 0;
  private lastUpdateTime: number = 0;
  private tFlag: boolean = false;
  private playingPromise: Promise<void> | null = null;
  private isProcessingPlayPause: boolean = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.currIndex = 0;
    this.currAlbum = this.albums[0];
    this.currTrackName = this.trackNames[0];
    this.currArtwork = this.albumArtworks[0];
    this.bgArtworkUrl = `https://raw.githubusercontent.com/himalayasingh/music-player-1/master/img/${this.currArtwork}.jpg`;
  }

  ngAfterViewInit(): void {
    if (this.audioElement && this.seekBarContainer) {
      this.initPlayer();
    } else {
      console.error('audioElement or seekBarContainer is not defined in the template.');
    }
  }

  playPause(): void {
    if (!this.audioElement || this.isProcessingPlayPause) return;

    this.isProcessingPlayPause = true;
    const audio = this.audioElement.nativeElement;

    if (audio.paused) {
      this.isPlaying = true;
      this.playingPromise = audio.play().then(() => {
        this.checkBuffering();
        this.isProcessingPlayPause = false;
        this.cdr.detectChanges();
      }).catch((error) => {
        console.error('Error playing audio:', error);
        this.isPlaying = false;
        this.isProcessingPlayPause = false;
        this.cdr.detectChanges();
      });
    } else {
      if (this.playingPromise) {
        this.playingPromise.then(() => {
          audio.pause();
          this.isPlaying = false;
          clearInterval(this.buffInterval);
          this.isBuffering = false;
          this.isProcessingPlayPause = false;
          this.cdr.detectChanges();
        });
      } else {
        audio.pause();
        this.isPlaying = false;
        clearInterval(this.buffInterval);
        this.isBuffering = false;
        this.isProcessingPlayPause = false;
        this.cdr.detectChanges();
      }
    }
  }

  showHover(event: MouseEvent): void {
    if (!this.seekBarContainer || !this.audioElement) return;

    const seekBarPos = this.seekBarContainer.nativeElement.getBoundingClientRect();
    const seekT = event.clientX - seekBarPos.left;
    const audio = this.audioElement.nativeElement;
    const seekLoc = audio.duration * (seekT / seekBarPos.width);

    this.seekHoverWidth = seekT;

    const cM = seekLoc / 60;
    let ctMinutes = Math.floor(cM);
    let ctSeconds = Math.floor(seekLoc - ctMinutes * 60);

    if (ctMinutes < 0 || ctSeconds < 0) return;

    const formattedMinutes = ctMinutes.toString().padStart(2, '0');
    const formattedSeconds = ctSeconds.toString().padStart(2, '0');

    this.seekTime = isNaN(ctMinutes) || isNaN(ctSeconds) ? '--:--' : `${formattedMinutes}:${formattedSeconds}`;
    this.cdr.detectChanges();
  }

  hideHover(): void {
    this.seekHoverWidth = 0;
    this.seekTime = '00:00';
    this.cdr.detectChanges();
  }

  playFromClickedPos(event: MouseEvent): void {
    if (!this.seekBarContainer || !this.audioElement) return;

    const seekBarPos = this.seekBarContainer.nativeElement.getBoundingClientRect();
    const seekT = event.clientX - seekBarPos.left;
    const audio = this.audioElement.nativeElement;
    const seekLoc = audio.duration * (seekT / seekBarPos.width);
    audio.currentTime = seekLoc;
    this.seekWidth = seekT;
    this.hideHover();
    this.cdr.detectChanges();
  }

  updateCurrTime(): void {
    if (!this.audioElement) return;

    const audio = this.audioElement.nativeElement;
    this.lastUpdateTime = new Date().getTime();

    if (!this.tFlag) {
      this.tFlag = true;
      this.isTrackTimeActive = true;
    }

    let curMinutes = Math.floor(audio.currentTime / 60);
    let curSeconds = Math.floor(audio.currentTime - curMinutes * 60);
    let durMinutes = Math.floor(audio.duration / 60);
    let durSeconds = Math.floor(audio.duration - durMinutes * 60);

    this.playProgress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;

    const formattedCurMinutes = curMinutes.toString().padStart(2, '0');
    const formattedCurSeconds = curSeconds.toString().padStart(2, '0');
    const formattedDurMinutes = durMinutes.toString().padStart(2, '0');
    const formattedDurSeconds = durSeconds.toString().padStart(2, '0');

    this.currentTime = isNaN(curMinutes) || isNaN(curSeconds) ? '00:00' : `${formattedCurMinutes}:${formattedCurSeconds}`;
    this.trackLength = isNaN(durMinutes) || isNaN(durSeconds) ? '00:00' : `${formattedDurMinutes}:${formattedDurSeconds}`;

    if (isNaN(curMinutes) || isNaN(curSeconds) || isNaN(durMinutes) || isNaN(durSeconds)) {
      this.isTrackTimeActive = false;
    } else {
      this.isTrackTimeActive = true;
    }

    this.seekWidth = this.playProgress;

    if (this.playProgress >= 100) {
      this.isPlaying = false;
      this.seekWidth = 0;
      this.currentTime = '00:00';
      this.isBuffering = false;
      clearInterval(this.buffInterval);
    }

    this.cdr.detectChanges();
  }

  checkBuffering(): void {
    clearInterval(this.buffInterval);
    this.buffInterval = setInterval(() => {
      const currentTime = new Date().getTime();
      if (this.lastUpdateTime === 0 || currentTime - this.lastUpdateTime > 1000) {
        this.isBuffering = true;
      } else {
        this.isBuffering = false;
      }
      this.lastBufferTime = currentTime;
      this.cdr.detectChanges();
    }, 100);
  }

  selectTrack(flag: number): void {
    if (!this.audioElement) return;

    this.currIndex = 0; // Single track, so keep index at 0

    this.seekWidth = 0;
    this.isTrackTimeActive = false;
    this.currentTime = '00:00';
    this.trackLength = '00:00';

    this.currAlbum = this.albums[0];
    this.currTrackName = this.trackNames[0];
    this.currArtwork = this.albumArtworks[0];
    this.bgArtworkUrl = `https://raw.githubusercontent.com/himalayasingh/music-player-1/master/img/${this.currArtwork}.jpg`;

    const audio = this.audioElement.nativeElement;
    audio.src = this.trackUrls[this.currIndex];
    this.lastUpdateTime = 0;
    this.lastBufferTime = new Date().getTime();

    if (flag !== 0) {
      this.isPlaying = true;
      this.playingPromise = audio.play().then(() => {
        this.checkBuffering();
        this.cdr.detectChanges();
      }).catch((error) => {
        console.error('Error playing audio:', error);
        this.isPlaying = false;
        this.cdr.detectChanges();
      });
    } else {
      this.cdr.detectChanges();
    }
  }

  initPlayer(): void {
    if (!this.audioElement) {
      console.error('Audio element not found in the template.');
      return;
    }

    const audio = this.audioElement.nativeElement;
    audio.loop = false;
    audio.addEventListener('timeupdate', () => this.updateCurrTime());
    audio.addEventListener('ended', () => this.selectTrack(1));
    this.selectTrack(0);
  }
}