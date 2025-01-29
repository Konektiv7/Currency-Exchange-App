import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private apiUrl = 'https://api.nbp.pl/api/exchangerates/tables/A';

  constructor(private http: HttpClient) {}

  // Pobiera kursy dla konkretnej daty
  getExchangeRatesByDate(date: string): Observable<any> {
    const url = `${this.apiUrl}/${date}/?format=json`;
    return this.http.get<any[]>(url).pipe(
      catchError((err) => {
        console.error(`Brak danych dla daty ${date}:`, err);
        return of(null);
      })
    );
  }

  // Pobiera kursy dla zakresu dat
  getExchangeRatesForDateRange(startDate: string, endDate: string): Observable<any> {
    const url = `${this.apiUrl}/${startDate}/${endDate}/?format=json`;
    return this.http.get<any[]>(url).pipe(
      catchError((err) => {
        console.error(`Brak danych dla zakresu ${startDate} - ${endDate}:`, err);
        return of(null);
      })
    );
  }

  // Pobiera ostatnie dostępne kursy
  getLatestExchangeRates(): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/?format=json`).pipe(
      catchError((err) => {
        console.error('Błąd podczas pobierania najnowszych kursów:', err);
        return of(null);
      })
    );
  }

  // Metoda do pobierania danych dla całego roku
  getExchangeRatesForYear(year: string): Observable<any> {
    // Dzieli rok na kwartały
    const q1 = this.getExchangeRatesForDateRange(`${year}-01-01`, `${year}-03-31`);
    const q2 = this.getExchangeRatesForDateRange(`${year}-04-01`, `${year}-06-30`);
    const q3 = this.getExchangeRatesForDateRange(`${year}-07-01`, `${year}-09-30`);
    const q4 = this.getExchangeRatesForDateRange(`${year}-10-01`, `${year}-12-31`);

    return forkJoin([q1, q2, q3, q4]).pipe(
      map(results => {
        // Łączy wyniki ze wszystkich kwartałów
        return results
          .filter(result => result !== null)
          .reduce((acc, curr) => acc.concat(curr), []);
      }),
      catchError(error => {
        console.error('Błąd podczas pobierania danych rocznych:', error);
        return of(null);
      })
    );
  }
}