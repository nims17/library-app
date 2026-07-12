export type Role = "admin" | "member";

export type Profile = {
  id: string;
  display_name: string | null;
  role: Role;
  member_since: string;
};

export type BookStatus = "available" | "checked_out";

export type Book = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  genre: string | null;
  dewey_decimal: string | null;
  status: BookStatus;
  created_at: string;
};

export type CheckoutRequestStatus = "pending" | "approved" | "denied";

export type CheckoutRequest = {
  id: string;
  book_id: string;
  requested_by: string;
  status: CheckoutRequestStatus;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
};

export type Loan = {
  id: string;
  book_id: string;
  user_id: string;
  checked_out_at: string;
  returned_at: string | null;
  recorded_by: string | null;
};

export type WaitlistEntry = {
  id: string;
  book_id: string;
  user_id: string;
  requested_at: string;
};

export type NewBookRequestStatus = "pending" | "added" | "declined";

export type NewBookRequest = {
  id: string;
  requested_by: string;
  title: string;
  author: string | null;
  note: string | null;
  status: NewBookRequestStatus;
  created_at: string;
};

export type Review = {
  id: string;
  book_id: string;
  user_id: string;
  rating: number | null;
  thoughts: string | null;
  created_at: string;
};
