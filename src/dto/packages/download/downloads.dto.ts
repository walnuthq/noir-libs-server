export class DownloadsDto {
  downloadDates: string[];

  constructor(downloadDates: string[]) {
    this.downloadDates = downloadDates;
  }
}
