import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

const BASE_URL = '/codante-api/api/job-board';

export interface CodanteJob {
  id: number;
  title: string;
  company: string;
  company_website: string;
  city: string;
  schedule: string;
  salary: number;
  description: string;
  requirements: string;
  created_at: string;
  updated_at: string;
  number_of_positions?: number;
}

export interface JobListMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface JobListLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface JobListResponse {
  data: CodanteJob[];
  links: JobListLinks;
  meta: JobListMeta;
}

export interface JobDetailResponse {
  data: CodanteJob;
}

@Injectable({ providedIn: 'root' })
export class JobBoardService {
  constructor(private http: HttpClient) {}

  getJobs(params?: { search?: string; page?: number }): Observable<JobListResponse | null> {
    let httpParams = new HttpParams();
    if (params?.search?.trim()) httpParams = httpParams.set('search', params.search.trim());
    if (params?.page != null && params.page >= 1) httpParams = httpParams.set('page', params.page.toString());

    return this.http.get<JobListResponse>(`${BASE_URL}/jobs`, { params: httpParams }).pipe(
      catchError(() => of(null))
    );
  }

  getJobById(id: number): Observable<CodanteJob | null> {
    return this.http.get<JobDetailResponse>(`${BASE_URL}/jobs/${id}`).pipe(
      map((res) => res?.data ?? null),
      catchError(() => of(null))
    );
  }
}
