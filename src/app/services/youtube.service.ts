
  // private apiKey = environment.YOUTUBE_API_KEY;
  // private channelId = 'UCpf5YXmzGHC4m5uLCdlrrfA';

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, concatMap, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

// Interface para a resposta do endpoint /search
interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  items: {
    id: { kind: string; videoId?: string };
    snippet: { title: string; thumbnails: { medium: { url: string } } };
  }[];
}

// Interface para a resposta do endpoint /videos
interface YouTubeVideosResponse {
  kind: string;
  etag: string;
  items: {
    id: string;
    status: { embeddable: boolean };
  }[];
}

// Interface para o resultado do getLatestVideos
interface VideoResult {
  items: { title: string; videoId: string; thumbnail: string }[];
  nextPageToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {
  private apiKey = environment.YOUTUBE_API_KEY;
  private channelId = 'UCpf5YXmzGHC4m5uLCdlrrfA';

  constructor(private http: HttpClient) {}

  getLatestVideos(maxResults: number = 10, pageToken: string = ''): Observable<VideoResult> {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${this.apiKey}&channelId=${this.channelId}&part=snippet,id&order=date&maxResults=${maxResults}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    return this.http.get<YouTubeSearchResponse>(url, {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
    }).pipe(
      map(response => {
        if (!response || !response.items) {
          throw new Error('Resposta inválida da API do YouTube');
        }
        return {
          items: response.items
            .filter((item: any) => item.id.kind === 'youtube#video')
            .map((item: any) => ({
              title: item.snippet.title,
              videoId: item.id.videoId,
              thumbnail: item.snippet.thumbnails.medium.url,
            })),
          nextPageToken: response.nextPageToken || ''
        };
      }),
      concatMap(data => {
        const videoIds = data.items.map(item => item.videoId).join(',');
        if (!videoIds) {
          return of(data);
        }
        return this.http.get<YouTubeVideosResponse>(`https://www.googleapis.com/youtube/v3/videos?key=${this.apiKey}&id=${videoIds}&part=status`, {
          headers: new HttpHeaders({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          })
        }).pipe(
          map(videoResponse => {
            // Garante que os índices correspondam e filtra vídeos incorporáveis
            const embeddableMap = new Map(videoResponse.items.map(item => [item.id, item.status.embeddable]));
            return {
              ...data,
              items: data.items.filter(item => embeddableMap.get(item.videoId) === true)
            };
          })
        );
      }),
      catchError(error => {
        console.error('Erro na requisição à API do YouTube:', error);
        const errorMessage = error.error?.error?.message || 'Falha na requisição à API do YouTube';
        return throwError(() => new Error(`Erro ${error.status || 'desconhecido'}: ${errorMessage}`));
      })
    );
  }

  getAllVideos(): Observable<any[]> {
    const cachedVideos = localStorage.getItem('youtubeVideos');
    if (cachedVideos) {
      const videos = JSON.parse(cachedVideos);
      console.log('Carregando vídeos do cache:', videos.length);
      return of(videos);
    }

    let allVideos: any[] = [];
    const maxPages = 1; // Limitado a 1 página (50 vídeos) para economizar cota

    const fetchVideos = (token: string, pageCount: number = 0): Observable<any[]> => {
      if (pageCount >= maxPages) {
        localStorage.setItem('youtubeVideos', JSON.stringify(allVideos));
        console.log('Vídeos salvos no cache:', allVideos.length);
        return of(allVideos);
      }
      return this.getLatestVideos(50, token).pipe(
        concatMap(response => {
          allVideos = [...allVideos, ...response.items];
          pageCount++;
          if (response.nextPageToken && pageCount < maxPages) {
            return fetchVideos(response.nextPageToken, pageCount);
          } else {
            localStorage.setItem('youtubeVideos', JSON.stringify(allVideos));
            console.log('Vídeos salvos no cache:', allVideos.length);
            return of(allVideos);
          }
        }),
        catchError(error => {
          console.error('Erro ao carregar todos os vídeos:', error);
          return throwError(() => error);
        })
      );
    };

    return fetchVideos('');
  }

  clearCache(): void {
    localStorage.removeItem('youtubeVideos');
    console.log('Cache de vídeos limpo');
  }
}