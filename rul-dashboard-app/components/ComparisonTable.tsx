import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Literature } from "@/lib/types";

export default function ComparisonTable({ data }: { data: Literature }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card/40">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[200px]">Model</TableHead>
            <TableHead>Dataset</TableHead>
            <TableHead>RMSE</TableHead>
            <TableHead>NASA score</TableHead>
            <TableHead className="min-w-[220px]">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.entries.map((row, i) => (
            <TableRow key={row.model}>
              <TableCell className="align-top font-medium">
                {row.model}
                {i === 0 ? (
                  <Badge className="ml-2 bg-primary text-primary-foreground" variant="secondary">
                    This work
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell className="align-top text-muted-foreground">
                {row.dataset}
              </TableCell>
              <TableCell className="align-top">{row.rmse}</TableCell>
              <TableCell className="align-top">{row.nasa_score}</TableCell>
              <TableCell className="align-top text-sm text-muted-foreground">
                {row.notes}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
