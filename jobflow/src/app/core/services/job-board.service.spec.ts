import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { JobBoardService } from './job-board.service';

describe('JobBoardService', () => {
  let httpMock: HttpTestingController;
  let service: JobBoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(JobBoardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('getJobs pede /codante-api/api/job-board/jobs', async () => {
    const mock = {
      data: [],
      links: { first: '', last: '', prev: null, next: null },
      meta: {
        current_page: 1,
        from: 0,
        last_page: 1,
        path: '',
        per_page: 10,
        to: 0,
        total: 0,
      },
    };
    const promise = firstValueFrom(service.getJobs());
    const req = httpMock.expectOne(
      (r) => r.url.includes('/codante-api/api/job-board/jobs') && r.method === 'GET',
    );
    req.flush(mock);
    expect(await promise).toEqual(mock);
  });

  it('getJobs com search e page envia query params', async () => {
    const promise = firstValueFrom(service.getJobs({ search: 'dev', page: 2 }));
    const req = httpMock.expectOne((r) => {
      return (
        r.url.includes('/jobs') &&
        r.params.get('search') === 'dev' &&
        r.params.get('page') === '2'
      );
    });
    req.flush(null as never);
    expect(await promise).toBeNull();
  });

  it('getJobs em erro HTTP devolve null', async () => {
    const promise = firstValueFrom(service.getJobs());
    httpMock.expectOne((r) => r.url.includes('/jobs')).flush('err', {
      status: 500,
      statusText: 'Error',
    });
    expect(await promise).toBeNull();
  });
});
