export interface Certificate {
  id: string;
  name: string;
  email: string;
  syllabus_name: string;
  syllabus_id: number | null;
  issue_date: string;
  certificate_image: string;
  certificate_code: string;
  created_at: string;
  user_id?: string;
}

export interface Syllabus {
  id: number;
  name: string;
}
