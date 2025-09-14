
export type ProgressRecord = {
  id: string;
  subject: string;
  score: number;
  classroom_id: string;
  student_id: string;
  teacher_id: string;
  profile: { 
    full_name: string 
  };
};

export type Classroom = {
  id: string;
  name: string;
  subject: string;
  teacher_id: string;
};

export type Teacher = {
  id: string;
  full_name: string;
  subject?: string;
};