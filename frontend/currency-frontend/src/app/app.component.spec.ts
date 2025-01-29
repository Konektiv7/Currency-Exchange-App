import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { CurrencyService } from './services/currency.service';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

const mockExchangeRates = {
  table: 'A',
  effectiveDate: '2024-01-10',
  rates: [
    { currency: 'euro', code: 'EUR', mid: 4.5 },
    { currency: 'dolar amerykański', code: 'USD', mid: 3.8 },
  ],
};

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let currencyService: CurrencyService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [CurrencyService],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    currencyService = TestBed.inject(CurrencyService);
    fixture.detectChanges();
  });

  it('powinien stworzyć komponent', () => {
    expect(component).toBeTruthy();
  });

  describe('Przycisk pobierania kursów', () => {
    it('powinien być widoczny', () => {
      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeTruthy();
      expect(button.nativeElement.textContent).toContain('Pobierz kursy');
    });

    it('powinien być wyłączony podczas ładowania', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.disabled).toBeTrue();
      expect(button.nativeElement.textContent).toContain('Ładowanie...');
    });

    it('powinien wywołać odpowiednią metodę przy wyborze dnia', () => {
      spyOn(currencyService, 'getExchangeRatesByDate').and.returnValue(of([mockExchangeRates]));
      
      component.selectedTimeRange = 'day';
      component.selectedDate = '2024-01-10';
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      button.nativeElement.click();

      expect(currencyService.getExchangeRatesByDate).toHaveBeenCalledWith('2024-01-10');
    });

    it('powinien wywołać odpowiednią metodę przy wyborze zakresu dat', () => {
      spyOn(currencyService, 'getExchangeRatesForDateRange').and.returnValue(of([mockExchangeRates]));
      
      component.selectedTimeRange = 'month';
      component.startDate = '2024-01-01';
      component.endDate = '2024-01-31';
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      button.nativeElement.click();

      expect(currencyService.getExchangeRatesForDateRange)
        .toHaveBeenCalledWith('2024-01-01', '2024-01-31');
    });
  });

  describe('Wyświetlanie danych w tabeli', () => {
    it('powinien wyświetlać tabelę tylko gdy są dane', () => {
      component.exchangeRates = null;
      fixture.detectChanges();
      
      let table = fixture.debugElement.query(By.css('table'));
      expect(table).toBeFalsy();

      component.exchangeRates = [mockExchangeRates];
      fixture.detectChanges();
      
      table = fixture.debugElement.query(By.css('table'));
      expect(table).toBeTruthy();
    });

    it('powinien poprawnie wyświetlać dane w tabeli', () => {
      component.exchangeRates = [mockExchangeRates];
      fixture.detectChanges();

      const tableRows = fixture.debugElement.queryAll(By.css('table tbody tr'));
      expect(tableRows.length).toBe(2);

      // Sprawdzanie pierwszego wiersza
      const firstRow = tableRows[0];
      expect(firstRow.nativeElement.textContent).toContain('euro');
      expect(firstRow.nativeElement.textContent).toContain('EUR');
      expect(firstRow.nativeElement.textContent).toContain('4.5');
      expect(firstRow.nativeElement.textContent).toContain('2024-01-10');

      // Sprawdzanie drugiego wiersza
      const secondRow = tableRows[1];
      expect(secondRow.nativeElement.textContent).toContain('dolar amerykański');
      expect(secondRow.nativeElement.textContent).toContain('USD');
      expect(secondRow.nativeElement.textContent).toContain('3.8');
    });

    it('powinien wyświetlać komunikat o braku danych', () => {
      component.exchangeRates = null;
      component.dataRequested = true;
      fixture.detectChanges();

      const errorMessage = fixture.debugElement.query(By.css('div[style*="color: red"]'));
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.nativeElement.textContent)
        .toContain('Brak danych dla wybranego okresu');
    });

    it('powinien wyświetlać wszystkie wymagane kolumny', () => {
      component.exchangeRates = [mockExchangeRates];
      fixture.detectChanges();

      const headers = fixture.debugElement.queryAll(By.css('table thead th'));
      expect(headers.length).toBe(4);
      expect(headers[0].nativeElement.textContent).toContain('Data');
      expect(headers[1].nativeElement.textContent).toContain('Waluta');
      expect(headers[2].nativeElement.textContent).toContain('Kod');
      expect(headers[3].nativeElement.textContent).toContain('Kurs');
    });
  });
});