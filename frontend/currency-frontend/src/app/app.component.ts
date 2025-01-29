import { Component, OnInit } from '@angular/core';
import { CurrencyService } from './services/currency.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type TimeRange = 'day' | 'month' | 'quarter' | 'year';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container" style="padding: 20px;">
      <h1>Kursy Walut</h1>

      <!-- Wybór zakresu czasowego -->
      <div style="margin-bottom: 20px;">
        <label style="margin-right: 20px;">
          Zakres czasowy:
          <select [(ngModel)]="selectedTimeRange" (change)="onTimeRangeChange()" style="margin-left: 10px;">
            <option value="day">Dzień</option>
            <option value="month">Miesiąc</option>
            <option value="quarter">Kwartał</option>
            <option value="year">Rok</option>
          </select>
        </label>

        <!-- Wybór daty dla pojedynczego dnia -->
        <div *ngIf="selectedTimeRange === 'day'" style="margin-top: 10px;">
          <label>
            Wybierz datę:
            <input type="date" [(ngModel)]="selectedDate">
          </label>
        </div>

        <!-- Wybór miesiąca -->
        <div *ngIf="selectedTimeRange === 'month'" style="margin-top: 10px;">
          <label style="margin-right: 20px;">
            Data początkowa:
            <input type="date" [(ngModel)]="startDate">
          </label>
          <label>
            Data końcowa:
            <input type="date" [(ngModel)]="endDate">
          </label>
        </div>

        <!-- Wybór kwartału -->
        <div *ngIf="selectedTimeRange === 'quarter'" style="margin-top: 10px;">
          <label style="margin-right: 20px;">
            Rok:
            <select [(ngModel)]="selectedYear" style="margin-left: 10px;">
              <option *ngFor="let year of availableYears" [value]="year">{{ year }}</option>
            </select>
          </label>
          <label style="margin-right: 20px;">
            Kwartał:
            <select [(ngModel)]="selectedQuarter" style="margin-left: 10px;">
              <option value="1">I kwartał (sty-mar)</option>
              <option value="2">II kwartał (kwi-cze)</option>
              <option value="3">III kwartał (lip-wrz)</option>
              <option value="4">IV kwartał (paź-gru)</option>
            </select>
          </label>
        </div>

        <!-- Wybór roku -->
        <div *ngIf="selectedTimeRange === 'year'" style="margin-top: 10px;">
          <label>
            Rok:
            <select [(ngModel)]="selectedYear" style="margin-left: 10px;">
              <option *ngFor="let year of availableYears" [value]="year">{{ year }}</option>
            </select>
          </label>
        </div>

        <!-- Przycisk pobierania danych -->
        <div style="margin-top: 20px;">
          <button 
            (click)="fetchData()" 
            style="padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;"
            [disabled]="isLoading"
          >
            {{ isLoading ? 'Ładowanie...' : 'Pobierz kursy' }}
          </button>
        </div>
      </div>

      <!-- Loader -->
      <div *ngIf="isLoading" style="text-align: center; margin: 20px 0;">
        Pobieranie danych...
      </div>

      <!-- Tabela kursów walut -->
      <div style="overflow-x: auto;">
        <table *ngIf="exchangeRates?.length" border="1" style="margin-top: 20px; width: 100%;">
          <thead>
            <tr>
              <th>Data</th>
              <th>Waluta</th>
              <th>Kod</th>
              <th>Kurs</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let dateRates of exchangeRates">
              <tr *ngFor="let rate of dateRates.rates">
                <td>{{ dateRates.effectiveDate }}</td>
                <td>{{ rate.currency }}</td>
                <td>{{ rate.code }}</td>
                <td>{{ rate.mid }}</td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>

      <!-- Komunikat o braku danych -->
      <div *ngIf="(!exchangeRates || exchangeRates.length === 0) && dataRequested" 
           style="color: red; margin-top: 20px;">
        Brak danych dla wybranego okresu. Spróbuj wybrać inny zakres dat.
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit {
  selectedTimeRange: TimeRange = 'day';
  selectedDate: string | null = null;
  startDate: string | null = null;
  endDate: string | null = null;
  selectedYear: string = new Date().getFullYear().toString();
  selectedQuarter: string = '1';
  exchangeRates: any[] | null = null;
  availableYears: number[] = [];
  dataRequested: boolean = false;
  isLoading: boolean = false;

  constructor(private currencyService: CurrencyService) {
    // Generuje listę lat (od 2002 do obecnego)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2002; year--) {
      this.availableYears.push(year);
    }
  }

  ngOnInit() {
    // Usuwa automatyczne pobieranie przy starcie
  }

  onTimeRangeChange(): void {
    this.selectedDate = null;
    this.startDate = null;
    this.endDate = null;
    this.exchangeRates = null;
    this.dataRequested = false;
  }

  fetchData(): void {
    this.isLoading = true;
    this.dataRequested = true;

    switch (this.selectedTimeRange) {
      case 'day':
        if (this.selectedDate) {
          this.fetchDayData();
        }
        break;
      case 'month':
        if (this.startDate && this.endDate) {
          this.fetchRangeData();
        }
        break;
      case 'quarter':
        if (this.selectedYear && this.selectedQuarter) {
          this.fetchQuarterData();
        }
        break;
      case 'year':
        if (this.selectedYear) {
          this.fetchYearData();
        }
        break;
    }
  }

  private fetchDayData(): void {
    this.currencyService.getExchangeRatesByDate(this.selectedDate!)
      .subscribe({
        next: (data) => {
          this.exchangeRates = data;
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
  }

  private fetchRangeData(): void {
    this.currencyService.getExchangeRatesForDateRange(this.startDate!, this.endDate!)
      .subscribe({
        next: (data) => {
          this.exchangeRates = data;
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
  }

  private fetchQuarterData(): void {
    const quarterDates = this.getQuarterDates(
      parseInt(this.selectedYear), 
      parseInt(this.selectedQuarter)
    );
    
    this.currencyService.getExchangeRatesForDateRange(quarterDates.start, quarterDates.end)
      .subscribe({
        next: (data) => {
          this.exchangeRates = data;
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
  }

  private fetchYearData(): void {
    this.currencyService.getExchangeRatesForYear(this.selectedYear)
      .subscribe({
        next: (data) => {
          this.exchangeRates = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Błąd podczas pobierania danych rocznych:', error);
          this.exchangeRates = null;
          this.isLoading = false;
        }
      });
  }

  private getQuarterDates(year: number, quarter: number): { start: string, end: string } {
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0);
    
    return {
      start: this.formatDate(startDate),
      end: this.formatDate(endDate)
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}