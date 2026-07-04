export type ClassStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export type ClassCategory = "Professional Training" | "University Subjects";

export interface PhysicalClass {
  id: string;
  title: string;
  category: ClassCategory;
  course_code: string;
  description: string;
  location: string;
  start_date: string;
  timing: string;
  duration_weeks: number;
  price: number;
  discount_price: number | null;
  max_seats: number;
  enrolled_count: number;
  syllabus_id: number | null;
  status: ClassStatus;
  is_active: boolean;
  instructor_name: string | null;
  instructor_image_url: string | null;
  course_image_url: string | null;
  learning_outcomes: any;
  created_at: string;
  updated_at: string;
}