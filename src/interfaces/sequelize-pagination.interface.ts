export interface SequelizePagination<T = any> {
  items: T[];
  offset: number; // starting point of count (respect to total count) for current page
  totalItems: number; // total number of items across all pages
  totalPages: number; // total pages respect to item count per page
  itemCount: number; // per page items
  page: number; // current page being showed
}
