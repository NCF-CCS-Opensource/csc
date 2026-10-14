import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

export function TableSkeletonBody({ rows, columns }: Readonly<{ rows: number; columns: number }>) {
  return (
    <TableBody>
      {Array.from({ length: rows }, (_, i) => `row-${i}`).map((rowKey) => (
        <TableRow key={rowKey}>
          {Array.from({ length: columns }).map((_, col) => (
            <TableCell key={`${rowKey}-col-${col}`}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
