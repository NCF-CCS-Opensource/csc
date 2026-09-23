import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

export function TableSkeletonBody({ rows, columns }: Readonly<{ rows: number; columns: number }>) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, row) => (
        <TableRow key={`row-${row}`}>
          {Array.from({ length: columns }).map((_, col) => (
            <TableCell key={`row-${row}-col-${col}`}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
